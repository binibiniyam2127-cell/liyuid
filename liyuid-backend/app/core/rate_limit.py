"""Distributed Rate Limiting Infrastructure for LIYUID API.

Guarantees:
1. Protects authentication and verification endpoints against brute-force & credential stuffing.
2. Redis-backed atomic sliding counters with TTL expiration when Redis is online.
3. Instant in-memory fallback when Redis is offline (e.g. unit tests, offline dev).
4. Emits RFC-compliant HTTP 429 with 'Retry-After' header.
"""

from collections import defaultdict
import hashlib
import logging
import socket
import time
from typing import Dict, List, Optional

from fastapi import HTTPException, Request, status

from app.core.config import redis_client

logger = logging.getLogger("liyuid.security.ratelimit")

# In-memory fallback: key -> list of timestamps
_memory_cache: Dict[str, List[float]] = defaultdict(list)
_redis_online: Optional[bool] = None


def is_redis_available() -> bool:
    """Fast non-blocking circuit-breaker check for Redis availability."""
    global _redis_online
    if _redis_online is not None:
        return _redis_online
    if not redis_client:
        _redis_online = False
        return False
    try:
        host = redis_client.connection_pool.connection_kwargs.get("host", "127.0.0.1")
        port = redis_client.connection_pool.connection_kwargs.get("port", 6379)
        if host in ("localhost", "127.0.0.1", "::1"):
            host = "127.0.0.1"
        with socket.create_connection((host, int(port)), timeout=0.05):
            _redis_online = bool(redis_client.ping())
    except Exception:
        _redis_online = False
    return _redis_online


class RateLimiter:
    """FastAPI Dependency for request rate limiting."""

    def __init__(
        self,
        limit: int,
        window_seconds: int = 60,
        by: str = "ip",  # 'ip', 'user', or 'endpoint'
        scope: Optional[str] = None,
    ):
        self.limit = limit
        self.window_seconds = window_seconds
        self.by = by
        self.scope = scope

    def __call__(self, request: Request) -> None:
        identifier = self._get_identifier(request)
        scope_name = self.scope or request.url.path
        key = f"ratelimit:{scope_name}:{identifier}"

        # 1. Attempt Redis-backed distributed rate check if online
        if is_redis_available():
            try:
                current = redis_client.incr(key)
                if current == 1:
                    redis_client.expire(key, self.window_seconds)

                if current > self.limit:
                    ttl = redis_client.ttl(key)
                    retry_after = max(1, ttl if ttl > 0 else self.window_seconds)
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Rate limit exceeded: Maximum {self.limit} requests per {self.window_seconds}s. Try again in {retry_after} seconds.",
                        headers={"Retry-After": str(retry_after)},
                    )
                return
            except HTTPException:
                raise
            except Exception as e:
                logger.debug("Redis error during rate check, falling back to memory: %s", e)

        # 2. In-memory fallback
        now = time.time()
        timestamps = _memory_cache[key]
        cutoff = now - self.window_seconds
        _memory_cache[key] = [t for t in timestamps if t > cutoff]

        if len(_memory_cache[key]) >= self.limit:
            oldest = _memory_cache[key][0]
            retry_after = max(1, int(self.window_seconds - (now - oldest)))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: Maximum {self.limit} requests per {self.window_seconds}s. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

        _memory_cache[key].append(now)

    def _get_identifier(self, request: Request) -> str:
        if self.by == "user":
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:].strip()
                return hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]

        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "127.0.0.1"
        return ip

