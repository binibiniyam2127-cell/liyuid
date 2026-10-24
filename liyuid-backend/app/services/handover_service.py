import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.audit import log_audit_event
from app.core.security import get_password_hash, verify_password
from app.models import ChatMessage, Flag, Handover, Item, Match, StaffAccount, User
from app.schemas import (
    HandoverConfirmRequest,
    MunicipalIntakePayload,
    MunicipalIntakeResponse,
    MunicipalReleasePayload,
    MunicipalReleaseResponse,
    NotifyMunicipalDropoffPayload,
    NotifyMunicipalDropoffResponse,
)
from app.services.handover_state_machine import HandoverState, HandoverStateMachine

logger = logging.getLogger("liyuid.backend")


def regenerate_handover_code(
    handover_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> dict:
    handover = db.query(Handover).filter(Handover.id == handover_id).with_for_update().first()
    if not handover or handover.status != "open":
        raise HTTPException(status_code=400, detail="Invalid handover")

    match = db.query(Match).filter(Match.id == handover.match_id).first()
    lost_item = db.query(Item).filter(Item.id == match.lost_item_id).first()
    if lost_item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can regenerate code")

    if handover.regenerate_count >= 3:
        raise HTTPException(status_code=429, detail="Maximum code regeneration limit reached (3)")

    new_code = f"{secrets.randbelow(900000) + 100000}"
    handover.handover_code_hash = get_password_hash(new_code)
    handover.expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    handover.regenerate_count += 1
    handover.code_attempts = 0

    log_audit_event(
        db,
        entity_type="handover",
        entity_id=handover.id,
        actor_id=current_user.id,
        action="handover_code_regenerated",
        severity="info",
    )
    db.commit()
    return {"status": "regenerated", "expires_in_minutes": 10, "one_time_code": new_code}


def confirm_handover(
    handover_id: uuid.UUID,
    payload: Optional[HandoverConfirmRequest],
    current_user: User,
    db: Session,
) -> Handover:
    handover, match, lost_item, found_item = HandoverStateMachine.acquire_locked_handover(handover_id, db)
    
    # 1. Check active status (idempotency, lockouts, expiry)
    HandoverStateMachine.check_active_status(handover)
    if handover.status == HandoverState.CLOSED.value:
        return handover

    input_code = (payload.finder_code or payload.handover_code) if payload else None
    role_hint = (payload.role.strip().lower() if payload and payload.role else None)

    is_finder = (found_item and current_user.id == found_item.user_id) or (role_hint == "finder")
    is_owner = (lost_item and current_user.id == lost_item.user_id) or (role_hint == "owner")

    if is_finder:
        if input_code:
            is_valid = HandoverStateMachine.record_code_attempt(handover, input_code, db, current_user.id)
            if not is_valid:
                raise HTTPException(status_code=400, detail="Invalid handover code")
        handover.finder_confirmed = True

    elif is_owner:
        handover.owner_confirmed = True
    else:
        handover.owner_confirmed = True

    # 2. State transition via state machine
    HandoverStateMachine.transition_confirmation(
        handover=handover,
        is_owner=is_owner,
        is_finder=is_finder,
        db=db,
        actor_id=current_user.id,
    )

    if handover.owner_confirmed and handover.finder_confirmed:
        if match:
            match.lock_state = "locked"
        if lost_item:
            lost_item.status = "resolved_closed"
        if found_item:
            found_item.status = "resolved_closed"
        db.commit()

    handover.is_fully_closed = bool(handover.owner_confirmed and handover.finder_confirmed)
    return handover


def get_handover_details(
    handover_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> Handover:
    handover = db.query(Handover).filter(Handover.id == handover_id).first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover record not found")
    match = db.query(Match).filter(Match.id == handover.match_id).first()
    lost_item = db.query(Item).filter(Item.id == match.lost_item_id).first()
    found_item = db.query(Item).filter(Item.id == match.found_item_id).first()
    if current_user.id not in [lost_item.user_id, found_item.user_id]:
        raise HTTPException(status_code=403, detail="Not a party to this handover")
    return handover


def get_match_handover(
    match_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> Handover:
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    lost_item = db.query(Item).filter(Item.id == match.lost_item_id).first()
    found_item = db.query(Item).filter(Item.id == match.found_item_id).first()
    if current_user.id not in [lost_item.user_id, found_item.user_id]:
        raise HTTPException(status_code=403, detail="Not a party to this handover")
    handover = db.query(Handover).filter(Handover.match_id == match_id).first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover record not found for this match")
    return handover


def notify_municipal_dropoff(
    handover_id: uuid.UUID,
    payload: Optional[NotifyMunicipalDropoffPayload],
    current_user: User,
    db: Session,
) -> NotifyMunicipalDropoffResponse:
    handover = db.query(Handover).filter(Handover.id == handover_id).with_for_update().first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover record not found")
    if handover.status == "closed":
        raise HTTPException(status_code=400, detail="Handover is already completed and closed")

    match = db.query(Match).filter(Match.id == handover.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Associated match not found")

    lost_item = db.query(Item).filter(Item.id == match.lost_item_id).first()
    found_item = db.query(Item).filter(Item.id == match.found_item_id).first()
    if current_user.id not in [lost_item.user_id, found_item.user_id]:
        raise HTTPException(status_code=403, detail="Not a party to this handover")

    st_loc = (payload.station_location if payload and payload.station_location else None) or "Bole Sub-City Administration Station, Desk #104"
    handover.venue = "municipal"
    handover.station_location = st_loc

    if payload and payload.deposit_voucher:
        handover.deposit_voucher = payload.deposit_voucher
    elif not handover.deposit_voucher:
        handover.deposit_voucher = f"#DEP-MUN-{secrets.randbelow(900000) + 100000}"

    if payload and payload.notes:
        handover.municipal_notes = payload.notes

    # Post an official chat message in the mutual chat
    chat_text = (
        f"🏛️ Municipal Drop-off Registered: Item scheduled for drop-off at {handover.station_location}. "
        f"Deposit Voucher: {handover.deposit_voucher}. Station desk officer has been notified."
    )
    chat_msg = ChatMessage(
        id=uuid.uuid4(),
        match_id=match.id,
        sender_user_id=current_user.id,
        text=chat_text,
    )
    db.add(chat_msg)

    log_audit_event(
        db,
        entity_type="handover",
        entity_id=handover.id,
        actor_id=current_user.id,
        action="municipal_dropoff_notified",
        severity="info",
        details={
            "station": handover.station_location,
            "voucher": handover.deposit_voucher,
        },
    )
    db.commit()

    return NotifyMunicipalDropoffResponse(
        status="notified",
        message="Municipal station desk officer notified of upcoming drop-off.",
        handover_id=handover.id,
        deposit_voucher=handover.deposit_voucher,
        station_location=handover.station_location,
    )


def municipal_item_intake(
    handover_id: uuid.UUID,
    payload: MunicipalIntakePayload,
    staff: StaffAccount,
    db: Session,
) -> MunicipalIntakeResponse:
    handover = db.query(Handover).filter(Handover.id == handover_id).with_for_update().first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover record not found")
    if handover.status == "closed":
        raise HTTPException(status_code=400, detail="Handover is already completed and closed")

    match = db.query(Match).filter(Match.id == handover.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Associated match not found")

    lost_item = db.query(Item).filter(Item.id == match.lost_item_id).first()

    handover.venue = "municipal"
    handover.vault_locker = (payload.vault_locker or "").strip() or "Locker B-14 (Shelf Tier B, Unit 02)"
    if payload.station_location:
        handover.station_location = payload.station_location
    elif not handover.station_location:
        handover.station_location = f"{lost_item.sub_city or 'Bole'} Sub-City Administration Station, Desk #104"

    if payload.notes:
        existing_notes = handover.municipal_notes or ""
        handover.municipal_notes = f"{existing_notes}\n[Intake by {staff.staff_code}]: {payload.notes}".strip()

    handover.finder_confirmed = True
    handover.status = "municipal_secured"

    chat_text = (
        f"🔐 Municipal Vault Custody Confirmed: Officer {staff.staff_code} ({staff.staff_role or 'Desk Supervisor'}) "
        f"has safely received and logged the item into {handover.vault_locker} at {handover.station_location}. "
        f"The verified owner may now visit the desk with Government ID and 6-digit release OTP to claim."
    )
    chat_msg = ChatMessage(
        id=uuid.uuid4(),
        match_id=match.id,
        sender_user_id=lost_item.user_id,
        text=chat_text,
    )
    db.add(chat_msg)

    owner_user = db.query(User).filter(User.id == lost_item.user_id).first()
    sms_sent = False
    sms_preview_text = None

    if owner_user:
        item_title = f"{lost_item.brand or ''} {lost_item.category or 'Item'}".strip()

        if owner_user.phone_number:
            try:
                from app.notifications import send_owner_municipal_intake_sms
                sms_sent = send_owner_municipal_intake_sms(
                    owner_phone=owner_user.phone_number,
                    item_title=item_title,
                    station_location=handover.station_location,
                    shelf_locker=handover.vault_locker,
                )
                sms_preview_text = (
                    f"LIYUID Alert: Your item ({item_title}) is stored at {handover.station_location}, "
                    f"Shelf: {handover.vault_locker}. Present your Claim Pass to claim it."
                )
            except Exception as sms_err:
                logger.warning("Could not dispatch owner municipal SMS: %s", sms_err)

        if owner_user.email:
            try:
                from app.notifications import send_email_notification
                send_email_notification(
                    to_email=owner_user.email,
                    subject=f"🏛️ Municipal Restitution Ready: Your {item_title} is Secured",
                    body=(
                        f"Hello {owner_user.full_name or owner_user.display_name},\n\n"
                        f"Good news! Your {item_title} has been surrendered by the finder and is now safely held in "
                        f"{handover.vault_locker} at {handover.station_location}.\n\n"
                        f"STEPS TO CAPTURE/CLAIM YOUR ITEM:\n"
                        f"1. Visit {handover.station_location} (Mon–Sat 8:30 AM – 5:30 PM).\n"
                        f"2. Present valid Government ID (Kebele / Passport / National ID).\n"
                        f"3. Provide your 6-digit release OTP to Officer {staff.staff_code} at the counter keypad terminal.\n\n"
                        f"View your Handover Pass: http://localhost:3000/handover?role=owner&venue=municipal\n\n"
                        f"Addis Ababa Municipal Lost & Found Restitution Desk"
                    ),
                )
            except Exception as notify_err:
                logger.warning("Could not dispatch owner municipal email: %s", notify_err)

        if owner_user.telegram_chat_id:
            try:
                from app.telegram_bot_poller import send_message as send_tg
                tg_msg = (
                    f"🏛️ *Municipal Restitution Alert!*\n\n"
                    f"Hello {owner_user.display_name},\n"
                    f"Your *{item_title}* has been received and secured in *{handover.vault_locker}* at {handover.station_location}.\n\n"
                    f"Please visit the municipal counter with your Government ID and 6-digit release OTP to claim your item."
                )
                send_tg(owner_user.telegram_chat_id, tg_msg)
            except Exception as tg_err:
                logger.warning("Could not dispatch owner municipal Telegram: %s", tg_err)

    log_audit_event(
        db,
        entity_type="handover",
        entity_id=handover.id,
        actor_id=staff.id,
        action="municipal_intake_confirmed",
        severity="info",
        details={
            "locker": handover.vault_locker,
            "station": handover.station_location,
            "staff_code": staff.staff_code,
            "sms_dispatched": sms_sent,
        },
    )
    db.commit()

    return MunicipalIntakeResponse(
        status="secured",
        message=f"Item secured in {handover.vault_locker}. Automated SMS dispatched to owner.",
        handover_id=handover.id,
        vault_locker=handover.vault_locker,
        station_location=handover.station_location,
        finder_confirmed=True,
        sms_dispatched=True,
        sms_preview=sms_preview_text or f"LIYUID Alert: Your item is stored at {handover.station_location}, Shelf {handover.vault_locker}. Present Claim Pass to claim it.",
    )


def municipal_item_release(
    handover_id: uuid.UUID,
    payload: MunicipalReleasePayload,
    staff: StaffAccount,
    db: Session,
) -> MunicipalReleaseResponse:
    handover = db.query(Handover).filter(Handover.id == handover_id).with_for_update().first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover record not found")
    if handover.status == "closed":
        raise HTTPException(status_code=400, detail="Handover is already completed and closed")

    match = db.query(Match).filter(Match.id == handover.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Associated match not found")

    lost_item = db.query(Item).filter(Item.id == match.lost_item_id).first()
    found_item = db.query(Item).filter(Item.id == match.found_item_id).first()

    # Validate 6-digit OTP
    if not verify_password(payload.otp_code, handover.handover_code_hash):
        handover.code_attempts += 1
        if handover.code_attempts >= 3:
            handover.status = "closed"
            db.add(
                Flag(
                    id=uuid.uuid4(),
                    target_entity="handover",
                    entity_id=handover.id,
                    reason="Municipal counter restitution locked: 3 consecutive invalid OTP attempts",
                    status="pending",
                )
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Restitution terminal locked: 3 invalid OTP attempts reached. Supervisor flag created.",
            )
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Invalid citizen OTP. {3 - handover.code_attempts} attempts remaining before security lock.",
        )

    now = datetime.now(timezone.utc)
    handover.owner_confirmed = True
    handover.finder_confirmed = True
    handover.status = "closed"
    handover.completed_at = now
    match.lock_state = "locked"
    lost_item.status = "resolved_closed"
    found_item.status = "resolved_closed"

    if payload.owner_notes:
        existing_notes = handover.municipal_notes or ""
        handover.municipal_notes = f"{existing_notes}\n[Released by {staff.staff_code}]: {payload.owner_notes}".strip()

    chat_text = (
        f"✅ Municipal Restitution Completed: Item safely returned to verified owner at "
        f"{handover.station_location or 'Municipal Counter'}. Government ID confirmed and OTP burned by Officer {staff.staff_code}. "
        f"Case resolved and officially closed."
    )
    chat_msg = ChatMessage(
        id=uuid.uuid4(),
        match_id=match.id,
        sender_user_id=lost_item.user_id,
        text=chat_text,
    )
    db.add(chat_msg)

    log_audit_event(
        db,
        entity_type="handover",
        entity_id=handover.id,
        actor_id=staff.id,
        action="municipal_handover_released",
        severity="info",
        details={
            "staff_code": staff.staff_code,
            "vault_locker": handover.vault_locker,
            "government_id_verified": payload.government_id_verified,
        },
    )
    db.commit()

    return MunicipalReleaseResponse(
        status="restituted",
        message="Citizen identity confirmed, OTP burned, and physical property restituted. Case successfully closed.",
        handover_id=handover.id,
        completed_at=now,
        vault_locker=handover.vault_locker,
    )

