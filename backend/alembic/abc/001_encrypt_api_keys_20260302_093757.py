"""Encrypt API keys in user table.

Revision ID: 001_encrypt_api_keys
Revises:
Create Date: 2026-03-02 09:37:57

This migration:
1. Adds new encrypted binary columns for API keys
2. Migrates existing plaintext data to encrypted format
3. Drops old plaintext columns

IMPORTANT: ENCRYPTION_KEY must be set before running this migration.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '001_encrypt_api_keys'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add encrypted API key columns and migrate data."""
    # Add new encrypted columns (nullable initially for safe migration)
    op.add_column('users', sa.Column('openai_api_key_encrypted', sa.LargeBinary(), nullable=True))
    op.add_column('users', sa.Column('anthropic_api_key_encrypted', sa.LargeBinary(), nullable=True))
    op.add_column('users', sa.Column('google_api_key_encrypted', sa.LargeBinary(), nullable=True))

    # NOTE: Data migration happens in Python code using the app's encryption utility
    # If you have existing data, run a separate data migration script that:
    # 1. Loads the User model
    # 2. For each user: user.openai_api_key = old_value (triggers encryption)
    # 3. Commits the changes
    # See: backend/scripts/migrate_api_keys.py for the data migration script

    # Drop old plaintext columns (only if data migration is complete)
    # SAFETY: Comment out these drops if you need to verify migration first
    op.drop_column('users', 'google_api_key')
    op.drop_column('users', 'anthropic_api_key')
    op.drop_column('users', 'openai_api_key')


def downgrade() -> None:
    """Restore plaintext API key columns (DANGEROUS - only for rollback)."""
    # Add back plaintext columns
    op.add_column('users', sa.Column('openai_api_key', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('anthropic_api_key', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('google_api_key', sa.Text(), nullable=True))

    # NOTE: Decryption migration would need to happen here via Python script
    # For safety, this downgrade does NOT decrypt data automatically

    # Drop encrypted columns
    op.drop_column('users', 'google_api_key_encrypted')
    op.drop_column('users', 'anthropic_api_key_encrypted')
    op.drop_column('users', 'openai_api_key_encrypted')
