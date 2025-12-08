# UpCoach ML Model Installation Guide

This comprehensive guide covers the installation, configuration, and management of ML models for the UpCoach AI coaching platform. The system uses a hybrid architecture with both server-side and on-device inference capabilities.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Server LLM Stack](#server-llm-stack)
5. [On-Device Models](#on-device-models)
6. [Model Catalog](#model-catalog)
7. [Feature-to-Model Mapping](#feature-to-model-mapping)
8. [Deployment Scripts](#deployment-scripts)
9. [Environment Configuration](#environment-configuration)
10. [Verification & Health Checks](#verification--health-checks)
11. [Troubleshooting](#troubleshooting)
12. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

UpCoach uses a **hybrid AI inference architecture** that combines:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UpCoach AI Architecture                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐    ┌───────────────────────────────────────────┐  │
│  │   Mobile App    │    │           Server LLM Stack                │  │
│  │                 │    │                                           │  │
│  │ ┌─────────────┐ │    │  ┌───────────┐  ┌───────────┐            │  │
│  │ │ On-Device   │ │    │  │  Ollama   │  │   vLLM    │            │  │
│  │ │ Inference   │ │    │  │ (Dev/Stg) │  │  (Prod)   │            │  │
│  │ │             │ │    │  └─────┬─────┘  └─────┬─────┘            │  │
│  │ │ - ONNX      │ │    │        │              │                   │  │
│  │ │ - CoreML    │ │    │        └──────┬───────┘                   │  │
│  │ │ - TFLite    │ │    │               │                           │  │
│  │ └─────────────┘ │    │        ┌──────▼──────┐                    │  │
│  │        │        │    │        │ LLM Gateway │                    │  │
│  │        │        │    │        │  (port 3100)│                    │  │
│  │        ▼        │    │        └──────┬──────┘                    │  │
│  │ ┌─────────────┐ │    │               │                           │  │
│  │ │ Hybrid AI   │◄┼────┼───────────────┘                           │  │
│  │ │  Service    │ │    │        ┌─────────────┐                    │  │
│  │ └─────────────┘ │    │        │    Redis    │                    │  │
│  │                 │    │        │   (Cache)   │                    │  │
│  └─────────────────┘    │        └─────────────┘                    │  │
│                         └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Inference Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `serverOnly` | Always use server inference | Complex reasoning, analytics |
| `onDeviceOnly` | Always use on-device inference | Offline, privacy-sensitive |
| `onDevicePreferred` | On-device first, server fallback | Low latency, bandwidth saving |
| `serverPreferred` | Server first, on-device fallback | Complex queries with offline backup |
| `auto` | Automatic selection based on context | Default, balanced approach |

---

## Prerequisites

### Hardware Requirements

**Development/Staging Server:**
- CPU: 8+ cores (Intel/AMD)
- RAM: 16GB minimum (32GB recommended)
- Storage: 50GB SSD for models
- GPU: Optional (CPU inference supported)

**Production Server:**
- CPU: 16+ cores
- RAM: 64GB minimum
- Storage: 100GB NVMe SSD
- GPU: NVIDIA RTX 3090/4090 or A100 (required for vLLM)

**Mobile/Edge Devices:**
- iOS: iPhone 11+ (A13 chip or newer)
- Android: 4GB RAM, ARMv8.2 with NEON

### Software Requirements

```bash
# Core dependencies
docker >= 24.0
docker-compose >= 2.20
python >= 3.10
node >= 18.0

# GPU support (optional)
nvidia-driver >= 525
nvidia-container-toolkit >= 1.13

# Mobile development
flutter >= 3.7.0
xcode >= 15.0  # iOS
android-studio  # Android
```

### Network Requirements

| Port | Service | Description |
|------|---------|-------------|
| 3100 | LLM Gateway | Main API endpoint |
| 11434 | Ollama | Development/staging LLM |
| 8000 | vLLM | Production LLM |
| 6379 | Redis | Response caching |

---

## Quick Start

### 1. Clone and Navigate

```bash
cd services/llm-server
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Deploy the Stack

```bash
# Development mode (Ollama only)
./scripts/deploy-llm-stack.sh --env development

# Staging mode (Ollama + full stack)
./scripts/deploy-llm-stack.sh --env staging

# Production mode (vLLM + optimized)
./scripts/deploy-llm-stack.sh --env production
```

### 4. Verify Installation

```bash
./scripts/verify-llm-stack.sh
```

### 5. Test the API

```bash
curl http://localhost:3100/health

curl -X POST http://localhost:3100/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "messages": [{"role": "user", "content": "Give me a motivation tip"}],
    "max_tokens": 100
  }'
```

---

## Server LLM Stack

### Docker Services

The server LLM stack consists of the following services:

#### 1. Ollama (Development/Staging)

```yaml
# docker-compose.yml
ollama:
  image: ollama/ollama:latest
  ports:
    - "11434:11434"
  environment:
    - OLLAMA_HOST=0.0.0.0
    - OLLAMA_ORIGINS=*
    - OLLAMA_NUM_PARALLEL=4
    - OLLAMA_MAX_LOADED_MODELS=2
```

**Features:**
- Easy model management via CLI
- Automatic quantization
- CPU and GPU support
- Hot model loading

#### 2. vLLM (Production)

```yaml
# docker-compose.yml
vllm:
  image: vllm/vllm-openai:latest
  ports:
    - "8000:8000"
  environment:
    - MODEL_NAME=mistralai/Mistral-7B-Instruct-v0.2
    - MAX_MODEL_LEN=4096
    - GPU_MEMORY_UTILIZATION=0.9
```

**Features:**
- High-throughput inference
- Continuous batching
- PagedAttention
- OpenAI-compatible API

#### 3. LLM Gateway

The gateway provides:
- **Load balancing** between Ollama and vLLM
- **Response caching** via Redis
- **Rate limiting** per user/IP
- **API key authentication**
- **Coaching-specific endpoints**
- **Metrics collection**

#### 4. Redis Cache

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Starting Services

```bash
# Start all services (development)
docker-compose up -d

# Start with production profile (includes vLLM)
docker-compose --profile production up -d

# Start model setup service
docker-compose --profile setup up model-manager

# View logs
docker-compose logs -f llm-gateway
```

---

## On-Device Models

### Supported Formats

| Platform | Format | Framework |
|----------|--------|-----------|
| iOS | CoreML (.mlmodel) | Apple Neural Engine |
| iOS | ONNX (.onnx) | ONNX Runtime |
| Android | ONNX (.onnx) | ONNX Runtime |
| Android | TFLite (.tflite) | TensorFlow Lite |

### Available Models

#### TinyLlama-1.1B (Default)
- **Size:** ~600MB (quantized)
- **Use case:** Quick coaching tips, affirmations
- **Latency:** 500-1000ms on modern devices

#### Phi-2 (2.7B)
- **Size:** ~1.5GB (quantized)
- **Use case:** Complex reasoning, goal analysis
- **Latency:** 1-2s on modern devices

#### SmolLM-360M (Lightweight)
- **Size:** ~200MB (quantized)
- **Use case:** Simple responses, reminders
- **Latency:** 200-400ms on modern devices

### Mobile Integration

The mobile app uses `OnDeviceLlmManager` for model management:

```dart
// lib/core/ondevice/on_device_llm_manager.dart

// Enable on-device inference
await onDeviceLlmManager.setEnabled(true);

// Download the active model
await onDeviceLlmManager.downloadActiveModel();

// Generate response
final response = await onDeviceLlmManager.maybeGenerate(prompt);
```

### Model Configuration in Flutter

```dart
// lib/core/ondevice/on_device_llm_state.dart

enum OnDeviceModelType {
  tinyLlama,  // Default, balanced
  phi2,       // Complex reasoning
  smolLM,     // Ultra-lightweight
}

class OnDeviceModelInfo {
  final String id;
  final String name;
  final String description;
  final int sizeBytes;
  final String downloadUrl;
  final OnDeviceModelType type;
}
```

---

## Model Catalog

### Server Models (`config/models.yaml`)

```yaml
models:
  # Primary conversational model
  - name: mistral
    description: General-purpose model for coaching conversations
    required: true
    use_cases:
      - coaching_chat
      - goal_setting
      - habit_formation

  # Lightweight model for quick responses
  - name: llama3.2:3b
    description: Lightweight model for quick responses
    required: false
    use_cases:
      - quick_tips
      - reminders
      - affirmations

  # Embedding model for semantic search
  - name: nomic-embed-text
    description: Embedding model for semantic search
    required: true
    use_cases:
      - content_search
      - similarity_matching
      - personalization

routing:
  default_model: mistral
  routes:
    - pattern: "quick|reminder|tip"
      model: llama3.2:3b
    - pattern: "goal|habit|motivation|wellness"
      model: mistral
    - pattern: "embed|search|similar"
      model: nomic-embed-text
```

### Edge Models (`config/edge_models.yaml`)

```yaml
edge_models:
  - id: tinyllama-1.1b
    name: TinyLlama 1.1B
    description: Balanced model for on-device coaching
    platforms: [ios, android]
    formats:
      onnx:
        url: https://models.upcoach.com/tinyllama-1.1b-q4.onnx
        size_mb: 580
        quantization: int4
      coreml:
        url: https://models.upcoach.com/tinyllama-1.1b.mlmodel
        size_mb: 620
    capabilities:
      - conversational
      - coaching
    max_context: 2048
    min_device_ram_gb: 3

  - id: smollm-360m
    name: SmolLM 360M
    description: Ultra-lightweight for basic responses
    platforms: [ios, android]
    formats:
      onnx:
        url: https://models.upcoach.com/smollm-360m-q4.onnx
        size_mb: 180
    capabilities:
      - basic_responses
      - affirmations
    max_context: 1024
    min_device_ram_gb: 2

defaults:
  ios: tinyllama-1.1b
  android: tinyllama-1.1b
  low_memory: smollm-360m
```

---

## Feature-to-Model Mapping

| Feature | Server Model | Edge Model | Notes |
|---------|-------------|------------|-------|
| Coaching Chat | mistral | tinyllama-1.1b | Full context on server |
| Goal Setting | mistral | tinyllama-1.1b | Complex reasoning needed |
| Habit Tips | llama3.2:3b | smollm-360m | Quick responses |
| Daily Affirmations | llama3.2:3b | smollm-360m | Simple generation |
| Voice Coaching | mistral | - | Server only (audio processing) |
| Content Search | nomic-embed-text | - | Server only (embeddings) |
| Mood Analysis | mistral | - | Server only (complex) |
| Recommendations | mistral | - | Server only (personalization) |
| Quick Reminders | llama3.2:3b | smollm-360m | Low latency |

### Hybrid Routing Logic

```dart
// lib/core/services/hybrid_ai_service.dart

bool _shouldUseOnDevice(String message) {
  switch (_config.mode) {
    case AIInferenceMode.serverOnly:
      return false;
    case AIInferenceMode.onDeviceOnly:
      return true;
    case AIInferenceMode.onDevicePreferred:
      return isOnDeviceAvailable;
    case AIInferenceMode.serverPreferred:
      return !isServerAvailable && isOnDeviceAvailable;
    case AIInferenceMode.auto:
      // Use on-device for:
      // - Short prompts (faster response)
      // - When offline
      // - Simple queries
      if (!isServerAvailable) return true;
      if (message.length <= _config.onDeviceMaxPromptLength) {
        return _isSimpleQuery(message);
      }
      return false;
  }
}
```

---

## Deployment Scripts

### deploy-llm-stack.sh

Complete deployment automation:

```bash
#!/bin/bash
# Usage: ./scripts/deploy-llm-stack.sh [--env development|staging|production]

# Features:
# - Environment-specific configuration
# - Automatic model download
# - Health check verification
# - Rollback on failure
```

### verify-llm-stack.sh

Health and functionality verification:

```bash
#!/bin/bash
# Usage: ./scripts/verify-llm-stack.sh

# Checks:
# - Service availability
# - Model loading status
# - API functionality
# - Response quality
# - Latency benchmarks
```

### setup_models.py

Model download and configuration:

```python
#!/usr/bin/env python3
# Usage: python scripts/setup_models.py

# Features:
# - Pull required models from Ollama registry
# - Create custom coaching model (upcoach-assistant)
# - Verify model functionality
# - Report installation status
```

---

## Environment Configuration

### Development (.env.development)

```bash
# API Security
LLM_API_KEY=dev-key-local-only

# Model Configuration
VLLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# Performance
RATE_LIMIT_RPM=120
CACHE_TTL=300

# Logging
LOG_LEVEL=debug

# Ports
GATEWAY_PORT=3100
OLLAMA_PORT=11434
REDIS_PORT=6379
```

### Staging (.env.staging)

```bash
# API Security
LLM_API_KEY=stg-xxx-secure-key

# Model Configuration
VLLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# Performance
RATE_LIMIT_RPM=60
CACHE_TTL=1800

# Logging
LOG_LEVEL=info

# GPU Configuration
GPU_MEMORY_UTILIZATION=0.8
TENSOR_PARALLEL_SIZE=1
```

### Production (.env.production)

```bash
# API Security
LLM_API_KEY=${SECRET_LLM_API_KEY}  # From secrets manager

# Model Configuration
VLLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# Performance
RATE_LIMIT_RPM=60
CACHE_TTL=3600

# Logging
LOG_LEVEL=warn

# GPU Configuration
GPU_MEMORY_UTILIZATION=0.9
TENSOR_PARALLEL_SIZE=1

# Security
TLS_ENABLED=true
CORS_ORIGINS=https://app.upcoach.com
```

### Mobile Configuration

```dart
// lib/core/config/app_config.dart

static const development = AppConfig(
  llmServerUrl: 'http://localhost:3100',
  // ...
);

static const staging = AppConfig(
  llmServerUrl: 'https://staging-llm.upcoach.com',
  // ...
);

static const production = AppConfig(
  llmServerUrl: 'https://llm.upcoach.com',
  // ...
);
```

---

## Verification & Health Checks

### API Health Check

```bash
curl http://localhost:3100/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-05T10:30:00.000Z",
  "services": {
    "ollama": "healthy",
    "redis": "healthy"
  }
}
```

### Model Availability

```bash
curl http://localhost:3100/api/models
```

Response:
```json
{
  "models": [
    {"id": "mistral", "name": "mistral", "size": 4100000000},
    {"id": "llama3.2:3b", "name": "llama3.2:3b", "size": 2000000000},
    {"id": "nomic-embed-text", "name": "nomic-embed-text", "size": 274000000}
  ]
}
```

### Chat Functionality Test

```bash
curl -X POST http://localhost:3100/api/coaching/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Help me build a morning routine"}],
    "context_type": "habits"
  }'
```

### Metrics Endpoint

```bash
curl http://localhost:3100/api/metrics
```

Response:
```json
{
  "requests_total": 1523,
  "cache_hits": 456,
  "cache_misses": 1067,
  "errors_total": 12,
  "active_connections": 5
}
```

---

## Troubleshooting

### Common Issues

#### 1. Ollama Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:11434
```

**Solution:**
```bash
# Check if Ollama is running
docker-compose ps ollama

# Restart Ollama
docker-compose restart ollama

# Check logs
docker-compose logs ollama
```

#### 2. Model Download Fails

```
Error: Failed to pull model: network timeout
```

**Solution:**
```bash
# Increase timeout
export OLLAMA_KEEP_ALIVE=60m

# Manual pull
docker exec -it upcoach-ollama ollama pull mistral

# Check disk space
docker exec -it upcoach-ollama df -h
```

#### 3. Out of Memory (GPU)

```
CUDA error: out of memory
```

**Solution:**
```bash
# Reduce GPU memory utilization
GPU_MEMORY_UTILIZATION=0.7

# Or use smaller model
VLLM_MODEL=mistralai/Mistral-7B-v0.1  # Base model, smaller

# Or enable CPU offloading
--cpu-offload-gb 8
```

#### 4. High Latency

**Diagnosis:**
```bash
# Check model loading status
curl http://localhost:11434/api/tags

# Monitor GPU usage
nvidia-smi -l 1

# Check cache hit rate
curl http://localhost:3100/api/metrics
```

**Solutions:**
- Enable response caching
- Use smaller models for simple queries
- Increase GPU memory allocation
- Optimize batch size

#### 5. On-Device Model Not Loading

**Diagnosis (Flutter):**
```dart
debugPrint('LLM State: ${onDeviceLlmState.status}');
debugPrint('Model Path: ${onDeviceLlmState.modelPath}');
debugPrint('Last Error: ${onDeviceLlmState.lastError}');
```

**Solutions:**
- Clear app cache and re-download
- Check available device storage
- Verify model file integrity
- Test with smaller model (smollm-360m)

### Log Locations

| Service | Log Command |
|---------|------------|
| LLM Gateway | `docker-compose logs -f llm-gateway` |
| Ollama | `docker-compose logs -f ollama` |
| vLLM | `docker-compose logs -f vllm` |
| Redis | `docker-compose logs -f redis` |
| Flutter | Run app in debug mode |

---

## Performance Optimization

### Server-Side

1. **Enable Response Caching**
   ```bash
   CACHE_TTL=3600  # 1 hour for stable prompts
   ```

2. **Use Model Routing**
   - Simple queries → `llama3.2:3b` (faster)
   - Complex queries → `mistral` (smarter)

3. **Optimize Batch Size**
   ```bash
   OLLAMA_NUM_PARALLEL=4  # Concurrent requests
   OLLAMA_MAX_LOADED_MODELS=2  # Memory management
   ```

4. **GPU Memory Tuning**
   ```bash
   GPU_MEMORY_UTILIZATION=0.9  # Maximize usage
   TENSOR_PARALLEL_SIZE=2  # Multi-GPU
   ```

### Mobile/Edge

1. **Lazy Model Loading**
   - Don't load model on app start
   - Load when AI features are accessed

2. **Progressive Model Quality**
   - Start with smollm-360m for instant responses
   - Upgrade to tinyllama-1.1b for complex queries

3. **Cache Frequent Responses**
   - Cache affirmations and tips locally
   - Reduce model inference calls

4. **Background Model Updates**
   - Download model updates on WiFi only
   - Use delta updates when possible

### Benchmarks

| Operation | Server (GPU) | Server (CPU) | Edge (iPhone 14) | Edge (Pixel 7) |
|-----------|-------------|--------------|------------------|----------------|
| Simple tip | 150ms | 800ms | 400ms | 500ms |
| Coaching chat | 500ms | 2.5s | 1.2s | 1.5s |
| Goal analysis | 800ms | 4s | 2s | 2.5s |
| Embeddings | 50ms | 200ms | N/A | N/A |

---

## Support

For issues with LLM infrastructure:

- **Internal:** Create issue in UpCoach repository
- **Ollama:** https://github.com/ollama/ollama/issues
- **vLLM:** https://github.com/vllm-project/vllm/issues
- **ONNX Runtime:** https://github.com/microsoft/onnxruntime/issues

Contact: dev@upcoach.com
