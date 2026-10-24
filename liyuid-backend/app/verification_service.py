# app/verification_service.py
import hashlib
import hmac
import os
import random
import re
import secrets
import unicodedata
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from fastapi import HTTPException, status
from app.core.audit import log_audit_event
from app.core.security import get_password_hash
from app.models import AuditLog, Flag, Handover, Item, Match, OptionDecoy, User

USER_FAIL_LOCK_THRESHOLD = int(os.getenv("USER_FAIL_LOCK_THRESHOLD", "3"))
ENCRYPTION_KEY_HEX = os.getenv(
    "AES_GCM_ENCRYPTION_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
)
ENCRYPTION_KEY = bytes.fromhex(ENCRYPTION_KEY_HEX)
SPATIAL_SALT = os.getenv("SPATIAL_SALT", "liyuid_spatial_secret_salt")


class PhotoComparisonProvider(ABC):
    @abstractmethod
    def compare(self, owner_bytes: bytes, finder_bytes: Optional[bytes]) -> str:
        """Returns: 'strong', 'possible', 'weak'."""
        pass


class StubPhotoComparisonProvider(PhotoComparisonProvider):
    """
    TODO (Production Vision Pipeline):
    Replace with production Siamese Vision Transformer (ViT) or CLIP embeddings.
    """
    def compare(self, owner_bytes: bytes, finder_bytes: Optional[bytes]) -> str:
        if not owner_bytes or len(owner_bytes) < 10:
            return "weak"
        if len(owner_bytes) % 7 == 0:
            return "weak"
        if len(owner_bytes) % 2 == 0:
            return "strong"
        return "possible"


photo_provider: PhotoComparisonProvider = StubPhotoComparisonProvider()


def normalize_nfc(val: Optional[str]) -> Optional[str]:
    if val is None:
        return None
    return unicodedata.normalize("NFC", val).strip()


def encrypt_detail(plaintext: str) -> bytes:
    aesgcm = AESGCM(ENCRYPTION_KEY)
    nonce = secrets.token_bytes(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return nonce + ciphertext


def decrypt_detail(encrypted_bytes: bytes) -> str:
    if not encrypted_bytes or len(encrypted_bytes) < 13:
        return ""
    nonce = encrypted_bytes[:12]
    ciphertext = encrypted_bytes[12:]
    aesgcm = AESGCM(ENCRYPTION_KEY)
    return aesgcm.decrypt(nonce, ciphertext, None).decode("utf-8")


def compute_proof_hash(val: str) -> str:
    cleaned = re.sub(r"\D", "", val) if any(c.isdigit() for c in val) else val.strip().lower()
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()


def check_proof_match(kind: str, attempt: str, target_hash: Optional[str], target_truth: Optional[str]) -> bool:
    att_norm = normalize_nfc(attempt)
    if kind in ["imei", "id_last4"]:
        cleaned = re.sub(r"\D", "", att_norm)
        att_hash = hashlib.sha256(cleaned.encode("utf-8")).hexdigest()
        if target_hash:
            return secrets.compare_digest(att_hash.encode("utf-8"), target_hash.encode("utf-8"))
    elif kind == "contents":
        att_tokens = set(filter(None, [t.strip().lower() for t in re.split(r"[,;\n]+", att_norm)]))
        raw_truth = target_truth or ""
        truth_tokens = set(filter(None, [t.strip().lower() for t in re.split(r"[,;\n]+", raw_truth)]))
        if len(truth_tokens) >= 2 and len(att_tokens.intersection(truth_tokens)) >= 2:
            return True
    else:
        if target_hash:
            att_hash = hashlib.sha256(att_norm.lower().encode("utf-8")).hexdigest()
            return secrets.compare_digest(att_hash.encode("utf-8"), target_hash.encode("utf-8"))
        if target_truth:
            return secrets.compare_digest(att_norm.lower().encode("utf-8"), target_truth.lower().encode("utf-8"))
    return False


def check_and_flag_user_abuse(db: Session, user_id: uuid.UUID):
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_failures = db.scalar(
        select(func.count(AuditLog.id)).where(
            AuditLog.actor_id == user_id,
            AuditLog.action.in_(["match_locked_proof", "match_locked_question"]),
            AuditLog.created_at >= seven_days_ago,
        )
    )
    if recent_failures and recent_failures >= USER_FAIL_LOCK_THRESHOLD:
        existing = db.scalar(
            select(Flag).where(
                Flag.target_entity == "user",
                Flag.entity_id == user_id,
                Flag.status == "pending",
            )
        )
        if not existing:
            flag = Flag(
                id=uuid.uuid4(),
                target_entity="user",
                entity_id=user_id,
                flagged_by_id=None,
                reason=f"Verification failures exceed threshold: {recent_failures} failures in 7 days",
                status="pending",
            )
            db.add(flag)
            db.commit()



def get_match_and_validate_owner(match_id: uuid.UUID, user_id: uuid.UUID, db: Session):
    match = db.query(Match).filter(Match.id == match_id).with_for_update().first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    lost_item = db.query(Item).filter(Item.id == match.lost_item_id).first()
    found_item = db.query(Item).filter(Item.id == match.found_item_id).first()

    if not lost_item or not found_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated items not found")

    if lost_item.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the registered owner of this lost item can perform verification.",
        )
    return match, lost_item, found_item


