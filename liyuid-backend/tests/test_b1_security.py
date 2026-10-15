import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import pytest
from geoalchemy2.elements import WKTElement

from app.models import Item, Match, User


def create_mock_point():
    return WKTElement("POINT(38.7865 8.9982)", srid=4326)


# --------------------------------------------------------------------------
# 1. Admin Endpoints RBAC Test (Rule 1)
# --------------------------------------------------------------------------
def test_admin_endpoints_require_admin_role(client, user_auth_headers, admin_auth_headers):
    # Non-admin user receives 403 Forbidden
    res_logs = client.get("/admin/audit-logs", headers=user_auth_headers)
    assert res_logs.status_code == 403
    assert "administrative privileges required" in res_logs.json()["detail"].lower()

    dummy_item_id = uuid.uuid4()
    res_dispute = client.post(
        f"/admin/disputes/{dummy_item_id}/resolve",
        json={"new_status": "active", "resolution_notes": "test note"},
        headers=user_auth_headers,
    )
    assert res_dispute.status_code == 403

    # Admin user receives 200 OK
    res_admin_logs = client.get("/admin/audit-logs", headers=admin_auth_headers)
    assert res_admin_logs.status_code == 200
    assert isinstance(res_admin_logs.json(), list)


# --------------------------------------------------------------------------
# 2. Non-ASCII / Amharic Unicode NFC Verification (Rule 2)
# --------------------------------------------------------------------------
def test_amharic_unicode_verification_nfc(client, db_session, normal_user, finder_user, user_auth_headers):
    lost_item = Item(
        id=uuid.uuid4(),
        user_id=normal_user.id,
        type="lost",
        category="phone",
        primary_color="black",
        public_description="Samsung phone lost near Stadium",
        location=create_mock_point(),
        incident_timestamp=datetime.now(timezone.utc),
        status="active",
    )
    found_item = Item(
        id=uuid.uuid4(),
        user_id=finder_user.id,
        type="found",
        category="phone",
        primary_color="black",
        public_description="Samsung phone found near Stadium",
        private_challenge_truth="የአንበሳ ምስል ያለበት ሰማያዊ ከቨር",  # Amharic answer
        location=create_mock_point(),
        incident_timestamp=datetime.now(timezone.utc),
        status="active",
    )
    db_session.add_all([lost_item, found_item])
    db_session.commit()

    match_record = Match(
        id=uuid.uuid4(),
        lost_item_id=lost_item.id,
        found_item_id=found_item.id,
        composite_score=0.95,
        score_breakdown={"semantic": 0.95},
        verification_attempts=0,
        is_verified=False,
        is_locked=False,
    )
    db_session.add(match_record)
    db_session.commit()

    # Exact matching Amharic answer without triggering 500 TypeError
    payload = {"challenge_attempt": "የአንበሳ ምስል ያለበት ሰማያዊ ከቨር"}
    res = client.post(
        f"/reports/{found_item.id}/verify-claim",
        json=payload,
        headers=user_auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["verified"] is True
    assert data["status"] == "verified"
    assert data["one_time_handover_code"] is not None


# --------------------------------------------------------------------------
# 3. No Self-Match & Real Match Requirement (Rule 3)
# --------------------------------------------------------------------------
def test_cannot_claim_without_valid_match_or_self_claim(client, db_session, normal_user, finder_user, user_auth_headers):
    # Case A: Trying to claim without any match record linking user's lost item
    found_item = Item(
        id=uuid.uuid4(),
        user_id=finder_user.id,
        type="found",
        category="wallet",
        primary_color="brown",
        public_description="Brown leather wallet",
        private_challenge_truth="100 Birr inside",
        location=create_mock_point(),
        incident_timestamp=datetime.now(timezone.utc),
        status="active",
    )
    db_session.add(found_item)
    db_session.commit()

    res = client.post(
        f"/reports/{found_item.id}/verify-claim",
        json={"challenge_attempt": "100 Birr inside"},
        headers=user_auth_headers,
    )
    assert res.status_code == 404

    # Case B: Finder attempting to claim their own found item
    own_found_item = Item(
        id=uuid.uuid4(),
        user_id=normal_user.id,
        type="found",
        category="keys",
        primary_color="silver",
        public_description="Toyota keys",
        private_challenge_truth="Blue ribbon",
        location=create_mock_point(),
        incident_timestamp=datetime.now(timezone.utc),
        status="active",
    )
    db_session.add(own_found_item)
    db_session.commit()

    res_self = client.post(
        f"/reports/{own_found_item.id}/verify-claim",
        json={"challenge_attempt": "Blue ribbon"},
        headers=user_auth_headers,
    )
    assert res_self.status_code == 400
    assert "Cannot claim an item you reported as found" in res_self.json()["detail"]


# --------------------------------------------------------------------------
# 4 & 5. Lockout Scope & 3-Attempt Limit (Rules 4 and 5)
# --------------------------------------------------------------------------
def test_three_failed_attempts_locks_match_only(client, db_session, normal_user, finder_user, user_auth_headers):
    lost_item = Item(
        id=uuid.uuid4(),
        user_id=normal_user.id,
        type="lost",
        category="bag",
        primary_color="blue",
        public_description="Blue backpack",
        location=create_mock_point(),
        incident_timestamp=datetime.now(timezone.utc),
        status="active",
    )
    found_item = Item(
        id=uuid.uuid4(),
        user_id=finder_user.id,
        type="found",
        category="bag",
        primary_color="blue",
        public_description="Blue backpack found",
        private_challenge_truth="contains red umbrella",
        location=create_mock_point(),
        incident_timestamp=datetime.now(timezone.utc),
        status="active",
    )
    db_session.add_all([lost_item, found_item])
    db_session.commit()

    match_record = Match(
        id=uuid.uuid4(),
        lost_item_id=lost_item.id,
        found_item_id=found_item.id,
        composite_score=0.90,
        score_breakdown={"semantic": 0.90},
        verification_attempts=0,
        is_verified=False,
        is_locked=False,
    )
    db_session.add(match_record)
    db_session.commit()

    # Attempt 1 (Wrong)
    r1 = client.post(
        f"/reports/{found_item.id}/verify-claim",
        json={"challenge_attempt": "wrong guess 1"},
        headers=user_auth_headers,
    )
    assert r1.status_code == 200
    assert r1.json()["verified"] is False
    assert r1.json()["attempts_remaining"] == 2

    # Attempt 2 (Wrong)
    r2 = client.post(
        f"/reports/{found_item.id}/verify-claim",
        json={"challenge_attempt": "wrong guess 2"},
        headers=user_auth_headers,
    )
    assert r2.status_code == 200
    assert r2.json()["attempts_remaining"] == 1

    # Attempt 3 (Wrong) -> triggers HTTP 423 Locked
    r3 = client.post(
        f"/reports/{found_item.id}/verify-claim",
        json={"challenge_attempt": "wrong guess 3"},
        headers=user_auth_headers,
    )
    assert r3.status_code == 423
    assert "Verification locked" in r3.json()["detail"]

    # Verify database state: Match is locked, but found item status is STILL active
    db_session.refresh(match_record)
    db_session.refresh(found_item)
    assert match_record.is_locked is True
    assert match_record.verification_attempts == 3
    assert found_item.status == "active"