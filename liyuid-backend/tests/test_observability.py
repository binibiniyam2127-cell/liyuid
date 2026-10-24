"""Tests for Observability, Health Checks, and Request Logging."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_liveness_endpoints():
    """Verify /health and /health/live respond 200 with alive status."""
    for path in ["/health", "/health/live", "/api/health"]:
        response = client.get(path)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert "timestamp" in data
        assert "X-Request-ID" in response.headers


def test_readiness_endpoint_structure():
    """Verify /health/ready returns deep component status and X-Request-ID."""
    response = client.get("/health/ready")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert "checks" in data
    assert "storage" in data["checks"]
    assert "redis" in data["checks"]
    assert "database" in data["checks"]
    assert "X-Request-ID" in response.headers


def test_request_id_propagation():
    """Verify custom X-Request-ID is preserved and propagated back."""
    custom_id = "test-custom-trace-uuid-12345"
    response = client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == custom_id
