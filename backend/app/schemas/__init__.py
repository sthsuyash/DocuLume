"""Pydantic schemas for request/response validation."""

from app.schemas.common import Response, ErrorResponse
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    TokenData,
    RefreshToken,
    OAuthLogin,
)
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserWithKeys,
)
from app.schemas.document import (
    DocumentUpload,
    DocumentResponse,
    DocumentList,
)
from app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationWithMessages,
    ConversationList,
)
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    ChatRequest,
    ChatResponse,
)

__all__ = [
    "Response",
    "ErrorResponse",
    "UserRegister",
    "UserLogin",
    "Token",
    "TokenData",
    "RefreshToken",
    "OAuthLogin",
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserWithKeys",
    "DocumentUpload",
    "DocumentResponse",
    "DocumentList",
    "ConversationCreate",
    "ConversationUpdate",
    "ConversationResponse",
    "ConversationWithMessages",
    "ConversationList",
    "MessageCreate",
    "MessageResponse",
    "ChatRequest",
    "ChatResponse",
]
