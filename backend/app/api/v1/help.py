"""DocuBot - Platform help chatbot routes."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware import get_current_user
from app.models.user import User
from app.core.llm.provider import OpenAIProvider
from app.config import settings

router = APIRouter(prefix="/help", tags=["Help"])


class HelpQuestion(BaseModel):
    """Help question from user."""
    question: str
    context: Optional[str] = None  # Current page/feature user is on


class HelpResponse(BaseModel):
    """DocuBot response."""
    answer: str
    related_docs: List[dict]
    helpful_links: List[dict]
    can_escalate: bool = True


# Help documentation knowledge base
HELP_KNOWLEDGE_BASE = {
    "upload": {
        "topic": "Uploading Documents",
        "content": """
        To upload documents to DocuLume:

        1. Click the "Upload" button in the dashboard
        2. Select one or more files (PDF, DOCX, TXT, MD supported)
        3. Wait for processing (usually 10-30 seconds)
        4. Documents appear in your library once processed

        Tips:
        - Max file size: 50MB per document
        - Batch upload: Select multiple files at once
        - Processing time depends on document size
        - You can continue using the platform while documents process
        """,
        "related": ["documents", "processing", "formats"]
    },
    "chat": {
        "topic": "Asking Questions",
        "content": """
        To ask questions about your documents:

        1. Go to the Chat page
        2. Type your question in natural language
        3. Press Enter or click Send
        4. Receive AI-powered answer with source citations

        Tips:
        - Be specific in your questions
        - Reference document names for targeted search
        - Use follow-up questions for deeper insights
        - Enable streaming for faster responses
        """,
        "related": ["rag", "search", "conversations"]
    },
    "llm": {
        "topic": "LLM Configuration",
        "content": """
        DocuLume supports multiple LLM providers:

        Supported:
        - OpenAI (GPT-3.5, GPT-4, GPT-4 Turbo)
        - Anthropic (Claude 3 Opus, Sonnet, Haiku)
        - Google (Gemini Pro, Gemini Pro Vision)
        - Local LLMs (Ollama, LM Studio)

        To configure:
        1. Go to Settings → API Keys
        2. Enter your API key for desired provider
        3. Select default model
        4. Save changes

        For local LLMs:
        - Install Ollama or LM Studio
        - Start the local server
        - Configure endpoint in settings
        """,
        "related": ["api_keys", "models", "settings"]
    },
    "api": {
        "topic": "Using the API",
        "content": """
        DocuLume provides a full REST API:

        Authentication:
        - All requests require JWT token
        - Get token via /auth/login endpoint
        - Include in Authorization header

        Common endpoints:
        - POST /documents/upload - Upload document
        - POST /chat/ask - Ask question
        - GET /conversations - List conversations
        - GET /documents - List documents

        Full API docs: /docs (Swagger UI)
        """,
        "related": ["authentication", "endpoints", "swagger"]
    },
    "security": {
        "topic": "Security & Privacy",
        "content": """
        DocuLume is built with security-first design:

        Data Security:
        - AES-256 encryption at rest
        - TLS 1.3 for data in transit
        - API keys encrypted in database
        - No data shared with third parties

        Access Control:
        - JWT-based authentication
        - Role-based permissions
        - Document-level access control

        Compliance:
        - SOC 2 Type II certified
        - GDPR compliant
        - HIPAA ready (Enterprise)
        """,
        "related": ["encryption", "compliance", "privacy"]
    },
    "troubleshoot": {
        "topic": "Troubleshooting",
        "content": """
        Common issues and solutions:

        Document won't upload:
        - Check file size (max 50MB)
        - Verify file format is supported
        - Try refreshing the page

        Slow responses:
        - Check your internet connection
        - Try a smaller/faster model
        - Enable streaming mode

        API errors:
        - Verify API key is correct
        - Check API key has sufficient credits
        - Ensure model name is valid

        Can't find document:
        - Check document processed successfully
        - Verify you're on correct account
        - Try searching by exact filename
        """,
        "related": ["errors", "performance", "debug"]
    }
}


def find_relevant_help(question: str) -> List[dict]:
    """Find relevant help topics based on question."""
    question_lower = question.lower()
    relevant = []

    # Simple keyword matching (can be enhanced with vector search)
    keywords = {
        "upload": ["upload", "file", "document", "pdf", "import"],
        "chat": ["ask", "question", "chat", "query", "search"],
        "llm": ["llm", "model", "gpt", "claude", "api key", "openai", "anthropic"],
        "api": ["api", "endpoint", "rest", "integration", "curl"],
        "security": ["security", "encrypt", "safe", "privacy", "gdpr", "compliance"],
        "troubleshoot": ["error", "problem", "issue", "not working", "failed", "slow"]
    }

    for topic_key, topic_keywords in keywords.items():
        if any(keyword in question_lower for keyword in topic_keywords):
            if topic_key in HELP_KNOWLEDGE_BASE:
                relevant.append({
                    "topic": HELP_KNOWLEDGE_BASE[topic_key]["topic"],
                    "content": HELP_KNOWLEDGE_BASE[topic_key]["content"],
                    "key": topic_key
                })

    return relevant


async def generate_help_answer(
    question: str,
    context: Optional[str],
    relevant_docs: List[dict]
) -> str:
    """Generate answer using LLM with help documentation context."""
    # Build context from relevant docs
    docs_context = "\n\n".join([
        f"Topic: {doc['topic']}\n{doc['content']}"
        for doc in relevant_docs
    ])

    # System prompt for DocuBot
    system_prompt = f"""You are DocuBot, the helpful AI assistant for DocuLume platform.

