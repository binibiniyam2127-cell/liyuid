import json
import os
import re
import uuid
from typing import Optional

import pytesseract
import requests
from celery import Celery
from dotenv import load_dotenv
from PIL import Image, ImageDraw
from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, relationship, Session, sessionmaker

# Load local environment configuration
load_dotenv()

# ==========================================
# 1. Broker & Database Connection Setup
# ==========================================
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://liyuid_admin:password@localhost:5432/liyuid_db"
)

app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)

# Configure Celery serialization & Windows compatibility settings
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

# Multilingual SentenceTransformer (384-dimensional vector space)
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# ==========================================
# 2. FR-06 Notification Settings
# ==========================================
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "mock").lower()
NOTIFICATION_SCORE_THRESHOLD = float(os.getenv("NOTIFICATION_SCORE_THRESHOLD", "0.65"))

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")


# ==========================================
# 3. Notification Dispatch Helpers
# ==========================================
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


# ==========================================
# Task: dispatch_match_notification (FR-06)
# ==========================================
@app.task(name="tasks.dispatch_match_notification")
def dispatch_match_notification(match_id: str):
    """
    FR-06: Identifies users linked to the match, verifies channels,
    and dispatches timely, privacy-preserving notification alerts.
    """
    db = SessionLocal()
    try:
        query = text("""
            SELECT 
                m.id AS match_id,
                m.composite_score,
                m.score_breakdown,
                l.id AS lost_id,
                l.category,
                l.public_description AS lost_desc,
                l.user_id AS lost_user_id,
                lu.full_name AS lost_user_name,
                lu.telegram_chat_id AS lost_telegram,
                lu.phone_number AS lost_phone,
                f.id AS found_id,
                f.public_description AS found_desc,
                f.user_id AS found_user_id,
                fu.full_name AS found_user_name,
                fu.telegram_chat_id AS found_telegram,
                fu.phone_number AS found_phone
            FROM matches m
            JOIN items l ON m.lost_item_id = l.id
            JOIN items f ON m.found_item_id = f.id
            JOIN users lu ON l.user_id = lu.id
            JOIN users fu ON f.user_id = fu.id
            WHERE m.id = :match_id;
        """)

        match = db.execute(query, {"match_id": match_id}).mappings().first()
        if not match:
            print(f"[Dispatcher] Match ID {match_id} not found.")
            return {"status": "not_found"}

        score = float(match["composite_score"])
        score_percent = int(score * 100)
        category_name = match["category"].capitalize()

        # Format Owner Notification
        owner_msg = (
            f"🔍 *LIYUID Potential Match Detected!*\n\n"
            f"Hello {match['lost_user_name']},\n"
            f"A found *{category_name}* has been reported matching your item!\n\n"
            f"📊 *Match Confidence:* `{score_percent}%`\n"
            f"📝 *Description:* \"{match['found_desc'][:80]}...\"\n\n"
            f"👉 Open the LIYUID app to verify ownership and unlock safe handover details."
        )

        if match["lost_telegram"]:
            send_telegram_alert(match["lost_telegram"], owner_msg)
        if match["lost_phone"]:
            sms_text = f"LIYUID: A found {match['category']} matching your report was identified with {score_percent}% confidence. Open the app to verify."
            send_sms_alert(match["lost_phone"], sms_text)

        # Format Finder Notification
        finder_msg = (
            f"🔔 *LIYUID Match Candidate Update*\n\n"
            f"Hello {match['found_user_name']},\n"
            f"A lost item report closely matches the *{category_name}* you submitted (`{score_percent}%` confidence).\n\n"
            f"The potential owner has been notified to complete identity and item verification."
        )

        if match["found_telegram"]:
            send_telegram_alert(match["found_telegram"], finder_msg)
        if match["found_phone"]:
            sms_text = f"LIYUID: A potential owner was found for your registered {match['category']} ({score_percent}% confidence)."
            send_sms_alert(match["found_phone"], sms_text)

        return {"status": "dispatched", "match_id": match_id, "score": score}

    except Exception as exc:
        print(f"[Dispatcher Error] {exc}")
        return {"status": "error", "detail": str(exc)}
    finally:
        db.close()


