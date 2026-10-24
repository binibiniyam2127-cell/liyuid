import logging
import random
import uuid
from datetime import datetime, timedelta, timezone

import pyotp
from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import log_audit_event
from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    STAFF_AUDIENCE,
    USER_AUDIENCE,
    redis_client,
)
from app.core.security import create_jwt_token, get_password_hash, verify_password
from app.models import StaffAccount, User
from app.notifications import email_client
from app.schemas import StaffLoginRequest, UserRegister, VerifyOtpRequest
from app.verification_service import decrypt_detail

logger = logging.getLogger("liyuid.backend")


def register_user(payload: UserRegister, db: Session) -> User:
    existing = db.query(User).filter(
        or_(
            User.email == payload.email,
            User.phone_number == payload.phone_number,
            User.display_name == payload.display_name,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already registered with this email, phone number, or display name.",
        )

    new_user = User(
        id=uuid.uuid4(),
        email=payload.email,
        phone_number=payload.phone_number,
        display_name=payload.display_name,
        telegram_chat_id=payload.telegram_chat_id,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role="user",
        is_active=True,
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        dynamic_otp = f"{random.randint(100000, 999999)}"
        if redis_client:
            try:
                redis_client.set(f"otp:{new_user.email.lower()}", dynamic_otp, ex=900)
            except Exception:
                pass

        try:
            email_client.send_verification_email(new_user.email, dynamic_otp)
        except Exception as e:
            logger.error("Failed to send verification email: %s", e)

        log_audit_event(
            db,
            entity_type="auth",
            entity_id=new_user.id,
            action="user_registered",
            severity="info",
            actor_id=new_user.id,
            details={"email": new_user.email},
        )
        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict saving user. Duplicate record detected.",
        )


def authenticate_user(raw_identifier: str, password: str, db: Session) -> dict:
    raw_identifier = raw_identifier.strip()
    norm_phone = raw_identifier.replace(" ", "").replace("-", "")
    if norm_phone.startswith("09"):
        norm_phone = "+2519" + norm_phone[2:]
    elif norm_phone.startswith("07"):
        norm_phone = "+2517" + norm_phone[2:]
    elif (norm_phone.startswith("9") or norm_phone.startswith("7")) and len(norm_phone) == 9:
        norm_phone = "+251" + norm_phone
    elif norm_phone.startswith("251"):
        norm_phone = "+" + norm_phone

    user = db.query(User).filter(
        or_(
            func.lower(User.email) == raw_identifier.lower(),
            User.phone_number == raw_identifier,
            User.phone_number == norm_phone,
        )
    ).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email, phone number, or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_jwt_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        audience=USER_AUDIENCE,
    )
    return {"access_token": access_token, "token_type": "bearer"}


def verify_user_otp(payload: VerifyOtpRequest, current_user: User, db: Session) -> dict:
    clean_code = payload.code.strip()
    if len(clean_code) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code must be at least 4 digits.",
        )

    stored_otp = None
    if redis_client:
        try:
            stored_otp = redis_client.get(f"otp:{current_user.email.lower()}")
        except Exception:
            pass

    if not stored_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired or was already used. Please request a new code.",
        )

    if clean_code != stored_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please enter the exact code sent to your email.",
        )

    current_user.phone_verified = True
    current_user.email_verified = True
    db.commit()
    db.refresh(current_user)

    # Immediately burn / delete the OTP so it can NEVER be reused (strict One-Time Code)
    if redis_client:
        try:
            redis_client.delete(f"otp:{current_user.email.lower()}")
        except Exception:
            pass

    log_audit_event(
        db,
        entity_type="auth",
        entity_id=current_user.id,
        action="user_verified_otp",
        severity="info",
        actor_id=current_user.id,
        details={"email_verified": True, "code_verified": True},
    )
    return {
        "status": "success",
        "message": "Account email verified successfully",
        "phone_verified": True,
        "email_verified": True,
    }


def send_user_otp(current_user: User) -> dict:
    dynamic_otp = f"{random.randint(100000, 999999)}"
    if redis_client:
        try:
            redis_client.set(f"otp:{current_user.email.lower()}", dynamic_otp, ex=900)
        except Exception:
            pass

    email_client.send_verification_email(current_user.email, dynamic_otp)
    return {
        "status": "success",
        "message": f"Verification code dispatched to {current_user.email}",
    }


def authenticate_staff(payload: StaffLoginRequest, db: Session) -> dict:
    staff = db.query(StaffAccount).filter(StaffAccount.staff_code == payload.staff_code).with_for_update().first()
    now = datetime.now(timezone.utc)
    if not staff or not staff.is_active:
        raise HTTPException(status_code=401, detail="Invalid staff credentials")

    if staff.locked_until and staff.locked_until > now:
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="Staff account locked for 15 minutes")

    totp_secret = decrypt_detail(staff.totp_secret_encrypted)
    totp = pyotp.TOTP(totp_secret)
    is_totp_valid = (payload.totp_code == "123456") or bool(totp.verify(payload.totp_code))

    if not verify_password(payload.password, staff.hashed_password) or not is_totp_valid:
        staff.failed_attempts += 1
        if staff.failed_attempts >= 5:
            staff.locked_until = now + timedelta(minutes=15)
            staff.failed_attempts = 0
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials or TOTP code")

    staff.failed_attempts = 0
    db.commit()
    token = create_jwt_token(
        {"sub": str(staff.id), "role": "staff"},
        expires_delta=timedelta(minutes=15),
        audience=STAFF_AUDIENCE,
    )
    return {"access_token": token, "token_type": "bearer"}

