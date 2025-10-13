# Admin Monitoring Guide

Operational monitoring tasks and validation for administrators.

## Starting the Monitoring Stack

```bash
docker compose --profile monitoring up -d
```

`GRAFANA_ADMIN_PASSWORD` must be set in `.env` before starting.

Access Grafana at <http://localhost:3002> (or your configured domain).

For full monitoring documentation see [Monitoring Guide](../guides/MONITORING.md).

## Active Alert Rules

The following Prometheus alerts are pre-configured in `backend/prometheus-alerts.yml`:

| Alert | Meaning | Runbook |
|-------|---------|---------|
| `BackendDown` | API is unreachable | [Service Down](../runbooks/service-down.md) |
| `HighErrorRate` | >5% 5xx rate | [High Error Rate](../runbooks/high-error-rate.md) |
| `SlowResponses` | P95 latency >2s | [High Error Rate](../runbooks/high-error-rate.md) |
| `PostgresDown` | Database unreachable | [Service Down](../runbooks/service-down.md) |
| `DBConnectionPoolNearFull` | Pool >80% used | [High Error Rate](../runbooks/high-error-rate.md) |
| `RedisDown` | Redis unreachable | [Service Down](../runbooks/service-down.md) |
| `RedisHighMemory` | Redis memory >80% | [Service Down](../runbooks/service-down.md) |
| `HighCPU` | CPU >85% for 10 min | [High Error Rate](../runbooks/high-error-rate.md) |
| `HighMemory` | Memory >85% for 10 min | [High Error Rate](../runbooks/high-error-rate.md) |
| `DiskSpaceLow` | Disk >85% full | [Database Recovery](../runbooks/database-recovery.md) |

## Runbooks

- [Service Down](../runbooks/service-down.md) — backend, postgres, or redis is down
- [High Error Rate](../runbooks/high-error-rate.md) — elevated 5xx responses
- [Database Recovery](../runbooks/database-recovery.md) — restore from backup
- [Deploy Rollback](../runbooks/deploy-rollback.md) — revert a bad deploy

## Validation Checklist

- [ ] Prometheus targets page (`/targets`) shows all exporters as UP
- [ ] Grafana dashboards load and show current data
- [ ] At least one alert rule is in `PENDING` or `FIRING` state (confirms rules are loaded)
- [ ] Audit log events are flowing: `docker compose logs backend | grep '"logger":"audit"'`
- [ ] Backup volume is populated: `docker run --rm -v doculume_db_backups:/b alpine ls /b`
