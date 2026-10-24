"""Session Management and Token Revocation Service for LIYUID.

Guarantees:
1. Immediate token invalidation upon user logout or security escalation.
2. Redis-backed blacklist with automatic expiration matching JWT 'exp' claim.
3. In-memory fallback if Redis is unavailable.
"""

from datetime import datetime, timezone
import hashlib
import logging
import socket
from typing import Optional, Set

import jwt

from app.core.config import ALGORITHM, SECRET_KEY, redis_client

logger = logging.getLogger("liyuid.security.session")

_memory_revocation_cache: Set[str] = set()
_redis_session_online: Optional[bool] = None


def is_redis_available() -> bool:
    """Fast non-blocking circuit-breaker check for Redis availability."""
    global _redis_session_online
    if _redis_session_online is not None:
        return _redis_session_online
    if not redis_client:
        _redis_session_online = False
        return False
    try:
        host = redis_client.connection_pool.connection_kwargs.get("host", "127.0.0.1")
        port = redis_client.connection_pool.connection_kwargs.get("port", 6379)
        if host in ("localhost", "127.0.0.1", "::1"):
            host = "127.0.0.1"
        with socket.create_connection((host, int(port)), timeout=0.05):
            _redis_session_online = bool(redis_client.ping())
    except Exception:
        _redis_session_online = False
    return _redis_session_online


def _compute_token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def revoke_token(token: str) -> bool:
    """Revokes a JWT token so subsequent requests are rejected."""
    token_hash = _compute_token_hash(token)
    ttl = 86400  # Default 24 hours

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"verify_exp": False, "verify_aud": False},
        )
        exp = payload.get("exp")
        if exp:
            now_ts = datetime.now(timezone.utc).timestamp()
            ttl = max(60, int(exp - now_ts))
    except Exception:
        pass

    # 1. Store in Redis if online
    if is_redis_available():
        try:
            redis_client.set(f"token_blacklist:{token_hash}", "revoked", ex=ttl)
            logger.info("Revoked session token in Redis: %s... (TTL: %ss)", token_hash[:8], ttl)
            return True
        except Exception as e:
            logger.warning("Redis unavailable during token revocation: %s", e)

    # 2. Store in-memory fallback
    _memory_revocation_cache.add(token_hash)
    logger.info("Revoked session token in local cache: %s...", token_hash[:8])
    return True


def is_token_revoked(token: str) -> bool:
    """Checks whether a token has been revoked."""
    token_hash = _compute_token_hash(token)

    # 1. Check Redis if online
    if is_redis_available():
        try:
            return bool(redis_client.exists(f"token_blacklist:{token_hash}"))
        except Exception as e:
            logger.debug("Redis error checking revocation: %s", e)

    # 2. Check in-memory fallback
    return token_hash in _memory_revocation_cache
