import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class OptionDecoy(Base):
    __tablename__ = "option_decoys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String(64), nullable=False, index=True)
    text = Column(String(255), nullable=False)
