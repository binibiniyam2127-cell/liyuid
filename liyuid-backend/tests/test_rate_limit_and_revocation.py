"""Unit Tests for Distributed Rate Limiter and Session Revocation."""

import time
import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock

from app.core.rate_limit import RateLimiter, _memory_cache
from app.core.session import is_token_revoked, revoke_token, _memory_revocation_cache


def create_mock_request(client_ip="192.168.1.100", path="/test/endpoint", auth_token=None):
    req = MagicMock()
    req.client.host = client_ip
    req.headers = {}
    if auth_token:
        req.headers["Authorization"] = f"Bearer {auth_token}"
    req.url.path = path
    return req


def test_rate_limiter_allows_under_limit():
    limiter = RateLimiter(limit=3, window_seconds=60, by="ip", scope="test:allow")
    req = create_mock_request(client_ip="10.0.0.1", path="/test/allow")

    # Clear memory cache for test
    _memory_cache.clear()

    # 3 allowed requests
    limiter(req)
    limiter(req)
    limiter(req)


def test_rate_limiter_blocks_over_limit():
    limiter = RateLimiter(limit=2, window_seconds=60, by="ip", scope="test:block")
    req = create_mock_request(client_ip="10.0.0.2", path="/test/block")

    _memory_cache.clear()

    limiter(req)
    limiter(req)

    # 3rd request exceeds limit of 2
    with pytest.raises(HTTPException) as exc:
        limiter(req)
    assert exc.value.status_code == 429
    assert "Rate limit exceeded" in exc.value.detail
    assert "Retry-After" in exc.value.headers


def test_token_revocation_lifecycle():
    dummy_jwt = "header.payload.signature_test_token"

    # Initially not revoked
    assert not is_token_revoked(dummy_jwt)

    # Revoke
    revoked = revoke_token(dummy_jwt)
    assert revoked is True

    # Now is_token_revoked must be True
    assert is_token_revoked(dummy_jwt) is True
