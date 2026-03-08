"""Document chunking utilities."""

from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.config import settings


def chunk_documents(documents: List[Document]) -> List[Document]:
    """Split documents into chunks."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )

    chunks = text_splitter.split_documents(documents)
    return chunks


def calculate_chunk_ids(chunks: List[Document], source: str) -> List[str]:
    """Calculate unique IDs for chunks in format {source}:{page}:{chunk_index}."""
    chunk_ids = []

    current_page_id = None
    current_chunk_index = 0

    for chunk in chunks:
        page = chunk.metadata.get("page", 0)
        current_page_id_new = f"{source}:{page}"

        if current_page_id == current_page_id_new:
            current_chunk_index += 1
        else:
            current_chunk_index = 0
            current_page_id = current_page_id_new

        chunk_id = f"{current_page_id}:{current_chunk_index}"
        chunk_ids.append(chunk_id)

    return chunk_ids
