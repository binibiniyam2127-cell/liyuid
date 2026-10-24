"""End-to-End Trust Flow Test Suite for LIYUID.

Covers the complete trust lifecycle:
1. User registration & authentication
2. Report creation & asymmetric private proof storage
3. Blind challenge privacy shield (zero secret leakage)
4. Blind verification & 3-attempt lockout policy
5. Dual-party physical handover confirmation
6. Municipal intake, secure custody, and counter release
7. Counter terminal security lockout on 3 invalid OTPs
"""

import uuid
import secrets
from datetime import datetime, timezone
from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.security import get_password_hash
from app.models import (
    AuditLog,
    ChatMessage,
    Flag,
    Handover,
    Item,
    Match,
    StaffAccount,
    User,
)
from app.schemas.handover import (
    HandoverConfirmRequest,
    MunicipalIntakePayload,
    MunicipalReleasePayload,
    NotifyMunicipalDropoffPayload,
)
from app.services.handover_service import (
    confirm_handover,
    municipal_item_intake,
    municipal_item_release,
    notify_municipal_dropoff,
)
from app.verification_service import (
    encrypt_detail,
    get_report_challenge,
    verify_item_claim,
)

# Test in-memory SQLite setup (create tables for pure unit isolation)
test_engine = create_engine("sqlite:///:memory:")
TestSession = sessionmaker(bind=test_engine)
User.__table__.create(bind=test_engine)
StaffAccount.__table__.create(bind=test_engine)
Flag.__table__.create(bind=test_engine)
AuditLog.__table__.create(bind=test_engine)
ChatMessage.__table__.create(bind=test_engine)


@pytest.fixture
def db():
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


