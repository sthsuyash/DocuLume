"""Admin document management routes."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.document import DocumentResponse
from app.utils import audit
from app.api.v1.admin_deps import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/documents", response_model=PaginatedResponse[DocumentResponse])
async def list_all_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    doc_status: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    count_query = select(func.count(Document.id))
    if user_id:
        count_query = count_query.where(Document.user_id == user_id)
    if doc_status:
        count_query = count_query.where(Document.status == doc_status)
    total = (await db.execute(count_query)).scalar()

    offset = (page - 1) * page_size
    query = (
        select(Document)
        .options(selectinload(Document.user))
        .order_by(Document.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    if user_id:
        query = query.where(Document.user_id == user_id)
    if doc_status:
        query = query.where(Document.status == doc_status)

    result = await db.execute(query)
    documents = result.scalars().all()
    return PaginatedResponse(
        items=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/users/{user_id}/documents", response_model=PaginatedResponse[DocumentResponse])
async def list_user_documents(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user_result = await db.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    total = (await db.execute(select(func.count(Document.id)).where(Document.user_id == user_id))).scalar()

    offset = (page - 1) * page_size
    query = (
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    documents = result.scalars().all()
    return PaginatedResponse(
        items=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.delete("/documents/{document_id}")
async def admin_delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    audit.log_admin_document_delete(admin.id, document_id)
    await db.delete(document)
    await db.commit()
    return {"message": "Document deleted successfully"}


@router.post("/documents/bulk-delete")
async def bulk_delete_documents(
    document_ids: List[int],
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Document).where(Document.id.in_(document_ids)))
    documents = result.scalars().all()
    for doc in documents:
        await db.delete(doc)
    await db.commit()
    audit.log_admin_bulk_document_delete(admin.id, document_ids, len(documents))
    return {"message": f"Deleted {len(documents)} documents", "deleted_count": len(documents)}
