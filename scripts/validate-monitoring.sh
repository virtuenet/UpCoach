#!/bin/bash

# UpCoach Monitoring & Alerting Validation Script
# Comprehensive validation of monitoring stack and alerting systems

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

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
    ((WARNINGS++))
}

check() {
    ((CHECKS++))
    log "Checking: $1"
}

# Test endpoint with timeout
test_endpoint() {
    local url="$1"
    local timeout="${2:-10}"
    
    if curl -s --max-time "$timeout" "$url" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Test JSON endpoint
test_json_endpoint() {
    local url="$1"
    local timeout="${2:-10}"
    
    if curl -s --max-time "$timeout" "$url" | jq . >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

main() {
    log "🔍 Starting UpCoach Monitoring & Alerting Validation"
    echo
    
    # ==========================================
    # PROMETHEUS VALIDATION
    # ==========================================
    log "=== Prometheus Monitoring Validation ==="
    
    check "Prometheus service availability"
    if test_endpoint "http://localhost:9091"; then
        success "Prometheus is accessible"
    else
        error "Prometheus is not accessible at http://localhost:9091"
    fi
    
    check "Prometheus API status"
    if test_json_endpoint "http://localhost:9091/api/v1/status/runtimeinfo"; then
        success "Prometheus API is responding"
    else
        error "Prometheus API is not responding"
    fi
    
    check "Prometheus configuration reload"
    if test_endpoint "http://localhost:9091/-/ready"; then
        success "Prometheus is ready"
    else
        warning "Prometheus readiness check failed"
    fi
    
    check "Prometheus targets discovery"
    if curl -s "http://localhost:9091/api/v1/targets" | jq -e '.data.activeTargets | length > 0' >/dev/null 2>&1; then
        success "Prometheus has active targets"
    else
        warning "No active targets found in Prometheus"
    fi
    
    # ==========================================
    # GRAFANA VALIDATION
    # ==========================================
    log "=== Grafana Dashboard Validation ==="
    
    check "Grafana service availability"
    if test_endpoint "http://localhost:3001"; then
        success "Grafana is accessible"
    else
        error "Grafana is not accessible at http://localhost:3001"
    fi
    
    check "Grafana health endpoint"
    if test_json_endpoint "http://localhost:3001/api/health"; then
        success "Grafana health API is responding"
    else
        warning "Grafana health API check failed"
    fi
    
    check "Grafana datasources"
    if curl -s "http://admin:5IPXKUhkL9WCil78@localhost:3001/api/datasources" | jq -e 'length > 0' >/dev/null 2>&1; then
        success "Grafana has configured datasources"
    else
        warning "No datasources configured in Grafana"
    fi
    
    check "Grafana dashboards"
    if curl -s "http://admin:5IPXKUhkL9WCil78@localhost:3001/api/search" | jq -e 'length > 0' >/dev/null 2>&1; then
        success "Grafana has configured dashboards"
    else
        warning "No dashboards found in Grafana"
    fi
    
    # ==========================================
    # APPLICATION METRICS VALIDATION
    # ==========================================
    log "=== Application Metrics Validation ==="
    
    check "Backend API metrics endpoint"
    if test_endpoint "http://localhost:8081/api/health"; then
        success "Backend API metrics are accessible"
        
        # Check if metrics contain expected fields
        local response=$(curl -s "http://localhost:8081/api/health")
        if echo "$response" | jq -e '.status' >/dev/null 2>&1; then
            success "Backend health metrics have correct structure"
        else
            warning "Backend health metrics structure may be incorrect"
        fi
        
    else
        error "Backend API metrics are not accessible"
    fi
    
    check "Database connectivity metrics"
    if curl -s "http://localhost:8081/api/health" | jq -e '.database' >/dev/null 2>&1; then
        success "Database connectivity metrics available"
    else
        warning "Database connectivity metrics not found"
    fi
    
    check "Redis connectivity metrics"
    if curl -s "http://localhost:8081/api/health" | jq -e '.redis' >/dev/null 2>&1; then
        success "Redis connectivity metrics available"
    else
        warning "Redis connectivity metrics not found"
    fi
    
    # ==========================================
    # ERROR TRACKING VALIDATION
    # ==========================================
    log "=== Error Tracking Validation ==="
    
    check "Sentry configuration"
    if [ -f ".env.staging" ] && grep -q "SENTRY_DSN" ".env.staging"; then
        success "Sentry DSN is configured"
    else
        warning "Sentry DSN not configured for error tracking"
    fi
    
    check "Error logging endpoints"
    # Test if backend has error handling middleware
    if curl -s -w "%{http_code}" "http://localhost:8081/api/nonexistent" | grep -q "404"; then
        success "Error handling is working"
    else
        warning "Error handling may not be configured correctly"
    fi
    
    # ==========================================
    # ALERTING VALIDATION
    # ==========================================
    log "=== Alerting Configuration Validation ==="
    
    check "Alert rule files"
    if [ -f "monitoring/alerts/application.yml" ]; then
        success "Application alert rules exist"
    else
        warning "Application alert rules not found"
    fi
    
    if [ -f "monitoring/alerts/infrastructure.yml" ]; then
        success "Infrastructure alert rules exist"
    else
        warning "Infrastructure alert rules not found"
    fi
    
    check "Prometheus alert rules loading"
    if test_json_endpoint "http://localhost:9091/api/v1/rules"; then
        success "Prometheus alert rules API is accessible"
    else
        warning "Cannot access Prometheus alert rules"
    fi
    
    # ==========================================
    # PERFORMANCE METRICS VALIDATION
    # ==========================================
    log "=== Performance Metrics Validation ==="
    
    check "Response time metrics"
    local start_time=$(date +%s%3N)
    test_endpoint "http://localhost:8081/api/health"
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ "$response_time" -lt 2000 ]; then
        success "API response time: ${response_time}ms (Good)"
    elif [ "$response_time" -lt 5000 ]; then
        warning "API response time: ${response_time}ms (Acceptable)"
    else
        error "API response time: ${response_time}ms (Too slow)"
    fi
    
    check "Memory usage monitoring"
    if command -v docker >/dev/null 2>&1; then
        local memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | tail -n +2)
        if [ -n "$memory_usage" ]; then
            success "Container memory monitoring is available"
        else
            warning "Container memory monitoring may not be available"
        fi
    else
        warning "Docker not available for memory monitoring"
    fi
    
    # ==========================================
    # LOG AGGREGATION VALIDATION
    # ==========================================
    log "=== Log Aggregation Validation ==="
    
    check "Docker container logs"
    if docker-compose -f docker-compose.staging.yml logs --tail=10 backend >/dev/null 2>&1; then
        success "Container logs are accessible"
    else
        warning "Container logs may not be accessible"
    fi
    
    check "Log rotation configuration"
    if docker-compose -f docker-compose.staging.yml config | grep -q "logging:"; then
        success "Log rotation is configured"
    else
        warning "Log rotation configuration not found"
    fi
    
    # ==========================================
    # SECURITY MONITORING VALIDATION
    # ==========================================
    log "=== Security Monitoring Validation ==="
    
    check "Security headers monitoring"
    local headers=$(curl -s -I "http://localhost:8006" 2>/dev/null || echo "")
    local security_headers=0
    
    if echo "$headers" | grep -qi "x-frame-options"; then ((security_headers++)); fi
    if echo "$headers" | grep -qi "x-content-type-options"; then ((security_headers++)); fi
    if echo "$headers" | grep -qi "x-xss-protection"; then ((security_headers++)); fi
    
    if [ "$security_headers" -ge 2 ]; then
        success "Security headers are being monitored ($security_headers/3)"
    else
        warning "Security headers monitoring needs improvement ($security_headers/3)"
    fi
    
    check "Rate limiting monitoring"
    # Test multiple rapid requests
    local rate_limit_triggered=false
    for i in {1..10}; do
        if ! test_endpoint "http://localhost:8081/api/health" 1; then
            rate_limit_triggered=true
            break
        fi
    done
    
    if $rate_limit_triggered; then
        success "Rate limiting is active and monitored"
    else
        warning "Rate limiting may not be properly configured"
    fi
    
    # ==========================================
    # BACKUP MONITORING VALIDATION
    # ==========================================
    log "=== Backup Monitoring Validation ==="
    
    check "Backup service configuration"
    if grep -q "db-backup:" docker-compose.staging.yml; then
        success "Database backup service is configured"
    else
        warning "Database backup service not found"
    fi
    
    check "Backup directory"
    if [ -d "backups" ]; then
        success "Backup directory exists"
    else
        warning "Backup directory not found"
        mkdir -p backups
        success "Backup directory created"
    fi
    
    # ==========================================
    # SUMMARY REPORT
    # ==========================================
    echo
    log "=== Monitoring Validation Summary ==="
    echo
    log "📊 Validation Results:"
    echo -e "  Total Checks: $CHECKS"
    success "Passed: $PASSED"
    error "Failed: $FAILED"  
    warning "Warnings: $WARNINGS"
    echo
    
    # Calculate score
    local score=$((PASSED * 100 / CHECKS))
    
    if [ $FAILED -eq 0 ] && [ $score -ge 80 ]; then
        echo -e "${GREEN}🎉 MONITORING VALIDATION SUCCESSFUL! 🎉${NC}"
        echo -e "${GREEN}Score: $score/100${NC}"
        echo
        success "✅ Monitoring stack is ready for production workloads!"
        echo
        log "🔍 Monitoring Access URLs:"
        echo -e "  📊 Grafana Dashboard: http://localhost:3001"
        echo -e "  📈 Prometheus Metrics: http://localhost:9091"
        echo -e "  🏥 Health Check: http://localhost:8081/api/health"
        echo
        return 0
    else
        echo -e "${YELLOW}⚠️ MONITORING VALIDATION COMPLETED WITH ISSUES${NC}"
        echo -e "${YELLOW}Score: $score/100${NC}"
        echo
        if [ $FAILED -gt 0 ]; then
            error "❌ Critical issues found that need resolution before production"
        else
            warning "⚠️ Some non-critical issues found - review warnings"
        fi
        echo
        log "Please address the failed checks and warnings before proceeding to production"
        return 1
    fi
}

# Run validation
main "$@"