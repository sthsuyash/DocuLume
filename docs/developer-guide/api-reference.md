# API reference

Purpose: quick summary of important API endpoints and usage patterns.

Common endpoints

- `GET /api/v1/health/detailed` — health checks and readiness data.
- `POST /api/v1/documents` — upload document metadata and file.
- `GET /api/v1/documents` — list documents.
- `POST /api/v1/chat` — start or continue a chat conversation (payload: messages, document_ids).

Authentication

- All API requests require a valid JWT or session cookie depending on deployment.

For full OpenAPI spec see the running backend at `/docs` (Swagger UI).
