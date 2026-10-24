import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.database import get_db
from app.models import AuditLog, Item, Match, User

router = APIRouter(prefix="/admin", tags=["Admin & Audit"])


@router.get("/audit-logs")
def get_admin_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(min(limit, 100)).all()
    return [
        {
            "id": str(log.id),
            "entity_type": log.entity_type,
            "entity_id": str(log.entity_id),
            "action": log.action,
            "severity": log.severity,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.post("/disputes/{item_id}/resolve")
def resolve_admin_dispute(
    item_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    new_status = payload.get("new_status", "active")
    item.status = new_status
    match_record = db.query(Match).filter(
        (Match.found_item_id == item.id) | (Match.lost_item_id == item.id)
    ).first()
    if match_record:
        match_record.verification_attempts = 0
        match_record.is_locked = False
    db.commit()
    return {
        "status": "resolved",
        "item_id": str(item.id),
        "new_status": new_status,
        "notes": payload.get("resolution_notes"),
    }

