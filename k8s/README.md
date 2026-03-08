# DocuLume Kubernetes Operations Guide

Kubernetes deployment manifests and operating procedures for running DocuLume in cluster environments.

## Deployment Scope

This directory contains manifests for:

- Namespace, configuration, and secret resources.
- Backend and frontend application workloads.
- PostgreSQL and Redis runtime dependencies.
- Ingress and policy-related resources.
- Monitoring and resiliency primitives.

## Prerequisites

- Kubernetes cluster (managed or self-hosted)
- `kubectl` configured for target cluster
- Ingress controller installed
- cert-manager installed (for TLS automation)
- Storage class available for persistent volumes

## Standard Deployment Procedure

```bash
# 1) Namespace
kubectl apply -f k8s/namespace.yaml

# 2) Secrets (update values first)
kubectl apply -f k8s/secrets.yaml

# 3) Configuration
kubectl apply -f k8s/configmap.yaml

# 4) Data services
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml

# 5) Wait for readiness
kubectl wait --for=condition=ready pod -l app=postgres -n doculume --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n doculume --timeout=300s

# 6) Application workloads
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# 7) Ingress
kubectl apply -f k8s/ingress.yaml
```

## Local Kubernetes Automation

Use the repository automation scripts for local `kind` environments:

**Linux/macOS:**
```bash
./scripts/deploy-local.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\deploy-local.ps1
```

Optional configuration:

**Linux/macOS:**
```bash
CLUSTER_NAME=doculume OPENAI_API_KEY="sk-..." ./scripts/deploy-local.sh
SKIP_BUILD=true ./scripts/deploy-local.sh
```

**Windows:**
```powershell
.\scripts\deploy-local.ps1 -ClusterName doculume -OpenAIApiKey "sk-..." -JwtSecret "dev-secret"
.\scripts\deploy-local.ps1 -SkipBuild
```

See [scripts/README.md](../scripts/README.md) for detailed documentation.

## Configuration Requirements

### Secrets

Before deployment, update `k8s/secrets.yaml` with environment-specific values, including:

- `OPENAI_API_KEY`
- JWT and auth secrets
- database credentials
- OAuth credentials (if enabled)

### Domain and Networking

Validate domain and origin settings in:

- `k8s/ingress.yaml`
- `k8s/configmap.yaml`
- `k8s/frontend-deployment.yaml`

### Storage Planning

Default requests in current manifests:

- PostgreSQL: 10Gi
- Redis: 5Gi
- Backend storage: 20Gi
- ChromaDB storage: 50Gi

Adjust for workload profile and retention policy.

## Operations

### Health and Logs

```bash
kubectl get pods -n doculume
kubectl logs -f deployment/backend -n doculume
kubectl logs -f deployment/frontend -n doculume
```

### Migrations

Backend startup includes migration execution. Manual execution:

```bash
kubectl exec -it deployment/backend -n doculume -- uv run alembic upgrade head
```

### Backup and Restore

```bash
# Backup
kubectl exec -it postgres-0 -n doculume -- pg_dump -U raguser ragdb > backup.sql

# Restore
kubectl exec -i postgres-0 -n doculume -- psql -U raguser ragdb < backup.sql
```

### Secret Rotation

```bash
kubectl create secret generic doculume-secrets \
  --from-literal=JWT_SECRET_KEY=new-secret \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment/backend -n doculume
kubectl rollout restart deployment/frontend -n doculume
```

## Troubleshooting

### Backend Fails to Start

```bash
kubectl logs deployment/backend -n doculume
kubectl exec -it postgres-0 -n doculume -- pg_isready
kubectl logs deployment/backend -c run-migrations -n doculume
```

### Service Connectivity Issues

```bash
kubectl exec -it deployment/backend -n doculume -- nc -zv postgres 5432
kubectl get secret doculume-secrets -n doculume -o yaml
```

### Ingress Issues

```bash
kubectl describe ingress doculume-ingress -n doculume
kubectl get certificate -n doculume
kubectl get pods -n ingress-nginx
```

## Production Readiness Checklist

- Secrets updated and rotated policy defined.
- Default credentials removed.
- TLS certificates active and validated.
- Resource limits and requests tuned.
- Backup and restore procedures tested.
- Monitoring and alerting enabled.
- Autoscaling thresholds validated.
- Disaster recovery procedure documented.

## Cleanup

```bash
kubectl delete namespace doculume
```

## Related Documentation

- [Root README](../README.md)
- [Documentation Hub](../docs/README.md)
- [Deployment Guide](../docs/guides/DEPLOYMENT.md)
- [Monitoring Guide](../docs/guides/MONITORING.md)
- [Tracing Guide](../docs/guides/TRACING.md)

## License

MIT License.
