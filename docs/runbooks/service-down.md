# Runbook: Service Down

**Alert:** `BackendDown`, `PostgresDown`, or `RedisDown`

## Diagnosis

```bash
# Check which containers are running
docker compose ps

# Check logs for the failing service
docker compose logs --tail=100 backend
docker compose logs --tail=100 postgres
docker compose logs --tail=100 redis

# Check health endpoints
curl https://api.your-domain.com/api/v1/health/ready
curl https://api.your-domain.com/api/v1/health/detailed
```

## Backend down

1. Check logs for the startup error: `docker compose logs backend`
2. Common causes:
   - Missing env var → fix `.env`, restart: `docker compose restart backend`
   - DB not reachable → check `postgres` container first
   - Port conflict → check `docker compose ps`
3. Restart: `docker compose restart backend`
4. If still failing: `docker compose up -d --force-recreate backend`

## PostgreSQL down

1. `docker compose logs postgres`
2. Check disk space: `df -h` — if full, free space before restarting
3. Restart: `docker compose restart postgres`
4. If data corruption suspected, restore from backup (see [database-recovery.md](database-recovery.md))

## Redis down

1. `docker compose logs redis`
2. Restart: `docker compose restart redis`
3. Redis is a cache/queue — restarting loses in-flight Celery tasks. Documents queued for processing will need to be re-uploaded if they didn't complete.

## Escalation

If the service does not recover within 10 minutes after restart, page the on-call engineer and consider rolling back (see [deploy-rollback.md](deploy-rollback.md)).
