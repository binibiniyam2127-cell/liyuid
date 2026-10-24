"""Unit Tests for Verification & Handover State Machines (Trust Engine)."""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException

from app.models import Handover, Item, Match, User
from app.services.handover_state_machine import HandoverState, HandoverStateMachine
from app.services.verification_state_machine import (
    VerificationState,
    VerificationStateMachine,
)


def create_mock_match(
    photo_result="none",
    proof_passed=False,
    question_passed=False,
    proof_attempts=0,
    question_attempts=0,
    is_locked=False,
    lock_state="none",
    cooldown_until=None,
):
    match = Match(
        id=uuid.uuid4(),
        lost_item_id=uuid.uuid4(),
        found_item_id=uuid.uuid4(),
        composite_score=0.90,
        score_breakdown={"test": 1.0},
        photo_result=photo_result,
        proof_passed=proof_passed,
        question_passed=question_passed,
        proof_attempts=proof_attempts,
        question_attempts=question_attempts,
        is_locked=is_locked,
        lock_state=lock_state,
        cooldown_until=cooldown_until,
    )
    return match


# ============================================================================
# Verification State Machine Tests
# ============================================================================
def test_verification_state_derivation():
    # 1. Initial / Photo pending
    m1 = create_mock_match(photo_result="none")
    assert VerificationStateMachine.get_current_state(m1) == VerificationState.PHOTO_PENDING

    # 2. Proof pending
    m2 = create_mock_match(photo_result="strong", proof_passed=False)
    assert VerificationStateMachine.get_current_state(m2) == VerificationState.PROOF_PENDING

    # 3. Question pending
    m3 = create_mock_match(photo_result="strong", proof_passed=True, question_passed=False)
    assert VerificationStateMachine.get_current_state(m3) == VerificationState.QUESTION_PENDING

    # 4. Verified
    m4 = create_mock_match(photo_result="strong", proof_passed=True, question_passed=True)
    assert VerificationStateMachine.get_current_state(m4) == VerificationState.VERIFIED

    # 5. Locked
    m5 = create_mock_match(is_locked=True)
    assert VerificationStateMachine.get_current_state(m5) == VerificationState.LOCKED

    # 6. Review requested
    m6 = create_mock_match(lock_state="review_requested")
    assert VerificationStateMachine.get_current_state(m6) == VerificationState.REVIEW_REQUESTED


def test_verification_preconditions_prevent_impossible_transitions():
    m = create_mock_match(photo_result="none")
    # Trying to jump directly to question when in photo state must raise 400
    with pytest.raises(HTTPException) as exc:
        VerificationStateMachine.check_preconditions(m, VerificationState.QUESTION_PENDING)
    assert exc.value.status_code == 400
    assert "Cannot execute 'question' verification in current state 'photo'" in exc.value.detail


def test_verification_lockout_enforced():
    m_locked = create_mock_match(is_locked=True)
    with pytest.raises(HTTPException) as exc:
        VerificationStateMachine.check_preconditions(m_locked, VerificationState.PHOTO_PENDING)
    assert exc.value.status_code == 423
    assert "Verification locked" in exc.value.detail


def test_verification_cooldown_enforced():
    future = datetime.now(timezone.utc) + timedelta(minutes=5)
    m_cd = create_mock_match(photo_result="strong", cooldown_until=future)
    with pytest.raises(HTTPException) as exc:
        VerificationStateMachine.check_preconditions(m_cd, VerificationState.PROOF_PENDING)
    assert exc.value.status_code == 429
    assert "Cooldown active" in exc.value.detail


def test_verification_proof_lockout_on_third_failure():
    mock_db = MagicMock()
    lost_item = Item(id=uuid.uuid4(), user_id=uuid.uuid4())
    m = create_mock_match(photo_result="strong", proof_attempts=2)

    # 3rd failure triggers 423 Locked
    with pytest.raises(HTTPException) as exc:
        VerificationStateMachine.record_proof_attempt_result(
            match=m,
            lost_item=lost_item,
            is_success=False,
            db=mock_db,
            actor_id=lost_item.user_id,
        )
    assert exc.value.status_code == 423
    assert m.is_locked is True
    assert m.lock_state == "locked"


def test_verification_question_lockout_on_third_failure():
    mock_db = MagicMock()
    user_id = uuid.uuid4()
    m = create_mock_match(photo_result="strong", proof_passed=True, question_attempts=2)

    # 3rd failure triggers 423 Locked
    with pytest.raises(HTTPException) as exc:
        VerificationStateMachine.record_question_attempt_result(
            match=m,
            is_success=False,
            db=mock_db,
            actor_id=user_id,
        )
    assert exc.value.status_code == 423
    assert m.is_locked is True
    assert m.lock_state == "locked"


def test_verification_staff_override():
    mock_db = MagicMock()
    staff_user = User(id=uuid.uuid4(), role="staff")
    m = create_mock_match(is_locked=True, lock_state="locked", proof_attempts=3)

    new_state = VerificationStateMachine.staff_override_reset(
        match=m,
        staff_user=staff_user,
        action="allow_retry",
        notes="Identity verified at municipal counter",
        db=mock_db,
    )
    assert new_state == VerificationState.PROOF_PENDING
    assert m.is_locked is False
    assert m.lock_state == "none"
    assert m.proof_attempts == 0


# ============================================================================
# Handover State Machine Tests
# ============================================================================
def test_handover_dual_confirmation_progression():
    mock_db = MagicMock()
    user_id = uuid.uuid4()
    h = Handover(
        id=uuid.uuid4(),
        match_id=uuid.uuid4(),
        status="open",
        owner_confirmed=False,
        finder_confirmed=False,
    )

    # 1. Finder confirms first -> enters WAITING_CONFIRMATIONS
    h1 = HandoverStateMachine.transition_confirmation(
        handover=h,
        is_owner=False,
        is_finder=True,
        db=mock_db,
        actor_id=user_id,
    )
    assert h1.status == HandoverState.WAITING_CONFIRMATIONS.value
    assert h1.finder_confirmed is True
    assert h1.owner_confirmed is False

    # 2. Owner confirms -> transitions to CLOSED
    h2 = HandoverStateMachine.transition_confirmation(
        handover=h1,
        is_owner=True,
        is_finder=False,
        db=mock_db,
        actor_id=user_id,
    )
    assert h2.status == HandoverState.CLOSED.value
    assert h2.owner_confirmed is True
    assert h2.finder_confirmed is True
    assert h2.completed_at is not None


def test_handover_idempotency_when_already_closed():
    mock_db = MagicMock()
    user_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    h_closed = Handover(
        id=uuid.uuid4(),
        match_id=uuid.uuid4(),
        status="closed",
        owner_confirmed=True,
        finder_confirmed=True,
        completed_at=now,
    )

    # Re-confirming already closed handover is an idempotent no-op
    res = HandoverStateMachine.transition_confirmation(
        handover=h_closed,
        is_owner=True,
        is_finder=False,
        db=mock_db,
        actor_id=user_id,
    )
    assert res.status == "closed"
    assert res.completed_at == now


def test_handover_expiry_rejection():
    past = datetime.now(timezone.utc) - timedelta(hours=1)
    h_exp = Handover(
        id=uuid.uuid4(),
        match_id=uuid.uuid4(),
        status="open",
        expires_at=past,
    )
    with pytest.raises(HTTPException) as exc:
        HandoverStateMachine.check_active_status(h_exp)
    assert exc.value.status_code == 410
    assert "expired" in exc.value.detail
