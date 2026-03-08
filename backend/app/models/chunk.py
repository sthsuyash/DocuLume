"""Chunk model for document text chunks stored in vector database."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_id = Column(String(255), unique=True, nullable=False)  # format: {source}:{page}:{chunk_index}
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    chunk_index = Column(Integer, nullable=False)

    # Vector DB reference
    vector_id = Column(String(255), nullable=True)  # ChromaDB ID

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="chunks")

    __table_args__ = (
        Index('idx_document_chunk', 'document_id', 'chunk_index'),
    )

    def __repr__(self):
        return f"<Chunk {self.chunk_id}>"
