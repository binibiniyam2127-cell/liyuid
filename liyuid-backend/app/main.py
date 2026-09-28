import math
import os
import random
import secrets
import shutil
import traceback
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import jwt
from celery import Celery
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from geoalchemy2.elements import WKTElement
from pwdlib import PasswordHash
from pydantic import BaseModel, EmailStr
from sentence_transformers import SentenceTransformer
from sqlalchemy import or_, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import AuditLog, Handover, Item, Match, User

# Ensure database extensions exist before ORM tables are created
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    conn.commit()

# Ensure schema tables exist (including audit_logs table)
Base.metadata.create_all(bind=engine)

# Security Configuration (Argon2id + JWT)
pwd_context = PasswordHash.recommended()
SECRET_KEY = os.getenv("SECRET_KEY") or "ci_testing_secret_key_liyuid_super_secure_32bytes!"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Celery client for non-blocking task queue dispatch
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_client = Celery("liyuid_worker", broker=REDIS_URL)

# Kept for on-demand synchronous manual matching queries
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

app = FastAPI(
    title="LIYUID Core Backend API",
    description="Multilingual Semantic, Geospatial Matching, Asymmetric Verification, Secure Handover, PII Sanitization & Audit Engine (SRS v2.0)",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Document Storage Directories for FR-08 PII Redaction
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
RAW_DIR = os.path.join(UPLOAD_DIR, "quarantine_raw")
SANITIZED_DIR = os.path.join(UPLOAD_DIR, "sanitized_public")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(SANITIZED_DIR, exist_ok=True)


# ==========================================
# Auth & Security Utilities
# ==========================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


# ==========================================
# FR-10 Immutable Audit Logger Helper
# ==========================================
def log_audit_event(
    db: Session,
    entity_type: str,
    entity_id: uuid.UUID,
    action: str,
    severity: str = "info",
    actor_id: Optional[uuid.UUID] = None,
    details: Optional[dict] = None,
) -> AuditLog:
    """Persists an append-only audit event to audit_logs (FR-10)."""
    entry = AuditLog(
        id=uuid.uuid4(),
        entity_type=entity_type,
        entity_id=entity_id,
        actor_id=actor_id,
        action=action,
        severity=severity,
        details=details or {},
        created_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


# ==========================================
# Pydantic Schemas
# ==========================================
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    telegram_chat_id: Optional[str] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    phone_number: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class ItemCreate(BaseModel):
    type: str  # 'lost' or 'found'
    category: str
    brand: Optional[str] = None
    model: Optional[str] = None
    primary_color: str
    public_description: str
    challenge_type: str = "deterministic_code"
    challenge_question: Optional[str] = None
    private_challenge_truth: str
    latitude: float
    longitude: float
    incident_timestamp: datetime


class ItemResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    category: str
    brand: Optional[str] = None
    model: Optional[str] = None
    primary_color: str
    public_description: str
    challenge_type: str
    challenge_question: Optional[str] = None
    status: str
    incident_timestamp: datetime
    approx_latitude: Optional[float] = None
    approx_longitude: Optional[float] = None

    class Config:
        from_attributes = True


class MatchCandidate(BaseModel):
    match_id: Optional[uuid.UUID] = None
    candidate_item_id: uuid.UUID
    composite_score: float
    score_breakdown: dict
    explainable_tags: List[str]


class MatchItemDetail(BaseModel):
    match_id: uuid.UUID
    candidate_item_id: uuid.UUID
    composite_score: float
    is_verified: bool
    score_breakdown: dict
    explainable_tags: List[str]
    category: str
    brand: Optional[str] = None
    model: Optional[str] = None
    primary_color: str
    public_description: str
    status: str
    incident_timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ClaimQuestionResponse(BaseModel):
    item_id: uuid.UUID
    challenge_type: str
    challenge_question: str


class ClaimVerificationRequest(BaseModel):
    challenge_attempt: str


class ClaimVerificationResponse(BaseModel):
    verified: bool
    status: str
    message: str
    attempts_remaining: int
    handover_id: Optional[uuid.UUID] = None
    one_time_handover_code: Optional[str] = None


class HandoverConfirmRequest(BaseModel):
    handover_code: str
    role: str  # 'owner' or 'finder'


class HandoverConfirmResponse(BaseModel):
    handover_id: uuid.UUID
    status: str
    message: str
    is_fully_closed: bool


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    actor_id: Optional[uuid.UUID] = None
    action: str
    severity: str
    details: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DisputeResolutionRequest(BaseModel):
    new_status: str  # 'active', 'resolved_closed', 'dismissed'
    resolution_notes: str


@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "online",
        "service": "LIYUID Core API (SRS v2.0 - FR-01 through FR-10 Complete)",
        "docs": "/docs",
    }


# ==========================================
# 1. Authentication Endpoints (FR-01)
# ==========================================
@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    filters = [User.email == payload.email]
    if payload.phone_number:
        filters.append(User.phone_number == payload.phone_number)

    existing = db.query(User).filter(or_(*filters)).first()
    if existing:
        if existing.email == payload.email:
            msg = "Email already registered"
        else:
            msg = "Phone number already registered"
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=msg)

    new_user = User(
        id=uuid.uuid4(),
        email=payload.email,
        phone_number=payload.phone_number,
        telegram_chat_id=payload.telegram_chat_id,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        log_audit_event(
            db,
            entity_type="auth",
            entity_id=new_user.id,
            action="user_registered",
            severity="info",
            actor_id=new_user.id,
            details={"email": new_user.email},
        )

        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already registered with provided email or phone number.",
        )


