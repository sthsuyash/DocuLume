"""Unit tests for authentication service."""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from freezegun import freeze_time
from fastapi import HTTPException, status

from app.services.auth_service import AuthService
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, Token


@pytest.fixture
def mock_db():
    """Mock database session."""
    return AsyncMock()


@pytest.fixture
def mock_hash_funcs(mocker):
    """Mock password hashing functions."""
    mocker.patch("app.services.auth_service.get_password_hash", return_value="hashed_pwd")
    mocker.patch("app.services.auth_service.verify_password", return_value=True)
    mocker.patch("app.services.auth_service.create_access_token", return_value="access_token_123")
    mocker.patch("app.services.auth_service.create_refresh_token", return_value="refresh_token_123")


class TestAuthServiceRegister:
    """Tests for AuthService.register()"""

    @pytest.mark.asyncio
    async def test_register_success(self, mock_db, mock_hash_funcs):
        """Test successful registration."""
        user_data = UserRegister(email="test@test.com", username="test", password="password123", full_name="Test")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await AuthService.register(mock_db, user_data)

        assert isinstance(result, User)
        assert result.email == "test@test.com"
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, mock_db, mock_hash_funcs):
        """Test duplicate email raises error."""
        user_data = UserRegister(email="dup@test.com", username="test", password="password123")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = User(email="dup@test.com")
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc:
            await AuthService.register(mock_db, user_data)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, mock_db, mock_hash_funcs):
        """Test duplicate username raises error."""
        user_data = UserRegister(email="new@test.com", username="taken", password="password123")
        mock_email = MagicMock()
        mock_email.scalar_one_or_none.return_value = None
        mock_username = MagicMock()
        mock_username.scalar_one_or_none.return_value = User(username="taken")
        mock_db.execute.side_effect = [mock_email, mock_username]

        with pytest.raises(HTTPException) as exc:
            await AuthService.register(mock_db, user_data)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_register_without_full_name(self, mock_db, mock_hash_funcs):
        """Test registration without full name."""
        user_data = UserRegister(email="test@test.com", username="test", password="password123")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await AuthService.register(mock_db, user_data)
        assert result.full_name is None

    @pytest.mark.asyncio
    async def test_register_password_hashed(self, mock_db, mocker):
        """Test password is hashed."""
        mock_hash = mocker.patch("app.services.auth_service.get_password_hash", return_value="hashed")
        user_data = UserRegister(email="test@test.com", username="test", password="plainpass123")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await AuthService.register(mock_db, user_data)
        mock_hash.assert_called_once_with("plainpass123")
        assert result.hashed_password == "hashed"

    @pytest.mark.asyncio
    async def test_register_db_operations(self, mock_db, mock_hash_funcs):
        """Test correct DB operations are called."""
        user_data = UserRegister(email="test@test.com", username="test", password="password123")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        await AuthService.register(mock_db, user_data)
        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited_once()
        mock_db.refresh.assert_awaited_once()


class TestAuthServiceLogin:
    """Tests for AuthService.login()"""

    @pytest.mark.asyncio
    @freeze_time("2024-01-15 12:00:00")
    async def test_login_success(self, mock_db, mocker):
        """Test successful login."""
        mocker.patch("app.services.auth_service.verify_password", return_value=True)
        mocker.patch("app.services.auth_service.create_access_token", return_value="access")
        mocker.patch("app.services.auth_service.create_refresh_token", return_value="refresh")

        creds = UserLogin(email="user@test.com", password="password123")
        user = User(id=1, email="user@test.com", hashed_password="hash", is_active=True)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_db.execute.return_value = mock_result

        result = await AuthService.login(mock_db, creds)

        assert result.access_token == "access"
        assert result.refresh_token == "refresh"
        assert user.last_login == datetime(2024, 1, 15, 12, 0, 0)

    @pytest.mark.asyncio
    async def test_login_user_not_found(self, mock_db, mock_hash_funcs):
        """Test login with invalid email."""
        creds = UserLogin(email="none@test.com", password="password123")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc:
            await AuthService.login(mock_db, creds)
        assert exc.value.status_code == 401

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, mock_db, mocker):
        """Test login with wrong password."""
        mocker.patch("app.services.auth_service.verify_password", return_value=False)
        creds = UserLogin(email="user@test.com", password="wrong")
        user = User(id=1, email="user@test.com", hashed_password="hash", is_active=True)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc:
            await AuthService.login(mock_db, creds)
        assert exc.value.status_code == 401

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, mock_db, mocker):
        """Test login with inactive account."""
        mocker.patch("app.services.auth_service.verify_password", return_value=True)
        creds = UserLogin(email="user@test.com", password="password123")
        user = User(id=1, email="user@test.com", hashed_password="hash", is_active=False)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc:
            await AuthService.login(mock_db, creds)
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_login_oauth_no_password(self, mock_db):
        """Test OAuth user can't login with password."""
        creds = UserLogin(email="oauth@test.com", password="password123")
        user = User(id=1, email="oauth@test.com", hashed_password=None, is_active=True)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc:
            await AuthService.login(mock_db, creds)
        assert exc.value.status_code == 401


