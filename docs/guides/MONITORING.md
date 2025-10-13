# Monitoring Guide

Operational monitoring and observability reference for DocuLume.

## Scope

- Application metrics and health endpoints
- Prometheus scraping and alert rules
- Grafana dashboards
- Sentry error tracking
- Structured audit logging
- Runbooks for common alerts

## Setup

### Start the monitoring stack

```bash
# Profile-based (alongside core services)
docker compose --profile monitoring up -d

# Or dedicated compose file
docker compose -f docker/compose/docker-compose.monitoring.yml up -d
```

`GRAFANA_ADMIN_PASSWORD` must be set in `.env` — startup fails if it is missing.

### Access endpoints

| Service     | URL                         |
|-------------|-----------------------------|
| Backend metrics | <http://localhost:8000/api/v1/metrics> |
| Prometheus  | <http://localhost:9090>      |
| Grafana     | <http://localhost:3002>      |

## Health Endpoints

```bash
# Full dependency status (DB, Redis, Celery)
curl http://localhost:8000/api/v1/health/detailed

# Readiness probe (returns 200 or 503)
curl http://localhost:8000/api/v1/health/ready

# Liveness probe
curl http://localhost:8000/api/v1/health/live
```

## Metrics Endpoints

- `GET /api/v1/metrics` — Prometheus-format application metrics
- `GET /api/v1/metrics/system` — CPU, memory, disk
- `GET /api/v1/metrics/process` — process-level stats
- `GET /api/v1/metrics/database` — pool size, active connections

## Alert Rules

Alert rules are defined in `backend/prometheus-alerts.yml` and loaded automatically by Prometheus.

| Alert | Condition | Runbook |
|-------|-----------|---------|
| `BackendDown` | Backend unreachable for 1 min | [service-down.md](../runbooks/service-down.md) |
| `HighErrorRate` | >5% 5xx rate over 5 min | [high-error-rate.md](../runbooks/high-error-rate.md) |
| `SlowResponses` | P95 latency >2s over 10 min | [high-error-rate.md](../runbooks/high-error-rate.md) |
| `PostgresDown` | postgres-exporter unreachable for 1 min | [service-down.md](../runbooks/service-down.md) |
| `DBConnectionPoolNearFull` | Pool utilisation >80% | [high-error-rate.md](../runbooks/high-error-rate.md) |
| `RedisDown` | redis-exporter unreachable for 1 min | [service-down.md](../runbooks/service-down.md) |
| `RedisHighMemory` | Redis memory >80% of `maxmemory` | [service-down.md](../runbooks/service-down.md) |
| `HighCPU` | CPU >85% for 10 min | [high-error-rate.md](../runbooks/high-error-rate.md) |
| `HighMemory` | Memory >85% for 10 min | [high-error-rate.md](../runbooks/high-error-rate.md) |
| `DiskSpaceLow` | Disk >85% full | [database-recovery.md](../runbooks/database-recovery.md) |

## Sentry Error Tracking

Set `SENTRY_DSN` in `.env` to enable Sentry. It integrates with FastAPI, SQLAlchemy, Redis, and Celery automatically. PII transmission is disabled (`send_default_pii=False`).

```bash
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
```

Sentry activates in any environment when the DSN is present — not limited to production.

## Structured Audit Logging

Security-relevant events are emitted to stdout as structured JSON under the `audit` logger. Events include:

- `login_success`, `login_failure`, `logout`, `register`, `oauth_login`
- `document_upload`, `document_delete`, `document_bulk_delete`
- `admin_role_change`, `admin_user_delete`, `admin_document_delete`

Each record contains `event`, `user_id`, `ip`, `timestamp`, and event-specific fields. Ship stdout to your log aggregator (e.g., Loki, CloudWatch, Datadog) to query and alert on these.

## Logging Standards

```bash
# Stream all logs
docker compose logs -f

# Backend only
docker compose logs -f --tail=200 backend

# Filter for errors
docker compose logs backend | grep '"level":"ERROR"'

# Filter audit events
docker compose logs backend | grep '"logger":"audit"'
```

## Recommended Grafana Dashboards

- Node Exporter Full (host metrics)
- PostgreSQL Database (postgres-exporter)
- Redis Exporter Quickstart (redis-exporter)
- Custom: request latency heatmap, error rate, Celery queue depth

## Troubleshooting

### High memory usage

```bash
curl http://localhost:8000/api/v1/metrics/process
docker stats
```

### Database issues

```bash
curl http://localhost:8000/api/v1/metrics/database
docker compose logs postgres
```

### Redis issues

```bash
docker compose logs redis
docker compose exec redis redis-cli PING
```
