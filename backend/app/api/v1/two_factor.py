"""Two-factor authentication (TOTP) routes."""

import io
import base64
import pyotp
import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth/2fa", tags=["Two-Factor Auth"])


class TOTPVerify(BaseModel):
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class TOTPSetupResponse(BaseModel):
    secret: str
    qr_code_base64: str
    otpauth_url: str


@router.post("/setup", response_model=TOTPSetupResponse)
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new TOTP secret and QR code. Does not enable 2FA yet."""
    if current_user.totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled. Disable it first.",
        )
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=current_user.email, issuer_name="DocuLume")

    img = qrcode.make(otpauth_url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    current_user.totp_secret = secret
    await db.commit()

    return TOTPSetupResponse(secret=secret, qr_code_base64=qr_b64, otpauth_url=otpauth_url)


@router.post("/enable", status_code=204)
async def enable_2fa(
    data: TOTPVerify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enable 2FA after verifying the first TOTP code."""
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Run /auth/2fa/setup first.",
        )
    if current_user.totp_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA already enabled.")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(data.code, valid_window=1):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP code.")

    current_user.totp_enabled = True
    await db.commit()


@router.post("/disable", status_code=204)
async def disable_2fa(
    data: TOTPVerify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disable 2FA after verifying the current TOTP code."""
    if not current_user.totp_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled.")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(data.code, valid_window=1):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP code.")

    current_user.totp_enabled = False
    current_user.totp_secret = None
    await db.commit()


@router.get("/status")
async def get_2fa_status(current_user: User = Depends(get_current_user)):
    return {"totp_enabled": current_user.totp_enabled}
