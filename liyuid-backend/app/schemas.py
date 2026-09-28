from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any
from datetime import datetime
from uuid import UUID

class ItemCreate(BaseModel):
    user_id: UUID
    type: Literal["lost", "found"]
    category: str = Field(..., example="Phones")
    brand: Optional[str] = Field(None, example="Samsung")
    model: Optional[str] = Field(None, example="Galaxy A54")
    primary_color: str = Field(..., example="Black")
    public_description: str = Field(..., min_length=5, example="Black Samsung phone dropped near Bole Medhanealem.")
    private_challenge_truth: str = Field(..., min_length=2, example="0911")
    latitude: float = Field(..., ge=-90.0, le=90.0, example=8.9982)
    longitude: float = Field(..., ge=-180.0, le=180.0, example=38.7865)
    incident_timestamp: datetime

class ItemPublicResponse(BaseModel):
    id: UUID
    type: str
    category: str
    brand: Optional[str]
    model: Optional[str]
    primary_color: str
    public_description: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class MatchCandidate(BaseModel):
    match_id: UUID
    candidate_item_id: UUID
    composite_score: float
    score_breakdown: Dict[str, Any]
    explainable_tags: list[str]

class VerificationRequest(BaseModel):
    match_id: UUID
    claimed_answer: str

class VerificationResult(BaseModel):
    verified: bool
    message: str
    attempts_remaining: int