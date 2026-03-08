"""OAuth authentication handlers."""

from typing import Optional, Dict
import httpx
from fastapi import HTTPException, status
from app.config import settings


class OAuthProvider:
    """Base OAuth provider."""

    async def get_user_info(self, code: str, redirect_uri: str) -> Dict[str, str]:
        """Get user info from OAuth provider."""
        raise NotImplementedError


class GoogleOAuthProvider(OAuthProvider):
    """Google OAuth provider."""

    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    async def get_user_info(self, code: str, redirect_uri: str) -> Dict[str, str]:
        """Get user info from Google."""
        if not settings.google_client_id or not settings.google_client_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth not configured"
            )

        # Exchange code for token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                self.TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                }
            )

            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get access token from Google"
                )

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            # Get user info
            user_response = await client.get(
                self.USER_INFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from Google"
                )

            user_data = user_response.json()

            return {
                "oauth_id": user_data["id"],
                "email": user_data["email"],
                "full_name": user_data.get("name"),
                "avatar_url": user_data.get("picture"),
            }


class GitHubOAuthProvider(OAuthProvider):
    """GitHub OAuth provider."""

    TOKEN_URL = "https://github.com/login/oauth/access_token"
    USER_INFO_URL = "https://api.github.com/user"
    USER_EMAIL_URL = "https://api.github.com/user/emails"

    async def get_user_info(self, code: str, redirect_uri: str) -> Dict[str, str]:
        """Get user info from GitHub."""
        if not settings.github_client_id or not settings.github_client_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GitHub OAuth not configured"
            )

        # Exchange code for token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                self.TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "redirect_uri": redirect_uri,
                },
                headers={"Accept": "application/json"}
            )

            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get access token from GitHub"
                )

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            # Get user info
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }

            user_response = await client.get(self.USER_INFO_URL, headers=headers)

            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from GitHub"
                )

            user_data = user_response.json()

            # Get primary email if not public
            email = user_data.get("email")
            if not email:
                email_response = await client.get(self.USER_EMAIL_URL, headers=headers)
                if email_response.status_code == 200:
                    emails = email_response.json()
                    primary_email = next(
                        (e for e in emails if e.get("primary") and e.get("verified")),
                        None
                    )
                    if primary_email:
                        email = primary_email["email"]

            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not get email from GitHub"
                )

            return {
                "oauth_id": str(user_data["id"]),
                "email": email,
                "full_name": user_data.get("name"),
                "avatar_url": user_data.get("avatar_url"),
            }


def get_oauth_provider(provider: str) -> OAuthProvider:
    """Get OAuth provider instance."""
    if provider == "google":
        return GoogleOAuthProvider()
    elif provider == "github":
        return GitHubOAuthProvider()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {provider}"
        )
