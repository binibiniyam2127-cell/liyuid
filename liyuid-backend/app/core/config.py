import logging
import os
from celery import Celery
from dotenv import load_dotenv
from app.schemas import SubCityEnum

load_dotenv()

logger = logging.getLogger("liyuid.backend")

# Database & Cache URLs
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://liyuid_admin:liyuid_secret_dev@localhost:5432/liyuid_db",
)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Security & Cryptographic Settings
SECRET_KEY = os.getenv("SECRET_KEY", "ci_testing_secret_key_liyuid_super_secure_32bytes!")
ALGORITHM = "HS256"
USER_AUDIENCE = "liyuid:user"
STAFF_AUDIENCE = "liyuid:staff"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

ENCRYPTION_KEY_HEX = os.getenv(
    "AES_GCM_ENCRYPTION_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
)
ENCRYPTION_KEY = bytes.fromhex(ENCRYPTION_KEY_HEX)
SPATIAL_SALT = os.getenv("SPATIAL_SALT", "liyuid_spatial_secret_salt")

# Celery Client
celery_client = Celery("liyuid_worker", broker=REDIS_URL)

# Redis Client (with fast connect timeout for resilient local fallback)
try:
    import redis
    redis_client = redis.from_url(
        REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=0.2,
        socket_timeout=0.2,
    )
except Exception:
    redis_client = None

# Fixed Addis Ababa Sub-City Centroid Coordinates (Lat, Lon)
SUB_CITY_CENTROIDS = {
    SubCityEnum.addis_ketema: (9.0333, 38.7333),
    SubCityEnum.akaky_kaliti: (8.8833, 38.7667),
    SubCityEnum.arada: (9.0380, 38.7530),
    SubCityEnum.bole: (8.9982, 38.7865),
    SubCityEnum.gullele: (9.0667, 38.7333),
    SubCityEnum.kirkos: (9.0100, 38.7600),
    SubCityEnum.kolfe_keranio: (9.0167, 38.7000),
    SubCityEnum.lideta: (9.0130, 38.7370),
    SubCityEnum.nifas_silk_lafto: (8.9667, 38.7333),
    SubCityEnum.yeka: (9.0333, 38.8167),
    SubCityEnum.lemi_kura: (9.0150, 38.8350),
}

# Directories for Document Quarantine & Sanitization (FR-08)
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
RAW_DIR = os.path.join(UPLOAD_DIR, "quarantine_raw")
SANITIZED_DIR = os.path.join(UPLOAD_DIR, "sanitized_public")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(SANITIZED_DIR, exist_ok=True)

