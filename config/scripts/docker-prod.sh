#!/bin/bash
# UpCoach Production Docker Management Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_DIR="$PROJECT_ROOT/config"

# Load environment
if [ -f "$CONFIG_DIR/environments/.env.production" ]; then
    export $(cat "$CONFIG_DIR/environments/.env.production" | grep -v '^#' | xargs)
fi

# Docker Compose files
COMPOSE_FILES=(
    "-f $CONFIG_DIR/docker/docker-compose.base.yml"
    "-f $CONFIG_DIR/docker/docker-compose.production.yml"
)

COMPOSE_CMD="docker compose ${COMPOSE_FILES[*]}"

case "$1" in
    "up")
        echo "Starting UpCoach production environment..."

        # Pre-deployment checks
        echo "Running pre-deployment checks..."
        if [ -z "$DATABASE_URL" ]; then
            echo "ERROR: DATABASE_URL not set"
            exit 1
        fi
        if [ -z "$JWT_SECRET" ]; then
            echo "ERROR: JWT_SECRET not set"
            exit 1
        fi

        $COMPOSE_CMD up -d
        echo "Production environment started!"
        ;;
    "down")
        echo "Stopping UpCoach production environment..."
        $COMPOSE_CMD down
        ;;
    "restart")
        echo "Restarting UpCoach production environment..."
        $COMPOSE_CMD restart
        ;;
    "logs")
        $COMPOSE_CMD logs -f "${@:2}"
        ;;
    "build")
        echo "Building UpCoach production containers..."
        $COMPOSE_CMD build "${@:2}"
        ;;
    "deploy")
        echo "Deploying UpCoach to production..."

        # Build images
        echo "Building production images..."
        $COMPOSE_CMD build

        # Run database migrations
        echo "Running database migrations..."
        $COMPOSE_CMD run --rm backend-api npm run migrate

        # Start services
        echo "Starting production services..."
        $COMPOSE_CMD up -d

        # Health checks
        echo "Waiting for services to be healthy..."
        sleep 30
        $COMPOSE_CMD ps

        echo "Production deployment complete!"
        ;;
    "backup")
        echo "Creating production backup..."
        BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
        $COMPOSE_CMD exec postgres pg_dump -U ${DB_USER} ${DB_NAME} > "$BACKUP_FILE"
        echo "Backup created: $BACKUP_FILE"
        ;;
    "restore")
        if [ -z "$2" ]; then
            echo "Usage: $0 restore <backup_file>"
            exit 1
        fi
        echo "Restoring from backup: $2"
        $COMPOSE_CMD exec -T postgres psql -U ${DB_USER} ${DB_NAME} < "$2"
        ;;
    "monitoring")
        echo "Starting monitoring services..."
        $COMPOSE_CMD --profile monitoring up -d
        echo "Monitoring available at:"
        echo "  - Prometheus: http://localhost:9090"
        echo "  - Grafana: http://localhost:3000"
        ;;
    "status")
        $COMPOSE_CMD ps
        ;;
    "health")
        echo "Checking service health..."
        for service in landing-page admin-panel cms-panel backend-api; do
            if $COMPOSE_CMD exec $service curl -f http://localhost/health &>/dev/null; then
                echo "✓ $service: healthy"
            else
                echo "✗ $service: unhealthy"
            fi
        done
        ;;
    *)
        echo "UpCoach Production Docker Management"
        echo "Usage: $0 {up|down|restart|logs|build|deploy|backup|restore|monitoring|status|health}"
        echo ""
        echo "Commands:"
        echo "  up         - Start production environment"
        echo "  down       - Stop production environment"
        echo "  restart    - Restart all services"
        echo "  logs       - Show logs"
        echo "  build      - Build containers"
        echo "  deploy     - Full production deployment"
        echo "  backup     - Create database backup"
        echo "  restore    - Restore from backup"
        echo "  monitoring - Start monitoring services"
        echo "  status     - Show service status"
        echo "  health     - Check service health"
        exit 1
        ;;
esac