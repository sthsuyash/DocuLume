# Local Kubernetes Deployment Scripts

This directory contains scripts to deploy DocuLume to a local Kubernetes cluster using [kind](https://kind.sigs.k8s.io/) (Kubernetes in Docker).

## Prerequisites

All platforms require:
- **Docker**: Container runtime
- **kubectl**: Kubernetes CLI
- **kind**: Local Kubernetes cluster

### Installation

**macOS (Homebrew):**
```bash
brew install docker kubectl kind
```

**Linux:**
```bash
# Docker
curl -fsSL https://get.docker.com | sh

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

**Windows (PowerShell as Admin):**
```powershell
# Using Chocolatey
choco install docker-desktop kubectl kind

# Or using winget
winget install Docker.DockerDesktop
winget install Kubernetes.kubectl
# Download kind.exe from https://github.com/kubernetes-sigs/kind/releases
```

---

## Usage

### Linux/macOS

```bash
# Make script executable
chmod +x scripts/deploy-local.sh

# Run with defaults
./scripts/deploy-local.sh

# With custom parameters
CLUSTER_NAME=my-cluster \
OPENAI_API_KEY=sk-... \
SKIP_BUILD=false \
./scripts/deploy-local.sh

# Skip Docker build (faster for subsequent runs)
SKIP_BUILD=true ./scripts/deploy-local.sh

# Skip cluster creation (if cluster already exists)
SKIP_CLUSTER_CREATE=true ./scripts/deploy-local.sh
```

### Windows (PowerShell)

```powershell
# Run with defaults
.\scripts\deploy-local.ps1

# With custom parameters
.\scripts\deploy-local.ps1 `
    -ClusterName "my-cluster" `
    -OpenAIApiKey "sk-..." `
    -SkipBuild

# Skip Docker build (faster for subsequent runs)
.\scripts\deploy-local.ps1 -SkipBuild

# Skip cluster creation (if cluster already exists)
.\scripts\deploy-local.ps1 -SkipClusterCreate
```

---

## Configuration Parameters

### Bash Script (Linux/macOS) - Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLUSTER_NAME` | `doculume` | Name of the kind cluster |
| `NAMESPACE` | `doculume` | Kubernetes namespace |
| `BACKEND_IMAGE` | `doculume-backend:local` | Backend Docker image tag |
| `FRONTEND_IMAGE` | `doculume-frontend:local` | Frontend Docker image tag |
| `JWT_SECRET` | `dev-jwt-secret-change-me` | JWT signing secret |
| `POSTGRES_PASSWORD` | `ragpass` | PostgreSQL password |
| `OPENAI_API_KEY` | *(prompt)* | OpenAI API key |
| `SKIP_BUILD` | `false` | Skip Docker image builds |
| `SKIP_CLUSTER_CREATE` | `false` | Skip kind cluster creation |

### PowerShell Script (Windows) - Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-ClusterName` | `doculume` | Name of the kind cluster |
| `-Namespace` | `doculume` | Kubernetes namespace |
| `-BackendImage` | `doculume-backend:local` | Backend Docker image tag |
| `-FrontendImage` | `doculume-frontend:local` | Frontend Docker image tag |
| `-JwtSecret` | `dev-jwt-secret-change-me` | JWT signing secret |
| `-PostgresPassword` | `ragpass` | PostgreSQL password |
| `-OpenAIApiKey` | *(prompt)* | OpenAI API key |
| `-SkipBuild` | *(switch)* | Skip Docker image builds |
| `-SkipClusterCreate` | *(switch)* | Skip kind cluster creation |

---

## What the Scripts Do

1. **Check Prerequisites**: Verify Docker, kubectl, and kind are installed
2. **Create kind Cluster**: Create local Kubernetes cluster (if not exists)
3. **Build Docker Images**: Build backend and frontend images
4. **Load Images**: Load images into kind cluster (bypasses registry)
5. **Apply Infrastructure**: Deploy PostgreSQL and Redis
6. **Create Secrets**: Set up credentials and API keys
7. **Modify Manifests**: Adjust deployments for local use:
   - Change image names to local tags
   - Set `imagePullPolicy: IfNotPresent`
   - Reduce replicas to 1
   - Change PVC access mode to `ReadWriteOnce`
   - Update API URLs for localhost
8. **Deploy Applications**: Apply backend and frontend deployments
9. **Wait for Ready**: Wait for all workloads to become healthy
10. **Print Instructions**: Show port-forward commands

---

## Accessing the Application

After the script completes, open **two separate terminals** and run:

### Terminal 1 - Backend
```bash
kubectl -n doculume port-forward svc/backend 8000:8000
```

### Terminal 2 - Frontend
```bash
kubectl -n doculume port-forward svc/frontend 3000:3000
```

Then open in your browser:
- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **Admin Panel**: http://localhost:3001 *(if deployed)*

---

## Troubleshooting

### "kind: command not found"
Install kind using the instructions in the Prerequisites section.

### "Cluster creation failed"
- Ensure Docker is running
- Try deleting the existing cluster: `kind delete cluster --name doculume`

### "Image build failed"
- Check Docker daemon is running
- Verify you're in the project root directory
- Check Dockerfiles exist in `backend/` and `frontend/`

### "Pod not ready" timeouts
- Check pod logs: `kubectl -n doculume logs <pod-name>`
- Check pod status: `kubectl -n doculume get pods`
- Increase timeout or check resource availability

### Port-forward connection refused
- Verify pod is running: `kubectl -n doculume get pods`
- Check service exists: `kubectl -n doculume get svc`
- Try restarting port-forward

### Database connection errors
- Check PostgreSQL pod: `kubectl -n doculume logs statefulset/postgres`
- Verify secrets: `kubectl -n doculume get secrets`

---

## Cleanup

### Delete the entire cluster
```bash
kind delete cluster --name doculume
```

### Delete just the application (keep cluster)
```bash
kubectl delete namespace doculume
```

### Remove Docker images
```bash
docker rmi doculume-backend:local doculume-frontend:local
```

---

## Development Workflow

### Initial Setup
```bash
# Run full setup
./scripts/deploy-local.sh  # Linux/macOS
.\scripts\deploy-local.ps1  # Windows
```

### Code Changes - Fast Iteration

**Backend changes:**
```bash
# Rebuild only backend
docker build -t doculume-backend:local backend/
kind load docker-image doculume-backend:local --name doculume

# Restart deployment
kubectl -n doculume rollout restart deployment/backend
kubectl -n doculume rollout status deployment/backend
```

**Frontend changes:**
```bash
# Rebuild only frontend
docker build -t doculume-frontend:local frontend/
kind load docker-image doculume-frontend:local --name doculume

# Restart deployment
kubectl -n doculume rollout restart deployment/frontend
kubectl -n doculume rollout status deployment/frontend
```

**Skip build on re-runs:**
```bash
# Linux/macOS
SKIP_BUILD=true SKIP_CLUSTER_CREATE=true ./scripts/deploy-local.sh

# Windows
.\scripts\deploy-local.ps1 -SkipBuild -SkipClusterCreate
```

---

## Differences from Production

The scripts modify the production manifests for local development:

| Setting | Production | Local |
|---------|-----------|-------|
| Image pull policy | `Always` | `IfNotPresent` |
| Backend replicas | `3` | `1` |
| Frontend replicas | `2` | `1` |
| PVC access mode | `ReadWriteMany` | `ReadWriteOnce` |
| Min HPA replicas | `2-3` | `1` |
| API URL | `https://doculume.example.com` | `http://localhost:8000` |

---

## Security Notes

⚠️ **These scripts are for LOCAL DEVELOPMENT ONLY**

- Uses weak default passwords
- No TLS/HTTPS
- No network policies
- Minimal resource limits
- Single replicas (no HA)

**Never use these scripts or configurations in production!**

For production deployment, see:
- `k8s/` - Production manifests
- `DEPLOYMENT_READY.md` - Production deployment guide

---

## Additional Resources

- [kind Documentation](https://kind.sigs.k8s.io/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Project README](../README.md)
