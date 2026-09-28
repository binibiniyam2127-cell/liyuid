import os
from sqlalchemy import create_engine, text
import tasks

# Force the threshold dynamically to 0.65 to match SRS
tasks.NOTIFICATION_SCORE_THRESHOLD = 0.65
print(f"[*] Set tasks.NOTIFICATION_SCORE_THRESHOLD to: {tasks.NOTIFICATION_SCORE_THRESHOLD}")

db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://liyuid_admin:password@postgres:5432/liyuid_db")
engine = create_engine(db_url)

with engine.connect() as conn:
    query = text("SELECT id FROM items WHERE type = 'lost' ORDER BY created_at DESC LIMIT 1")
    row = conn.execute(query).first()
    
    if not row:
        print("[-] No lost items found in the database.")
    else:
        lost_id = str(row[0])
        print(f"[*] Dispatching match task for Lost Item ID: {lost_id}")
        result = tasks.process_item_embedding_and_match(lost_id)
        print("--------------------------------------------------")
        print("Matching Engine Execution Result:")
        print(result)
        print("--------------------------------------------------")