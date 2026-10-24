import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    LargeBinary,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


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

    challenge_type = Column(String(32), default="deterministic_proof", nullable=True)
    challenge_question = Column(Text, nullable=True)
    private_challenge_truth = Column(Text, nullable=True)
    proof_kind = Column(String(32), nullable=True)
    proof_primary_hash = Column(String(64), nullable=True, index=True)
    private_detail_encrypted = Column(LargeBinary, nullable=True)

    location = Column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )

    incident_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    date_from = Column(DateTime(timezone=True), nullable=True)
    date_to = Column(DateTime(timezone=True), nullable=True)

    text_embedding = Column(Vector(384), nullable=True)

    status = Column(String(32), default="active", nullable=False, index=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    owner = relationship("User", back_populates="items")
