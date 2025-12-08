#!/bin/bash
#
# UpCoach E2E Test Runner
# Usage: ./scripts/run_e2e_tests.sh [OPTIONS]
#
# This script automates running end-to-end tests for the UpCoach mobile app
# with support for different test configurations and CI integration.

set -e

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
TEST_SUITE="all"
PLATFORM="android"
DEVICE=""
SCREENSHOTS_DIR="$PROJECT_DIR/test_screenshots"
REPORT_DIR="$PROJECT_DIR/test_reports"
PARALLEL=false
HEADLESS=false
CI_MODE=false
COVERAGE=false
SKIP_BUILD=false
TAGS=""

# =============================================================================
# Functions
# =============================================================================

print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              UpCoach E2E Test Runner                           ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

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

log_step() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}▶ $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --suite SUITE       Test suite: all, smoke, auth, habits, goals, accessibility"
    echo "  --platform PLAT     Platform: android, ios, both (default: android)"
    echo "  --device DEVICE     Specific device ID to use"
    echo "  --tags TAGS         Run tests with specific tags (comma-separated)"
    echo "  --parallel          Run tests in parallel (experimental)"
    echo "  --headless          Run in headless mode (for CI)"
    echo "  --ci                CI mode: sets headless, generates reports"
    echo "  --coverage          Generate code coverage report"
    echo "  --skip-build        Skip building the app (use existing build)"
    echo "  --screenshots DIR   Directory for test screenshots"
    echo "  --reports DIR       Directory for test reports"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --suite smoke --platform android"
    echo "  $0 --suite auth --tags auth,smoke"
    echo "  $0 --ci --coverage"
    echo "  $0 --platform ios --device 'iPhone 15 Pro'"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --suite)
                TEST_SUITE="$2"
                shift 2
                ;;
            --platform)
                PLATFORM="$2"
                shift 2
                ;;
            --device)
                DEVICE="$2"
                shift 2
                ;;
            --tags)
                TAGS="$2"
                shift 2
                ;;
            --parallel)
                PARALLEL=true
                shift
                ;;
            --headless)
                HEADLESS=true
                shift
                ;;
            --ci)
                CI_MODE=true
                HEADLESS=true
                shift
                ;;
            --coverage)
                COVERAGE=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --screenshots)
                SCREENSHOTS_DIR="$2"
                shift 2
                ;;
            --reports)
                REPORT_DIR="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

check_prerequisites() {
    log_step "Checking Prerequisites"

    local missing=()

    # Check Flutter
    if ! command -v flutter &> /dev/null; then
        missing+=("flutter")
    else
        log_info "Flutter: $(flutter --version | head -1)"
    fi

    # Check for connected devices
    if [ -z "$DEVICE" ]; then
        log_info "Checking for connected devices..."
        flutter devices
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing prerequisites: ${missing[*]}"
        exit 1
    fi

    log_success "All prerequisites satisfied"
}

setup_directories() {
    log_step "Setting Up Test Directories"

    mkdir -p "$SCREENSHOTS_DIR"
    mkdir -p "$REPORT_DIR"

    log_info "Screenshots: $SCREENSHOTS_DIR"
    log_info "Reports: $REPORT_DIR"

    log_success "Directories created"
}

get_test_file() {
    case $TEST_SUITE in
        all)
            echo "integration_test/app_test.dart"
            ;;
        smoke)
            echo "integration_test/flows/auth_flow_test.dart"
            ;;
        auth)
            echo "integration_test/flows/auth_flow_test.dart"
            ;;
        habits)
            echo "integration_test/flows/habits_flow_test.dart"
            ;;
        goals)
            echo "integration_test/flows/goals_flow_test.dart"
            ;;
        accessibility)
            echo "integration_test/accessibility/accessibility_test.dart"
            ;;
        *)
            log_error "Unknown test suite: $TEST_SUITE"
            exit 1
            ;;
    esac
}

build_app() {
    if [ "$SKIP_BUILD" = true ]; then
        log_info "Skipping build (--skip-build flag)"
        return
    fi

    log_step "Building App for Testing"

    cd "$PROJECT_DIR"

    case $PLATFORM in
        android)
            log_info "Building Android debug APK..."
            flutter build apk --debug
            ;;
        ios)
            log_info "Building iOS debug app..."
            flutter build ios --debug --simulator
            ;;
        both)
            log_info "Building for both platforms..."
            flutter build apk --debug
            flutter build ios --debug --simulator
            ;;
    esac

    log_success "Build completed"
}

run_tests_android() {
    log_step "Running E2E Tests on Android"

    local test_file=$(get_test_file)
    local device_arg=""

    if [ -n "$DEVICE" ]; then
        device_arg="-d $DEVICE"
    fi

    cd "$PROJECT_DIR"

    # Set environment variables
    export CAPTURE_SCREENSHOTS=true
    export TEST_SCREENSHOTS_DIR="$SCREENSHOTS_DIR"

    if [ "$CI_MODE" = true ]; then
        export SKIP_SLOW_TESTS=true
    fi

    # Build test arguments
    local test_args=""
    if [ -n "$TAGS" ]; then
        test_args="--tags $TAGS"
    fi

    log_info "Running: flutter test $test_file $device_arg"

    # Run tests
    if [ "$COVERAGE" = true ]; then
        flutter test $test_file $device_arg --coverage 2>&1 | tee "$REPORT_DIR/test_output.log"
    else
        flutter test $test_file $device_arg 2>&1 | tee "$REPORT_DIR/test_output.log"
    fi

    local exit_code=${PIPESTATUS[0]}

    return $exit_code
}

