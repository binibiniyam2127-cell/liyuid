from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.audit import log_audit_event
from app.core.dependencies import get_current_user
from app.core.rate_limit import RateLimiter
from app.core.security import oauth2_scheme_optional
from app.core.session import clear_auth_cookies, revoke_token, set_auth_cookies
from app.database import get_db
from app.models import User
from app.schemas import RefreshTokenRequest, Token, UserRegister, UserResponse, VerifyOtpRequest
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
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    token_data = auth_service.authenticate_user(form_data.username, form_data.password, db)
    set_auth_cookies(
        response,
        access_token=token_data["access_token"],
        refresh_token=token_data.get("refresh_token"),
    )
    return token_data


@router.post(
    "/refresh",
    response_model=Token,
    dependencies=[Depends(RateLimiter(limit=20, window_seconds=60, by="ip", scope="auth:refresh"))],
)
def refresh_access_token(
    request: Request,
    response: Response,
    payload: Optional[RefreshTokenRequest] = None,
    db: Session = Depends(get_db),
):
    """Rotates refresh token and issues a new access token & refreshed cookies."""
    refresh_token = (
        (payload.refresh_token if payload else None)
        or request.cookies.get("refresh_token")
    )
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token in request body or cookie",
            headers={"WWW-Authenticate": "Bearer"},
        )

    new_token_data = auth_service.rotate_refresh_token(refresh_token, db)
    set_auth_cookies(
        response,
        access_token=new_token_data["access_token"],
        refresh_token=new_token_data.get("refresh_token"),
    )
    return new_token_data


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Returns the authenticated user profile based on cookie or Bearer token."""
    return current_user


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
    request: Request,
    response: Response,
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
):
    """Revokes session tokens and clears httpOnly cookies."""
    access_token = token or request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")

    user_id = None
    if access_token:
        try:
            revoke_token(access_token)
        except Exception:
            pass

    if refresh_token:
        try:
            revoke_token(refresh_token)
        except Exception:
            pass

    clear_auth_cookies(response)

    return {"status": "success", "message": "Successfully logged out and session revoked."}
