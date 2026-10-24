"""Verification State Machine for LIYUID Trust Engine.

Guarantees:
1. Strict, non-bypassable sequential verification states:
   INITIAL -> PHOTO_PENDING -> PROOF_PENDING -> QUESTION_PENDING -> VERIFIED
   Any step can transition to LOCKED (exceeded attempts) or REVIEW_REQUESTED (user appeals).
2. Row-level concurrency locks (SELECT FOR UPDATE) to prevent race conditions.
3. Centralized attempt counters, cooldown calculation, and lockout policy.
4. Tamper-evident audit logging for every state transition and administrative override.
"""

from datetime import datetime, timedelta, timezone
from enum import Enum
import logging
from typing import Optional, Tuple
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.audit import log_audit_event
from app.models import Flag, Handover, Item, Match, User

logger = logging.getLogger("liyuid.verification.statemachine")

MAX_PROOF_ATTEMPTS = 3
MAX_QUESTION_ATTEMPTS = 3
COOLDOWN_SECONDS_AFTER_FAIL = 300  # 5 minutes


class VerificationState(str, Enum):
    INITIAL = "initial"
    PHOTO_PENDING = "photo"
    PROOF_PENDING = "proof"
    QUESTION_PENDING = "question"
    VERIFIED = "passed"
    LOCKED = "locked"
    REVIEW_REQUESTED = "review_requested"


