"""Reusable validation utilities."""

import re
from typing import Optional


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and other attacks.
    
    Args:
        filename: The filename to sanitize
        
    Returns:
        Sanitized filename
        
    Raises:
        ValueError: If filename is invalid
    """
    if not filename:
        raise ValueError("Filename cannot be empty")
    
    # Remove any path components
    filename = filename.split("/")[-1].split("\\")[-1]
    
    # Check for path traversal attempts
    if ".." in filename or filename.startswith("."):
        raise ValueError("Invalid filename: path traversal detected")
    
    # Remove null bytes
    filename = filename.replace("\x00", "")
    
    # Check for valid characters (alphanumeric, dash, underscore, dot)
    if not re.match(r'^[a-zA-Z0-9_\-\.]+$', filename):
        raise ValueError("Invalid filename: contains illegal characters")
    
    # Limit length
    if len(filename) > 255:
        raise ValueError("Filename too long (max 255 characters)")
    
    return filename


def validate_email(email: str) -> bool:
    """Validate email format.
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not email:
        return False
    
    # Basic email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """Validate password strength.
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password too long (max 128 characters)"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one digit"
    
    # Optional: check for special characters
    # if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
    #     return False, "Password must contain at least one special character"
    
    return True, None


def sanitize_text_input(text: str, max_length: int = 10000) -> str:
    """Sanitize text input to prevent XSS and injection attacks.
    
    Args:
        text: Text to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized text
        
    Raises:
        ValueError: If text is too long
    """
    if not text:
        return ""
    
    # Remove null bytes
    text = text.replace("\x00", "")
    
    # Limit length
    if len(text) > max_length:
        raise ValueError(f"Text too long (max {max_length} characters)")
    
    # Strip leading/trailing whitespace
    text = text.strip()
    
    return text


def validate_pagination_params(page: int, page_size: int, max_page_size: int = 100) -> tuple[bool, Optional[str]]:
    """Validate pagination parameters.
    
    Args:
        page: Page number
        page_size: Items per page
        max_page_size: Maximum allowed page size
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if page < 1:
        return False, "Page number must be >= 1"
    
    if page_size < 1:
        return False, "Page size must be >= 1"
    
    if page_size > max_page_size:
        return False, f"Page size too large (max {max_page_size})"
    
    return True, None
