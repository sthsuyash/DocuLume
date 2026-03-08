"""Data migration script to encrypt existing API keys.

This script should be run AFTER the schema migration but BEFORE dropping old columns.
It reads plaintext API keys from the old columns and writes them to the new encrypted columns.

Usage:
    python scripts/migrate_api_keys.py

Requirements:
    - ENCRYPTION_KEY must be set in environment
    - Database must have both old (plaintext) and new (encrypted) columns
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.user import User
from app.config import settings
from app.utils.encryption import FieldEncryption


async def migrate_api_keys():
    """Migrate plaintext API keys to encrypted format."""
    print("Starting API key migration...")

    # Verify encryption key is configured
    if not settings.encryption_key:
        print("ERROR: ENCRYPTION_KEY environment variable is not set!")
        print("Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'")
        return False

    # Test encryption
    try:
        test = FieldEncryption.encrypt("test")
        FieldEncryption.decrypt(test)
        print("✓ Encryption key verified")
    except Exception as e:
        print(f"ERROR: Invalid encryption key: {e}")
        return False

    async with AsyncSessionLocal() as session:
        # Check if old columns still exist
        try:
            result = await session.execute(
                text("SELECT column_name FROM information_schema.columns "
                     "WHERE table_name = 'users' AND column_name = 'openai_api_key'")
            )
            if not result.scalar():
                print("INFO: Old plaintext columns already dropped. Migration may have already run.")
                return True
        except Exception as e:
            print(f"Warning: Could not check for old columns: {e}")

        # Fetch all users with plaintext API keys
        try:
            # Use raw SQL to read from old columns
            result = await session.execute(
                text("SELECT id, openai_api_key, anthropic_api_key, google_api_key FROM users")
            )
            users_data = result.fetchall()

            if not users_data:
                print("No users found in database.")
                return True

            print(f"Found {len(users_data)} users to migrate")

            # Migrate each user
            migrated = 0
            for user_id, openai_key, anthropic_key, google_key in users_data:
                # Encrypt and update
                encrypted_values = {}
                if openai_key:
                    encrypted_values['openai_api_key_encrypted'] = FieldEncryption.encrypt(openai_key)
                if anthropic_key:
                    encrypted_values['anthropic_api_key_encrypted'] = FieldEncryption.encrypt(anthropic_key)
                if google_key:
                    encrypted_values['google_api_key_encrypted'] = FieldEncryption.encrypt(google_key)

                if encrypted_values:
                    # Build update query
                    set_clause = ", ".join([f"{k} = :{k}" for k in encrypted_values.keys()])
                    query = text(f"UPDATE users SET {set_clause} WHERE id = :user_id")
                    await session.execute(query, {**encrypted_values, 'user_id': user_id})
                    migrated += 1

            await session.commit()
            print(f"✓ Successfully migrated {migrated} users with API keys")
            return True

        except Exception as e:
            print(f"ERROR during migration: {e}")
            await session.rollback()
            return False


if __name__ == "__main__":
    success = asyncio.run(migrate_api_keys())
    sys.exit(0 if success else 1)
