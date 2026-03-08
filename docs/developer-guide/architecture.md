# Architecture

Purpose: high-level architecture and component responsibilities.

Components

- Frontend (Next.js) — user-facing UI and docs site.
- Backend (FastAPI) — API, auth, ingestion, and retrieval orchestration.
- Workers — document processing, embedding, and index updates.
- Vector store — persistent vector index (Chroma in this repo).

Integration notes

- The backend orchestrates retrieval and RAG composition; workers handle long-running processing.
