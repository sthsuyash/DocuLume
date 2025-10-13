# Deployment Guide

Production deployment reference for DocuLume.

## Deployment Models

- Single-server container deployment using Docker Compose.
- Kubernetes-based deployment using manifests in `k8s/`.
- Split hosting model with frontend platform deployment and backend API deployment.

## Prerequisites

- Docker Engine and Docker Compose v2
- Domain and TLS certificate (nginx SSL termination included)
- Managed or self-hosted PostgreSQL and Redis for production scale (recommended)
- Secret management solution

## Environment Baseline

Copy the production template and fill in all values:

```bash
cp backend/.env.production.example backend/.env
```

### Required variables (`backend/.env`)

```bash
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
POSTGRES_USER=raguser
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=ragdb

# Redis
REDIS_URL=redis://redis:6379/0
REDIS_PASSWORD=<strong-password>

# Auth
JWT_SECRET_KEY=<64-char-random-hex>
ENCRYPTION_KEY=<fernet-key>

# CORS
CORS_ORIGINS=https://app.your-domain.com,https://admin.your-domain.com

# LLM provider (at least one required)
OPENAI_API_KEY=...

# Monitoring
GRAFANA_ADMIN_PASSWORD=<strong-password>
SENTRY_DSN=https://...@sentry.io/...   # optional but recommended
```

### Frontend (`frontend/.env.local`, `admin-frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
```

## Docker Compose Deployment

### Infrastructure only (dev/staging)

```bash
docker compose up -d
```

### Full stack in containers

```bash
docker compose -f docker/compose/docker-compose.fullstack.yml up -d --build
```

### With nginx TLS reverse proxy

```bash
# Set the path to your TLS certificate directory
export NGINX_CERT_PATH=/etc/letsencrypt/live/your-domain.com

docker compose --profile proxy up -d
```

Update `docker/nginx/nginx.conf` to replace `your-domain.com` with your actual domain before running.

### With automated database backups

```bash
docker compose --profile backup up -d
```

Backups are written to the `db_backups` Docker volume daily at 02:00 UTC and retained for 7 days (configurable via `RETAIN_DAYS`). See [Database Recovery runbook](../runbooks/database-recovery.md).

### With monitoring stack

```bash
docker compose --profile monitoring up -d
```

### Scale backend containers

```bash
docker compose -f docker/compose/docker-compose.fullstack.yml up -d --scale backend=3
```

## Post-Deployment Validation

```bash
# Health checks
curl https://api.your-domain.com/api/v1/health/ready
curl https://api.your-domain.com/api/v1/health/detailed

# Verify sign-in flow and document upload
```

## Security and Hardening

- Copy `backend/.env.production.example` — never commit `.env` files.
- Use strong random values for all secrets (`openssl rand -hex 32`).
- Enforce HTTPS via nginx; HTTP redirects to HTTPS automatically.
- CORS restricted to known origins via `CORS_ORIGINS`.
- Request size limits, CSP headers, and rate limiting are applied by default.
- Audit log emitted to stdout as structured JSON — ship to your log aggregator.

## Backup and Recovery

### Automated backups (recommended)

Use the `backup` Compose profile (see above). The `scripts/backup-db.sh` script handles pg_dump, compression, and retention.

### Manual backup

```bash
docker compose exec postgres pg_dump -U ${POSTGRES_USER:-raguser} ${POSTGRES_DB:-ragdb} | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore

See [Database Recovery runbook](../runbooks/database-recovery.md).

### Vector data backup

```bash
tar -czf chroma_backup.tar.gz backend/chroma_data/
```

## Rollback Strategy

- Keep immutable image tags per release.
- Roll back to prior image tag and restart the service.
- Use Alembic downgrade only when migration rollback is validated.

See [Deploy Rollback runbook](../runbooks/deploy-rollback.md).

## Release Checklist

- [ ] All required environment variables set and validated
- [ ] `GRAFANA_ADMIN_PASSWORD` set (build fails if unset)
- [ ] CORS origins restricted to production domains
- [ ] Health checks passing post-deploy
- [ ] Monitoring and alerting active
- [ ] Backup profile running and first backup verified
- [ ] Rollback image tag recorded
