"""Database integration tests."""
import pytest

@pytest.mark.asyncio
async def test_db_connection(db_session):
    """Test database connection."""
    assert db_session is not None

@pytest.mark.asyncio
async def test_transaction(db_session):
    """Test transaction handling."""
    await db_session.commit()
    assert True
