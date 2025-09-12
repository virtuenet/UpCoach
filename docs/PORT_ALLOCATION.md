# UpCoach Port Allocation Guide

## Overview

The UpCoach platform uses ports in the 1000s range for local development to avoid conflicts with common system services and other development tools. This document provides a comprehensive guide to the port allocation strategy.

## Port Allocation Table

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Backend API | 1080 | http://localhost:1080 | Express/TypeScript API service |
| Landing Page | 1005 | http://localhost:1005 | Next.js marketing website |
| Admin Panel | 1006 | http://localhost:1006 | React/Vite admin dashboard |
| CMS Panel | 1007 | http://localhost:1007 | React/Vite content management |
| PostgreSQL | 1433 | localhost:1433 | Database service |
| Redis | 1003 | localhost:1003 | Cache and session storage |
| Mailhog SMTP | 1008 | localhost:1008 | Email testing (SMTP) |
| Mailhog Web UI | 1030 | http://localhost:1030 | Email testing web interface |
| PgAdmin | 1009 | http://localhost:1009 | Database management tool |

## Quick Commands

### Port Verification
```bash
# Check if all ports are available
make verify-ports

# Alternative command
make check-ports
```

### Service URLs
```bash
# Display all service URLs
make urls
```

### Health Checks
```bash
# Check health of all running services
make health
```

## Starting Services

### All Services
```bash
# Start all services with Docker Compose
make dev

# Alternative: Start specific services
make up
```

### Individual Services
```bash
# Frontend services (for development with hot-reload)
make dev-landing    # Next.js landing page on port 1005
make dev-admin      # React admin panel on port 1006
make dev-cms        # React CMS panel on port 1007

# Mobile app
make dev-mobile     # Flutter mobile app
```

### Backend Services
```bash
# Start database and backend services
make up             # Docker services (PostgreSQL, Redis, API)
```

## Configuration Files

### Environment Variables
The following files contain port configurations:

- **Root Configuration**: `/.env`
- **Backend API**: `/services/api/.env`
- **Landing Page**: `/apps/landing-page/.env`
- **Docker Services**: `/docker-compose.yml`

### Key Environment Variables
```bash
# Backend API
PORT=1080
API_URL=http://localhost:1080

# Database
DATABASE_URL=postgresql://upcoach:upcoach_secure_pass@localhost:1433/upcoach_db
DB_PORT=1433

# Redis
REDIS_URL=redis://localhost:1003

# Frontend Applications
NEXT_PUBLIC_API_URL=http://localhost:1080/api    # Landing Page
VITE_API_URL=http://localhost:1080              # Admin & CMS Panels
```

## Troubleshooting Port Conflicts

### Check for Port Conflicts
```bash
# Use our verification script
make verify-ports

# Manual check for specific port
lsof -i :1080
```

### Resolve Port Conflicts
```bash
# Kill process using a specific port (be careful!)
sudo lsof -ti:PORT_NUMBER | xargs kill -9

# Example: Kill process on port 1080
sudo lsof -ti:1080 | xargs kill -9
```

### Common Port Conflicts
- **Ports 1024-1025**: Often used by system services
- **Port 1433**: May conflict with SQL Server on Windows
- **Port 1080**: May conflict with SOCKS proxies

## Development Workflow

### 1. Pre-Start Verification
```bash
# Always verify ports before starting
make verify-ports
```

### 2. Start Core Services
```bash
# Start database and backend services first
docker-compose up -d postgres redis backend-api

# Wait for services to be healthy
make health
```

### 3. Start Frontend Services
```bash
# Start frontend services for development
make dev-landing &
make dev-admin &
make dev-cms &
```

### 4. Verify All Services
```bash
# Check all service URLs
make urls

# Test service health
make health
```

## Service Dependencies

### Startup Order
1. **PostgreSQL** (port 1433) - Database must start first
2. **Redis** (port 1003) - Cache service
3. **Backend API** (port 1080) - Requires database and Redis
4. **Frontend Services** (ports 1005, 1006, 1007) - Require backend API

### Inter-Service Communication
- **Frontend → Backend**: All frontend services connect to backend API on port 1080
- **Backend → Database**: Backend connects to PostgreSQL on port 1433
- **Backend → Cache**: Backend uses Redis on port 1003

## Production vs Development

### Development (Local)
- Uses ports in 1000s range to avoid conflicts
- Services run on localhost
- CORS enabled for cross-origin requests
- Hot-reload enabled for frontend services

### Production
- Uses standard ports (80, 443) behind load balancer
- Services communicate via internal network
- CORS restricted to specific domains
- Optimized builds without hot-reload

## Security Considerations

### Firewall Rules
The following ports should only be accessible locally during development:
- 1003 (Redis) - No authentication in dev mode
- 1433 (PostgreSQL) - Contains development data
- 1008 (Mailhog SMTP) - Email testing only

### Network Access
```bash
# Services bind to localhost only
# External access requires explicit configuration
```

## Monitoring and Logging

### Service Status
```bash
# Docker services status
make status

# Health check all services
make health

# View service logs
make logs
```

### Individual Service Logs
```bash
make logs-api       # Backend API logs
make logs-landing   # Landing page logs
make logs-admin     # Admin panel logs
make logs-cms       # CMS panel logs
```

## Advanced Configuration

### Custom Port Allocation
To use different ports, update the following files:

1. **Docker Compose**: Update port mappings in `docker-compose.yml`
2. **Environment Files**: Update PORT variables in `.env` files
3. **Vite Config**: Update server.port in `vite.config.ts` files
4. **API Clients**: Update BASE_URL in service configuration files

### Example: Change Admin Panel Port
```bash
# 1. Update docker-compose.yml
- "1010:3001"  # Change from 1006 to 1010

# 2. Update vite.config.ts
server: {
  port: 1010,  # Change from 1006
}

# 3. Update verification script
"Admin-Panel:1010"  # Update in scripts/verify-ports.sh
```

## Migration from 8000s Ports

This guide represents the migration from the previous port allocation:
- 8005 → 1005 (Landing Page)
- 8006 → 1006 (Admin Panel)  
- 8007 → 1007 (CMS Panel)
- 8080 → 1080 (Backend API)
- 5432 → 1433 (PostgreSQL)
- 6379 → 1003 (Redis)

All configuration files have been updated to use the new port allocation.

## Support

For issues with port configuration:
1. Run `make verify-ports` to check for conflicts
2. Check service logs with `make logs`
3. Verify environment variables are set correctly
4. Ensure Docker services are healthy with `make status`

## References

- [Docker Compose Configuration](../docker-compose.yml)
- [Port Verification Script](../scripts/verify-ports.sh)
- [Makefile Commands](../Makefile)
- [CLAUDE.md Development Guide](../CLAUDE.md)