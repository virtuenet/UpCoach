#!/bin/bash

# UpCoach Secure Environment Setup Script
# This script sets up production environment variables securely
# CRITICAL: Only run in secure production environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Generate cryptographically secure random string
generate_secure_secret() {
    local length=${1:-64}
    openssl rand -hex $length
}

# Generate secure JWT secret
generate_jwt_secret() {
    # Generate 512-bit (64-byte) secret
    openssl rand -hex 64
}

# Generate secure password
generate_secure_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Validate environment
validate_environment() {
    log "Validating environment..."

    if [[ "${NODE_ENV:-}" != "production" ]]; then
        error "This script should only be run in production environment"
        exit 1
    fi

    if [[ -z "${MASTER_KEY:-}" ]]; then
        error "MASTER_KEY environment variable must be set"
        exit 1
    fi

    log "Environment validation passed"
}

# Generate production secrets
generate_production_secrets() {
    log "Generating production secrets..."

    # Database secrets
    export DB_PASSWORD=$(generate_secure_password 32)
    export REDIS_PASSWORD=$(generate_secure_password 32)

    # JWT secrets
    export JWT_SECRET=$(generate_jwt_secret)
    export JWT_REFRESH_SECRET=$(generate_jwt_secret)
    export SESSION_SECRET=$(generate_secure_secret 32)
    export COOKIE_SECRET=$(generate_secure_secret 32)

    # Backup encryption
    export BACKUP_ENCRYPTION_KEY=$(generate_secure_secret 32)

    log "Production secrets generated successfully"
}

