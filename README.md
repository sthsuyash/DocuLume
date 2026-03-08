# DocuLume

DocuLume is an enterprise-oriented Retrieval-Augmented Generation (RAG) platform for document intelligence. It provides authenticated document ingestion, semantic retrieval, and conversational Q&A over private content using a FastAPI backend and Next.js frontend.

[![Backend CI](https://github.com/sthsuyash/doculume/workflows/Backend%20CI/badge.svg)](https://github.com/sthsuyash/doculume/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Executive Summary

- Purpose: secure, production-ready document Q&A for internal and customer-facing workflows.
- Architecture: API-first backend with async processing, persistent storage, and vector retrieval.
- Deployment model: local development, full Docker deployment, and cloud-hosted production patterns.
- Security posture: token-based auth, CSRF protections, secure cookies, rate limiting, and encrypted API key storage.

## Core Capabilities

### Application Capabilities

- Multi-format ingestion: PDF, TXT, DOCX, and Markdown.
- Conversational Q&A with source-grounded retrieval.
- Persistent conversations and document lifecycle management.
- Multi-provider LLM support (OpenAI, Anthropic, Google).

### Platform Capabilities

- Asynchronous processing with Celery workers.
- PostgreSQL for transactional data and Redis for cache/broker roles.
- ChromaDB vector store for semantic retrieval.
- Docker Compose orchestration for local and production-like environments.
- Health endpoints, metrics support, and observability integrations.

## Architecture

### High-Level Components

- Frontend: Next.js 14 + TypeScript UI for authentication, document workflows, and chat interactions.
- Backend: FastAPI services for auth, document processing, chat orchestration, and health operations.
- Data services: PostgreSQL (system-of-record), Redis (cache and queue), ChromaDB (vector index).
- Operations: optional monitoring and tracing stacks through Compose profiles or dedicated compose files.

## Quick Start

### Prerequisites

- Docker Desktop
- Python 3.13+
- Node.js 18+
- pnpm
- OpenAI API key (or other configured provider key)

### Recommended Local Development Mode

Run the application on host, with infrastructure in Docker.

```bash
# 1) Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2) Start infrastructure services
docker compose up -d

# 3) Start backend
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload

# 4) Start frontend (new terminal)
cd ../frontend
pnpm install
pnpm run dev
```

### Service Endpoints

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- OpenAPI/Swagger: <http://localhost:8000/docs>

## Docker Compose Topology

### Compose Files

- `docker-compose.yml`: core infrastructure with optional observability profiles.
- `docker/compose/docker-compose.fullstack.yml`: backend + frontend + infrastructure.
- `docker/compose/docker-compose.monitoring.yml`: Prometheus, Grafana, and exporters.
- `docker/compose/docker-compose.tracing.yml`: Jaeger tracing stack.

### Common Commands

```bash
# Infrastructure only
docker compose up -d

# Full stack in containers
docker compose -f docker/compose/docker-compose.fullstack.yml up --build

# Monitoring stack
docker compose -f docker/compose/docker-compose.monitoring.yml up -d

# Tracing stack
docker compose -f docker/compose/docker-compose.tracing.yml up -d
```

## Security and Compliance Controls

- Authentication and session controls:
  - JWT access/refresh model with rotation.
  - httpOnly cookies and CSRF token validation.
  - Rate limiting and hardened CORS/security-header defaults.
- Data protection controls:
  - API key encryption at rest via field-level encryption.
  - Input validation and ORM-based query safety patterns.

Reference: [Security Encryption Guide](./docs/security/ENCRYPTION.md).

## Operations

### Health and Readiness

- `GET /api/v1/health/detailed`
- `GET /api/v1/health/ready`
- `GET /api/v1/health/live`

### Testing

```bash
# Backend tests
cd backend
uv run pytest -v --cov=app

# Frontend tests
cd ../frontend
pnpm test
```

## Deployment

For deployment patterns, scaling, cloud targets, and production checklists, see [Deployment Guide](./docs/guides/DEPLOYMENT.md).

## Documentation Index

- [Documentation Hub](./docs/README.md)
- [Setup Guide](./docs/guides/SETUP.md)
- [Backend Setup](./docs/backend/SETUP.md)
- [Deployment Guide](./docs/guides/DEPLOYMENT.md)
- [Monitoring Guide](./docs/guides/MONITORING.md)
- [Tracing Guide](./docs/guides/TRACING.md)
- [Testing Guide](./docs/guides/TESTING.md)
- [Contributing Guide](./docs/guides/CONTRIBUTING.md)
- [Documentation Governance](./docs/DOCUMENTATION_GOVERNANCE.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Landing README](./landing/README.md)
- [Kubernetes README](./k8s/README.md)

## Contribution

See [Contributing Guide](./docs/guides/CONTRIBUTING.md) for branching, testing, and pull request standards.

## License

Licensed under the MIT License. See [LICENSE](LICENSE).
