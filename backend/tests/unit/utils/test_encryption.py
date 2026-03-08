"""Unit tests for field-level encryption utilities."""

import pytest
from cryptography.fernet import Fernet
from app.utils.encryption import FieldEncryption
from app.config import settings


class TestFieldEncryption:
    """Test suite for FieldEncryption utility."""

    @pytest.fixture(autouse=True)
    def setup_encryption_key(self, monkeypatch):
        """Set up a test encryption key for each test."""
        # Generate a fresh key for testing
        test_key = Fernet.generate_key().decode()
        monkeypatch.setattr(settings, 'encryption_key', test_key)
        # Reset the Fernet instance to pick up new key
        FieldEncryption.reset()
        yield
        FieldEncryption.reset()

    def test_encrypt_decrypt_roundtrip(self):
        """Test that encryption and decryption work correctly."""
        original = "test-api-key-12345"
        encrypted = FieldEncryption.encrypt(original)
        decrypted = FieldEncryption.decrypt(encrypted)

        assert decrypted == original
        assert encrypted != original.encode()  # Should be different from plaintext

    def test_encrypt_returns_bytes(self):
        """Test that encryption returns bytes."""
        encrypted = FieldEncryption.encrypt("test-value")
        assert isinstance(encrypted, bytes)

    def test_decrypt_returns_string(self):
        """Test that decryption returns a string."""
        encrypted = FieldEncryption.encrypt("test-value")
        decrypted = FieldEncryption.decrypt(encrypted)
        assert isinstance(decrypted, str)

    def test_encrypt_none_returns_none(self):
        """Test that encrypting None returns None."""
        assert FieldEncryption.encrypt(None) is None

    def test_encrypt_empty_string_returns_none(self):
        """Test that encrypting empty string returns None."""
        assert FieldEncryption.encrypt("") is None

    def test_decrypt_none_returns_none(self):
        """Test that decrypting None returns None."""
        assert FieldEncryption.decrypt(None) is None

    def test_different_values_produce_different_ciphertext(self):
        """Test that different plaintext values produce different ciphertext."""
        value1 = "api-key-1"
        value2 = "api-key-2"

        encrypted1 = FieldEncryption.encrypt(value1)
        encrypted2 = FieldEncryption.encrypt(value2)

        assert encrypted1 != encrypted2

    def test_same_value_produces_different_ciphertext(self):
        """Test that encrypting the same value twice produces different ciphertext (due to Fernet's IV)."""
        value = "api-key-test"

        encrypted1 = FieldEncryption.encrypt(value)
        encrypted2 = FieldEncryption.encrypt(value)

        # Fernet uses a timestamp and random IV, so ciphertext should differ
        assert encrypted1 != encrypted2
        # But both should decrypt to the same value
        assert FieldEncryption.decrypt(encrypted1) == FieldEncryption.decrypt(encrypted2)

    def test_decrypt_with_wrong_key_raises_error(self, monkeypatch):
        """Test that decryption fails with wrong key."""
        original_key = settings.encryption_key
        encrypted = FieldEncryption.encrypt("test-value")

        # Change the key
        new_key = Fernet.generate_key().decode()
        monkeypatch.setattr(settings, 'encryption_key', new_key)
        FieldEncryption.reset()

        # Try to decrypt with wrong key
        with pytest.raises(ValueError, match="Failed to decrypt"):
            FieldEncryption.decrypt(encrypted)

        # Restore original key
        monkeypatch.setattr(settings, 'encryption_key', original_key)
        FieldEncryption.reset()

    def test_decrypt_corrupted_data_raises_error(self):
        """Test that decryption of corrupted data raises an error."""
        corrupted_data = b"this-is-not-valid-encrypted-data"

        with pytest.raises(ValueError, match="Failed to decrypt"):
            FieldEncryption.decrypt(corrupted_data)

    def test_encrypt_without_key_raises_error(self, monkeypatch):
        """Test that encryption fails if encryption key is not configured."""
        monkeypatch.setattr(settings, 'encryption_key', None)
        FieldEncryption.reset()

        with pytest.raises(ValueError, match="ENCRYPTION_KEY is not configured"):
            FieldEncryption.encrypt("test-value")

    def test_fernet_instance_is_cached(self):
        """Test that Fernet instance is cached and reused."""
        fernet1 = FieldEncryption.get_fernet()
        fernet2 = FieldEncryption.get_fernet()

        assert fernet1 is fernet2  # Same instance

    def test_encrypt_unicode_characters(self):
        """Test encryption of Unicode characters."""
        original = "test-émojis-🔐-中文"
        encrypted = FieldEncryption.encrypt(original)
        decrypted = FieldEncryption.decrypt(encrypted)

        assert decrypted == original

    def test_encrypt_long_value(self):
        """Test encryption of long values."""
        # Fernet can encrypt arbitrary length data
        original = "x" * 10000
        encrypted = FieldEncryption.encrypt(original)
        decrypted = FieldEncryption.decrypt(encrypted)

        assert decrypted == original

    def test_encrypt_special_characters(self):
        """Test encryption of special characters."""
        original = "api_key!@#$%^&*(){}[]|\\:;\"'<>,.?/~`"
        encrypted = FieldEncryption.encrypt(original)
        decrypted = FieldEncryption.decrypt(encrypted)

        assert decrypted == original
