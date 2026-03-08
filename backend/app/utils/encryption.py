"""Field-level encryption utilities for sensitive data.

This module provides transparent field-level encryption using Fernet (symmetric encryption).
Encrypted data is stored as binary in the database and automatically encrypted/decrypted
when accessed through model properties.
"""

from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from app.config import settings


class FieldEncryption:
    """Field-level encryption for sensitive database fields."""

    _fernet: Optional[Fernet] = None

    @classmethod
    def get_fernet(cls) -> Fernet:
        """Get or create Fernet cipher instance.

        Returns:
            Fernet: Cipher instance initialized with the encryption key from settings

        Raises:
            ValueError: If encryption key is not configured
        """
        if cls._fernet is None:
            if not settings.encryption_key:
                raise ValueError(
                    "ENCRYPTION_KEY is not configured. "
                    "Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
                )
            cls._fernet = Fernet(settings.encryption_key.encode())
        return cls._fernet

    @classmethod
    def encrypt(cls, value: Optional[str]) -> Optional[bytes]:
        """Encrypt a string value.

        Args:
            value: Plain text string to encrypt (or None)

        Returns:
            Encrypted bytes or None if input is None/empty
        """
        if not value:
            return None
        try:
            return cls.get_fernet().encrypt(value.encode())
        except Exception as e:
            raise ValueError(f"Failed to encrypt value: {e}")

    @classmethod
    def decrypt(cls, encrypted: Optional[bytes]) -> Optional[str]:
        """Decrypt an encrypted value.

        Args:
            encrypted: Encrypted bytes to decrypt (or None)

        Returns:
            Decrypted plain text string or None if input is None

        Raises:
            ValueError: If decryption fails (invalid key or corrupted data)
        """
        if not encrypted:
            return None
        try:
            return cls.get_fernet().decrypt(encrypted).decode()
        except InvalidToken:
            raise ValueError("Failed to decrypt value: invalid encryption key or corrupted data")
        except Exception as e:
            raise ValueError(f"Failed to decrypt value: {e}")

    @classmethod
    def reset(cls):
        """Reset the Fernet instance (useful for testing with different keys)."""
        cls._fernet = None
