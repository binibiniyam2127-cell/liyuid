import re
import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


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


class ConfirmMatchCodePayload(BaseModel):
    code: str


class EscalateUnresponsivePayload(BaseModel):
    notes: Optional[str] = Field(None, max_length=1000)


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


__all__ = [
    "VerificationStateResponse",
    "PhotoVerificationResponse",
    "ProofVerificationRequest",
    "ProofVerificationResponse",
    "QuestionOption",
    "QuestionResponse",
    "AnswerVerificationRequest",
    "AnswerVerificationResponse",
    "ReviewRequestPayload",
    "ReviewRequestResponse",
    "ConfirmMatchCodePayload",
    "EscalateUnresponsivePayload",
    "ChatMessagePayload",
    "ChatMessageResponse",
]
