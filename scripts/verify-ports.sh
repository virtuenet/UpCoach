#!/bin/bash

# UpCoach Port Verification Script
# This script verifies that all configured ports are available and services can start

echo "🔍 UpCoach Port Configuration Verification"
echo "=========================================="

# Define services and ports (bash 3 compatible)
SERVICES_LIST=(
    "Backend-API:1080"
    "Landing-Page:1005" 
    "Admin-Panel:1006"
    "CMS-Panel:1007"
    "PostgreSQL:1433"
    "Redis:1003"
    "Mailhog-SMTP:1008"
    "Mailhog-Web:1030"
    "PgAdmin:1009"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "📋 Current Port Allocation:"
echo "=========================="
for entry in "${SERVICES_LIST[@]}"; do
    service=$(echo "$entry" | cut -d':' -f1)
    port=$(echo "$entry" | cut -d':' -f2)
    printf "%-20s : %s\n" "$service" "$port"
done

echo ""
echo "🔍 Checking Port Availability:"
echo "============================="

conflicts=0

for entry in "${SERVICES_LIST[@]}"; do
    service=$(echo "$entry" | cut -d':' -f1)
    port=$(echo "$entry" | cut -d':' -f2)
    
    # Check if port is in use
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${RED}❌ Port $port ($service) is already in use${NC}"
        conflicts=$((conflicts + 1))
        
        # Show what's using the port
        echo "   Process details:"
        lsof -i :$port | sed 's/^/   /'
        echo ""
    else
        echo -e "${GREEN}✅ Port $port ($service) is available${NC}"
    fi
done

echo ""
if [ $conflicts -eq 0 ]; then
    echo -e "${GREEN}🎉 All ports are available! You can start the development environment.${NC}"
    echo ""
    echo -e "${BLUE}To start all services:${NC}"
    echo -e "${YELLOW}make dev${NC}"
    echo ""
    echo -e "${BLUE}To start individual services:${NC}"
    echo -e "${YELLOW}make dev-landing  # Landing Page on port 1005${NC}"
    echo -e "${YELLOW}make dev-admin    # Admin Panel on port 1006${NC}" 
    echo -e "${YELLOW}make dev-cms      # CMS Panel on port 1007${NC}"
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo -e "${YELLOW}Backend API:  http://localhost:1080${NC}"
    echo -e "${YELLOW}Landing Page: http://localhost:1005${NC}"
    echo -e "${YELLOW}Admin Panel:  http://localhost:1006${NC}"
    echo -e "${YELLOW}CMS Panel:    http://localhost:1007${NC}"
    echo -e "${YELLOW}Mailhog:      http://localhost:1030${NC}"
    echo -e "${YELLOW}PgAdmin:      http://localhost:1009${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Found $conflicts port conflict(s). Please stop the conflicting processes before starting UpCoach.${NC}"
    echo ""
    echo -e "${BLUE}To stop conflicting processes, you can use:${NC}"
    echo -e "${YELLOW}sudo lsof -ti:PORT_NUMBER | xargs kill -9${NC}"
    echo -e "${BLUE}(Replace PORT_NUMBER with the conflicting port)${NC}"
    exit 1
fi