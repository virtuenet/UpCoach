#!/bin/bash

# UpCoach Development Environment Startup Script
# This script starts all services with the new 1000s range port configuration

set -e  # Exit on any error

echo "🚀 Starting UpCoach Development Environment"
echo "=================================================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Stop any existing services
echo "🛑 Stopping existing services..."
docker-compose down

# Start infrastructure services first (PostgreSQL, Redis)
echo "🔧 Starting infrastructure services..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check database health
echo "🔍 Checking database health..."
docker-compose exec postgres pg_isready -U upcoach

# Start application services
echo "🌐 Starting application services..."
docker-compose up -d landing-page admin-panel cms-panel backend-api

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

# Show service status
echo "📊 Service Status:"
echo "=================================================="
docker-compose ps

# Show port mappings
echo ""
echo "🔗 Service URLs (1000s range ports):"
echo "=================================================="
echo "📱 Landing Page:    http://localhost:1005"
echo "⚙️  Admin Panel:     http://localhost:1006" 
echo "📝 CMS Panel:       http://localhost:1007"
echo "🔌 Backend API:     http://localhost:1080"
echo "💾 PostgreSQL:      localhost:1433"
echo "🔴 Redis:           localhost:1003"

# Health check
echo ""
echo "🩺 Running health checks..."
echo "=================================================="

# Wait a bit more for services to fully initialize
sleep 5

# Check service health
check_service() {
    local url=$1
    local name=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "⚠️  $name is starting (may take a moment)"
    fi
}

check_service "http://localhost:1005" "Landing Page"
check_service "http://localhost:1006" "Admin Panel"  
check_service "http://localhost:1007" "CMS Panel"
check_service "http://localhost:1080/api/health" "Backend API"

echo ""
echo "🎉 UpCoach development environment is ready!"
echo "=================================================="
echo ""
echo "🔧 Useful commands:"
echo "  make logs          - View all service logs"
echo "  make logs-api      - View backend API logs"
echo "  make logs-admin    - View admin panel logs"
echo "  make down          - Stop all services"
echo "  make restart       - Restart all services"
echo ""
echo "📖 Check CLAUDE.md for more development commands and workflows"