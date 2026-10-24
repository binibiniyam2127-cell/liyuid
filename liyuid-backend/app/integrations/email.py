import logging
import os
import smtplib
import time
from abc import ABC, abstractmethod
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger("liyuid.integrations.email")


class EmailProvider(ABC):
    @abstractmethod
    def send_verification_email(self, email: str, code: str) -> bool:
        pass


class SMTPEmailProvider(EmailProvider):
    def __init__(self):
        self.host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.port = int(os.getenv("SMTP_PORT", "465"))
        self.user = os.getenv("SMTP_USER", "")
        self.password = os.getenv("SMTP_PASSWORD", "").replace(" ", "")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", self.user or "noreply@liyuid.com")
        self.from_name = os.getenv("SMTP_FROM_NAME", "LIYUID National Registry")

    def is_configured(self) -> bool:
        return bool(self.user and self.password)

    def send_verification_email(self, email: str, code: str) -> bool:
        if not self.is_configured():
            logger.warning(
                f"[EMAIL STUB] SMTP credentials not set (SMTP_USER/SMTP_PASSWORD). "
                f"Simulating delivery to {email} with verification code: {code}"
            )
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"{code} is your LIYUID verification code"
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = email

            text_content = f"""LIYUID - Verification Code
------------------------------------
Your email verification code is: {code}

Enter this code on the verification page to complete your registration.
This code expires in 15 minutes.

If you did not request this, you can safely ignore this email.
"""

            html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LIYUID Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7fb; margin: 0; padding: 32px 16px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2eaf4; padding: 36px 32px; box-shadow: 0 4px 16px rgba(6,43,114,0.06);">
    <div style="text-align: center; margin-bottom: 28px;">
      <h1 style="color: #062B72; font-size: 26px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">LIYUID</h1>
      <p style="color: #64748B; font-size: 13px; margin: 6px 0 0 0; font-weight: 600;">Unified Lost &amp; Found Registry of Ethiopia</p>
    </div>
    
    <div style="background: linear-gradient(180deg, #F0F7FF 0%, #FFFFFF 100%); border: 2px solid #B9E1FD; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 28px;">
      <span style="font-size: 11px; font-weight: 800; color: #087FF5; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Your 6-Digit Verification Code</span>
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #062B72; margin: 12px 0;">{code}</div>
      <span style="font-size: 12px; color: #64748B; font-weight: 600;">⏱ Valid for 15 minutes</span>
    </div>

    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Hello,
    </p>
    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      Please enter the 6-digit code above to verify your email address and activate your <strong>LIYUID</strong> citizen account.
    </p>

    <div style="border-top: 1px solid #e2eaf4; padding-top: 20px; margin-top: 28px; text-align: center;">
      <p style="color: #94A3B8; font-size: 11px; margin: 0; line-height: 1.5;">
        This is an automated security message from the LIYUID Municipal Registry.<br>
        If you did not attempt to register, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
"""
            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            for attempt in range(1, 3):
                try:
                    if self.port == 465:
                        with smtplib.SMTP_SSL(self.host, self.port, timeout=25) as server:
                            server.login(self.user, self.password)
                            server.sendmail(self.from_email, [email], msg.as_string())
                    else:
                        with smtplib.SMTP(self.host, self.port, timeout=25) as server:
                            server.ehlo()
                            server.starttls()
                            server.ehlo()
                            server.login(self.user, self.password)
                            server.sendmail(self.from_email, [email], msg.as_string())

                    logger.info(f"[EMAIL DELIVERED] Real verification email successfully delivered to {email}")
                    return True
                except Exception as e:
                    if attempt == 2:
                        logger.error(f"[EMAIL ERROR] Failed to send real verification email to {email}: {e}")
                        return False
                    time.sleep(1.5)
            return False
        except Exception as e:
            logger.error(f"[EMAIL ERROR] Failed preparing or sending verification email: {e}")
            return False


email_client = SMTPEmailProvider()


def send_email_notification(to_email: str, subject: str, body: str) -> bool:
    try:
        if not email_client.is_configured():
            logger.info(f"[EMAIL SIMULATED] To: {to_email} | Subject: {subject}")
            return True

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{email_client.from_name} <{email_client.from_email}>"
        msg["To"] = to_email
        msg.attach(MIMEText(body, "plain"))

        if email_client.port == 465:
            with smtplib.SMTP_SSL(email_client.host, email_client.port, timeout=25) as server:
                server.login(email_client.user, email_client.password)
                server.sendmail(email_client.from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(email_client.host, email_client.port, timeout=25) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(email_client.user, email_client.password)
                server.sendmail(email_client.from_email, [to_email], msg.as_string())

        logger.info(f"[EMAIL DELIVERED] Notification sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL ERROR] Failed to send email to {to_email}: {e}")
        return False
