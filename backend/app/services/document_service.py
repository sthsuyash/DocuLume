"""Document service for file upload and processing."""

import os
import shutil
from typing import List, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import UploadFile, HTTPException, status
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.chunk import Chunk
from app.core.document_processing import load_document, chunk_documents, calculate_chunk_ids
from app.core.rag import VectorStore
from app.config import settings
from app.utils.logger import logger


class DocumentService:
    """Service for document operations."""

    @staticmethod
    async def upload_document(
        db: AsyncSession,
        file: UploadFile,
        user: User,
        vector_store: VectorStore
    ) -> Document:
        """Upload and process a document."""
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in settings.allowed_file_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file_ext} not allowed. Allowed types: {settings.allowed_file_types}"
            )

        # Validate file size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > settings.max_file_size_mb * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds {settings.max_file_size_mb}MB limit"
            )

        # Create storage directory
        os.makedirs(settings.storage_path, exist_ok=True)

        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{user.id}_{timestamp}_{file.filename}"
        file_path = os.path.join(settings.storage_path, filename)

        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error saving file"
            )

        # Create document record
        document = Document(
            user_id=user.id,
            filename=filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            file_type=file_ext,
            status=DocumentStatus.PROCESSING
        )

        db.add(document)
        await db.commit()
        await db.refresh(document)

        # Process document asynchronously with Celery or synchronously
        try:
            await DocumentService._process_document(
                db, document, vector_store, use_celery=True
            )
        except Exception as e:
            logger.error(f"Error processing document {document.id}: {str(e)}")
            document.status = DocumentStatus.FAILED
            document.error_message = str(e)
            await db.commit()
            raise

        return document

    @staticmethod
    async def _process_document(
        db: AsyncSession,
        document: Document,
        vector_store: VectorStore,
        use_celery: bool = True
    ) -> None:
        """Process document: load, chunk, embed, and store."""
        if use_celery:
            # Queue document for async processing with Celery
            try:
                from app.workers.tasks import process_document_task

                # Get user's API key if available
                user_api_key = None
                if hasattr(vector_store, 'api_key'):
                    user_api_key = vector_store.api_key

                # Queue task
                task = process_document_task.delay(
                    document.id,
                    document.file_path,
                    user_api_key
                )

                document.status = DocumentStatus.PROCESSING
                await db.commit()

                return  # Task queued successfully

            except Exception as e:
                # Fall back to synchronous processing if Celery fails
                logger.warning(f"Celery unavailable, falling back to sync processing: {str(e)}")
                use_celery = False

        # Synchronous processing (fallback or if Celery disabled)
        # Load document
        documents = await load_document(document.file_path)
        document.page_count = len(documents)

        # Chunk documents
        chunks = chunk_documents(documents)

        # Calculate chunk IDs
        chunk_ids = calculate_chunk_ids(chunks, document.filename)

        # Add metadata
        for chunk, chunk_id in zip(chunks, chunk_ids):
            chunk.metadata["id"] = chunk_id
            chunk.metadata["document_id"] = document.id

        # Store in vector database
        await vector_store.add_documents(chunks, chunk_ids)

        # Save chunk records
        for chunk_doc, chunk_id in zip(chunks, chunk_ids):
            page = chunk_doc.metadata.get("page", 0)
            chunk_index = int(chunk_id.split(":")[-1])

            chunk = Chunk(
                document_id=document.id,
                chunk_id=chunk_id,
                content=chunk_doc.page_content,
                page_number=page,
                chunk_index=chunk_index,
                vector_id=chunk_id
            )
            db.add(chunk)

        document.chunk_count = len(chunks)
        document.status = DocumentStatus.COMPLETED
        document.processed_at = datetime.utcnow()

        await db.commit()
        logger.info(f"Document {document.id} processed successfully. {len(chunks)} chunks created.")

    @staticmethod
    async def get_user_documents(
        db: AsyncSession,
        user_id: int,
        search: str = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Document], int]:
        """Get paginated documents for a user with optional search.

        Args:
            db: Database session
            user_id: User ID to filter documents
            search: Optional search term for filename filtering
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Tuple of (documents list, total count)
        """
        # Base query filter
        base_filter = Document.user_id == user_id

        # Apply search filter if provided
        if search:
            search_pattern = f"%{search}%"
            base_filter = base_filter & Document.original_filename.ilike(search_pattern)

        # Count total items
        count_query = select(func.count(Document.id)).filter(base_filter)
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated items
        offset = (page - 1) * page_size
        query = (
            select(Document)
            .filter(base_filter)
            .order_by(Document.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await db.execute(query)
        documents = list(result.scalars().all())

        return documents, total

    @staticmethod
    async def delete_document(
        db: AsyncSession,
        document_id: int,
        user_id: int,
        vector_store: VectorStore
    ) -> None:
        """Delete a document and its chunks."""
        result = await db.execute(
            select(Document).filter(
                Document.id == document_id,
                Document.user_id == user_id
            )
        )
        document = result.scalar_one_or_none()

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Get chunk IDs
        chunk_result = await db.execute(
            select(Chunk.chunk_id).filter(Chunk.document_id == document_id)
        )
        chunk_ids = [row[0] for row in chunk_result.all()]

        # Delete from vector store
        if chunk_ids:
            await vector_store.delete_by_ids(chunk_ids)

        # Delete file
        if os.path.exists(document.file_path):
            os.remove(document.file_path)

        # Delete from database (cascades to chunks)
        await db.delete(document)
        await db.commit()

        logger.info(f"Document {document_id} deleted successfully")

    @staticmethod
    async def bulk_upload_documents(
        db: AsyncSession,
        files: List[UploadFile],
        user: User,
        vector_store: VectorStore
    ) -> dict:
        """Upload multiple documents at once."""
        results = []
        successful = 0
        failed = 0

        for file in files:
            try:
                document = await DocumentService.upload_document(db, file, user, vector_store)
                results.append({
                    "filename": file.filename,
                    "success": True,
                    "document": document,
                    "error": None
                })
                successful += 1
            except Exception as e:
                logger.error(f"Failed to upload {file.filename}: {str(e)}")
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "document": None,
                    "error": str(e)
                })
                failed += 1

        logger.info(f"Bulk upload completed: {successful} successful, {failed} failed")

        return {
            "results": results,
            "total": len(files),
            "successful": successful,
            "failed": failed
        }

    @staticmethod
    async def bulk_delete_documents(
        db: AsyncSession,
        document_ids: List[int],
        user_id: int,
        vector_store: VectorStore
    ) -> None:
        """Delete multiple documents at once."""
        for document_id in document_ids:
            try:
                await DocumentService.delete_document(db, document_id, user_id, vector_store)
            except HTTPException as e:
                if e.status_code == status.HTTP_404_NOT_FOUND:
                    logger.warning(f"Document {document_id} not found, skipping")
                else:
                    raise

        logger.info(f"Bulk delete completed: {len(document_ids)} documents")
