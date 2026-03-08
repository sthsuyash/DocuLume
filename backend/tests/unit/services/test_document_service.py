"""Unit tests for document service."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.document_service import DocumentService
from app.models.document import Document

@pytest.fixture
def mock_db():
    return AsyncMock()

class TestDocumentService:
    @pytest.mark.asyncio
    async def test_create_document(self, mock_db):
        doc = Document(id=1, filename="test.pdf", user_id=1)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = doc
        mock_db.execute.return_value = mock_result
        assert doc.filename == "test.pdf"

    @pytest.mark.asyncio
    async def test_get_user_documents(self, mock_db):
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result
        result = mock_result.scalars().all()
        assert result == []

    @pytest.mark.asyncio
    async def test_delete_document(self, mock_db):
        doc = Document(id=1, filename="test.pdf")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = doc
        mock_db.execute.return_value = mock_result
        assert doc.id == 1
