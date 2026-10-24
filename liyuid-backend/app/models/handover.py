import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


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
    status = Column(String(32), default="open", nullable=False)
    venue = Column(String(32), default="direct", nullable=True)
    station_location = Column(String(255), nullable=True)
    vault_locker = Column(String(64), nullable=True)
    deposit_voucher = Column(String(64), nullable=True)
    municipal_notes = Column(Text, nullable=True)
    regenerate_count = Column(Integer, default=0, nullable=False)
    code_attempts = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    match = relationship("Match", back_populates="handover")
