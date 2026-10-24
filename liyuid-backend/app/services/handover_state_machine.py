"""Handover State Machine for LIYUID Restitution Lifecycle.

Guarantees:
1. Standardized lifecycle states:
   OPEN -> WAITING_CONFIRMATIONS -> CLOSED
   OPEN -> MUNICIPAL_SECURED -> CLOSED
   Any active state can transition to EXPIRED (time window passed) or LOCKED (exceeded bad code attempts).
2. Exactly ONE active handover record permitted per match (duplicate prevention).
3. Concurrency protections: row-level locking (SELECT FOR UPDATE) on confirmation and intake/release.
4. Idempotent completion: calling confirm on already-closed handovers returns safe status without re-triggering.
5. Strict party authorization (Finder vs Owner vs Municipal Officer).
6. Comprehensive immutable audit logging on every transition.
"""

from datetime import datetime, timezone
from enum import Enum
import logging
from typing import Optional, Tuple
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.audit import log_audit_event
from app.core.security import verify_password
from app.models import Flag, Handover, Item, Match, User

logger = logging.getLogger("liyuid.handover.statemachine")

MAX_CODE_ATTEMPTS = 3


class HandoverState(str, Enum):
    OPEN = "open"
    WAITING_CONFIRMATIONS = "waiting_confirmations"
    MUNICIPAL_SECURED = "municipal_secured"
    EXPIRED = "expired"
    CLOSED = "closed"
    LOCKED = "locked"


class HandoverStateMachine:
    """Orchestrates safe, idempotent, and auditable handover state transitions."""

    @staticmethod
    def acquire_locked_handover(
        handover_id: uuid.UUID,
        db: Session,
    ) -> Tuple[Handover, Match, Optional[Item], Optional[Item]]:
        """Acquires handover row with SELECT FOR UPDATE and retrieves related match and items."""
        handover = (
            db.query(Handover)
            .filter(Handover.id == handover_id)
            .with_for_update()
            .first()
        )
        if not handover:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Handover record '{handover_id}' not found.",
            )

        match = db.query(Match).filter(Match.id == handover.match_id).first()
        lost_item = db.query(Item).filter(Item.id == match.lost_item_id).first() if match else None
        found_item = db.query(Item).filter(Item.id == match.found_item_id).first() if match else None

        return handover, match, lost_item, found_item

    @staticmethod
    def ensure_single_active_handover(match_id: uuid.UUID, db: Session) -> Optional[Handover]:
        """Finds any existing active handover for this match to prevent duplicate records."""
        active_states = [
            HandoverState.OPEN.value,
            HandoverState.WAITING_CONFIRMATIONS.value,
            HandoverState.MUNICIPAL_SECURED.value,
        ]
        return (
            db.query(Handover)
            .filter(
                Handover.match_id == match_id,
                Handover.status.in_(active_states),
            )
            .first()
        )

    @staticmethod
    def check_active_status(handover: Handover) -> None:
        """Validates that handover is not expired, locked, or closed."""
        now = datetime.now(timezone.utc)

        # 1. Idempotency: Already closed handovers bypass checks cleanly
        if handover.status == HandoverState.CLOSED.value:
            return

        # 2. Lockout check
        if handover.status == HandoverState.LOCKED.value:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Handover is locked due to security policy violations. Staff adjudication required.",
            )

        # 3. Expiry check
        if handover.expires_at and handover.expires_at < now:
            handover.status = HandoverState.EXPIRED.value
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Handover verification code has expired. Request code regeneration.",
            )

    @staticmethod
    def record_code_attempt(
        handover: Handover,
        input_code: str,
        db: Session,
        actor_id: uuid.UUID,
    ) -> bool:
        """Validates a physical release code with attempt limits, locking on 3 failures."""
        normalized = input_code.strip()
        is_valid = (
            verify_password(normalized, handover.handover_code_hash)
            or verify_password(normalized.upper(), handover.handover_code_hash)
        )

        if is_valid:
            handover.code_attempts = 0
            log_audit_event(
                db,
                entity_type="handover",
                entity_id=handover.id,
                action="handover_code_verified",
                severity="info",
                actor_id=actor_id,
            )
            return True

        handover.code_attempts += 1
        if handover.code_attempts >= MAX_CODE_ATTEMPTS:
            handover.status = HandoverState.LOCKED.value
            flag = Flag(
                id=uuid.uuid4(),
                target_entity="handover",
                entity_id=handover.id,
                reason=f"Handover locked: {handover.code_attempts} consecutive invalid code attempts.",
                status="pending",
            )
            db.add(flag)
            log_audit_event(
                db,
                entity_type="handover",
                entity_id=handover.id,
                action="handover_locked_bad_codes",
                severity="warning",
                actor_id=actor_id,
                details={"failed_attempts": handover.code_attempts},
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Handover locked: Exceeded maximum allowed code verification attempts (3).",
            )

        log_audit_event(
            db,
            entity_type="handover",
            entity_id=handover.id,
            action="handover_code_attempt_failed",
            severity="warning",
            actor_id=actor_id,
            details={"attempt": handover.code_attempts, "remaining": MAX_CODE_ATTEMPTS - handover.code_attempts},
        )
        db.commit()
        return False

    @staticmethod
    def transition_confirmation(
        handover: Handover,
        is_owner: bool,
        is_finder: bool,
        db: Session,
        actor_id: uuid.UUID,
    ) -> Handover:
        """Applies dual confirmation rules and idempotently transitions to CLOSED when both parties confirm."""
        # Idempotent short-circuit
        if handover.status == HandoverState.CLOSED.value:
            return handover

        now = datetime.now(timezone.utc)

        if is_owner:
            handover.owner_confirmed = True
        if is_finder:
            handover.finder_confirmed = True

        old_state = handover.status
        if handover.owner_confirmed and handover.finder_confirmed:
            handover.status = HandoverState.CLOSED.value
            handover.completed_at = now
            new_state = HandoverState.CLOSED.value
        else:
            handover.status = HandoverState.WAITING_CONFIRMATIONS.value
            new_state = HandoverState.WAITING_CONFIRMATIONS.value

        log_audit_event(
            db,
            entity_type="handover",
            entity_id=handover.id,
            action="handover_state_transition",
            severity="info",
            actor_id=actor_id,
            details={
                "from_state": old_state,
                "to_state": new_state,
                "owner_confirmed": handover.owner_confirmed,
                "finder_confirmed": handover.finder_confirmed,
            },
        )
        db.commit()
        db.refresh(handover)
        return handover

    @staticmethod
    def transition_municipal_intake(
        handover: Handover,
        vault_locker: str,
        station_location: str,
        db: Session,
        actor_id: uuid.UUID,
    ) -> Handover:
        """Transitions handover to MUNICIPAL_SECURED upon municipal officer intake."""
        handover.status = HandoverState.MUNICIPAL_SECURED.value
        handover.venue = "municipal"
        handover.vault_locker = vault_locker
        handover.station_location = station_location
        handover.finder_confirmed = True  # Finder handed over physical custody

        log_audit_event(
            db,
            entity_type="handover",
            entity_id=handover.id,
            action="handover_municipal_intake",
            severity="info",
            actor_id=actor_id,
            details={"vault_locker": vault_locker, "station_location": station_location},
        )
        db.commit()
        db.refresh(handover)
        return handover

    @staticmethod
    def transition_municipal_release(
        handover: Handover,
        db: Session,
        actor_id: uuid.UUID,
    ) -> Handover:
        """Transitions handover to CLOSED upon municipal officer OTP release to owner."""
        now = datetime.now(timezone.utc)
        handover.status = HandoverState.CLOSED.value
        handover.owner_confirmed = True
        handover.finder_confirmed = True
        handover.completed_at = now

        log_audit_event(
            db,
            entity_type="handover",
            entity_id=handover.id,
            action="handover_municipal_release_closed",
            severity="info",
            actor_id=actor_id,
            details={"completed_at": now.isoformat()},
        )
        db.commit()
        db.refresh(handover)
        return handover
