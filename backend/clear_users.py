"""Script to clear all users from the database."""
import asyncio
from sqlalchemy import delete
from app.database import async_session_maker
from app.models.user import User


async def clear_users():
    async with async_session_maker() as session:
        await session.execute(delete(User))
        await session.commit()
        print("All users cleared successfully")


if __name__ == "__main__":
    asyncio.run(clear_users())
