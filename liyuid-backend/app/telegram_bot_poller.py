# app/telegram_bot_poller.py
import json
import logging
import os
import time
import urllib.parse
import urllib.request
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User

logger = logging.getLogger("liyuid.telegram_poller")

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN") or "8678134128:AAE-504K4TNaY_UlKYF57IswO7WgV7mZr3M"
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}" if BOT_TOKEN else ""


def send_message(chat_id: str, text: str):
    if not TELEGRAM_API:
        return
    try:
        url = f"{TELEGRAM_API}/sendMessage"
        payload = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            pass
    except Exception as e:
        print(f"[Poller] Error sending message: {e}", flush=True)


def run_poller():
    if not BOT_TOKEN:
        print("[Poller] No TELEGRAM_BOT_TOKEN configured. Poller exiting.", flush=True)
        return

    print(f"[Poller] Starting Telegram Long Polling for @liyuid_alert_bot...", flush=True)
    offset = None

    while True:
        try:
            url = f"{TELEGRAM_API}/getUpdates?timeout=20"
            if offset is not None:
                url += f"&offset={offset}"

            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            if not data.get("ok"):
                time.sleep(2)
                continue

            for update in data.get("result", []):
                offset = update["update_id"] + 1
                message = update.get("message") or update.get("edited_message")
                if not message:
                    continue

                chat = message.get("chat", {})
                chat_id = str(chat.get("id", ""))
                text = (message.get("text") or "").strip()

                if not chat_id or not text:
                    continue

                db: Session = SessionLocal()
                try:
                    # Case 1: /start <link_code>
                    if text.startswith("/start"):
                        parts = text.split()
                        if len(parts) > 1:
                            link_code = parts[1].strip()
                            user = db.query(User).filter(User.telegram_link_code == link_code).first()
                            if user:
                                user.telegram_chat_id = chat_id
                                user.telegram_state = "linked"
                                db.commit()
                                print(f"[Poller] Linked user {user.email} to chat_id {chat_id} via link_code.", flush=True)
                                send_message(
                                    chat_id,
                                    f"🎉 *Account Connected!*\n\n"
                                    f"Hello *{user.display_name}*,\n"
                                    f"Your LIYUID account (`{user.email}`) is now linked to Telegram.\n\n"
                                    f"🔔 You will receive instant recovery alerts here whenever your lost items are matched!"
                                )
                                continue

                        # If /start without code, check if chat_id is already linked
                        existing_user = db.query(User).filter(User.telegram_chat_id == chat_id).first()
                        if existing_user:
                            send_message(
                                chat_id,
                                f"👋 *Welcome back, {existing_user.display_name}!*\n\n"
                                f"Your Telegram is linked to `{existing_user.email}`.\n"
                                f"Your recovery alerts are active and running."
                            )
                        else:
                            send_message(
                                chat_id,
                                "👋 *Welcome to LIYUID Recovery Bot!*\n\n"
                                "To connect your account, simply *reply with your registered LIYUID email address* right here in this chat to link instantly!"
                            )

                    # Case 2: User types their email directly in the chat
                    elif "@" in text and "." in text:
                        candidate_email = text.lower().strip()
                        user = db.query(User).filter(User.email.ilike(candidate_email)).first()
                        if user:
                            user.telegram_chat_id = chat_id
                            user.telegram_state = "linked"
                            db.commit()
                            print(f"[Poller] Linked user {user.email} to chat_id {chat_id} via direct email input.", flush=True)
                            send_message(
                                chat_id,
                                f"🎉 *Account Successfully Linked!*\n\n"
                                f"Connected to: *{user.email}*\n"
                                f"User: *{user.display_name}*\n\n"
                                f"🔔 You will now receive instant push alerts here whenever an AI match is detected!"
                            )
                        else:
                            send_message(
                                chat_id,
                                f"❌ No account found with email: `{candidate_email}`.\n"
                                f"Please make sure you have registered on the LIYUID web app first."
                            )
                    else:
                        send_message(
                            chat_id,
                            "ℹ️ Send your registered LIYUID email address to link this chat to your account."
                        )
                finally:
                    db.close()

        except Exception as e:
            time.sleep(3)


if __name__ == "__main__":
    run_poller()
