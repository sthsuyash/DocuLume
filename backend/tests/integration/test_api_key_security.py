"""Integration tests for API key encryption security."""

import pytest
from sqlalchemy import select, text
from cryptography.fernet import Fernet
from app.models.user import User
from app.utils.encryption import FieldEncryption
from app.config import settings


pytestmark = pytest.mark.asyncio


class TestAPIKeyEncryption:
    """Test suite for API key encryption in User model."""

    @pytest.fixture(autouse=True)
    async def setup_encryption(self, monkeypatch):
        """Set up encryption key for tests."""
        test_key = Fernet.generate_key().decode()
        monkeypatch.setattr(settings, 'encryption_key', test_key)
        FieldEncryption.reset()
        yield
        FieldEncryption.reset()

    async def test_api_key_stored_encrypted_in_database(self, db_session):
        """Test that API keys are stored as encrypted binary in database."""
        # Create user with API key
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password="hashed",
            openai_api_key="sk-test-key-12345"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Read raw binary data from database
        result = await db_session.execute(
            select(User._openai_api_key_encrypted).where(User.id == user.id)
        )
        encrypted_value = result.scalar()

        # Verify it's binary
        assert isinstance(encrypted_value, bytes)
        # Verify it's not plaintext
        assert b"sk-test-key-12345" not in encrypted_value

    async def test_api_key_decrypts_correctly_on_read(self, db_session):
        """Test that API keys decrypt correctly when reading from database."""
        original_key = "sk-anthropic-key-67890"

        # Create user
        user = User(
            email="test2@example.com",
            username="testuser2",
            hashed_password="hashed",
            anthropic_api_key=original_key
        )
        db_session.add(user)
        await db_session.commit()
        user_id = user.id

        # Clear session to force reload from DB
        await db_session.close()

        # Reload user from database
        async with db_session.begin():
            result = await db_session.execute(select(User).where(User.id == user_id))
            reloaded_user = result.scalar_one()

            # Verify decryption works
            assert reloaded_user.anthropic_api_key == original_key

    async def test_all_three_api_keys_encrypt_independently(self, db_session):
        """Test that all three API key types can be encrypted simultaneously."""
        user = User(
            email="test3@example.com",
            username="testuser3",
            hashed_password="hashed",
            openai_api_key="sk-openai-key",
            anthropic_api_key="sk-anthropic-key",
            google_api_key="google-api-key"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Verify all three decrypt correctly
        assert user.openai_api_key == "sk-openai-key"
        assert user.anthropic_api_key == "sk-anthropic-key"
        assert user.google_api_key == "google-api-key"

        # Verify all three are stored encrypted
        assert isinstance(user._openai_api_key_encrypted, bytes)
        assert isinstance(user._anthropic_api_key_encrypted, bytes)
        assert isinstance(user._google_api_key_encrypted, bytes)

    async def test_update_api_key_encrypts_new_value(self, db_session):
        """Test that updating an API key re-encrypts with new value."""
        user = User(
            email="test4@example.com",
            username="testuser4",
            hashed_password="hashed",
            openai_api_key="old-key"
        )
        db_session.add(user)
        await db_session.commit()

        old_encrypted = user._openai_api_key_encrypted

        # Update key
        user.openai_api_key = "new-key"
        await db_session.commit()
        await db_session.refresh(user)

        # Verify encryption changed
        assert user._openai_api_key_encrypted != old_encrypted
        # Verify new value decrypts correctly
        assert user.openai_api_key == "new-key"

    async def test_null_api_key_stored_as_null(self, db_session):
        """Test that null API keys are stored as null in database."""
        user = User(
            email="test5@example.com",
            username="testuser5",
            hashed_password="hashed",
            openai_api_key=None
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert user._openai_api_key_encrypted is None
        assert user.openai_api_key is None

    async def test_setting_empty_string_stores_null(self, db_session):
        """Test that empty string API keys are stored as null."""
        user = User(
            email="test6@example.com",
            username="testuser6",
            hashed_password="hashed",
            openai_api_key=""
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert user._openai_api_key_encrypted is None
        assert user.openai_api_key is None

    async def test_database_dump_does_not_reveal_plaintext(self, db_session):
        """Test that database dump doesn't contain plaintext keys."""
        secret_key = "sk-super-secret-key-abc123"
        user = User(
            email="test7@example.com",
            username="testuser7",
            hashed_password="hashed",
            openai_api_key=secret_key
        )
        db_session.add(user)
        await db_session.commit()

        # Simulate a database dump by reading raw column data
        result = await db_session.execute(
            text("SELECT openai_api_key_encrypted FROM users WHERE email = 'test7@example.com'")
        )
        raw_data = result.scalar()

        # Convert to string representation (what you'd see in a dump)
        dump_representation = str(raw_data)

        # Verify plaintext key is not visible
        assert secret_key not in dump_representation
        assert "abc123" not in dump_representation

    async def test_query_by_encrypted_field_not_supported(self, db_session):
        """Test that you cannot query by encrypted field value (expected limitation)."""
        user1 = User(
            email="test8@example.com",
            username="testuser8",
            hashed_password="hashed",
            openai_api_key="key-to-find"
        )
        user2 = User(
            email="test9@example.com",
            username="testuser9",
            hashed_password="hashed",
            openai_api_key="different-key"
        )
        db_session.add_all([user1, user2])
        await db_session.commit()

        # This query will NOT work as expected because data is encrypted
        # (This is a known limitation of field-level encryption)
        result = await db_session.execute(
            select(User).where(User.openai_api_key == "key-to-find")
        )
        found_users = result.scalars().all()

        # Query by encrypted field doesn't work
        assert len(found_users) == 0  # Expected: can't query encrypted fields

    async def test_user_with_long_api_key(self, db_session):
        """Test encryption of very long API keys."""
        long_key = "sk-" + "x" * 500
        user = User(
            email="test10@example.com",
            username="testuser10",
            hashed_password="hashed",
            google_api_key=long_key
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert user.google_api_key == long_key

    async def test_user_with_special_characters_in_api_key(self, db_session):
        """Test encryption of API keys with special characters."""
        special_key = "key!@#$%^&*(){}[]|:;\"'<>,.?/~`"
        user = User(
            email="test11@example.com",
            username="testuser11",
            hashed_password="hashed",
            anthropic_api_key=special_key
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert user.anthropic_api_key == special_key


class TestAPIKeyEncryptionWithoutKey:
    """Test behavior when encryption key is not configured."""

    async def test_missing_encryption_key_raises_error(self, db_session, monkeypatch):
        """Test that missing encryption key raises clear error."""
        monkeypatch.setattr(settings, 'encryption_key', None)
        FieldEncryption.reset()

        user = User(
            email="test12@example.com",
            username="testuser12",
            hashed_password="hashed"
        )

        with pytest.raises(ValueError, match="ENCRYPTION_KEY is not configured"):
            user.openai_api_key = "sk-test-key"
            db_session.add(user)
            await db_session.flush()  # Trigger encryption


class TestDataMigrationSafety:
    """Test safe data migration scenarios."""

    @pytest.fixture(autouse=True)
    async def setup_encryption(self, monkeypatch):
        """Set up encryption key."""
        test_key = Fernet.generate_key().decode()
        monkeypatch.setattr(settings, 'encryption_key', test_key)
        FieldEncryption.reset()
        yield
        FieldEncryption.reset()

    async def test_user_without_api_keys_remains_functional(self, db_session):
        """Test that users without API keys work normally."""
        user = User(
            email="test13@example.com",
            username="testuser13",
            hashed_password="hashed"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert user.openai_api_key is None
        assert user.anthropic_api_key is None
        assert user.google_api_key is None

    async def test_updating_only_one_key_preserves_others(self, db_session):
        """Test that updating one key doesn't affect others."""
        user = User(
            email="test14@example.com",
            username="testuser14",
            hashed_password="hashed",
            openai_api_key="openai-key",
            anthropic_api_key="anthropic-key",
            google_api_key="google-key"
        )
        db_session.add(user)
        await db_session.commit()

        # Update only OpenAI key
        user.openai_api_key = "new-openai-key"
        await db_session.commit()
        await db_session.refresh(user)

        # Verify others unchanged
        assert user.openai_api_key == "new-openai-key"
        assert user.anthropic_api_key == "anthropic-key"
        assert user.google_api_key == "google-key"
