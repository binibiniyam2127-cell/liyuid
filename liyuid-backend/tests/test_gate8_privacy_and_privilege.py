import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import STAFF_AUDIENCE, USER_AUDIENCE
from app.core.security import create_jwt_token, get_password_hash
from app.database import Base, get_db
from app.main import app
from app.models import (
    AuditLog,
    ChatMessage,
    FinderRequest,
    Flag,
    Handover,
    Item,
    Match,
    StaffAccount,
    User,
)

# In-memory SQLite with StaticPool so all threads/sessions share the same DB
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Register dummy spatial functions so SQLite can create tables and insert Geometry columns
event.listen(
    test_engine,
    "connect",
    lambda c, r: (
        c.create_function("RecoverGeometryColumn", 5, lambda *a: 1),
        c.create_function("CreateSpatialIndex", 2, lambda *a: 1),
        c.create_function("CheckSpatialIndex", 2, lambda *a: 1),
        c.create_function("DisableSpatialIndex", 2, lambda *a: 1),
        c.create_function("GeomFromEWKT", 1, lambda val: val),
        c.create_function("GeomFromEWKT", 2, lambda val, s: val),
        c.create_function("AsEWKB", 1, lambda val: None),
        c.create_function("AsEWKB", 2, lambda val, s: None),
    ),
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="module", autouse=True)
def setup_tables():
    User.__table__.create(bind=test_engine)
    StaffAccount.__table__.create(bind=test_engine)
    AuditLog.__table__.create(bind=test_engine)
    Item.__table__.create(bind=test_engine)
    Match.__table__.create(bind=test_engine)
    Handover.__table__.create(bind=test_engine)
    FinderRequest.__table__.create(bind=test_engine)
    ChatMessage.__table__.create(bind=test_engine)
    Flag.__table__.create(bind=test_engine)
    yield


@pytest.fixture
def db_session():
    session = TestingSession()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


def create_test_item(db_session, user_id, item_type="lost", category="phone", sub_city="Bole", brand="Apple", model="iPhone", status="active"):
    itm = Item(
        id=uuid.uuid4(),
        user_id=user_id,
        type=item_type,
        category=category,
        sub_city=sub_city,
        brand=brand,
        model=model,
        primary_color="Black",
        public_description="Item reported in Bole area",
        location="SRID=4326;POINT(38.7865 8.9982)",
        incident_timestamp=datetime.now(timezone.utc),
        status=status,
    )
    db_session.add(itm)
    db_session.commit()
    db_session.refresh(itm)
    return itm


