import os
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app, create_jwt_token, get_password_hash, USER_AUDIENCE, STAFF_AUDIENCE
from app.models import Item, Match, User, StaffAccount

# PostgreSQL connection string matching test service setup
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://liyuid_admin:liyuid_password@localhost:5432/liyuid_test"
)
_db_name = (TEST_DATABASE_URL or "").rsplit("/", 1)[-1].split("?")[0]
if not _db_name.endswith("_test"):
    raise RuntimeError(
        "Refusing to run: TEST_DATABASE_URL must be set and point to a "
        "database whose name ends with _test."
    )

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "postgis";'))
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "vector";'))
            conn.commit()
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Database setup encountered an error (tests not requiring DB will still run): {e}")
    yield

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def normal_user(db_session) -> User:
    user = User(
        id=uuid.uuid4(),
        email=f"user_{uuid.uuid4().hex[:6]}@liyuid.et",
        phone_number=f"+251911{uuid.uuid4().int % 1000000:06d}",
        display_name="UserTester",
        full_name="User Normal Tester",
        hashed_password=get_password_hash("ValidPass123!"),
        role="user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def admin_user(db_session) -> User:
    admin = User(
        id=uuid.uuid4(),
        email=f"admin_{uuid.uuid4().hex[:6]}@liyuid.et",
        phone_number=f"+251922{uuid.uuid4().int % 1000000:06d}",
        display_name="AdminTester",
        full_name="Admin System Tester",
        hashed_password=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture
def finder_user(db_session) -> User:
    finder = User(
        id=uuid.uuid4(),
        email=f"finder_{uuid.uuid4().hex[:6]}@liyuid.et",
        phone_number=f"+251933{uuid.uuid4().int % 1000000:06d}",
        display_name="FinderTester",
        full_name="Finder Honest Person",
        hashed_password=get_password_hash("FinderPass123!"),
        role="user",
        is_active=True,
    )
    db_session.add(finder)
    db_session.commit()
    db_session.refresh(finder)
    return finder

@pytest.fixture
def user_auth_headers(normal_user) -> dict:
    token = create_jwt_token(data={"sub": str(normal_user.id)}, audience=USER_AUDIENCE)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def finder_auth_headers(finder_user) -> dict:
    token = create_jwt_token(data={"sub": str(finder_user.id)}, audience=USER_AUDIENCE)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_auth_headers(admin_user) -> dict:
    token = create_jwt_token(data={"sub": str(admin_user.id), "role": "admin"}, audience=USER_AUDIENCE)
    return {"Authorization": f"Bearer {token}"}

