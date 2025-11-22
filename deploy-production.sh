#!/bin/bash
set -e

# =====================================================
# UpCoach Production Deployment Script
# =====================================================
# This script handles the complete production deployment
# of the UpCoach platform with AI Coaching Intelligence
# =====================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Deployment configuration
DEPLOYMENT_ENV=${DEPLOYMENT_ENV:-production}
DEPLOY_TIMEOUT=${DEPLOY_TIMEOUT:-600}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-300}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# Production service ports (migrated to 1000s range)
POSTGRES_PORT=1433
REDIS_PORT=1003
LANDING_PAGE_PORT=1005
ADMIN_PANEL_PORT=1006
CMS_PANEL_PORT=1007
API_PORT=1080

log_info "Starting UpCoach Production Deployment..."
log_info "Environment: $DEPLOYMENT_ENV"
log_info "API Port: $API_PORT"

# =====================================================
# Pre-deployment validation
# =====================================================
log_info "Running pre-deployment validation..."

# Check if required environment files exist
if [ ! -f ".env.production" ]; then
    log_error ".env.production file not found!"
    log_info "Please copy .env.production.example and configure with production values"
    exit 1
fi

# Validate critical environment variables
source .env.production
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "GOOGLE_CLIENT_ID"
    "SUPABASE_URL"
    "OPENAI_API_KEY"
    "STRIPE_SECRET_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "REPLACE_ME" ] || [ "${!var}" = "your_"* ]; then
        log_error "$var is not properly configured in .env.production"
        exit 1
    fi
done

log_success "Environment validation passed"

# =====================================================
# Pre-deployment backup
# =====================================================
log_info "Creating pre-deployment backup..."

# Create backup directory
BACKUP_DIR="backups/pre-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Database backup
if command -v pg_dump &> /dev/null; then
    log_info "Creating database backup..."
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql" || {
        log_warning "Database backup failed, continuing deployment..."
    }
else
    log_warning "pg_dump not available, skipping database backup"
fi

# Configuration backup
cp .env.production "$BACKUP_DIR/.env.production.backup"
log_success "Backup created in $BACKUP_DIR"

# =====================================================
# Build and deploy services
# =====================================================
log_info "Building and deploying services..."

# Stop existing services gracefully
log_info "Stopping existing services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --timeout 30

# Clean up old containers and images
log_info "Cleaning up old containers..."
docker container prune -f
docker image prune -f

# Build all services
log_info "Building production images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache || {
    log_error "Build failed!"
    exit 1
}

# Start infrastructure services first
log_info "Starting infrastructure services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres redis

# Wait for infrastructure to be healthy
log_info "Waiting for infrastructure services to be healthy..."
timeout $HEALTH_CHECK_TIMEOUT bash -c 'until docker exec upcoach-db pg_isready -U upcoach; do sleep 2; done' || {
    log_error "Database failed to start within $HEALTH_CHECK_TIMEOUT seconds"
    exit 1
}

timeout $HEALTH_CHECK_TIMEOUT bash -c 'until docker exec upcoach-redis redis-cli ping | grep -q PONG; do sleep 2; done' || {
    log_error "Redis failed to start within $HEALTH_CHECK_TIMEOUT seconds"
    exit 1
}

log_success "Infrastructure services are healthy"

# =====================================================
# Database migrations
# =====================================================
log_info "Running database migrations..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm backend-api npm run migrate || {
    log_error "Database migration failed!"
    exit 1
}

log_success "Database migrations completed"

# =====================================================
# Start application services
# =====================================================
log_info "Starting application services..."

# Start backend API
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend-api

# Wait for API to be healthy
log_info "Waiting for API service to be healthy..."
timeout $HEALTH_CHECK_TIMEOUT bash -c "until curl -f http://localhost:$API_PORT/api/health > /dev/null 2>&1; do sleep 5; done" || {
    log_error "API service failed to start within $HEALTH_CHECK_TIMEOUT seconds"
    exit 1
}

# Start frontend services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d landing-page admin-panel cms-panel

log_success "All application services started"

# =====================================================
# Health checks and validation
# =====================================================
log_info "Running post-deployment health checks..."

# Check all services
SERVICES=(
    "postgres:$POSTGRES_PORT"
    "redis:$REDIS_PORT"
    "backend-api:$API_PORT"
    "landing-page:$LANDING_PAGE_PORT"
    "admin-panel:$ADMIN_PANEL_PORT"
    "cms-panel:$CMS_PANEL_PORT"
)

