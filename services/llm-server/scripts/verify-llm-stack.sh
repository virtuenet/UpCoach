#!/bin/bash
#
# UpCoach LLM Stack Verification Script
# Usage: ./scripts/verify-llm-stack.sh [--verbose] [--benchmark]
#
# This script verifies the health and functionality of the LLM stack:
# - Service availability and health
# - Model loading status
# - API functionality tests
# - Response quality checks
# - Latency benchmarks

set -e

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Endpoints
GATEWAY_URL="http://localhost:3100"
OLLAMA_URL="http://localhost:11434"
VLLM_URL="http://localhost:8000"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Options
VERBOSE=false
BENCHMARK=false

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# =============================================================================
# Functions
# =============================================================================

print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║             UpCoach LLM Stack Verification                    ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --benchmark|-b)
                BENCHMARK=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [--verbose] [--benchmark]"
                echo ""
                echo "Options:"
                echo "  --verbose, -v    Show detailed output"
                echo "  --benchmark, -b  Run latency benchmarks"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

log_test() {
    echo -e "${CYAN}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

log_info() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
}

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}▶ $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

measure_latency() {
    local start=$(date +%s%3N)
    eval "$1" > /dev/null 2>&1
    local end=$(date +%s%3N)
    echo $((end - start))
}

# =============================================================================
# Service Checks
# =============================================================================

check_docker_services() {
    log_section "Docker Service Status"

    local services=("upcoach-ollama" "upcoach-llm-gateway" "upcoach-llm-redis")

    for service in "${services[@]}"; do
        log_test "Checking $service..."

        if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
            status=$(docker inspect -f '{{.State.Status}}' "$service" 2>/dev/null)
            if [ "$status" = "running" ]; then
                log_pass "$service is running"

                # Get health status if available
                health=$(docker inspect -f '{{.State.Health.Status}}' "$service" 2>/dev/null || echo "N/A")
                if [ "$health" != "N/A" ]; then
                    log_info "Health status: $health"
                fi
            else
                log_fail "$service is not running (status: $status)"
            fi
        else
            log_fail "$service container not found"
        fi
    done

    # Check vLLM if production profile
    if docker ps --format '{{.Names}}' | grep -q "upcoach-vllm"; then
        log_test "Checking upcoach-vllm (production)..."
        if docker inspect -f '{{.State.Status}}' upcoach-vllm 2>/dev/null | grep -q "running"; then
            log_pass "vLLM is running (production mode)"
        else
            log_warn "vLLM container exists but not running"
        fi
    fi
}

check_gateway_health() {
    log_section "LLM Gateway Health"

    log_test "Gateway health endpoint..."
    response=$(curl -s "${GATEWAY_URL}/health" 2>/dev/null || echo "")

    if [ -z "$response" ]; then
        log_fail "Gateway not responding"
        return
    fi

    # Parse health response
    status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$status" = "ok" ]; then
        log_pass "Gateway health: OK"
    else
        log_fail "Gateway health: $status"
    fi

    # Check individual services
    ollama_health=$(echo "$response" | grep -o '"ollama":"[^"]*"' | cut -d'"' -f4)
    redis_health=$(echo "$response" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)

    if [ "$ollama_health" = "healthy" ]; then
        log_pass "Ollama connection: healthy"
    else
        log_fail "Ollama connection: $ollama_health"
    fi

    if [ "$redis_health" = "healthy" ]; then
        log_pass "Redis connection: healthy"
    else
        log_warn "Redis connection: $redis_health"
    fi
}

check_ollama_direct() {
    log_section "Ollama Direct Access"

    log_test "Ollama API availability..."
    if curl -sf "${OLLAMA_URL}/api/tags" > /dev/null 2>&1; then
        log_pass "Ollama API is accessible"
    else
        log_fail "Ollama API not accessible"
        return
    fi

    log_test "Listing installed models..."
    models=$(curl -s "${OLLAMA_URL}/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$models" ]; then
        model_count=$(echo "$models" | wc -l)
        log_pass "Found $model_count installed models"

        if [ "$VERBOSE" = true ]; then
            echo "$models" | while read -r model; do
                log_info "  - $model"
            done
        fi

        # Check required models
        if echo "$models" | grep -q "mistral"; then
            log_pass "Required model 'mistral' is installed"
        else
            log_fail "Required model 'mistral' is NOT installed"
        fi

        if echo "$models" | grep -q "nomic-embed-text"; then
            log_pass "Embedding model 'nomic-embed-text' is installed"
        else
            log_warn "Embedding model 'nomic-embed-text' is not installed"
        fi
    else
        log_fail "No models installed"
    fi
}

# =============================================================================
# API Functionality Tests
# =============================================================================

