"""Add password reset token

Revision ID: add_password_reset_005
Revises: add_email_verification_004
Create Date: 2026-06-18 00:05:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "add_password_reset_005"
down_revision = "add_email_verification_004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_reset_token", sa.String(64), nullable=True))
    op.create_index("ix_users_password_reset_token", "users", ["password_reset_token"])


def downgrade() -> None:
    op.drop_index("ix_users_password_reset_token", table_name="users")
    op.drop_column("users", "password_reset_token")
