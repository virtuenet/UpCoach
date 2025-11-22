#!/bin/bash

# UpCoach Enhancement Testing - Comprehensive Test Execution Script
# This script runs all test suites in the correct order with proper setup and teardown

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
TEST_ENV=${NODE_ENV:-test}
PARALLEL_TESTS=${PARALLEL_TESTS:-true}
SKIP_SETUP=${SKIP_SETUP:-false}
SKIP_TEARDOWN=${SKIP_TEARDOWN:-false}
TEST_FILTER=${TEST_FILTER:-""}
COVERAGE_THRESHOLD=${COVERAGE_THRESHOLD:-90}

# Test result tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
START_TIME=$(date +%s)

# Function to update test counters
update_test_count() {
    local result=$1
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$result" -eq 0 ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up test environment..."
    
    if [ "$SKIP_TEARDOWN" != "true" ]; then
        # Stop background services
        pkill -f "npm run dev" || true
        pkill -f "flutter test" || true
        
        # Clean test databases
        npm run db:reset:test || true
        
        # Clean temporary files
        rm -rf /tmp/upcoach-test-* || true
    fi
    
    log_info "Cleanup completed"
}

# Set up trap for cleanup on exit
trap cleanup EXIT

# Pre-flight checks
preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE="18.0.0"
    if ! npm --version >/dev/null 2>&1; then
        log_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check Flutter (for mobile tests)
    if ! flutter --version >/dev/null 2>&1; then
        log_warning "Flutter not found - mobile tests will be skipped"
    fi
    
    # Check Docker (for integration tests)
    if ! docker --version >/dev/null 2>&1; then
        log_warning "Docker not found - containerized tests will be skipped"
    fi
    
    # Check test databases
    if ! pg_isready -h localhost -p 5433 >/dev/null 2>&1; then
        log_warning "Test database not ready - starting..."
        docker-compose -f docker-compose.test.yml up -d postgres-test
        sleep 10
    fi
    
    # Check Redis
    if ! redis-cli -p 6380 ping >/dev/null 2>&1; then
        log_warning "Test Redis not ready - starting..."
        docker-compose -f docker-compose.test.yml up -d redis-test
        sleep 5
    fi
    
    log_success "Pre-flight checks completed"
}

# Setup test environment
setup_environment() {
    if [ "$SKIP_SETUP" == "true" ]; then
        log_info "Skipping environment setup"
        return 0
    fi
    
    log_info "Setting up test environment..."
    
    # Install dependencies
    npm ci --silent
    
    # Setup test database
    npm run db:setup:test
    npm run test:seed
    
    # Install Playwright browsers
    npx playwright install --with-deps
    
    # Setup Flutter dependencies
    if flutter --version >/dev/null 2>&1; then
        cd ../mobile-app && flutter pub get && cd ../enhancement-plan
    fi
    
    # Start required services
    docker-compose -f docker-compose.test.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Verify services are running
    curl -f http://localhost:3001/api/health || {
        log_error "Backend API is not responding"
        exit 1
    }
    
    log_success "Test environment setup completed"
}

# Run unit tests
run_unit_tests() {
    log_info "Running unit tests..."
    
    local exit_code=0
    
    if [ "$PARALLEL_TESTS" == "true" ]; then
        npm run test:unit -- --maxWorkers=50% --passWithNoTests
    else
        npm run test:unit -- --runInBand --passWithNoTests
    fi
    
    exit_code=$?
    update_test_count $exit_code
    
    if [ $exit_code -eq 0 ]; then
        log_success "Unit tests passed"
    else
        log_error "Unit tests failed"
    fi
    
    return $exit_code
}

# Run integration tests
run_integration_tests() {
    log_info "Running integration tests..."
    
    local exit_code=0
    
    # Integration tests run sequentially to avoid database conflicts
    npm run test:integration -- --runInBand --passWithNoTests
    exit_code=$?
    update_test_count $exit_code
    
    if [ $exit_code -eq 0 ]; then
        log_success "Integration tests passed"
    else
        log_error "Integration tests failed"
    fi
    
    return $exit_code
}

# Run API tests
run_api_tests() {
    log_info "Running API tests..."
    
    local exit_code=0
    
    npm run test:api -- --passWithNoTests
    exit_code=$?
    update_test_count $exit_code
    
    if [ $exit_code -eq 0 ]; then
        log_success "API tests passed"
    else
        log_error "API tests failed"
    fi
    
    return $exit_code
}

# Run E2E tests
run_e2e_tests() {
    log_info "Running E2E tests..."
    
    local exit_code=0
    
    # Start application servers if not already running
    if ! curl -f http://localhost:8006 >/dev/null 2>&1; then
        log_info "Starting admin panel for E2E tests..."
        cd ../admin-panel && npm run dev &
        cd ../enhancement-plan
        sleep 10
    fi
    
    if ! curl -f http://localhost:3002 >/dev/null 2>&1; then
        log_info "Starting CMS panel for E2E tests..."
        cd ../cms-panel && npm run dev &
        cd ../enhancement-plan
        sleep 10
    fi
    
    # Run Playwright tests
    if [ -n "$TEST_FILTER" ]; then
        npx playwright test --grep="$TEST_FILTER"
    else
        npx playwright test
    fi
    
    exit_code=$?
    update_test_count $exit_code
    
    if [ $exit_code -eq 0 ]; then
        log_success "E2E tests passed"
    else
        log_error "E2E tests failed"
    fi
    
    return $exit_code
}

