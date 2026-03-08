"""Vector store management with ChromaDB."""

import os
from typing import List, Optional
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from app.config import settings
from app.utils.logger import logger


class VectorStore:
    """ChromaDB vector store wrapper."""

    def __init__(self, persist_directory: Optional[str] = None, api_key: Optional[str] = None):
        self.persist_directory = persist_directory or settings.chroma_persist_directory
        self.api_key = api_key or settings.openai_api_key

        os.makedirs(self.persist_directory, exist_ok=True)

        self.embeddings = OpenAIEmbeddings(openai_api_key=self.api_key)
        self.db = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings
        )

    async def add_documents(self, documents: List[Document], ids: List[str]) -> None:
        """Add documents to vector store with deduplication."""
        existing_ids = set(self.db.get()["ids"])
        new_documents = []
        new_ids = []

        for doc, doc_id in zip(documents, ids):
            if doc_id not in existing_ids:
                new_documents.append(doc)
                new_ids.append(doc_id)

        if new_documents:
            self.db.add_documents(documents=new_documents, ids=new_ids)
            logger.info(f"Added {len(new_documents)} new chunks to vector store")
        else:
            logger.info("No new chunks to add (all duplicates)")

    async def similarity_search(self, query: str, k: int = 5) -> List[Document]:
        """Search for similar documents."""
        results = self.db.similarity_search(query, k=k)
        return results

    async def delete_by_ids(self, ids: List[str]) -> None:
        """Delete documents by IDs."""
        self.db.delete(ids=ids)
        logger.info(f"Deleted {len(ids)} chunks from vector store")

    def get_all_ids(self) -> List[str]:
        """Get all document IDs."""
        return self.db.get()["ids"]