class VerificationStateMachine:
    """Manages state transitions and concurrency locks for item match verification."""

    @staticmethod
    def get_current_state(match: Match) -> VerificationState:
        """Derives the current explicit state of the match."""
        now = datetime.now(timezone.utc)
        if match.is_locked or match.lock_state == "locked":
            return VerificationState.LOCKED
        if match.lock_state == "review_requested":
            return VerificationState.REVIEW_REQUESTED
        if match.is_verified or (match.proof_passed and match.question_passed):
            return VerificationState.VERIFIED
        if match.photo_result == "none":
            return VerificationState.PHOTO_PENDING
        if not match.proof_passed:
            return VerificationState.PROOF_PENDING
        return VerificationState.QUESTION_PENDING

    @staticmethod
    def acquire_locked_match(
        match_id: uuid.UUID,
        user_id: uuid.UUID,
        db: Session,
        allow_staff_override: bool = False,
    ) -> Tuple[Match, Item, Item]:
        """Locks match row with SELECT FOR UPDATE and verifies ownership/privileges."""
        match = db.query(Match).filter(Match.id == match_id).with_for_update().first()
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Match record '{match_id}' not found.",
            )

        lost_item = db.query(Item).filter(Item.id == match.lost_item_id).first()
        found_item = db.query(Item).filter(Item.id == match.found_item_id).first()

        if not lost_item or not found_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated items for this match could not be found.",
            )

        if not allow_staff_override and lost_item.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the registered owner of this lost item can perform verification.",
            )

        return match, lost_item, found_item

    @staticmethod
    def check_preconditions(match: Match, required_state: VerificationState) -> None:
        """Validates that match is ready for the requested transition, enforcing lockouts & cooldowns."""
        current_state = VerificationStateMachine.get_current_state(match)

        # 1. Lockout check
        if current_state == VerificationState.LOCKED:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Verification locked: Exceeded maximum allowed attempts. Flagged for administrative review.",
            )

        # 2. Review requested check
        if current_state == VerificationState.REVIEW_REQUESTED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Verification is paused pending administrative dispute review.",
            )

        # 3. Already verified check
        if current_state == VerificationState.VERIFIED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item ownership is already verified for this match.",
            )

        # 4. Cooldown check
        now = datetime.now(timezone.utc)
        if match.cooldown_until and match.cooldown_until > now:
            remaining_seconds = int((match.cooldown_until - now).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many rapid attempts. Cooldown active for {remaining_seconds} more seconds.",
            )

        # 5. Sequential progression check
        if current_state != required_state:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot execute '{required_state.value}' verification in current state '{current_state.value}'.",
            )

    @staticmethod
    def record_proof_attempt_result(
        match: Match,
        lost_item: Item,
        is_success: bool,
        db: Session,
        actor_id: uuid.UUID,
    ) -> VerificationState:
        """Transitions match after proof verification attempt."""
        now = datetime.now(timezone.utc)

        if is_success:
            match.proof_passed = True
            match.cooldown_until = None
            log_audit_event(
                db,
                entity_type="match",
                entity_id=match.id,
                action="verification_proof_passed",
                severity="info",
                actor_id=actor_id,
                details={"proof_attempts": match.proof_attempts},
            )
            db.commit()
            return VerificationState.QUESTION_PENDING

        match.proof_attempts += 1
        if match.proof_attempts >= MAX_PROOF_ATTEMPTS:
            match.is_locked = True
            match.lock_state = "locked"
            # Create automated system flag for staff review
            flag = Flag(
                id=uuid.uuid4(),
                target_entity="match",
                entity_id=match.id,
                reason=f"Verification locked: {match.proof_attempts} failed proof attempts.",
                status="pending",
            )
            db.add(flag)
            log_audit_event(
                db,
                entity_type="match",
                entity_id=match.id,
                action="match_locked_proof",
                severity="warning",
                actor_id=actor_id,
                details={"failed_attempts": match.proof_attempts},
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Verification locked: Exceeded maximum allowed attempts (3). Flagged for administrative review.",
            )

        # Set temporary cooldown after 2nd failure
        if match.proof_attempts >= 2:
            match.cooldown_until = now + timedelta(seconds=COOLDOWN_SECONDS_AFTER_FAIL)

        log_audit_event(
            db,
            entity_type="match",
            entity_id=match.id,
            action="verification_proof_failed",
            severity="warning",
            actor_id=actor_id,
            details={"attempt": match.proof_attempts, "remaining": MAX_PROOF_ATTEMPTS - match.proof_attempts},
        )
        db.commit()
        return VerificationState.PROOF_PENDING

    @staticmethod
    def record_question_attempt_result(
        match: Match,
        is_success: bool,
        db: Session,
        actor_id: uuid.UUID,
    ) -> VerificationState:
        """Transitions match after question challenge attempt."""
        now = datetime.now(timezone.utc)

        if is_success:
            match.question_passed = True
            match.is_verified = True
            match.lock_state = "none"
            match.cooldown_until = None
            log_audit_event(
                db,
                entity_type="match",
                entity_id=match.id,
                action="verification_question_passed",
                severity="info",
                actor_id=actor_id,
                details={"question_attempts": match.question_attempts},
            )
            db.commit()
            return VerificationState.VERIFIED

        match.question_attempts += 1
        if match.question_attempts >= MAX_QUESTION_ATTEMPTS:
            match.is_locked = True
            match.lock_state = "locked"
            flag = Flag(
                id=uuid.uuid4(),
                target_entity="match",
                entity_id=match.id,
                reason=f"Verification locked: {match.question_attempts} failed question attempts.",
                status="pending",
            )
            db.add(flag)
            log_audit_event(
                db,
                entity_type="match",
                entity_id=match.id,
                action="match_locked_question",
                severity="warning",
                actor_id=actor_id,
                details={"failed_attempts": match.question_attempts},
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Verification locked: Exceeded maximum allowed attempts (3). Flagged for administrative review.",
            )

        if match.question_attempts >= 2:
            match.cooldown_until = now + timedelta(seconds=COOLDOWN_SECONDS_AFTER_FAIL)

        log_audit_event(
            db,
            entity_type="match",
            entity_id=match.id,
            action="verification_question_failed",
            severity="warning",
            actor_id=actor_id,
            details={"attempt": match.question_attempts, "remaining": MAX_QUESTION_ATTEMPTS - match.question_attempts},
        )
        db.commit()
        return VerificationState.QUESTION_PENDING

    @staticmethod
    def request_review(
        match: Match,
        reason: str,
        db: Session,
        actor_id: uuid.UUID,
    ) -> VerificationState:
        """Transitions match to REVIEW_REQUESTED with a pending Flag."""
        match.lock_state = "review_requested"
        flag = Flag(
            id=uuid.uuid4(),
            target_entity="match",
            entity_id=match.id,
            flagged_by_id=actor_id,
            reason=f"User dispute / appeal: {reason}",
            status="pending",
        )
        db.add(flag)
        log_audit_event(
            db,
            entity_type="match",
            entity_id=match.id,
            action="verification_review_requested",
            severity="info",
            actor_id=actor_id,
            details={"reason": reason},
        )
        db.commit()
        return VerificationState.REVIEW_REQUESTED

    @staticmethod
    def staff_override_reset(
        match: Match,
        staff_user: User,
        action: str,
        notes: Optional[str],
        db: Session,
    ) -> VerificationState:
        """Privileged staff override to unlock or reset a blocked verification."""
        if action == "allow_retry":
            match.is_locked = False
            match.lock_state = "none"
            match.proof_attempts = 0
            match.question_attempts = 0
            match.cooldown_until = None
            new_state = VerificationState.PROOF_PENDING
        elif action == "block":
            match.is_locked = True
            match.lock_state = "locked"
            new_state = VerificationState.LOCKED
        elif action == "dismiss":
            match.lock_state = "none"
            new_state = VerificationStateMachine.get_current_state(match)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported staff override action: '{action}'",
            )

        log_audit_event(
            db,
            entity_type="match",
            entity_id=match.id,
            action=f"staff_verification_override_{action}",
            severity="warning",
            actor_id=staff_user.id,
            details={"action": action, "notes": notes, "new_state": new_state.value},
        )
        db.commit()
        return new_state

