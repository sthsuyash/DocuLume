# Backend Setup Guide

This guide covers backend-only setup for local development.

## Prerequisites

- Python 3.13+
- Docker Desktop
- uv (recommended)

## Setup

1. Go to the backend folder:

```bash
cd backend
```

1. Install dependencies:

```bash
pip install uv
uv sync
```

1. Configure environment:

```bash
cp .env.example .env
```

Set at minimum:

- `JWT_SECRET_KEY`
- one LLM provider key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_API_KEY`)

1. Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

1. Apply migrations:

```bash
uv run alembic upgrade head
```

1. Start backend:

```bash
uv run uvicorn main:app --reload
```

## Health Checks

- API root: <http://localhost:8000>
- Swagger: <http://localhost:8000/docs>
- Detailed health: <http://localhost:8000/api/v1/health/detailed>

## Common Operations

- Run tests: `uv run pytest -v`
- Run worker: `celery -A app.workers.celery_app worker --pool=solo --loglevel=info`
- Stop infra: `docker compose down`
