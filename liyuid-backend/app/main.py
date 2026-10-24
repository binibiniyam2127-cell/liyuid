import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import pyotp
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.audit import log_audit_event
from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    ENCRYPTION_KEY,
    ENCRYPTION_KEY_HEX,
    RAW_DIR,
    REDIS_URL,
    SANITIZED_DIR,
    SECRET_KEY,
    SPATIAL_SALT,
    STAFF_AUDIENCE,
    SUB_CITY_CENTROIDS,
    UPLOAD_DIR,
    USER_AUDIENCE,
    celery_client,
    redis_client,
)
from app.core.dependencies import get_current_user, require_admin, require_staff
from app.core.logging import RequestLoggingMiddleware, configure_logging
from app.core.ml import get_ml_model
from app.core.security import (
    compute_deterministic_centroid,
    compute_option_token,
    compute_proof_hash,
    create_jwt_token,
    create_refresh_token,
    get_password_hash,
    oauth2_scheme,
    pwd_context,
    verify_password,
)
from app.database import Base, SessionLocal, engine, get_db
from app.models import StaffAccount
from app.routers import (
    admin,
    auth,
    finder,
    handovers,
    matches,
    reports,
    settings,
    staff,
)
from app.schemas import Token, UserRegister, UserResponse, VerifyOtpRequest
from app.verification_service import encrypt_detail

logger = logging.getLogger("liyuid.backend")
logging.basicConfig(level=logging.INFO)


# ============================================================================
# Application Lifespan & Initialization
# ============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LIYUID Core Backend initialized successfully.")
    yield
    logger.info("LIYUID Core Backend shutting down.")


app = FastAPI(
    title="LIYUID Core Backend API",
    description="Multilingual Semantic, Geospatial Matching, Asymmetric Verification, Secure Handover, Staff Control & Audit Engine",
    version="3.0.0",
    lifespan=lifespan,
)

configure_logging()
app.add_middleware(RequestLoggingMiddleware)

cors_origins_env = os.getenv("CORS_ORIGINS", "*")
if cors_origins_env == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    allow_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ============================================================================
# Core Health Check Endpoints
# ============================================================================
@app.get("/health", tags=["System"])
@app.get("/health/live", tags=["System"])
@app.get("/api/health", tags=["System"])
def liveness_check():
    """
    Fast liveness probe for container orchestrators, load balancers, and uptime monitors.
    Responds immediately without external I/O blocking.
    """
    return {
        "status": "alive",
        "service": "LIYUID Core Backend API",
        "version": "3.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health/ready", tags=["System"])
def readiness_check():
    """
    Deep readiness probe verifying database connectivity, PostGIS spatial library,
    pgvector embeddings, Redis cache connection, and storage volume writeability.
    """
    checks = {}
    is_ready = True

    # 1. Database & Extensions
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
            checks["database"] = {"status": "connected"}

            try:
                postgis_ver = conn.execute(text("SELECT PostGIS_Lib_Version();")).scalar()
                checks["postgis"] = {"status": "installed", "version": str(postgis_ver)}
            except Exception as e:
                checks["postgis"] = {"status": "missing_or_error", "detail": str(e)}

            try:
                has_vector = conn.execute(
                    text("SELECT 1 FROM pg_extension WHERE extname = 'vector';")
                ).scalar()
                checks["pgvector"] = {
                    "status": "installed" if has_vector else "extension_not_created"
                }
            except Exception as e:
                checks["pgvector"] = {"status": "error", "detail": str(e)}
    except Exception as exc:
        checks["database"] = {"status": "error", "detail": str(exc)}
        is_ready = False

    # 2. Redis Cache
    try:
        if redis_client is not None and redis_client.ping():
            checks["redis"] = {"status": "connected"}
        else:
            checks["redis"] = {"status": "disconnected", "fallback": "in-memory"}
    except Exception as exc:
        checks["redis"] = {"status": "error", "detail": str(exc), "fallback": "in-memory"}

    # 3. Storage Directories
    raw_ok = os.access(RAW_DIR, os.W_OK)
    sanitized_ok = os.access(SANITIZED_DIR, os.W_OK)
    storage_ok = raw_ok and sanitized_ok
    checks["storage"] = {
        "quarantine_raw": "writable" if raw_ok else "unwritable",
        "sanitized_public": "writable" if sanitized_ok else "unwritable",
    }
    if not storage_ok:
        is_ready = False

    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if is_ready else "not_ready",
            "version": "3.0.0",
            "environment": os.getenv("ENVIRONMENT", "production"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": checks,
        },
    )


@app.get("/", tags=["Health Check"])
def root_health_check():
    return {
        "status": "online",
        "service": "LIYUID Core Backend (Milestones B1-B8 Fully Integrated)",
        "version": "3.0.0",
        "docs": "/docs",
    }


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error at %s: %s", request.url.path, exc, exc_info=True)
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal system error occurred. Please try again later."},
    )


# ============================================================================
# Modular Router Mounts
# ============================================================================
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(matches.router)
app.include_router(handovers.router)
app.include_router(staff.router)
app.include_router(admin.router)
app.include_router(finder.router)
app.include_router(settings.router)

__all__ = [
    "app",
    "create_jwt_token",
    "create_refresh_token",
    "get_password_hash",
    "verify_password",
    "USER_AUDIENCE",
    "STAFF_AUDIENCE",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "SECRET_KEY",
    "ALGORITHM",
    "get_current_user",
    "require_staff",
    "require_admin",
    "oauth2_scheme",
    "log_audit_event",
    "get_ml_model",
    "UserRegister",
    "Token",
    "UserResponse",
    "VerifyOtpRequest",
    "compute_proof_hash",
    "compute_deterministic_centroid",
    "compute_option_token",
    "celery_client",
    "redis_client",
    "SUB_CITY_CENTROIDS",
    "UPLOAD_DIR",
    "RAW_DIR",
    "SANITIZED_DIR",
]
