"""Shared dependencies for chat routes."""

from fastapi import Depends

from app.core.rag import VectorStore
from app.middleware import get_current_user
from app.models.user import User


def get_vector_store(current_user: User = Depends(get_current_user)) -> VectorStore:
    return VectorStore(api_key=current_user.openai_api_key)
