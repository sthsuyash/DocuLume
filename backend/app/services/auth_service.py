"""Authentication service."""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, Token
from app.utils.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from datetime import datetime


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    async def register(db: AsyncSession, user_data: UserRegister) -> User:
        """Register a new user."""
        # Check if email exists
        result = await db.execute(select(User).filter(User.email == user_data.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Check if username exists
        result = await db.execute(select(User).filter(User.username == user_data.username))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        # Create user
        user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        return user

    @staticmethod
    async def login(db: AsyncSession, credentials: UserLogin) -> Token:
        """Authenticate user and return tokens."""
        result = await db.execute(select(User).filter(User.email == credentials.email))
        user = result.scalar_one_or_none()

        if not user or not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )

        # Update last login
        user.last_login = datetime.utcnow()
        await db.commit()

        # Create tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await db.execute(select(User).filter(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_user(db: AsyncSession, user_id: int, user_update) -> User:
        """Update user information."""
        from app.schemas.user import UserUpdate

        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Update fields if provided
        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:  # Only update non-None values
                setattr(user, field, value)

        user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)

        return user

    @staticmethod
    async def oauth_login(
        db: AsyncSession,
        provider: str,
        oauth_id: str,
        email: str,
        full_name: Optional[str] = None,
        avatar_url: Optional[str] = None
    ) -> Token:
        """Login or register user via OAuth."""
        # Try to find user by OAuth provider and ID
        result = await db.execute(
            select(User).filter(
                User.oauth_provider == provider,
                User.oauth_id == oauth_id
            )
        )
        user = result.scalar_one_or_none()

        # If not found, try by email
        if not user:
            result = await db.execute(select(User).filter(User.email == email))
            user = result.scalar_one_or_none()

            if user:
                # Update existing user with OAuth info
                user.oauth_provider = provider
                user.oauth_id = oauth_id
                if avatar_url:
                    user.avatar_url = avatar_url
            else:
                # Create new user
                # Generate username from email
                username = email.split('@')[0]
                # Make username unique if needed
                counter = 1
                original_username = username
                while True:
                    result = await db.execute(
                        select(User).filter(User.username == username)
                    )
                    if not result.scalar_one_or_none():
                        break
                    username = f"{original_username}{counter}"
                    counter += 1

                user = User(
                    email=email,
                    username=username,
                    full_name=full_name,
                    avatar_url=avatar_url,
                    oauth_provider=provider,
                    oauth_id=oauth_id,
                    is_verified=True,  # OAuth users are pre-verified
                    hashed_password=None  # No password for OAuth users
                )
                db.add(user)

        # Update last login
        user.last_login = datetime.utcnow()
        await db.commit()
        await db.refresh(user)

        # Create tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )

    @staticmethod
    async def refresh_token(db: AsyncSession, user_id: int) -> Token:
        """Generate new tokens using refresh token."""
        # Get user
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )

        # Create new tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token
        )
