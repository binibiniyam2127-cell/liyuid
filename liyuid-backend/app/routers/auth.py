from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.audit import log_audit_event
from app.core.dependencies import get_current_user
from app.core.rate_limit import RateLimiter
from app.core.security import oauth2_scheme
from app.core.session import revoke_token
from app.database import get_db
from app.models import User
from app.schemas import Token, UserRegister, UserResponse, VerifyOtpRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(limit=10, window_seconds=60, by="ip", scope="auth:register"))],
)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    return auth_service.register_user(payload, db)


@router.post(
    "/token",
    response_model=Token,
    dependencies=[Depends(RateLimiter(limit=10, window_seconds=60, by="ip", scope="auth:token"))],
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    return auth_service.authenticate_user(form_data.username, form_data.password, db)


@router.post(
    "/verify-otp",
    dependencies=[Depends(RateLimiter(limit=10, window_seconds=60, by="ip", scope="auth:verify-otp"))],
)
def verify_user_otp(
    payload: VerifyOtpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_service.verify_user_otp(payload, current_user, db)


@router.post(
    "/send-otp",
    dependencies=[Depends(RateLimiter(limit=5, window_seconds=60, by="ip", scope="auth:send-otp"))],
)
def send_user_otp(
    current_user: User = Depends(get_current_user),
):
    return auth_service.send_user_otp(current_user)


@router.post("/logout")
def logout_user(
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    revoke_token(token)
    log_audit_event(
        db,
        entity_type="user",
        entity_id=current_user.id,
        action="user_logged_out",
        severity="info",
        actor_id=current_user.id,
    )
    return {"status": "success", "message": "Successfully logged out and session revoked."}
