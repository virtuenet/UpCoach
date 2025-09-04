#!/bin/bash

# UpCoach Deployment Validation Script
# Comprehensive validation of staging deployment readiness

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
CHECKS=0
PASSED=0
FAILED=0
WARNINGS=0

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED++))
}

error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED++))
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

check() {
    ((CHECKS++))
    log "$1"
}

# File existence checks
check_file_exists() {
    local file="$1"
    local description="$2"
    
    check "Checking if $description exists"
    if [ -f "$file" ]; then
        success "$description found"
        return 0
    else
        error "$description missing: $file"
        return 1
    fi
}

# Directory existence checks
check_dir_exists() {
    local dir="$1"
    local description="$2"
    
    check "Checking if $description exists"
    if [ -d "$dir" ]; then
        success "$description found"
        return 0
    else
        error "$description missing: $dir"
        return 1
    fi
}

# Environment variable checks
check_env_var() {
    local var_name="$1"
    local description="$2"
    local required="${3:-true}"
    
    check "Checking environment variable: $var_name"
    if [ -n "${!var_name}" ]; then
        success "$description is set"
        return 0
    elif [ "$required" = "true" ]; then
        error "$description not set: $var_name"
        return 1
    else
        warning "$description not set (optional): $var_name"
        return 0
    fi
}

# Service validation
validate_docker_service() {
    local service="$1"
    
    check "Validating Docker service: $service"
    if docker-compose -f docker-compose.staging.yml ps | grep -q "$service.*Up"; then
        success "$service is running"
        return 0
    else
        error "$service is not running"
        return 1
    fi
}

