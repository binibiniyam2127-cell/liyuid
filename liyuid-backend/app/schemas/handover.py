import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class HandoverConfirmRequest(BaseModel):
    finder_code: Optional[str] = None
    handover_code: Optional[str] = None
    role: Optional[str] = None


class HandoverResponse(BaseModel):
    id: uuid.UUID
    match_id: uuid.UUID
    owner_confirmed: bool
    finder_confirmed: bool
    status: str
    venue: Optional[str] = "direct"
    station_location: Optional[str] = None
    vault_locker: Optional[str] = None
    deposit_voucher: Optional[str] = None
    municipal_notes: Optional[str] = None
    expires_at: datetime
    completed_at: Optional[datetime] = None
    is_fully_closed: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class NotifyMunicipalDropoffPayload(BaseModel):
    station_location: Optional[str] = "Bole Sub-City Administration Station, Desk #104"
    deposit_voucher: Optional[str] = None
    notes: Optional[str] = None


class NotifyMunicipalDropoffResponse(BaseModel):
    status: str
    message: str
    handover_id: uuid.UUID
    deposit_voucher: str
    station_location: str


class MunicipalIntakePayload(BaseModel):
    vault_locker: str = Field(..., min_length=2, max_length=64)
    station_location: Optional[str] = None
    notes: Optional[str] = None


class MunicipalIntakeResponse(BaseModel):
    status: str
    message: str
    handover_id: uuid.UUID
    vault_locker: str
    station_location: str
    finder_confirmed: bool
    sms_dispatched: Optional[bool] = True
    sms_preview: Optional[str] = None


class MunicipalReleasePayload(BaseModel):
    otp_code: str = Field(..., pattern=r"^[0-9]{6}$")
    government_id_verified: Optional[bool] = True
    owner_notes: Optional[str] = None


class MunicipalReleaseResponse(BaseModel):
    status: str
    message: str
    handover_id: uuid.UUID
    completed_at: datetime
    vault_locker: Optional[str] = None


__all__ = [
    "HandoverConfirmRequest",
    "HandoverResponse",
    "NotifyMunicipalDropoffPayload",
    "NotifyMunicipalDropoffResponse",
    "MunicipalIntakePayload",
    "MunicipalIntakeResponse",
    "MunicipalReleasePayload",
    "MunicipalReleaseResponse",
]