@app.post("/auth/token", response_model=Token, tags=["Auth"])
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# 2. Report Ingestion & Jittered Privacy Endpoints (FR-02 & FR-03)
# ==========================================
@app.post("/reports", response_model=ItemResponse, status_code=status.HTTP_201_CREATED, tags=["Reports"])
def create_report(
    payload: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    location_wkt = WKTElement(
        f"POINT({payload.longitude} {payload.latitude})",
        srid=4326,
    )

    default_question = payload.challenge_question
    if not default_question:
        if payload.challenge_type == "deterministic_code":
            default_question = "What are the last 4 digits of the serial/IMEI/ID number?"
        else:
            default_question = "Describe the hidden marker, unique scratch, or internal contents."

    new_item = Item(
        id=uuid.uuid4(),
        user_id=current_user.id,
        type=payload.type.lower(),
        category=payload.category.lower(),
        brand=payload.brand,
        model=payload.model,
        primary_color=payload.primary_color.lower(),
        public_description=payload.public_description,
        challenge_type=payload.challenge_type,
        challenge_question=default_question,
        private_challenge_truth=payload.private_challenge_truth,
        location=location_wkt,
        incident_timestamp=payload.incident_timestamp,
        text_embedding=None,
        status="active",
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    log_audit_event(
        db,
        entity_type="item",
        entity_id=new_item.id,
        action="report_created",
        severity="info",
        actor_id=current_user.id,
        details={"type": new_item.type, "category": new_item.category},
    )

    try:
        celery_client.send_task(
            "tasks.process_item_embedding_and_match",
            args=[str(new_item.id)],
        )
    except Exception as exc:
        print(f"[Warning] Failed to enqueue Celery task: {exc}")

    lat_noise = random.uniform(-0.0045, 0.0045)
    lon_noise = random.uniform(-0.0045, 0.0045)

    response_data = ItemResponse.model_validate(new_item)
    response_data.approx_latitude = round(payload.latitude + lat_noise, 6)
    response_data.approx_longitude = round(payload.longitude + lon_noise, 6)

    return response_data


# ==========================================
# 3. Document Upload & Automated PII Redaction (FR-08)
# ==========================================
@app.post(
    "/reports/{item_id}/upload-document",
    tags=["Reports"],
    summary="Upload found document photo for automated PII redaction (FR-08)",
)
def upload_document_image(
    item_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )

    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to upload files for this report.",
        )

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Please upload one of: {allowed_extensions}",
        )

    safe_filename = f"{item.id}_{int(datetime.now(timezone.utc).timestamp())}{file_ext}"
    raw_path = os.path.join(RAW_DIR, safe_filename)
    sanitized_path = os.path.join(SANITIZED_DIR, f"sanitized_{safe_filename}")

    with open(raw_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        celery_client.send_task(
            "tasks.sanitize_document_image",
            args=[raw_path, sanitized_path],
        )
        task_dispatched = True
    except Exception as exc:
        task_dispatched = False
        print(f"[Warning] Failed to enqueue sanitization task: {exc}")

    log_audit_event(
        db,
        entity_type="item",
        entity_id=item.id,
        action="document_uploaded_for_sanitization",
        severity="info",
        actor_id=current_user.id,
        details={"raw_file": safe_filename, "task_enqueued": task_dispatched},
    )

    return {
        "status": "processing",
        "item_id": item.id,
        "original_filename": file.filename,
        "task_enqueued": task_dispatched,
        "sanitized_preview_target": f"sanitized_{safe_filename}",
        "message": "Document quarantined. Celery worker is redacting PII in background.",
    }


# ==========================================
# 4. User Report History & Match Inbox Endpoints (FR-04)
# ==========================================
@app.get(
    "/reports/mine",
    response_model=List[ItemResponse],
    tags=["Reports"],
    summary="List all reports created by the authenticated user",
)
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_items = (
        db.query(Item)
        .filter(Item.user_id == current_user.id)
        .order_by(Item.incident_timestamp.desc())
        .all()
    )

    results: List[ItemResponse] = []
    for item in user_items:
        item_dto = ItemResponse.model_validate(item)
        results.append(item_dto)

    return results


@app.get(
    "/reports/{item_id}/matches",
    response_model=List[MatchItemDetail],
    tags=["Reports"],
    summary="Retrieve candidate matches for a given report",
)
def get_report_matches(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    source_item = db.query(Item).filter(Item.id == item_id).first()
    if not source_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )

    if source_item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view matches for this item.",
        )

    matches = (
        db.query(Match)
        .filter(
            or_(
                Match.lost_item_id == source_item.id,
                Match.found_item_id == source_item.id,
            )
        )
        .order_by(Match.composite_score.desc())
        .all()
    )

    match_results: List[MatchItemDetail] = []

    for m in matches:
        counterpart_id = m.found_item_id if source_item.id == m.lost_item_id else m.lost_item_id
        candidate = db.query(Item).filter(Item.id == counterpart_id).first()

        if not candidate:
            continue

        breakdown = m.score_breakdown or {}
        tags: List[str] = []

        dist = breakdown.get("distance_km")
        if dist is not None:
            if dist <= 1.0:
                tags.append("within_1km")
            elif dist <= 5.0:
                tags.append("within_5km")

        sem_score = breakdown.get("semantic_similarity", 0.0)
        if sem_score >= 0.70:
            tags.append("high_semantic_similarity")

        if breakdown.get("brand_match") == 1.0:
            tags.append("same_brand")
        if breakdown.get("color_match") == 1.0:
            tags.append("same_color")

        match_results.append(
            MatchItemDetail(
                match_id=m.id,
                candidate_item_id=candidate.id,
                composite_score=m.composite_score,
                is_verified=m.is_verified,
                score_breakdown=breakdown,
                explainable_tags=tags,
                category=candidate.category,
                brand=candidate.brand,
                model=candidate.model,
                primary_color=candidate.primary_color,
                public_description=candidate.public_description,
                status=candidate.status,
                incident_timestamp=candidate.incident_timestamp,
                created_at=candidate.created_at,
            )
        )

    return match_results


