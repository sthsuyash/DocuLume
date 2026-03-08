"""Add performance indexes on foreign keys and frequently queried columns.

Revision ID: 002_add_performance_indexes
Revises: 001_encrypt_api_keys
Create Date: 2026-03-02 09:44:41
"""
from typing import Sequence, Union
from alembic import op

revision: str = "002_add_performance_indexes"
down_revision: Union[str, None] = "001_encrypt_api_keys"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Add performance indexes."""
    # Foreign key indexes
    op.create_index("ix_documents_user_id", "documents", ["user_id"], unique=False)
    op.create_index("ix_conversations_user_id", "conversations", ["user_id"], unique=False)
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"], unique=False)
    
    # Status filtering index
    op.create_index("ix_documents_status", "documents", ["status"], unique=False)
    
    # Timestamp indexes for ordering
    op.create_index("ix_documents_created_at", "documents", ["created_at"], unique=False)
    op.create_index("ix_conversations_created_at", "conversations", ["created_at"], unique=False)
    op.create_index("ix_messages_created_at", "messages", ["created_at"], unique=False)
    
    # Composite indexes for common queries
    op.create_index("ix_documents_user_status", "documents", ["user_id", "status"], unique=False)
    op.create_index("ix_conversations_user_created", "conversations", ["user_id", "created_at"], unique=False)

def downgrade() -> None:
    """Remove performance indexes."""
    op.drop_index("ix_conversations_user_created", table_name="conversations")
    op.drop_index("ix_documents_user_status", table_name="documents")
    op.drop_index("ix_messages_created_at", table_name="messages")
    op.drop_index("ix_conversations_created_at", table_name="conversations")
    op.drop_index("ix_documents_created_at", table_name="documents")
    op.drop_index("ix_documents_status", table_name="documents")
    op.drop_index("ix_messages_conversation_id", table_name="messages")
    op.drop_index("ix_conversations_user_id", table_name="conversations")
    op.drop_index("ix_documents_user_id", table_name="documents")
