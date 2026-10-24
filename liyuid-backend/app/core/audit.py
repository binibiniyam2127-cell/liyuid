import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models import AuditLog


def log_audit_event(
    db: Session,
    entity_type: str,
    entity_id: uuid.UUID,
    action: str,
    severity: str = "info",
    actor_id: Optional[uuid.UUID] = None,
    details: Optional[dict] = None,
) -> AuditLog:
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

