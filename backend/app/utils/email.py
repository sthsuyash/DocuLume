"""Email sending utilities using SMTP."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.utils.logger import logger


async def send_email(to: str, subject: str, html_body: str) -> bool:
    """Send an email via SMTP. Returns True on success, False if SMTP is not configured."""
    from app.config import settings

    if not settings.smtp_host or not settings.smtp_username:
        # In dev, extract any URL from the body and log it so devs can click through
        import re
        urls = re.findall(r'href="([^"]+)"', html_body)
        if urls:
            logger.info(
                "\n"
                "╔══════════════════════════════════════════════════════════╗\n"
                "║  DEV MODE — EMAIL NOT SENT (SMTP not configured)         ║\n"
                "║  To: %-53s ║\n"
                "║  Subject: %-49s ║\n"
                "║  Link: %-52s ║\n"
                "╚══════════════════════════════════════════════════════════╝",
                to[:53], subject[:49], urls[0][:52],
            )
        else:
            logger.warning("SMTP not configured — skipping email send to %s", to)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.email_from
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_use_tls:
                server.starttls()
            server.login(settings.smtp_username, settings.smtp_password or "")
            server.sendmail(settings.email_from, to, msg.as_string())

        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        return False


async def send_password_reset_email(email: str, token: str) -> bool:
    from app.config import settings
    url = f"{settings.frontend_url}/auth/reset-password?token={token}"
    html = f"""
    <html><body>
      <h2>Reset your password</h2>
      <p>Click the link below to set a new password for your DocuLume account:</p>
      <p><a href="{url}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
      <p>Or copy this URL: <code>{url}</code></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </body></html>
    """
    return await send_email(email, "Reset your DocuLume password", html)


async def send_verification_email(email: str, token: str) -> bool:
    from app.config import settings
    url = f"{settings.frontend_url}/auth/verify-email?token={token}"
    html = f"""
    <html><body>
      <h2>Verify your email address</h2>
      <p>Click the link below to verify your DocuLume account:</p>
      <p><a href="{url}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Verify Email</a></p>
      <p>Or copy this URL: <code>{url}</code></p>
      <p>This link expires in 24 hours.</p>
    </body></html>
    """
    return await send_email(email, "Verify your DocuLume email", html)
