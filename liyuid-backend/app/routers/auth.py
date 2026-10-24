from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import Token, UserRegister, UserResponse, VerifyOtpRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    return auth_service.register_user(payload, db)


@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    return auth_service.authenticate_user(form_data.username, form_data.password, db)


@router.post("/verify-otp")
def verify_user_otp(
    payload: VerifyOtpRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_service.verify_user_otp(payload, current_user, db)


@router.post("/send-otp")
def send_user_otp(
    current_user: User = Depends(get_current_user),
):
    return auth_service.send_user_otp(current_user)

