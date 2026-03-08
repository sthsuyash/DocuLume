#!/usr/bin/env bash

set -euo pipefail

# Production Kubernetes Deployment Script for DocuLume
# This script deploys DocuLume to a production Kubernetes cluster
# with comprehensive validation and safety checks.

# Configuration - Required parameters
ENVIRONMENT="${ENVIRONMENT:-}"
NAMESPACE="${NAMESPACE:-doculume}"
BACKEND_IMAGE="${BACKEND_IMAGE:-}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-}"
DOMAIN="${DOMAIN:-}"

# Configuration - Optional parameters
DRY_RUN="${DRY_RUN:-false}"
SKIP_VALIDATION="${SKIP_VALIDATION:-false}"
ENABLE_MONITORING="${ENABLE_MONITORING:-true}"
ENABLE_BACKUP="${ENABLE_BACKUP:-true}"
TIMEOUT="${TIMEOUT:-600s}"

# Color output
cyan() { echo -e "\033[0;36m$*\033[0m"; }
green() { echo -e "\033[0;32m$*\033[0m"; }
yellow() { echo -e "\033[0;33m$*\033[0m"; }
red() { echo -e "\033[0;31m$*\033[0m"; }
bold() { echo -e "\033[1m$*\033[0m"; }

write_step() {
    echo ""
    cyan "==> $*"
}

error_exit() {
    red "ERROR: $*"
    exit 1
}

warn() {
    yellow "WARNING: $*"
}

# Validate required commands
require_command() {
    if ! command -v "$1" &> /dev/null; then
        error_exit "Missing required command: $1"
    fi
}

