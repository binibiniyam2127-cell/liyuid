import os
import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import redis
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from tasks.config import (
    DATABASE_URL,
    REDIS_URL,
    SMS_PROVIDER,
    TELEGRAM_BOT_TOKEN,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
)

# Redis client setup
try:
    redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None

# Database Engine & Session setup
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


def send_telegram_alert(chat_id: str, message: str) -> bool:
    """Dispatches markdown-formatted alert via official Telegram Bot API."""
    if not TELEGRAM_BOT_TOKEN:
        print(f"\n[Telegram MOCK] Destination: {chat_id}\n{message}\n")
        return True

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown",
    }
    try:
        response = requests.post(url, json=payload, timeout=8)
        if response.status_code == 200:
            print(f"[Telegram SUCCESS] Delivered to chat_id: {chat_id}")
            return True
        else:
            print(f"[Telegram ERROR] HTTP {response.status_code}: {response.text}")
            return False
    except Exception as exc:
        print(f"[Telegram EXCEPTION] Failed delivery to chat_id {chat_id}: {exc}")
        return False


def send_sms_alert(phone_number: str, message: str) -> bool:
    """Dispatches SMS alert via configured provider (Mock or Twilio)."""
    if SMS_PROVIDER == "mock" or not phone_number:
        print(f"\n[SMS MOCK] Destination: {phone_number}\nMessage: {message}\n")
        return True

    if SMS_PROVIDER == "twilio":
        if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER):
            print(f"[SMS WARNING] Incomplete Twilio credentials. Falling back to mock for {phone_number}")
            print(f"[SMS MOCK] {phone_number}: {message}")
            return False

        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            res = requests.post(
                url,
                data={"To": phone_number, "From": TWILIO_FROM_NUMBER, "Body": message},
                auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
                timeout=8,
            )
            success = res.status_code in (200, 201)
            if success:
                print(f"[SMS SUCCESS] Twilio delivered to {phone_number}")
            else:
                print(f"[SMS ERROR] Twilio returned {res.status_code}: {res.text}")
            return success
        except Exception as exc:
            print(f"[SMS EXCEPTION] Failed Twilio request for {phone_number}: {exc}")
            return False

    return False


def send_email_alert(
    recipient_email: str,
    subject: str,
    message: str,
    html_content: Optional[str] = None
) -> bool:
    """Dispatches real email alert using configured SMTP server."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "").replace(" ", "")
    from_email = os.getenv("SMTP_FROM_EMAIL", smtp_user or "noreply@liyuid.com")
    from_name = os.getenv("SMTP_FROM_NAME", "LIYUID Match Radar")

    if not (smtp_user and smtp_pass):
        print(f"\n[EMAIL MOCK] Destination: {recipient_email}\nSubject: {subject}\n{message}\n")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = recipient_email

    msg.attach(MIMEText(message, "plain"))
    if html_content:
        msg.attach(MIMEText(html_content, "html"))

    for attempt in range(1, 3):
        try:
            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=25) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(from_email, [recipient_email], msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=25) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(from_email, [recipient_email], msg.as_string())

            print(f"[EMAIL SUCCESS] Delivered match notification to: {recipient_email}")
            return True
        except Exception as exc:
            if attempt == 2:
                print(f"[EMAIL ERROR] Failed delivering match email to {recipient_email}: {exc}")
                return False
            time.sleep(1.5)
    return False
