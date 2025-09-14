# UpCoach Local LLM - API Specification

## Overview

This document provides comprehensive API documentation for UpCoach's Local LLM implementation. The API supports hybrid local/cloud processing, mobile platform integration, enterprise deployment, and comprehensive monitoring capabilities.

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Hybrid Processing APIs](#hybrid-processing-apis)
3. [Local LLM Management APIs](#local-llm-management-apis)
4. [Mobile Plugin APIs](#mobile-plugin-apis)
5. [Enterprise APIs](#enterprise-apis)
6. [Monitoring & Analytics APIs](#monitoring--analytics-apis)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [API Examples](#api-examples)
10. [OpenAPI Specification](#openapi-specification)

## Authentication & Security

### Base URL

- **Development**: `http://localhost:8080/api`
- **Staging**: `https://staging-api.upcoach.ai/api`
- **Production**: `https://api.upcoach.ai/api`

### Authentication

All API requests require authentication using Bearer tokens:

```http
Authorization: Bearer <jwt_token>
```

### Security Headers

```http
Content-Type: application/json
X-Request-ID: <unique_request_id>
X-Client-Version: <client_version>
X-Device-ID: <device_identifier>
```

### Enhanced Security for Local LLM

Local LLM endpoints implement additional security measures:

- **Content Validation**: All inputs validated for prompt injection
- **Privacy Classification**: Automatic privacy level detection
- **Audit Logging**: Complete audit trail for compliance
- **Rate Limiting**: Per-user and per-model rate limits

## Hybrid Processing APIs

### POST /ai/hybrid/process

Main endpoint for hybrid local/cloud AI processing with intelligent routing.

#### Request

```http
POST /api/ai/hybrid/process
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "messages": [
    {
      "role": "system|user|assistant",
      "content": "string",
      "name": "string (optional)"
    }
  ],
  "routingHints": {
    "preferLocal": "boolean (optional)",
    "privacyLevel": "public|private|sensitive",
    "maxLatency": "number (ms, optional)",
    "costSensitivity": "number (0-1, optional)"
  },
  "deviceProfile": {
    "model": "string",
    "capabilities": ["string"],
    "batteryLevel": "number (0-100)",
    "thermalState": "nominal|fair|serious|critical",
    "networkCondition": "excellent|good|poor|offline"
  },
  "options": {
    "temperature": "number (0-1, default: 0.7)",
    "maxTokens": "number (default: 1000)",
    "personality": "supportive|motivational|analytical|mindful",
    "streaming": "boolean (default: false)",
    "contextId": "string (optional)"
  }
}
```

#### Response

```json
{
  "id": "string",
  "content": "string",
  "processingMode": "local|cloud|hybrid",
  "routingDecision": {
    "route": "local|cloud|hybrid",
    "confidence": "number (0-1)",
    "reasoning": "string",
    "factors": {
      "privacyScore": "number (0-1)",
      "complexityScore": "number (0-1)",
      "deviceCapability": "number (0-1)",
      "costFactor": "number (0-1)"
    }
  },
  "usage": {
    "promptTokens": "number",
    "completionTokens": "number",
    "totalTokens": "number"
  },
  "metrics": {
    "latency": "number (ms)",
    "tokensPerSecond": "number",
    "costIncurred": "number (USD)",
    "energyUsed": "number (mAh, mobile only)"
  },
  "model": "string",
  "provider": "local|openai|claude",
  "securityMetadata": {
    "inputValidated": "boolean",
    "outputValidated": "boolean",
    "riskLevel": "low|medium|high|critical",
    "privacyCompliant": "boolean"
  },
  "timestamp": "string (ISO 8601)"
}
```

#### Status Codes

- `200 OK`: Successful response generated
- `202 Accepted`: Request queued for processing (async mode)
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `429 Too Many Requests`: Rate limit exceeded
- `503 Service Unavailable`: All processing methods unavailable

### POST /ai/hybrid/stream

Streaming version of hybrid processing for real-time response generation.

#### Request

Same as `/ai/hybrid/process` with `streaming: true`

#### Response

**Server-Sent Events (SSE) Stream:**

```
data: {"type": "routing", "decision": {"route": "local", "reasoning": "privacy requirements"}}

data: {"type": "token", "content": "I", "tokenIndex": 0}

data: {"type": "token", "content": " understand", "tokenIndex": 1}

data: {"type": "completion", "response": {...complete_response}}
```

**Event Types:**
- `routing`: Routing decision made
- `token`: Individual token generated
- `completion`: Final response with metadata
- `error`: Error occurred during processing

### GET /ai/hybrid/routing-preview

Preview routing decision without generating response.

#### Request

```http
GET /api/ai/hybrid/routing-preview?privacy=sensitive&complexity=high&device=iPhone15
```

#### Response

```json
{
  "recommendedRoute": "local|cloud|hybrid",
  "confidence": "number (0-1)",
  "reasoning": "string",
  "expectedLatency": "number (ms)",
  "estimatedCost": "number (USD)",
  "alternatives": [
    {
      "route": "cloud",
      "tradeoffs": "Higher cost, better quality",
      "latency": "number (ms)",
      "cost": "number (USD)"
    }
  ]
}
```

## Local LLM Management APIs

### POST /ai/local/models/load

Load a specific local LLM model.

#### Request

```json
{
  "modelName": "mistral-7b-v0.1|llama-3.1-8b|tinyllama-1.1b",
  "quantization": "Q4_K_M|Q8_0|Q4_0",
  "options": {
    "gpuLayers": "number (default: 32)",
    "contextSize": "number (default: 4096)",
    "threads": "number (default: 8)",
    "preloadCache": "boolean (default: true)"
  }
}
```

#### Response

```json
{
  "modelId": "string",
  "modelName": "string",
  "status": "loading|ready|error",
  "loadTime": "number (ms)",
  "memoryUsage": "number (MB)",
  "gpuMemoryUsage": "number (MB)",
  "capabilities": {
    "maxTokens": "number",
    "supportedLanguages": ["string"],
    "specializations": ["coaching", "analysis", "creative"]
  },
  "performance": {
    "estimatedLatency": "number (ms)",
    "tokensPerSecond": "number",
    "maxConcurrentRequests": "number"
  }
}
```

### GET /ai/local/models

List available and loaded models.

#### Response

```json
{
  "availableModels": [
    {
      "name": "mistral-7b-v0.1",
      "size": "3.5GB",
      "quantizations": ["Q4_K_M", "Q8_0"],
      "description": "General purpose coaching model",
      "requirements": {
        "minMemory": "8GB",
        "recommendedGPU": "8GB VRAM"
      }
    }
  ],
  "loadedModels": [
    {
      "modelId": "string",
      "name": "mistral-7b-v0.1",
      "status": "ready",
      "memoryUsage": "number (MB)",
      "loadedAt": "string (ISO 8601)",
      "requestCount": "number",
      "avgLatency": "number (ms)"
    }
  ],
  "systemStatus": {
    "totalMemory": "number (GB)",
    "availableMemory": "number (GB)",
    "gpuUtilization": "number (0-100)",
    "thermalState": "nominal|elevated|high"
  }
}
```

### DELETE /ai/local/models/{modelId}

Unload a specific model to free memory.

#### Response

```json
{
  "success": "boolean",
  "memoryFreed": "number (MB)",
  "message": "string"
}
```

### POST /ai/local/generate

Direct local generation (bypasses hybrid routing).

#### Request

```json
{
  "modelId": "string (optional, uses default if not specified)",
  "messages": [...],
  "options": {
    "temperature": "number (0-1)",
    "maxTokens": "number",
    "topP": "number (0-1)",
    "topK": "number",
    "stopSequences": ["string"],
    "streaming": "boolean"
  }
}
```

#### Response

Same format as hybrid processing with `processingMode: "local"`

### GET /ai/local/health

Health check for local LLM service.

#### Response

```json
{
  "status": "healthy|degraded|unhealthy",
  "modelsLoaded": "number",
  "systemResources": {
    "memoryUsage": "number (MB)",
    "gpuMemory": "number (MB)",
    "cpuUsage": "number (0-100)",
    "thermalState": "string"
  },
  "performance": {
    "avgLatency": "number (ms)",
    "throughput": "number (requests/sec)",
    "errorRate": "number (0-1)"
  },
  "lastError": "string (optional)"
}
```

## Mobile Plugin APIs

### Platform-Specific Endpoints

These endpoints are available through Flutter platform channels and native mobile implementations.

### Method: initialize

Initialize local LLM service on mobile device.

#### Parameters

```dart
Map<String, dynamic> params = {};
```

#### Returns

```dart
{
  "success": bool,
  "platform": "ios|android",
  "engine": "coreml|onnxruntime",
  "deviceCapabilities": {
    "neuralEngine": bool,
    "maxMemory": int, // MB
    "supportedModels": [String]
  }
}
```

### Method: loadModel

Load model on mobile device.

#### Parameters

```dart
{
  "modelName": "phi-2-quantized|tinyllama-mobile",
  "options": {
    "quantization": "int8|fp16",
    "optimization": "speed|quality|balanced"
  }
}
```

#### Returns

```dart
{
  "success": bool,
  "modelId": String,
  "loadTime": double, // seconds
  "memoryUsage": int, // MB
  "estimatedLatency": double // ms per token
}
```

### Method: generateResponse

Generate response on mobile device.

#### Parameters

```dart
{
  "prompt": String,
  "context": Map<String, dynamic>,
  "options": {
    "temperature": double,
    "maxTokens": int,
    "streaming": bool
  }
}
```

#### Returns

```dart
{
  "content": String,
  "tokensGenerated": int,
  "latency": double, // ms
  "batteryUsed": double, // mAh
  "thermalImpact": String // "minimal|moderate|high"
}
```

### Method: checkDeviceCapability

Assess device capability for local LLM.

#### Returns

```dart
{
  "isSupported": bool,
  "recommendedModel": String?,
  "maxTokens": int,
  "estimatedLatency": double,
  "batteryImpact": String,
  "thermalConstraints": {
    "maxContinuousMinutes": int,
    "throttlingThreshold": String
  }
}
```

### Method: getBatteryOptimizedConfig

Get battery-optimized configuration.

#### Parameters

```dart
{
  "batteryLevel": double // 0-100
}
```

#### Returns

```dart
{
  "enableLocalProcessing": bool,
  "fallbackToCloud": bool,
  "maxConcurrentRequests": int,
  "throttleAfter": int, // requests
  "pauseProcessing": bool
}
```

## Enterprise APIs

### POST /ai/enterprise/deploy

Deploy local LLM for enterprise on-premise installation.

#### Request

```json
{
  "deployment": {
    "type": "docker|kubernetes|standalone",
    "environment": "development|staging|production",
    "region": "us-east-1|eu-west-1|ap-southeast-1",
    "compliance": ["GDPR", "HIPAA", "SOC2"]
  },
  "configuration": {
    "models": ["mistral-7b-v0.1"],
    "scaling": {
      "minInstances": "number",
      "maxInstances": "number",
      "autoScaling": "boolean"
    },
    "security": {
      "encryption": "aes-256|aes-128",
      "accessControl": "rbac|abac",
      "auditLevel": "basic|detailed|comprehensive"
    }
  },
  "integration": {
    "existingAuth": "boolean",
    "ssoProvider": "okta|azure-ad|google",
    "dataResidency": "string"
  }
}
```

#### Response

```json
{
  "deploymentId": "string",
  "status": "pending|deploying|ready|failed",
  "endpoints": {
    "api": "string (URL)",
    "management": "string (URL)",
    "monitoring": "string (URL)"
  },
  "credentials": {
    "apiKey": "string",
    "managementToken": "string"
  },
  "configuration": {
    "dataResidency": "string",
    "complianceStatus": {
      "GDPR": "compliant|pending|not-applicable",
      "HIPAA": "compliant|pending|not-applicable",
      "SOC2": "compliant|pending|not-applicable"
    }
  }
}
```

### GET /ai/enterprise/deployments

List enterprise deployments.

#### Response

```json
{
  "deployments": [
    {
      "deploymentId": "string",
      "name": "string",
      "status": "running|stopped|maintenance",
      "region": "string",
      "createdAt": "string (ISO 8601)",
      "lastUpdated": "string (ISO 8601)",
      "usage": {
        "requestsToday": "number",
        "avgLatency": "number (ms)",
        "errorRate": "number (0-1)"
      }
    }
  ]
}
```

### POST /ai/enterprise/fine-tune

Initiate custom model fine-tuning for enterprise customer.

#### Request

```json
{
  "baseModel": "mistral-7b-v0.1|llama-3.1-8b",
  "trainingData": {
    "datasetId": "string",
    "dataFormat": "jsonl|csv|parquet",
    "size": "number (MB)",
    "samples": "number"
  },
  "parameters": {
    "epochs": "number (1-10)",
    "learningRate": "number (1e-6 to 1e-3)",
    "batchSize": "number",
    "validationSplit": "number (0-0.3)"
  },
  "validation": {
    "testDataset": "string (optional)",
    "qualityThreshold": "number (0-1)",
    "performanceBenchmarks": ["latency", "accuracy", "safety"]
  }
}
```

#### Response

```json
{
  "fineTuneId": "string",
  "status": "queued|training|validating|completed|failed",
  "estimatedTime": "number (hours)",
  "progress": {
    "currentEpoch": "number",
    "totalEpochs": "number",
    "loss": "number",
    "validationAccuracy": "number"
  },
  "artifacts": {
    "modelPath": "string (when completed)",
    "validationReport": "string (URL)",
    "benchmarkResults": "string (URL)"
  }
}
```

### GET /ai/enterprise/compliance

Get compliance status and reports.

#### Response

```json
{
  "complianceFrameworks": {
    "GDPR": {
      "status": "compliant",
      "lastAudit": "string (ISO 8601)",
      "dataProcessing": {
        "lawfulBasis": "consent|legitimate-interest",
        "dataRetention": "2557 days", // 7 years
        "rightToErasure": "implemented"
      },
      "technicalMeasures": [
        "encryption-at-rest",
        "encryption-in-transit",
        "access-logging",
        "pseudonymization"
      ]
    },
    "HIPAA": {
      "status": "compliant",
      "safeguards": {
        "administrative": "implemented",
        "physical": "implemented", 
        "technical": "implemented"
      },
      "baAgreement": "signed"
    },
    "SOC2": {
      "status": "compliant",
      "reportDate": "string (ISO 8601)",
      "controlObjectives": {
        "security": "pass",
        "availability": "pass",
        "integrity": "pass",
        "confidentiality": "pass",
        "privacy": "pass"
      }
    }
  },
  "auditTrail": {
    "totalEvents": "number",
    "retentionPeriod": "2557 days",
    "lastExport": "string (ISO 8601)"
  }
}
```

## Monitoring & Analytics APIs

### GET /ai/analytics/performance

Get performance analytics for local LLM usage.

#### Query Parameters

- `timeRange`: `1h|24h|7d|30d|90d`
- `granularity`: `minute|hour|day`
- `metrics`: `latency,throughput,quality,cost`
- `breakdown`: `model,user,device,privacy-level`

#### Response

```json
{
  "timeRange": "24h",
  "metrics": {
    "latency": {
      "average": "number (ms)",
      "p50": "number (ms)",
      "p95": "number (ms)",
      "p99": "number (ms)",
      "timeSeries": [
        {
          "timestamp": "string (ISO 8601)",
          "value": "number"
        }
      ]
    },
    "throughput": {
      "requestsPerSecond": "number",
      "tokensPerSecond": "number",
      "timeSeries": [...]
    },
    "quality": {
      "averageRating": "number (1-5)",
      "responseRelevance": "number (0-1)",
      "userSatisfaction": "number (0-1)",
      "timeSeries": [...]
    },
    "costSavings": {
      "totalSaved": "number (USD)",
      "percentageSaved": "number (0-100)",
      "breakdown": {
        "localProcessing": "number (USD saved)",
        "reducedCloudUsage": "number (USD saved)"
      }
    }
  },
  "routing": {
    "localRequests": "number",
    "cloudRequests": "number",
    "hybridRequests": "number",
    "fallbackRate": "number (0-1)"
  },
  "devices": {
    "breakdown": [
      {
        "deviceType": "iPhone 15",
        "requestCount": "number",
        "avgLatency": "number (ms)",
        "batteryImpact": "number (mAh/request)"
      }
    ]
  }
}
```

### GET /ai/analytics/usage

Get usage analytics and patterns.

#### Response

```json
{
  "overview": {
    "totalRequests": "number",
    "uniqueUsers": "number",
    "averageSessionLength": "number (minutes)",
    "mostActiveHours": ["number (0-23)"]
  },
  "userBehavior": {
    "preferenceDistribution": {
      "local": "number (0-1)",
      "cloud": "number (0-1)",
      "auto": "number (0-1)"
    },
    "privacyAwareness": {
      "sensitiveDataQueries": "number",
      "privacyModeUsage": "number (0-1)"
    }
  },
  "modelPerformance": [
    {
      "modelName": "mistral-7b-v0.1",
      "usage": "number (requests)",
      "averageRating": "number (1-5)",
      "errorRate": "number (0-1)",
      "averageLatency": "number (ms)"
    }
  ],
  "trends": {
    "adoptionRate": "number (new users/week)",
    "retentionRate": "number (0-1)",
    "engagementGrowth": "number (% change)"
  }
}
```

### GET /ai/analytics/cost

Get detailed cost analysis and savings.

#### Response

```json
{
  "costAnalysis": {
    "current": {
      "localProcessing": "number (USD)",
      "cloudProcessing": "number (USD)",
      "infrastructure": "number (USD)",
      "total": "number (USD)"
    },
    "projectedWithoutLocal": {
      "cloudProcessing": "number (USD)",
      "total": "number (USD)"
    },
    "savings": {
      "amount": "number (USD)",
      "percentage": "number (0-100)",
      "breakdown": {
        "reducedAPIcalls": "number (USD)",
        "volumeDiscounts": "number (USD)",
        "efficiencyGains": "number (USD)"
      }
    }
  },
  "trends": {
    "monthlySavings": [
      {
        "month": "string (YYYY-MM)",
        "saved": "number (USD)",
        "totalCost": "number (USD)"
      }
    ],
    "projectedAnnualSavings": "number (USD)"
  },
  "costPerRequest": {
    "local": "number (USD)",
    "cloud": "number (USD)",
    "savings": "number (USD)"
  }
}
```

### POST /ai/analytics/feedback

Submit user feedback for quality improvement.

#### Request

```json
{
  "requestId": "string",
  "rating": "number (1-5)",
  "feedback": {
    "quality": "number (1-5)",
    "relevance": "number (1-5)",
    "speed": "number (1-5)",
    "privacy": "number (1-5)"
  },
  "comments": "string (optional)",
  "categories": ["helpful", "accurate", "fast", "private"],
  "issues": ["slow", "irrelevant", "incorrect", "privacy-concern"]
}
```

#### Response

```json
{
  "feedbackId": "string",
  "status": "received",
  "acknowledgment": "Thank you for your feedback. It helps improve our AI coaching experience."
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string (optional)",
    "requestId": "string",
    "timestamp": "string (ISO 8601)"
  },
  "context": {
    "endpoint": "string",
    "method": "string",
    "userId": "string (if authenticated)"
  },
  "suggestions": [
    {
      "action": "string",
      "description": "string"
    }
  ]
}
```

### Error Codes

#### 4xx Client Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `INVALID_REQUEST` | 400 | Malformed request body | Check request format |
| `MISSING_PARAMETERS` | 400 | Required parameters missing | Add missing parameters |
| `INVALID_MODEL` | 400 | Specified model not available | Use available model |
| `PROMPT_TOO_LONG` | 400 | Input exceeds token limit | Reduce input length |
| `UNAUTHORIZED` | 401 | Invalid or missing token | Provide valid auth token |
| `FORBIDDEN` | 403 | Insufficient permissions | Check user permissions |
| `MODEL_NOT_FOUND` | 404 | Model not loaded/available | Load model first |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Reduce request rate |

#### 5xx Server Errors

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `MODEL_LOAD_FAILED` | 500 | Failed to load LLM model | Check system resources |
| `INFERENCE_FAILED` | 500 | Model inference error | Retry or use fallback |
| `MEMORY_EXHAUSTED` | 503 | Insufficient memory | Wait or use smaller model |
| `GPU_UNAVAILABLE` | 503 | GPU acceleration failed | Check GPU status |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down | Wait and retry |

#### Local LLM Specific Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `LOCAL_MODEL_NOT_LOADED` | Local model not ready | Load model via `/ai/local/models/load` |
| `THERMAL_THROTTLING` | Device thermal protection active | Wait for cooling |
| `BATTERY_OPTIMIZATION` | Low battery, local processing disabled | Charge device or use cloud |
| `DEVICE_INCOMPATIBLE` | Device doesn't support local LLM | Use cloud processing |
| `MODEL_CORRUPTED` | Model file integrity check failed | Re-download model |

### Error Response Examples

#### Model Not Loaded Error

```json
{
  "error": {
    "code": "LOCAL_MODEL_NOT_LOADED",
    "message": "Local LLM model is not loaded or ready",
    "details": "Model 'mistral-7b-v0.1' requires loading before inference",
    "requestId": "req_123456789",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "context": {
    "endpoint": "/ai/local/generate",
    "method": "POST",
    "userId": "user_123"
  },
  "suggestions": [
    {
      "action": "load_model",
      "description": "Load the model using POST /ai/local/models/load"
    },
    {
      "action": "use_hybrid",
      "description": "Use POST /ai/hybrid/process for automatic routing"
    }
  ]
}
```

#### Rate Limit Error

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Request rate limit exceeded",
    "details": "Maximum 100 requests per minute exceeded. Limit resets in 30 seconds.",
    "requestId": "req_123456790",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "context": {
    "endpoint": "/ai/hybrid/process",
    "method": "POST",
    "userId": "user_123"
  },
  "rateLimit": {
    "limit": 100,
    "remaining": 0,
    "resetTime": "2024-01-15T10:30:30Z",
    "retryAfter": 30
  }
}
```

## Rate Limiting

### Default Limits

| Endpoint Category | Requests/Minute | Requests/Hour | Requests/Day |
|------------------|-----------------|---------------|--------------|
| Hybrid Processing | 100 | 2,000 | 10,000 |
| Local LLM Management | 20 | 200 | 1,000 |
| Mobile Plugin | 200 | 4,000 | 20,000 |
| Enterprise APIs | 500 | 10,000 | 50,000 |
| Analytics | 60 | 600 | 3,000 |

### Rate Limit Headers

All responses include rate limiting information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642251600
X-RateLimit-Retry-After: 30
```

### Enterprise Rate Limits

Enterprise customers receive higher limits:

- **Hybrid Processing**: 1,000/min, 20,000/hour
- **Custom Models**: No limit on enterprise deployments
- **Analytics**: 500/min, 5,000/hour

## API Examples

### Basic Coaching Response

```bash
curl -X POST "https://api.upcoach.ai/api/ai/hybrid/process" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user", 
        "content": "I am feeling unmotivated about my fitness goals"
      }
    ],
    "routingHints": {
      "privacyLevel": "private",
      "preferLocal": true
    },
    "options": {
      "personality": "motivational",
      "maxTokens": 500
    }
  }'
```

### Privacy-Sensitive Query

```bash
curl -X POST "https://api.upcoach.ai/api/ai/hybrid/process" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user", 
        "content": "I have been dealing with anxiety and would like some coping strategies"
      }
    ],
    "routingHints": {
      "privacyLevel": "sensitive"
    },
    "deviceProfile": {
      "model": "iPhone 15 Pro",
      "batteryLevel": 85,
      "thermalState": "nominal"
    }
  }'
```

### Mobile Model Loading

```dart
// Flutter example
final response = await platform.invokeMethod('loadModel', {
  'modelName': 'phi-2-quantized',
  'options': {
    'optimization': 'balanced',
    'quantization': 'int8'
  }
});

if (response['success']) {
  print('Model loaded: ${response['modelId']}');
  print('Estimated latency: ${response['estimatedLatency']}ms');
}
```

### Enterprise Deployment

```bash
curl -X POST "https://api.upcoach.ai/api/ai/enterprise/deploy" \
  -H "Authorization: Bearer <enterprise_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deployment": {
      "type": "kubernetes",
      "environment": "production",
      "region": "eu-west-1",
      "compliance": ["GDPR", "SOC2"]
    },
    "configuration": {
      "models": ["mistral-7b-v0.1"],
      "scaling": {
        "minInstances": 2,
        "maxInstances": 10,
        "autoScaling": true
      },
      "security": {
        "encryption": "aes-256",
        "accessControl": "rbac",
        "auditLevel": "comprehensive"
      }
    },
    "integration": {
      "existingAuth": true,
      "ssoProvider": "azure-ad",
      "dataResidency": "eu"
    }
  }'
```

### Performance Analytics

```bash
curl -X GET "https://api.upcoach.ai/api/ai/analytics/performance?timeRange=24h&metrics=latency,cost&breakdown=model" \
  -H "Authorization: Bearer <token>"
```

### Streaming Response

```javascript
// JavaScript example using EventSource
const eventSource = new EventSource('https://api.upcoach.ai/api/ai/hybrid/stream', {
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  }
});

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'routing':
      console.log('Routing decision:', data.decision);
      break;
    case 'token':
      process.stdout.write(data.content);
      break;
    case 'completion':
      console.log('\nResponse complete:', data.response);
      eventSource.close();
      break;
  }
};
```

## OpenAPI Specification

Complete OpenAPI 3.0 specification available at: `/api/docs/openapi.json`

### Quick Access

- **Interactive Docs**: `https://api.upcoach.ai/docs`
- **Redoc**: `https://api.upcoach.ai/redoc`
- **Postman Collection**: Available in `/docs/postman/`

### Schema Validation

All requests are validated against JSON schemas. Key schemas:

- `HybridProcessRequest`
- `LocalLLMConfig`
- `MobileDeviceProfile`
- `EnterpriseDeployment`
- `AnalyticsQuery`

### Code Generation

OpenAPI specification supports code generation for multiple languages:

```bash
# Generate Python client
openapi-generator generate -i openapi.json -g python -o ./clients/python

# Generate TypeScript client  
openapi-generator generate -i openapi.json -g typescript-axios -o ./clients/typescript

# Generate Dart client for Flutter
openapi-generator generate -i openapi.json -g dart -o ./clients/dart
```

---

This API specification provides comprehensive coverage of UpCoach's Local LLM capabilities. For implementation guidance, see the [Developer Guide](LOCAL_LLM_DEVELOPER_GUIDE.md) and [Mobile Integration Guide](LOCAL_LLM_MOBILE_INTEGRATION_GUIDE.md).