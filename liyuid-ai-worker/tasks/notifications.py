import secrets
from sqlalchemy import text

from tasks.common import (
    SessionLocal,
    redis_client,
    send_email_alert,
    send_sms_alert,
    send_telegram_alert,
)
from tasks.config import app


@app.task(name="tasks.dispatch_match_notification")
def dispatch_match_notification(match_id: str):
    """
    FR-06: Identifies users linked to the match, verifies channels,
    and dispatches timely, privacy-preserving notification alerts via Email, Telegram, and SMS.
    """
    db = SessionLocal()
    try:
        query = text("""
            SELECT 
                m.id AS match_id,
                m.composite_score,
                m.score_breakdown,
                l.id AS lost_id,
                l.category,
                l.public_description AS lost_desc,
                l.user_id AS lost_user_id,
                lu.full_name AS lost_user_name,
                lu.email AS lost_user_email,
                lu.telegram_chat_id AS lost_telegram,
                lu.phone_number AS lost_phone,
                f.id AS found_id,
                f.public_description AS found_desc,
                f.user_id AS found_user_id,
                fu.full_name AS found_user_name,
                fu.email AS found_user_email,
                fu.telegram_chat_id AS found_telegram,
                fu.phone_number AS found_phone
            FROM matches m
            JOIN items l ON m.lost_item_id = l.id
            JOIN items f ON m.found_item_id = f.id
            JOIN users lu ON l.user_id = lu.id
            JOIN users fu ON f.user_id = fu.id
            WHERE m.id = :match_id;
        """)

        match = db.execute(query, {"match_id": match_id}).mappings().first()
        if not match:
            print(f"[Dispatcher] Match ID {match_id} not found.")
            return {"status": "not_found"}

        score = float(match["composite_score"])
        score_percent = int(score * 100)
        category_name = match["category"].capitalize()

        # Generate 6-digit Item Confirmation Code and store in Redis (24-hour TTL)
        confirmation_code = f"{secrets.randbelow(900000) + 100000}"
        if redis_client:
            try:
                redis_client.set(f"match_confirm_code:{match_id}", confirmation_code, ex=86400)
                print(f"[REDIS SUCCESS] Stored match confirmation code for {match_id}: {confirmation_code}")
            except Exception as e:
                print(f"[REDIS ERROR] Failed saving match confirm code: {e}")

        # ----------------------------------------------------
        # 1. Format & Dispatch Owner Notification
        # ----------------------------------------------------
        owner_msg = (
            f"🔍 *LIYUID Potential Match Detected!*\n\n"
            f"Hello {match['lost_user_name']},\n"
            f"A found *{category_name}* has been reported matching your item with *{score_percent}%* confidence!\n\n"
            f"🔑 *Your Item Confirmation Code:* `{confirmation_code}`\n"
            f"⏱ *Valid for 24 Hours*\n\n"
            f"📝 *Description:* \"{match['found_desc'][:80]}...\"\n\n"
            f"👉 Open the LIYUID app to enter this code, confirm ownership, and unlock safe handover:\n"
            f"http://localhost:3000/matches"
        )

        # Telegram Bot Alert
        if match["lost_telegram"]:
            send_telegram_alert(match["lost_telegram"], owner_msg)

        # SMS Alert
        if match["lost_phone"]:
            sms_text = f"LIYUID: A found {match['category']} matching your report was identified ({score_percent}%). Your confirmation code is {confirmation_code}. Enter it at liyuid.com/matches to confirm."
            send_sms_alert(match["lost_phone"], sms_text)

        # Real Email Alert
        if match.get("lost_user_email"):
            owner_html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f7fb; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2eaf4; padding: 32px; box-shadow: 0 4px 12px rgba(6,43,114,0.06);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #062B72; font-size: 24px; font-weight: 900; margin: 0;">LIYUID MATCH ALERT</h2>
      <p style="color: #64748B; font-size: 13px; margin: 4px 0 0 0;">Unified Lost &amp; Found Registry of Ethiopia</p>
    </div>
    <div style="background: #F0F7FF; border: 2px solid #B9E1FD; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 11px; font-weight: 800; color: #087FF5; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">Match Confidence Score</span>
      <div style="font-size: 36px; font-weight: 900; color: #062B72; margin: 6px 0;">{score_percent}%</div>
      <span style="font-size: 12px; color: #16a34a; font-weight: 700;">High AI Vector Match Detected</span>
    </div>
    
    <div style="background: linear-gradient(180deg, #F0F7FF 0%, #FFFFFF 100%); border: 2px solid #087FF5; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0;">
      <span style="font-size: 11px; font-weight: 800; color: #087FF5; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">Your 6-Digit Item Confirmation Code</span>
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #062B72; margin: 8px 0;">{confirmation_code}</div>
      <span style="font-size: 12px; color: #64748B; font-weight: 600;">⏱ Valid for 24 hours &bull; Enter in app to confirm ownership</span>
    </div>

    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
      Hello <strong>{match['lost_user_name']}</strong>,
    </p>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
      A found <strong>{category_name}</strong> has been reported in Addis Ababa that strongly matches your lost item report!
    </p>
    <div style="background: #F8FAFC; border: 1px solid #E2EAF4; border-radius: 12px; padding: 14px; margin: 18px 0; font-size: 13px; color: #475569;">
      <strong>Found Item Snippet:</strong> "{match['found_desc'][:120]}..."
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="http://localhost:3000/matches" style="background: #087FF5; color: #ffffff; padding: 12px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">
        Verify Your Ownership
      </a>
    </div>
    <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin-top: 20px; border-top: 1px solid #E2EAF4; padding-top: 16px; text-align: center;">
      Click the link above and enter your 6-digit confirmation code <strong>{confirmation_code}</strong> to confirm your item and unlock safe handover.
    </p>
  </div>
