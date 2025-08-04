param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment,

    [Parameter(Mandatory=$true)]
    [string]$BackendImage,

    [Parameter(Mandatory=$true)]
    [string]$FrontendImage,

    [Parameter(Mandatory=$true)]
    [string]$Domain,

    [string]$Namespace = "doculume",
    [switch]$DryRun,
    [switch]$SkipValidation,
    [switch]$EnableMonitoring = $true,
    [switch]$EnableBackup = $true,
    [string]$Timeout = "600s"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Helper Functions
function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "WARNING: $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "ERROR: $Message" -ForegroundColor Red
}

function Write-Bold {
    param([string]$Message)
    Write-Host $Message -ForegroundColor White
}

function Test-Command {
    param([string]$Command)

    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Command"
    }
}

# Display Configuration
function Show-Configuration {
    Write-Bold "`n=== Deployment Configuration ==="
    Write-Host "Environment:       $Environment"
    Write-Host "Namespace:         $Namespace"
    Write-Host "Backend Image:     $BackendImage"
    Write-Host "Frontend Image:    $FrontendImage"
    Write-Host "Domain:            $Domain"
    Write-Host "Dry Run:           $DryRun"
    Write-Host "Skip Validation:   $SkipValidation"
    Write-Host "Enable Monitoring: $EnableMonitoring"
    Write-Host "Enable Backup:     $EnableBackup"
    Write-Host "Timeout:           $Timeout"
    Write-Bold "================================`n"
}

# Confirmation Prompt
function Confirm-Deployment {
    if ($DryRun) {
        Write-Warning "Running in DRY-RUN mode - no changes will be applied"
        return
    }

    Write-Warning "`nYou are about to deploy to $Environment environment."
    $response = Read-Host "Continue? (yes/no)"
    if ($response -ne "yes") {
        Write-Host "Deployment cancelled"
        exit 0
    }
}

# Validate cluster connectivity
function Test-ClusterConnectivity {
    Write-Step "Validating cluster connectivity"

    try {
        kubectl cluster-info | Out-Null
    } catch {
        throw "Cannot connect to Kubernetes cluster"
    }

    $context = kubectl config current-context
    Write-Success "Connected to cluster: $context"

    # Warn if deploying to production from local/dev context
    if ($context -match "(local|dev|kind)" -and $Environment -eq "production") {
        Write-Warning "Deploying to production from a local/dev cluster context: $context"
        $response = Read-Host "Are you sure? (yes/no)"
        if ($response -ne "yes") {
            exit 0
        }
    }
}

# Validate Docker images
function Test-DockerImages {
    Write-Step "Validating Docker images"

    foreach ($image in @($BackendImage, $FrontendImage)) {
        Write-Host "Checking image: $image"
        try {
            docker manifest inspect $image | Out-Null
            Write-Success "Image exists: $image"
        } catch {
            throw "Cannot pull image: $image"
        }
    }
}

# Validate secrets exist
function Test-Secrets {
    Write-Step "Validating Kubernetes secrets"

    $requiredSecrets = @("doculume-secrets", "postgres-credentials")

    foreach ($secret in $requiredSecrets) {
        try {
            kubectl get secret $secret -n $Namespace 2>&1 | Out-Null
            Write-Success "Secret exists: $secret"
        } catch {
            Write-Warning "Secret '$secret' not found in namespace '$Namespace'"
            Write-Host "Please create it manually before deploying:"
            Write-Host "kubectl create secret generic $secret -n $Namespace --from-literal=..."
            throw "Missing required secret: $secret"
        }
    }
}

# Validate manifests
function Test-Manifests {
    Write-Step "Validating Kubernetes manifests"

    $root = Split-Path -Parent $PSScriptRoot
    $manifestDir = Join-Path $root "k8s"

    if (-not (Test-Path $manifestDir)) {
        throw "Manifests directory not found: $manifestDir"
    }

    Get-ChildItem -Path $manifestDir -Filter "*.yaml" | ForEach-Object {
        Write-Host "Validating: $($_.Name)"
        kubectl apply --dry-run=client -f $_.FullName 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Invalid manifest: $($_.FullName)"
        }
    }

    Write-Success "All manifests are valid"
}

