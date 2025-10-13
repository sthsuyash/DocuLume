# Runbook: Deploy Rollback

## When to roll back

- Error rate spikes immediately after a deploy
- A critical feature is broken and cannot be hot-fixed in under 30 minutes
- Data integrity issues introduced by a migration

## Rollback procedure

### 1. Identify the last good image tag

```bash
# Check recent git tags or commit hashes used as image tags
git log --oneline -10
```

### 2. Roll back the backend container

```bash
# Set the previous image tag
export PREVIOUS_TAG=<git-sha-or-tag>

# Pull and restart with the previous image
docker compose pull backend   # if using a registry
docker compose up -d --no-deps backend
```

If using a registry (ECR, Docker Hub, GHCR):

```bash
docker pull ghcr.io/your-org/doculume-backend:$PREVIOUS_TAG
docker tag ghcr.io/your-org/doculume-backend:$PREVIOUS_TAG doculume-backend:latest
docker compose up -d --no-deps backend
```

### 3. Roll back a database migration (if needed)

```bash
# Check current revision
docker compose run --rm backend alembic current

# Step down one revision
docker compose run --rm backend alembic downgrade -1

# Or downgrade to a specific revision
docker compose run --rm backend alembic downgrade <revision-id>
```

**Warning:** Downgrading migrations that dropped columns or tables may cause data loss. Always take a backup before downgrading.

### 4. Verify rollback

```bash
curl https://api.your-domain.com/api/v1/health/ready
curl https://api.your-domain.com/api/v1/
```

Check the Grafana error rate dashboard — it should return to baseline within 2–3 minutes.

### 5. Post-rollback

1. Open an incident ticket describing what broke and what was rolled back
2. Do not re-deploy the same version without a fix
3. Write a post-mortem if the outage lasted more than 15 minutes