# ==========================================
# 5. Two-Stage Matching (Stage 1 & Stage 2)
# ==========================================
@app.post("/reports/{item_id}/find-matches", response_model=List[MatchCandidate], tags=["Reports"])
def find_candidate_matches(item_id: uuid.UUID, db: Session = Depends(get_db)):
    source_item = db.query(Item).filter(Item.id == item_id).first()
    if not source_item:
        raise HTTPException(status_code=404, detail="Item not found")

    target_type = "found" if source_item.type == "lost" else "lost"

    if source_item.text_embedding is not None:
        if hasattr(source_item.text_embedding, "tolist"):
            source_embed_str = str(source_item.text_embedding.tolist())
        else:
            source_embed_str = str(list(source_item.text_embedding))
    else:
        computed = model.encode(source_item.public_description).tolist()
        source_embed_str = str(computed)

    query = text(
        """
        WITH source AS (
            SELECT location, incident_timestamp FROM items WHERE id = :source_id
        )
        SELECT 
            i.id, i.type, i.category, i.brand, i.model, i.primary_color, i.public_description, i.incident_timestamp,
            ST_Distance(i.location::geography, s.location::geography) / 1000.0 AS distance_km,
            1 - (i.text_embedding <=> CAST(:source_embed AS vector)) AS cosine_sim,
            ABS(EXTRACT(EPOCH FROM (i.incident_timestamp - s.incident_timestamp))) / 3600.0 AS hours_diff
        FROM items i, source s
        WHERE i.type = :target_type
          AND i.category = :category
          AND i.status = 'active'
          AND i.text_embedding IS NOT NULL
          AND ST_DWithin(i.location::geography, s.location::geography, 15000)
        ORDER BY cosine_sim DESC
        LIMIT 20;
        """
    )

    raw_matches = (
        db.execute(
            query,
            {
                "source_id": source_item.id,
                "source_embed": source_embed_str,
                "target_type": target_type,
                "category": source_item.category,
            },
        )
        .mappings()
        .all()
    )

    candidates: List[MatchCandidate] = []

    for row in raw_matches:
        distance_km = float(row["distance_km"]) if row["distance_km"] is not None else 15.0
        cosine_sim = float(row["cosine_sim"]) if row["cosine_sim"] is not None else 0.0
        hours_diff = float(row["hours_diff"]) if row["hours_diff"] is not None else 72.0

        s_sem = max(0.0, cosine_sim)
        s_geo = max(0.0, 1.0 - (distance_km / 15.0))
        s_time = max(0.0, 1.0 - min(hours_diff / 72.0, 1.0))

        brand_match = (
            1.0
            if (source_item.brand and row["brand"] and source_item.brand.lower() == row["brand"].lower())
            else 0.0
        )
        color_match = (
            1.0
            if (
                source_item.primary_color
                and row["primary_color"]
                and source_item.primary_color.lower() == row["primary_color"].lower()
            )
            else 0.0
        )
        s_attr = (brand_match * 0.6) + (color_match * 0.4)

        composite_score = round(
            (s_sem * 0.40) + (s_attr * 0.30) + (s_geo * 0.15) + (s_time * 0.15),
            4,
        )

        tags = []
        if distance_km <= 1.0:
            tags.append("within_1km")
        elif distance_km <= 5.0:
            tags.append("within_5km")

        if s_sem >= 0.70:
            tags.append("high_semantic_similarity")
        if brand_match == 1.0:
            tags.append("same_brand")
        if color_match == 1.0:
            tags.append("same_color")

        lost_id = source_item.id if source_item.type == "lost" else row["id"]
        found_id = row["id"] if source_item.type == "lost" else source_item.id

        match_record = db.query(Match).filter(
            Match.lost_item_id == lost_id,
            Match.found_item_id == found_id,
        ).first()

        breakdown_payload = {
            "semantic_similarity": round(s_sem, 4),
            "attribute_similarity": round(s_attr, 4),
            "distance_km": round(distance_km, 2),
            "hours_difference": round(hours_diff, 1),
            "brand_match": brand_match,
            "color_match": color_match,
        }

        if not match_record:
            match_record = Match(
                lost_item_id=lost_id,
                found_item_id=found_id,
                composite_score=composite_score,
                score_breakdown=breakdown_payload,
            )
            db.add(match_record)
            db.commit()
            db.refresh(match_record)

        candidates.append(
            MatchCandidate(
                match_id=match_record.id,
                candidate_item_id=row["id"],
                composite_score=composite_score,
                score_breakdown=breakdown_payload,
                explainable_tags=tags,
            )
        )

    candidates.sort(key=lambda x: x.composite_score, reverse=True)
    return candidates


