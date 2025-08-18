"""Celery tasks for background processing."""

import asyncio
from datetime import datetime, timedelta
from celery import Task
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.workers.celery_app import celery_app
from app.config import settings
from app.models.document import Document, DocumentStatus
from app.core.document_processing import load_document, chunk_documents, calculate_chunk_ids
from app.core.rag import VectorStore
from app.utils.logger import logger


task_engine = create_async_engine(settings.database_url, echo=False)
TaskSessionLocal = async_sessionmaker(
    task_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class AsyncTask(Task):
    def __call__(self, *args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(self.run_async(*args, **kwargs))

    async def run_async(self, *args, **kwargs):
        raise NotImplementedError


@celery_app.task(base=AsyncTask, bind=True, name="process_document", max_retries=3)
async def process_document_task(self, document_id: int, file_path: str, user_api_key: str = None):
    """Process document asynchronously with exponential backoff retries."""
    from sqlalchemy import select, update

    async with TaskSessionLocal() as db:
        try:
            result = await db.execute(select(Document).filter(Document.id == document_id))
            document = result.scalar_one_or_none()

            if not document:
                logger.error(f"Document {document_id} not found")
                return {"status": "error", "message": "Document not found"}

            await db.execute(
                update(Document).where(Document.id == document_id).values(status=DocumentStatus.PROCESSING)
            )
            await db.commit()

            logger.info(f"Loading document: {file_path}")
            documents = await load_document(file_path)

            logger.info(f"Chunking document: {file_path}")
            # Respect per-document chunk size/overlap overrides
            if document.chunk_size_override or document.chunk_overlap_override:
                from app.core.document_processing.chunker import calculate_chunk_ids as _calc_ids
                from langchain_text_splitters import RecursiveCharacterTextSplitter
                _chunk_size = document.chunk_size_override or settings.chunk_size
                _chunk_overlap = document.chunk_overlap_override or settings.chunk_overlap
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=_chunk_size,
                    chunk_overlap=_chunk_overlap,
                    length_function=len,
                    separators=["\n\n", "\n", " ", ""],
                )
                chunks = splitter.split_documents(documents)
            else:
                chunks = chunk_documents(documents)

            chunk_ids = calculate_chunk_ids(chunks, document.filename)

            # Inject document_id and user_id into metadata for ES user-scoping
            for chunk, chunk_id in zip(chunks, chunk_ids):
                chunk.metadata["id"] = chunk_id
                chunk.metadata["document_id"] = document_id
                chunk.metadata["user_id"] = document.user_id

            logger.info(f"Storing {len(chunks)} chunks in Elasticsearch")
            vector_store = VectorStore(api_key=user_api_key)
            await vector_store.add_documents(chunks, chunk_ids)

            await db.execute(
                update(Document)
                .where(Document.id == document_id)
                .values(
                    status=DocumentStatus.COMPLETED,
                    page_count=len(documents),
                    chunk_count=len(chunks),
                    processed_at=datetime.utcnow(),
                )
            )
            await db.commit()

            logger.info(f"Document {document_id} processed successfully")

            # Notify user via WebSocket
            try:
                from app.api.websocket.context import manager as ws_manager
                await ws_manager.broadcast_to_user(
                    document.user_id,
                    {
                        "type": "document.ready",
                        "document_id": document_id,
                        "filename": document.original_filename,
                        "chunk_count": len(chunks),
                    },
                )
            except Exception as ws_err:
                logger.warning(f"WebSocket notification failed: {ws_err}")

            # Create in-app notification
            try:
                from app.utils.notifications import create_notification
                await create_notification(
                    db,
                    user_id=document.user_id,
                    type="document.ready",
                    title="Document ready",
                    body=f"'{document.original_filename}' has been processed ({len(chunks)} chunks).",
                    data={"document_id": document_id},
                )
            except Exception as notif_err:
                logger.warning(f"Notification creation failed: {notif_err}")

            # Fire webhook if configured
            try:
                from sqlalchemy import select as sa_select
                from app.models.user import User
                user_result = await db.execute(sa_select(User).filter(User.id == document.user_id))
                user = user_result.scalar_one_or_none()
                if user and user.webhook_url:
                    import httpx
                    payload = {
                        "event": "document.ready",
                        "document_id": document_id,
                        "filename": document.original_filename,
                        "chunk_count": len(chunks),
                        "page_count": len(documents),
                    }
                    async with httpx.AsyncClient(timeout=10) as client:
                        await client.post(user.webhook_url, json=payload)
            except Exception as wh_err:
                logger.warning(f"Webhook delivery failed: {wh_err}")

            return {"status": "success", "document_id": document_id, "chunks": len(chunks), "pages": len(documents)}

        except Exception as e:
            retry_count = self.request.retries
            logger.warning(
                f"Document {document_id} processing failed "
                f"(attempt {retry_count + 1}/{self.max_retries + 1}): {e}"
            )

            if retry_count < self.max_retries:
                countdown = 60 * (2 ** retry_count)
                raise self.retry(exc=e, countdown=countdown)

            logger.error(f"Document {document_id} permanently failed after {self.max_retries + 1} attempts: {e}")
            async with TaskSessionLocal() as fail_db:
                from sqlalchemy import update as sa_update
                await fail_db.execute(
                    sa_update(Document)
                    .where(Document.id == document_id)
                    .values(status=DocumentStatus.FAILED, error_message=str(e))
                )
                await fail_db.commit()

            return {"status": "error", "document_id": document_id, "error": str(e)}


@celery_app.task(name="expire_documents")
def expire_documents():
    """Delete documents whose expires_at timestamp has passed."""
    async def _run():
        from sqlalchemy import select
        from app.models.chunk import Chunk
        import os

        expired_count = 0
        async with TaskSessionLocal() as db:
            now = datetime.utcnow()
            result = await db.execute(
                select(Document).filter(
                    Document.expires_at != None,
                    Document.expires_at <= now,
                )
            )
            docs = result.scalars().all()

            for doc in docs:
                chunk_result = await db.execute(
                    select(Chunk.chunk_id).filter(Chunk.document_id == doc.id)
                )
                chunk_ids = [row[0] for row in chunk_result.all()]
                if chunk_ids:
                    try:
                        vs = VectorStore()
                        await vs.delete_by_ids(chunk_ids)
                    except Exception as e:
                        logger.warning(f"ES expiry cleanup error for doc {doc.id}: {e}")

                if doc.file_path and os.path.exists(doc.file_path):
                    try:
                        os.remove(doc.file_path)
                    except OSError as e:
                        logger.warning(f"File expiry removal error for doc {doc.id}: {e}")

                await db.delete(doc)
                expired_count += 1

            await db.commit()

        logger.info(f"Expired {expired_count} documents")
        return {"status": "success", "expired": expired_count}

    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_run())


