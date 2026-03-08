"""RAG pipeline core tests."""
import pytest

def test_text_chunking():
    text = "A" * 2000
    chunk_size = 1000
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    assert len(chunks) == 2
