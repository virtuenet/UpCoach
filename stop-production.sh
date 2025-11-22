#!/bin/bash

# UpCoach Production Stop Script

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$PROJECT_ROOT/.upcoach.pid"

echo -e "${YELLOW}Stopping UpCoach production services...${NC}"

# Stop PM2 services if PM2 is available
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Stopping PM2 services...${NC}"
    pm2 stop upcoach-api 2>/dev/null || true
    pm2 delete upcoach-api 2>/dev/null || true
    echo -e "${GREEN}✅ PM2 services stopped${NC}"
fi

# Stop process using PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping process $PID...${NC}"
        kill "$PID"
        sleep 2
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}Force stopping process $PID...${NC}"
            kill -9 "$PID" 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ Process stopped${NC}"
    fi
    rm -f "$PID_FILE"
fi

echo -e "${GREEN}✅ UpCoach production services stopped${NC}"