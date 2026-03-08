"""User schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_admin: bool = False
    oauth_provider: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None


class UserWithKeys(UserResponse):
    has_openai_key: bool = False
    has_anthropic_key: bool = False
    has_google_key: bool = False
