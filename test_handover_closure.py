import os
import hashlib
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg://liyuid_admin:password@postgres:5432/liyuid_db"
)
engine = create_engine(DATABASE_URL)

MATCH_ID = "dad98b7b-ef5e-4d17-bd36-da9d000b840e"
RAW_TOKEN = "4BED31A7"

def run_handover_closure():
    with engine.begin() as conn:
        handover = conn.execute(text("""
            SELECT h.id, h.handover_code_hash, h.owner_confirmed, h.finder_confirmed,
                   m.lost_item_id, m.found_item_id
            FROM handovers h
            JOIN matches m ON h.match_id = m.id
            WHERE m.id = :mid;
        """), {"mid": MATCH_ID}).mappings().first()

        if not handover:
            print("[-] Handover record not found.")
            return

        print("==================================================")
        print("PHASE 4: TWO-PARTY HANDOVER CONFIRMATION")
        print("==================================================")
        print(f"[*] Handover ID : {handover['id']}")
        print(f"[*] Match ID    : {MATCH_ID}")
        print(f"[*] Provided Code: {RAW_TOKEN}")
        print("--------------------------------------------------")

        # Verify provided token matches stored hash
        token_hash = hashlib.sha256(RAW_TOKEN.encode()).hexdigest()
        if token_hash != handover["handover_code_hash"]:
            print("[-] Invalid handover token!")
            return

        # Party 1: Owner confirms handover
        conn.execute(text("""
            UPDATE handovers 
            SET owner_confirmed = TRUE 
            WHERE id = :hid;
        """), {"hid": handover["id"]})
        print("[*] Party 1 (Owner) confirmed: True")

        # Party 2: Finder confirms handover
        conn.execute(text("""
            UPDATE handovers 
            SET finder_confirmed = TRUE, completed_at = NOW() 
            WHERE id = :hid;
        """), {"hid": handover["id"]})
        print("[*] Party 2 (Finder) confirmed: True")

        # Both parties confirmed -> Mark items as resolved
        conn.execute(text("""
            UPDATE items 
            SET status = 'resolved' 
            WHERE id IN (:lost_id, :found_id);
        """), {
            "lost_id": handover["lost_item_id"],
            "found_id": handover["found_item_id"]
        })
        print("[*] Lifecycle Update: Both items transitioned to 'resolved'!")
        print("==================================================")

if __name__ == "__main__":
    run_handover_closure()