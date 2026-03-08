"""Database configuration and session management."""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from redis.asyncio import Redis
from app.config import settings

Base = declarative_base()

engine = create_async_engine(
    settings.database_url,
    echo=settings.db_echo,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

redis_client: Redis = None

async def get_redis() -> Redis:
    global redis_client
    if redis_client is None:
        redis_client = Redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
    return redis_client

async def init_db() -> None:
    async with engine.begin() as conn:
        from app.models import user, document, conversation, message, chunk
        await conn.run_sync(Base.metadata.create_all)

async def close_db() -> None:
    global redis_client
    await engine.dispose()
    if redis_client:
        await redis_client.close()
