"""Message feedback routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.message import FeedbackCreate, FeedbackResponse
from app.services import FeedbackService
from app.middleware import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["Feedback"])


@router.post("/messages/{message_id}/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    message_id: int,
    body: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    feedback = await FeedbackService.submit(db, message_id, current_user.id, body.value, body.comment)
    return FeedbackResponse.model_validate(feedback)


@router.delete("/messages/{message_id}/feedback", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feedback(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await FeedbackService.delete(db, message_id, current_user.id)
