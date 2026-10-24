import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, LargeBinary, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


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
