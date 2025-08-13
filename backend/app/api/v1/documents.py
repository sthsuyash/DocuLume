"""Document routes."""

import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, UploadFile, File, HTTPException, Query, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.schemas.document import DocumentResponse, DocumentList, BulkDeleteRequest, BulkUploadResponse
from app.schemas.common import PaginationParams, PaginatedResponse
from app.services import DocumentService
from app.middleware import get_current_user
from app.models.user import User
from app.models.document import Document
from app.core.rag import VectorStore

router = APIRouter(prefix="/documents", tags=["Documents"])


def get_vector_store(current_user: User = Depends(get_current_user)):
    """Get vector store instance with user's API key."""
    api_key = current_user.openai_api_key
    return VectorStore(api_key=api_key)


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store)
):
    """Upload and process a document."""
    document = await DocumentService.upload_document(db, file, current_user, vector_store)
    return document


@router.get("/", response_model=PaginatedResponse[DocumentResponse])
async def list_documents(
    search: str = Query(None, description="Search by filename"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated documents for current user with optional search."""
    documents, total = await DocumentService.get_user_documents(
        db, current_user.id, search, page, page_size
    )
    return PaginatedResponse(
        items=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single document by ID."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store)
):
    """Delete a document."""
    await DocumentService.delete_document(db, document_id, current_user.id, vector_store)
    return None


@router.post("/bulk-upload", response_model=BulkUploadResponse, status_code=201)
async def bulk_upload_documents(
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store)
):
    """Upload multiple documents at once."""
    results = await DocumentService.bulk_upload_documents(db, files, current_user, vector_store)
    return results


@router.get("/{document_id}/preview")
async def preview_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Serve a document file for in-browser preview."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk")

    ext = doc.file_type.lower()
    if ext == ".pdf":
        media_type = "application/pdf"
    elif ext in (".txt", ".md"):
        media_type = "text/plain"
    else:
        media_type = "application/octet-stream"

    return FileResponse(
        path=doc.file_path,
        media_type=media_type,
        filename=doc.original_filename,
        headers={"Content-Disposition": "inline"},
    )


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store),
):
    """Reset a document to UPLOADING and re-queue it for processing."""
    from sqlalchemy import update, delete
    from app.models.chunk import Chunk
    from app.models.document import DocumentStatus
    from app.workers.tasks import process_document_task

    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Delete existing ES chunks
    chunk_result = await db.execute(select(Chunk.chunk_id).where(Chunk.document_id == document_id))
    chunk_ids = [r[0] for r in chunk_result.all()]
    if chunk_ids:
        try:
            await vector_store.delete_by_ids(chunk_ids)
        except Exception:
            pass

    # Delete DB chunk records
    await db.execute(delete(Chunk).where(Chunk.document_id == document_id))

    # Reset document status
    await db.execute(
        update(Document).where(Document.id == document_id).values(
            status=DocumentStatus.UPLOADING,
            error_message=None,
            chunk_count=0,
            processed_at=None,
        )
    )
    await db.commit()

    # Re-queue Celery task
    process_document_task.delay(document_id, doc.file_path, current_user.openai_api_key)

    await db.refresh(doc)
    return doc


@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return stored text chunks for a document (for debugging/inspection)."""
    from app.models.chunk import Chunk
    from sqlalchemy import func

    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    total = (await db.execute(
        select(func.count(Chunk.id)).where(Chunk.document_id == document_id)
    )).scalar() or 0

    chunks = (await db.execute(
        select(Chunk)
        .where(Chunk.document_id == document_id)
        .order_by(Chunk.chunk_index)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )).scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": c.id,
                "chunk_id": c.chunk_id,
                "content": c.content,
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
            }
            for c in chunks
        ],
    }


@router.patch("/{document_id}/tags", response_model=DocumentResponse)
async def update_document_tags(
    document_id: int,
    tags: List[str] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Replace the tags list for a document."""
    from sqlalchemy import update as sa_update

    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    cleaned = list({t.strip().lower() for t in tags if t.strip()})[:20]
    await db.execute(sa_update(Document).where(Document.id == document_id).values(tags=cleaned))
    await db.commit()
    await db.refresh(doc)
    return doc


@router.post("/bulk-delete", status_code=204)
async def bulk_delete_documents(
    request: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    vector_store: VectorStore = Depends(get_vector_store)
):
    """Delete multiple documents at once."""
    await DocumentService.bulk_delete_documents(
        db, request.document_ids, current_user.id, vector_store
    )
    return None


@router.post("/{document_id}/summarize", response_model=DocumentResponse)
async def summarize_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI summary for a document from its stored chunks."""
    from sqlalchemy import update as sa_update
    from app.models.chunk import Chunk
    from app.services.llm_router import LLMRouter

    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Collect first ~3000 chars worth of chunks for context
    chunks_result = await db.execute(
        select(Chunk.content)
        .where(Chunk.document_id == document_id)
        .order_by(Chunk.chunk_index)
        .limit(20)
    )
    chunk_texts = [r[0] for r in chunks_result.all()]
    if not chunk_texts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No chunks found; process the document first")

    combined = "\n\n".join(chunk_texts)[:6000]

    try:
        llm = await LLMRouter.get_provider_for_user(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    summary = await llm.chat(messages=[
        {"role": "system", "content": "You are a concise document summarizer. Write a 2-3 paragraph summary."},
        {"role": "user", "content": f"Summarize this document:\n\n{combined}"},
    ])

    await db.execute(sa_update(Document).where(Document.id == document_id).values(summary=summary))
    await db.commit()
    await db.refresh(doc)
    return doc


class ChunkSettingsUpdate(BaseModel):
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None


@router.patch("/{document_id}/chunk-settings", response_model=DocumentResponse)
async def update_chunk_settings(
    document_id: int,
    data: ChunkSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set custom chunk size / overlap overrides for a document."""
    from sqlalchemy import update as sa_update

    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    updates = {}
    if data.chunk_size is not None:
        updates["chunk_size_override"] = max(100, min(data.chunk_size, 4000))
    if data.chunk_overlap is not None:
        updates["chunk_overlap_override"] = max(0, min(data.chunk_overlap, 1000))

    if updates:
        await db.execute(sa_update(Document).where(Document.id == document_id).values(**updates))
        await db.commit()
        await db.refresh(doc)
    return doc


class ExpiryUpdate(BaseModel):
    expires_at: Optional[datetime] = None


@router.patch("/{document_id}/expiry", response_model=DocumentResponse)
async def update_document_expiry(
    document_id: int,
    data: ExpiryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set or clear the expiry date for a document."""
    from sqlalchemy import update as sa_update

    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await db.execute(
        sa_update(Document).where(Document.id == document_id).values(expires_at=data.expires_at)
    )
    await db.commit()
    await db.refresh(doc)
    return doc