# ==========================================
# Task: process_item_embedding_and_match (FR-03, FR-04, FR-06)
# ==========================================
@app.task(name="tasks.process_item_embedding_and_match")
def process_item_embedding_and_match(item_id: str):
    """
    1. Computes 384-d semantic embedding for the item description.
    2. Runs hybrid PostGIS spatial and cosine similarity search.
    3. Persists/updates matches and triggers notifications if score >= threshold.
    """
    db = SessionLocal()
    try:
        item_query = text("""
            SELECT id, type, category, brand, primary_color, public_description 
            FROM items 
            WHERE id = :item_id
        """)
        item = db.execute(item_query, {"item_id": item_id}).mappings().first()
        if not item:
            print(f"[Worker] Item {item_id} not found.")
            return {"status": "item_not_found"}

        # Compute & store vector embedding
        embedding = model.encode(item["public_description"]).tolist()
        update_query = text("""
            UPDATE items 
            SET text_embedding = CAST(:embedding AS vector) 
            WHERE id = :item_id
        """)
        db.execute(update_query, {"embedding": str(embedding), "item_id": item_id})
        db.commit()

        target_type = "found" if item["type"] == "lost" else "lost"
        match_search_query = text("""
            WITH source AS (
                SELECT location, incident_timestamp, text_embedding 
                FROM items 
                WHERE id = :item_id
            )
            SELECT 
                i.id, i.brand, i.primary_color,
                ST_Distance(i.location::geography, s.location::geography) / 1000.0 AS distance_km,
                1 - (i.text_embedding <=> s.text_embedding) AS cosine_sim,
                ABS(EXTRACT(EPOCH FROM (i.incident_timestamp - s.incident_timestamp))) / 3600.0 AS hours_diff
            FROM items i, source s
            WHERE i.type = :target_type
              AND i.category = :category
              AND i.status = 'active'
              AND i.text_embedding IS NOT NULL
              AND ST_DWithin(i.location::geography, s.location::geography, 15000)
            ORDER BY cosine_sim DESC
            LIMIT 10;
        """)

        candidates = db.execute(match_search_query, {
            "item_id": item_id,
            "target_type": target_type,
            "category": item["category"]
        }).mappings().all()

        dispatched_matches = []

        for cand in candidates:
            dist_km = float(cand["distance_km"]) if cand["distance_km"] is not None else 15.0
            cos_sim = float(cand["cosine_sim"]) if cand["cosine_sim"] is not None else 0.0
            hours_diff = float(cand["hours_diff"]) if cand["hours_diff"] is not None else 72.0

            # Multi-factor score components
            s_sem = max(0.0, cos_sim)
            s_geo = max(0.0, 1.0 - (dist_km / 15.0))
            s_time = max(0.0, 1.0 - min(hours_diff / 72.0, 1.0))

            brand_m = 1.0 if (item["brand"] and cand["brand"] and item["brand"].lower() == cand["brand"].lower()) else 0.0
            color_m = 1.0 if (item["primary_color"] and cand["primary_color"] and item["primary_color"].lower() == cand["primary_color"].lower()) else 0.0
            s_attr = (brand_m * 0.6) + (color_m * 0.4)

            composite = round((s_sem * 0.40) + (s_attr * 0.30) + (s_geo * 0.15) + (s_time * 0.15), 4)

            lost_id = item["id"] if item["type"] == "lost" else cand["id"]
            found_id = cand["id"] if item["type"] == "lost" else item["id"]

            existing_match = db.execute(
                text("SELECT id FROM matches WHERE lost_item_id = :lost_id AND found_item_id = :found_id"),
                {"lost_id": lost_id, "found_id": found_id}
            ).mappings().first()

            breakdown_json = json.dumps({
                "distance_km": round(dist_km, 2),
                "semantic_similarity": round(s_sem, 4),
                "attribute_similarity": round(s_attr, 4),
                "hours_difference": round(hours_diff, 1),
                "brand_match": brand_m,
                "color_match": color_m
            })

            if not existing_match:
                new_match_id = str(uuid.uuid4())
                insert_match = text("""
                    INSERT INTO matches (
                        id, lost_item_id, found_item_id, composite_score, 
                        score_breakdown, is_verified, verification_attempts, created_at
                    )
                    VALUES (
                        :id, :lost_id, :found_id, :score, 
                        CAST(:breakdown AS jsonb), FALSE, 0, NOW()
                    );
                """)
                db.execute(insert_match, {
                    "id": new_match_id,
                    "lost_id": lost_id,
                    "found_id": found_id,
                    "score": composite,
                    "breakdown": breakdown_json
                })
                db.commit()
                target_match_id = new_match_id
            else:
                target_match_id = str(existing_match["id"])
                update_match = text("""
                    UPDATE matches 
                    SET composite_score = :score, score_breakdown = CAST(:breakdown AS jsonb)
                    WHERE id = :id
                """)
                db.execute(update_match, {
                    "score": composite,
                    "breakdown": breakdown_json,
                    "id": target_match_id
                })
                db.commit()

            # Automatic FR-06 Notification Dispatch Trigger
            if composite >= NOTIFICATION_SCORE_THRESHOLD:
                dispatch_match_notification.delay(target_match_id)
                dispatched_matches.append(target_match_id)

        return {
            "status": "completed",
            "item_id": item_id,
            "candidates_found": len(candidates),
            "dispatched_matches": dispatched_matches
        }

    except Exception as exc:
        db.rollback()
        print(f"[Match Process Error] {exc}")
        return {"status": "error", "error": str(exc)}
    finally:
        db.close()


