import uuid
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.audit import log_audit_event
from app.core.config import ALGORITHM, SECRET_KEY, STAFF_AUDIENCE, USER_AUDIENCE
from app.core.security import oauth2_scheme, oauth2_scheme_optional
from app.core.session import is_token_revoked
from app.database import get_db
from app.models import StaffAccount, User


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    auth_token = token or request.cookies.get("access_token")
    if not auth_token:
        raise credentials_exception

    if is_token_revoked(auth_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(auth_token, SECRET_KEY, algorithms=[ALGORITHM], audience=USER_AUDIENCE)
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user


def require_staff(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> StaffAccount:
    auth_token = token or request.cookies.get("staff_access_token") or request.cookies.get("access_token")
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if is_token_revoked(auth_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff session has been revoked. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(auth_token, SECRET_KEY, algorithms=[ALGORITHM], audience=STAFF_AUDIENCE)
        staff_id = uuid.UUID(payload.get("sub"))
    except (jwt.PyJWTError, ValueError):
        log_audit_event(
            db,
            entity_type="auth",
            entity_id=uuid.uuid4(),
            action="unauthorized_staff_attempt",
            severity="warning",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff privileges required to access this resource.",
        )
    staff = db.query(StaffAccount).filter(StaffAccount.id == staff_id, StaffAccount.is_active == True).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff account deactivated")
    return staff


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource.",
        )
    return current_user

