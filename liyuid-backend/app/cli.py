# app/cli.py
import argparse
import os
import uuid
import pyotp
from passlib.context import CryptContext
from sqlalchemy import select

from app.database import SessionLocal
from app.models import AuditLog, StaffAccount
from app.verification_service import encrypt_detail

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def main():
    parser = argparse.ArgumentParser(description="Liyuid Administrative CLI")
    subparsers = parser.add_subparsers(dest="command")

    # Staff Account Creation
    create_p = subparsers.add_parser("create_staff")
    create_p.add_argument("--code", required=True, help="Staff identifier (e.g., STF-01)")
    create_p.add_argument("--email", required=True)
    create_p.add_argument("--name", required=True)
    create_p.add_argument("--password", required=True)
    create_p.add_argument("--role", default="moderator")

    # View Audit Logs
    audit_p = subparsers.add_parser("view_audit_logs")
    audit_p.add_argument("--limit", type=int, default=50)

    args = parser.parse_args()
    db = SessionLocal()

    if args.command == "create_staff":
        totp_secret = pyotp.random_base32()
        staff = StaffAccount(
            id=uuid.uuid4(),
            staff_code=args.code,
            email=args.email,
            full_name=args.name,
            staff_role=args.role,
            hashed_password=pwd_context.hash(args.password),
            totp_secret_encrypted=encrypt_detail(totp_secret),
            created_by="system_cli",
        )
        db.add(staff)
        db.commit()
        print(f"[+] Staff member created successfully: {args.code}")
        print(f"[!] Authenticator TOTP Secret: {totp_secret}")

    elif args.command == "view_audit_logs":
        logs = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(args.limit)).all()
        for log in logs:
            print(f"[{log.created_at}] ({log.severity.upper()}) {log.action} on {log.entity_type}:{log.entity_id}")

    db.close()


if __name__ == "__main__":
    main()