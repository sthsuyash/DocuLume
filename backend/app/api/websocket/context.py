"""
WebSocket endpoint for real-time context usage updates.
Provides live context tracking and summarization notifications.
"""

from typing import Dict, Set, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import json
import asyncio
import logging

from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.core.context import get_context_manager, ContextUsage
from sqlalchemy import select
from app.middleware.auth import get_current_user_ws

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """
    Manages WebSocket connections for context updates.
    Supports per-conversation rooms for targeted broadcasting.
    """

    def __init__(self):
        # conversation_id -> set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # WebSocket -> user_id mapping for authorization
        self.connection_users: Dict[WebSocket, int] = {}

    async def connect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        """
        Connect a WebSocket to a conversation room.

        Args:
            websocket: WebSocket connection
            conversation_id: Conversation to subscribe to
            user_id: User ID for authorization
        """
        await websocket.accept()

        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = set()

        self.active_connections[conversation_id].add(websocket)
        self.connection_users[websocket] = user_id

        logger.info(f"User {user_id} connected to conversation {conversation_id}")

    def disconnect(self, websocket: WebSocket, conversation_id: int):
        """
        Disconnect a WebSocket from a conversation room.

        Args:
            websocket: WebSocket connection
            conversation_id: Conversation to unsubscribe from
        """
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].discard(websocket)

            # Clean up empty rooms
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]

        # Clean up user mapping
        if websocket in self.connection_users:
            user_id = self.connection_users[websocket]
            del self.connection_users[websocket]
            logger.info(f"User {user_id} disconnected from conversation {conversation_id}")

    async def broadcast_to_conversation(
        self,
        conversation_id: int,
        message: dict,
        exclude: Optional[WebSocket] = None
    ):
        """
        Broadcast a message to all connections in a conversation room.

        Args:
            conversation_id: Conversation to broadcast to
            message: Message data to send
            exclude: Optional WebSocket to exclude from broadcast
        """
        if conversation_id not in self.active_connections:
            return

        disconnected = []
        connections = self.active_connections[conversation_id].copy()

        for connection in connections:
            if connection == exclude:
                continue

            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to WebSocket: {e}")
                disconnected.append(connection)

        # Clean up disconnected sockets
        for connection in disconnected:
            self.disconnect(connection, conversation_id)

    async def send_context_update(
        self,
        conversation_id: int,
        usage: ContextUsage,
        warning_level: str,
        exclude: Optional[WebSocket] = None
    ):
        """
        Send context usage update to all connections.

        Args:
            conversation_id: Conversation ID
            usage: Context usage data
            warning_level: Warning level (ok, warning, critical)
            exclude: Optional WebSocket to exclude
        """
        message = {
            "type": "context_update",
            "data": {
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
            }
        }

        await self.broadcast_to_conversation(conversation_id, message, exclude)

    async def send_summarization_started(
        self,
        conversation_id: int,
        messages_count: int,
        keep_recent: int
    ):
        """Send notification that summarization has started."""
        message = {
            "type": "summarization_started",
            "data": {
                "conversation_id": conversation_id,
                "messages_count": messages_count,
                "keep_recent": keep_recent,
            }
        }

        await self.broadcast_to_conversation(conversation_id, message)

    async def send_summarization_complete(
        self,
        conversation_id: int,
        new_token_count: int,
        old_token_count: int
    ):
        """Send notification that summarization is complete."""
        reduction = ((old_token_count - new_token_count) / old_token_count * 100) if old_token_count > 0 else 0

        message = {
            "type": "summarization_complete",
            "data": {
                "conversation_id": conversation_id,
                "new_token_count": new_token_count,
                "old_token_count": old_token_count,
                "reduction_percentage": round(reduction, 1),
            }
        }

        await self.broadcast_to_conversation(conversation_id, message)


# Global connection manager instance
manager = ConnectionManager()


async def get_conversation_or_404(
    conversation_id: int,
    user: User,
    db: AsyncSession
) -> Conversation:
    """
    Get conversation and verify user owns it.

    Args:
        conversation_id: Conversation ID
        user: Current user
        db: Database session

    Returns:
        Conversation if found and authorized

    Raises:
        HTTPException: If not found or not authorized
    """
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    return conversation


@router.websocket("/ws/context/{conversation_id}")
async def websocket_context_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for real-time context usage updates.

    Clients connect to this endpoint to receive:
    - Context usage updates after each message
    - Summarization notifications
    - Warning level changes

    URL: /ws/context/{conversation_id}?token={jwt_token}
    """
    try:
        # Get token from query params
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
            return

        # Authenticate user
        try:
            user = await get_current_user_ws(token, db)
        except HTTPException:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return

        # Verify user owns conversation
        try:
            conversation = await get_conversation_or_404(conversation_id, user, db)
        except HTTPException:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized")
            return

        # Connect to conversation room
        await manager.connect(websocket, conversation_id, user.id)

        # Send initial context state
        try:
            context_mgr = await get_context_manager(conversation_id, db)
            if context_mgr:
                usage = await context_mgr.calculate_context_usage(db)
                warning_level = await context_mgr.get_context_warning_level(db)

                await manager.send_context_update(
                    conversation_id,
                    usage,
                    warning_level,
                    exclude=websocket  # Don't send back to sender
                )
        except Exception as e:
            logger.error(f"Error sending initial context state: {e}")

        # Keep connection alive and handle incoming messages
        try:
            while True:
                # Wait for messages (ping/pong for keepalive)
                data = await websocket.receive_text()

                # Handle ping/pong
                if data == "ping":
                    await websocket.send_text("pong")
                    continue

                # Parse JSON messages
                try:
                    message = json.loads(data)
                    message_type = message.get("type")

                    if message_type == "request_update":
                        # Client requests context update
                        context_mgr = await get_context_manager(conversation_id, db)
                        if context_mgr:
                            usage = await context_mgr.calculate_context_usage(db)
                            warning_level = await context_mgr.get_context_warning_level(db)

                            await websocket.send_json({
                                "type": "context_update",
                                "data": {
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
                                }
                            })

                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON from WebSocket: {data}")

        except WebSocketDisconnect:
            manager.disconnect(websocket, conversation_id)

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if websocket.client_state.name == "CONNECTED":
            manager.disconnect(websocket, conversation_id)


# Export manager for use in chat API
__all__ = ["router", "manager"]