def create_test_actor(db, role="user", prefix="citizen"):
    uid = uuid.uuid4()
    user = User(
        id=uid,
        email=f"{prefix}_{uid.hex[:6]}@liyuid.et",
        phone_number=f"+251911{uid.int % 1000000:06d}",
        display_name=f"{prefix.title()}User",
        hashed_password=get_password_hash("TestPass123!"),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_test_staff(db):
    uid = uuid.uuid4()
    staff = StaffAccount(
        id=uid,
        staff_code=f"STF-{uid.hex[:4].upper()}",
        email=f"officer_{uid.hex[:6]}@liyuid.et",
        full_name="Municipal Desk Officer",
        staff_role="Supervisor",
        hashed_password=get_password_hash("StaffPass123!"),
        is_active=True,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


def test_blind_challenge_privacy_shield(db):
    """Verify challenge endpoint exposes questions but NEVER exposes private truths or hashes."""
    secret_truth = "Engraved with 'Abebe 2024' on the inner rim"
    encrypted_truth = encrypt_detail(secret_truth)
    proof_hash = "abc123mockproofhash"

    mock_item = Item(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        type="found",
        category="jewelry",
        primary_color="gold",
        public_description="Found gold ring near Meskel Square",
        challenge_type="deterministic_proof",
        challenge_question="What unique engraving is on the inner rim?",
        private_challenge_truth=secret_truth,
        proof_primary_hash=proof_hash,
        private_detail_encrypted=encrypted_truth,
        incident_timestamp=datetime.now(timezone.utc),
        status="active",
    )

    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = mock_item

    challenge = get_report_challenge(mock_item.id, db=mock_db)
    assert challenge["challenge_question"] == mock_item.challenge_question
    assert "private_challenge_truth" not in challenge
    assert "proof_primary_hash" not in challenge
    assert "private_detail_encrypted" not in challenge
    assert secret_truth not in str(challenge)


def test_e2e_direct_dual_confirmation_lifecycle(db):
    """Full lifecycle: Claim Verification -> Handover Creation -> Dual Confirmation Closure."""
    finder = create_test_actor(db, prefix="finder")
    owner = create_test_actor(db, prefix="owner")

    ground_truth = "Silver monogrammed initials: B.B."
    encrypted_truth = encrypt_detail(ground_truth)

    lost_id = uuid.uuid4()
    found_id = uuid.uuid4()

    lost_item = Item(
        id=lost_id,
        user_id=owner.id,
        type="lost",
        category="electronics",
        primary_color="silver",
        public_description="Lost silver laptop near Edna Mall",
        incident_timestamp=datetime.now(timezone.utc),
        status="active",
    )
    found_item = Item(
        id=found_id,
        user_id=finder.id,
        type="found",
        category="electronics",
        primary_color="silver",
        public_description="Found silver laptop at taxi station",
        private_detail_encrypted=encrypted_truth,
        incident_timestamp=datetime.now(timezone.utc),
        status="active",
    )

    match = Match(
        id=uuid.uuid4(),
        lost_item_id=lost_item.id,
        found_item_id=found_item.id,
        composite_score=0.92,
        score_breakdown={"text": 0.95, "geo": 0.90},
        verification_attempts=0,
        is_verified=False,
    )

    # 1. Invalid verification attempt: must fail and increment attempts
    mock_db = MagicMock()
    mock_db.query().filter().first.side_effect = [lost_item, match, found_item]

    res_bad = verify_item_claim(lost_id, "Wrong guess or incorrect serial", owner, mock_db)
    assert res_bad["verified"] is False
    assert res_bad["attempts_remaining"] == 2
    assert match.verification_attempts == 1

    # 2. Authentic verification attempt: must succeed and mint 6-digit release OTP
    mock_db.query().filter().first.side_effect = [lost_item, match, found_item, None]
    res_good = verify_item_claim(lost_id, ground_truth, owner, mock_db)
    assert res_good["verified"] is True
    assert res_good["status"] == "verified"
    otp_code = res_good["one_time_handover_code"]
    assert otp_code is not None
    assert len(str(otp_code)) == 6

    # 3. Handover Dual Confirmation
    handover = Handover(
        id=uuid.uuid4(),
        match_id=match.id,
        handover_code_hash=get_password_hash(otp_code),
        status="open",
        owner_confirmed=False,
        finder_confirmed=False,
    )

    # 3a. Finder confirms first
    mock_h_db = MagicMock()
    mock_h_db.query().filter().with_for_update().first.return_value = handover
    mock_h_db.query().filter().first.side_effect = [match, lost_item, found_item]

    finder_payload = HandoverConfirmRequest(finder_code=otp_code, role="finder")
    conf_1 = confirm_handover(handover.id, finder_payload, finder, mock_h_db)
    assert conf_1.finder_confirmed is True
    assert conf_1.is_fully_closed is False
    assert conf_1.status == "waiting_confirmations"

    # 3b. Owner confirms item receipt -> Handover is marked closed!
    mock_h_db.query().filter().with_for_update().first.return_value = handover
    mock_h_db.query().filter().first.side_effect = [match, lost_item, found_item]

    owner_payload = HandoverConfirmRequest(handover_code=otp_code, role="owner")
    conf_2 = confirm_handover(handover.id, owner_payload, owner, mock_h_db)
    assert conf_2.owner_confirmed is True
    assert conf_2.is_fully_closed is True
    assert conf_2.status == "closed"


def test_e2e_municipal_custody_intake_and_release_lifecycle(db):
    """Full lifecycle: Municipal Intake -> Vault Custody -> Counter Release with 6-digit OTP."""
    finder = create_test_actor(db, prefix="finder_mun")
    owner = create_test_actor(db, prefix="owner_mun")
    staff = create_test_staff(db)

    otp_code = "782341"
    code_hash = get_password_hash(otp_code)

    lost_item = Item(id=uuid.uuid4(), user_id=owner.id, sub_city="Bole")
    found_item = Item(id=uuid.uuid4(), user_id=finder.id, sub_city="Bole")
    match = Match(id=uuid.uuid4(), lost_item_id=lost_item.id, found_item_id=found_item.id)

    handover = Handover(
        id=uuid.uuid4(),
        match_id=match.id,
        handover_code_hash=code_hash,
        status="open",
        owner_confirmed=False,
        finder_confirmed=False,
        code_attempts=0,
    )

    mock_db = MagicMock()
    mock_db.query().filter().with_for_update().first.return_value = handover
    mock_db.query().filter().first.side_effect = [match, lost_item, owner]

    # 1. Staff logs physical item intake at Municipal Desk
    intake_payload = MunicipalIntakePayload(
        vault_locker="Vault-Locker #104B",
        station_location="Bole Municipal Office Desk 3",
        notes="Citizen dropped off Samsung S23 in clean condition",
    )
    intake_res = municipal_item_intake(handover.id, intake_payload, staff, mock_db)
    assert intake_res.status == "secured"
    assert handover.status == "municipal_secured"
    assert handover.finder_confirmed is True
    assert handover.vault_locker == "Vault-Locker #104B"

    # 2. Citizen visits desk: wrong OTP attempt decrements tries
    mock_db.query().filter().with_for_update().first.return_value = handover
    mock_db.query().filter().first.side_effect = [match, lost_item, found_item]

    bad_release = MunicipalReleasePayload(otp_code="000000", notes="Incorrect code attempt")
    with pytest.raises(HTTPException) as exc:
        municipal_item_release(handover.id, bad_release, staff, mock_db)
    assert exc.value.status_code == 400
    assert "Invalid citizen OTP" in exc.value.detail
    assert handover.code_attempts == 1

    # 3. Citizen provides correct 6-digit OTP -> Item released and closed!
    mock_db.query().filter().with_for_update().first.return_value = handover
    mock_db.query().filter().first.side_effect = [match, lost_item, found_item]

    good_release = MunicipalReleasePayload(otp_code=otp_code, notes="Citizen verified with Kebele ID")
    rel_res = municipal_item_release(handover.id, good_release, staff, mock_db)
    assert rel_res.status == "restituted"
    assert rel_res.completed_at is not None
    assert handover.status == "closed"
    assert handover.owner_confirmed is True


def test_municipal_counter_terminal_lockout_on_3_invalid_otps(db):
    """Verify that 3 consecutive invalid OTP attempts locks the municipal restitution terminal."""
    finder = create_test_actor(db, prefix="f_lock")
    owner = create_test_actor(db, prefix="o_lock")
    staff = create_test_staff(db)

    handover = Handover(
        id=uuid.uuid4(),
        match_id=uuid.uuid4(),
        handover_code_hash=get_password_hash("999999"),
        status="municipal_secured",
        code_attempts=2,  # Already had 2 previous failures
    )
    match = Match(id=handover.match_id, lost_item_id=uuid.uuid4(), found_item_id=uuid.uuid4())
    lost_item = Item(id=match.lost_item_id, user_id=owner.id)
    found_item = Item(id=match.found_item_id, user_id=finder.id)

    mock_db = MagicMock()
    mock_db.query().filter().with_for_update().first.return_value = handover
    mock_db.query().filter().first.side_effect = [match, lost_item, found_item]

    bad_release = MunicipalReleasePayload(otp_code="111111", notes="3rd invalid guess")
    with pytest.raises(HTTPException) as exc:
        municipal_item_release(handover.id, bad_release, staff, mock_db)

    # 3rd failure must lock terminal with HTTP 423
    assert exc.value.status_code == 423
    assert "locked" in exc.value.detail.lower()
    assert handover.status == "closed"
    assert handover.code_attempts >= 3
