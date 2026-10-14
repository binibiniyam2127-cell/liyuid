import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


# ==========================================
# 1. User Model (FR-01, B7 Settings/Telegram)
# ==========================================
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone_number = Column(String(32), unique=True, nullable=False, index=True)
    display_name = Column(String(64), nullable=False)
    telegram_chat_id = Column(String(64), nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(32), default="user", nullable=False)  # 'user', 'admin'
    is_active = Column(Boolean, default=True, nullable=False)

    # B7 Verification and Telegram Link States
    phone_verified = Column(Boolean, default=False, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    telegram_state = Column(String(32), default="not_connected", nullable=False)
    telegram_link_code = Column(String(64), nullable=True, index=True)
    telegram_link_expires_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    items = relationship("Item", back_populates="owner")


# ==========================================
# 2. Item Model (B3 Spatial & Cryptographic Proofs)
# ==========================================
class Item(Base):
    __tablename__ = "items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type = Column(String(16), nullable=False)  # 'lost' or 'found'
    category = Column(String(64), nullable=False, index=True)
    sub_city = Column(String(64), nullable=True, index=True)
    brand = Column(String(64), nullable=True)
    model = Column(String(64), nullable=True)
    primary_color = Column(String(32), nullable=False)
    public_description = Column(Text, nullable=False)

    # Challenge Setup & B3 Deterministic Verification Fields
    challenge_type = Column(String(32), default="deterministic_proof", nullable=True)
    challenge_question = Column(Text, nullable=True)
    private_challenge_truth = Column(Text, nullable=True)
    proof_kind = Column(String(32), nullable=True)  # imei, id_last4, contents, keychain, other
    proof_primary_hash = Column(String(64), nullable=True, index=True)
    private_detail_encrypted = Column(LargeBinary, nullable=True)

    # PostGIS Spatial Geography (SRID 4326)
    location = Column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )

    incident_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    date_from = Column(DateTime(timezone=True), nullable=True)
    date_to = Column(DateTime(timezone=True), nullable=True)

    # Multilingual MiniLM 384-dimensional dense vector
    text_embedding = Column(Vector(384), nullable=True)

    # Lifecycle State
    status = Column(String(32), default="active", nullable=False, index=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    owner = relationship("User", back_populates="items")


# ==========================================
# 3. Match Model (B4 3-Layer Verification)
# ==========================================
class Match(Base):
    __tablename__ = "matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lost_item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    found_item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    claimant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    composite_score = Column(Float, nullable=False)
    score_breakdown = Column(JSONB, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)

    # B4 Multi-Stage Verification Pipeline
    photo_result = Column(String(16), default="none", nullable=False)  # none, strong, possible, weak
    proof_passed = Column(Boolean, default=False, nullable=False)
    question_passed = Column(Boolean, default=False, nullable=False)
    proof_attempts = Column(Integer, default=0, nullable=False)
    question_attempts = Column(Integer, default=0, nullable=False)
    cooldown_until = Column(DateTime(timezone=True), nullable=True)
    lock_state = Column(String(32), default="none", nullable=False)  # none, locked, review_requested, staff_allowed_retry

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    lost_item = relationship("Item", foreign_keys=[lost_item_id])
    found_item = relationship("Item", foreign_keys=[found_item_id])
    handover = relationship("Handover", back_populates="match", uselist=False)


# ==========================================
# 4. Handover Model (B5 Secure 6-Digit Exchange)
# ==========================================
class Handover(Base):
    __tablename__ = "handovers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    handover_code_hash = Column(String(255), nullable=False)
    owner_confirmed = Column(Boolean, default=False, nullable=False)
    finder_confirmed = Column(Boolean, default=False, nullable=False)
    status = Column(String(32), default="open", nullable=False)  # 'open', 'closed', 'municipal_secured'
    venue = Column(String(32), default="direct", nullable=True)  # 'direct', 'municipal'
    station_location = Column(String(255), nullable=True)
    vault_locker = Column(String(64), nullable=True)
    deposit_voucher = Column(String(64), nullable=True)
    municipal_notes = Column(Text, nullable=True)
    regenerate_count = Column(Integer, default=0, nullable=False)
    code_attempts = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    match = relationship("Match", back_populates="handover")


# ==========================================
# 5. Decoys, Requests, Chat & Audit Models
# ==========================================
class OptionDecoy(Base):
    __tablename__ = "option_decoys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String(64), nullable=False, index=True)
    text = Column(String(255), nullable=False)


class FinderRequest(Base):
    __tablename__ = "finder_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(32), default="new", nullable=False)  # 'new', 'accepted', 'deferred'
    next_reminder_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    text = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class StaffAccount(Base):
    __tablename__ = "staff_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    staff_code = Column(String(32), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(128), nullable=False)
    staff_role = Column(String(32), default="moderator", nullable=False)
    hashed_password = Column(String(255), nullable=False)
    totp_secret_encrypted = Column(LargeBinary, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    failed_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(64), default="system_cli", nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Flag(Base):
    __tablename__ = "flags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_entity = Column(String(32), nullable=False)  # 'match', 'handover', 'user', 'item'
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    flagged_by_id = Column(UUID(as_uuid=True), nullable=True)
    reason = Column(String(500), nullable=False)
    status = Column(String(32), default="pending", nullable=False)  # 'pending', 'resolved'
    resolution_notes = Column(String(1000), nullable=True)
    resolved_by_id = Column(UUID(as_uuid=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(32), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    actor_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String(64), nullable=False, index=True)
    severity = Column(String(16), nullable=False, default="info", index=True)
    details = Column(JSONB, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )