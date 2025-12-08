#!/bin/bash
#
# UpCoach LLM Stack Deployment Script
# Usage: ./scripts/deploy-llm-stack.sh [--env development|staging|production] [--gpu] [--clean]
#
# This script automates the deployment of the UpCoach LLM infrastructure including:
# - Docker service orchestration
# - Model downloading and verification
# - Health checks and rollback on failure
# - Environment-specific configuration

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
ENVIRONMENT="development"
GPU_ENABLED=false
CLEAN_DEPLOY=false
SKIP_MODELS=false
TIMEOUT=300

# Required models per environment
DEV_MODELS=("mistral")
STAGING_MODELS=("mistral" "llama3.2:3b" "nomic-embed-text")
PROD_MODELS=("mistral" "nomic-embed-text")

# =============================================================================
# Functions
# =============================================================================

print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║               UpCoach LLM Stack Deployment                    ║"
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
    echo "  --env ENV        Environment: development, staging, production (default: development)"
    echo "  --gpu            Enable GPU support (requires NVIDIA drivers)"
    echo "  --clean          Clean deploy: remove existing containers and volumes"
    echo "  --skip-models    Skip model download (use existing models)"
    echo "  --timeout SEC    Timeout for health checks in seconds (default: 300)"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --env development"
    echo "  $0 --env staging --gpu"
    echo "  $0 --env production --gpu --clean"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --gpu)
                GPU_ENABLED=true
                shift
                ;;
            --clean)
                CLEAN_DEPLOY=true
                shift
                ;;
            --skip-models)
                SKIP_MODELS=true
                shift
                ;;
            --timeout)
                TIMEOUT="$2"
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

    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    else
        log_info "Docker: $(docker --version | cut -d ' ' -f3 | tr -d ',')"
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing+=("docker-compose")
    else
        log_info "Docker Compose: $(docker compose version 2>/dev/null | cut -d ' ' -f4 || docker-compose --version | cut -d ' ' -f3 | tr -d ',')"
    fi

    # Check curl
    if ! command -v curl &> /dev/null; then
        missing+=("curl")
    fi

    # Check GPU if enabled
    if [ "$GPU_ENABLED" = true ]; then
        if ! command -v nvidia-smi &> /dev/null; then
            log_warning "NVIDIA driver not found. GPU support may not work."
        else
            log_info "NVIDIA Driver: $(nvidia-smi --query-gpu=driver_version --format=csv,noheader,nounits | head -1)"
        fi

        if ! docker info 2>/dev/null | grep -q "nvidia"; then
            log_warning "NVIDIA Container Toolkit not detected in Docker."
        fi
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing prerequisites: ${missing[*]}"
        exit 1
    fi

    log_success "All prerequisites satisfied"
}

setup_environment() {
    log_step "Setting Up Environment: $ENVIRONMENT"

    cd "$PROJECT_DIR"

    # Create .env if not exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_info "Created .env from .env.example"
        else
            log_error ".env.example not found"
            exit 1
        fi
    fi

    # Set environment-specific variables
    case $ENVIRONMENT in
        development)
            export COMPOSE_PROFILES=""
            export LOG_LEVEL="debug"
            export RATE_LIMIT_RPM="120"
            export CACHE_TTL="300"
            ;;
        staging)
            export COMPOSE_PROFILES=""
            export LOG_LEVEL="info"
            export RATE_LIMIT_RPM="60"
            export CACHE_TTL="1800"
            ;;
        production)
            export COMPOSE_PROFILES="production"
            export LOG_LEVEL="warn"
            export RATE_LIMIT_RPM="60"
            export CACHE_TTL="3600"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac

    log_success "Environment configured: $ENVIRONMENT"
}

clean_existing() {
    if [ "$CLEAN_DEPLOY" = true ]; then
        log_step "Cleaning Existing Deployment"

        log_warning "This will remove all containers, volumes, and cached models!"
        read -p "Are you sure? (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            log_info "Clean deploy cancelled"
            return
        fi

        cd "$PROJECT_DIR"

        # Stop and remove containers
        docker-compose down -v --remove-orphans 2>/dev/null || true

        # Remove orphan volumes
        docker volume rm upcoach-llm-server_ollama_data 2>/dev/null || true
        docker volume rm upcoach-llm-server_huggingface_cache 2>/dev/null || true
        docker volume rm upcoach-llm-server_redis_data 2>/dev/null || true

        log_success "Existing deployment cleaned"
    fi
}