# Run mobile tests
run_mobile_tests() {
    if ! flutter --version >/dev/null 2>&1; then
        log_warning "Flutter not available - skipping mobile tests"
        return 0
    fi
    
    log_info "Running mobile tests..."
    
    local exit_code=0
    
    cd ../mobile-app
    
    # Run unit tests
    flutter test
    local unit_exit=$?
    
    # Run integration tests
    flutter test integration_test/
    local integration_exit=$?
    
    cd ../enhancement-plan
    
    if [ $unit_exit -eq 0 ] && [ $integration_exit -eq 0 ]; then
        exit_code=0
        log_success "Mobile tests passed"
    else
        exit_code=1
        log_error "Mobile tests failed"
    fi
    
    update_test_count $exit_code
    return $exit_code
}

# Run performance tests
run_performance_tests() {
    log_info "Running performance tests..."
    
    local exit_code=0
    
    # Check if services are ready for load testing
    if ! curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        log_error "Backend not ready for performance testing"
        return 1
    fi
    
    npm run test:performance
    exit_code=$?
    update_test_count $exit_code
    
    if [ $exit_code -eq 0 ]; then
        log_success "Performance tests passed"
    else
        log_error "Performance tests failed"
    fi
    
    return $exit_code
}

# Run security tests
run_security_tests() {
    log_info "Running security tests..."
    
    local exit_code=0
    
    # Run dependency audit
    npm audit --audit-level moderate
    local audit_exit=$?
    
    # Run OWASP ZAP scan if available
    if docker --version >/dev/null 2>&1; then
        docker-compose -f docker-compose.test.yml --profile security up --abort-on-container-exit zap-scanner
        local zap_exit=$?
    else
        log_warning "Docker not available - skipping ZAP security scan"
        local zap_exit=0
    fi
    
    if [ $audit_exit -eq 0 ] && [ $zap_exit -eq 0 ]; then
        exit_code=0
        log_success "Security tests passed"
    else
        exit_code=1
        log_error "Security tests failed"
    fi
    
    update_test_count $exit_code
    return $exit_code
}

# Run accessibility tests
run_accessibility_tests() {
    log_info "Running accessibility tests..."
    
    local exit_code=0
    
    npm run test:accessibility
    exit_code=$?
    update_test_count $exit_code
    
    if [ $exit_code -eq 0 ]; then
        log_success "Accessibility tests passed"
    else
        log_error "Accessibility tests failed"
    fi
    
    return $exit_code
}

# Generate test reports
generate_reports() {
    log_info "Generating test reports..."
    
    # Generate coverage report
    npm run test:coverage -- --silent
    
    # Generate Allure report
    if [ -d "test-results/allure-results" ]; then
        npm run report:generate
    fi
    
    # Generate consolidated report
    cat > test-results/summary.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "totalTests": $TOTAL_TESTS,
  "passedTests": $PASSED_TESTS,
  "failedTests": $FAILED_TESTS,
  "duration": $(($(date +%s) - START_TIME)),
  "environment": "$TEST_ENV",
  "coverageThreshold": $COVERAGE_THRESHOLD
}
EOF
    
    log_success "Test reports generated in test-results/"
}

# Print test summary
print_summary() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    
    echo ""
    echo "================================================"
    echo "           UpCoach Test Suite Summary"
    echo "================================================"
    echo "Total Tests:   $TOTAL_TESTS"
    echo "Passed:        $PASSED_TESTS"
    echo "Failed:        $FAILED_TESTS"
    echo "Duration:      ${duration}s"
    echo "Success Rate:  $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    echo "================================================"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log_success "All tests passed! 🎉"
        return 0
    else
        log_error "$FAILED_TESTS test(s) failed"
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting UpCoach Enhancement Test Suite"
    log_info "Environment: $TEST_ENV"
    log_info "Parallel Tests: $PARALLEL_TESTS"
    
    # Pre-flight checks
    preflight_checks || exit 1
    
    # Setup environment
    setup_environment || exit 1
    
    # Create test results directory
    mkdir -p test-results
    
    # Run test suites based on filter or run all
    case "$TEST_FILTER" in
        "unit")
            run_unit_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "api")
            run_api_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "mobile")
            run_mobile_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "security")
            run_security_tests
            ;;
        "accessibility")
            run_accessibility_tests
            ;;
        *)
            # Run all tests
            run_unit_tests
            run_integration_tests
            run_api_tests
            run_e2e_tests
            run_mobile_tests
            run_performance_tests
            run_security_tests
            run_accessibility_tests
            ;;
    esac
    
    # Generate reports
    generate_reports
    
    # Print summary and exit with appropriate code
    print_summary
    exit $?
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --parallel)
            PARALLEL_TESTS=true
            shift
            ;;
        --sequential)
            PARALLEL_TESTS=false
            shift
            ;;
        --skip-setup)
            SKIP_SETUP=true
            shift
            ;;
        --skip-teardown)
            SKIP_TEARDOWN=true
            shift
            ;;
        --filter)
            TEST_FILTER="$2"
            shift 2
            ;;
        --coverage-threshold)
            COVERAGE_THRESHOLD="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --parallel          Run tests in parallel (default)"
            echo "  --sequential        Run tests sequentially"
            echo "  --skip-setup        Skip environment setup"
            echo "  --skip-teardown     Skip cleanup"
            echo "  --filter TYPE       Run specific test type (unit|integration|api|e2e|mobile|performance|security|accessibility)"
            echo "  --coverage-threshold N  Set coverage threshold (default: 90)"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Execute main function
main 