run_tests_ios() {
    log_step "Running E2E Tests on iOS"

    local test_file=$(get_test_file)
    local device_arg=""

    if [ -n "$DEVICE" ]; then
        device_arg="-d '$DEVICE'"
    else
        # Default to iOS Simulator
        device_arg="-d 'iPhone'"
    fi

    cd "$PROJECT_DIR"

    # Set environment variables
    export CAPTURE_SCREENSHOTS=true
    export TEST_SCREENSHOTS_DIR="$SCREENSHOTS_DIR"

    log_info "Running: flutter test $test_file $device_arg"

    if [ "$COVERAGE" = true ]; then
        flutter test $test_file $device_arg --coverage 2>&1 | tee "$REPORT_DIR/test_output_ios.log"
    else
        flutter test $test_file $device_arg 2>&1 | tee "$REPORT_DIR/test_output_ios.log"
    fi

    local exit_code=${PIPESTATUS[0]}

    return $exit_code
}

run_integration_tests() {
    local test_file=$(get_test_file)

    log_step "Running Integration Tests"
    log_info "Test suite: $TEST_SUITE"
    log_info "Test file: $test_file"
    log_info "Platform: $PLATFORM"

    cd "$PROJECT_DIR"

    local exit_code=0

    case $PLATFORM in
        android)
            run_tests_android
            exit_code=$?
            ;;
        ios)
            run_tests_ios
            exit_code=$?
            ;;
        both)
            run_tests_android
            local android_exit=$?

            run_tests_ios
            local ios_exit=$?

            if [ $android_exit -ne 0 ] || [ $ios_exit -ne 0 ]; then
                exit_code=1
            fi
            ;;
    esac

    return $exit_code
}

generate_reports() {
    log_step "Generating Test Reports"

    cd "$PROJECT_DIR"

    # Generate coverage report if enabled
    if [ "$COVERAGE" = true ] && [ -f "coverage/lcov.info" ]; then
        log_info "Generating coverage report..."

        if command -v genhtml &> /dev/null; then
            genhtml coverage/lcov.info -o "$REPORT_DIR/coverage"
            log_success "Coverage report: $REPORT_DIR/coverage/index.html"
        else
            log_warning "genhtml not found. Install lcov for HTML coverage reports."
        fi
    fi

    # Create summary report
    cat > "$REPORT_DIR/summary.txt" << EOF
UpCoach E2E Test Report
========================
Date: $(date)
Test Suite: $TEST_SUITE
Platform: $PLATFORM
CI Mode: $CI_MODE

Test Results:
$(grep -E "^(✓|✗|All tests passed|Some tests failed)" "$REPORT_DIR/test_output.log" 2>/dev/null || echo "See test_output.log for details")

Screenshots: $SCREENSHOTS_DIR
EOF

    log_success "Reports generated in: $REPORT_DIR"
}

cleanup() {
    log_step "Cleanup"

    # Kill any lingering processes
    pkill -f "flutter_tester" 2>/dev/null || true

    log_success "Cleanup completed"
}

print_summary() {
    local exit_code=$1

    log_step "Test Summary"

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    ALL TESTS PASSED                            ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    else
        echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                    SOME TESTS FAILED                           ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    fi

    echo ""
    echo -e "  ${CYAN}Test Suite:${NC}    $TEST_SUITE"
    echo -e "  ${CYAN}Platform:${NC}      $PLATFORM"
    echo -e "  ${CYAN}Screenshots:${NC}   $SCREENSHOTS_DIR"
    echo -e "  ${CYAN}Reports:${NC}       $REPORT_DIR"
    echo ""

    if [ -f "$REPORT_DIR/summary.txt" ]; then
        echo -e "  ${CYAN}View report:${NC}   cat $REPORT_DIR/summary.txt"
    fi

    if [ "$COVERAGE" = true ] && [ -d "$REPORT_DIR/coverage" ]; then
        echo -e "  ${CYAN}Coverage:${NC}      open $REPORT_DIR/coverage/index.html"
    fi

    echo ""
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    print_banner

    parse_args "$@"

    log_info "Starting E2E Test Runner"
    log_info "Test Suite: $TEST_SUITE"
    log_info "Platform: $PLATFORM"
    log_info "CI Mode: $CI_MODE"

    check_prerequisites
    setup_directories

    if [ "$CI_MODE" != true ]; then
        build_app
    fi

    local test_exit_code=0
    run_integration_tests || test_exit_code=$?

    generate_reports
    cleanup

    print_summary $test_exit_code

    exit $test_exit_code
}

# Trap for cleanup on exit
trap cleanup EXIT

main "$@"
