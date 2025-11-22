#!/bin/bash

# Production Readiness Validation Script
# Validates all components for production deployment

set -e

echo "🚀 UpCoach Production Deployment Readiness Check"
echo "=============================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

check_status() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

warning() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    WARNINGS=$((WARNINGS + 1))
}

info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

echo "1. Docker Configuration Validation"
echo "=================================="

# Check if Docker is installed
if command -v docker >/dev/null 2>&1; then
    check_status 0 "Docker is installed and available"
else
    check_status 1 "Docker is not installed or not in PATH"
fi

# Check if Docker Compose is available
if command -v docker-compose >/dev/null 2>&1; then
    check_status 0 "Docker Compose is installed and available"
else
    check_status 1 "Docker Compose is not installed or not in PATH"
fi

# Validate Docker Compose configuration
if docker-compose -f docker-compose.production.yml config --quiet >/dev/null 2>&1; then
    check_status 0 "Docker Compose production configuration is valid"
else
    check_status 1 "Docker Compose production configuration has errors"
fi

echo
echo "2. Service Dockerfile Validation"
echo "================================"

# Check for production Dockerfiles
SERVICES=("apps/landing-page" "apps/admin-panel" "apps/cms-panel" "services/api")
for service in "${SERVICES[@]}"; do
    if [ -f "$service/Dockerfile.production" ]; then
        check_status 0 "$service has production Dockerfile"
    else
        check_status 1 "$service missing production Dockerfile"
    fi
done

echo
echo "3. Environment Configuration"
echo "=========================="

# Check for environment files
if [ -f ".env.production" ]; then
    check_status 0 "Production environment file exists"
else
    check_status 1 "Production environment file (.env.production) missing"
fi

if [ -f ".env.production.example" ]; then
    check_status 0 "Production environment example file exists"
else
    warning "Production environment example file missing"
fi

echo
echo "4. Service Dependencies"
echo "====================="

# Check package.json files
for service in "${SERVICES[@]}"; do
    if [ -f "$service/package.json" ]; then
        check_status 0 "$service has package.json"
    else
        check_status 1 "$service missing package.json"
    fi
done

echo
echo "5. Next.js Configuration"
echo "======================="

# Check Next.js landing page configuration
if [ -f "apps/landing-page/next.config.js" ]; then
    check_status 0 "Next.js configuration file exists"

    # Check for standalone output configuration
    if grep -q "output.*standalone" apps/landing-page/next.config.js; then
        check_status 0 "Next.js standalone output configured for Docker"
    else
        check_status 1 "Next.js standalone output not configured"
    fi

    # Check for images configuration
    if grep -q "images.unsplash.com" apps/landing-page/next.config.js; then
        check_status 0 "Next.js images configuration for Unsplash is present"
    else
        check_status 1 "Next.js images configuration missing"
    fi
else
    check_status 1 "Next.js configuration file missing"
fi

echo
echo "6. Health Check Endpoints"
echo "======================="

# Check for health check endpoints
if [ -f "apps/landing-page/src/app/api/health/route.ts" ]; then
    check_status 0 "Landing page health check endpoint exists"
else
    check_status 1 "Landing page health check endpoint missing"
fi

echo
echo "7. Security Configuration"
echo "======================="

# Check for security-related files
if [ -f "services/api/Dockerfile.secure" ]; then
    check_status 0 "API service has security Dockerfile"
else
    warning "API service security Dockerfile not found"
fi

echo
echo "8. Monitoring & Observability"
echo "============================"

# Check for monitoring configuration
if [ -f "monitoring/prometheus.yml" ]; then
    check_status 0 "Prometheus configuration exists"
else
    warning "Prometheus configuration missing"
fi

if [ -f "monitoring/grafana/provisioning" ]; then
    check_status 0 "Grafana provisioning configuration exists"
else
    warning "Grafana provisioning configuration missing"
fi

echo
echo "9. Nginx Configuration"
echo "===================="

# Check for Nginx configuration
if [ -d "nginx" ]; then
    check_status 0 "Nginx configuration directory exists"

    if [ -f "nginx/nginx.conf" ]; then
        check_status 0 "Nginx main configuration exists"
    else
        warning "Nginx main configuration missing"
    fi

    if [ -d "nginx/conf.d" ]; then
        check_status 0 "Nginx virtual host configuration directory exists"
    else
        warning "Nginx virtual host configuration directory missing"
    fi
else
    warning "Nginx configuration directory missing"
fi

echo
echo "10. Database & Migration Scripts"
echo "==============================="

# Check for database scripts
if [ -d "scripts" ]; then
    check_status 0 "Scripts directory exists"

    if [ -f "scripts/postgres-backup.sh" ]; then
        check_status 0 "PostgreSQL backup script exists"
    else
        warning "PostgreSQL backup script missing"
    fi
else
    warning "Scripts directory missing"
fi

echo
echo "📊 DEPLOYMENT READINESS SUMMARY"
echo "==============================="
echo -e "Total Checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo

# Calculate success rate
SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "Success Rate: ${SUCCESS_RATE}%"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo
    echo -e "${GREEN}🎉 PRODUCTION READY!${NC}"
    echo "All critical checks passed. The platform is ready for production deployment."
    echo
    echo "Next Steps:"
    echo "1. Set up production environment variables in .env.production"
    echo "2. Configure SSL certificates in nginx/ssl/"
    echo "3. Set up monitoring credentials (DataDog, Grafana)"
    echo "4. Configure backup S3 bucket and AWS credentials"
    echo "5. Run: docker-compose -f docker-compose.production.yml up -d"
    exit 0
else
    echo
    echo -e "${RED}🚨 NOT PRODUCTION READY${NC}"
    echo "$FAILED_CHECKS critical issues need to be resolved before deployment."
    exit 1
fi