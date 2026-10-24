import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import UserSettingsResponse

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.post("/telegram/link")
def create_telegram_link(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    code = secrets.token_urlsafe(16)
    current_user.telegram_link_code = code
    current_user.telegram_state = "waiting"
    current_user.telegram_link_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()
    deep_link = f"https://t.me/liyuid_alert_bot?start={code}"
    return {
        "link": deep_link,
        "deep_link": deep_link,
        "bot_username": "liyuid_alert_bot",
        "code": code,
        "expires_in_seconds": 900,
    }


@router.post("/telegram/webhook")
def telegram_webhook(update: dict, db: Session = Depends(get_db)):
    """
    Incoming Telegram Webhook handler for @liyuid_alert_bot.
    When a user taps 'START', Telegram sends: /start <link_code>.
    """
    message = update.get("message", {})
    text = message.get("text", "")
    chat = message.get("chat", {})
    chat_id = str(chat.get("id", ""))

    if text.startswith("/start") and chat_id:
        parts = text.split(maxsplit=1)
        if len(parts) > 1:
            link_code = parts[1].strip()
            user = db.query(User).filter(User.telegram_link_code == link_code).first()
            if user:
                user.telegram_chat_id = chat_id
                user.telegram_state = "linked"
                db.commit()
                return {"status": "ok", "message": f"Linked to user {user.display_name}"}
    return {"status": "ignored"}


@router.post("/telegram/simulate-link")
def simulate_telegram_link(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Simulates immediate bot linking for dev/testing."""
    current_user.telegram_chat_id = f"tg_{current_user.id}"
    current_user.telegram_state = "linked"
    db.commit()
    return {"status": "success", "telegram_state": "linked", "bot_username": "liyuid_alert_bot"}


@router.get("", response_model=UserSettingsResponse)
def get_user_settings(current_user: User = Depends(get_current_user)):
    return UserSettingsResponse(
        display_name=current_user.display_name,
        phone_verified=current_user.phone_verified,
        email_verified=current_user.email_verified,
        telegram_state=current_user.telegram_state,
    )

