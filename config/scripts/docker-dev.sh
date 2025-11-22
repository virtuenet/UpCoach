#!/bin/bash
# UpCoach Development Docker Management Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_DIR="$PROJECT_ROOT/config"

# Load environment
if [ -f "$CONFIG_DIR/environments/.env.development" ]; then
    export $(cat "$CONFIG_DIR/environments/.env.development" | grep -v '^#' | xargs)
fi

# Docker Compose files
COMPOSE_FILES=(
    "-f $CONFIG_DIR/docker/docker-compose.base.yml"
    "-f $CONFIG_DIR/docker/docker-compose.development.yml"
)

# Add override file if it exists
if [ -f "$CONFIG_DIR/docker/docker-compose.override.yml" ]; then
    COMPOSE_FILES+=("-f $CONFIG_DIR/docker/docker-compose.override.yml")
fi

COMPOSE_CMD="docker compose ${COMPOSE_FILES[*]}"

case "$1" in
    "up")
        echo "Starting UpCoach development environment..."
        $COMPOSE_CMD up -d
        echo "Development environment started!"
        echo "Services available at:"
        echo "  - Landing Page: http://localhost:3000"
        echo "  - Admin Panel: http://localhost:3001"
        echo "  - CMS Panel: http://localhost:3002"
        echo "  - API: http://localhost:8080"
        echo "  - PgAdmin: http://localhost:5050"
        echo "  - MailHog: http://localhost:8025"
        ;;
    "down")
        echo "Stopping UpCoach development environment..."
        $COMPOSE_CMD down
        ;;
    "restart")
        echo "Restarting UpCoach development environment..."
        $COMPOSE_CMD restart
        ;;
    "logs")
        $COMPOSE_CMD logs -f "${@:2}"
        ;;
    "build")
        echo "Building UpCoach development containers..."
        $COMPOSE_CMD build "${@:2}"
        ;;
    "shell")
        if [ -z "$2" ]; then
            echo "Usage: $0 shell <service_name>"
            exit 1
        fi
        $COMPOSE_CMD exec "$2" /bin/bash
        ;;
    "seed")
        echo "Seeding development database..."
        $COMPOSE_CMD --profile seed up db-seed
        ;;
    "test")
        echo "Running development tests..."
        $COMPOSE_CMD -f "$CONFIG_DIR/docker/docker-compose.testing.yml" up --abort-on-container-exit
        ;;
    "status")
        $COMPOSE_CMD ps
        ;;
    *)
        echo "UpCoach Development Docker Management"
        echo "Usage: $0 {up|down|restart|logs|build|shell|seed|test|status}"
        echo ""
        echo "Commands:"
        echo "  up      - Start development environment"
        echo "  down    - Stop development environment"
        echo "  restart - Restart all services"
        echo "  logs    - Show logs (optionally for specific service)"
        echo "  build   - Build containers"
        echo "  shell   - Access service shell"
        echo "  seed    - Seed development database"
        echo "  test    - Run tests"
        echo "  status  - Show service status"
        exit 1
        ;;
esac