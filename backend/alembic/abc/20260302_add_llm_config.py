"""Add llm_config to users table

Revision ID: 20260302_add_llm_config
Revises: 20260302_add_user_roles
Create Date: 2026-03-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '20260302_add_llm_config'
down_revision = '20260302_add_user_roles'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add llm_config JSONB column to users table for flexible LLM provider configuration.

    This column stores:
    - default_provider: Primary LLM provider to use
    - providers: Dict of provider configurations
    - fallback_order: List of providers to try on failure
    - cost_limits: Daily/monthly spending limits
    """
    # Add llm_config column
    op.add_column(
        'users',
        sa.Column(
            'llm_config',
            JSONB,
            nullable=True,
            server_default=sa.text("'{}'::jsonb"),
            comment='User LLM provider configuration and settings'
        )
    )

    # Create GIN index for efficient JSONB queries
    op.create_index(
        'ix_users_llm_config',
        'users',
        ['llm_config'],
        postgresql_using='gin'
    )


def downgrade():
    """Remove llm_config column and index."""
    op.drop_index('ix_users_llm_config', table_name='users')
    op.drop_column('users', 'llm_config')
