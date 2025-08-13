"""Chat routes — aggregates ask, conversation, and feedback sub-routers."""

from fastapi import APIRouter

from app.api.v1.chat_ask import router as ask_router
from app.api.v1.chat_conversations import router as conversations_router
from app.api.v1.chat_feedback import router as feedback_router

router = APIRouter()
router.include_router(ask_router)
router.include_router(conversations_router)
router.include_router(feedback_router)
