"""Elasticsearch vector store with kNN and hybrid BM25+vector search."""

from typing import Any, Dict, List, Optional

from elasticsearch import AsyncElasticsearch, NotFoundError
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings

from app.config import settings
from app.utils.logger import logger

INDEX_NAME = "doculume_chunks"
EMBEDDING_DIMS = 1536  # text-embedding-ada-002

_INDEX_MAPPING: Dict[str, Any] = {
    "mappings": {
        "properties": {
            "chunk_id":    {"type": "keyword"},
            "document_id": {"type": "integer"},
            "user_id":     {"type": "integer"},
            "content":     {"type": "text", "analyzer": "english"},
            "embedding": {
                "type": "dense_vector",
                "dims": EMBEDDING_DIMS,
                "index": True,
                "similarity": "cosine",
            },
            "page_number": {"type": "integer"},
            "chunk_index": {"type": "integer"},
            "filename":    {"type": "keyword"},
        }
    },
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
    },
}


class VectorStore:
    """Elasticsearch-backed vector store with kNN and hybrid search."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.openai_api_key
        self._client: Optional[AsyncElasticsearch] = None
        self._embeddings: Optional[OpenAIEmbeddings] = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _client_instance(self) -> AsyncElasticsearch:
        if self._client is None:
            kwargs: Dict[str, Any] = {"hosts": [settings.elasticsearch_url]}
            if settings.elasticsearch_user and settings.elasticsearch_password:
                kwargs["basic_auth"] = (
                    settings.elasticsearch_user,
                    settings.elasticsearch_password,
                )
            self._client = AsyncElasticsearch(**kwargs)
        return self._client

    def _embed(self) -> OpenAIEmbeddings:
        if self._embeddings is None:
            self._embeddings = OpenAIEmbeddings(
                model=settings.embedding_model,
                openai_api_key=self.api_key or settings.openai_api_key,
            )
        return self._embeddings

    async def ensure_index(self) -> None:
        """Create the index with mappings if it does not exist."""
        client = self._client_instance()
        exists = await client.indices.exists(index=INDEX_NAME)
        if not exists:
            await client.indices.create(index=INDEX_NAME, body=_INDEX_MAPPING)
            logger.info(f"Created Elasticsearch index: {INDEX_NAME}")

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    async def add_documents(self, documents: List[Document], ids: List[str]) -> None:
        """Embed and bulk-index LangChain documents."""
        client = self._client_instance()
        await self.ensure_index()

        texts = [doc.page_content for doc in documents]
        vectors = await self._embed().aembed_documents(texts)

        bulk: List[Any] = []
        for doc, doc_id, vec in zip(documents, ids, vectors):
            chunk_index = 0
            if ":" in doc_id:
                try:
                    chunk_index = int(doc_id.split(":")[-1])
                except ValueError:
                    pass

            bulk.append({"index": {"_index": INDEX_NAME, "_id": doc_id}})
            bulk.append({
                "chunk_id":    doc_id,
                "document_id": doc.metadata.get("document_id"),
                "user_id":     doc.metadata.get("user_id"),
                "content":     doc.page_content,
                "embedding":   vec,
                "page_number": doc.metadata.get("page", 0),
                "chunk_index": chunk_index,
                "filename":    doc.metadata.get("source", ""),
            })

        if bulk:
            resp = await client.bulk(operations=bulk, refresh=True)
            errors = [
                item for item in resp.get("items", [])
                if "error" in item.get("index", {})
            ]
            if errors:
                logger.warning(f"Elasticsearch bulk index errors: {errors[:3]}")
            logger.info(f"Indexed {len(documents)} chunks to Elasticsearch")

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def similarity_search(
        self,
        query: str,
        k: int = 5,
        user_id: Optional[int] = None,
        document_ids: Optional[List[int]] = None,
    ) -> List[Dict[str, Any]]:
        """Pure kNN vector similarity search, optionally scoped to a user and/or document set."""
        client = self._client_instance()
        vec = await self._embed().aembed_query(query)

        filters: List[Any] = []
        if user_id is not None:
            filters.append({"term": {"user_id": user_id}})
        if document_ids:
            filters.append({"terms": {"document_id": document_ids}})

        knn: Dict[str, Any] = {
            "field": "embedding",
            "query_vector": vec,
            "k": k,
            "num_candidates": k * 10,
        }
        if filters:
            knn["filter"] = {"bool": {"filter": filters}} if len(filters) > 1 else filters[0]

        resp = await client.search(
            index=INDEX_NAME,
            knn=knn,
            source=["chunk_id", "content", "document_id", "page_number", "filename"],
            size=k,
        )
        return _hits_to_dicts(resp)

    async def hybrid_search(
        self,
        query: str,
        k: int = 5,
        user_id: Optional[int] = None,
        document_ids: Optional[List[int]] = None,
    ) -> List[Dict[str, Any]]:
        """Hybrid BM25 + kNN search. Falls back to kNN-only on older ES versions."""
        client = self._client_instance()
        vec = await self._embed().aembed_query(query)

        filter_clause: List[Any] = []
        if user_id is not None:
            filter_clause.append({"term": {"user_id": user_id}})
        if document_ids:
            filter_clause.append({"terms": {"document_id": document_ids}})

        body: Dict[str, Any] = {
            "query": {
                "bool": {
                    "must": {"match": {"content": {"query": query}}},
                    **({"filter": filter_clause} if filter_clause else {}),
                }
            },
            "knn": {
                "field": "embedding",
                "query_vector": vec,
                "k": k,
                "num_candidates": k * 10,
                **({"filter": filter_clause} if filter_clause else {}),
            },
            "rank": {"rrf": {}},
            "size": k,
            "_source": ["chunk_id", "content", "document_id", "page_number", "filename"],
        }

        try:
            resp = await client.search(index=INDEX_NAME, body=body)
            return _hits_to_dicts(resp)
        except Exception as exc:
            # RRF requires ES 8.9+ with a supported license — fall back to kNN only
            logger.warning(f"Hybrid search unavailable ({exc}), falling back to kNN")
            return await self.similarity_search(query, k=k, user_id=user_id, document_ids=document_ids)

    async def delete_by_ids(self, ids: List[str]) -> None:
        """Delete chunks by chunk_id."""
        client = self._client_instance()
        bulk = [{"delete": {"_index": INDEX_NAME, "_id": doc_id}} for doc_id in ids]
        if bulk:
            await client.bulk(operations=bulk, refresh=True)
            logger.info(f"Deleted {len(ids)} chunks from Elasticsearch")

    def get_all_ids(self) -> List[str]:
        """Not used with ES — left for interface compatibility."""
        return []

    async def close(self) -> None:
        if self._client is not None:
            await self._client.close()
            self._client = None


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _hits_to_dicts(resp: Dict[str, Any]) -> List[Dict[str, Any]]:
    results = []
    for hit in resp.get("hits", {}).get("hits", []):
        src = hit.get("_source", {})
        results.append({
            "text":        src.get("content", ""),
            "source":      src.get("chunk_id", ""),
            "document_id": src.get("document_id"),
            "page_number": src.get("page_number"),
            "filename":    src.get("filename", ""),
            "score":       round(hit.get("_score") or 0.0, 4),
        })
    return results
