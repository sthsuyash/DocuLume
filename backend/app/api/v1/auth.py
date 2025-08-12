"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, RefreshToken
from app.schemas.user import UserResponse, PasswordChange, PasswordResetRequest, PasswordReset
from app.services import AuthService
from app.middleware import get_current_user
from app.models.user import User
from app.core.auth.oauth import get_oauth_provider
from app.utils.security import verify_token
from app.utils.csrf import create_csrf_token_with_signature
from app.config import settings
from app.utils import audit

router = APIRouter(prefix="/auth", tags=["Authentication"])


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    csrf_token: str,
    csrf_signature: str
) -> None:
    """Set authentication cookies with secure flags."""
    # Determine if we're in production (use Secure flag only in production)
    is_production = settings.environment == "production"

    # Set access token (httpOnly, cannot be accessed by JavaScript)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_production,  # Only send over HTTPS in production
        samesite="lax",  # CSRF protection
        max_age=settings.access_token_expire_minutes * 60,  # Convert to seconds
        path="/",
    )

    # Set refresh token (httpOnly, cannot be accessed by JavaScript)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,  # Convert to seconds
        path="/",
    )

    # Set CSRF token (NOT httpOnly, needs to be readable by JavaScript)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,  # JavaScript needs to read this
        secure=is_production,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/",
    )

    # Set CSRF signature (httpOnly, for server-side validation)
    response.set_cookie(
        key="csrf_signature",
        value=csrf_signature,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear all authentication cookies."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="csrf_token", path="/")
    response.delete_cookie(key="csrf_signature", path="/")



@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    request: Request,
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user."""
    user = await AuthService.register(db, user_data)
    ip = request.client.host if request.client else "unknown"
    audit.log_register(user.id, user.email, ip)
    await audit.emit_db(db, "auth.register", user.id, user.email, ip)
    return user


@router.post("/login")
async def login(
    credentials: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Login and set authentication cookies."""
    ip = response.headers.get("X-Forwarded-For", None) or (request.client.host if request.client else "unknown")
    try:
        token = await AuthService.login(db, credentials)
    except Exception:
        audit.log_login_failure(credentials.email, ip, "invalid_credentials")
        raise

    # Get user ID from token to generate CSRF token
    payload = verify_token(token.access_token, token_type="access")
    user_id = int(payload.get("sub"))

    # Generate CSRF token and signature
    csrf_token, csrf_signature = create_csrf_token_with_signature(user_id)

    # Set cookies
    set_auth_cookies(
        response,
        token.access_token,
        token.refresh_token,
        csrf_token,
        csrf_signature
    )

    audit.log_login_success(user_id, credentials.email, ip)
    await audit.emit_db(db, "auth.login.success", user_id, credentials.email, ip)
    return {
        "message": "Login successful",
        "user_id": user_id
    }


@router.post("/refresh")
async def refresh_access_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token from cookie."""
    # Get refresh token from cookie
    refresh_token_value = request.cookies.get("refresh_token")

    if not refresh_token_value:
        raise HTTPException(
            status_code=401,
            detail="Refresh token not found"
        )

    # Verify refresh token
    payload = verify_token(refresh_token_value, token_type="refresh")

    if not payload:
        # Clear invalid cookies
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("sub")
    if not user_id:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token payload"
        )

    # Get new tokens
    new_tokens = await AuthService.refresh_token(db, int(user_id))

    # Generate new CSRF token and signature
    csrf_token, csrf_signature = create_csrf_token_with_signature(int(user_id))

    # Set new cookies
    set_auth_cookies(
        response,
        new_tokens.access_token,
        new_tokens.refresh_token,
        csrf_token,
        csrf_signature
    )

    # Return success message
    return {
        "message": "Token refreshed successfully",
        "user_id": int(user_id)
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return current_user


@router.post("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    response: Response,
    code: str = Query(...),
    redirect_uri: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Handle OAuth callback and login/register user."""
    # Get OAuth provider
    oauth_provider = get_oauth_provider(provider)

    # Get user info from OAuth provider
    user_info = await oauth_provider.get_user_info(code, redirect_uri)

    # Login or register user
    token = await AuthService.oauth_login(
        db=db,
        provider=provider,
        oauth_id=user_info["oauth_id"],
        email=user_info["email"],
        full_name=user_info.get("full_name"),
        avatar_url=user_info.get("avatar_url")
    )

    # Get user ID from token
    payload = verify_token(token.access_token, token_type="access")
    user_id = int(payload.get("sub"))

    # Generate CSRF token and signature
    csrf_token, csrf_signature = create_csrf_token_with_signature(user_id)

    # Set cookies
    set_auth_cookies(
        response,
        token.access_token,
        token.refresh_token,
        csrf_token,
        csrf_signature
    )

    ip = request.client.host if request.client else "unknown"
    audit.log_oauth_login(user_id, provider, ip)
    return {
        "message": "OAuth login successful",
        "user_id": user_id
    }


@router.get("/verify-email")
async def verify_email(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Verify email address via token sent in registration email."""
    await AuthService.verify_email(db, token)
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resend email verification link to the current user."""
    await AuthService.resend_verification(db, current_user)
    return {"message": "Verification email sent"}


@router.post("/change-password", status_code=204)
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password for the currently authenticated user."""
    await AuthService.change_password(db, current_user, data.current_password, data.new_password)


@router.post("/forgot-password", status_code=202)
async def forgot_password(
    data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a password-reset email. Always returns 202 to prevent user enumeration."""
    await AuthService.request_password_reset(db, data.email)
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=204)
async def reset_password(
    data: PasswordReset,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using a token from the reset email."""
    await AuthService.reset_password(db, data.token, data.new_password)


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user)
):
    """Logout and clear authentication cookies."""
    clear_auth_cookies(response)
    ip = request.client.host if request.client else "unknown"
    audit.log_logout(current_user.id, ip)
    return {"message": "Logout successful"}


@router.get("/ws-token")
async def get_websocket_token(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Get a token for WebSocket authentication (read from httpOnly cookie)."""
    # Get access token from httpOnly cookie
    access_token = request.cookies.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    # Return the token so it can be used for WebSocket connection
    return {"token": access_token}