start_services() {
    log_step "Starting Docker Services"

    cd "$PROJECT_DIR"

    # Determine compose command
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi

    # Build and start services
    local compose_args=""

    if [ -n "$COMPOSE_PROFILES" ]; then
        compose_args="--profile $COMPOSE_PROFILES"
    fi

    log_info "Starting services..."
    $COMPOSE_CMD $compose_args up -d --build

    log_success "Docker services started"
}

wait_for_service() {
    local service=$1
    local url=$2
    local max_attempts=$((TIMEOUT / 5))
    local attempt=1

    log_info "Waiting for $service to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            log_success "$service is ready"
            return 0
        fi

        echo -ne "\r  Attempt $attempt/$max_attempts..."
        sleep 5
        ((attempt++))
    done

    echo ""
    log_error "$service failed to start within ${TIMEOUT}s"
    return 1
}

wait_for_services() {
    log_step "Waiting for Services to Start"

    # Wait for Redis first (dependency)
    wait_for_service "Redis" "http://localhost:6379" || true  # Redis doesn't have HTTP, but container should be up

    # Wait for Ollama
    if ! wait_for_service "Ollama" "http://localhost:11434/api/tags"; then
        log_error "Ollama failed to start. Check logs: docker-compose logs ollama"
        exit 1
    fi

    # Wait for LLM Gateway
    if ! wait_for_service "LLM Gateway" "http://localhost:3100/health"; then
        log_error "LLM Gateway failed to start. Check logs: docker-compose logs llm-gateway"
        exit 1
    fi

    # Wait for vLLM if production
    if [ "$ENVIRONMENT" = "production" ]; then
        if ! wait_for_service "vLLM" "http://localhost:8000/health"; then
            log_warning "vLLM failed to start. Falling back to Ollama."
        fi
    fi

    log_success "All services are running"
}

download_models() {
    if [ "$SKIP_MODELS" = true ]; then
        log_info "Skipping model download (--skip-models flag)"
        return
    fi

    log_step "Downloading Required Models"

    # Determine models based on environment
    local models=()
    case $ENVIRONMENT in
        development)
            models=("${DEV_MODELS[@]}")
            ;;
        staging)
            models=("${STAGING_MODELS[@]}")
            ;;
        production)
            models=("${PROD_MODELS[@]}")
            ;;
    esac

    log_info "Models to install: ${models[*]}"

    # Check existing models
    local existing=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || echo "")

    for model in "${models[@]}"; do
        # Check if already installed
        if echo "$existing" | grep -q "^$model"; then
            log_info "Model already installed: $model"
            continue
        fi

        log_info "Pulling model: $model"

        # Pull model with progress
        curl -X POST http://localhost:11434/api/pull \
            -H "Content-Type: application/json" \
            -d "{\"name\": \"$model\", \"stream\": true}" \
            --no-buffer 2>/dev/null | while read -r line; do
            status=$(echo "$line" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            if [ -n "$status" ]; then
                echo -ne "\r  $status                              "
            fi
        done
        echo ""

        # Verify model was pulled
        if curl -s http://localhost:11434/api/tags | grep -q "\"$model\""; then
            log_success "Model installed: $model"
        else
            log_error "Failed to install model: $model"
            exit 1
        fi
    done

    log_success "All models downloaded"
}

