# Deployment Guide

Production deployment reference for DocuLume.

## Deployment Models

- Single-server container deployment using Docker Compose.
- Kubernetes-based deployment using manifests in `k8s/`.
- Split hosting model with frontend platform deployment and backend API deployment.

## Prerequisites

- Docker Engine and Docker Compose v2
- Domain and TLS certificate strategy
- Managed or self-hosted PostgreSQL and Redis for production scale (recommended)
- Secret management solution

## Environment Baseline

### Backend (`backend/.env`)

```bash
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
OPENAI_API_KEY=...
JWT_SECRET_KEY=...
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
```

## Docker Compose Deployment

### Full Stack

```bash
docker compose -f docker/compose/docker-compose.fullstack.yml up -d --build
```

### Scale Backend Containers

```bash
docker compose -f docker/compose/docker-compose.fullstack.yml up -d --scale backend=3
```

### Operations

```bash
docker compose -f docker/compose/docker-compose.fullstack.yml logs -f
docker compose -f docker/compose/docker-compose.fullstack.yml ps
```

## Kubernetes Deployment

For cluster deployment procedures, use [Kubernetes README](../../k8s/README.md).

## Post-Deployment Validation

- Health: `GET /api/v1/health/detailed`
- Readiness: `GET /api/v1/health/ready`
- Liveness: `GET /api/v1/health/live`
- UI availability and sign-in flow verification
- Document upload and chat response validation

## Security and Hardening

- Store secrets outside source control.
- Enforce HTTPS and redirect HTTP to HTTPS.
- Restrict CORS to known origins.
- Rotate JWT and provider secrets periodically.
- Enable network controls and least privilege access.

## Backup and Recovery

### PostgreSQL Backup

```bash
docker exec doculume-postgres pg_dump -U raguser ragdb > backup.sql
```

### PostgreSQL Restore

```bash
docker exec -i doculume-postgres psql -U raguser ragdb < backup.sql
```

### Vector Data Backup

```bash
tar -czf chroma_backup.tar.gz backend/chroma_data/
```

## Rollback Strategy

- Keep immutable image tags per release.
- Roll back to prior image tag and re-run service startup.
- Use Alembic downgrade only when migration rollback is validated.

## Release Checklist

- Production environment variables validated
- Secrets injected and rotated policy documented
- Health checks passing
- Monitoring and alerting enabled
- Backup and restore test completed
- Rollback plan verified
