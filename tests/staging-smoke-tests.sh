#!/bin/bash

# UpCoach Staging Smoke Tests
# This script runs basic smoke tests against the staging environment

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL="${STAGING_URL:-https://staging.upcoach.ai}"
ADMIN_URL="${ADMIN_URL:-https://staging-admin.upcoach.ai}"
CMS_URL="${CMS_URL:-https://staging-cms.upcoach.ai}"
API_URL="${API_URL:-https://staging-api.upcoach.ai}"

# Test results
PASSED=0
FAILED=0

# Helper functions
print_test_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}PASSED${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}FAILED${NC} (Expected: $expected_status, Got: $response)"
        ((FAILED++))
    fi
}

test_health_endpoint() {
    local url=$1
    local service=$2
    
    echo -n "Testing $service health endpoint... "
    
    response=$(curl -s "$url/api/health")
    
    if echo "$response" | grep -q '"status":"ok"'; then
        echo -e "${GREEN}PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}FAILED${NC} (Response: $response)"
        ((FAILED++))
    fi
}

test_ssl_certificate() {
    local domain=$1
    
    echo -n "Testing SSL certificate for $domain... "
    
    if openssl s_client -connect "$domain:443" -servername "$domain" </dev/null 2>/dev/null | openssl x509 -noout -checkend 86400; then
        echo -e "${GREEN}PASSED${NC} (Valid for > 24 hours)"
        ((PASSED++))
    else
        echo -e "${RED}FAILED${NC} (Certificate expired or expiring soon)"
        ((FAILED++))
    fi
}

test_response_time() {
    local url=$1
    local max_time=${2:-3}
    local description=$3
    
    echo -n "Testing response time for $description... "
    
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$url")
    
    if (( $(echo "$response_time < $max_time" | bc -l) )); then
        echo -e "${GREEN}PASSED${NC} (${response_time}s)"
        ((PASSED++))
    else
        echo -e "${RED}FAILED${NC} (${response_time}s > ${max_time}s)"
        ((FAILED++))
    fi
}

test_api_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local expected_status=${3:-200}
    local description=$4
    
    echo -n "Testing API: $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $STAGING_API_TOKEN" \
        "$API_URL$endpoint")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}PASSED${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}FAILED${NC} (Expected: $expected_status, Got: $response)"
        ((FAILED++))
    fi
}

# Start tests
echo "🚀 Running UpCoach Staging Smoke Tests"
echo "======================================="
echo "Landing Page: $STAGING_URL"
echo "Admin Panel: $ADMIN_URL"
echo "CMS Panel: $CMS_URL"
echo "API: $API_URL"

# Test 1: Landing Page
print_test_header "Landing Page Tests"
test_endpoint "$STAGING_URL" 200 "Homepage"
test_endpoint "$STAGING_URL/features" 200 "Features page"
test_endpoint "$STAGING_URL/pricing" 200 "Pricing page"
test_endpoint "$STAGING_URL/privacy" 200 "Privacy policy"
test_endpoint "$STAGING_URL/terms" 200 "Terms of service"
test_response_time "$STAGING_URL" 3 "Homepage load time"
test_ssl_certificate "staging.upcoach.ai"

# Test 2: Admin Panel
print_test_header "Admin Panel Tests"
test_endpoint "$ADMIN_URL" 200 "Admin login page"
test_endpoint "$ADMIN_URL/api/health" 200 "Admin health check"
test_ssl_certificate "staging-admin.upcoach.ai"

# Test 3: CMS Panel
print_test_header "CMS Panel Tests"
test_endpoint "$CMS_URL" 200 "CMS login page"
test_endpoint "$CMS_URL/api/health" 200 "CMS health check"
test_ssl_certificate "staging-cms.upcoach.ai"

# Test 4: API Endpoints
print_test_header "API Tests"
test_health_endpoint "$API_URL" "API"
test_api_endpoint "/api/v1/status" "GET" 200 "API status"
test_api_endpoint "/api/v1/auth/status" "GET" 401 "Auth status (unauthenticated)"

# Test 5: Database Connection
print_test_header "Database Tests"
echo -n "Testing database connection... "
if curl -s "$API_URL/api/health" | grep -q '"database":"connected"'; then
    echo -e "${GREEN}PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAILED${NC}"
    ((FAILED++))
fi

# Test 6: Redis Connection
print_test_header "Redis Tests"
echo -n "Testing Redis connection... "
if curl -s "$API_URL/api/health" | grep -q '"redis":"connected"'; then
    echo -e "${GREEN}PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAILED${NC}"
    ((FAILED++))
fi

# Test 7: Static Assets
print_test_header "Static Assets Tests"
test_endpoint "$STAGING_URL/favicon.ico" 200 "Favicon"
test_endpoint "$STAGING_URL/robots.txt" 200 "Robots.txt"
test_endpoint "$STAGING_URL/sitemap.xml" 200 "Sitemap"

# Test 8: Security Headers
print_test_header "Security Headers Tests"
echo -n "Testing security headers... "
headers=$(curl -s -I "$STAGING_URL")
security_headers_found=0

if echo "$headers" | grep -qi "x-frame-options"; then ((security_headers_found++)); fi
if echo "$headers" | grep -qi "x-content-type-options"; then ((security_headers_found++)); fi
if echo "$headers" | grep -qi "strict-transport-security"; then ((security_headers_found++)); fi
if echo "$headers" | grep -qi "content-security-policy"; then ((security_headers_found++)); fi

if [ "$security_headers_found" -ge 3 ]; then
    echo -e "${GREEN}PASSED${NC} ($security_headers_found/4 headers found)"
    ((PASSED++))
else
    echo -e "${RED}FAILED${NC} ($security_headers_found/4 headers found)"
    ((FAILED++))
fi

# Test 9: Mobile App Endpoints
print_test_header "Mobile App API Tests"
test_api_endpoint "/api/v1/mobile/config" "GET" 200 "Mobile config"
test_api_endpoint "/api/v1/mobile/version" "GET" 200 "Version check"

# Test 10: Error Pages
print_test_header "Error Pages Tests"
test_endpoint "$STAGING_URL/404" 404 "404 error page"
test_endpoint "$STAGING_URL/api/nonexistent" 404 "API 404 response"

# Summary
echo -e "\n======================================="
echo "Test Summary:"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Total: $((PASSED + FAILED))"

if [ "$FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed!${NC}"
    exit 1
fi 