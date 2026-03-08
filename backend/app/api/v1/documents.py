"""Document routes."""

from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.document import DocumentResponse, DocumentList, BulkDeleteRequest, BulkUploadResponse
from app.schemas.common import PaginationParams, PaginatedResponse
from app.services import DocumentService
from app.middleware import get_current_user
from app.models.user import User
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
