"""Unit Tests for Gate 5: Auth Hardening, httpOnly Cookies, and Refresh Token Rotation."""

import uuid
from datetime import timedelta
import pytest
from fastapi import HTTPException, Response
from unittest.mock import MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import USER_AUDIENCE
from app.core.dependencies import get_current_user
from app.core.security import create_jwt_token, create_refresh_token
from app.core.session import (
    clear_auth_cookies,
    is_token_revoked,
    revoke_token,
    set_auth_cookies,
    _memory_revocation_cache,
)
from app.database import Base
from app.models import AuditLog, User
from app.services.auth_service import rotate_refresh_token

# In-memory SQLite for testing rotation (create users and audit_logs tables)
test_engine = create_engine("sqlite:///:memory:")
TestSession = sessionmaker(bind=test_engine)
User.__table__.create(bind=test_engine)
AuditLog.__table__.create(bind=test_engine)


@pytest.fixture
def test_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def sample_user(test_db):
    user = User(
        id=uuid.uuid4(),
        email=f"auth_test_{uuid.uuid4().hex[:6]}@liyuid.et",
        phone_number=f"+251911{uuid.uuid4().int % 1000000:06d}",
        display_name="AuthTester",
        hashed_password="hashed_pwd_placeholder",
        role="user",
        is_active=True,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


def test_refresh_token_generation_and_rotation(test_db, sample_user):
    """Test generating a refresh token, rotating it once, and verifying replay rejection."""
    _memory_revocation_cache.clear()

    # 1. Generate initial refresh token
    refresh_token, jti = create_refresh_token(user_id=str(sample_user.id))
    assert refresh_token is not None
    assert jti is not None
    assert not is_token_revoked(refresh_token)

    # 2. First rotation: should succeed and return new token pair
    rot1 = rotate_refresh_token(refresh_token, test_db)
    assert "access_token" in rot1
    assert "refresh_token" in rot1
    assert rot1["refresh_token"] != refresh_token
    assert rot1["token_type"] == "bearer"
    assert rot1["expires_in"] > 0

    # 3. Old refresh token must now be revoked!
    assert is_token_revoked(refresh_token) is True

    # 4. Replay attack: using the revoked refresh token again must be rejected!
    with pytest.raises(HTTPException) as exc:
        rotate_refresh_token(refresh_token, test_db)
    assert exc.value.status_code == 401
    assert "revoked" in exc.value.detail or "expired" in exc.value.detail

    # 5. The new refresh token should be valid and rotatable
    rot2 = rotate_refresh_token(rot1["refresh_token"], test_db)
    assert rot2["access_token"] is not None
    assert rot2["refresh_token"] != rot1["refresh_token"]


def test_cookie_helpers():
    """Verify set_auth_cookies and clear_auth_cookies populate proper HTTP headers."""
    response = Response()
    access_tok = "test.access.token"
    refresh_tok = "test.refresh.token"

    set_auth_cookies(response, access_token=access_tok, refresh_token=refresh_tok)
    
    # Check set-cookie in raw headers
    cookie_headers = [v.decode("latin-1") for k, v in response.raw_headers if k.lower() == b"set-cookie"]
    assert any("access_token=" in c for c in cookie_headers)
    assert any("refresh_token=" in c for c in cookie_headers)
    assert any("HttpOnly" in c or "httponly" in c for c in cookie_headers)

    # Clear cookies
    clear_response = Response()
    clear_auth_cookies(clear_response)
    clear_headers = [v.decode("latin-1") for k, v in clear_response.raw_headers if k.lower() == b"set-cookie"]
    assert any("access_token=" in c for c in clear_headers)


def test_get_current_user_cookie_and_bearer_fallback(test_db, sample_user):
    """Verify get_current_user accepts both Bearer token and cookie token."""
    _memory_revocation_cache.clear()

    access_token = create_jwt_token(
        data={"sub": str(sample_user.id)},
        expires_delta=timedelta(minutes=15),
        audience=USER_AUDIENCE,
    )

    # 1. Bearer Header Authentication
    req_bearer = MagicMock()
    req_bearer.cookies = {}
    user_via_bearer = get_current_user(request=req_bearer, token=access_token, db=test_db)
    assert user_via_bearer.id == sample_user.id

    # 2. Cookie Authentication (token param is None)
    req_cookie = MagicMock()
    req_cookie.cookies = {"access_token": access_token}
    user_via_cookie = get_current_user(request=req_cookie, token=None, db=test_db)
    assert user_via_cookie.id == sample_user.id

    # 3. Revoked token rejected
    revoke_token(access_token)
    with pytest.raises(HTTPException) as exc:
        get_current_user(request=req_cookie, token=None, db=test_db)
    assert exc.value.status_code == 401
    assert "revoked" in exc.value.detail
