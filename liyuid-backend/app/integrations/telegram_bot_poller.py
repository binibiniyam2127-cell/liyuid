import json
import logging
import os
import time
import urllib.parse
import urllib.request
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import User
from app.integrations.telegram import BOT_TOKEN, TELEGRAM_API, send_message

logger = logging.getLogger("liyuid.telegram_poller")


def run_poller():
    if not BOT_TOKEN:
        print("[Poller] No TELEGRAM_BOT_TOKEN configured. Poller exiting.", flush=True)
        return

    print("[Poller] Starting Telegram Long Polling for @liyuid_alert_bot...", flush=True)
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
                from_user = message.get("from", {})
                first_name = from_user.get("first_name", "Citizen")

                if text.startswith("/start"):
                    parts = text.split(maxsplit=1)
                    if len(parts) > 1:
                        link_code = parts[1].strip()
                        with SessionLocal() as db:
                            user = db.query(User).filter(User.telegram_link_code == link_code).first()
                            if user:
                                user.telegram_chat_id = chat_id
                                user.telegram_state = "linked"
                                db.commit()
                                reply = (
                                    f"✅ *Account Successfully Linked!*\n\n"
                                    f"Hello {user.display_name},\n"
                                    f"Your Telegram is now officially linked with the *LIYUID Municipal Lost & Found System*.\n\n"
                                    f"You will receive instant, secure alerts whenever your lost property has an AI match or when a finder confirms your item."
                                )
                                send_message(chat_id, reply)
                                print(f"[Poller] Linked user {user.display_name} to chat_id {chat_id}", flush=True)
                            else:
                                reply = "⚠️ *Invalid or Expired Link Code*\nPlease regenerate a new Telegram Link code from your LIYUID dashboard settings."
                                send_message(chat_id, reply)
                    else:
                        reply = (
                            f"👋 *Welcome to LIYUID Alert Bot, {first_name}!*\n\n"
                            f"I provide official lost-and-found notifications for Addis Ababa.\n\n"
                            f"To connect your account, go to http://localhost:3000/settings and click *'Link Telegram Bot'*."
                        )
                        send_message(chat_id, reply)
                elif text == "/status":
                    with SessionLocal() as db:
                        user = db.query(User).filter(User.telegram_chat_id == chat_id).first()
                        if user:
                            reply = f"🟢 *Status: Connected*\nLinked to LIYUID account: *{user.display_name}* ({user.email})"
                        else:
                            reply = "🔴 *Status: Unlinked*\nThis Telegram account is not yet connected to a LIYUID citizen account."
                        send_message(chat_id, reply)
                else:
                    reply = (
                        "🤖 *LIYUID Automated Service*\n\n"
                        "Available commands:\n"
                        "• /status - Check account linking status\n"
                        r"• /start <code\> - Connect citizen account"
                    )
                    send_message(chat_id, reply)

        except Exception as e:
            print(f"[Poller] Polling cycle error: {e}", flush=True)
            time.sleep(3)


if __name__ == "__main__":
    run_poller()
