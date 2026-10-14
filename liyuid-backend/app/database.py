from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

db_url = DATABASE_URL
if db_url.startswith("postgresql+psycopg://"):
    db_url = db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
if ("postgresql" in db_url or "postgres" in db_url) and "connect_timeout" not in db_url:
    separator = "&" if "?" in db_url else "?"
    db_url = f"{db_url}{separator}connect_timeout=15"

engine = create_engine(db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        db.close()