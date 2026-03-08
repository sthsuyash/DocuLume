"""Redis caching utilities."""

import json
import hashlib
from typing import Optional, Any
from redis import asyncio as aioredis
from app.config import settings
from app.utils.logger import logger


class CacheManager:
    """Redis cache manager for application data."""

    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        """Connect to Redis."""
        try:
            self.redis = await aioredis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("Connected to Redis cache")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis = None

    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis:
            await self.redis.close()
            logger.info("Disconnected from Redis cache")

    @staticmethod
    def _generate_key(prefix: str, *args) -> str:
        """Generate cache key from prefix and arguments."""
        key_data = json.dumps(args, sort_keys=True)
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        return f"{prefix}:{key_hash}"

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.redis:
            return None

        try:
            value = await self.redis.get(key)
            if value:
                logger.debug(f"Cache hit: {key}")
                return json.loads(value)
            logger.debug(f"Cache miss: {key}")
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache with optional TTL."""
        if not self.redis:
            return

        try:
            ttl = ttl or settings.redis_cache_ttl
            await self.redis.setex(
                key,
                ttl,
                json.dumps(value)
            )
            logger.debug(f"Cache set: {key} (TTL: {ttl}s)")
        except Exception as e:
            logger.error(f"Cache set error: {e}")

    async def delete(self, key: str):
        """Delete value from cache."""
        if not self.redis:
            return

        try:
            await self.redis.delete(key)
            logger.debug(f"Cache deleted: {key}")
        except Exception as e:
            logger.error(f"Cache delete error: {e}")

    async def clear_pattern(self, pattern: str):
        """Clear all keys matching pattern."""
        if not self.redis:
            return

        try:
            keys = []
            async for key in self.redis.scan_iter(match=pattern):
                keys.append(key)

            if keys:
                await self.redis.delete(*keys)
                logger.info(f"Cleared {len(keys)} keys matching pattern: {pattern}")
        except Exception as e:
            logger.error(f"Cache clear pattern error: {e}")

    async def cache_rag_response(
        self,
        question: str,
        user_id: int,
        document_ids: list,
        answer: str,
        sources: list
    ):
        """Cache RAG response."""
        key = self._generate_key("rag", question, user_id, sorted(document_ids))
        data = {
            "answer": answer,
            "sources": sources
        }
        await self.set(key, data, ttl=3600)  # 1 hour

    async def get_rag_response(
        self,
        question: str,
        user_id: int,
        document_ids: list
    ) -> Optional[dict]:
        """Get cached RAG response."""
        key = self._generate_key("rag", question, user_id, sorted(document_ids))
        return await self.get(key)

    async def cache_embeddings(
        self,
        text: str,
        model: str,
        embeddings: list
    ):
        """Cache document embeddings."""
        key = self._generate_key("embedding", text, model)
        await self.set(key, embeddings, ttl=86400)  # 24 hours

    async def get_embeddings(
        self,
        text: str,
        model: str
    ) -> Optional[list]:
        """Get cached embeddings."""
        key = self._generate_key("embedding", text, model)
        return await self.get(key)

    async def invalidate_user_cache(self, user_id: int):
        """Invalidate all cache for a user."""
        pattern = f"rag:*{user_id}*"
        await self.clear_pattern(pattern)


# Global cache instance
cache_manager = CacheManager()
