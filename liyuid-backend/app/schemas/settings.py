import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserSettingsResponse(BaseModel):
    display_name: str
    phone_verified: bool
    email_verified: bool
    telegram_state: str

    model_config = ConfigDict(from_attributes=True)


class FinderRequestResponse(BaseModel):
    id: uuid.UUID
    match_id: uuid.UUID
    status: str
    next_reminder_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


__all__ = [
    "UserSettingsResponse",
    "FinderRequestResponse",
]
