"""User model for authentication and authorization."""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, LargeBinary
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app.database import Base
from app.utils.encryption import FieldEncryption


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)

    # Authentication
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)

    # OAuth
    oauth_provider = Column(String(50), nullable=True)  # google, github
    oauth_id = Column(String(255), nullable=True)

    # LLM API Keys (encrypted storage)
    _openai_api_key_encrypted = Column('openai_api_key_encrypted', LargeBinary, nullable=True)
    _anthropic_api_key_encrypted = Column('anthropic_api_key_encrypted', LargeBinary, nullable=True)
    _google_api_key_encrypted = Column('google_api_key_encrypted', LargeBinary, nullable=True)

    # LLM Configuration (flexible provider config)
    llm_config = Column(JSONB, nullable=True, server_default='{}', comment='User LLM provider configuration and settings')

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")

    # Transparent encryption properties for LLM API keys
    @hybrid_property
    def openai_api_key(self) -> Optional[str]:
        """Get decrypted OpenAI API key."""
        return FieldEncryption.decrypt(self._openai_api_key_encrypted)

    @openai_api_key.setter
    def openai_api_key(self, value: Optional[str]):
        """Set OpenAI API key (will be encrypted automatically)."""
        self._openai_api_key_encrypted = FieldEncryption.encrypt(value)

    @hybrid_property
    def anthropic_api_key(self) -> Optional[str]:
        """Get decrypted Anthropic API key."""
        return FieldEncryption.decrypt(self._anthropic_api_key_encrypted)

    @anthropic_api_key.setter
    def anthropic_api_key(self, value: Optional[str]):
        """Set Anthropic API key (will be encrypted automatically)."""
        self._anthropic_api_key_encrypted = FieldEncryption.encrypt(value)

    @hybrid_property
    def google_api_key(self) -> Optional[str]:
        """Get decrypted Google API key."""
        return FieldEncryption.decrypt(self._google_api_key_encrypted)

    @google_api_key.setter
    def google_api_key(self, value: Optional[str]):
        """Set Google API key (will be encrypted automatically)."""
        self._google_api_key_encrypted = FieldEncryption.encrypt(value)

    @property
    def is_admin(self) -> bool:
        """Alias for is_superuser for frontend compatibility."""
        return self.is_superuser

    def __repr__(self):
        return f"<User {self.email}>"
