"""Chat ask / stream routes."""

import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.message import ChatRequest, ChatResponse
from app.services import ChatService
from app.middleware import get_current_user
from app.models.user import User
from app.core.rag import VectorStore
from app.core.context import get_context_manager, auto_summarize_if_needed
from app.api.websocket.context import manager as ws_manager
from app.api.v1.chat_deps import get_vector_store

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/ask", response_model=ChatResponse)
async def ask_question(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store),
):
    answer, sources, source_details, conversation_id, message_id, pt, ct, cost = (
        await ChatService.ask_question(
            db=db,
            user=current_user,
            question=request.question,
            conversation_id=request.conversation_id,
            vector_store=vector_store,
            use_rag=request.use_rag,
            use_hybrid=request.use_hybrid,
            top_k=request.top_k,
            document_ids=request.document_ids,
        )
    )

    try:
        ctx = await get_context_manager(conversation_id, db)
        if ctx:
            usage = await ctx.calculate_context_usage(db)
            warning_level = await ctx.get_context_warning_level(db)
            if usage.needs_summarization:
                old_tokens = usage.total_tokens
                await ws_manager.send_summarization_started(conversation_id, usage.message_count, 5)
                await auto_summarize_if_needed(conversation_id, db)
                usage = await ctx.calculate_context_usage(db)
                await ws_manager.send_summarization_complete(conversation_id, usage.total_tokens, old_tokens)
                warning_level = await ctx.get_context_warning_level(db)
            await ws_manager.send_context_update(conversation_id, usage, warning_level)
    except Exception as exc:
        import logging
        logging.error(f"WebSocket context update failed: {exc}")

    return ChatResponse(
        answer=answer,
        sources=sources,
        source_details=source_details,
        conversation_id=conversation_id,
        message_id=message_id,
        prompt_tokens=pt,
        completion_tokens=ct,
        estimated_cost_usd=cost,
    )


@router.post("/ask/stream")
async def ask_question_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store),
):
    async def event_generator():
        try:
            async for chunk, sources, source_details, conversation_id, message_id in (
                ChatService.ask_question_stream(
                    db=db,
                    user=current_user,
                    question=request.question,
                    conversation_id=request.conversation_id,
                    vector_store=vector_store,
                    use_rag=request.use_rag,
                    use_hybrid=request.use_hybrid,
                    top_k=request.top_k,
                    document_ids=request.document_ids,
                )
            ):
                data = {
                    "chunk": chunk,
                    "sources": sources,
                    "source_details": source_details,
                    "conversation_id": conversation_id,
                    "message_id": message_id,
                }
                yield f"data: {json.dumps(data)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
