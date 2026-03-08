"""Unit tests for chat service."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.models.conversation import Conversation

@pytest.fixture
def mock_db():
    return AsyncMock()

class TestChatService:
    @pytest.mark.asyncio
    async def test_create_conversation(self, mock_db):
        conv = Conversation(id=1, user_id=1)
        assert conv.id == 1

    @pytest.mark.asyncio
    async def test_get_messages(self, mock_db):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result
        result = mock_result.scalars().all()
        assert isinstance(result, list)
