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

from app.models import AuditLog, Flag, Item, Match, OptionDecoy, User

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