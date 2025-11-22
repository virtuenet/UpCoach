#!/bin/bash

# Generate Secure Credentials for Staging Environment
# This script generates secure passwords and API keys for all services

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[Credential Generator] $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Generate secure password function
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-${length}
}

# Generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/"
}

# Generate UUID
generate_uuid() {
    python3 -c "import uuid; print(uuid.uuid4())"
}

log "Generating secure credentials for UpCoach staging environment..."

# Generate all credentials
DB_PASSWORD=$(generate_password 24)
REDIS_PASSWORD=$(generate_password 24)
JWT_SECRET=$(generate_jwt_secret)
REFRESH_TOKEN_SECRET=$(generate_jwt_secret)
CSRF_SECRET=$(generate_password 32)
SESSION_SECRET=$(generate_password 32)
WEBHOOK_SECRET=$(generate_password 24)
GRAFANA_PASSWORD=$(generate_password 16)

log "Generated secure credentials:"
echo
success "Database Password: $DB_PASSWORD"
success "Redis Password: $REDIS_PASSWORD"
success "JWT Secret: ${JWT_SECRET:0:20}..."
success "Refresh Token Secret: ${REFRESH_TOKEN_SECRET:0:20}..."
success "CSRF Secret: ${CSRF_SECRET:0:20}..."
success "Session Secret: ${SESSION_SECRET:0:20}..."
success "Webhook Secret: $WEBHOOK_SECRET"
success "Grafana Password: $GRAFANA_PASSWORD"

# Create secure environment file
ENV_FILE=".env.staging"
log "Creating secure environment file: $ENV_FILE"

cat > "$ENV_FILE" << EOF
# UpCoach Staging Environment Configuration
# Generated on $(date)
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Environment
NODE_ENV=staging
ENVIRONMENT=staging

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=upcoach
DB_PASSWORD=$DB_PASSWORD
DB_NAME=upcoach_staging
DATABASE_URL=postgresql://upcoach:$DB_PASSWORD@postgres:5432/upcoach_staging

# Redis Configuration  
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_URL=redis://:$REDIS_PASSWORD@redis:6379

# JWT & Authentication
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET
REFRESH_TOKEN_EXPIRES_IN=7d

# Supabase Configuration (REPLACE WITH ACTUAL VALUES)
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your_staging_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_staging_supabase_service_key_here

# AI Services (REPLACE WITH ACTUAL VALUES)
OPENAI_API_KEY=your_openai_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here

# Stripe (Use test keys for staging)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key_here

# Email Configuration (REPLACE WITH ACTUAL VALUES)
EMAIL_FROM=noreply-staging@upcoach.ai
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_staging_email@gmail.com
SMTP_PASS=your_staging_app_password_here

# Application URLs (Update with actual staging domains)
FRONTEND_URL=https://staging.upcoach.ai
ADMIN_URL=https://staging-admin.upcoach.ai
API_URL=https://staging-api.upcoach.ai

# Frontend Environment Variables
VITE_API_URL=https://staging-api.upcoach.ai
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_supabase_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key_here
VITE_ENVIRONMENT=staging

# Next.js Environment Variables
NEXT_PUBLIC_API_URL=https://staging-api.upcoach.ai
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_supabase_anon_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key_here

# Monitoring & Error Tracking (REPLACE WITH ACTUAL VALUES)
SENTRY_DSN=https://your_staging_sentry_dsn@sentry.io/project
SENTRY_ENVIRONMENT=staging
SENTRY_RELEASE=staging-$(date +%Y%m%d)

# Grafana Configuration
GRAFANA_USER=admin
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
GF_SECURITY_ADMIN_PASSWORD=$GRAFANA_PASSWORD

# Google Analytics (Use staging property)
GA_MEASUREMENT_ID=GA-STAGING-ID
NEXT_PUBLIC_GA_MEASUREMENT_ID=GA-STAGING-ID

# File Storage (Use staging bucket - REPLACE WITH ACTUAL VALUES)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=upcoach-staging-uploads

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Security
CORS_ORIGIN=https://staging.upcoach.ai,https://staging-admin.upcoach.ai
CSRF_SECRET=$CSRF_SECRET

# Rate Limiting (Relaxed for staging)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# Feature Flags
ENABLE_FEATURE_FLAGS=true
ENABLE_AI_COACHING=true
ENABLE_VOICE_JOURNAL=true
ENABLE_ANALYTICS=true

# Testing
ENABLE_TEST_ROUTES=true
TEST_DATABASE_URL=postgresql://upcoach:$DB_PASSWORD@postgres:5432/upcoach_test

# Performance
MAX_REQUEST_SIZE=50mb
MAX_FILE_SIZE=10mb

# Cache Settings
CACHE_TTL=300
ENABLE_REDIS_CACHE=true

# Session Configuration
SESSION_SECRET=$SESSION_SECRET
SESSION_MAX_AGE=86400000

# OAuth (If applicable - use staging apps)
GOOGLE_CLIENT_ID=your_staging_google_client_id
GOOGLE_CLIENT_SECRET=your_staging_google_client_secret

# Webhook Configuration  
WEBHOOK_SECRET=$WEBHOOK_SECRET

# Backup Configuration
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=7

# Notification Services (REPLACE WITH ACTUAL VALUES)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/STAGING/WEBHOOK

# Mobile App Configuration
MOBILE_APP_VERSION=1.0.0-staging
MOBILE_FORCE_UPDATE=false

# Content Delivery (REPLACE WITH ACTUAL VALUES)
CDN_URL=https://staging-cdn.upcoach.ai

# API Rate Limiting
API_RATE_LIMIT=100
AUTH_RATE_LIMIT=10

# Development Tools (Enabled in staging)
ENABLE_DEBUG_LOGGING=true
ENABLE_QUERY_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true
EOF

# Set secure file permissions
chmod 600 "$ENV_FILE"

success "Secure environment file created: $ENV_FILE"
warning "File permissions set to 600 (owner read/write only)"

echo
log "🔒 Security Notes:"
echo "1. The .env.staging file has been created with secure passwords"
echo "2. Replace placeholder values (SUPABASE_URL, API keys, etc.) with actual staging values"
echo "3. File permissions are set to 600 for security"
echo "4. This file is automatically ignored by .gitignore"
echo "5. Store credentials securely and never commit to version control"

echo
log "🚀 Next Steps:"
echo "1. Update placeholder values in .env.staging with your actual staging credentials"
echo "2. Run: bash scripts/validate-deployment.sh"
echo "3. Deploy: bash scripts/deploy-staging.sh"

success "Secure credential generation complete!"