#!/bin/bash

# ============================================================================
# Performance Benchmark Script
# ============================================================================
# Runs performance benchmarks and generates reports
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$PROJECT_ROOT/upcoach-project/apps/mobile"

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

print_metric() {
    local name=$1
    local value=$2
    local target=$3
    local unit=$4

    echo -n "$name: $value$unit "

    # Simple comparison (works for ms, MB, %)
    if (( $(echo "$value < $target" | bc -l) )); then
        echo -e "${GREEN}(Target: <$target$unit) ✅${NC}"
    else
        echo -e "${YELLOW}(Target: <$target$unit) ⚠️${NC}"
    fi
}

main() {
    print_header "⚡ UpCoach Performance Benchmark"

    cd "$MOBILE_DIR"

    # Check if Flutter is installed
    if ! command -v flutter &> /dev/null; then
        print_error "Flutter is not installed."
        exit 1
    fi

    # ========================================
    # App Launch Performance
    # ========================================

    print_header "🚀 App Launch Performance"

    echo "Measuring app launch times..."
    echo "(This requires a connected device or emulator)"

    # Note: Actual implementation would measure real launch times
    # For now, we'll show what metrics we'd track

    echo ""
    echo "Target Metrics:"
    echo "  - Cold start: <3000ms"
    echo "  - Warm start: <1000ms"
    echo "  - Hot start: <500ms"
    echo ""

    # ========================================
    # Build Size
    # ========================================

    print_header "📦 Build Size Analysis"

    # Android APK size
    if [ -f "build/app/outputs/flutter-apk/app-release.apk" ]; then
        APK_SIZE=$(du -h build/app/outputs/flutter-apk/app-release.apk | cut -f1)
        echo "Android APK size: $APK_SIZE"
    else
        echo "No release APK found. Build first: flutter build apk --release"
    fi

    # iOS IPA size (if exists)
    if [ -d "build/ios/ipa" ]; then
        IPA_SIZE=$(du -sh build/ios/ipa | cut -f1)
        echo "iOS IPA size: $IPA_SIZE"
    fi

    # ========================================
    # Code Metrics
    # ========================================

    print_header "📊 Code Metrics"

    # Count lines of code
    if command -v cloc &> /dev/null; then
        echo "Lines of Code:"
        cloc lib/ --quiet
    else
        echo "Install cloc for detailed code metrics: brew install cloc"
    fi

    # ========================================
    # Flutter Analyze
    # ========================================

    print_header "🔍 Static Analysis"

    flutter analyze --no-pub
    print_success "Static analysis complete"

    # ========================================
    # Dependency Audit
    # ========================================

    print_header "📦 Dependency Audit"

    echo "Checking for outdated dependencies..."
    flutter pub outdated

    # ========================================
    # Test Performance
    # ========================================

    print_header "🧪 Test Execution Performance"

    echo "Running tests with timing..."
    TEST_START=$(date +%s)
    flutter test || true
    TEST_END=$(date +%s)
    TEST_DURATION=$((TEST_END - TEST_START))

    echo ""
    print_metric "Test execution time" "$TEST_DURATION" "300" "s"

    # ========================================
    # Memory Profiling
    # ========================================

    print_header "💾 Memory Profile"

    echo "To profile memory usage:"
    echo "  1. Run: flutter run --profile"
    echo "  2. Open DevTools: flutter pub global run devtools"
    echo "  3. Navigate to Memory tab"
    echo ""
    echo "Target: <200MB for mobile app"

    # ========================================
    # Frame Rendering
    # ========================================

    print_header "🎬 Frame Rendering"

    echo "To measure frame rendering performance:"
    echo "  1. Run: flutter run --profile"
    echo "  2. Open DevTools Performance tab"
    echo "  3. Monitor frame rendering"
    echo ""
    echo "Target: 60 FPS (16.67ms per frame)"

    # ========================================
    # Network Performance
    # ========================================

    print_header "🌐 Network Performance"

    echo "API response time targets:"
    echo "  - p50: <100ms"
    echo "  - p95: <200ms"
    echo "  - p99: <500ms"
    echo ""
    echo "To measure: Use API load testing tools"

    # ========================================
    # Summary Report
    # ========================================

    print_header "📈 Benchmark Summary"

    cat << EOF
Performance Targets:

✅ App Launch
   - Cold start: <3s
   - Warm start: <1s
   - Hot start: <500ms

✅ Runtime
   - Frame rate: 60 FPS
   - Memory: <200MB
   - CPU: <50% average

✅ Build
   - APK size: <50MB
   - Test time: <5 minutes
   - Zero warnings

✅ Network
   - API p95: <200ms
   - Image load: <1s
   - Offline capable

Run this script regularly to track performance over time.
EOF

    print_success "Benchmark complete!"
}

main "$@"
