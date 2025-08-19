"""Add user preferences column

Revision ID: add_user_preferences_002
Revises: add_features_001
Create Date: 2026-06-18 00:02:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "add_user_preferences_002"
down_revision = "add_features_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "preferences",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            server_default="{}",
            comment="User interface and behavior preferences",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "preferences")
