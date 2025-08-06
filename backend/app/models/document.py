"""Document model for uploaded files."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, BigInteger, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class DocumentStatus(str, enum.Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(BigInteger, nullable=False)  # in bytes
    file_type = Column(String(50), nullable=False)  # .pdf, .txt, .docx, .md

    # Processing status
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.UPLOADING, nullable=False)
    error_message = Column(Text, nullable=True)

    # Metadata
    page_count = Column(Integer, nullable=True)
    chunk_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)

    # Free-form tags (e.g. ["research", "legal"])
    tags = Column(JSONB, nullable=True, server_default="[]")

    # AI-generated summary
    summary = Column(Text, nullable=True)

    # Custom chunking settings (overrides global defaults when set)
    chunk_size_override = Column(Integer, nullable=True)
    chunk_overlap_override = Column(Integer, nullable=True)

    # Document expiry
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    owner = relationship("User", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
    collections = relationship("Collection", secondary="collection_documents", back_populates="documents")

    def __repr__(self):
        return f"<Document {self.original_filename}>"
