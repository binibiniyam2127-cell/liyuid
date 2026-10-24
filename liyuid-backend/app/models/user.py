import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone_number = Column(String(32), unique=True, nullable=False, index=True)
    display_name = Column(String(64), nullable=False)
    telegram_chat_id = Column(String(64), nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(32), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

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
