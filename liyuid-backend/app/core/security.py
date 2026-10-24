import hashlib
import hmac
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

from app.core.config import (
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    SPATIAL_SALT,
    SUB_CITY_CENTROIDS,
    USER_AUDIENCE,
)
from app.schemas import SubCityEnum

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_jwt_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
    audience: str = USER_AUDIENCE,
) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "aud": audience, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def compute_proof_hash(val: str) -> str:
    cleaned = re.sub(r"\D", "", val) if any(c.isdigit() for c in val) else val.strip().lower()
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()


def compute_deterministic_centroid(sub_city: SubCityEnum, item_id: uuid.UUID) -> str:
    lat, lon = SUB_CITY_CENTROIDS[sub_city]
    h = hmac.new(SPATIAL_SALT.encode(), item_id.bytes, hashlib.sha256).digest()
    noise_lat = ((int.from_bytes(h[:4], "big") / 0xFFFFFFFF) - 0.5) * 0.005
    noise_lon = ((int.from_bytes(h[4:8], "big") / 0xFFFFFFFF) - 0.5) * 0.005
    return f"SRID=4326;POINT({lon + noise_lon:.6f} {lat + noise_lat:.6f})"


def compute_option_token(match_id: uuid.UUID, text_val: str) -> str:
    return hashlib.sha256(f"{match_id}:{text_val}".encode("utf-8")).hexdigest()[:16]

