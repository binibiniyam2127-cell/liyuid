import os
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sentence_transformers import SentenceTransformer

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg://liyuid_admin:password@postgres:5432/liyuid_db"
)

engine = create_engine(DATABASE_URL)
model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

def seed():
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))

        # 1. Fetch or create a valid user
        user_row = conn.execute(text("SELECT id FROM users LIMIT 1;")).first()
        if user_row:
            user_id = str(user_row[0])
            print(f"[*] Reusing existing user: {user_id}")
        else:
            user_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO users (
                    id, email, phone_number, hashed_password, 
                    full_name, is_active, created_at
                ) VALUES (
                    :uid, 'student@bdu.edu.et', '+251911223344',
                    '$2b$12$dummyhashedpasswordforseedingonly',
                    'Test Student', true, :now
                )
            """), {"uid": user_id, "now": datetime.now(timezone.utc)})
            print(f"[*] Created user: {user_id}")

        now = datetime.now(timezone.utc)

        # 2. Insert Found Item (English)
        # Location: Bahir Dar Poly Campus (Lon: 37.3970, Lat: 11.5980)
        found_id = str(uuid.uuid4())
        found_desc = "Found a black Samsung Galaxy smartphone with a cracked screen protector near library."
        found_emb = model.encode(f"Electronics Samsung Galaxy black {found_desc}").tolist()

        conn.execute(text("""
            INSERT INTO items (
                id, user_id, type, category, brand, model, primary_color,
                public_description, challenge_type, challenge_question,
                private_challenge_truth, location, incident_timestamp,
                text_embedding, status, created_at
            ) VALUES (
                :id, :user_id, 'found', 'Electronics', 'Samsung', 'Galaxy', 'Black',
                :desc, 'lock_screen', 'What image or wallpaper is on the lock screen?',
                'A photo of a white cat',
                ST_SetSRID(ST_MakePoint(37.3970, 11.5980), 4326),
                :ts, CAST(:emb AS vector), 'active', :created_at
            );
        """), {
            "id": found_id,
            "user_id": user_id,
            "desc": found_desc,
            "ts": now,
            "emb": str(found_emb),
            "created_at": now
        })

        # 3. Insert Lost Item (Amharic)
        # Location: ~350m away (Lon: 37.3990, Lat: 11.5990)
        lost_id = str(uuid.uuid4())
        lost_desc = "ጥቁር ሳምሰንግ ስልክ ቤተ-መጽሐፍት አካባቢ ጠፍቶብኛል"
        lost_emb = model.encode(f"Electronics Samsung Galaxy ጥቁር {lost_desc}").tolist()

        conn.execute(text("""
            INSERT INTO items (
                id, user_id, type, category, brand, model, primary_color,
                public_description, challenge_type, challenge_question,
                private_challenge_truth, location, incident_timestamp,
                text_embedding, status, created_at
            ) VALUES (
                :id, :user_id, 'lost', 'Electronics', 'Samsung', 'Galaxy', 'Black',
                :desc, 'lock_screen', 'What image or wallpaper is on the lock screen?',
                'A photo of a white cat',
                ST_SetSRID(ST_MakePoint(37.3990, 11.5990), 4326),
                :ts, CAST(:emb AS vector), 'active', :created_at
            );
        """), {
            "id": lost_id,
            "user_id": user_id,
            "desc": lost_desc,
            "ts": now,
            "emb": str(lost_emb),
            "created_at": now
        })

        print("--------------------------------------------------")
        print(f"[*] Successfully Seeded Items!")
        print(f"[*] Lost Item ID  : {lost_id}")
        print(f"[*] Found Item ID : {found_id}")
        print("--------------------------------------------------")
        return lost_id

if __name__ == "__main__":
    seed()