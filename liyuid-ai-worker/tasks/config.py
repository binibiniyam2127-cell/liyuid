import os
from celery import Celery
from dotenv import load_dotenv

# Load local environment configuration
load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://liyuid_admin:password@localhost:5432/liyuid_db"
)

app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)

# Configure Celery serialization, queuing, DLQ routing & resilience settings
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_queue="default",
    task_routes={
        "tasks.process_item_embedding_and_match": {"queue": "default"},
        "tasks.sanitize_document_image": {"queue": "default"},
        "tasks.dispatch_match_notification": {"queue": "high_priority"},
        "tasks.dead_letter_handler": {"queue": "celery_dead_letter"},
    },
)

# FR-06 Notification Settings
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "mock").lower()
NOTIFICATION_SCORE_THRESHOLD = float(os.getenv("NOTIFICATION_SCORE_THRESHOLD", "0.65"))

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")
