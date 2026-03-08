"""Admin document management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/documents/stats")
async def document_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document statistics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(403, "Admin access required")

    total = await db.execute(select(func.count(Document.id)))
    total_docs = total.scalar()

    size = await db.execute(select(func.sum(Document.file_size)))
    total_size = size.scalar() or 0

    return {
        "total_documents": total_docs,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2)
    }
