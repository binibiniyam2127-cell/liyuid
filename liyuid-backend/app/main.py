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
from app.core.ml import get_ml_model
from app.core.security import (
    compute_deterministic_centroid,
    compute_option_token,
    compute_proof_hash,
    create_jwt_token,
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
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
        Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_items_text_embedding_hnsw "
                    "ON items USING hnsw (text_embedding vector_cosine_ops);"
                )
            )
            conn.commit()

        # Ensure default staff supervisor account exists
        try:
            with SessionLocal() as db:
                existing = db.query(StaffAccount).filter(StaffAccount.staff_code == "STF-01").first()
                if not existing:
                    default_staff = StaffAccount(
                        id=uuid.uuid4(),
                        staff_code="STF-01",
                        email="staff@liyuid.com",
                        full_name="Operations Supervisor STF-01",
                        staff_role="Senior Operations Supervisor",
                        hashed_password=get_password_hash("StaffPass123!"),
                        totp_secret_encrypted=encrypt_detail(pyotp.random_base32()),
                        is_active=True,
                        failed_attempts=0,
                        created_by="system_init",
                    )
                    db.add(default_staff)
                    db.commit()
                    logger.info("Default municipal staff supervisor STF-01 successfully seeded.")
        except Exception as seed_err:
            logger.warning("Staff account seeding notice: %s", seed_err)
    except Exception as exc:
        logger.warning("Startup DB initialization notice: %s", exc)
    yield


app = FastAPI(
    title="LIYUID Core Backend API",
    description="Multilingual Semantic, Geospatial Matching, Asymmetric Verification, Secure Handover, Staff Control & Audit Engine",
    version="3.0.0",
    lifespan=lifespan,
)

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
@app.get("/api/health", tags=["System"])
def health_check():
    """
    Production health check endpoint for container orchestrators,
    load balancers (ALB/Nginx/Traefik), and uptime monitors.
    """
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
    except Exception as exc:
        db_status = f"error: {str(exc)}"

    redis_status = "connected"
    try:
        if redis_client is not None and redis_client.ping():
            redis_status = "connected"
        else:
            redis_status = "disconnected"
    except Exception as exc:
        redis_status = f"error: {str(exc)}"

    is_healthy = "error" not in db_status
    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if is_healthy else "degraded",
            "version": "3.0.0",
            "environment": os.getenv("ENVIRONMENT", "production"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "services": {
                "database": db_status,
                "redis": redis_status,
            },
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
