import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "liyuid_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Nairobi",
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

if __name__ == "__main__":
    celery_app.start()
