#!/bin/bash

# UpCoach Staging Deployment Script
# This script deploys the application to the staging environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="/opt/upcoach-staging"
BACKUP_DIR="/opt/upcoach-backups"
LOG_FILE="/var/log/upcoach-staging-deploy.log"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Function to log output
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root or with sudo"
   exit 1
fi

print_status "Starting UpCoach staging deployment..."
log "Starting deployment"

# 1. Check prerequisites
print_status "Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed"
    exit 1
fi

# 2. Create necessary directories
print_status "Creating directories..."
mkdir -p "$DEPLOY_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# 3. Backup existing deployment if it exists
if [ -d "$DEPLOY_DIR/upcoach-project" ]; then
    print_status "Backing up existing deployment..."
    BACKUP_NAME="backup-$(date +'%Y%m%d-%H%M%S')"
    cp -r "$DEPLOY_DIR/upcoach-project" "$BACKUP_DIR/$BACKUP_NAME"
    log "Created backup: $BACKUP_NAME"
fi

# 4. Clone or update repository
cd "$DEPLOY_DIR"

if [ -d "upcoach-project" ]; then
    print_status "Updating existing repository..."
    cd upcoach-project
    git stash
    git pull origin main
    log "Updated repository"
else
    print_status "Cloning repository..."
    git clone https://github.com/yourusername/upcoach-project.git
    cd upcoach-project
    log "Cloned repository"
fi

# 5. Copy environment files
print_status "Setting up environment files..."

# Check if .env.staging exists
if [ ! -f ".env.staging" ]; then
    print_error ".env.staging file not found. Please create it with the necessary environment variables."
    print_warning "Example: cp .env.example .env.staging"
    exit 1
fi

# Use staging environment
cp .env.staging .env
log "Environment files configured"

# 6. Build Docker images
print_status "Building Docker images..."
docker-compose -f docker-compose.staging.yml build
log "Docker images built"

# 7. Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.staging.yml run --rm backend npm run migrate
log "Database migrations completed"

# 8. Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.staging.yml down
log "Existing containers stopped"

# 9. Start new containers
print_status "Starting new containers..."
docker-compose -f docker-compose.staging.yml up -d
log "New containers started"

# 10. Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
SERVICES=("backend" "admin-panel" "landing-page" "postgres" "redis")
ALL_HEALTHY=true

for SERVICE in "${SERVICES[@]}"; do
    if docker-compose -f docker-compose.staging.yml ps | grep "$SERVICE" | grep -q "Up"; then
        print_status "$SERVICE is running"
    else
        print_error "$SERVICE is not running"
        ALL_HEALTHY=false
    fi
done

if [ "$ALL_HEALTHY" = false ]; then
    print_error "Some services failed to start. Check logs with: docker-compose -f docker-compose.staging.yml logs"
    exit 1
fi

# 11. Run health checks
print_status "Running health checks..."

# Check backend API
if curl -f -s http://localhost:8081/health > /dev/null; then
    print_status "Backend API is healthy"
else
    print_error "Backend API health check failed"
fi

# Check admin panel
if curl -f -s http://localhost:8007 > /dev/null; then
    print_status "Admin panel is healthy"
else
    print_error "Admin panel health check failed"
fi

# Check landing page
if curl -f -s http://localhost:8006 > /dev/null; then
    print_status "Landing page is healthy"
else
    print_error "Landing page health check failed"
fi

# 12. Clean up old Docker resources
print_status "Cleaning up old Docker resources..."
docker system prune -f --volumes
log "Docker cleanup completed"

# 13. Set up monitoring alerts (optional)
print_status "Setting up monitoring..."
# Add any monitoring setup here

# 14. Deployment summary
print_status "Deployment completed successfully!"
echo ""
echo "Deployment Summary:"
echo "==================="
echo "Backend API: http://localhost:8081"
echo "Admin Panel: http://localhost:8007"
echo "Landing Page: http://localhost:8006"
echo "Prometheus: http://localhost:9091"
echo "Grafana: http://localhost:3001"
echo ""
echo "To view logs: docker-compose -f docker-compose.staging.yml logs -f"
echo "To stop services: docker-compose -f docker-compose.staging.yml down"
echo ""

log "Deployment completed successfully"

# 15. Send notification (optional)
# You can add email or Slack notification here

exit 0