# Validate required API keys
validate_api_keys() {
    log "Validating API keys..."

    local required_keys=(
        "OPENAI_API_KEY"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
        "STRIPE_SECRET_KEY"
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        "CLERK_SECRET_KEY"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
    )

    local missing_keys=()

    for key in "${required_keys[@]}"; do
        if [[ -z "${!key:-}" ]]; then
            missing_keys+=("$key")
        fi
    done

    if [[ ${#missing_keys[@]} -gt 0 ]]; then
        error "Missing required API keys:"
        for key in "${missing_keys[@]}"; do
            error "  - $key"
        done
        exit 1
    fi

    log "API key validation passed"
}

# Create Kubernetes secrets
create_kubernetes_secrets() {
    log "Creating Kubernetes secrets..."

    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check if namespace exists
    if ! kubectl get namespace upcoach &> /dev/null; then
        log "Creating namespace 'upcoach'..."
        kubectl create namespace upcoach
    fi

    # Delete existing secret if it exists
    if kubectl get secret upcoach-secrets -n upcoach &> /dev/null; then
        warn "Deleting existing secret 'upcoach-secrets'..."
        kubectl delete secret upcoach-secrets -n upcoach
    fi

    # Create the secret
    kubectl create secret generic upcoach-secrets \
        --namespace=upcoach \
        --from-literal=database-url="postgresql://upcoach:${DB_PASSWORD}@postgres:5432/upcoach_db" \
        --from-literal=db-host="postgres" \
        --from-literal=db-port="5432" \
        --from-literal=db-user="upcoach" \
        --from-literal=db-password="${DB_PASSWORD}" \
        --from-literal=db-name="upcoach_db" \
        --from-literal=redis-url="redis://:${REDIS_PASSWORD}@redis:6379" \
        --from-literal=redis-password="${REDIS_PASSWORD}" \
        --from-literal=jwt-secret="${JWT_SECRET}" \
        --from-literal=jwt-refresh-secret="${JWT_REFRESH_SECRET}" \
        --from-literal=session-secret="${SESSION_SECRET}" \
        --from-literal=cookie-secret="${COOKIE_SECRET}" \
        --from-literal=google-client-id="${GOOGLE_CLIENT_ID}" \
        --from-literal=google-client-secret="${GOOGLE_CLIENT_SECRET}" \
        --from-literal=openai-api-key="${OPENAI_API_KEY}" \
        --from-literal=claude-api-key="${CLAUDE_API_KEY:-}" \
        --from-literal=stripe-secret-key="${STRIPE_SECRET_KEY}" \
        --from-literal=clerk-publishable-key="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}" \
        --from-literal=clerk-secret-key="${CLERK_SECRET_KEY}" \
        --from-literal=supabase-url="${SUPABASE_URL}" \
        --from-literal=supabase-anon-key="${SUPABASE_ANON_KEY}" \
        --from-literal=supabase-service-key="${SUPABASE_SERVICE_ROLE_KEY}" \
        --from-literal=master-key="${MASTER_KEY}" \
        --from-literal=backup-encryption-key="${BACKUP_ENCRYPTION_KEY}" \
        --from-literal=smtp-host="${SMTP_HOST:-}" \
        --from-literal=smtp-port="${SMTP_PORT:-587}" \
        --from-literal=smtp-user="${SMTP_USER:-}" \
        --from-literal=smtp-password="${SMTP_PASS:-}" \
        --from-literal=sentry-dsn="${SENTRY_DSN:-}" \
        --from-literal=google-analytics-id="${NEXT_PUBLIC_GA_ID:-}" \
        --from-literal=mixpanel-token="${MIXPANEL_TOKEN:-}"

    log "Kubernetes secrets created successfully"
}

# Create secure environment file for Docker
create_secure_env_file() {
    log "Creating secure environment file..."

    local env_file="/tmp/upcoach-production-secure.env"

    cat > "$env_file" << EOF
# UpCoach Production Environment - Generated $(date)
# WARNING: This file contains sensitive production secrets

NODE_ENV=production
PORT=8080

# Database Configuration
DATABASE_URL=postgresql://upcoach:${DB_PASSWORD}@postgres:5432/upcoach_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=upcoach
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=upcoach_db

# Redis Configuration
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
SESSION_SECRET=${SESSION_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}

# Google OAuth Configuration
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

# API Keys
OPENAI_API_KEY=${OPENAI_API_KEY}
CLAUDE_API_KEY=${CLAUDE_API_KEY:-}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
CLERK_SECRET_KEY=${CLERK_SECRET_KEY}

# Supabase Configuration
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Security Configuration
MASTER_KEY=${MASTER_KEY}
BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}

# Site Configuration
SITE_URL=https://upcoach.ai
API_URL=https://api.upcoach.ai
CORS_ORIGINS=https://upcoach.ai,https://api.upcoach.ai,https://admin.upcoach.ai

# Security Headers
CSP_ENABLED=true
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional Services
SMTP_HOST=${SMTP_HOST:-}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_USER=${SMTP_USER:-}
SMTP_PASS=${SMTP_PASS:-}
SENTRY_DSN=${SENTRY_DSN:-}
NEXT_PUBLIC_GA_ID=${NEXT_PUBLIC_GA_ID:-}
MIXPANEL_TOKEN=${MIXPANEL_TOKEN:-}
EOF

    # Set restrictive permissions
    chmod 600 "$env_file"

    log "Secure environment file created at: $env_file"
    warn "IMPORTANT: Copy this file to your secure deployment location and delete it from this system"
}

# Generate secrets backup
create_secrets_backup() {
    log "Creating encrypted secrets backup..."

    local backup_file="/tmp/upcoach-secrets-$(date +%Y%m%d-%H%M%S).enc"
    local secrets_json=$(cat << EOF
{
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "production",
  "secrets": {
    "db_password": "${DB_PASSWORD}",
    "redis_password": "${REDIS_PASSWORD}",
    "jwt_secret": "${JWT_SECRET}",
    "jwt_refresh_secret": "${JWT_REFRESH_SECRET}",
    "session_secret": "${SESSION_SECRET}",
    "cookie_secret": "${COOKIE_SECRET}",
    "backup_encryption_key": "${BACKUP_ENCRYPTION_KEY}"
  }
}
EOF
)

    # Encrypt the secrets using the master key
    echo "$secrets_json" | openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt -k "${MASTER_KEY}" > "$backup_file"
    chmod 600 "$backup_file"

    log "Encrypted secrets backup created at: $backup_file"
    warn "IMPORTANT: Store this backup in a secure location and delete from this system"
}

# Security audit
perform_security_audit() {
    log "Performing security audit..."

    # Check for common security misconfigurations
    local issues=()

    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        issues+=("Running as root user - security risk")
    fi

    # Check environment variables
    if [[ -z "${MASTER_KEY:-}" ]]; then
        issues+=("MASTER_KEY not set")
    fi

    # Check secret lengths
    if [[ ${#JWT_SECRET} -lt 64 ]]; then
        issues+=("JWT_SECRET is too short")
    fi

    if [[ ${#DB_PASSWORD} -lt 20 ]]; then
        issues+=("DB_PASSWORD is too short")
    fi

    if [[ ${#issues[@]} -gt 0 ]]; then
        error "Security audit failed with the following issues:"
        for issue in "${issues[@]}"; do
            error "  - $issue"
        done
        exit 1
    fi

    log "Security audit passed"
}

# Main execution
main() {
    log "Starting UpCoach secure environment setup..."

    # Validate environment
    validate_environment

    # Generate production secrets
    generate_production_secrets

    # Validate API keys
    validate_api_keys

    # Perform security audit
    perform_security_audit

    # Create Kubernetes secrets
    create_kubernetes_secrets

    # Create secure environment file
    create_secure_env_file

    # Create encrypted backup
    create_secrets_backup

    log "Secure environment setup completed successfully!"
    warn "IMPORTANT SECURITY NOTES:"
    warn "1. Delete temporary files from this system after copying to secure location"
    warn "2. Rotate all secrets every 90 days"
    warn "3. Monitor for unauthorized access to secrets"
    warn "4. Use proper RBAC for Kubernetes secret access"
}

# Run main function
main "$@"