# ==========================================
# 6. Asymmetric Verification with Rate-Limiting & Audit Lockout (FR-05 & FR-10)
# ==========================================
@app.get("/reports/{item_id}/challenge", response_model=ClaimQuestionResponse, tags=["Verification"])
def get_challenge_question(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return ClaimQuestionResponse(
        item_id=item.id,
        challenge_type=item.challenge_type,
        challenge_question=item.challenge_question or "Please provide the ownership verification details.",
    )


@app.post("/reports/{item_id}/verify-claim", response_model=ClaimVerificationResponse, tags=["Verification"])
def verify_item_claim(
    item_id: uuid.UUID,
    payload: ClaimVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        if item.status != "active":
            raise HTTPException(
                status_code=400,
                detail=f"This item is no longer available (current status: {item.status})",
            )

        match_record = db.query(Match).filter(
            or_(Match.found_item_id == item.id, Match.lost_item_id == item.id)
        ).first()

        # Ensure valid Match record exists to satisfy ForeignKey on handovers.match_id
        # Ensure valid Match record exists to satisfy ForeignKey on handovers.match_id
        if not match_record:
            match_record = Match(
                id=uuid.uuid4(),
                lost_item_id=item.id if item.type == "lost" else item.id,
                found_item_id=item.id if item.type == "found" else item.id,
                composite_score=1.0,
                score_breakdown={"fallback_direct_claim": 1.0, "source": "direct_verification"},
                verification_attempts=0,
                is_verified=False,
            )
            db.add(match_record)
            db.commit()
            db.refresh(match_record)

        current_attempts = match_record.verification_attempts or 0

        if current_attempts >= 3:
            raise HTTPException(
                status_code=403,
                detail="Verification locked: Exceeded maximum allowed attempts (3). Flagged for administrative review.",
            )

        normalized_truth = (item.private_challenge_truth or "").strip().lower()
        normalized_attempt = (payload.challenge_attempt or "").strip().lower()
        is_valid = secrets.compare_digest(normalized_truth, normalized_attempt)

        if not is_valid:
            match_record.verification_attempts = current_attempts + 1
            db.commit()
            attempts_used = match_record.verification_attempts
            remaining = max(0, 3 - attempts_used)

            # Log individual failure audit event (FR-10)
            log_audit_event(
                db,
                entity_type="item",
                entity_id=item.id,
                action="claim_attempt_failed",
                severity="warning",
                actor_id=current_user.id,
                details={"attempts_used": attempts_used, "remaining": remaining},
            )

            # Trigger critical brute-force lockout if 3 attempts reached
            if attempts_used >= 3:
                item.status = "disputed_locked"
                db.commit()
                log_audit_event(
                    db,
                    entity_type="item",
                    entity_id=item.id,
                    action="brute_force_lockout",
                    severity="critical",
                    actor_id=current_user.id,
                    details={
                        "reason": "Exceeded 3 consecutive failed verification attempts",
                        "status_set": "disputed_locked",
                    },
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Verification locked: Exceeded maximum allowed attempts (3). Flagged for administrative review.",
                )

            return ClaimVerificationResponse(
                verified=False,
                status="failed",
                message="Verification challenge failed. The provided details do not match.",
                attempts_remaining=remaining,
                handover_id=None,
                one_time_handover_code=None,
            )

        # Verification succeeded
        item.status = "matched_pending_handoff"
        match_record.is_verified = True
        match_record.verification_attempts = current_attempts + 1

        # Cryptographic One-Time Handover Token (FR-07)
        raw_handover_code = secrets.token_hex(4).upper()
        code_hash = pwd_context.hash(raw_handover_code)

        # Upsert handover to satisfy unique constraint on match_id
        handover = db.query(Handover).filter(Handover.match_id == match_record.id).first()
        if handover:
            handover.handover_code_hash = code_hash
            handover.owner_confirmed = False
            handover.finder_confirmed = False
            handover.completed_at = None
        else:
            handover = Handover(
                id=uuid.uuid4(),
                match_id=match_record.id,
                handover_code_hash=code_hash,
                owner_confirmed=False,
                finder_confirmed=False,
            )
            db.add(handover)

        db.commit()
        db.refresh(handover)

        # Log successful verification audit event (FR-10)
        log_audit_event(
            db,
            entity_type="item",
            entity_id=item.id,
            action="claim_verified_success",
            severity="info",
            actor_id=current_user.id,
            details={"handover_id": str(handover.id)},
        )

        return ClaimVerificationResponse(
            verified=True,
            status="verified",
            message="Ownership verified successfully! Present this one-time code at the physical handoff.",
            attempts_remaining=max(0, 3 - match_record.verification_attempts),
            handover_id=handover.id,
            one_time_handover_code=raw_handover_code,
        )

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        print("\n" + "=" * 50)
        print("EXACT VERIFY-CLAIM CRASH TRACEBACK:")
        traceback.print_exc()
        print("=" * 50 + "\n")
        raise HTTPException(
            status_code=500,
            detail=f"Claim processing internal failure: {str(exc)}",
        )


# ==========================================
# 7. Dual Handover Confirmation & Closure (FR-07 & FR-09)
# ==========================================
@app.post("/handovers/{handover_id}/confirm", response_model=HandoverConfirmResponse, tags=["Handovers"])
def confirm_handover(
    handover_id: uuid.UUID,
    payload: HandoverConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    handover = db.query(Handover).filter(Handover.id == handover_id).first()
    if not handover:
        raise HTTPException(status_code=404, detail="Handover record not found")

    if handover.completed_at is not None:
        return HandoverConfirmResponse(
            handover_id=handover.id,
            status="already_completed",
            message="This case has already been resolved and closed.",
            is_fully_closed=True,
        )

    if not pwd_context.verify(payload.handover_code.strip().upper(), handover.handover_code_hash):
        raise HTTPException(status_code=400, detail="Invalid handover code.")

    role = payload.role.strip().lower()
    if role == "owner":
        handover.owner_confirmed = True
    elif role == "finder":
        handover.finder_confirmed = True
    else:
        raise HTTPException(status_code=400, detail="Role must be 'owner' or 'finder'")

    if handover.owner_confirmed and handover.finder_confirmed:
        handover.completed_at = datetime.now(timezone.utc)

        match = db.query(Match).filter(Match.id == handover.match_id).first()
        if match:
            lost_item = db.query(Item).filter(Item.id == match.lost_item_id).first()
            found_item = db.query(Item).filter(Item.id == match.found_item_id).first()
            if lost_item:
                lost_item.status = "resolved_closed"
            if found_item:
                found_item.status = "resolved_closed"

        db.commit()

        # Log mutual closure audit event (FR-10)
        log_audit_event(
            db,
            entity_type="handover",
            entity_id=handover.id,
            action="handover_mutually_closed",
            severity="info",
            actor_id=current_user.id,
            details={"match_id": str(handover.match_id), "completed_at": str(handover.completed_at)},
        )

        return HandoverConfirmResponse(
            handover_id=handover.id,
            status="completed",
            message="Both owner and finder confirmed! Case is officially closed.",
            is_fully_closed=True,
        )

    db.commit()
    return HandoverConfirmResponse(
        handover_id=handover.id,
        status="partially_confirmed",
        message=f"{role.capitalize()} confirmed. Awaiting confirmation from the other party.",
        is_fully_closed=False,
    )


# ==========================================
# 8. FR-10 Immutable Audit Logs & Dispute Resolution
# ==========================================
@app.get(
    "/admin/audit-logs",
    response_model=List[AuditLogResponse],
    tags=["Admin & Audit"],
    summary="Retrieve immutable security and dispute audit trail (FR-10)",
)
def get_audit_logs(
    severity: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if severity:
        query = query.filter(AuditLog.severity == severity.lower())
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type.lower())

    return query.order_by(AuditLog.created_at.desc()).limit(min(limit, 100)).all()


@app.post(
    "/admin/disputes/{item_id}/resolve",
    tags=["Admin & Audit"],
    summary="Administrative override and dispute resolution (FR-10)",
)
def resolve_disputed_item(
    item_id: uuid.UUID,
    payload: DisputeResolutionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    old_status = item.status
    item.status = payload.new_status

    # Reset verification attempts so claims can be re-attempted after admin unlock
    match_record = db.query(Match).filter(
        (Match.found_item_id == item.id) | (Match.lost_item_id == item.id)
    ).first()
    if match_record:
        match_record.verification_attempts = 0

    db.commit()

    # Log administrative intervention in audit log (FR-10)
    log_audit_event(
        db,
        entity_type="item",
        entity_id=item.id,
        action="admin_dispute_resolved",
        severity="warning",
        actor_id=current_user.id,
        details={
            "old_status": old_status,
            "new_status": payload.new_status,
            "notes": payload.resolution_notes,
            "verification_attempts_reset": True if match_record else False,
        },
    )

    return {
        "status": "resolved",
        "item_id": item.id,
        "previous_status": old_status,
        "current_status": item.status,
        "resolution_notes": payload.resolution_notes,
    }