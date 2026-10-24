import logging
from typing import Optional

from app.integrations.email import email_client, send_email_notification
from app.integrations.sms import send_owner_municipal_intake_sms, sms_client
from app.integrations.telegram import notify_finder_match_verified, send_message

logger = logging.getLogger("liyuid.services.notification")


def send_verification_email(email: str, code: str) -> bool:
    return email_client.send_verification_email(email, code)


def send_general_email(to_email: str, subject: str, body: str) -> bool:
    return send_email_notification(to_email, subject, body)


def send_telegram_alert(chat_id: str, text: str):
    send_message(chat_id, text)


def send_municipal_intake_sms(
    owner_phone: str,
    item_title: str,
    station_location: str,
    shelf_locker: str,
) -> bool:
    return send_owner_municipal_intake_sms(
        owner_phone=owner_phone,
        item_title=item_title,
        station_location=station_location,
        shelf_locker=shelf_locker,
    )


__all__ = [
    "send_verification_email",
    "send_general_email",
    "send_telegram_alert",
    "send_municipal_intake_sms",
    "notify_finder_match_verified",
    "email_client",
    "sms_client",
]