@celery_app.task(name="cleanup_old_documents")
def cleanup_old_documents(failed_days: int = 7, completed_days: int = 0):
    """Delete FAILED documents older than failed_days and their orphaned ES chunks.

    Args:
        failed_days: Remove FAILED documents older than this many days (default 7).
        completed_days: If > 0, also remove COMPLETED documents older than this.
    """
    async def _run():
        from sqlalchemy import select, delete
        from app.models.chunk import Chunk
        import os

        deleted_count = 0
        async with TaskSessionLocal() as db:
            cutoff_failed = datetime.utcnow() - timedelta(days=failed_days)
            conditions = [
                (Document.status == DocumentStatus.FAILED) & (Document.created_at < cutoff_failed)
            ]
            if completed_days > 0:
                cutoff_completed = datetime.utcnow() - timedelta(days=completed_days)
                conditions.append(
                    (Document.status == DocumentStatus.COMPLETED) & (Document.created_at < cutoff_completed)
                )

            from sqlalchemy import or_
            result = await db.execute(
                select(Document).filter(or_(*conditions))
            )
            docs = result.scalars().all()

            for doc in docs:
                # Get chunk IDs for ES deletion
                chunk_result = await db.execute(
                    select(Chunk.chunk_id).filter(Chunk.document_id == doc.id)
                )
                chunk_ids = [row[0] for row in chunk_result.all()]

                # Delete from Elasticsearch
                if chunk_ids:
                    try:
                        vs = VectorStore()
                        await vs.delete_by_ids(chunk_ids)
                    except Exception as e:
                        logger.warning(f"ES cleanup error for doc {doc.id}: {e}")

                # Delete physical file
                if doc.file_path and os.path.exists(doc.file_path):
                    try:
                        os.remove(doc.file_path)
                    except OSError as e:
                        logger.warning(f"File removal error for doc {doc.id}: {e}")

                await db.delete(doc)
                deleted_count += 1

            await db.commit()

        logger.info(f"Cleanup completed: {deleted_count} documents removed")
        return {"status": "success", "deleted": deleted_count}

    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_run())
