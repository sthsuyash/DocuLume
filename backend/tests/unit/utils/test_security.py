"""Security utility tests."""
import pytest
from app.utils.security import get_password_hash, verify_password

def test_password_hashing():
    password = "testpass123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed)

def test_wrong_password():
    password = "correct"
    hashed = get_password_hash(password)
    assert not verify_password("wrong", hashed)
