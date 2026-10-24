"""Unit Tests for Gate 6: AI Worker Reliability, Dead-Letter Queue & Retries."""

import os
import sys
import pytest

# Ensure worker package is in sys.path
worker_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "liyuid-ai-worker"))
if worker_path not in sys.path:
    sys.path.insert(0, worker_path)

from tasks import (
    ReliableTask,
    celery_app,
    dead_letter_handler,
    dispatch_match_notification,
    process_item_embedding_and_match,
    sanitize_document_image,
)


def test_celery_reliability_configuration():
    """Verify task serialization, late acks, and dead-letter routing are configured."""
    conf = celery_app.conf
    assert conf.task_acks_late is True
    assert conf.task_reject_on_worker_lost is True
    assert conf.task_default_queue == "default"

    # Verify task routing
    routes = conf.task_routes
    assert routes["tasks.process_item_embedding_and_match"]["queue"] == "default"
    assert routes["tasks.sanitize_document_image"]["queue"] == "default"
    assert routes["tasks.dispatch_match_notification"]["queue"] == "high_priority"
    assert routes["tasks.dead_letter_handler"]["queue"] == "celery_dead_letter"


def test_task_retry_and_backoff_attributes():
    """Verify Celery tasks have exponential backoff and retry policies configured."""
    # 1. Matching Task
    assert process_item_embedding_and_match.max_retries == 3
    assert process_item_embedding_and_match.retry_backoff is True
    assert issubclass(process_item_embedding_and_match.__class__, ReliableTask) or isinstance(process_item_embedding_and_match, ReliableTask)

    # 2. Notification Task
    assert dispatch_match_notification.max_retries == 3
    assert dispatch_match_notification.retry_backoff is True
    assert issubclass(dispatch_match_notification.__class__, ReliableTask) or isinstance(dispatch_match_notification, ReliableTask)

    # 3. Document Sanitization Task
    assert sanitize_document_image.max_retries == 2
    assert sanitize_document_image.retry_backoff is True
    assert issubclass(sanitize_document_image.__class__, ReliableTask) or isinstance(sanitize_document_image, ReliableTask)


def test_dead_letter_quarantine_handler():
    """Verify dead_letter_handler quarantines permanently failed tasks."""
    result = dead_letter_handler(
        task_name="tasks.process_item_embedding_and_match",
        task_id="mock-task-uuid-456",
        args=["mock-item-id-123"],
        error_message="Simulated permanent database outage",
    )
    assert result["status"] == "quarantined"
    assert result["task_name"] == "tasks.process_item_embedding_and_match"
    assert result["task_id"] == "mock-task-uuid-456"
    assert "database outage" in result["error"]