# Ensure namespace exists
function Ensure-Namespace {
    Write-Step "Ensuring namespace: $Namespace"

    try {
        kubectl get namespace $Namespace 2>&1 | Out-Null
        Write-Success "Namespace already exists"
    } catch {
        if ($DryRun) {
            Write-Host "[DRY-RUN] Would create namespace: $Namespace"
        } else {
            kubectl create namespace $Namespace
            kubectl label namespace $Namespace environment=$Environment
            Write-Success "Created namespace: $Namespace"
        }
    }
}

# Deploy infrastructure
function Deploy-Infrastructure {
    Write-Step "Deploying infrastructure services"

    $root = Split-Path -Parent $PSScriptRoot
    $manifestDir = Join-Path $root "k8s"

    $infraManifests = @(
        "configmap.yaml",
        "postgres-statefulset.yaml",
        "redis-deployment.yaml"
    )

    foreach ($manifest in $infraManifests) {
        $file = Join-Path $manifestDir $manifest
        if (Test-Path $file) {
            Write-Host "Applying: $manifest"
            if ($DryRun) {
                kubectl apply --dry-run=server -f $file
            } else {
                kubectl apply -f $file
            }
        } else {
            Write-Warning "Manifest not found: $file"
        }
    }
}

# Wait for infrastructure
function Wait-Infrastructure {
    Write-Step "Waiting for infrastructure to be ready"

    if ($DryRun) {
        Write-Host "[DRY-RUN] Would wait for infrastructure"
        return
    }

    # Wait for PostgreSQL
    Write-Host "Waiting for PostgreSQL..."
    kubectl wait --for=condition=ready pod -l app=postgres -n $Namespace --timeout=$Timeout
    if ($LASTEXITCODE -eq 0) {
        Write-Success "PostgreSQL ready"
    } else {
        throw "PostgreSQL failed to become ready"
    }

    # Wait for Redis
    Write-Host "Waiting for Redis..."
    kubectl wait --for=condition=ready pod -l app=redis -n $Namespace --timeout=$Timeout
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Redis ready"
    } else {
        throw "Redis failed to become ready"
    }
}

# Deploy application
function Deploy-Application {
    Write-Step "Deploying application services"

    $root = Split-Path -Parent $PSScriptRoot
    $manifestDir = Join-Path $root "k8s"

    # Create temp directory for modified manifests
    $tempDir = Join-Path $env:TEMP "doculume-deploy-prod"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    # Backend deployment
    $backendTemplate = Get-Content (Join-Path $manifestDir "backend-deployment.yaml") -Raw
    $backendModified = $backendTemplate -replace "image:.*backend.*", "image: $BackendImage"
    Set-Content -Path (Join-Path $tempDir "backend-deployment.yaml") -Value $backendModified -NoNewline

    # Frontend deployment
    $frontendTemplate = Get-Content (Join-Path $manifestDir "frontend-deployment.yaml") -Raw
    $frontendModified = $frontendTemplate -replace "image:.*frontend.*", "image: $FrontendImage"
    $frontendModified = $frontendModified -replace "doculume\.example\.com", $Domain
    Set-Content -Path (Join-Path $tempDir "frontend-deployment.yaml") -Value $frontendModified -NoNewline

    # Apply manifests
    foreach ($manifest in @("backend-deployment.yaml", "frontend-deployment.yaml")) {
        Write-Host "Applying: $manifest"
        $file = Join-Path $tempDir $manifest
        if ($DryRun) {
            kubectl apply --dry-run=server -f $file
        } else {
            kubectl apply -f $file
        }
    }
}

# Wait for application
function Wait-Application {
    Write-Step "Waiting for application to be ready"

    if ($DryRun) {
        Write-Host "[DRY-RUN] Would wait for application"
        return
    }

    # Wait for backend
    Write-Host "Waiting for backend deployment..."
    kubectl -n $Namespace rollout status deployment/backend --timeout=$Timeout
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend deployed successfully"
    } else {
        throw "Backend deployment failed"
    }

    # Wait for frontend
    Write-Host "Waiting for frontend deployment..."
    kubectl -n $Namespace rollout status deployment/frontend --timeout=$Timeout
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend deployed successfully"
    } else {
        throw "Frontend deployment failed"
    }
}

