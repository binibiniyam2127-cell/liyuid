import re
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ============================================================================
# Enums
# ============================================================================
class SubCityEnum(str, Enum):
    addis_ketema = "Addis Ketema"
    akaky_kaliti = "Akaky Kaliti"
    arada = "Arada"
    bole = "Bole"
    gullele = "Gullele"
    kirkos = "Kirkos"
    kolfe_keranio = "Kolfe Keranio"
    lideta = "Lideta"
    nifas_silk_lafto = "Nifas Silk-Lafto"
    yeka = "Yeka"
    lemi_kura = "Lemi Kura"


class ItemCategoryEnum(str, Enum):
    electronics = "electronics"
    documents_ids = "documents_ids"
    wallets_cards = "wallets_cards"
    keys = "keys"
    jewelry_accessories = "jewelry_accessories"
    bags_luggage = "bags_luggage"
    clothing = "clothing"
    other = "other"


class ProofKindEnum(str, Enum):
    imei = "imei"
    id_last4 = "id_last4"
    contents = "contents"
    keychain = "keychain"
    other = "other"


# ============================================================================
# Item & Report Schemas (B3)
# ============================================================================
class ReportCreate(BaseModel):
    type: str = Field(..., pattern="^(lost|found)$")
    category: ItemCategoryEnum
    sub_city: SubCityEnum
    brand: Optional[str] = Field(None, max_length=64)
    model: Optional[str] = Field(None, max_length=64)
    primary_color: str = Field(..., min_length=2, max_length=32)
    public_description: str = Field(..., min_length=10, max_length=1000)

    # Date Range constraints
    date_from: datetime
    date_to: datetime

    # Private Verification (Found reports only)
    proof_kind: Optional[ProofKindEnum] = None
    proof_primary: Optional[str] = Field(None, max_length=128)
    private_detail: Optional[str] = Field(None, max_length=256)

    @field_validator("public_description")
    @classmethod
    def sanitize_pii(cls, value: str) -> str:
        # Rejects Ethiopian phone numbers (+251..., 09..., 07...) and sequences of 8+ consecutive digits
        phone_pattern = r"(\+251\s?[0-9]{9}|09\s?[0-9]{8}|07\s?[0-9]{8}|\b\d{8,}\b)"
        if re.search(phone_pattern, value):
            raise ValueError(
                "Public description contains forbidden contact info or serial/phone numbers. Keep details private."
            )
        return value

    @field_validator("date_to")
    @classmethod
    def validate_date_range(cls, date_to: datetime, info) -> datetime:
        date_from = info.data.get("date_from")
        if date_from and date_to < date_from:
            raise ValueError("date_to cannot precede date_from")
        return date_to


class ItemResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    category: str
    sub_city: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    primary_color: str
    public_description: str
    status: str
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Match & Ranking Schemas (B3 & Two-Stage Search)
# ============================================================================
class MatchCandidate(BaseModel):
    match_id: Optional[uuid.UUID] = None
    candidate_item_id: uuid.UUID
    composite_score: float
    score_breakdown: Dict[str, Any]
    explainable_tags: List[str]
    is_verified: bool = False
    is_locked: bool = False

    model_config = ConfigDict(from_attributes=True)


class MatchItemDetail(BaseModel):
    match_id: uuid.UUID
    candidate_item_id: uuid.UUID
    finder_display_name: str
    composite_score: float
    is_verified: bool
    is_locked: bool
    score_breakdown: Dict[str, Any]
    explainable_tags: List[str]
    category: str
    sub_city: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    primary_color: str
    public_description: str
    status: str
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Verification Schemas (B4)
# ============================================================================
class VerificationStateResponse(BaseModel):
    match_id: uuid.UUID
    step: str  # 'photo', 'proof', 'question', 'passed', 'locked', 'review_requested'
    photo_result: str
    proof_kind: Optional[str] = None
    proof_attempts_remaining: int
    question_attempts_remaining: int
    cooldown_seconds_remaining: int
    handover_id: Optional[uuid.UUID] = None


class PhotoVerificationResponse(BaseModel):
    photo_result: str
    message: str


class ProofVerificationRequest(BaseModel):
    proof_attempt: str = Field(..., min_length=1, max_length=128)


class ProofVerificationResponse(BaseModel):
    proof_passed: bool
    proof_attempts_remaining: int
    next_step: str
    message: str


class QuestionOption(BaseModel):
    id: str
    text: str


class QuestionResponse(BaseModel):
    match_id: uuid.UUID
    options: List[QuestionOption]


class AnswerVerificationRequest(BaseModel):
    option_id: str


class AnswerVerificationResponse(BaseModel):
    question_passed: bool
    question_attempts_remaining: int
    cooldown_seconds_remaining: int
    status: str
    message: str
    handover_id: Optional[uuid.UUID] = None
    one_time_code: Optional[str] = None


class ReviewRequestPayload(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class ReviewRequestResponse(BaseModel):
    status: str
    message: str


# ============================================================================
# Handover Schemas (B5)
# ============================================================================
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


# ============================================================================
# Staff & Moderation Schemas (B6)
# ============================================================================
class StaffLoginRequest(BaseModel):
    staff_code: str
    password: str
    totp_code: str = Field(..., pattern=r"^[0-9]{6}$")


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


class EscalateUnresponsivePayload(BaseModel):
    notes: Optional[str] = Field(None, max_length=1000)


# ============================================================================
# Finder Requests, Chat & Settings Schemas (B7)
# ============================================================================
class FinderRequestResponse(BaseModel):
    id: uuid.UUID
    match_id: uuid.UUID
    status: str
    next_reminder_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatMessagePayload(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)

    @field_validator("text")
    @classmethod
    def block_phone_numbers(cls, v: str) -> str:
        phone_pattern = r"(\+251\s?[0-9]{9}|09\s?[0-9]{8}|07\s?[0-9]{8}|\b\d{8,}\b)"
        email_pattern = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
        if re.search(phone_pattern, v):
            raise ValueError("Direct phone numbers are strictly prohibited in chat for safety.")
        if re.search(email_pattern, v):
            raise ValueError("Direct email addresses are strictly prohibited in chat for safety.")
        return v


class ChatMessageResponse(BaseModel):
    sender_display_name: str
    text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserSettingsResponse(BaseModel):
    display_name: str
    phone_verified: bool
    email_verified: bool
    telegram_state: str

    model_config = ConfigDict(from_attributes=True)