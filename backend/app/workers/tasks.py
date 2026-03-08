"""Celery tasks for background processing."""

import asyncio
from typing import List
from celery import Task
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.workers.celery_app import celery_app
from app.config import settings
from app.models.document import Document, DocumentStatus
from app.core.document_processing import load_document, chunk_documents, calculate_chunk_ids
from app.core.rag import VectorStore
from app.utils.logger import logger


# Create async engine for tasks
task_engine = create_async_engine(settings.database_url, echo=False)
TaskSessionLocal = async_sessionmaker(
    task_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class AsyncTask(Task):
    """Base task with async support."""

    def __call__(self, *args, **kwargs):
        """Run task in event loop."""
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(self.run_async(*args, **kwargs))

    async def run_async(self, *args, **kwargs):
        """Override this method for async tasks."""
        raise NotImplementedError


@celery_app.task(base=AsyncTask, bind=True, name="process_document")
async def process_document_task(self, document_id: int, file_path: str, user_api_key: str = None):
    """Process document asynchronously."""
    async with TaskSessionLocal() as db:
        try:
            # Update status to processing
            from sqlalchemy import select, update
            result = await db.execute(
                select(Document).filter(Document.id == document_id)
            )
            document = result.scalar_one_or_none()

            if not document:
                logger.error(f"Document {document_id} not found")
                return {"status": "error", "message": "Document not found"}

            await db.execute(
                update(Document)
                .where(Document.id == document_id)
                .values(status=DocumentStatus.PROCESSING)
            )
            await db.commit()

            # Load document
            logger.info(f"Loading document: {file_path}")
            documents = await load_document(file_path)

            # Chunk documents
            logger.info(f"Chunking document: {file_path}")
            chunks = chunk_documents(documents)

            # Calculate chunk IDs
            source = document.filename
            chunk_ids = calculate_chunk_ids(chunks, source)

            # Store in vector database
            logger.info(f"Storing {len(chunks)} chunks in vector store")
            vector_store = VectorStore(api_key=user_api_key)
            await vector_store.add_documents(chunks, chunk_ids)

            # Update document status
            await db.execute(
                update(Document)
                .where(Document.id == document_id)
                .values(
                    status=DocumentStatus.COMPLETED,
                    page_count=len(documents),
                    chunk_count=len(chunks)
                )
            )
            await db.commit()

            logger.info(f"Document {document_id} processed successfully")
            return {
                "status": "success",
                "document_id": document_id,
                "chunks": len(chunks),
                "pages": len(documents)
            }

        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")

            # Update status to failed
            await db.execute(
                update(Document)
                .where(Document.id == document_id)
                .values(status=DocumentStatus.FAILED)
            )
            await db.commit()

            return {
                "status": "error",
                "document_id": document_id,
                "error": str(e)
            }


@celery_app.task(name="cleanup_old_documents")
def cleanup_old_documents():
    """Clean up old documents (can be scheduled)."""
    # Placeholder for document cleanup logic
    logger.info("Running document cleanup task")
    return {"status": "success", "message": "Cleanup completed"}
