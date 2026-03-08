# Tracing Guide

Distributed tracing reference for DocuLume using OpenTelemetry and Jaeger.

## Scope

Tracing provides:

- End-to-end request visibility
- Service and dependency latency analysis
- Error correlation across application layers
- Performance bottleneck identification

## Local Tracing Setup

### Profile-Based Startup

```bash
docker compose --profile tracing up -d
```

### Dedicated Tracing Compose File

```bash
docker compose -f docker/compose/docker-compose.tracing.yml up -d
```

Jaeger UI: <http://localhost:16686>

## Backend Configuration

Set tracing environment variables in `backend/.env`:

```bash
OTEL_ENABLED=true
OTEL_EXPORTER_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=doculume-backend
```

Restart the backend process after changes.

## Instrumentation Guidance

### Automatic Instrumentation

- FastAPI request lifecycle
- SQLAlchemy database operations
- Redis operations

### Manual Instrumentation

Add spans to critical paths such as:

- document upload pipeline
- chunking and embedding operations
- vector retrieval and reranking
- LLM response generation

## Naming and Attribute Standards

- Use hierarchical span names (`chat.query.retrieve_context`).
- Prefer stable IDs over high-cardinality values.
- Avoid sensitive data in span attributes.

## Sampling Guidance

Use probabilistic sampling in production to control trace volume and overhead.

## Operational Checks

- Verify exporter endpoint reachability.
- Verify spans for authentication, upload, and chat flows.
- Validate parent/child relationship continuity in Jaeger.

## Troubleshooting

### Traces Not Visible

```bash
docker compose logs -f backend
docker compose logs -f jaeger
```

Validate `OTEL_ENABLED` and exporter endpoint values.

### High Cardinality

- Remove attributes like email, full URL query values, or free-form user text.
- Keep attributes bounded and categorical where possible.
