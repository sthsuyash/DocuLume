param(
    [string]$ClusterName = "doculume",
    [string]$Namespace = "doculume",
    [string]$BackendImage = "doculume-backend:local",
    [string]$FrontendImage = "doculume-frontend:local",
    [string]$OpenAIApiKey,
    [string]$JwtSecret = "dev-jwt-secret-change-me",
    [string]$PostgresPassword = "ragpass",
    [switch]$SkipBuild,
    [switch]$SkipClusterCreate
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Name"
    }
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

Require-Command "docker"
Require-Command "kubectl"
Require-Command "kind"

$root = Split-Path -Parent $PSScriptRoot
$k8sPath = Join-Path $root "k8s"
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"

if (-not $SkipClusterCreate) {
    Write-Step "Ensuring kind cluster '$ClusterName' exists"
    $clusters = kind get clusters
    if ($clusters -notcontains $ClusterName) {
        kind create cluster --name $ClusterName
    }
}

Write-Step "Switching kubectl context to kind-$ClusterName"
kubectl config use-context "kind-$ClusterName" | Out-Null

if (-not $SkipBuild) {
    Write-Step "Building local images"
    docker build -t $BackendImage $backendPath
    docker build -t $FrontendImage $frontendPath
}

Write-Step "Loading images into kind cluster"
kind load docker-image $BackendImage --name $ClusterName
kind load docker-image $FrontendImage --name $ClusterName

Write-Step "Applying namespace and base infra manifests"
kubectl apply -f (Join-Path $k8sPath "namespace.yaml")
kubectl apply -f (Join-Path $k8sPath "configmap.yaml")
kubectl apply -f (Join-Path $k8sPath "postgres-statefulset.yaml")
kubectl apply -f (Join-Path $k8sPath "redis-deployment.yaml")

if (-not $OpenAIApiKey) {
    $OpenAIApiKey = Read-Host "Enter OPENAI_API_KEY (leave empty if not needed right now)"
}

Write-Step "Creating/updating Kubernetes secrets from local values"
$docolumeSecretArgs = @(
    "create", "secret", "generic", "doculume-secrets",
    "--namespace", $Namespace,
    "--from-literal=POSTGRES_USER=raguser",
    "--from-literal=POSTGRES_PASSWORD=$PostgresPassword",
    "--from-literal=POSTGRES_DB=ragdb",
    "--from-literal=REDIS_PASSWORD=",
    "--from-literal=JWT_SECRET_KEY=$JwtSecret",
    "--from-literal=JWT_ALGORITHM=HS256",
    "--from-literal=OPENAI_API_KEY=$OpenAIApiKey",
    "--from-literal=ANTHROPIC_API_KEY=",
    "--from-literal=GOOGLE_API_KEY=",
    "--from-literal=GOOGLE_CLIENT_ID=",
    "--from-literal=GOOGLE_CLIENT_SECRET=",
    "--from-literal=GITHUB_CLIENT_ID=",
    "--from-literal=GITHUB_CLIENT_SECRET=",
    "--from-literal=OAUTH_REDIRECT_URL=http://localhost:3000/auth/callback",
    "--dry-run=client", "-o", "yaml"
)

$docolumeSecretYaml = & kubectl @docolumeSecretArgs

$docolumeSecretYaml | kubectl apply -f -

$postgresCredsArgs = @(
    "create", "secret", "generic", "postgres-credentials",
    "--namespace", $Namespace,
    "--from-literal=username=raguser",
    "--from-literal=password=$PostgresPassword",
    "--from-literal=database=ragdb",
    "--dry-run=client", "-o", "yaml"
)

$postgresCredsYaml = & kubectl @postgresCredsArgs

$postgresCredsYaml | kubectl apply -f -

Write-Step "Generating local-safe deployment manifests (images, pull policy, PVC modes, replicas)"
$backendTemplate = Get-Content (Join-Path $k8sPath "backend-deployment.yaml") -Raw
$frontendTemplate = Get-Content (Join-Path $k8sPath "frontend-deployment.yaml") -Raw

$backendLocal = $backendTemplate
$backendLocal = $backendLocal.Replace("ghcr.io/yourusername/doculume-backend:latest", $BackendImage)
$backendLocal = $backendLocal -replace "imagePullPolicy: Always", "imagePullPolicy: IfNotPresent"
$backendLocal = $backendLocal -replace "replicas: 3", "replicas: 1"
$backendLocal = $backendLocal -replace "ReadWriteMany", "ReadWriteOnce"
$backendLocal = $backendLocal -replace "minReplicas: 3", "minReplicas: 1"

$frontendLocal = $frontendTemplate
$frontendLocal = $frontendLocal.Replace("ghcr.io/yourusername/doculume-frontend:latest", $FrontendImage)
$frontendLocal = $frontendLocal -replace "imagePullPolicy: Always", "imagePullPolicy: IfNotPresent"
$frontendLocal = $frontendLocal -replace "replicas: 2", "replicas: 1"
$frontendLocal = $frontendLocal -replace 'value: "https://doculume\.example\.com/api/v1"', 'value: "http://localhost:8000/api/v1"'
$frontendLocal = $frontendLocal -replace "minReplicas: 2", "minReplicas: 1"

$tempDir = Join-Path $env:TEMP "doculume-k8s-local"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
$backendLocalPath = Join-Path $tempDir "backend-deployment.local.yaml"
$frontendLocalPath = Join-Path $tempDir "frontend-deployment.local.yaml"

Set-Content -Path $backendLocalPath -Value $backendLocal -NoNewline
Set-Content -Path $frontendLocalPath -Value $frontendLocal -NoNewline

Write-Step "Applying app manifests"
kubectl apply -f $backendLocalPath
kubectl apply -f $frontendLocalPath

Write-Step "Waiting for workloads to become ready"
kubectl -n $Namespace rollout status statefulset/postgres --timeout=300s
kubectl -n $Namespace rollout status deployment/redis --timeout=300s
kubectl -n $Namespace rollout status deployment/backend --timeout=300s
kubectl -n $Namespace rollout status deployment/frontend --timeout=300s

Write-Host "`nLocal Kubernetes setup complete." -ForegroundColor Green
Write-Host "Run these in separate terminals:" -ForegroundColor Yellow
Write-Host "kubectl -n $Namespace port-forward svc/backend 8000:8000"
Write-Host "kubectl -n $Namespace port-forward svc/frontend 3000:3000"
Write-Host "Then open: http://localhost:3000 and http://localhost:8000/docs"
