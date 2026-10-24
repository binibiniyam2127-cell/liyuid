import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Flag(Base):
    __tablename__ = "flags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_entity = Column(String(32), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    flagged_by_id = Column(UUID(as_uuid=True), nullable=True)
    reason = Column(String(500), nullable=False)
    status = Column(String(32), default="pending", nullable=False)
    resolution_notes = Column(String(1000), nullable=True)
    resolved_by_id = Column(UUID(as_uuid=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
