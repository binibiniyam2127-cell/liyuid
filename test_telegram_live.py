import time
import random
import uuid
import requests
from datetime import datetime, timezone

BASE_URL = "http://127.0.0.1:8000"

# Your verified Telegram Chat ID
MY_TELEGRAM_CHAT_ID = "7544651798"

def run_test():
    unique_suffix = uuid.uuid4().hex[:6]
    random_phone = f"+25191{random.randint(1000000, 9999999)}"

    print(f"[*] Registering user linked to Telegram Chat ID: {MY_TELEGRAM_CHAT_ID} (Phone: {random_phone})...")
    user_payload = {
        "email": f"telegram_{unique_suffix}@liyuid.com",
        "password": "Password123!",
        "full_name": "Biniyam Live Tester",
        "phone_number": random_phone,
        "telegram_chat_id": str(MY_TELEGRAM_CHAT_ID)
    }

    reg_res = requests.post(f"{BASE_URL}/auth/register", json=user_payload)
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"

    # Log in and acquire token
    token = requests.post(f"{BASE_URL}/auth/token", data={
        "username": user_payload["email"],
        "password": user_payload["password"]
    }).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ingest Lost Item
    print("[*] Submitting Lost Report...")
    lost_payload = {
        "type": "lost",
        "category": "electronics",
        "brand": "Apple",
        "model": "MacBook Pro",
        "primary_color": "space gray",
        "public_description": "Lost Space Gray MacBook Pro 16 inch M3 laptop near university library.",
        "challenge_type": "deterministic_code",
        "private_challenge_truth": "7749",
        "latitude": 9.0301,
        "longitude": 38.7402,
        "incident_timestamp": datetime.now(timezone.utc).isoformat()
    }
    requests.post(f"{BASE_URL}/reports", headers=headers, json=lost_payload)

    # Ingest Found Item (triggers vector embedding, matching & notification dispatch)
    print("[*] Submitting Matching Found Report...")
    found_payload = {
        "type": "found",
        "category": "electronics",
        "brand": "Apple",
        "model": "MacBook Pro",
        "primary_color": "space gray",
        "public_description": "Found a space gray Apple MacBook Pro 16 inch sitting on a bench outside library.",
        "challenge_type": "deterministic_code",
        "private_challenge_truth": "7749",
        "latitude": 9.0305,
        "longitude": 38.7405,
        "incident_timestamp": datetime.now(timezone.utc).isoformat()
    }
    requests.post(f"{BASE_URL}/reports", headers=headers, json=found_payload)

    print("\n[*] Reports registered! Awaiting Celery worker background processing...")
    time.sleep(6)
    print("[*] Check your Telegram chat in @liyuid_alert_bot!")

if __name__ == "__main__":
    run_test()