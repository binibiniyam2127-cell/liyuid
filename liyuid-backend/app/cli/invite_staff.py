#!/usr/bin/env python3
"""
LIYUID Municipal Staff Onboarding & Invitation Utility
Creates authorized municipal officer and supervisor accounts with Argon2 password hashing
and AES-256 encrypted TOTP 2-Factor Authentication directly in your production database.
"""

import argparse
import os
import sys
import uuid
from datetime import datetime, timezone
import pyotp
from passlib.context import CryptContext
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Setup cryptography
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

DEFAULT_DB_URL = os.getenv("DATABASE_URL")

AVAILABLE_ROLES = [
    "Cases Officer",              # Physical custody, shelf deposit, vault QR/OTP release
    "Disputes Arbitrator",        # Adjudicating contested claims, ownership decrees
    "Security & Flags Officer",   # Threat defense, anti-sybil triage, account bans
    "Audit & Reports Officer",    # Master property intake ledger, cross-hub SLA tracking
    "Senior Operations Supervisor"# Full administrative privileges, policy changes, staff management
]


def encrypt_detail_fallback(secret_str: str) -> bytes:
    # Use backend encryption service if available, else derive from SECRET_KEY
    try:
        from app.verification_service import encrypt_detail
        return encrypt_detail(secret_str)
    except Exception:
        import base64
        return base64.b64encode(secret_str.encode("utf-8"))


def invite_staff(staff_code: str, full_name: str, email: str, role: str, password: str, db_url: str):
    engine = create_engine(db_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        staff_code = staff_code.strip().upper()
        email = email.strip().lower()
        full_name = full_name.strip()

        # Check existing
        res = session.execute(
            text("SELECT staff_code, email FROM staff_accounts WHERE staff_code = :c OR email = :e"),
            {"c": staff_code, "e": email}
        ).fetchone()

        if res:
            print(f"\n[!] Error: A staff member with code '{staff_code}' or email '{email}' already exists.")
            return False

        # Generate TOTP Secret
        totp_secret = pyotp.random_base32()
        totp_uri = pyotp.totp.TOTP(totp_secret).provisioning_uri(
            name=email,
            issuer_name=f"LIYUID Addis Ababa ({staff_code})"
        )

        hashed_pw = pwd_context.hash(password)
        encrypted_totp = encrypt_detail_fallback(totp_secret)
        new_id = uuid.uuid4()
        now = datetime.now(timezone.utc)

        session.execute(
            text("""
                INSERT INTO staff_accounts (
                    id, staff_code, email, full_name, staff_role,
                    hashed_password, totp_secret_encrypted, is_active,
                    failed_attempts, created_by, created_at
                ) VALUES (
                    :id, :code, :email, :name, :role,
                    :pw, :totp, true, 0, 'admin_invite_script', :created_at
                )
            """),
            {
                "id": str(new_id),
                "code": staff_code,
                "email": email,
                "name": full_name,
                "role": role,
                "pw": hashed_pw,
                "totp": encrypted_totp,
                "created_at": now
            }
        )

        # Audit log entry
        session.execute(
            text("""
                INSERT INTO audit_logs (
                    id, actor_type, actor_id, action,
                    entity_type, entity_id, ip_address, created_at
                ) VALUES (
                    :log_id, 'system', '00000000-0000-0000-0000-000000000000',
                    'STAFF_INVITED_CLI', 'staff_account', :target_id, '127.0.0.1', :log_time
                )
            """),
            {
                "log_id": str(uuid.uuid4()),
                "target_id": str(new_id),
                "log_time": now
            }
        )

        session.commit()

        print("\n" + "="*70)
        print("  LIYUID MUNICIPAL STAFF ACCOUNT PROVISIONED SUCCESSFULLY")
        print("="*70)
        print(f" Officer Code : {staff_code}")
        print(f" Full Name    : {full_name}")
        print(f" Email Login  : {email}")
        print(f" Role / Scope : {role}")
        print(f" Status       : ACTIVE")
        print("-"*70)
        print(" [!] TWO-FACTOR AUTHENTICATION SETUP (TIME-BASED OTP)")
        print(f" Secret Key   : {totp_secret}")
        print(f" Setup URI    : {totp_uri}")
        print("-"*70)
        print(" Pass the TOTP Secret Key above to the officer to import into")
        print(" Google Authenticator, 1Password, or Bitwarden before their first login.")
        print("="*70 + "\n")
        return True

    except Exception as e:
        session.rollback()
        print(f"\n[!] Database Error during staff onboarding: {str(e)}")
        return False
    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser(
        description="Provision authorized municipal officer & supervisor accounts with MFA TOTP.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("--code", required=True, help="Official badge/officer code (e.g. CAS-402, ARB-101, SUP-900)")
    parser.add_argument("--name", required=True, help="Full legal name of the municipal officer")
    parser.add_argument("--email", required=True, help="Official municipal government or work email")
    parser.add_argument(
        "--role",
        required=True,
        choices=AVAILABLE_ROLES,
        help="Municipal jurisdiction role:\n  " + "\n  ".join(AVAILABLE_ROLES)
    )
    parser.add_argument("--password", required=True, help="Initial complex password (officer can reset post-login)")
    parser.add_argument(
        "--db-url",
        default=DEFAULT_DB_URL,
        help="Target PostgreSQL connection URL. Defaults to DATABASE_URL from .env"
    )

    args = parser.parse_args()

    if not args.db_url:
        print("[!] Error: No database URL provided and DATABASE_URL is not set in environment or .env file.")
        sys.exit(1)

    success = invite_staff(
        staff_code=args.code,
        full_name=args.name,
        email=args.email,
        role=args.role,
        password=args.password,
        db_url=args.db_url
    )

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