@pytest.fixture
def regular_user(db_session):
    uid = uuid.uuid4()
    user = User(
        id=uid,
        email=f"citizen_{uid.hex[:6]}@example.com",
        phone_number=f"+251911{uid.int % 1000000:06d}",
        display_name="Citizen One",
        hashed_password=get_password_hash("Secret123!"),
        role="user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def regular_user_token(regular_user):
    return create_jwt_token(
        data={"sub": str(regular_user.id), "email": regular_user.email, "role": "user"},
        audience=USER_AUDIENCE,
    )


@pytest.fixture
def staff_user(db_session):
    uid = uuid.uuid4()
    staff = StaffAccount(
        id=uid,
        email=f"officer_{uid.hex[:6]}@addisababa.gov.et",
        full_name="Municipal Officer Abebe",
        staff_code=f"OFF-{uid.hex[:4].upper()}",
        hashed_password=get_password_hash("StaffPass123!"),
        staff_role="staff",
        is_active=True,
    )
    db_session.add(staff)
    db_session.commit()
    db_session.refresh(staff)
    return staff


@pytest.fixture
def staff_token(staff_user):
    return create_jwt_token(
        data={"sub": str(staff_user.id), "email": staff_user.email, "role": "staff"},
        audience=STAFF_AUDIENCE,
    )


@pytest.fixture
def admin_user(db_session):
    uid = uuid.uuid4()
    admin = User(
        id=uid,
        email=f"admin_{uid.hex[:6]}@liyuid.gov.et",
        phone_number=f"+251912{uid.int % 1000000:06d}",
        display_name="System Administrator",
        hashed_password=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def admin_token(admin_user):
    return create_jwt_token(
        data={"sub": str(admin_user.id), "email": admin_user.email, "role": "admin"},
        audience=USER_AUDIENCE,
    )


def test_admin_and_staff_rbac_strictness(client, regular_user_token, staff_token, admin_token):
    # 1. Unauthenticated requests are rejected with 401
    res = client.get("/admin/audit-logs")
    assert res.status_code == 401

    res = client.get("/staff/dashboard/overview")
    assert res.status_code == 401

    # 2. Regular citizen cannot access staff or admin routes (403 Forbidden)
    res = client.get("/admin/audit-logs", headers={"Authorization": f"Bearer {regular_user_token}"})
    assert res.status_code == 403
    assert "administrative privileges required" in res.json()["detail"].lower()

    res = client.get("/staff/dashboard/overview", headers={"Authorization": f"Bearer {regular_user_token}"})
    assert res.status_code == 403

    # 3. Staff officer cannot access admin endpoints (rejected with 401/403 due to audience separation)
    res = client.get("/admin/audit-logs", headers={"Authorization": f"Bearer {staff_token}"})
    assert res.status_code in [401, 403]

    # 4. Staff officer can access staff endpoints (200 OK)
    res = client.get("/staff/dashboard/overview", headers={"Authorization": f"Bearer {staff_token}"})
    assert res.status_code == 200

    # 5. Admin can access admin endpoints (200 OK)
    res = client.get("/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_privileged_actions_produce_audit_logs(client, db_session, admin_user, admin_token, staff_user, staff_token):
    # Setup test item
    item = create_test_item(db_session, admin_user.id, item_type="lost", category="electronics", brand="Apple", model="MacBook", status="flagged")

    # Admin resolves dispute
    res = client.post(
        f"/admin/disputes/{item.id}/resolve",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"new_status": "active", "resolution_notes": "Supervisor verified ownership documentation."},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "resolved"

    # Verify AuditLog record was persisted
    audit = db_session.query(AuditLog).filter(
        AuditLog.entity_id == item.id,
        AuditLog.action == "admin_dispute_resolved",
    ).first()
    assert audit is not None
    assert audit.actor_id == admin_user.id
    assert audit.severity == "high"
    assert audit.details["new_status"] == "active"


def test_chat_access_control_and_privacy(client, db_session, regular_user, regular_user_token):
    owner = regular_user
    f_uid = uuid.uuid4()
    finder = User(
        id=f_uid,
        email="finder@example.com",
        phone_number=f"+251913{f_uid.int % 1000000:06d}",
        display_name="Honest Finder",
        hashed_password="pw",
        role="user",
        is_active=True,
    )
    a_uid = uuid.uuid4()
    attacker = User(
        id=a_uid,
        email="attacker@example.com",
        phone_number=f"+251914{a_uid.int % 1000000:06d}",
        display_name="Curious Snooper",
        hashed_password="pw",
        role="user",
        is_active=True,
    )
    db_session.add_all([finder, attacker])
    db_session.commit()

    attacker_token = create_jwt_token(
        data={"sub": str(attacker.id), "email": attacker.email, "role": "user"},
        audience=USER_AUDIENCE,
    )
    finder_token = create_jwt_token(
        data={"sub": str(finder.id), "email": finder.email, "role": "user"},
        audience=USER_AUDIENCE,
    )

    lost = create_test_item(db_session, owner.id, item_type="lost", category="phone")
    found = create_test_item(db_session, finder.id, item_type="found", category="phone")

    match = Match(
        id=uuid.uuid4(),
        lost_item_id=lost.id,
        found_item_id=found.id,
        composite_score=0.95,
        score_breakdown={"tags": ["electronics"]},
        is_verified=True,
        lock_state="none",
    )
    f_req = FinderRequest(id=uuid.uuid4(), match_id=match.id, status="accepted")
    db_session.add_all([match, f_req])
    db_session.commit()

    # Owner sends chat message
    res = client.post(
        f"/matches/{match.id}/chat",
        headers={"Authorization": f"Bearer {regular_user_token}"},
        json={"text": "Hello, thank you for finding my phone!"},
    )
    assert res.status_code == 200

    # Attacker tries to send chat to this match -> 403 Forbidden
    res_atk_send = client.post(
        f"/matches/{match.id}/chat",
        headers={"Authorization": f"Bearer {attacker_token}"},
        json={"text": "Can I have this?"},
    )
    assert res_atk_send.status_code == 403
    assert "Not a party to this match" in res_atk_send.json()["detail"]

    # Attacker tries to read chat history -> 403 Forbidden
    res_atk_read = client.get(
        f"/matches/{match.id}/chat",
        headers={"Authorization": f"Bearer {attacker_token}"},
    )
    assert res_atk_read.status_code == 403
    assert "Not authorized to view chat" in res_atk_read.json()["detail"]

    # Genuine Finder reads chat history -> 200 OK
    res_finder_read = client.get(
        f"/matches/{match.id}/chat",
        headers={"Authorization": f"Bearer {finder_token}"},
    )
    assert res_finder_read.status_code == 200
    assert len(res_finder_read.json()) == 1
    assert res_finder_read.json()[0]["sender_display_name"] == "Citizen One"


def test_finder_request_access_control(client, db_session, regular_user, regular_user_token):
    f_uid = uuid.uuid4()
    finder = User(
        id=f_uid,
        email="finder2@example.com",
        phone_number=f"+251915{f_uid.int % 1000000:06d}",
        display_name="Actual Finder",
        hashed_password="pw",
        role="user",
        is_active=True,
    )
    db_session.add(finder)
    db_session.commit()

    finder_token = create_jwt_token(
        data={"sub": str(finder.id), "email": finder.email, "role": "user"},
        audience=USER_AUDIENCE,
    )

    lost = create_test_item(db_session, regular_user.id, item_type="lost", category="bag")
    found = create_test_item(db_session, finder.id, item_type="found", category="bag")

    match = Match(
        id=uuid.uuid4(),
        lost_item_id=lost.id,
        found_item_id=found.id,
        composite_score=0.9,
        score_breakdown={"tags": ["bag"]},
        is_verified=True,
    )
    f_req = FinderRequest(id=uuid.uuid4(), match_id=match.id, status="new")
    db_session.add_all([match, f_req])
    db_session.commit()

    # Unauthorized citizen (owner or random) tries to accept finder's request -> 403 Forbidden
    res = client.post(
        f"/finder/requests/{f_req.id}/accept",
        headers={"Authorization": f"Bearer {regular_user_token}"},
    )
    assert res.status_code == 403
    assert "Not authorized for this finder request" in res.json()["detail"]

    # Authorized finder accepts request -> 200 OK
    res_finder = client.post(
        f"/finder/requests/{f_req.id}/accept",
        headers={"Authorization": f"Bearer {finder_token}"},
    )
    assert res_finder.status_code == 200
    assert res_finder.json()["status"] == "accepted"
