"""Add extended features: tags, archiving, sharing, editing, webhooks

Revision ID: add_extended_features_003
Revises: add_user_preferences_002
Create Date: 2026-06-18 00:03:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "add_extended_features_003"
down_revision = "add_user_preferences_002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # documents.tags
    op.add_column("documents", sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default="[]"))

    # conversations.is_archived
    op.add_column("conversations", sa.Column("is_archived", sa.Boolean(), nullable=False, server_default="false"))

    # messages.is_edited
    op.add_column("messages", sa.Column("is_edited", sa.Boolean(), nullable=False, server_default="false"))

    # users.webhook_url
    op.add_column("users", sa.Column("webhook_url", sa.Text(), nullable=True))

    # conversation_shares table
    op.create_table(
        "conversation_shares",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("conversation_id", sa.Integer(), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token", sa.String(64), unique=True, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_conversation_shares_token", "conversation_shares", ["token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_conversation_shares_token", table_name="conversation_shares")
    op.drop_table("conversation_shares")
    op.drop_column("users", "webhook_url")
    op.drop_column("messages", "is_edited")
    op.drop_column("conversations", "is_archived")
    op.drop_column("documents", "tags")