class TestAuthServiceGetUserById:
    """Tests for AuthService.get_user_by_id()"""

    @pytest.mark.asyncio
    async def test_get_user_success(self, mock_db):
        """Test get existing user."""
        user = User(id=1, email="test@test.com")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_db.execute.return_value = mock_result

        result = await AuthService.get_user_by_id(mock_db, 1)
        assert result.id == 1

    @pytest.mark.asyncio
    async def test_get_user_not_found(self, mock_db):
        """Test get non-existent user."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await AuthService.get_user_by_id(mock_db, 999)
        assert result is None


class TestAuthServiceUpdateUser:
    """Tests for AuthService.update_user()"""

    @pytest.mark.asyncio
    @freeze_time("2024-03-01 10:00:00")
    async def test_update_user_success(self, mock_db):
        """Test update user."""
        from app.schemas.user import UserUpdate
        user = User(id=1, email="test@test.com", full_name="Old")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_db.execute.return_value = mock_result

        result = await AuthService.update_user(mock_db, 1, UserUpdate(full_name="New"))
        assert result.full_name == "New"
        assert result.updated_at == datetime(2024, 3, 1, 10, 0, 0)

    @pytest.mark.asyncio
    async def test_update_user_not_found(self, mock_db):
        """Test update non-existent user."""
        from app.schemas.user import UserUpdate
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc:
            await AuthService.update_user(mock_db, 999, UserUpdate(full_name="New"))
        assert exc.value.status_code == 404


class TestAuthServiceOAuthLogin:
    """Tests for AuthService.oauth_login()"""

    @pytest.mark.asyncio
    @freeze_time("2024-04-10 16:20:00")
    async def test_oauth_new_user(self, mock_db, mocker):
        """Test OAuth creates new user."""
        mocker.patch("app.services.auth_service.create_access_token", return_value="access")
        mocker.patch("app.services.auth_service.create_refresh_token", return_value="refresh")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await AuthService.oauth_login(mock_db, "google", "g123", "new@gmail.com", "New User")

        assert isinstance(result, Token)
        mock_db.add.assert_called_once()
        added_user = mock_db.add.call_args[0][0]
        assert added_user.oauth_provider == "google"
        assert added_user.is_verified is True

    @pytest.mark.asyncio
    async def test_oauth_existing_user(self, mock_db, mocker):
        """Test OAuth with existing user."""
        mocker.patch("app.services.auth_service.create_access_token", return_value="access")
        mocker.patch("app.services.auth_service.create_refresh_token", return_value="refresh")
        user = User(id=1, email="user@gmail.com", oauth_provider="google", oauth_id="g123")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user
        mock_db.execute.return_value = mock_result

        result = await AuthService.oauth_login(mock_db, "google", "g123", "user@gmail.com")

        assert isinstance(result, Token)
        mock_db.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_oauth_link_existing_email(self, mock_db, mocker):
        """Test OAuth links to existing email."""
        mocker.patch("app.services.auth_service.create_access_token", return_value="access")
        mocker.patch("app.services.auth_service.create_refresh_token", return_value="refresh")
        user = User(id=1, email="user@gmail.com", oauth_provider=None)
        mock_oauth = MagicMock()
        mock_oauth.scalar_one_or_none.return_value = None
        mock_email = MagicMock()
        mock_email.scalar_one_or_none.return_value = user
        mock_db.execute.side_effect = [mock_oauth, mock_email]

        result = await AuthService.oauth_login(mock_db, "google", "g123", "user@gmail.com")

        assert user.oauth_provider == "google"
        assert user.oauth_id == "g123"

    @pytest.mark.asyncio
    async def test_oauth_username_conflict(self, mock_db, mocker):
        """Test OAuth handles username conflicts."""
        mocker.patch("app.services.auth_service.create_access_token", return_value="access")
        mocker.patch("app.services.auth_service.create_refresh_token", return_value="refresh")
        existing = User(username="test")
        mock_no = MagicMock()
        mock_no.scalar_one_or_none.return_value = None
        mock_taken = MagicMock()
        mock_taken.scalar_one_or_none.return_value = existing
        mock_available = MagicMock()
        mock_available.scalar_one_or_none.return_value = None
        mock_db.execute.side_effect = [mock_no, mock_no, mock_taken, mock_available]

        result = await AuthService.oauth_login(mock_db, "github", "gh456", "test@github.com")

        added = mock_db.add.call_args[0][0]
        assert added.username == "test1"
