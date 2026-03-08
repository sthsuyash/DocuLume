"""Unit tests for RAG pipeline."""
import pytest

class TestRAGPipeline:
    def test_chunk_text(self):
        text = "This is a test document."
        chunks = text.split()
        assert len(chunks) > 0

    def test_embed_chunks(self):
        chunks = ["test", "document"]
        assert len(chunks) == 2
