# DocuLume Backend

Backend service layer for DocuLume, implemented with FastAPI and asynchronous Python services for authentication, document processing, retrieval, and conversational inference.

## Scope

The backend provides:

- AuthN/AuthZ and session token workflows.
- Document ingestion, processing, and lifecycle management.
- Retrieval-Augmented Generation orchestration and provider abstraction.
- Background processing and queue-backed task execution.
- Health, readiness, and operational endpoints.

## Technology Profile

- Framework: FastAPI
- Language: Python 3.13+
- Persistence: PostgreSQL + SQLAlchemy (async)
- Cache and broker: Redis
- Vector store: ChromaDB
- Background processing: Celery
- Migrations: Alembic
- Test framework: pytest

## Runtime Requirements

- Python 3.13+
- Docker Desktop (for PostgreSQL and Redis in local development)
- uv (recommended package and environment manager)

## Local Development

For the canonical setup process, see [Backend Setup Guide](../docs/backend/SETUP.md).

```bash
# 1) Install dependencies
pip install uv
uv sync

# 2) Configure environment
cp .env.example .env

# 3) Start required infrastructure
docker compose up -d postgres redis

# 4) Apply migrations
uv run alembic upgrade head

# 5) Run backend API
uv run uvicorn main:app --reload
```

Default local endpoint: <http://localhost:8000>

## API Interfaces

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- OpenAPI JSON: <http://localhost:8000/openapi.json>

## Operational Commands

```bash
# Create migration
uv run alembic revision --autogenerate -m "description"

# Roll forward
uv run alembic upgrade head

# Roll back one revision
uv run alembic downgrade -1

# Run tests
uv run pytest -v

# Run tests with coverage
uv run pytest --cov=app
```

## Worker Execution

```bash
# Linux/macOS
celery -A app.workers.celery_app worker --loglevel=info

# Windows
celery -A app.workers.celery_app worker --pool=solo --loglevel=info
```

## Directory Layout

```text
backend/
├── app/                  # API, services, core logic, models, schemas
├── alembic/              # migration scripts
├── tests/                # backend test suites
├── main.py               # application entry
├── run.sh                # linux/mac startup helper
├── run.bat               # windows startup helper
└── pyproject.toml        # project and dependency configuration
```

## Related Documentation

- [Root README](../README.md)
- [Documentation Hub](../docs/README.md)
- [Backend Setup Guide](../docs/backend/SETUP.md)
- [Testing Guide](../docs/guides/TESTING.md)
- [Security Encryption Guide](../docs/security/ENCRYPTION.md)

## License

MIT License.
