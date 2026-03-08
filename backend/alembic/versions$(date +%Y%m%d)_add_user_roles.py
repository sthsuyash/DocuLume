"""Add user roles for admin management

Revision ID: add_user_roles
Revises: previous_revision
Create Date: 2026-03-02

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'add_user_roles'
down_revision = None  # Update this to your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Add role column to users table
    op.add_column('users', sa.Column('role', sa.String(20), nullable=False, server_default='user'))
    
    # Create index on role for faster filtering
    op.create_index('ix_users_role', 'users', ['role'])


def downgrade():
    op.drop_index('ix_users_role', 'users')
    op.drop_column('users', 'role')
