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
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


# ==========================================
# 1. User Model (FR-01, FR-06)
# ==========================================
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone_number = Column(String(32), unique=True, nullable=True, index=True)
    telegram_chat_id = Column(String(64), nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    items = relationship("Item", back_populates="owner")


# ==========================================
# 2. Item Model (FR-02, FR-03, FR-08)
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
    brand = Column(String(64), nullable=True)
    model = Column(String(64), nullable=True)
    primary_color = Column(String(32), nullable=False)
    public_description = Column(Text, nullable=False)

    # FR-05 Challenge Setup
    challenge_type = Column(String(32), default="deterministic_code", nullable=False)
    challenge_question = Column(Text, nullable=True)
    private_challenge_truth = Column(Text, nullable=False)

    # PostGIS Spatial Geography (SRID 4326)
    location = Column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )

    incident_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    # Multilingual MiniLM 384-dimensional dense vector
    text_embedding = Column(Vector(384), nullable=True)

    # Lifecycle State: 'active', 'matched_pending_handoff', 'disputed_locked', 'resolved_closed'
    status = Column(String(32), default="active", nullable=False, index=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    owner = relationship("User", back_populates="items")


# ==========================================
# 3. Match Model (FR-03, FR-04, FR-05)
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
    composite_score = Column(Float, nullable=False)
    score_breakdown = Column(JSONB, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    lost_item = relationship("Item", foreign_keys=[lost_item_id])
    found_item = relationship("Item", foreign_keys=[found_item_id])
    handover = relationship("Handover", back_populates="match", uselist=False)


# ==========================================
# 4. Handover Model (FR-07, FR-09)
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
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    match = relationship("Match", back_populates="handover")


# ==========================================
# 5. Audit Log Model (FR-10: Immutable Security Trail)
# ==========================================
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(32), nullable=False, index=True)  # 'item', 'match', 'handover', 'auth'
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    actor_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # User UUID or None for automated events
    action = Column(String(64), nullable=False, index=True)  # 'claim_attempt_failed', 'brute_force_lockout', etc.
    severity = Column(String(16), nullable=False, default="info", index=True)  # 'info', 'warning', 'critical'
    details = Column(JSONB, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )