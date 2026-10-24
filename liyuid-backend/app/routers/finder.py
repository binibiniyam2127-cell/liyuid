import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models import FinderRequest, Item, Match, User
from app.schemas import FinderRequestResponse

router = APIRouter(prefix="/finder", tags=["Finder Requests"])


@router.get("/requests", response_model=List[FinderRequestResponse])
def get_finder_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    found_item_ids = db.query(Item.id).filter(Item.user_id == current_user.id, Item.type == "found").subquery()
    match_ids = db.query(Match.id).filter(Match.found_item_id.in_(found_item_ids)).subquery()
    return (
        db.query(FinderRequest)
        .filter(FinderRequest.match_id.in_(match_ids))
        .order_by(FinderRequest.created_at.desc())
        .all()
    )


@router.post("/requests/{req_id}/accept")
def accept_finder_request(req_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = db.query(FinderRequest).filter(FinderRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "accepted"
    db.commit()
    return {"status": "accepted"}


@router.post("/requests/{req_id}/defer")
def defer_finder_request(req_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = db.query(FinderRequest).filter(FinderRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = "deferred"
    db.commit()
    return {"status": "deferred"}