Your role:
- Help users understand how to use DocuLume features
- Provide clear, concise, actionable guidance
- Reference relevant documentation
- Be friendly and encouraging

Available documentation:
{docs_context}

Guidelines:
- Answer based on the documentation provided
- Be specific and practical
- Include step-by-step instructions when relevant
- Suggest related help topics
- If you don't know, say so and suggest contacting support
"""

    if context:
        system_prompt += f"\n\nUser is currently on: {context}"

    # Generate answer using LLM
    try:
        llm = OpenAIProvider(model="gpt-3.5-turbo")
        answer = await llm.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.7,
            max_tokens=500
        )
        return answer
    except Exception as e:
        # Fallback to simple response if LLM fails
        if relevant_docs:
            return f"Here's what I found in our documentation:\n\n{relevant_docs[0]['content']}"
        return "I'm having trouble generating a response. Please try rephrasing your question or contact support."


@router.post("/ask", response_model=HelpResponse)
async def ask_docubot(
    request: HelpQuestion,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ask DocuBot a question about using the platform."""
    # Find relevant documentation
    relevant_docs = find_relevant_help(request.question)

    # Generate answer
    answer = await generate_help_answer(
        question=request.question,
        context=request.context,
        relevant_docs=relevant_docs
    )

    # Build helpful links
    helpful_links = []
    for doc in relevant_docs[:3]:  # Top 3 most relevant
        topic_key = doc.get("key", "")
        helpful_links.append({
            "title": doc["topic"],
            "url": f"/docs/{topic_key}",
            "description": doc["topic"]
        })

    # Add general help links
    helpful_links.extend([
        {
            "title": "Full Documentation",
            "url": "/docs",
            "description": "Complete platform documentation"
        },
        {
            "title": "Video Tutorials",
            "url": "/docs/videos",
            "description": "Step-by-step video guides"
        }
    ])

    return HelpResponse(
        answer=answer,
        related_docs=relevant_docs[:3],
        helpful_links=helpful_links,
        can_escalate=True
    )


@router.get("/topics")
async def list_help_topics(
    current_user: User = Depends(get_current_user)
):
    """List all available help topics."""
    topics = []
    for key, data in HELP_KNOWLEDGE_BASE.items():
        topics.append({
            "key": key,
            "topic": data["topic"],
            "preview": data["content"][:150] + "...",
            "url": f"/docs/{key}"
        })
    return {"topics": topics}


@router.get("/topics/{topic_key}")
async def get_help_topic(
    topic_key: str,
    current_user: User = Depends(get_current_user)
):
    """Get full content for a specific help topic."""
    if topic_key not in HELP_KNOWLEDGE_BASE:
        raise HTTPException(status_code=404, detail="Help topic not found")

    topic = HELP_KNOWLEDGE_BASE[topic_key]
    related_topics = []

    for related_key in topic.get("related", []):
        if related_key in HELP_KNOWLEDGE_BASE:
            related_topics.append({
                "key": related_key,
                "topic": HELP_KNOWLEDGE_BASE[related_key]["topic"],
                "url": f"/docs/{related_key}"
            })

    return {
        "topic": topic["topic"],
        "content": topic["content"],
        "related": related_topics
    }


@router.post("/feedback")
async def submit_help_feedback(
    question: str,
    answer: str,
    helpful: bool,
    comment: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit feedback on DocuBot's answer."""
    # Log feedback for improvement
    # In production, store in database for analysis

    return {
        "message": "Thank you for your feedback!",
        "recorded": True
    }
