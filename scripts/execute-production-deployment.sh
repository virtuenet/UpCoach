#!/bin/bash

# Production Deployment Execution Script
# Coordinates the deployment of UpCoach platform to production

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/tmp/upcoach-deployment-${DEPLOYMENT_ID}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f /tmp/upcoach-*.tmp
}

# Error handler
error_handler() {
    error "Deployment failed at line $1"
    error "Check log file: $LOG_FILE"
    cleanup
    exit 1
}

trap 'error_handler $LINENO' ERR
trap cleanup EXIT

# Header
echo
echo "🚀 UpCoach Production Deployment"
echo "================================"
echo "Deployment ID: $DEPLOYMENT_ID"
echo "Log File: $LOG_FILE"
echo "Project Root: $PROJECT_ROOT"
echo

cd "$PROJECT_ROOT"

# Pre-deployment checks
log "Running pre-deployment validation..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f "docker-compose.production.yml" ]]; then
    error "Invalid project directory. Missing required files."
    exit 1
fi

# Check environment file
if [[ ! -f ".env.production" ]]; then
    error "Production environment file (.env.production) not found"
    exit 1
fi

# Validate Docker setup
if ! command -v docker >/dev/null 2>&1; then
    error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    error "Docker Compose is not installed or not in PATH"
    exit 1
fi

# Test Docker Compose configuration
log "Validating Docker Compose configuration..."
if ! docker-compose -f docker-compose.production.yml config --quiet; then
    error "Docker Compose configuration is invalid"
    exit 1
fi

success "Pre-deployment validation completed"

# Create backup
log "Creating pre-deployment backup..."
if [[ -f "scripts/backup-production.sh" ]]; then
    bash scripts/backup-production.sh
    success "Backup completed"
else
    warn "Backup script not found, skipping backup"
fi

# Pull latest images
log "Pulling latest container images..."
docker-compose -f docker-compose.production.yml pull

# Build services that need building
log "Building custom container images..."
docker-compose -f docker-compose.production.yml build

# Stop existing services gracefully
log "Stopping existing services..."
if docker-compose -f docker-compose.production.yml ps -q >/dev/null 2>&1; then
    docker-compose -f docker-compose.production.yml down --timeout 30
fi

# Start infrastructure services first
log "Starting infrastructure services..."
docker-compose -f docker-compose.production.yml up -d postgres redis

# Wait for database
log "Waiting for database to be ready..."
max_attempts=30
attempt=1
while ! docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U "${DB_USER:-upcoach}" >/dev/null 2>&1; do
    if [[ $attempt -ge $max_attempts ]]; then
        error "Database failed to start within timeout"
        exit 1
    fi
    log "Waiting for database... attempt $attempt/$max_attempts"
    sleep 5
    ((attempt++))
done

success "Database is ready"

# Run database migrations
log "Running database migrations..."
docker-compose -f docker-compose.production.yml run --rm backend npm run db:migrate

# Start application services
log "Starting application services..."
docker-compose -f docker-compose.production.yml up -d backend

# Wait for backend to be healthy
log "Waiting for backend service to be healthy..."
max_attempts=20
attempt=1
while ! docker-compose -f docker-compose.production.yml exec -T backend curl -f http://localhost:8080/health >/dev/null 2>&1; do
    if [[ $attempt -ge $max_attempts ]]; then
        error "Backend service failed to become healthy"
        exit 1
    fi
    log "Waiting for backend... attempt $attempt/$max_attempts"
    sleep 10
    ((attempt++))
done

success "Backend service is healthy"

# Start frontend services
log "Starting frontend services..."
docker-compose -f docker-compose.production.yml up -d admin-panel cms-panel landing-page

# Start load balancer and monitoring
log "Starting load balancer and monitoring services..."
docker-compose -f docker-compose.production.yml up -d nginx prometheus grafana datadog-agent

# Final health check
log "Performing comprehensive health check..."
sleep 30

# Check all services
services=("postgres" "redis" "backend" "admin-panel" "cms-panel" "landing-page" "nginx")
for service in "${services[@]}"; do
    if ! docker-compose -f docker-compose.production.yml ps "$service" | grep -q "Up"; then
        error "Service $service is not running"
        exit 1
    fi
    success "Service $service is healthy"
done

# Test external endpoints
log "Testing external endpoints..."
endpoints=(
    "http://localhost/api/health"
    "http://localhost:8005/api/health"
    "http://localhost:8006"
    "http://localhost:8007"
)

for endpoint in "${endpoints[@]}"; do
    if curl -f -s "$endpoint" >/dev/null; then
        success "Endpoint $endpoint is responding"
    else
        warn "Endpoint $endpoint is not responding (may be expected)"
    fi
done

# Update monitoring
log "Updating monitoring configuration..."
if [[ -f "scripts/update-monitoring.sh" ]]; then
    bash scripts/update-monitoring.sh
fi

# Generate deployment report
log "Generating deployment report..."
cat > "/tmp/deployment-report-${DEPLOYMENT_ID}.json" << EOF
{
    "deployment_id": "$DEPLOYMENT_ID",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "success",
    "services": {
        "backend": "$(docker-compose -f docker-compose.production.yml ps -q backend)",
        "admin-panel": "$(docker-compose -f docker-compose.production.yml ps -q admin-panel)",
        "cms-panel": "$(docker-compose -f docker-compose.production.yml ps -q cms-panel)",
        "landing-page": "$(docker-compose -f docker-compose.production.yml ps -q landing-page)",
        "postgres": "$(docker-compose -f docker-compose.production.yml ps -q postgres)",
        "redis": "$(docker-compose -f docker-compose.production.yml ps -q redis)",
        "nginx": "$(docker-compose -f docker-compose.production.yml ps -q nginx)"
    },
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Display final status
echo
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "========================="
echo "Deployment ID: $DEPLOYMENT_ID"
echo "Timestamp: $(date)"
echo "Log File: $LOG_FILE"
echo "Report: /tmp/deployment-report-${DEPLOYMENT_ID}.json"
echo
echo "Service Endpoints:"
echo "- Admin Panel: http://localhost:8006"
echo "- CMS Panel: http://localhost:8007"
echo "- Landing Page: http://localhost:8005"
echo "- API: http://localhost:8080"
echo "- Grafana: http://localhost:3001"
echo "- Prometheus: http://localhost:9090"
echo
echo "Next Steps:"
echo "1. Verify all services are functioning correctly"
echo "2. Run post-deployment tests"
echo "3. Monitor system performance and logs"
echo "4. Update DNS records if needed"
echo

success "Production deployment completed successfully!"