import uuid
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models import Item, User
from app.schemas import (
    ClaimVerifyPayload,
    ItemResponse,
    MatchCandidate,
    MatchItemDetail,
    ReportCreate,
)
from app.services import matching_service, reports_service
from app.verification_service import get_report_challenge, verify_item_claim

router = APIRouter(tags=["Reports"])


@router.post("/reports", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return reports_service.create_report(payload, current_user, db)


@router.get("/reports/mine", response_model=List[ItemResponse])
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return reports_service.get_user_reports(current_user, db)


@router.get("/reports/{item_id}/matches", response_model=List[MatchItemDetail])
def get_report_matches(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return reports_service.get_report_matches(item_id, current_user, db)


@router.post("/reports/{item_id}/upload-document")
def upload_document_image(
    item_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return reports_service.upload_document_image(item_id, file, current_user, db)


@router.post("/reports/{item_id}/find-matches", response_model=List[MatchCandidate])
def find_candidate_matches(item_id: uuid.UUID, db: Session = Depends(get_db)):
    return matching_service.find_candidate_matches(item_id, db)


@router.get("/reports/{item_id}/challenge", tags=["Verification"])
def get_item_report_challenge(item_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_report_challenge(item_id, db)


@router.post("/reports/{item_id}/verify-claim", tags=["Verification"])
def verify_item_report_claim(
    item_id: uuid.UUID,
    payload: ClaimVerifyPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return verify_item_claim(item_id, payload.challenge_attempt, current_user, db)