create_custom_model() {
    log_step "Creating Custom Coaching Model"

    # Check if custom model already exists
    if curl -s http://localhost:11434/api/tags | grep -q '"upcoach-assistant"'; then
        log_info "Custom model 'upcoach-assistant' already exists"
        return
    fi

    # Create coaching-optimized model
    local modelfile='FROM mistral

SYSTEM You are an empathetic and supportive life coach named Coach AI. Your purpose is to help users:
- Set and achieve meaningful goals
- Build positive, sustainable habits
- Overcome obstacles and stay motivated
- Improve their overall well-being

Guidelines:
- Be warm, encouraging, and non-judgmental
- Ask thoughtful questions to understand the user'"'"'s situation
- Provide specific, actionable advice
- Celebrate progress, no matter how small
- Use evidence-based coaching techniques
- Keep responses focused and practical

Remember: You'"'"'re here to support and empower, not to prescribe or diagnose.

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER stop "</s>"
PARAMETER stop "[END]"'

    log_info "Creating upcoach-assistant model..."

    curl -X POST http://localhost:11434/api/create \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"upcoach-assistant\", \"modelfile\": $(echo "$modelfile" | jq -Rs .)}" \
        --no-buffer 2>/dev/null | while read -r line; do
        status=$(echo "$line" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$status" ]; then
            echo -ne "\r  $status                              "
        fi
    done
    echo ""

    log_success "Custom coaching model created"
}

verify_deployment() {
    log_step "Verifying Deployment"

    local errors=0

    # Test health endpoint
    log_info "Testing health endpoint..."
    health=$(curl -s http://localhost:3100/health)
    if echo "$health" | grep -q '"status":"ok"'; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
        ((errors++))
    fi

    # Test model list
    log_info "Testing model list endpoint..."
    models=$(curl -s http://localhost:3100/api/models)
    if echo "$models" | grep -q '"models"'; then
        model_count=$(echo "$models" | grep -o '"id"' | wc -l)
        log_success "Model list: $model_count models available"
    else
        log_error "Model list failed"
        ((errors++))
    fi

    # Test chat completion
    log_info "Testing chat completion..."
    response=$(curl -s -X POST http://localhost:3100/api/chat/completions \
        -H "Content-Type: application/json" \
        -d '{
            "model": "mistral",
            "messages": [{"role": "user", "content": "Say hello in one word"}],
            "max_tokens": 10
        }')

    if echo "$response" | grep -q '"choices"'; then
        log_success "Chat completion working"
    else
        log_error "Chat completion failed"
        ((errors++))
    fi

    # Test coaching endpoint
    log_info "Testing coaching endpoint..."
    coaching=$(curl -s -X POST http://localhost:3100/api/coaching/chat \
        -H "Content-Type: application/json" \
        -d '{
            "messages": [{"role": "user", "content": "Hi"}],
            "context_type": "general"
        }')

    if echo "$coaching" | grep -q '"message"'; then
        log_success "Coaching endpoint working"
    else
        log_error "Coaching endpoint failed"
        ((errors++))
    fi

    if [ $errors -gt 0 ]; then
        log_error "Verification failed with $errors errors"
        return 1
    fi

    log_success "All verification checks passed"
}

print_summary() {
    log_step "Deployment Summary"

    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              UpCoach LLM Stack Deployed Successfully           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}Environment:${NC}  $ENVIRONMENT"
    echo -e "  ${CYAN}GPU Enabled:${NC}  $GPU_ENABLED"
    echo ""
    echo -e "  ${CYAN}Services:${NC}"
    echo -e "    • LLM Gateway:  http://localhost:3100"
    echo -e "    • Ollama:       http://localhost:11434"
    echo -e "    • Redis:        localhost:6379"
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "    • vLLM:         http://localhost:8000"
    fi
    echo ""
    echo -e "  ${CYAN}API Endpoints:${NC}"
    echo -e "    • Health:       GET  /health"
    echo -e "    • Models:       GET  /api/models"
    echo -e "    • Chat:         POST /api/chat/completions"
    echo -e "    • Coaching:     POST /api/coaching/chat"
    echo -e "    • Embeddings:   POST /api/embeddings"
    echo -e "    • Metrics:      GET  /api/metrics"
    echo ""
    echo -e "  ${CYAN}Useful Commands:${NC}"
    echo -e "    • View logs:    docker-compose logs -f llm-gateway"
    echo -e "    • Stop stack:   docker-compose down"
    echo -e "    • Verify:       ./scripts/verify-llm-stack.sh"
    echo ""
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    print_banner

    parse_args "$@"

    log_info "Deploying UpCoach LLM Stack"
    log_info "Environment: $ENVIRONMENT"
    log_info "GPU Enabled: $GPU_ENABLED"
    log_info "Clean Deploy: $CLEAN_DEPLOY"

    check_prerequisites
    setup_environment
    clean_existing
    start_services
    wait_for_services
    download_models
    create_custom_model
    verify_deployment
    print_summary

    log_success "Deployment completed successfully!"
}

main "$@"
