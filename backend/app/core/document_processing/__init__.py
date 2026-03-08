"""Document processing module."""

from app.core.document_processing.loader import load_document
from app.core.document_processing.chunker import chunk_documents, calculate_chunk_ids

__all__ = [
    "load_document",
    "chunk_documents",
    "calculate_chunk_ids",
]
