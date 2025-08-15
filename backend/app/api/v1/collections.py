"""Document collection routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.middleware import get_current_user
from app.models.user import User
from app.models.collection import Collection, collection_documents
from app.models.document import Document
from app.schemas.collection import (
    CollectionCreate, CollectionUpdate, CollectionResponse, CollectionDocumentAdd,
)
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/collections", tags=["Collections"])


async def _get_collection(collection_id: int, user_id: int, db: AsyncSession) -> Collection:
    result = await db.execute(
        select(Collection).filter(Collection.id == collection_id, Collection.user_id == user_id)
    )
    coll = result.scalar_one_or_none()
    if not coll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return coll


def _to_response(coll: Collection) -> CollectionResponse:
    return CollectionResponse(
        id=coll.id,
        name=coll.name,
        description=coll.description,
        document_count=len(coll.documents),
        document_ids=[d.id for d in coll.documents],
        created_at=coll.created_at,
        updated_at=coll.updated_at,
    )


@router.get("/", response_model=List[CollectionResponse])
async def list_collections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Collection).filter(Collection.user_id == current_user.id).order_by(Collection.name)
    )
    return [_to_response(c) for c in result.scalars().all()]


@router.post("/", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    body: CollectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coll = Collection(user_id=current_user.id, name=body.name, description=body.description)
    db.add(coll)
    await db.commit()
    await db.refresh(coll)
    return _to_response(coll)


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coll = await _get_collection(collection_id, current_user.id, db)
    return _to_response(coll)


@router.patch("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: int,
    body: CollectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coll = await _get_collection(collection_id, current_user.id, db)
    if body.name is not None:
        coll.name = body.name
    if body.description is not None:
        coll.description = body.description
    await db.commit()
    await db.refresh(coll)
    return _to_response(coll)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coll = await _get_collection(collection_id, current_user.id, db)
    await db.delete(coll)
    await db.commit()


@router.post("/{collection_id}/documents", response_model=CollectionResponse)
async def add_documents_to_collection(
    collection_id: int,
    body: CollectionDocumentAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coll = await _get_collection(collection_id, current_user.id, db)

    # Verify documents belong to user
    docs_result = await db.execute(
        select(Document).filter(
            Document.id.in_(body.document_ids),
            Document.user_id == current_user.id,
        )
    )
    docs = docs_result.scalars().all()
    existing_ids = {d.id for d in coll.documents}
    for doc in docs:
        if doc.id not in existing_ids:
            coll.documents.append(doc)

    await db.commit()
    await db.refresh(coll)
    return _to_response(coll)


@router.delete("/{collection_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_document_from_collection(
    collection_id: int,
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coll = await _get_collection(collection_id, current_user.id, db)
    coll.documents = [d for d in coll.documents if d.id != document_id]
    await db.commit()
