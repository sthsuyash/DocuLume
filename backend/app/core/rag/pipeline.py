"""RAG pipeline implementation."""

from typing import List, Tuple, Optional, AsyncGenerator
from app.core.rag.vector_store import VectorStore
from app.core.llm.provider import get_llm_provider
from app.utils.logger import logger
from app.utils.cache import cache_manager


class RAGPipeline:
    """RAG (Retrieval-Augmented Generation) pipeline."""

    def __init__(
        self,
        vector_store: VectorStore,
        llm_provider: str = "openai",
        llm_model: Optional[str] = None,
        api_key: Optional[str] = None,
        user_id: Optional[int] = None,
        use_cache: bool = True
    ):
        self.vector_store = vector_store
        self.llm = get_llm_provider(provider=llm_provider, model=llm_model, api_key=api_key)
        self.user_id = user_id
        self.use_cache = use_cache

    async def query(self, question: str, top_k: int = 5, document_ids: Optional[List[int]] = None) -> Tuple[str, List[str]]:
        """Execute RAG query: retrieve context and generate answer."""
        # Check cache first
        if self.use_cache and self.user_id and document_ids:
            cached = await cache_manager.get_rag_response(question, self.user_id, document_ids)
            if cached:
                logger.info("Returning cached RAG response")
                return cached["answer"], cached["sources"]

        # Retrieve relevant chunks
        documents = await self.vector_store.similarity_search(question, k=top_k)

        if not documents:
            return "I don't have enough information to answer this question.", []

        # Build context from retrieved documents
        context = "\n\n".join([doc.page_content for doc in documents])

        # Extract source IDs
        sources = [doc.metadata.get("id", "unknown") for doc in documents]

        # Create prompt
        prompt = self._build_prompt(context, question)

        # Generate answer
        answer = await self.llm.generate(prompt)

        # Cache the response
        if self.use_cache and self.user_id and document_ids:
            await cache_manager.cache_rag_response(
                question, self.user_id, document_ids, answer, sources
            )

        logger.info(f"RAG query completed. Retrieved {len(documents)} chunks.")
        return answer, sources

    async def query_stream(
        self, question: str, top_k: int = 5
    ) -> AsyncGenerator[Tuple[str, Optional[List[str]]], None]:
        """Execute RAG query with streaming: retrieve context and generate answer."""
        # Retrieve relevant chunks
        documents = await self.vector_store.similarity_search(question, k=top_k)

        if not documents:
            yield "I don't have enough information to answer this question.", []
            return

        # Build context from retrieved documents
        context = "\n\n".join([doc.page_content for doc in documents])

        # Extract source IDs
        sources = [doc.metadata.get("id", "unknown") for doc in documents]

        # Create prompt
        prompt = self._build_prompt(context, question)

        # Stream answer
        first_chunk = True
        async for chunk in self.llm.stream(prompt):
            if first_chunk:
                yield chunk, sources
                first_chunk = False
            else:
                yield chunk, None

        logger.info(f"RAG query streamed. Retrieved {len(documents)} chunks.")

    def _build_prompt(self, context: str, question: str) -> str:
        """Build the prompt for the LLM."""
        return f"""Use the following context to answer the question. Answer in at most 3 sentences.

Context:
{context}

Question: {question}

Answer: """
