"""Conversation and message management routes."""

import json
import secrets
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.schemas.message import ChatResponse, MessageResponse
from app.schemas.conversation import ConversationResponse, ConversationUpdate
from app.schemas.common import PaginatedResponse
from app.services import ChatService
from app.middleware import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.conversation_share import ConversationShare
from app.models.message import Message, MessageRole
from app.core.rag import VectorStore
from app.utils.export import ExportService
from app.core.context import get_context_manager
from app.api.v1.chat_deps import get_vector_store

router = APIRouter(prefix="/chat", tags=["Conversations"])


@router.get("/conversations", response_model=PaginatedResponse[ConversationResponse])
async def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversations, total = await ChatService.get_user_conversations(db, current_user.id, page, page_size)
    return PaginatedResponse(
        items=[ConversationResponse.model_validate(c) for c in conversations],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/conversations/archived", response_model=PaginatedResponse[ConversationResponse])
async def list_archived_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversations, total = await ChatService.get_archived_conversations(db, current_user.id, page, page_size)
    return PaginatedResponse(
        items=[ConversationResponse.model_validate(c) for c in conversations],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/conversations/search", response_model=PaginatedResponse[ConversationResponse])
async def search_conversations(
    q: str = Query(..., min_length=1, description="Search term"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversations, total = await ChatService.search_conversations(db, current_user.id, q, page, page_size)
    return PaginatedResponse(
        items=[ConversationResponse.model_validate(c) for c in conversations],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int,
    body: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = await ChatService.update_conversation(
        db, conversation_id, current_user.id, **body.model_dump(exclude_none=True),
    )
    return ConversationResponse.model_validate(updated)


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ChatService.get_conversation_messages(db, conversation_id, current_user.id)


@router.post("/conversations/{conversation_id}/archive", response_model=ConversationResponse)
async def archive_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await ChatService.update_conversation(db, conversation_id, current_user.id, is_archived=True)
    return ConversationResponse.model_validate(conv)


@router.post("/conversations/{conversation_id}/unarchive", response_model=ConversationResponse)
async def unarchive_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await ChatService.update_conversation(db, conversation_id, current_user.id, is_archived=False)
    return ConversationResponse.model_validate(conv)


@router.post("/conversations/{conversation_id}/share")
async def share_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    existing = (await db.execute(
        select(ConversationShare).where(
            ConversationShare.conversation_id == conversation_id,
            ConversationShare.created_by == current_user.id,
            ConversationShare.is_active == True,
        )
    )).scalar_one_or_none()

    if existing:
        return {"token": existing.token, "url": f"/share/{existing.token}"}

    share = ConversationShare(
        conversation_id=conversation_id,
        created_by=current_user.id,
        token=secrets.token_urlsafe(32),
    )
    db.add(share)
    await db.commit()
    await db.refresh(share)
    return {"token": share.token, "url": f"/share/{share.token}"}


@router.delete("/conversations/{conversation_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_share(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import update as sa_update

    await db.execute(
        sa_update(ConversationShare)
        .where(
            ConversationShare.conversation_id == conversation_id,
            ConversationShare.created_by == current_user.id,
        )
        .values(is_active=False)
    )
    await db.commit()


@router.post("/conversations/{conversation_id}/regenerate", response_model=ChatResponse)
async def regenerate_last_answer(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    msgs = (await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(2)
    )).scalars().all()

    last_assistant = next((m for m in msgs if m.role == MessageRole.ASSISTANT), None)
    last_user = next((m for m in msgs if m.role == MessageRole.USER), None)

    if not last_assistant or not last_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to regenerate")

    question = last_user.content
    await db.delete(last_assistant)
    await db.commit()

    answer, sources, source_details, conv_id, msg_id, pt, ct, cost = await ChatService.ask_question(
        db=db,
        user=current_user,
        question=question,
        conversation_id=conversation_id,
        vector_store=vector_store,
        use_rag=bool(last_user.sources),
        use_hybrid=False,
        top_k=5,
    )
    return ChatResponse(
        answer=answer,
        sources=sources,
        source_details=source_details,
        conversation_id=conv_id,
        message_id=msg_id,
        prompt_tokens=pt,
        completion_tokens=ct,
        estimated_cost_usd=cost,
    )


@router.patch("/messages/{message_id}")
async def edit_message(
    message_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_content: str = body.get("content", "").strip()
    delete_after: bool = body.get("delete_subsequent", False)

    if not new_content:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="content required")

    result = await db.execute(
        select(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Message.id == message_id, Conversation.user_id == current_user.id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    msg.content = new_content
    msg.is_edited = True

    if delete_after:
        from sqlalchemy import delete as sa_delete

        await db.execute(
            sa_delete(Message).where(
                Message.conversation_id == msg.conversation_id,
                Message.created_at > msg.created_at,
            )
        )

    await db.commit()
    return {"id": msg.id, "content": msg.content, "is_edited": msg.is_edited}


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()


@router.get("/conversations/{conversation_id}/export")
async def export_conversation(
    conversation_id: int,
    format: str = Query("json", pattern="^(json|markdown|pdf|txt)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation, messages = await ChatService.get_conversation_with_messages(db, conversation_id, current_user.id)
    export_service = ExportService()

    if format == "json":
        data = export_service.export_conversation_json(conversation, messages)
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=conversation_{conversation_id}.json"},
        )
    if format == "markdown":
        content = export_service.export_conversation_markdown(conversation, messages)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=conversation_{conversation_id}.md"},
        )
    if format == "txt":
        content = export_service.export_conversation_txt(conversation, messages)
        return Response(
            content=content,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=conversation_{conversation_id}.txt"},
        )
    if format == "pdf":
        buffer = export_service.export_conversation_pdf(conversation, messages)
        return Response(
            content=buffer.read(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=conversation_{conversation_id}.pdf"},
        )


@router.get("/conversations/{conversation_id}/context")
async def get_conversation_context(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    ctx = await get_context_manager(conversation_id, db)
    if not ctx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    usage = await ctx.calculate_context_usage(db)
    warning_level = await ctx.get_context_warning_level(db)

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
        "context_window": ctx.model_config.context_window,
        "max_output_tokens": ctx.model_config.max_output_tokens,
    }
