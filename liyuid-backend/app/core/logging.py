"""Structured Logging and Observability for LIYUID API."""

import json
import logging
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class JSONFormatter(logging.Formatter):
    """Formats log records as structured single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)


def configure_logging() -> None:
    """Configures structured JSON logging if enabled by environment."""
    log_format = os.getenv("LOG_FORMAT", "json" if os.getenv("ENVIRONMENT") == "production" else "text")
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    handler = logging.StreamHandler(sys.stdout)
    if log_format.lower() == "json":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s")
        )

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level, logging.INFO))
    # Replace existing handlers with structured handler
    root_logger.handlers = [handler]


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that injects X-Request-ID and logs latency and status codes."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start_time = time.time()
        
        # Attach request_id to request state
        request.state.request_id = req_id

        response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = req_id

        # Skip spamming logs for trivial health checks unless warning/error
        if request.url.path not in ("/health", "/api/health", "/health/live") or response.status_code >= 400:
            logging.getLogger("liyuid.access").info(
                "%s %s - %s (%sms)",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
                extra={"request_id": req_id},
            )

        return response

