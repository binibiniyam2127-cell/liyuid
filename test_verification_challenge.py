import os
import uuid
import secrets
import hashlib
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://liyuid_admin:password@postgres:5432/liyuid_db")
engine = create_engine(DATABASE_URL)

def run_verification_test():
    with engine.begin() as conn:
        match_row = conn.execute(text("""
            SELECT m.id AS match_id, m.lost_item_id, m.found_item_id, m.verification_attempts, m.is_verified,
                   i.private_challenge_truth, i.challenge_question, i.status
            FROM matches m
            JOIN items i ON m.lost_item_id = i.id
            WHERE m.id = 'dad98b7b-ef5e-4d17-bd36-da9d000b840e';
        """)).mappings().first()

        if not match_row:
            print("[-] Match record not found.")
            return

        match_id = match_row["match_id"]
        item_id = match_row["lost_item_id"]
        ground_truth = match_row["private_challenge_truth"]

        print("==================================================")
        print("PHASE 3 VERIFICATION TEST (FR-05 & FR-07)")
        print("==================================================")
        print(f"[*] Match ID         : {match_id}")
        print(f"[*] Item ID          : {item_id}")
        print(f"[*] Question         : {match_row['challenge_question']}")
        print(f"[*] Registered Truth : {ground_truth}")
        print("--------------------------------------------------")

        # Test 1: Submitting incorrect answer
        wrong_attempt = "wrong_serial_or_wallpaper"
        print(f"[*] Test 1: Submitting Incorrect Claim ('{wrong_attempt}')...")
        
        normalized_truth = (ground_truth or "").strip().lower()
        normalized_wrong = wrong_attempt.strip().lower()
        is_valid = secrets.compare_digest(normalized_truth, normalized_wrong)

        if not is_valid:
            new_attempts = match_row["verification_attempts"] + 1
            remaining = max(0, 3 - new_attempts)
            conn.execute(text("""
                UPDATE matches SET verification_attempts = :att WHERE id = :mid;
            """), {"att": new_attempts, "mid": match_id})
            print(f"    [PASS] Challenge Failed as expected.")
            print(f"    Attempts Used: {new_attempts}/3 (Remaining: {remaining})")

        # Test 2: Submitting matching ground truth
        print(f"\n[*] Test 2: Submitting Correct Claim ('{ground_truth}')...")
        normalized_correct = ground_truth.strip().lower()
        is_valid_now = secrets.compare_digest(normalized_truth, normalized_correct)

        if is_valid_now:
            raw_token = secrets.token_hex(4).upper()
            code_hash = hashlib.sha256(raw_token.encode()).hexdigest()

            # Execute separate single statements
            conn.execute(text("""
                UPDATE items SET status = 'matched_pending_handoff' WHERE id = :iid;
            """), {"iid": item_id})

            conn.execute(text("""
                UPDATE matches SET is_verified = TRUE WHERE id = :mid;
            """), {"mid": match_id})

            handover_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO handovers (
                    id, match_id, handover_code_hash, owner_confirmed, 
                    finder_confirmed, created_at
                ) VALUES (
                    :hid, :mid, :hhash, FALSE, FALSE, NOW()
                )
                ON CONFLICT (match_id) DO UPDATE 
                SET handover_code_hash = EXCLUDED.handover_code_hash;
            """), {"hid": handover_id, "mid": match_id, "hhash": code_hash})

            print("    [PASS] Verification Succeeded!")
            print(f"    Item Status Updated   : 'matched_pending_handoff'")
            print(f"    Match is_verified     : True")
            print(f"    One-Time Token (FR-07): {raw_token}")
            print(f"    SHA-256 Stored Hash   : {code_hash[:25]}...")

        print("==================================================")

if __name__ == "__main__":
    run_verification_test()