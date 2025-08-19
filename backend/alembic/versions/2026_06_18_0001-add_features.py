"""Add collections, feedback, system_prompt, and message token tracking

Revision ID: add_features_001
Revises: 22b96fe61bcc
Create Date: 2026-06-18 00:01:00.000000+00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "add_features_001"
down_revision = "22b96fe61bcc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── conversations: system_prompt ────────────────────────────────────
    op.add_column("conversations", sa.Column("system_prompt", sa.Text(), nullable=True))

    # ── messages: token usage + cost ────────────────────────────────────
    op.add_column("messages", sa.Column("prompt_tokens",      sa.Integer(), nullable=True))
    op.add_column("messages", sa.Column("completion_tokens",  sa.Integer(), nullable=True))
    op.add_column("messages", sa.Column("estimated_cost_usd", sa.Float(),   nullable=True))

    # ── collections ─────────────────────────────────────────────────────
    op.create_table(
        "collections",
        sa.Column("id",          sa.Integer(), primary_key=True),
        sa.Column("user_id",     sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name",        sa.String(255), nullable=False),
        sa.Column("description", sa.Text(),      nullable=True),
        sa.Column("created_at",  sa.DateTime(),  nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",  sa.DateTime(),  nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index("ix_collections_user_id", "collections", ["user_id"])

    # ── collection_documents (join table) ────────────────────────────────
    op.create_table(
        "collection_documents",
        sa.Column("collection_id", sa.Integer(), sa.ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("document_id",   sa.Integer(), sa.ForeignKey("documents.id",   ondelete="CASCADE"), primary_key=True),
    )

    # ── message_feedback ────────────────────────────────────────────────
    feedback_value = sa.Enum("up", "down", name="feedbackvalue")
    feedback_value.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "message_feedback",
        sa.Column("id",         sa.Integer(),  primary_key=True),
        sa.Column("message_id", sa.Integer(),  sa.ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("user_id",    sa.Integer(),  sa.ForeignKey("users.id",    ondelete="CASCADE"), nullable=False),
        sa.Column("value",      feedback_value, nullable=False),
        sa.Column("comment",    sa.Text(),     nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_message_feedback_message_id", "message_feedback", ["message_id"])


def downgrade() -> None:
    op.drop_table("message_feedback")
    op.drop_table("collection_documents")
    op.drop_table("collections")
    op.drop_column("messages", "estimated_cost_usd")
    op.drop_column("messages", "completion_tokens")
    op.drop_column("messages", "prompt_tokens")
    op.drop_column("conversations", "system_prompt")
    sa.Enum(name="feedbackvalue").drop(op.get_bind(), checkfirst=True)
