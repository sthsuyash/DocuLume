# Setup Guide

Standard local setup procedure for DocuLume.

## Prerequisites

- Docker Desktop
- Python 3.13+
- Node.js 18+
- pnpm
- One LLM provider API key (OpenAI, Anthropic, or Google)

## Environment Configuration

From repository root:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Update required values in `backend/.env` before first run.

## Recommended Local Development Mode

Run infrastructure in Docker and run application services on host.

```bash
# 1) Start infrastructure
docker compose up -d

# 2) Start backend
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload

# 3) Start frontend (new terminal)
cd ../frontend
pnpm install
pnpm run dev
```

## Full Container Mode

```bash
docker compose -f docker/compose/docker-compose.fullstack.yml up --build
```

## Compose Topology

- `docker-compose.yml`: core infrastructure with optional profiles
- `docker/compose/docker-compose.fullstack.yml`: backend, frontend, and infrastructure
- `docker/compose/docker-compose.monitoring.yml`: monitoring stack
- `docker/compose/docker-compose.tracing.yml`: tracing stack

## Verification

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- API docs: <http://localhost:8000/docs>

## Troubleshooting

- Service status: `docker compose ps`
- Aggregate logs: `docker compose logs -f`
- Restart PostgreSQL: `docker compose restart postgres`
- Reset local infra data: `docker compose down -v && docker compose up -d`
