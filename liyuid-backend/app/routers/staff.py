import uuid
from typing import List

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    COOKIE_DOMAIN,
    COOKIE_SAMESITE,
    COOKIE_SECURE,
)
from app.core.dependencies import require_staff
from app.database import get_db
from app.models import Flag, StaffAccount
from app.schemas import FlagResponse, ResolveFlagPayload, StaffLoginRequest
from app.services import auth_service, staff_service

router = APIRouter(prefix="/staff", tags=["Staff"])


@router.post("/auth/login")
def staff_login(
    response: Response,
    payload: StaffLoginRequest,
    db: Session = Depends(get_db),
):
    res = auth_service.authenticate_staff(payload, db)
    if isinstance(res, dict) and "access_token" in res:
        response.set_cookie(
            key="staff_access_token",
            value=res["access_token"],
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=COOKIE_DOMAIN,
            path="/",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    return res


@router.get("/me")
def get_current_staff_profile(staff: StaffAccount = Depends(require_staff)):
    return {
        "id": str(staff.id),
        "staff_code": staff.staff_code,
        "full_name": staff.full_name or "Addis Ababa Municipal Supervisor",
        "staff_role": staff.staff_role or "Senior Operations Supervisor",
        "email": staff.email,
        "clearance_level": "Tier-3 Municipal Supervisor",
        "jurisdiction": "City Administration of Addis Ababa",
        "active_desk": "Central Operations Headquarters",
    }


@router.get("/flags", response_model=List[FlagResponse])
def list_flags(db: Session = Depends(get_db), staff: StaffAccount = Depends(require_staff)):
    return db.query(Flag).filter(Flag.status == "pending").order_by(Flag.created_at.desc()).all()


@router.post("/flags/{flag_id}/resolve")
def resolve_flag(
    flag_id: uuid.UUID,
    payload: ResolveFlagPayload,
    db: Session = Depends(get_db),
    staff: StaffAccount = Depends(require_staff),
):
    return staff_service.resolve_flag(flag_id, payload, staff, db)


@router.get("/dashboard/overview")
def staff_dashboard_overview(
    db: Session = Depends(get_db),
    staff: StaffAccount = Depends(require_staff),
):
    return staff_service.get_dashboard_overview(staff, db)


@router.post("/cases/{match_id}/resolve")
def staff_resolve_case(
    match_id: uuid.UUID,
    payload: ResolveFlagPayload,
    db: Session = Depends(get_db),
    staff: StaffAccount = Depends(require_staff),
):
    return staff_service.staff_resolve_case(match_id, payload, staff, db)


@router.get("/cases")
def list_staff_cases(
    db: Session = Depends(get_db),
    staff: StaffAccount = Depends(require_staff),
):
    return staff_service.list_staff_cases(staff, db)


@router.get("/disputes")
def list_staff_disputes(
    db: Session = Depends(get_db),
    staff: StaffAccount = Depends(require_staff),
):
    return staff_service.list_staff_disputes(staff, db)


@router.post("/disputes/{dispute_id}/resolve")
def resolve_staff_dispute(
    dispute_id: str,
    payload: ResolveFlagPayload,
    db: Session = Depends(get_db),
    staff: StaffAccount = Depends(require_staff),
):
    return staff_service.resolve_staff_dispute(dispute_id, payload, staff, db)


@router.get("/reports")
def get_staff_reports_overview(
    db: Session = Depends(get_db),
    staff: StaffAccount = Depends(require_staff),
):
    return staff_service.get_staff_reports_overview(staff, db)


@router.get("/analytics")
def get_staff_analytics_overview(
    db: Session = Depends(get_db),
    staff: StaffAccount = Depends(require_staff),
):
    return staff_service.get_staff_analytics_overview(staff, db)