def get_report_challenge(item_id: uuid.UUID, db: Session) -> dict:
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "item_id": str(item.id),
        "challenge_type": item.challenge_type or "deterministic_proof",
        "challenge_question": item.challenge_question or "Please verify a private characteristic of this item.",
    }


def verify_item_claim(
    item_id: uuid.UUID,
    challenge_attempt: str,
    current_user: User,
    db: Session,
) -> dict:
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Finder attempting to claim their own found item
    if item.type == "found" and item.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot claim an item you reported as found.",
        )

    # Find active match record linking user or items
    match_record = db.query(Match).filter(
        (Match.found_item_id == item.id) | (Match.lost_item_id == item.id)
    ).first()

    counterpart = None
    if match_record:
        counterpart_id = match_record.lost_item_id if item.type == "found" else match_record.found_item_id
        counterpart = db.query(Item).filter(Item.id == counterpart_id).first()
    else:
        counterpart_type = "found" if item.type == "lost" else "lost"
        counterpart = db.query(Item).filter(
            Item.type == counterpart_type,
            Item.category == item.category,
            Item.status.in_(["active", "embedding_pending"]),
        ).first()
        if counterpart:
            match_record = Match(
                id=uuid.uuid4(),
                lost_item_id=item.id if item.type == "lost" else counterpart.id,
                found_item_id=counterpart.id if item.type == "lost" else item.id,
                composite_score=0.90,
                score_breakdown={"semantic": 0.90},
                verification_attempts=0,
                is_verified=False,
                is_locked=False,
            )
            db.add(match_record)
            db.commit()
            db.refresh(match_record)
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching candidate found to verify claim.")

    # 3-Attempt Limit & Lockout
    current_attempts = match_record.verification_attempts or 0
    if getattr(match_record, "is_locked", False) or current_attempts >= 3:
        match_record.is_locked = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Verification locked: Exceeded maximum allowed attempts (3). Flagged for administrative review.",
        )

    # Retrieve ground truth
    ground_truth = item.private_challenge_truth or (counterpart.private_challenge_truth if counterpart else None)
    if not ground_truth and counterpart and counterpart.private_detail_encrypted:
        try:
            ground_truth = decrypt_detail(counterpart.private_detail_encrypted)
        except Exception:
            pass
    if not ground_truth and item.private_detail_encrypted:
        try:
            ground_truth = decrypt_detail(item.private_detail_encrypted)
        except Exception:
            pass

    expected_hash = item.proof_primary_hash or (counterpart.proof_primary_hash if counterpart else None)

    attempt_norm = normalize_nfc(challenge_attempt.strip().lower())
    truth_norm = normalize_nfc((ground_truth or "").strip().lower())
    attempt_hash = compute_proof_hash(challenge_attempt)

    is_match = False
    if ground_truth and attempt_norm == truth_norm:
        is_match = True
    elif expected_hash and attempt_hash == expected_hash:
        is_match = True
    elif ground_truth and truth_norm and (truth_norm in attempt_norm or attempt_norm in truth_norm):
        is_match = True

    if not is_match:
        current_attempts += 1
        match_record.verification_attempts = current_attempts
        if current_attempts >= 3:
            match_record.is_locked = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Verification locked: Exceeded maximum allowed attempts (3). Flagged for administrative review.",
            )
        db.commit()
        remaining = max(0, 3 - current_attempts)
        return {
            "verified": False,
            "status": "failed",
            "message": "Verification challenge failed. The provided details do not match.",
            "attempts_remaining": remaining,
            "handover_id": None,
            "one_time_handover_code": None,
        }

    # Verified successfully
    match_record.is_verified = True
    match_record.verification_attempts = current_attempts
    raw_code = f"{secrets.randbelow(900000) + 100000}"
    code_hash = get_password_hash(raw_code)

    handover = db.query(Handover).filter(Handover.match_id == match_record.id).first()
    if handover:
        handover.handover_code_hash = code_hash
        handover.status = "open"
        handover.expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    else:
        handover = Handover(
            id=uuid.uuid4(),
            match_id=match_record.id,
            handover_code_hash=code_hash,
            status="open",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
            owner_confirmed=False,
            finder_confirmed=False,
        )
        db.add(handover)

    db.commit()
    db.refresh(handover)

    log_audit_event(
        db,
        entity_type="item",
        entity_id=item.id,
        action="claim_verified_success",
        severity="info",
        actor_id=current_user.id,
        details={"handover_id": str(handover.id)},
    )

    return {
        "verified": True,
        "status": "verified",
        "message": "Ownership verified successfully! Present this one-time code at the physical handoff.",
        "attempts_remaining": max(0, 3 - current_attempts),
        "handover_id": str(handover.id),
        "one_time_handover_code": raw_code,
    }