test_chat_completion() {
    log_section "Chat Completion API"

    log_test "Testing /api/chat/completions..."

    response=$(curl -s -X POST "${GATEWAY_URL}/api/chat/completions" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "mistral",
            "messages": [{"role": "user", "content": "Say hello in one word"}],
            "max_tokens": 10,
            "temperature": 0.1
        }' 2>/dev/null)

    if [ -z "$response" ]; then
        log_fail "No response from chat API"
        return
    fi

    # Check for error
    if echo "$response" | grep -q '"error"'; then
        error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        log_fail "Chat API error: $error"
        return
    fi

    # Check for valid response structure
    if echo "$response" | grep -q '"choices"'; then
        log_pass "Chat completion response valid"

        # Extract and show response
        content=$(echo "$response" | grep -o '"content":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$content" ]; then
            log_info "Response: $content"
        fi

        # Check usage stats
        if echo "$response" | grep -q '"usage"'; then
            log_pass "Token usage stats included"
        fi
    else
        log_fail "Invalid response structure"
        log_info "Response: $response"
    fi
}

test_coaching_endpoint() {
    log_section "Coaching API"

    log_test "Testing /api/coaching/chat..."

    response=$(curl -s -X POST "${GATEWAY_URL}/api/coaching/chat" \
        -H "Content-Type: application/json" \
        -d '{
            "messages": [{"role": "user", "content": "Give me one tip for building habits"}],
            "context_type": "habits",
            "max_tokens": 100
        }' 2>/dev/null)

    if [ -z "$response" ]; then
        log_fail "No response from coaching API"
        return
    fi

    if echo "$response" | grep -q '"message"'; then
        log_pass "Coaching endpoint responded"

        content=$(echo "$response" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$content" ]; then
            # Check for coaching-relevant content
            if echo "$content" | grep -iq "habit\|routine\|start\|small\|consistent"; then
                log_pass "Response contains relevant coaching content"
            else
                log_warn "Response may not be contextually relevant"
            fi
            log_info "Response preview: ${content:0:100}..."
        fi

        # Check for suggestions
        if echo "$response" | grep -q '"suggestions"'; then
            log_pass "Action suggestions included"
        fi
    else
        log_fail "Invalid coaching response"
    fi

    # Test different context types
    for context in "goals" "motivation" "wellness"; do
        log_test "Testing context_type: $context..."

        response=$(curl -s -X POST "${GATEWAY_URL}/api/coaching/chat" \
            -H "Content-Type: application/json" \
            -d "{
                \"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}],
                \"context_type\": \"$context\",
                \"max_tokens\": 50
            }" 2>/dev/null)

        if echo "$response" | grep -q '"message"'; then
            log_pass "Context '$context' works"
        else
            log_fail "Context '$context' failed"
        fi
    done
}

test_embeddings() {
    log_section "Embeddings API"

    log_test "Testing /api/embeddings..."

    response=$(curl -s -X POST "${GATEWAY_URL}/api/embeddings" \
        -H "Content-Type: application/json" \
        -d '{
            "input": "Building healthy habits",
            "model": "nomic-embed-text"
        }' 2>/dev/null)

    if [ -z "$response" ]; then
        log_warn "No response from embeddings API (model may not be installed)"
        return
    fi

    if echo "$response" | grep -q '"embedding"'; then
        log_pass "Embeddings endpoint works"

        # Check embedding dimension
        dimension=$(echo "$response" | grep -o '"embedding":\[[^]]*\]' | tr ',' '\n' | wc -l)
        log_info "Embedding dimension: ~$dimension"
    else
        log_warn "Embeddings not available (nomic-embed-text may not be installed)"
    fi
}

test_models_list() {
    log_section "Models List API"

    log_test "Testing /api/models..."

    response=$(curl -s "${GATEWAY_URL}/api/models" 2>/dev/null)

    if echo "$response" | grep -q '"models"'; then
        log_pass "Models list endpoint works"

        model_count=$(echo "$response" | grep -o '"id"' | wc -l)
        log_info "Available models: $model_count"
    else
        log_fail "Models list failed"
    fi
}

test_metrics() {
    log_section "Metrics API"

    log_test "Testing /api/metrics..."

    response=$(curl -s "${GATEWAY_URL}/api/metrics" 2>/dev/null)

    if echo "$response" | grep -q "requests_total\|cache_hits"; then
        log_pass "Metrics endpoint works"

        if [ "$VERBOSE" = true ]; then
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        fi
    else
        log_warn "Metrics endpoint not returning expected data"
    fi
}

# =============================================================================
# Benchmarks
# =============================================================================

run_benchmarks() {
    if [ "$BENCHMARK" != true ]; then
        return
    fi

    log_section "Latency Benchmarks"

    echo ""
    echo "Running 5 iterations for each test..."
    echo ""

    # Health endpoint latency
    log_test "Health endpoint latency..."
    total=0
    for i in {1..5}; do
        latency=$(measure_latency "curl -s ${GATEWAY_URL}/health")
        total=$((total + latency))
        log_info "  Iteration $i: ${latency}ms"
    done
    avg=$((total / 5))
    log_pass "Average health check: ${avg}ms"

    # Short response latency
    log_test "Short response latency (10 tokens)..."
    total=0
    for i in {1..3}; do
        latency=$(measure_latency "curl -s -X POST ${GATEWAY_URL}/api/chat/completions -H 'Content-Type: application/json' -d '{\"model\":\"mistral\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}],\"max_tokens\":10}'")
        total=$((total + latency))
        log_info "  Iteration $i: ${latency}ms"
    done
    avg=$((total / 3))
    log_pass "Average short response: ${avg}ms"

    # Medium response latency
    log_test "Medium response latency (100 tokens)..."
    total=0
    for i in {1..3}; do
        latency=$(measure_latency "curl -s -X POST ${GATEWAY_URL}/api/chat/completions -H 'Content-Type: application/json' -d '{\"model\":\"mistral\",\"messages\":[{\"role\":\"user\",\"content\":\"Give me a motivation tip\"}],\"max_tokens\":100}'")
        total=$((total + latency))
        log_info "  Iteration $i: ${latency}ms"
    done
    avg=$((total / 3))
    log_pass "Average medium response: ${avg}ms"

    # Coaching endpoint latency
    log_test "Coaching endpoint latency..."
    total=0
    for i in {1..3}; do
        latency=$(measure_latency "curl -s -X POST ${GATEWAY_URL}/api/coaching/chat -H 'Content-Type: application/json' -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Help me\"}],\"context_type\":\"general\",\"max_tokens\":50}'")
        total=$((total + latency))
        log_info "  Iteration $i: ${latency}ms"
    done
    avg=$((total / 3))
    log_pass "Average coaching response: ${avg}ms"
}

# =============================================================================
# Response Quality Check
# =============================================================================

check_response_quality() {
    log_section "Response Quality Check"

    log_test "Testing coaching relevance..."

    # Test habit-related query
    response=$(curl -s -X POST "${GATEWAY_URL}/api/coaching/chat" \
        -H "Content-Type: application/json" \
        -d '{
            "messages": [{"role": "user", "content": "How can I build a morning exercise routine?"}],
            "context_type": "habits",
            "max_tokens": 150
        }' 2>/dev/null)

    content=$(echo "$response" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$content" ]; then
        # Check for relevant keywords
        relevance=0
        for keyword in "morning" "exercise" "routine" "habit" "start" "small" "consistent" "time" "wake"; do
            if echo "$content" | grep -iq "$keyword"; then
                ((relevance++))
            fi
        done

        if [ $relevance -ge 3 ]; then
            log_pass "Response is contextually relevant (score: $relevance/9)"
        elif [ $relevance -ge 1 ]; then
            log_warn "Response is partially relevant (score: $relevance/9)"
        else
            log_fail "Response may not be relevant (score: $relevance/9)"
        fi

        # Check response length
        length=${#content}
        if [ $length -gt 50 ]; then
            log_pass "Response has adequate length ($length chars)"
        else
            log_warn "Response may be too short ($length chars)"
        fi
    else
        log_fail "Could not extract response content"
    fi
}

# =============================================================================
# Summary
# =============================================================================

print_summary() {
    log_section "Verification Summary"

    local total=$((PASSED + FAILED + WARNINGS))

    echo -e "╔════════════════════════════════════════════════════════════════╗"
    echo -e "║                    Verification Results                        ║"
    echo -e "╠════════════════════════════════════════════════════════════════╣"
    printf "║  ${GREEN}PASSED:${NC}   %-50d ║\n" "$PASSED"
    printf "║  ${RED}FAILED:${NC}   %-50d ║\n" "$FAILED"
    printf "║  ${YELLOW}WARNINGS:${NC} %-50d ║\n" "$WARNINGS"
    echo -e "╠════════════════════════════════════════════════════════════════╣"
    printf "║  TOTAL:    %-50d ║\n" "$total"
    echo -e "╚════════════════════════════════════════════════════════════════╝"

    echo ""

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All critical checks passed!${NC}"
        if [ $WARNINGS -gt 0 ]; then
            echo -e "${YELLOW}  (with $WARNINGS warnings)${NC}"
        fi
        echo ""
        echo "The LLM stack is operational and ready to use."
        return 0
    else
        echo -e "${RED}✗ $FAILED critical checks failed!${NC}"
        echo ""
        echo "Please review the failures above and check the logs:"
        echo "  docker-compose logs llm-gateway"
        echo "  docker-compose logs ollama"
        return 1
    fi
}

# =============================================================================
# Main
# =============================================================================

main() {
    print_banner
    parse_args "$@"

    echo "Starting verification at $(date)"
    echo ""

    check_docker_services
    check_gateway_health
    check_ollama_direct
    test_models_list
    test_chat_completion
    test_coaching_endpoint
    test_embeddings
    test_metrics
    check_response_quality
    run_benchmarks
    print_summary
}

main "$@"