# Validate required environment variables
validate_env() {
    local missing=()

    [[ -z "$ENVIRONMENT" ]] && missing+=("ENVIRONMENT")
    [[ -z "$BACKEND_IMAGE" ]] && missing+=("BACKEND_IMAGE")
    [[ -z "$FRONTEND_IMAGE" ]] && missing+=("FRONTEND_IMAGE")
    [[ -z "$DOMAIN" ]] && missing+=("DOMAIN")

    if [[ ${#missing[@]} -gt 0 ]]; then
        error_exit "Missing required environment variables: ${missing[*]}"
    fi

    # Validate environment value
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        error_exit "ENVIRONMENT must be 'staging' or 'production', got: $ENVIRONMENT"
    fi
}

# Display configuration
show_config() {
    bold "\n=== Deployment Configuration ==="
    echo "Environment:      $ENVIRONMENT"
    echo "Namespace:        $NAMESPACE"
    echo "Backend Image:    $BACKEND_IMAGE"
    echo "Frontend Image:   $FRONTEND_IMAGE"
    echo "Domain:           $DOMAIN"
    echo "Dry Run:          $DRY_RUN"
    echo "Skip Validation:  $SKIP_VALIDATION"
    echo "Enable Monitoring: $ENABLE_MONITORING"
    echo "Enable Backup:    $ENABLE_BACKUP"
    echo "Timeout:          $TIMEOUT"
    bold "================================\n"
}

# Confirmation prompt
confirm_deployment() {
    if [[ "$DRY_RUN" == "true" ]]; then
        yellow "Running in DRY-RUN mode - no changes will be applied"
        return
    fi

    yellow "\nYou are about to deploy to $ENVIRONMENT environment."
    read -p "Continue? (yes/no): " -r
    if [[ ! "$REPLY" =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
}

# Pre-flight validation
validate_cluster() {
    write_step "Validating cluster connectivity"

    if ! kubectl cluster-info &> /dev/null; then
        error_exit "Cannot connect to Kubernetes cluster"
    fi

    # Get current context
    local context
    context=$(kubectl config current-context)
    green "Connected to cluster: $context"

    # Warn if context contains 'local', 'dev', or 'kind'
    if [[ "$context" =~ (local|dev|kind) ]] && [[ "$ENVIRONMENT" == "production" ]]; then
        warn "Deploying to production from a local/dev cluster context: $context"
        read -p "Are you sure? (yes/no): " -r
        if [[ ! "$REPLY" =~ ^[Yy][Ee][Ss]$ ]]; then
            exit 0
        fi
    fi
}

# Validate Docker images exist and are pullable
validate_images() {
    write_step "Validating Docker images"

    for image in "$BACKEND_IMAGE" "$FRONTEND_IMAGE"; do
        echo "Checking image: $image"
        if ! docker manifest inspect "$image" &> /dev/null; then
            error_exit "Cannot pull image: $image"
        fi
        green "✓ Image exists: $image"
    done
}

# Validate secrets exist
validate_secrets() {
    write_step "Validating Kubernetes secrets"

    local required_secrets=("doculume-secrets" "postgres-credentials")

    for secret in "${required_secrets[@]}"; do
        if ! kubectl get secret "$secret" -n "$NAMESPACE" &> /dev/null; then
            warn "Secret '$secret' not found in namespace '$NAMESPACE'"
            echo "Please create it manually before deploying:"
            echo "kubectl create secret generic $secret -n $NAMESPACE --from-literal=..."
            error_exit "Missing required secret: $secret"
        fi
        green "✓ Secret exists: $secret"
    done
}

# Validate resource manifests
validate_manifests() {
    write_step "Validating Kubernetes manifests"

    local manifest_dir="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/k8s"

    if [[ ! -d "$manifest_dir" ]]; then
        error_exit "Manifests directory not found: $manifest_dir"
    fi

    # Validate each manifest
    for manifest in "$manifest_dir"/*.yaml; do
        if [[ -f "$manifest" ]]; then
            echo "Validating: $(basename "$manifest")"
            if ! kubectl apply --dry-run=client -f "$manifest" &> /dev/null; then
                error_exit "Invalid manifest: $manifest"
            fi
        fi
    done

    green "✓ All manifests are valid"
}

# Create or update namespace
ensure_namespace() {
    write_step "Ensuring namespace: $NAMESPACE"

    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        green "✓ Namespace already exists"
    else
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "[DRY-RUN] Would create namespace: $NAMESPACE"
        else
            kubectl create namespace "$NAMESPACE"
            kubectl label namespace "$NAMESPACE" environment="$ENVIRONMENT"
            green "✓ Created namespace: $NAMESPACE"
        fi
    fi
}

# Deploy infrastructure (PostgreSQL, Redis)
deploy_infrastructure() {
    write_step "Deploying infrastructure services"

    local manifest_dir="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/k8s"

    local infra_manifests=(
        "configmap.yaml"
        "postgres-statefulset.yaml"
        "redis-deployment.yaml"
    )

    for manifest in "${infra_manifests[@]}"; do
        local file="$manifest_dir/$manifest"
        if [[ -f "$file" ]]; then
            echo "Applying: $manifest"
            if [[ "$DRY_RUN" == "true" ]]; then
                kubectl apply --dry-run=server -f "$file"
            else
                kubectl apply -f "$file"
            fi
        else
            warn "Manifest not found: $file"
        fi
    done
}

# Wait for infrastructure to be ready
wait_for_infrastructure() {
    write_step "Waiting for infrastructure to be ready"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] Would wait for infrastructure"
        return
    fi

    # Wait for PostgreSQL
    echo "Waiting for PostgreSQL..."
    if kubectl wait --for=condition=ready pod -l app=postgres -n "$NAMESPACE" --timeout="$TIMEOUT"; then
        green "✓ PostgreSQL ready"
    else
        error_exit "PostgreSQL failed to become ready"
    fi

    # Wait for Redis
    echo "Waiting for Redis..."
    if kubectl wait --for=condition=ready pod -l app=redis -n "$NAMESPACE" --timeout="$TIMEOUT"; then
        green "✓ Redis ready"
    else
        error_exit "Redis failed to become ready"
    fi
}

# Deploy application services
deploy_application() {
    write_step "Deploying application services"

    local manifest_dir="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/k8s"

    # Update image tags in manifests (temporary files)
    local temp_dir=$(mktemp -d)
    trap "rm -rf $temp_dir" EXIT

    # Backend deployment
    sed -e "s|image:.*backend.*|image: $BACKEND_IMAGE|g" \
        "$manifest_dir/backend-deployment.yaml" > "$temp_dir/backend-deployment.yaml"

    # Frontend deployment
    sed -e "s|image:.*frontend.*|image: $FRONTEND_IMAGE|g" \
        -e "s|doculume\.example\.com|$DOMAIN|g" \
        "$manifest_dir/frontend-deployment.yaml" > "$temp_dir/frontend-deployment.yaml"

    # Apply manifests
    for manifest in backend-deployment.yaml frontend-deployment.yaml; do
        echo "Applying: $manifest"
        if [[ "$DRY_RUN" == "true" ]]; then
            kubectl apply --dry-run=server -f "$temp_dir/$manifest"
        else
            kubectl apply -f "$temp_dir/$manifest"
        fi
    done
}

# Wait for application to be ready
wait_for_application() {
    write_step "Waiting for application to be ready"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] Would wait for application"
        return
    fi

    # Wait for backend
    echo "Waiting for backend deployment..."
    if kubectl -n "$NAMESPACE" rollout status deployment/backend --timeout="$TIMEOUT"; then
        green "✓ Backend deployed successfully"
    else
        error_exit "Backend deployment failed"
    fi

    # Wait for frontend
    echo "Waiting for frontend deployment..."
    if kubectl -n "$NAMESPACE" rollout status deployment/frontend --timeout="$TIMEOUT"; then
        green "✓ Frontend deployed successfully"
    else
        error_exit "Frontend deployment failed"
    fi
}

# Deploy ingress
deploy_ingress() {
    write_step "Deploying ingress"

    local manifest_dir="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/k8s"
    local temp_dir=$(mktemp -d)
    trap "rm -rf $temp_dir" EXIT

    # Update domain in ingress manifest
    sed -e "s|doculume\.example\.com|$DOMAIN|g" \
        "$manifest_dir/ingress.yaml" > "$temp_dir/ingress.yaml"

    if [[ "$DRY_RUN" == "true" ]]; then
        kubectl apply --dry-run=server -f "$temp_dir/ingress.yaml"
    else
        kubectl apply -f "$temp_dir/ingress.yaml"
        green "✓ Ingress configured for domain: $DOMAIN"
    fi
}

# Run smoke tests
run_smoke_tests() {
    write_step "Running smoke tests"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] Would run smoke tests"
        return
    fi

    # Get backend pod
    local backend_pod
    backend_pod=$(kubectl get pod -n "$NAMESPACE" -l app=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [[ -z "$backend_pod" ]]; then
        warn "No backend pod found, skipping smoke tests"
        return
    fi

    # Test health endpoint
    echo "Testing backend health endpoint..."
    if kubectl exec -n "$NAMESPACE" "$backend_pod" -- curl -s -f http://localhost:8000/api/v1/health/live > /dev/null; then
        green "✓ Backend health check passed"
    else
        warn "Backend health check failed"
    fi
}

# Display deployment info
show_deployment_info() {
    write_step "Deployment Information"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] Deployment summary not available"
        return
    fi

    echo ""
    bold "Pods:"
    kubectl get pods -n "$NAMESPACE"

    echo ""
    bold "Services:"
    kubectl get svc -n "$NAMESPACE"

    echo ""
    bold "Ingress:"
    kubectl get ingress -n "$NAMESPACE"

    echo ""
    green "Deployment completed successfully!"
    echo ""
    echo "Application URL: https://$DOMAIN"
    echo "API Docs: https://$DOMAIN/api/v1/docs"
    echo ""
    bold "Next steps:"
    echo "1. Verify DNS points to ingress IP: kubectl get ingress -n $NAMESPACE"
    echo "2. Check application logs: kubectl logs -n $NAMESPACE -l app=backend"
    echo "3. Monitor deployment: kubectl get pods -n $NAMESPACE -w"
}

# Main deployment flow
main() {
    bold "\n╔═══════════════════════════════════════════╗"
    bold "║  DocuLume Production Deployment Script   ║"
    bold "╚═══════════════════════════════════════════╝\n"

    # Check required commands
    require_command kubectl
    require_command docker
    require_command sed

    # Validate and show configuration
    validate_env
    show_config
    confirm_deployment

    # Pre-flight checks
    if [[ "$SKIP_VALIDATION" != "true" ]]; then
        validate_cluster
        validate_images
        validate_manifests
    fi

    # Deployment sequence
    ensure_namespace

    if [[ "$SKIP_VALIDATION" != "true" ]]; then
        validate_secrets
    fi

    deploy_infrastructure
    wait_for_infrastructure
    deploy_application
    wait_for_application
    deploy_ingress
    run_smoke_tests
    show_deployment_info

    green "\n✓ Deployment completed successfully!"
}

# Run main function
main "$@"
