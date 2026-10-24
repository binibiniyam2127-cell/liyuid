import re
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: str = Field(..., min_length=2, max_length=64)
    full_name: Optional[str] = Field(None, max_length=128)
    phone_number: str = Field(..., pattern=r"^\+251[0-9]{9}$")
    telegram_chat_id: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter (A-Z).")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter (a-z).")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number (0-9).")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special symbol (!@#$%...).")
        return v


class VerifyOtpRequest(BaseModel):
    code: str = Field(..., min_length=4, max_length=10)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str
    role: str
    phone_number: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class StaffLoginRequest(BaseModel):
    staff_code: str
    password: str
    totp_code: str = Field(..., pattern=r"^[0-9]{6}$")


__all__ = [
    "UserRegister",
    "VerifyOtpRequest",
    "UserResponse",
    "Token",
    "RefreshTokenRequest",
    "StaffLoginRequest",
]
