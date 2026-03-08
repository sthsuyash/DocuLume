# Monitoring Guide

Operational monitoring and observability reference for DocuLume.

## Scope

This guide covers:

- Application metrics endpoints
- Logging and request correlation
- Prometheus and Grafana deployment
- Alerting baseline
- Operational troubleshooting

## Local Monitoring Setup

### Profile-Based Startup

```bash
docker compose up -d
docker compose --profile monitoring up -d
```

### Dedicated Monitoring Compose File

```bash
docker compose -f docker/compose/docker-compose.monitoring.yml up -d
```

## Access Endpoints

- App metrics: <http://localhost:8000/api/v1/metrics>
- Prometheus: <http://localhost:9090>
- Grafana: <http://localhost:3002>

## Metrics Endpoints

- `GET /api/v1/metrics`
- `GET /api/v1/metrics/system`
- `GET /api/v1/metrics/process`
- `GET /api/v1/metrics/database`

## Logging Standards

- Use structured logging with request IDs.
- Propagate correlation identifiers across service boundaries.
- Avoid logging sensitive values, tokens, or keys.

### Log Commands

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f --tail=200 backend
```

## Prometheus Baseline

Prometheus should scrape backend metrics and infrastructure exporters at fixed intervals (for example 15 seconds).

## Grafana Baseline

Recommended dashboards:

- Node exporter host metrics
- PostgreSQL metrics
- Redis metrics
- Request latency and error-rate panels

## Alerting Baseline

Implement alerts for:

- Elevated 5xx response rate
- High response latency (P95/P99)
- Sustained CPU or memory pressure
- Database connectivity degradation
- Queue processing backlog

## Health Verification

```bash
curl http://localhost:8000/api/v1/health/detailed
curl http://localhost:8000/api/v1/health/ready
curl http://localhost:8000/api/v1/health/live
```

## Troubleshooting

### High Memory Usage

```bash
curl http://localhost:8000/api/v1/metrics/process
docker stats
```

### Database Issues

```bash
curl http://localhost:8000/api/v1/metrics/database
docker compose logs postgres
```

### Redis Issues

```bash
docker compose logs redis
docker exec doculume-redis redis-cli PING
```
