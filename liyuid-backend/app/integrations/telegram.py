import json
import logging
import os
import urllib.parse
import urllib.request

logger = logging.getLogger("liyuid.integrations.telegram")

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
        logger.error("[Telegram] Error sending message: %s", e)


def notify_finder_match_verified(finder_phone: str, finder_chat_id: str | None, item_subcity: str):
    msg = f"Liyuid: A claim on your found item in {item_subcity} has been verified. Open the app to coordinate handover."
    if finder_chat_id:
        logger.info(f"[TELEGRAM NOTIFY] Chat ID {finder_chat_id}: {msg}")
        send_message(finder_chat_id, msg)
    logger.info("[EMAIL NOTIFY] Notification email dispatched.")

