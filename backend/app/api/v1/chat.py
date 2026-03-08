"""Chat routes."""

from typing import List
import json
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse, Response, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.schemas.message import ChatRequest, ChatResponse, MessageResponse
from app.schemas.conversation import ConversationResponse, ConversationList, ConversationWithMessages
from app.schemas.common import PaginationParams, PaginatedResponse
from app.services import ChatService
from app.middleware import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.core.rag import VectorStore
from app.utils.export import ExportService
from app.core.context import get_context_manager, auto_summarize_if_needed
from app.api.websocket.context import manager as ws_manager

router = APIRouter(prefix="/chat", tags=["Chat"])


def get_vector_store(current_user: User = Depends(get_current_user)):
    """Get vector store instance with user's API key."""
    api_key = current_user.openai_api_key
    return VectorStore(api_key=api_key)


@router.post("/ask", response_model=ChatResponse)
async def ask_question(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store)
):
    """Ask a question using RAG."""
    answer, sources, conversation_id, message_id = await ChatService.ask_question(
        db=db,
        user=current_user,
        question=request.question,
        conversation_id=request.conversation_id,
        vector_store=vector_store,
        use_rag=request.use_rag,
        top_k=request.top_k
    )

    # Broadcast context update via WebSocket
    try:
        context_mgr = await get_context_manager(conversation_id, db)
        if context_mgr:
            usage = await context_mgr.calculate_context_usage(db)
            warning_level = await context_mgr.get_context_warning_level(db)

            # Check if we need to summarize
            if usage.needs_summarization:
                # Notify clients that summarization is starting
                old_tokens = usage.total_tokens
                await ws_manager.send_summarization_started(
                    conversation_id,
                    usage.message_count,
                    5  # keep_recent
                )

                # Perform summarization
                await auto_summarize_if_needed(conversation_id, db)

                # Get new usage after summarization
                new_usage = await context_mgr.calculate_context_usage(db)
                await ws_manager.send_summarization_complete(
                    conversation_id,
                    new_usage.total_tokens,
                    old_tokens
                )

                # Update with new usage
                usage = new_usage
                warning_level = await context_mgr.get_context_warning_level(db)

            # Send context update
            await ws_manager.send_context_update(
                conversation_id,
                usage,
                warning_level
            )
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Error broadcasting context update: {e}")

    return ChatResponse(
        answer=answer,
        sources=sources,
        conversation_id=conversation_id,
        message_id=message_id
    )


@router.get("/conversations", response_model=PaginatedResponse[ConversationResponse])
async def list_conversations(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated conversations for current user."""
    conversations, total = await ChatService.get_user_conversations(
        db, current_user.id, page, page_size
    )
    return PaginatedResponse(
        items=[ConversationResponse.model_validate(conv) for conv in conversations],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a conversation."""
    messages = await ChatService.get_conversation_messages(db, conversation_id, current_user.id)
    return messages


@router.post("/ask/stream")
async def ask_question_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store)
):
    """Ask a question using RAG with streaming response."""
    async def event_generator():
        """Generate Server-Sent Events."""
        try:
            async for chunk, sources, conversation_id, message_id in ChatService.ask_question_stream(
                db=db,
                user=current_user,
                question=request.question,
                conversation_id=request.conversation_id,
                vector_store=vector_store,
                use_rag=request.use_rag,
                top_k=request.top_k
            ):
                data = {
                    "chunk": chunk,
                    "sources": sources,
                    "conversation_id": conversation_id,
                    "message_id": message_id
                }
                yield f"data: {json.dumps(data)}\n\n"

            # Send done signal
            yield "data: [DONE]\n\n"

        except Exception as e:
            error_data = {"error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/conversations/{conversation_id}/export")
async def export_conversation(
    conversation_id: int,
    format: str = Query("json", pattern="^(json|markdown|pdf|txt)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export conversation in specified format."""
    # Get conversation and messages
    conversation, messages = await ChatService.get_conversation_with_messages(
        db, conversation_id, current_user.id
    )

    export_service = ExportService()

    if format == "json":
        data = export_service.export_conversation_json(conversation, messages)
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=conversation_{conversation_id}.json"
            }
        )

    elif format == "markdown":
        content = export_service.export_conversation_markdown(conversation, messages)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename=conversation_{conversation_id}.md"
            }
        )

    elif format == "txt":
        content = export_service.export_conversation_txt(conversation, messages)
        return Response(
            content=content,
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename=conversation_{conversation_id}.txt"
            }
        )

    elif format == "pdf":
        buffer = export_service.export_conversation_pdf(conversation, messages)
        return Response(
            content=buffer.read(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=conversation_{conversation_id}.pdf"
            }
        )


@router.get("/conversations/{conversation_id}/context")
async def get_conversation_context(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current context usage for a conversation."""
    # Verify user owns conversation
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Get context manager
    context_mgr = await get_context_manager(conversation_id, db)
    if not context_mgr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Calculate usage
    usage = await context_mgr.calculate_context_usage(db)
    warning_level = await context_mgr.get_context_warning_level(db)

    return {
        "conversation_id": conversation_id,
        "total_tokens": usage.total_tokens,
        "max_tokens": usage.max_tokens,
        "percentage_used": round(usage.percentage_used, 2),
        "tokens_by_role": usage.tokens_by_role,
        "message_count": usage.message_count,
        "needs_summarization": usage.needs_summarization,
        "available_tokens": usage.available_tokens,
        "max_response_tokens": usage.max_response_tokens,
        "estimated_cost": round(usage.estimated_cost, 4),
        "warning_level": warning_level,
        "model_name": conversation.llm_model,
        "provider": conversation.llm_provider,
        "context_window": context_mgr.model_config.context_window,
        "max_output_tokens": context_mgr.model_config.max_output_tokens,
    }
