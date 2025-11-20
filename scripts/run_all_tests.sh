#!/bin/bash

# ============================================================================
# Run All Tests Script
# ============================================================================
# Runs all automated tests for UpCoach platform
# - Mobile unit tests
# - Mobile integration tests
# - Mobile widget tests
# - API unit tests
# - API integration tests
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to run a test suite
run_test_suite() {
    local suite_name=$1
    local command=$2
    local directory=$3

    print_header "$suite_name"

    if [ -n "$directory" ]; then
        cd "$PROJECT_ROOT/$directory"
    fi

    if eval "$command"; then
        print_success "$suite_name PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "$suite_name FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Main execution
main() {
    print_header "UpCoach Test Suite Runner"
    echo "Project Root: $PROJECT_ROOT"
    echo "Start Time: $(date)"

    # ========================================
    # Mobile Tests
    # ========================================

    print_header "🚀 Starting Mobile Tests"

    # Check if Flutter is installed
    if ! command -v flutter &> /dev/null; then
        print_error "Flutter is not installed. Skipping mobile tests."
    else
        # Mobile Unit Tests
        run_test_suite \
            "📱 Mobile Unit Tests" \
            "flutter test --coverage --reporter expanded" \
            "upcoach-project/apps/mobile"

        # Mobile Integration Tests
        run_test_suite \
            "🔗 Mobile Integration Tests" \
            "flutter test integration_test/" \
            "upcoach-project/apps/mobile"

        # Mobile Widget Tests
        run_test_suite \
            "🎨 Mobile Widget Tests" \
            "flutter test test/widgets/" \
            "upcoach-project/apps/mobile"

        # Generate coverage report
        if [ -f "$PROJECT_ROOT/upcoach-project/apps/mobile/coverage/lcov.info" ]; then
            print_header "📊 Generating Coverage Report"
            cd "$PROJECT_ROOT/upcoach-project/apps/mobile"

            if command -v genhtml &> /dev/null; then
                genhtml coverage/lcov.info -o coverage/html
                print_success "Coverage report generated: coverage/html/index.html"
            else
                print_warning "genhtml not installed. Run: brew install lcov (Mac) or apt-get install lcov (Linux)"
            fi
        fi
    fi

    # ========================================
    # API Tests
    # ========================================

    print_header "🚀 Starting API Tests"

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Skipping API tests."
    else
        # Check if API directory exists
        if [ -d "$PROJECT_ROOT/upcoach-project/services/api" ]; then
            # Install dependencies if needed
            if [ ! -d "$PROJECT_ROOT/upcoach-project/services/api/node_modules" ]; then
                print_header "📦 Installing API Dependencies"
                cd "$PROJECT_ROOT/upcoach-project/services/api"
                npm install
            fi

            # API Unit Tests
            run_test_suite \
                "🔧 API Unit Tests" \
                "npm test -- --testPathPattern=unit" \
                "upcoach-project/services/api"

            # API Integration Tests
            run_test_suite \
                "🔗 API Integration Tests" \
                "npm run test:integration" \
                "upcoach-project/services/api"

            # API Service Tests
            run_test_suite \
                "⚙️  API Service Tests" \
                "npm run test:service" \
                "upcoach-project/services/api"

            # Coverage report
            run_test_suite \
                "📊 API Coverage Report" \
                "npm run test:coverage" \
                "upcoach-project/services/api"
        else
            print_warning "API directory not found. Skipping API tests."
        fi
    fi

    # ========================================
    # Web Tests (if applicable)
    # ========================================

    if [ -d "$PROJECT_ROOT/upcoach-project/apps/web" ]; then
        print_header "🚀 Starting Web Tests"

        # Web Unit Tests
        run_test_suite \
            "🌐 Web Unit Tests" \
            "npm test" \
            "upcoach-project/apps/web"
    fi

    # ========================================
    # Summary
    # ========================================

    print_header "Test Summary"
    echo "End Time: $(date)"
    echo ""
    print_success "Passed: $TESTS_PASSED"
    print_error "Failed: $TESTS_FAILED"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "ALL TESTS PASSED! 🎉"
        exit 0
    else
        print_error "SOME TESTS FAILED ❌"
        exit 1
    fi
}

# Run main function
main "$@"
