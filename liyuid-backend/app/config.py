import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://liyuid_admin:liyuid_secret_dev@localhost:5432/liyuid_db")