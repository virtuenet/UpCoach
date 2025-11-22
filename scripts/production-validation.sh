#!/bin/bash

# Production Deployment Validation Script
# Validates all systems are ready for production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/production-validation.log"

# Validation results
VALIDATION_RESULTS=()
CRITICAL_FAILURES=()
WARNINGS=()

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Success logging
log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
    VALIDATION_RESULTS+=("✓ $1")
}

# Warning logging
log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
    WARNINGS+=("⚠ $1")
}

# Error logging
log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
    CRITICAL_FAILURES+=("✗ $1")
}

# Header
print_header() {
    echo "================================================================"
    echo "           UpCoach Production Deployment Validation"
    echo "================================================================"
    echo "Starting validation at $(date)"
    echo "Project Root: $PROJECT_ROOT"
    echo "Log File: $LOG_FILE"
    echo "================================================================"
}

# 1. Environment Variables Validation
validate_environment() {
    log "Validating environment variables..."

    # Required environment variables
    local required_vars=(
        "NODE_ENV"
        "DATABASE_URL"
        "JWT_SECRET"
        "SESSION_SECRET"
        "OPENAI_API_KEY"
        "STRIPE_SECRET_KEY"
        "MASTER_KEY"
    )

    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -eq 0 ]]; then
        log_success "All required environment variables are set"
    else
        log_error "Missing required environment variables: ${missing_vars[*]}"
        return 1
    fi

    # Validate NODE_ENV is production
    if [[ "${NODE_ENV:-}" != "production" ]]; then
        log_warning "NODE_ENV is not set to 'production'"
    else
        log_success "NODE_ENV is correctly set to production"
    fi
}

