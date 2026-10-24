import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class FlagResponse(BaseModel):
    id: uuid.UUID
    target_entity: str
    entity_id: uuid.UUID
    flagged_by_id: Optional[uuid.UUID] = None
    reason: str
    status: str
    resolution_notes: Optional[str] = None
    resolved_by_id: Optional[uuid.UUID] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResolveFlagPayload(BaseModel):
    action: str = Field(..., pattern="^(allow_retry|block|dismiss|notify_finder|municipal_deposit|police_cert)$")
    resolution_notes: Optional[str] = Field(None, max_length=1000)


__all__ = [
    "FlagResponse",
    "ResolveFlagPayload",
]
