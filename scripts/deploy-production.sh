#!/bin/bash

# Production Deployment Script for UpCoach
# This script handles the complete production deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV=${1:-production}
DEPLOYMENT_VERSION=${2:-latest}
BACKUP_BEFORE_DEPLOY=${BACKUP_BEFORE_DEPLOY:-true}
RUN_HEALTH_CHECKS=${RUN_HEALTH_CHECKS:-true}
ROLLBACK_ON_FAILURE=${ROLLBACK_ON_FAILURE:-true}

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check for required tools
    for tool in docker docker-compose git curl jq; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool is not installed"
            exit 1
        fi
    done
    
    # Check for environment file
    if [ ! -f ".env.${DEPLOYMENT_ENV}" ]; then
        log_error ".env.${DEPLOYMENT_ENV} file not found"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create backup
create_backup() {
    if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
        log_info "Creating backup before deployment..."
        ./scripts/backup.sh full
        if [ $? -eq 0 ]; then
            log_success "Backup created successfully"
        else
            log_error "Backup failed"
            exit 1
        fi
    fi
}

# Pull latest code
pull_latest_code() {
    log_info "Pulling latest code from repository..."
    
    # Stash any local changes
    git stash
    
    # Pull latest changes
    git pull origin main
    
    # Update submodules if any
    git submodule update --init --recursive
    
    log_success "Code updated successfully"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build backend
    log_info "Building backend image..."
    docker build -t upcoach/backend:${DEPLOYMENT_VERSION} \
        -f services/api/Dockerfile \
        --target production \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=$(git rev-parse --short HEAD) \
        services/api/
    
    # Build admin panel
    log_info "Building admin panel image..."
    docker build -t upcoach/admin-panel:${DEPLOYMENT_VERSION} \
        -f apps/admin-panel/Dockerfile \
        --target production \
        --build-arg VITE_API_URL=${PRODUCTION_API_URL} \
        apps/admin-panel/
    
    # Build landing page
    log_info "Building landing page image..."
    docker build -t upcoach/landing-page:${DEPLOYMENT_VERSION} \
        -f apps/landing-page/Dockerfile \
        --target production \
        --build-arg NEXT_PUBLIC_API_URL=${PRODUCTION_API_URL} \
        apps/landing-page/
    
    log_success "Images built successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f docker-compose.${DEPLOYMENT_ENV}.yml \
        run --rm backend npm run migrate:prod
    
    if [ $? -eq 0 ]; then
        log_success "Migrations completed successfully"
    else
        log_error "Migrations failed"
        exit 1
    fi
}

# Deploy services
deploy_services() {
    log_info "Deploying services..."
    
    # Export environment
    export DEPLOYMENT_VERSION
    
    # Deploy with zero downtime
    docker-compose -f docker-compose.${DEPLOYMENT_ENV}.yml up -d --scale backend=3
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    local services=("backend" "admin-panel" "landing-page" "nginx")
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.${DEPLOYMENT_ENV}.yml ps | grep -q "${service}.*Up.*healthy"; then
            log_success "$service is healthy"
        else
            log_error "$service is not healthy"
            if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
                rollback_deployment
            fi
            exit 1
        fi
    done
    
    log_success "All services deployed successfully"
}

# Run health checks
run_health_checks() {
    if [ "$RUN_HEALTH_CHECKS" = "true" ]; then
        log_info "Running health checks..."
        
        # Check API health
        if curl -f -s https://api.upcoach.ai/health > /dev/null; then
            log_success "API health check passed"
        else
            log_error "API health check failed"
            exit 1
        fi
        
        # Check landing page
        if curl -f -s https://upcoach.ai > /dev/null; then
            log_success "Landing page health check passed"
        else
            log_error "Landing page health check failed"
            exit 1
        fi
        
        # Check admin panel
        if curl -f -s https://admin.upcoach.ai > /dev/null; then
            log_success "Admin panel health check passed"
        else
            log_error "Admin panel health check failed"
            exit 1
        fi
        
        log_success "All health checks passed"
    fi
}

# Cleanup old images
cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old versions (keep last 3)
    docker images | grep upcoach | sort -k2 -r | tail -n +4 | awk '{print $3}' | xargs -r docker rmi -f || true
    
    log_success "Cleanup completed"
}

# Send deployment notification
send_notification() {
    log_info "Sending deployment notification..."
    
    local status=$1
    local message=$2
    
    # Send to Slack
    if [ ! -z "$WEBHOOK_SLACK_ALERTS" ]; then
        curl -X POST $WEBHOOK_SLACK_ALERTS \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Deployment ${status}: ${message}\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "SUCCESS" ] && echo "good" || echo "danger")\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"${DEPLOYMENT_ENV}\", \"short\": true},
                        {\"title\": \"Version\", \"value\": \"${DEPLOYMENT_VERSION}\", \"short\": true},
                        {\"title\": \"Deployed By\", \"value\": \"$(whoami)\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }"
    fi
    
    # Log to file
    echo "[$(date)] Deployment ${status}: ${message}" >> deployments.log
}

# Rollback deployment
rollback_deployment() {
    log_error "Rolling back deployment..."
    
    # Get previous version
    local previous_version=$(docker images | grep upcoach/backend | awk '{print $2}' | sort -r | sed -n '2p')
    
    if [ ! -z "$previous_version" ]; then
        DEPLOYMENT_VERSION=$previous_version
        deploy_services
        send_notification "ROLLBACK" "Rolled back to version $previous_version"
    else
        log_error "No previous version found for rollback"
        exit 1
    fi
}

# Main deployment flow
main() {
    log_info "Starting production deployment..."
    log_info "Environment: ${DEPLOYMENT_ENV}"
    log_info "Version: ${DEPLOYMENT_VERSION}"
    
    # Load environment variables
    source .env.${DEPLOYMENT_ENV}
    
    # Execute deployment steps
    check_prerequisites
    create_backup
    pull_latest_code
    build_images
    run_migrations
    deploy_services
    run_health_checks
    cleanup_old_images
    
    # Success notification
    send_notification "SUCCESS" "Deployment completed successfully"
    log_success "Production deployment completed successfully!"
    
    # Show deployment summary
    echo -e "\n${GREEN}=== Deployment Summary ===${NC}"
    echo -e "Environment: ${BLUE}${DEPLOYMENT_ENV}${NC}"
    echo -e "Version: ${BLUE}${DEPLOYMENT_VERSION}${NC}"
    echo -e "Time: ${BLUE}$(date)${NC}"
    echo -e "Status: ${GREEN}SUCCESS${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo -e "1. Monitor application logs: ${BLUE}docker-compose -f docker-compose.${DEPLOYMENT_ENV}.yml logs -f${NC}"
    echo -e "2. Check metrics: ${BLUE}https://monitoring.upcoach.ai${NC}"
    echo -e "3. Run smoke tests: ${BLUE}./scripts/smoke-tests.sh${NC}"
}

# Handle errors
trap 'log_error "Deployment failed at line $LINENO"; send_notification "FAILED" "Deployment failed"; exit 1' ERR

# Run main function
main