# Deploy ingress
function Deploy-Ingress {
    Write-Step "Deploying ingress"

    $root = Split-Path -Parent $PSScriptRoot
    $manifestDir = Join-Path $root "k8s"
    $tempDir = Join-Path $env:TEMP "doculume-deploy-prod"

    # Update domain in ingress manifest
    $ingressTemplate = Get-Content (Join-Path $manifestDir "ingress.yaml") -Raw
    $ingressModified = $ingressTemplate -replace "doculume\.example\.com", $Domain
    Set-Content -Path (Join-Path $tempDir "ingress.yaml") -Value $ingressModified -NoNewline

    if ($DryRun) {
        kubectl apply --dry-run=server -f (Join-Path $tempDir "ingress.yaml")
    } else {
        kubectl apply -f (Join-Path $tempDir "ingress.yaml")
        Write-Success "Ingress configured for domain: $Domain"
    }
}

# Run smoke tests
function Invoke-SmokeTests {
    Write-Step "Running smoke tests"

    if ($DryRun) {
        Write-Host "[DRY-RUN] Would run smoke tests"
        return
    }

    # Get backend pod
    $backendPod = kubectl get pod -n $Namespace -l app=backend -o jsonpath='{.items[0].metadata.name}' 2>$null

    if (-not $backendPod) {
        Write-Warning "No backend pod found, skipping smoke tests"
        return
    }

    # Test health endpoint
    Write-Host "Testing backend health endpoint..."
    kubectl exec -n $Namespace $backendPod -- curl -s -f http://localhost:8000/api/v1/health/live | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend health check passed"
    } else {
        Write-Warning "Backend health check failed"
    }
}

# Show deployment info
function Show-DeploymentInfo {
    Write-Step "Deployment Information"

    if ($DryRun) {
        Write-Host "[DRY-RUN] Deployment summary not available"
        return
    }

    Write-Host ""
    Write-Bold "Pods:"
    kubectl get pods -n $Namespace

    Write-Host ""
    Write-Bold "Services:"
    kubectl get svc -n $Namespace

    Write-Host ""
    Write-Bold "Ingress:"
    kubectl get ingress -n $Namespace

    Write-Host ""
    Write-Success "Deployment completed successfully!"
    Write-Host ""
    Write-Host "Application URL: https://$Domain"
    Write-Host "API Docs: https://$Domain/api/v1/docs"
    Write-Host ""
    Write-Bold "Next steps:"
    Write-Host "1. Verify DNS points to ingress IP: kubectl get ingress -n $Namespace"
    Write-Host "2. Check application logs: kubectl logs -n $Namespace -l app=backend"
    Write-Host "3. Monitor deployment: kubectl get pods -n $Namespace -w"
}

# Main execution
try {
    Write-Bold "`n╔═══════════════════════════════════════════╗"
    Write-Bold "║  DocuLume Production Deployment Script   ║"
    Write-Bold "╚═══════════════════════════════════════════╝`n"

    # Check required commands
    Test-Command "kubectl"
    Test-Command "docker"

    # Show configuration and confirm
    Show-Configuration
    Confirm-Deployment

    # Pre-flight checks
    if (-not $SkipValidation) {
        Test-ClusterConnectivity
        Test-DockerImages
        Test-Manifests
    }

    # Deployment sequence
    Ensure-Namespace

    if (-not $SkipValidation) {
        Test-Secrets
    }

    Deploy-Infrastructure
    Wait-Infrastructure
    Deploy-Application
    Wait-Application
    Deploy-Ingress
    Invoke-SmokeTests
    Show-DeploymentInfo

    Write-Success "`n✓ Deployment completed successfully!"

} catch {
    Write-Error $_.Exception.Message
    exit 1
}