# ==========================================
# Task: sanitize_document_image (FR-08)
# ==========================================
@app.task(name="tasks.sanitize_document_image")
def sanitize_document_image(raw_image_path: str, output_image_path: str):
    """
    FR-08: Performs OCR scanning, isolates PII sequences (passports, national IDs,
    emails, long numerical/alphanumeric tokens), and writes redacted preview to disk.
    """
    try:
        if not os.path.exists(raw_image_path):
            return {"status": "error", "detail": f"File not found: {raw_image_path}"}

        img = Image.open(raw_image_path).convert("RGB")
        draw = ImageDraw.Draw(img)
        ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)

        pii_patterns = [
            r"^\d{6,}$",                                            # Sequential ID / passport numbers
            r"^[A-Z0-9]{8,}$",                                      # Alphanumeric document serials
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b" # Email addresses
        ]

        n_boxes = len(ocr_data["text"])
        redaction_count = 0

        for i in range(n_boxes):
            word = ocr_data["text"][i].strip()
            if not word:
                continue

            for pattern in pii_patterns:
                if re.search(pattern, word, re.IGNORECASE):
                    x, y, w, h = (
                        ocr_data["left"][i],
                        ocr_data["top"][i],
                        ocr_data["width"][i],
                        ocr_data["height"][i],
                    )
                    # Apply black bounding-box fill with a 2px padding margin
                    draw.rectangle([x - 2, y - 2, x + w + 2, y + h + 2], fill="black")
                    redaction_count += 1
                    break

        os.makedirs(os.path.dirname(output_image_path), exist_ok=True)
        img.save(output_image_path)

        return {
            "status": "sanitized",
            "redactions_applied": redaction_count,
            "output_path": output_image_path
        }
    except Exception as exc:
        print(f"[Sanitize Error] {exc}")
        return {"status": "error", "detail": str(exc)}