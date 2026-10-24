import logging
import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.audit import log_audit_event
from app.core.config import RAW_DIR, SANITIZED_DIR, celery_client
from app.core.security import compute_deterministic_centroid, compute_proof_hash
from app.models import Item, Match, User
from app.schemas import MatchItemDetail, ReportCreate
from app.verification_service import encrypt_detail, normalize_nfc

logger = logging.getLogger("liyuid.backend")


def create_report(payload: ReportCreate, current_user: User, db: Session) -> Item:
    desc_norm = normalize_nfc(payload.public_description)
    brand_norm = normalize_nfc(payload.brand)
    model_norm = normalize_nfc(payload.model)
    color_norm = normalize_nfc(payload.primary_color)

    item_id = uuid.uuid4()
    proof_primary_hash = None
    private_detail_encrypted = None

    if payload.type == "lost":
        if payload.proof_kind or payload.proof_primary or payload.private_detail:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Lost item reports must not contain private verification proofs or challenges.",
            )
    else:  # found
        if not payload.proof_kind or not payload.proof_primary or not payload.private_detail:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Found item reports require proof_kind, proof_primary, and private_detail.",
            )
        proof_primary_hash = compute_proof_hash(normalize_nfc(payload.proof_primary))
        private_detail_encrypted = encrypt_detail(normalize_nfc(payload.private_detail))

    point_wkt = compute_deterministic_centroid(payload.sub_city, item_id)

    new_item = Item(
        id=item_id,
        user_id=current_user.id,
        type=payload.type,
        category=payload.category.value,
        sub_city=payload.sub_city.value,
        brand=brand_norm,
        model=model_norm,
        primary_color=color_norm,
        public_description=desc_norm,
        challenge_type="deterministic_proof",
        private_challenge_truth=None,
        proof_kind=payload.proof_kind.value if payload.proof_kind else None,
        proof_primary_hash=proof_primary_hash,
        private_detail_encrypted=private_detail_encrypted,
        location=point_wkt,
        incident_timestamp=payload.date_from,
        date_from=payload.date_from,
        date_to=payload.date_to,
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
        details={"type": new_item.type, "category": new_item.category, "sub_city": new_item.sub_city},
    )

    try:
        celery_client.send_task(
            "tasks.process_item_embedding_and_match",
            args=[str(new_item.id)],
        )
    except Exception as exc:
        logger.warning("Could not dispatch Celery task for %s: %s", new_item.id, exc)
        new_item.status = "embedding_pending"
        db.commit()
        db.refresh(new_item)

    return new_item


def get_user_reports(current_user: User, db: Session) -> List[Item]:
    return db.query(Item).filter(Item.user_id == current_user.id).order_by(Item.created_at.desc()).all()


def get_report_matches(item_id: uuid.UUID, current_user: User, db: Session) -> List[MatchItemDetail]:
    source_item = db.query(Item).filter(Item.id == item_id).first()
    if not source_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    if source_item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to view matches for this item.")

    matches = db.query(Match).filter(
        or_(Match.lost_item_id == source_item.id, Match.found_item_id == source_item.id)
    ).order_by(Match.composite_score.desc()).all()

    match_results: List[MatchItemDetail] = []
    for m in matches:
        counterpart_id = m.found_item_id if source_item.id == m.lost_item_id else m.lost_item_id
        candidate = db.query(Item).filter(Item.id == counterpart_id).first()
        if not candidate:
            continue

        candidate_owner = db.query(User).filter(User.id == candidate.user_id).first()
        finder_display_name = candidate_owner.display_name if candidate_owner else "AnonymousUser"

        breakdown = m.score_breakdown or {}
        tags: List[str] = breakdown.get("tags", [])

        match_results.append(
            MatchItemDetail(
                match_id=m.id,
                candidate_item_id=candidate.id,
                finder_display_name=finder_display_name,
                composite_score=m.composite_score,
                is_verified=m.is_verified,
                is_locked=m.is_locked,
                score_breakdown=breakdown,
                explainable_tags=tags,
                category=candidate.category,
                sub_city=candidate.sub_city,
                brand=candidate.brand,
                model=candidate.model,
                primary_color=candidate.primary_color,
                public_description=candidate.public_description,
                status=candidate.status,
                date_from=candidate.date_from,
                date_to=candidate.date_to,
                created_at=candidate.created_at,
            )
        )
    return match_results


def upload_document_image(item_id: uuid.UUID, file: UploadFile, current_user: User, db: Session) -> dict:
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    if item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized for this report.")

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported format. Allowed: {allowed_extensions}")

    safe_filename = f"{item.id}_{int(datetime.now(timezone.utc).timestamp())}{file_ext}"
    raw_path = os.path.join(RAW_DIR, safe_filename)
    sanitized_path = os.path.join(SANITIZED_DIR, f"sanitized_{safe_filename}")

    with open(raw_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        celery_client.send_task("tasks.sanitize_document_image", args=[raw_path, sanitized_path])
        task_dispatched = True
    except Exception as exc:
        task_dispatched = False
        logger.warning("Failed to enqueue sanitization task: %s", exc)

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

