import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import ItemCategoryEnum, ProofKindEnum, SubCityEnum


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


class ClaimVerifyPayload(BaseModel):
    challenge_attempt: str


__all__ = [
    "ReportCreate",
    "ItemResponse",
    "MatchCandidate",
    "MatchItemDetail",
    "ClaimVerifyPayload",
]
