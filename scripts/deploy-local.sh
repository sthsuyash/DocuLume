#!/usr/bin/env bash

set -euo pipefail

# Default parameters
CLUSTER_NAME="${CLUSTER_NAME:-doculume}"
NAMESPACE="${NAMESPACE:-doculume}"
BACKEND_IMAGE="${BACKEND_IMAGE:-doculume-backend:local}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-doculume-frontend:local}"
JWT_SECRET="${JWT_SECRET:-dev-jwt-secret-change-me}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-ragpass}"
SKIP_BUILD="${SKIP_BUILD:-false}"
SKIP_CLUSTER_CREATE="${SKIP_CLUSTER_CREATE:-false}"

# Color output
cyan() { echo -e "\033[0;36m$*\033[0m"; }
green() { echo -e "\033[0;32m$*\033[0m"; }
yellow() { echo -e "\033[0;33m$*\033[0m"; }
red() { echo -e "\033[0;31m$*\033[0m"; }

write_step() {
    echo ""
    cyan "==> $*"
}

require_command() {
    if ! command -v "$1" &> /dev/null; then
        red "Missing required command: $1"
        exit 1
    fi
}

# Check required commands
require_command docker
require_command kubectl
require_command kind

# Setup paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
K8S_PATH="$ROOT_DIR/k8s"
BACKEND_PATH="$ROOT_DIR/backend"
FRONTEND_PATH="$ROOT_DIR/frontend"

# Create kind cluster if needed
if [ "$SKIP_CLUSTER_CREATE" != "true" ]; then
    write_step "Ensuring kind cluster '$CLUSTER_NAME' exists"
    if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
        kind create cluster --name "$CLUSTER_NAME"
    else
        echo "Cluster already exists"
    fi
fi

# Switch kubectl context
write_step "Switching kubectl context to kind-$CLUSTER_NAME"
kubectl config use-context "kind-$CLUSTER_NAME" > /dev/null

# Build images
if [ "$SKIP_BUILD" != "true" ]; then
    write_step "Building local images"
    docker build -t "$BACKEND_IMAGE" "$BACKEND_PATH"
    docker build -t "$FRONTEND_IMAGE" "$FRONTEND_PATH"
fi

# Load images into kind
write_step "Loading images into kind cluster"
kind load docker-image "$BACKEND_IMAGE" --name "$CLUSTER_NAME"
kind load docker-image "$FRONTEND_IMAGE" --name "$CLUSTER_NAME"

# Apply base manifests
write_step "Applying namespace and base infra manifests"
kubectl apply -f "$K8S_PATH/namespace.yaml"
kubectl apply -f "$K8S_PATH/configmap.yaml"
kubectl apply -f "$K8S_PATH/postgres-statefulset.yaml"
kubectl apply -f "$K8S_PATH/redis-deployment.yaml"

# Get OpenAI API key if not set
if [ -z "${OPENAI_API_KEY:-}" ]; then
    read -p "Enter OPENAI_API_KEY (leave empty if not needed right now): " OPENAI_API_KEY
fi

# Create secrets
write_step "Creating/updating Kubernetes secrets from local values"
kubectl create secret generic doculume-secrets \
    --namespace "$NAMESPACE" \
    --from-literal=POSTGRES_USER=raguser \
    --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    --from-literal=POSTGRES_DB=ragdb \
    --from-literal=REDIS_PASSWORD="" \
    --from-literal=JWT_SECRET_KEY="$JWT_SECRET" \
    --from-literal=JWT_ALGORITHM=HS256 \
    --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
    --from-literal=ANTHROPIC_API_KEY="" \
    --from-literal=GOOGLE_API_KEY="" \
    --from-literal=GOOGLE_CLIENT_ID="" \
    --from-literal=GOOGLE_CLIENT_SECRET="" \
    --from-literal=GITHUB_CLIENT_ID="" \
    --from-literal=GITHUB_CLIENT_SECRET="" \
    --from-literal=OAUTH_REDIRECT_URL="http://localhost:3000/auth/callback" \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic postgres-credentials \
    --namespace "$NAMESPACE" \
    --from-literal=username=raguser \
    --from-literal=password="$POSTGRES_PASSWORD" \
    --from-literal=database=ragdb \
    --dry-run=client -o yaml | kubectl apply -f -

# Generate local deployment manifests
write_step "Generating local-safe deployment manifests (images, pull policy, PVC modes, replicas)"

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

BACKEND_LOCAL="$TEMP_DIR/backend-deployment.local.yaml"
FRONTEND_LOCAL="$TEMP_DIR/frontend-deployment.local.yaml"

# Modify backend deployment for local
sed -e "s|ghcr.io/yourusername/doculume-backend:latest|$BACKEND_IMAGE|g" \
    -e "s|imagePullPolicy: Always|imagePullPolicy: IfNotPresent|g" \
    -e "s|replicas: 3|replicas: 1|g" \
    -e "s|ReadWriteMany|ReadWriteOnce|g" \
    -e "s|minReplicas: 3|minReplicas: 1|g" \
    "$K8S_PATH/backend-deployment.yaml" > "$BACKEND_LOCAL"

# Modify frontend deployment for local
sed -e "s|ghcr.io/yourusername/doculume-frontend:latest|$FRONTEND_IMAGE|g" \
    -e "s|imagePullPolicy: Always|imagePullPolicy: IfNotPresent|g" \
    -e "s|replicas: 2|replicas: 1|g" \
    -e 's|value: "https://doculume\.example\.com/api/v1"|value: "http://localhost:8000/api/v1"|g' \
    -e "s|minReplicas: 2|minReplicas: 1|g" \
    "$K8S_PATH/frontend-deployment.yaml" > "$FRONTEND_LOCAL"

# Apply app manifests
write_step "Applying app manifests"
kubectl apply -f "$BACKEND_LOCAL"
kubectl apply -f "$FRONTEND_LOCAL"

# Wait for rollouts
write_step "Waiting for workloads to become ready"
kubectl -n "$NAMESPACE" rollout status statefulset/postgres --timeout=300s
kubectl -n "$NAMESPACE" rollout status deployment/redis --timeout=300s
kubectl -n "$NAMESPACE" rollout status deployment/backend --timeout=300s
kubectl -n "$NAMESPACE" rollout status deployment/frontend --timeout=300s

# Success message
echo ""
green "Local Kubernetes setup complete."
yellow "Run these in separate terminals:"
echo "kubectl -n $NAMESPACE port-forward svc/backend 8000:8000"
echo "kubectl -n $NAMESPACE port-forward svc/frontend 3000:3000"
echo "Then open: http://localhost:3000 and http://localhost:8000/docs"