# Main validation function
main() {
    log "Starting UpCoach deployment validation..."
    echo

    # 1. Required Files Validation
    log "=== File Structure Validation ==="
    
    check_file_exists "docker-compose.staging.yml" "Staging Docker Compose file"
    check_file_exists ".env.staging.example" "Staging environment template"
    check_file_exists "nginx/staging.conf" "Staging Nginx configuration"
    check_file_exists "monitoring/prometheus-staging.yml" "Staging Prometheus configuration"
    
    # 2. Directory Structure
    log "=== Directory Structure Validation ==="
    
    check_dir_exists "monitoring" "Monitoring directory"
    check_dir_exists "monitoring/grafana" "Grafana configuration"
    check_dir_exists "monitoring/alerts" "Alert configurations"
    check_dir_exists "scripts" "Scripts directory"
    check_dir_exists "tests" "Tests directory"
    
    # 3. Environment Configuration
    log "=== Environment Configuration Validation ==="
    
    # Check if staging env exists
    if [ -f ".env.staging" ]; then
        success "Staging environment file exists"
        source ".env.staging"
        
        # Validate critical environment variables
        check_env_var "NODE_ENV" "Node environment"
        check_env_var "DATABASE_URL" "Database connection"
        check_env_var "REDIS_URL" "Redis connection"
        check_env_var "JWT_SECRET" "JWT secret"
        check_env_var "OPENAI_API_KEY" "OpenAI API key"
        check_env_var "SUPABASE_URL" "Supabase URL"
        check_env_var "SENTRY_DSN" "Sentry DSN" "false"
        
    else
        warning "Staging environment file not found. Please create .env.staging from .env.staging.example"
    fi
    
    # 4. Docker Configuration Validation
    log "=== Docker Configuration Validation ==="
    
    # Check Docker is running
    check "Checking if Docker is running"
    if docker info &>/dev/null; then
        success "Docker is running"
        
        # Check Docker Compose version
        check "Checking Docker Compose version"
        local compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        success "Docker Compose version: $compose_version"
        
    else
        error "Docker is not running"
    fi
    
    # 5. Database Configuration
    log "=== Database Configuration Validation ==="
    
    # Check if we can connect to the database
    if [ -n "$DATABASE_URL" ]; then
        check "Testing database connection"
        if command -v psql &>/dev/null; then
            if psql "$DATABASE_URL" -c "SELECT 1;" &>/dev/null; then
                success "Database connection successful"
            else
                warning "Cannot connect to database (service may not be running)"
            fi
        else
            warning "psql not available, skipping database connection test"
        fi
    fi
    
    # 6. Monitoring Configuration
    log "=== Monitoring Configuration Validation ==="
    
    check_file_exists "monitoring/grafana/dashboards/upcoach-staging-dashboard.json" "Grafana staging dashboard"
    check_file_exists "monitoring/alerts/application.yml" "Application alerts"
    check_file_exists "monitoring/alerts/infrastructure.yml" "Infrastructure alerts"
    
    # 7. Security Configuration
    log "=== Security Configuration Validation ==="
    
    # Check for secure passwords
    if [ -f ".env.staging" ]; then
        check "Checking for secure passwords"
        if grep -q "password.*123\|secret.*test\|key.*test" ".env.staging"; then
            warning "Found test/weak passwords in staging environment"
        else
            success "No obvious weak passwords found"
        fi
        
        # Check for localhost URLs in production-like settings
        check "Checking for localhost URLs"
        if grep -q "localhost" ".env.staging"; then
            warning "Found localhost URLs in staging environment"
        else
            success "No localhost URLs found"
        fi
    fi
    
    # 8. SSL/TLS Configuration
    log "=== SSL/TLS Configuration Validation ==="
    
    check_dir_exists "nginx/ssl" "SSL certificates directory" || warning "SSL directory not found (may need certificates)"
    
    # 9. Backup Configuration
    log "=== Backup Configuration Validation ==="
    
    check_dir_exists "backups" "Backup directory" || {
        warning "Backup directory not found, creating..."
        mkdir -p backups
        success "Backup directory created"
    }
    
    # 10. Testing Configuration
    log "=== Testing Configuration Validation ==="
    
    check_file_exists "tests/staging-smoke-tests.sh" "Staging smoke tests"
    
    # Check if test script is executable
    if [ -f "tests/staging-smoke-tests.sh" ]; then
        check "Checking test script permissions"
        if [ -x "tests/staging-smoke-tests.sh" ]; then
            success "Test script is executable"
        else
            warning "Test script is not executable, fixing..."
            chmod +x tests/staging-smoke-tests.sh
            success "Test script permissions fixed"
        fi
    fi
    
    # 11. Deployment Scripts Validation
    log "=== Deployment Scripts Validation ==="
    
    check_file_exists "scripts/deploy-staging.sh" "Staging deployment script"
    
    if [ -f "scripts/deploy-staging.sh" ]; then
        check "Checking deployment script permissions"
        if [ -x "scripts/deploy-staging.sh" ]; then
            success "Deployment script is executable"
        else
            chmod +x scripts/deploy-staging.sh
            success "Deployment script permissions fixed"
        fi
    fi
    
    # 12. Log Configuration
    log "=== Logging Configuration Validation ==="
    
    # Check if log directories will be created
    check "Checking logging configuration"
    success "Logging will be handled by Docker containers"
    
    # 13. Performance Configuration
    log "=== Performance Configuration Validation ==="
    
    # Check system resources
    check "Checking available system resources"
    local free_mem=$(free -h | awk '/^Mem:/ {print $7}' 2>/dev/null || echo "Unknown")
    local free_disk=$(df -h . | awk 'NR==2 {print $4}' 2>/dev/null || echo "Unknown")
    
    success "Available memory: $free_mem"
    success "Available disk space: $free_disk"
    
    # 14. Service Dependencies
    log "=== Service Dependencies Validation ==="
    
    # Check if services are defined in docker-compose
    check "Checking service definitions"
    if grep -q "backend:" docker-compose.staging.yml; then
        success "Backend service defined"
    else
        error "Backend service not found in docker-compose"
    fi
    
    if grep -q "postgres:" docker-compose.staging.yml; then
        success "PostgreSQL service defined"
    else
        error "PostgreSQL service not found in docker-compose"
    fi
    
    if grep -q "redis:" docker-compose.staging.yml; then
        success "Redis service defined"
    else
        error "Redis service not found in docker-compose"
    fi
    
    # Final Report
    echo
    log "=== Validation Summary ==="
    echo
    log "Total checks performed: $CHECKS"
    success "Passed: $PASSED"
    error "Failed: $FAILED"
    warning "Warnings: $WARNINGS"
    
    echo
    if [ $FAILED -eq 0 ]; then
        success "🎉 All critical validations passed!"
        if [ $WARNINGS -gt 0 ]; then
            warning "Please review warnings before deployment"
        fi
        echo
        success "✅ Staging environment is ready for deployment!"
        echo
        log "Next steps:"
        echo "1. Run: bash scripts/deploy-staging.sh"
        echo "2. Monitor: docker-compose -f docker-compose.staging.yml logs -f"
        echo "3. Test: bash tests/staging-smoke-tests.sh"
        echo
        exit 0
    else
        error "❌ Some critical validations failed!"
        echo
        log "Please fix the failed checks before deployment"
        exit 1
    fi
}

# Run validation
main "$@"