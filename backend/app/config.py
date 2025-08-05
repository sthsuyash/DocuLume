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
        extra="ignore"
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
    db_pool_size: int = 20
    db_max_overflow: int = 10
    db_pool_recycle: int = 3600  # recycle connections after 1 hour

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_password: Optional[str] = None
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

    # Vector Database (Elasticsearch)
    elasticsearch_url: str = "http://localhost:9200"
    elasticsearch_user: Optional[str] = None
    elasticsearch_password: Optional[str] = None
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

    # Error tracking
    sentry_dsn: Optional[str] = None

    # Email (SMTP) for verification emails
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    email_from: str = "noreply@doculume.ai"
    frontend_url: str = "http://localhost:3000"

    @property
    def database_url_sync(self) -> str:
        """Get synchronous database URL for Alembic."""
        return self.database_url.replace("+asyncpg", "")

    def validate_production_config(self) -> None:
        """Validate critical configuration for production environment."""
        if self.environment != "production":
            return
        errors = []
        if not self.encryption_key:
            errors.append(
                "ENCRYPTION_KEY is required. "
                "Generate: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        if self.jwt_secret_key == "your-secret-key-change-in-production":
            errors.append("JWT_SECRET_KEY must be changed from the default value")
        if not self.database_url or "localhost" in self.database_url:
            errors.append("DATABASE_URL must point to a non-localhost host in production")
        if not self.redis_password:
            errors.append("REDIS_PASSWORD must be set in production")
        if self.debug:
            errors.append("DEBUG must be false in production")
        if not self.cors_origins or self.cors_origins == ["http://localhost:3000", "http://localhost:8000"]:
            errors.append("CORS_ORIGINS must be set to your production domain(s)")
        if errors:
            raise ValueError("Production config errors:\n" + "\n".join(f"  - {e}" for e in errors))


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Using lru_cache ensures settings are loaded only once.
    """
    return Settings()


# Export settings instance
settings = get_settings()
