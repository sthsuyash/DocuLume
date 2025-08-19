"""Add email verification token

Revision ID: add_email_verification_004
Revises: add_extended_features_003
Create Date: 2026-06-18 00:04:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "add_email_verification_004"
down_revision = "add_extended_features_003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verification_token", sa.String(64), nullable=True))
    op.create_index("ix_users_email_verification_token", "users", ["email_verification_token"])


def downgrade() -> None:
    op.drop_index("ix_users_email_verification_token", table_name="users")
    op.drop_column("users", "email_verification_token")
