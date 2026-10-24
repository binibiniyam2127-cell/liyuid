import uuid
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_staff
from app.database import get_db
from app.models import StaffAccount, User
from app.schemas import (
    HandoverConfirmRequest,
    HandoverResponse,
    MunicipalIntakePayload,
    MunicipalIntakeResponse,
    MunicipalReleasePayload,
    MunicipalReleaseResponse,
    NotifyMunicipalDropoffPayload,
    NotifyMunicipalDropoffResponse,
)
from app.services import handover_service

router = APIRouter(prefix="/handovers", tags=["Handovers"])


@router.post("/{handover_id}/regenerate")
def regenerate_handover_code(
    handover_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return handover_service.regenerate_handover_code(handover_id, current_user, db)


@router.post("/{handover_id}/confirm", response_model=HandoverResponse)
def confirm_handover(
    handover_id: uuid.UUID,
    payload: Optional[HandoverConfirmRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return handover_service.confirm_handover(handover_id, payload, current_user, db)


@router.get("/{handover_id}", response_model=HandoverResponse)
def get_handover_details(
    handover_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return handover_service.get_handover_details(handover_id, current_user, db)


@router.post("/{handover_id}/notify-municipal", response_model=NotifyMunicipalDropoffResponse)
def notify_municipal_dropoff(
    handover_id: uuid.UUID,
    payload: Optional[NotifyMunicipalDropoffPayload] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return handover_service.notify_municipal_dropoff(handover_id, payload, current_user, db)


@router.post("/{handover_id}/municipal-intake", response_model=MunicipalIntakeResponse, tags=["Staff", "Handovers"])
def municipal_item_intake(
    handover_id: uuid.UUID,
    payload: MunicipalIntakePayload,
    db: Session = Depends(get_db),
    staff: StaffAccount = Depends(require_staff),
):
    return handover_service.municipal_item_intake(handover_id, payload, staff, db)


@router.post("/{handover_id}/municipal-release", response_model=MunicipalReleaseResponse, tags=["Staff", "Handovers"])
def municipal_item_release(
    handover_id: uuid.UUID,
    payload: MunicipalReleasePayload,
    db: Session = Depends(get_db),
    staff: StaffAccount = Depends(require_staff),
):
    return handover_service.municipal_item_release(handover_id, payload, staff, db)