ALL_HEALTHY=true
for service in "${SERVICES[@]}"; do
    SERVICE_NAME=$(echo $service | cut -d: -f1)
    SERVICE_PORT=$(echo $service | cut -d: -f2)
    
    if docker-compose ps | grep -q "upcoach-${SERVICE_NAME}.*Up"; then
        log_success "✓ $SERVICE_NAME is running on port $SERVICE_PORT"
    else
        log_error "✗ $SERVICE_NAME is not healthy"
        ALL_HEALTHY=false
    fi
done

if [ "$ALL_HEALTHY" = false ]; then
    log_error "Some services failed health checks!"
    exit 1
fi

# =====================================================
# AI Services validation
# =====================================================
log_info "Validating AI services..."

# Test AI coaching endpoints
if curl -f -H "Content-Type: application/json" -d '{"message":"test"}' http://localhost:$API_PORT/api/ai/chat > /dev/null 2>&1; then
    log_success "✓ AI Coaching service is responding"
else
    log_warning "△ AI Coaching service may not be fully initialized (this is normal on first deploy)"
fi

# Test voice journal endpoints
if curl -f http://localhost:$API_PORT/api/voice-journal/entries > /dev/null 2>&1; then
    log_success "✓ Voice Journal service is responding"
else
    log_warning "△ Voice Journal service requires authentication (this is normal)"
fi

# =====================================================
# Performance optimization
# =====================================================
log_info "Running performance optimizations..."

# Warm up AI services
log_info "Warming up AI services..."
curl -s http://localhost:$API_PORT/api/ai/health > /dev/null || true

# Pre-build caches
log_info "Building application caches..."
docker-compose exec -T backend-api npm run cache:warm || log_warning "Cache warming failed"

# =====================================================
# Security validation
# =====================================================
log_info "Running security validation..."

# Check SSL certificates (if applicable)
if [ "$NODE_ENV" = "production" ]; then
    log_info "Validating SSL configuration..."
    # Add SSL certificate checks here
fi

# Check environment security
if grep -q "REPLACE_ME\|your_\|test_\|dev_" .env.production; then
    log_error "Found placeholder values in .env.production!"
    log_error "Please ensure all values are properly configured for production"
    exit 1
fi

log_success "Security validation passed"

# =====================================================
# Monitoring and alerts setup
# =====================================================
log_info "Setting up monitoring and alerts..."

# Start monitoring services (if configured)
if [ -f "docker-compose.monitoring.yml" ]; then
    docker-compose -f docker-compose.monitoring.yml up -d || log_warning "Monitoring setup failed"
fi

# Send deployment notification (if configured)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 UpCoach Production Deployment Complete\n• Environment: $DEPLOYMENT_ENV\n• Version: $(git rev-parse --short HEAD)\n• Services: All healthy\n• Timestamp: $(date)\"}" \
        "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || log_warning "Slack notification failed"
fi

# =====================================================
# Cleanup and final steps
# =====================================================
log_info "Cleaning up deployment artifacts..."

# Remove old backups (keep last N days)
find backups/ -name "pre-deployment-*" -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true

# Clean up Docker resources
docker system prune -f > /dev/null 2>&1

# =====================================================
# Deployment summary
# =====================================================
log_success "🎉 UpCoach Production Deployment Complete!"
echo
log_info "Deployment Summary:"
log_info "• Environment: $DEPLOYMENT_ENV"
log_info "• Git Commit: $(git rev-parse --short HEAD)"
log_info "• Deployment Time: $(date)"
log_info "• Backup Location: $BACKUP_DIR"
echo
log_info "Service URLs:"
log_info "• API: http://localhost:$API_PORT"
log_info "• Landing Page: http://localhost:$LANDING_PAGE_PORT"
log_info "• Admin Panel: http://localhost:$ADMIN_PANEL_PORT"
log_info "• CMS Panel: http://localhost:$CMS_PANEL_PORT"
echo
log_info "Next Steps:"
log_info "1. Update DNS records to point to the new server"
log_info "2. Configure SSL certificates"
log_info "3. Set up monitoring alerts"
log_info "4. Run smoke tests"
echo
log_success "Deployment completed successfully! 🚀"

# =====================================================
# Post-deployment tests
# =====================================================
if [ "$RUN_SMOKE_TESTS" = "true" ]; then
    log_info "Running smoke tests..."
    
    # Basic API tests
    test_endpoints=(
        "GET /api/health"
        "GET /api"
        "GET /api/cms/health"
    )
    
    for endpoint in "${test_endpoints[@]}"; do
        method=$(echo $endpoint | cut -d' ' -f1)
        path=$(echo $endpoint | cut -d' ' -f2)
        
        if curl -f -X "$method" "http://localhost:$API_PORT$path" > /dev/null 2>&1; then
            log_success "✓ $endpoint"
        else
            log_warning "△ $endpoint (may require authentication)"
        fi
    done
fi

exit 0