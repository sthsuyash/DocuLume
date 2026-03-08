"""
Application configuration using Pydantic Settings.
Supports environment-based configuration for development and production.
"""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow"
    )

    # Application
    app_name: str = "RAG System API"
    app_version: str = "2.0.0"
    environment: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql+asyncpg://raguser:ragpass@localhost:5432/ragdb"
    db_echo: bool = False
    db_pool_size: int = 5
    db_max_overflow: int = 10

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_ttl: int = 3600  # 1 hour

    # Authentication
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15  # Reduced from 30 for better security
    refresh_token_expire_days: int = 7

    # OAuth2
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    oauth_redirect_url: str = "http://localhost:3000/auth/callback"

    # OpenTelemetry Tracing
    otel_enabled: bool = False
    otel_exporter_endpoint: Optional[str] = "http://localhost:4317"
    otel_service_name: Optional[str] = "doculume-backend"

    # LLM Providers (optional default keys)
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    default_llm_provider: str = "openai"
    default_llm_model: str = "gpt-3.5-turbo"

    # Document Processing
    storage_path: str = "./storage"
    max_file_size_mb: int = 50
    allowed_file_types: list = [".pdf", ".txt", ".docx", ".md"]
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Vector Database
    chroma_persist_directory: str = "./chroma_data"
    embedding_model: str = "text-embedding-ada-002"
    retrieval_top_k: int = 5

    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # Security
    cors_origins: list = ["http://localhost:3000", "http://localhost:8000"]
    rate_limit_per_minute: int = 60
    encryption_key: Optional[str] = None  # 32-byte base64-encoded Fernet key for field-level encryption

    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100

    # Monitoring
    log_level: str = "INFO"
    log_format: str = "json"  # or "text"

    @property
    def database_url_sync(self) -> str:
        """Get synchronous database URL for Alembic."""
        return self.database_url.replace("+asyncpg", "")

    def validate_production_config(self) -> None:
        """Validate critical configuration for production environment.

        Raises:
            ValueError: If required production configuration is missing
        """
        if self.environment == "production":
            if not self.encryption_key:
                raise ValueError(
                    "ENCRYPTION_KEY must be set in production environment. "
                    "Generate with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
                )
            if self.jwt_secret_key == "your-secret-key-change-in-production":
                raise ValueError("JWT_SECRET_KEY must be changed in production")
            if not self.database_url or "localhost" in self.database_url:
                raise ValueError("DATABASE_URL must be configured for production (not localhost)")


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Using lru_cache ensures settings are loaded only once.
    """
    return Settings()


# Export settings instance
settings = get_settings()
