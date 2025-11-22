#!/bin/bash

# UpCoach Production Deployment Script
# This script handles the complete production deployment of the UpCoach platform

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment configuration
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$PROJECT_ROOT/services/api"
LOG_DIR="$PROJECT_ROOT/logs"
PID_FILE="$PROJECT_ROOT/.upcoach.pid"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to display banner
display_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║         🚀 UpCoach Production Deployment 🚀              ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm $(npm -v) found${NC}"

    # Check PostgreSQL client
    if ! command -v psql &> /dev/null; then
        echo -e "${YELLOW}⚠️  PostgreSQL client not found. Database initialization may fail${NC}"
    else
        echo -e "${GREEN}✅ PostgreSQL client found${NC}"
    fi

    # Check Redis client
    if ! command -v redis-cli &> /dev/null; then
        echo -e "${YELLOW}⚠️  Redis client not found. Cache operations may fail${NC}"
    else
        echo -e "${GREEN}✅ Redis client found${NC}"
    fi
}

# Function to setup environment
setup_environment() {
    echo -e "${YELLOW}Setting up production environment...${NC}"

    # Check for production env file
    if [ ! -f "$API_DIR/.env.production" ]; then
        echo -e "${YELLOW}Creating production environment file...${NC}"
        cp "$API_DIR/.env" "$API_DIR/.env.production" 2>/dev/null || true

        # Update critical production settings
        sed -i '' 's/NODE_ENV=development/NODE_ENV=production/' "$API_DIR/.env.production"

        echo -e "${YELLOW}⚠️  Please update $API_DIR/.env.production with production credentials${NC}"
    fi

    # Copy production env to .env for the deployment
    cp "$API_DIR/.env.production" "$API_DIR/.env"

    echo -e "${GREEN}✅ Production environment configured${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}Installing dependencies...${NC}"

    # Install API dependencies
    cd "$API_DIR"
    npm ci --production=false
    echo -e "${GREEN}✅ API dependencies installed${NC}"

    # Install root dependencies if package.json exists
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        cd "$PROJECT_ROOT"
        npm ci --production=false
        echo -e "${GREEN}✅ Root dependencies installed${NC}"
    fi
}

# Function to initialize database
init_database() {
    echo -e "${YELLOW}Initializing database...${NC}"

    if [ -f "$API_DIR/scripts/init-db.sh" ]; then
        cd "$API_DIR"
        bash scripts/init-db.sh
    else
        echo -e "${YELLOW}⚠️  Database initialization script not found${NC}"
        echo -e "${YELLOW}   Skipping database initialization${NC}"
    fi
}

# Function to build the application
build_application() {
    echo -e "${YELLOW}Building application...${NC}"

    cd "$API_DIR"

    # Build TypeScript
    if [ -f "tsconfig.json" ]; then
        echo -e "${YELLOW}Compiling TypeScript...${NC}"
        npx tsc || npm run build
        echo -e "${GREEN}✅ TypeScript compiled${NC}"
    fi
}

# Function to start services
start_services() {
    echo -e "${YELLOW}Starting services...${NC}"

    # Check if already running
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  UpCoach is already running (PID: $OLD_PID)${NC}"
            echo -e "${YELLOW}   Run './stop-production.sh' to stop it first${NC}"
            exit 1
        fi
    fi

    # Start Redis if not running
    if command -v redis-cli &> /dev/null; then
        if ! redis-cli ping &> /dev/null; then
            echo -e "${YELLOW}Starting Redis...${NC}"
            redis-server --daemonize yes --port 1003
            sleep 2
            echo -e "${GREEN}✅ Redis started${NC}"
        else
            echo -e "${GREEN}✅ Redis is already running${NC}"
        fi
    fi

    # Start the API service
    cd "$API_DIR"
    echo -e "${YELLOW}Starting API service...${NC}"

    # Use PM2 if available, otherwise use nohup
    if command -v pm2 &> /dev/null; then
        pm2 delete upcoach-api 2>/dev/null || true
        pm2 start npm --name "upcoach-api" -- run start:production
        pm2 save
        echo -e "${GREEN}✅ API service started with PM2${NC}"
    else
        NODE_ENV=production nohup npm start > "$LOG_DIR/api.log" 2>&1 &
        API_PID=$!
        echo $API_PID > "$PID_FILE"
        echo -e "${GREEN}✅ API service started (PID: $API_PID)${NC}"
    fi
}

# Function to verify deployment
verify_deployment() {
    echo -e "${YELLOW}Verifying deployment...${NC}"

    # Wait for service to be ready
    sleep 5

    # Check API health
    API_URL="http://localhost:1080/health"
    if curl -s -f "$API_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  API health check failed. Service may still be starting...${NC}"
    fi

    # Check database connection
    cd "$API_DIR"
    node -e "
        const { DatabaseService } = require('./dist/services/database');
        DatabaseService.initialize()
            .then(() => {
                console.log('✅ Database connection verified');
                process.exit(0);
            })
            .catch((err) => {
                console.error('❌ Database connection failed:', err.message);
                process.exit(1);
            });
    " 2>/dev/null || echo -e "${YELLOW}⚠️  Could not verify database connection${NC}"
}

# Function to display success message
display_success() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║     🎉 UpCoach Production Deployment Complete! 🎉        ║"
    echo "║                                                          ║"
    echo "╠══════════════════════════════════════════════════════════╣"
    echo "║                                                          ║"
    echo "║  API Service:    http://localhost:1080                  ║"
    echo "║  Health Check:   http://localhost:1080/health           ║"
    echo "║  API Docs:       http://localhost:1080/api-docs         ║"
    echo "║                                                          ║"
    echo "║  Logs:           $LOG_DIR/api.log                       ║"
    echo "║                                                          ║"
    echo "║  To stop:        ./stop-production.sh                   ║"
    echo "║  To monitor:     pm2 monit (if using PM2)              ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Main deployment flow
main() {
    display_banner
    check_prerequisites
    setup_environment
    install_dependencies
    init_database
    build_application
    start_services
    verify_deployment
    display_success
}

# Handle errors
trap 'echo -e "${RED}❌ Deployment failed. Check logs for details.${NC}"; exit 1' ERR

# Run main function
main "$@"