# 2. Database Connectivity
validate_database() {
    log "Validating database connectivity..."

    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL not set"
        return 1
    fi

    # Test database connection using node
    cat > /tmp/db_test.js << 'EOF'
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect()
  .then(() => {
    console.log('Database connection successful');
    return client.query('SELECT NOW()');
  })
  .then(() => {
    console.log('Database query successful');
    client.end();
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
EOF

    if cd "$PROJECT_ROOT/services/api" && node /tmp/db_test.js; then
        log_success "Database connectivity verified"
    else
        log_error "Database connection failed"
        return 1
    fi

    rm -f /tmp/db_test.js
}

# 3. Build Validation
validate_builds() {
    log "Validating service builds..."

    local services=("api" "admin-panel" "cms-panel" "landing-page")
    local build_failures=()

    for service in "${services[@]}"; do
        local service_path=""

        if [[ "$service" == "api" ]]; then
            service_path="$PROJECT_ROOT/services/api"
        else
            service_path="$PROJECT_ROOT/apps/$service"
        fi

        if [[ -d "$service_path" ]]; then
            log "Building $service..."

            if cd "$service_path" && npm run build > "/tmp/${service}_build.log" 2>&1; then
                log_success "$service build successful"
            else
                log_error "$service build failed - check /tmp/${service}_build.log"
                build_failures+=("$service")
            fi
        else
            log_warning "$service directory not found at $service_path"
        fi
    done

    if [[ ${#build_failures[@]} -eq 0 ]]; then
        log_success "All service builds completed successfully"
    else
        log_error "Build failures in: ${build_failures[*]}"
        return 1
    fi
}

# 4. Security Configuration Validation
validate_security() {
    log "Validating security configurations..."

    # Check for sensitive files in git
    if git -C "$PROJECT_ROOT" ls-files | grep -E '\.(env|key|pem|p12)$' | grep -v '\.example'; then
        log_error "Sensitive files found in git repository"
        return 1
    else
        log_success "No sensitive files in git repository"
    fi

    # Check .gitignore coverage
    local sensitive_patterns=(".env.staging" ".env.production" ".env.secure")
    local missing_patterns=()

    for pattern in "${sensitive_patterns[@]}"; do
        if ! grep -q "$pattern" "$PROJECT_ROOT/.gitignore"; then
            missing_patterns+=("$pattern")
        fi
    done

    if [[ ${#missing_patterns[@]} -eq 0 ]]; then
        log_success "All sensitive file patterns in .gitignore"
    else
        log_warning "Missing .gitignore patterns: ${missing_patterns[*]}"
    fi

    # Check SSL/TLS certificates (if applicable)
    if [[ -n "${SSL_CERT_PATH:-}" ]] && [[ -f "$SSL_CERT_PATH" ]]; then
        if openssl x509 -in "$SSL_CERT_PATH" -text -noout > /dev/null 2>&1; then
            log_success "SSL certificate validation passed"
        else
            log_error "SSL certificate validation failed"
        fi
    fi
}

# 5. Performance Benchmarks
validate_performance() {
    log "Running performance benchmarks..."

    # API health check
    if command -v curl > /dev/null; then
        local api_url="${API_URL:-http://localhost:3000}"

        if curl -f -s -o /dev/null -w "%{http_code}" "$api_url/api/health" | grep -q "200"; then
            log_success "API health check passed"
        else
            log_warning "API health check failed - service may not be running"
        fi
    else
        log_warning "curl not available for API testing"
    fi

    # Database performance check
    if [[ -n "${DATABASE_URL:-}" ]]; then
        cat > /tmp/db_perf_test.js << 'EOF'
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function performanceTest() {
  try {
    await client.connect();

    const start = Date.now();
    await client.query('SELECT 1');
    const duration = Date.now() - start;

    console.log(`Database query time: ${duration}ms`);

    if (duration < 100) {
      console.log('Database performance: EXCELLENT');
    } else if (duration < 500) {
      console.log('Database performance: GOOD');
    } else {
      console.log('Database performance: NEEDS OPTIMIZATION');
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Performance test failed:', err.message);
    process.exit(1);
  }
}

performanceTest();
EOF

        if cd "$PROJECT_ROOT/services/api" && node /tmp/db_perf_test.js; then
            log_success "Database performance test completed"
        else
            log_warning "Database performance test failed"
        fi

        rm -f /tmp/db_perf_test.js
    fi
}

# 6. Mobile App Validation
validate_mobile_app() {
    log "Validating mobile app configuration..."

    local mobile_path="$PROJECT_ROOT/mobile-app"

    if [[ -d "$mobile_path" ]]; then
        # Check Flutter version
        if command -v flutter > /dev/null; then
            local flutter_version=$(flutter --version | head -n1 | awk '{print $2}')
            log_success "Flutter version: $flutter_version"

            # Run Flutter analyze
            if cd "$mobile_path" && flutter analyze > /tmp/flutter_analyze.log 2>&1; then
                log_success "Flutter analysis passed"
            else
                log_warning "Flutter analysis issues found - check /tmp/flutter_analyze.log"
            fi
        else
            log_warning "Flutter not available for mobile app validation"
        fi
    else
        log_warning "Mobile app directory not found"
    fi
}

# 7. Docker Configuration Validation
validate_docker() {
    log "Validating Docker configurations..."

    local docker_files=(
        "docker-compose.production-secure.yml"
        "docker-compose.production.yml"
    )

    for docker_file in "${docker_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$docker_file" ]]; then
            if docker-compose -f "$PROJECT_ROOT/$docker_file" config > /dev/null 2>&1; then
                log_success "$docker_file validation passed"
            else
                log_error "$docker_file validation failed"
            fi
        else
            log_warning "$docker_file not found"
        fi
    done

    # Check Docker is running
    if command -v docker > /dev/null && docker info > /dev/null 2>&1; then
        log_success "Docker is running and accessible"
    else
        log_warning "Docker is not running or not accessible"
    fi
}

# 8. Monitoring and Logging Validation
validate_monitoring() {
    log "Validating monitoring and logging configuration..."

    # Check monitoring configuration files
    local monitoring_files=(
        "monitoring/prometheus.yml"
        "logging/fluent-bit.conf"
    )

    for file in "${monitoring_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            log_success "Monitoring config found: $file"
        else
            log_warning "Monitoring config missing: $file"
        fi
    done

    # Check Sentry configuration
    if [[ -n "${SENTRY_DSN:-}" ]]; then
        log_success "Sentry DSN configured for error tracking"
    else
        log_warning "Sentry DSN not configured"
    fi
}

# Generate final report
generate_report() {
    echo "================================================================"
    echo "                    VALIDATION REPORT"
    echo "================================================================"
    echo "Completed at: $(date)"
    echo ""

    echo "✅ SUCCESSFUL VALIDATIONS (${#VALIDATION_RESULTS[@]}):"
    for result in "${VALIDATION_RESULTS[@]}"; do
        echo "  $result"
    done
    echo ""

    if [[ ${#WARNINGS[@]} -gt 0 ]]; then
        echo "⚠️  WARNINGS (${#WARNINGS[@]}):"
        for warning in "${WARNINGS[@]}"; do
            echo "  $warning"
        done
        echo ""
    fi

    if [[ ${#CRITICAL_FAILURES[@]} -gt 0 ]]; then
        echo "❌ CRITICAL FAILURES (${#CRITICAL_FAILURES[@]}):"
        for failure in "${CRITICAL_FAILURES[@]}"; do
            echo "  $failure"
        done
        echo ""
        echo "🚫 DEPLOYMENT BLOCKED - Fix critical failures before proceeding"
        return 1
    else
        echo "🚀 PRODUCTION DEPLOYMENT APPROVED"
        echo ""
        echo "Summary:"
        echo "- All critical validations passed"
        echo "- ${#WARNINGS[@]} warnings (review recommended)"
        echo "- Ready for production deployment"
        return 0
    fi
}

# Main execution
main() {
    print_header

    # Initialize log file
    echo "Production Validation Started at $(date)" > "$LOG_FILE"

    # Run all validations
    validate_environment || true
    validate_database || true
    validate_builds || true
    validate_security || true
    validate_performance || true
    validate_mobile_app || true
    validate_docker || true
    validate_monitoring || true

    # Generate and display final report
    generate_report
}

# Execute main function
main "$@"