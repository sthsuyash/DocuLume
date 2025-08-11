"""LLM ask / stream service."""

from typing import AsyncGenerator, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.core.rag import VectorStore
from app.services.llm_router import LLMRouter
from app.services.conversation_service import ConversationService
from app.utils.logger import logger

# Rough cost per 1K tokens (prompt / completion) in USD
_COST_TABLE: Dict[str, Tuple[float, float]] = {
    "gpt-4":             (0.03,    0.06),
    "gpt-4-turbo":       (0.01,    0.03),
    "gpt-3.5-turbo":     (0.0005,  0.0015),
    "claude-3-opus":     (0.015,   0.075),
    "claude-3-sonnet":   (0.003,   0.015),
    "claude-3-haiku":    (0.00025, 0.00125),
    "gemini-pro":        (0.0005,  0.0015),
    "gemini-1.5-pro":    (0.0035,  0.0105),
}
_DEFAULT_COST = (0.001, 0.002)


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def _estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    for key, (p_cost, c_cost) in _COST_TABLE.items():
        if key in model.lower():
            return round((prompt_tokens / 1000) * p_cost + (completion_tokens / 1000) * c_cost, 6)
    p_cost, c_cost = _DEFAULT_COST
    return round((prompt_tokens / 1000) * p_cost + (completion_tokens / 1000) * c_cost, 6)


async def _resolve_conversation(
    db: AsyncSession, user: User, conversation_id: Optional[int]
) -> Conversation:
    if conversation_id:
        result = await db.execute(
            select(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user.id,
            )
        )
        conv = result.scalar_one_or_none()
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        return conv
    return await ConversationService.create(db, user)


def _auto_title(conv: Conversation, question: str) -> None:
    if conv.title in (None, "New Chat", ""):
        conv.title = (question[:60] + "…") if len(question) > 60 else question[:60]


async def _build_messages(
    conv: Conversation,
    user: User,
    question: str,
    vector_store: VectorStore,
    use_rag: bool,
    use_hybrid: bool,
    top_k: int,
    document_ids: Optional[List[int]],
) -> Tuple[List[Dict[str, str]], List[str], List[Dict]]:
    messages: List[Dict[str, str]] = []
    sources: List[str] = []
    source_details: List[Dict] = []

    if conv.system_prompt:
        messages.append({"role": "system", "content": conv.system_prompt})

    if use_rag:
        chunks = (
            await vector_store.hybrid_search(question, k=top_k, user_id=user.id, document_ids=document_ids)
            if use_hybrid
            else await vector_store.similarity_search(question, k=top_k, user_id=user.id, document_ids=document_ids)
        )
        context = "\n\n".join(c.get("text", "") for c in chunks)
        sources = [c.get("source", "") for c in chunks]
        source_details = chunks
        enhanced = f"Context:\n{context}\n\nQuestion: {question}" if context else question
        messages.append({"role": "user", "content": enhanced})
    else:
        messages.append({"role": "user", "content": question})

    return messages, sources, source_details


class ChatService:

    @staticmethod
    async def ask_question(
        db: AsyncSession,
        user: User,
        question: str,
        conversation_id: Optional[int],
        vector_store: VectorStore,
        use_rag: bool = True,
        use_hybrid: bool = False,
        top_k: int = 5,
        document_ids: Optional[List[int]] = None,
    ) -> Tuple[str, List[str], List[Dict], int, int, Optional[int], Optional[int], Optional[float]]:
        conv = await _resolve_conversation(db, user, conversation_id)
        db.add(Message(conversation_id=conv.id, role=MessageRole.USER, content=question))
        _auto_title(conv, question)

        try:
            llm = await LLMRouter.get_provider_for_user(user, preferred_provider=conv.llm_provider or None)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"LLM provider error: {e}")

        msgs, sources, source_details = await _build_messages(conv, user, question, vector_store, use_rag, use_hybrid, top_k, document_ids)
        answer = await llm.chat(messages=msgs)

        prompt_text = " ".join(m["content"] for m in msgs)
        prompt_tokens = _estimate_tokens(prompt_text)
        completion_tokens = _estimate_tokens(answer)
        cost = _estimate_cost(conv.llm_model, prompt_tokens, completion_tokens)

        assistant = Message(
            conversation_id=conv.id, role=MessageRole.ASSISTANT, content=answer,
            sources=sources or None,
            prompt_tokens=prompt_tokens, completion_tokens=completion_tokens, estimated_cost_usd=cost,
        )
        db.add(assistant)
        await db.commit()
        await db.refresh(assistant)
        logger.info(f"Question answered in conversation {conv.id}")
        return answer, sources, source_details, conv.id, assistant.id, prompt_tokens, completion_tokens, cost

    @staticmethod
    async def ask_question_stream(
        db: AsyncSession,
        user: User,
        question: str,
        conversation_id: Optional[int],
        vector_store: VectorStore,
        use_rag: bool = True,
        use_hybrid: bool = False,
        top_k: int = 5,
        document_ids: Optional[List[int]] = None,
    ) -> AsyncGenerator[Tuple[str, Optional[List[str]], Optional[List[Dict]], int, Optional[int]], None]:
        conv = await _resolve_conversation(db, user, conversation_id)
        db.add(Message(conversation_id=conv.id, role=MessageRole.USER, content=question))
        _auto_title(conv, question)
        await db.commit()

        try:
            llm = await LLMRouter.get_provider_for_user(user, preferred_provider=conv.llm_provider or None)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"LLM provider error: {e}")

        msgs, sources, source_details = await _build_messages(conv, user, question, vector_store, use_rag, use_hybrid, top_k, document_ids)

        if use_rag:
            yield "", sources, source_details, conv.id, None

        full_answer = await llm.chat(messages=msgs)
        for i in range(0, len(full_answer), 50):
            yield full_answer[i:i + 50], None, None, conv.id, None

        prompt_tokens = _estimate_tokens(" ".join(m["content"] for m in msgs))
        completion_tokens = _estimate_tokens(full_answer)
        cost = _estimate_cost(conv.llm_model, prompt_tokens, completion_tokens)

        assistant = Message(
            conversation_id=conv.id, role=MessageRole.ASSISTANT, content=full_answer,
            sources=sources or None,
            prompt_tokens=prompt_tokens, completion_tokens=completion_tokens, estimated_cost_usd=cost,
        )
        db.add(assistant)
        await db.commit()
        await db.refresh(assistant)
        logger.info(f"Streamed answer in conversation {conv.id}")
        yield "", None, None, conv.id, assistant.id

    # Retained for backward-compat with callers that still use ChatService.*
    get_user_conversations = staticmethod(lambda db, uid, page=1, ps=20: ConversationService.list_active(db, uid, page, ps))
    get_archived_conversations = staticmethod(lambda db, uid, page=1, ps=20: ConversationService.list_archived(db, uid, page, ps))
    search_conversations = staticmethod(lambda db, uid, q, page=1, ps=20: ConversationService.search(db, uid, q, page, ps))
    update_conversation = staticmethod(lambda db, cid, uid, **f: ConversationService.update(db, cid, uid, **f))
    get_conversation_messages = staticmethod(lambda db, cid, uid: ConversationService.get_messages(db, cid, uid))
    get_conversation_with_messages = staticmethod(lambda db, cid, uid: ConversationService.get_with_messages(db, cid, uid))