</body>
</html>"""
            send_email_alert(
                match["lost_user_email"],
                f"🔍 LIYUID Match Detected: Found {category_name} ({score_percent}% Confidence)",
                f"LIYUID: A found {category_name} has been reported matching your lost item with {score_percent}% confidence. Your 6-digit confirmation code is: {confirmation_code}. Visit http://localhost:3000/matches to enter it and verify.",
                owner_html,
            )

        # ----------------------------------------------------
        # 2. Format & Dispatch Finder Notification
        # ----------------------------------------------------
        finder_msg = (
            f"🔔 *LIYUID Match Candidate Update*\n\n"
            f"Hello {match['found_user_name']},\n"
            f"A lost item report closely matches the *{category_name}* you submitted (`{score_percent}%` confidence).\n\n"
            f"The potential owner has been notified to complete identity and item verification."
        )

        # Telegram Bot Alert
        if match["found_telegram"]:
            send_telegram_alert(match["found_telegram"], finder_msg)

        # SMS Alert
        if match["found_phone"]:
            sms_text = f"LIYUID: A potential owner was found for your registered {match['category']} ({score_percent}% confidence)."
            send_sms_alert(match["found_phone"], sms_text)

        # Real Email Alert
        if match.get("found_user_email"):
            finder_html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f7fb; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2eaf4; padding: 32px; box-shadow: 0 4px 12px rgba(6,43,114,0.06);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #062B72; font-size: 24px; font-weight: 900; margin: 0;">LIYUID MATCH CANDIDATE</h2>
      <p style="color: #64748B; font-size: 13px; margin: 4px 0 0 0;">Unified Lost &amp; Found Registry of Ethiopia</p>
    </div>
    <div style="background: #F0FDF4; border: 2px solid #BBF7D0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 11px; font-weight: 800; color: #16a34a; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">Match Candidate Identified</span>
      <div style="font-size: 36px; font-weight: 900; color: #062B72; margin: 6px 0;">{score_percent}%</div>
      <span style="font-size: 12px; color: #16a34a; font-weight: 700;">Owner Notified for Verification</span>
    </div>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
      Hello <strong>{match['found_user_name']}</strong>,
    </p>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
      A citizen's lost item report has been matched to the <strong>{category_name}</strong> you found. The potential owner has been notified to complete identity &amp; item verification.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="http://localhost:3000/handover" style="background: #16a34a; color: #ffffff; padding: 12px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">
        View Handover Portal
      </a>
    </div>
  </div>
</body>
</html>"""
            send_email_alert(
                match["found_user_email"],
                f"🔔 LIYUID Update: Potential Owner Found for {category_name} ({score_percent}% Confidence)",
                f"LIYUID: A potential owner was found for your registered {category_name} ({score_percent}% confidence). The owner is currently verifying ownership.",
                finder_html,
            )

        return {"status": "dispatched", "match_id": match_id, "score": score}

    except Exception as exc:
        print(f"[Dispatcher Error] {exc}")
        return {"status": "error", "detail": str(exc)}
    finally:
        db.close()
