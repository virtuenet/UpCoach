# UpCoach Local LLM - Developer Guide

## Overview

This guide provides comprehensive instructions for developers to implement, test, and maintain UpCoach's local Large Language Model (LLM) capabilities. The local LLM system enables privacy-focused, offline-capable AI coaching while maintaining the quality and performance standards expected by UpCoach users.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Environment Setup](#development-environment-setup)
3. [Architecture Overview](#architecture-overview)
4. [Backend Implementation](#backend-implementation)
5. [Mobile Integration](#mobile-integration)
6. [Testing Strategy](#testing-strategy)
7. [Deployment](#deployment)
8. [Monitoring & Debugging](#monitoring--debugging)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

Before starting, ensure you have:

- Node.js 18+ with npm/yarn
- Docker Desktop 4.20+
- Flutter 3.16+ with Dart 3.2+
- Python 3.9+ (for model management tools)
- NVIDIA GPU with 8GB+ VRAM (for local development)
- 16GB+ RAM (32GB recommended)

### 5-Minute Setup

```bash
# 1. Clone and setup project
git clone <repository-url>
cd upcoach-project

# 2. Install dependencies
npm install
cd services/api && npm install
cd ../../mobile-app && flutter pub get

# 3. Download development models
mkdir -p services/api/models/dev
curl -L "https://huggingface.co/microsoft/DialoGPT-medium/resolve/main/pytorch_model.bin" \
  -o services/api/models/dev/tinyllama-dev.gguf

# 4. Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Start development services
docker-compose up -d postgres redis
cd services/api && npm run dev:local-llm
```

### Verify Installation

```bash
# Test backend local LLM endpoint
curl -X POST http://localhost:8080/api/ai/local/health \
  -H "Content-Type: application/json"

# Test mobile development
cd mobile-app
flutter test test/unit/services/local_llm_service_test.dart
```

## Development Environment Setup

### Hardware Requirements

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| **CPU** | 8 cores, 2.5GHz | 16 cores, 3.0GHz+ | Intel Xeon or AMD Ryzen |
| **GPU** | NVIDIA RTX 3060 (12GB) | NVIDIA RTX 4090 (24GB) | CUDA 11.8+ support |
| **RAM** | 16GB DDR4 | 32GB DDR4-3200 | For model loading + development |
| **Storage** | 100GB SSD | 500GB NVMe SSD | Model storage + caching |

### Software Dependencies

#### Backend Development Stack

```bash
# Install CUDA Toolkit (Ubuntu/Debian)
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-ubuntu2204.pin
sudo mv cuda-ubuntu2204.pin /etc/apt/preferences.d/cuda-repository-pin-600
sudo apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/3bf863cc.pub
sudo add-apt-repository "deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/ /"
sudo apt-get update
sudo apt-get -y install cuda-toolkit-12-0

# Install Node.js dependencies for local LLM
cd services/api
npm install @tensorflow/tfjs-node-gpu
npm install @llama-node/llama-cpp
npm install onnxruntime-node
```

#### Mobile Development Stack

```bash
# iOS Development (macOS only)
xcode-select --install
sudo gem install cocoapods

# Android Development
# Install Android Studio with NDK
# Add to ~/.bashrc or ~/.zshrc:
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools"

# Flutter Dependencies
flutter pub global activate fvm
fvm use 3.16.0 --force
```

### IDE Configuration

#### VS Code Setup

Install recommended extensions:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "dart-code.dart-code",
    "dart-code.flutter",
    "ms-python.python",
    "ms-toolsai.jupyter",
    "github.copilot"
  ]
}
```

Add to VS Code settings.json:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "flutter.flutterSdkPath": "/path/to/flutter",
  "dart.debugExternalPackageLibraries": true,
  "dart.debugSdkLibraries": true
}
```

## Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │───▶│   Backend API   │───▶│ Hybrid Decision │
│   (Flutter)     │    │ (Express/TS)    │    │    Engine       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐  ┌──────────────┐
│ Local LLM       │    │   PostgreSQL    │    │ Local LLM    │  │ Cloud LLM    │
│ (Core ML/ONNX)  │    │   + Redis       │    │ (Mistral 7B) │  │ (OpenAI)     │
└─────────────────┘    └─────────────────┘    └──────────────┘  └──────────────┘
```

### Key Components

#### 1. LocalLLMService (Backend)

Located in `services/api/src/services/ai/LocalLLMService.ts`

**Purpose**: Manages local model inference, memory optimization, and response generation.

**Key Features**:
- Model loading and unloading
- Quantized model support (Q4_K_M, Q8_0)
- Memory management and optimization
- Response streaming capabilities

#### 2. HybridDecisionEngine (Backend)

Located in `services/api/src/services/ai/HybridDecisionEngine.ts`

**Purpose**: Intelligent routing between local and cloud processing based on multiple factors.

**Decision Factors**:
- Privacy level requirements
- Query complexity analysis
- Device capability assessment
- Battery and thermal constraints
- Cost optimization targets

#### 3. LocalLLMService (Mobile)

Located in `mobile-app/lib/core/services/llm/local_llm_service.dart`

**Purpose**: Platform-specific local inference on iOS and Android devices.

**Platform Support**:
- iOS: Core ML with Neural Engine optimization
- Android: ONNX Runtime with NNAPI acceleration

#### 4. Security Layer

Located in `services/api/src/security/LocalAISecurityService.ts`

**Purpose**: Enhanced security validation for local processing.

**Features**:
- Prompt injection detection
- Model integrity validation
- Content filtering and sanitization
- Audit trail generation

## Backend Implementation

### Setting Up LocalLLMService

#### 1. Model Installation

```bash
# Create models directory
mkdir -p services/api/models/{production,development,test}

# Download Mistral 7B Quantized (Primary model)
wget -O services/api/models/production/mistral-7b-v0.1.Q4_K_M.gguf \
  "https://huggingface.co/TheBloke/Mistral-7B-v0.1-GGUF/resolve/main/mistral-7b-v0.1.Q4_K_M.gguf"

# Download TinyLlama for development/testing
wget -O services/api/models/development/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf \
  "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
```

#### 2. Environment Configuration

Add to your `.env` file:

```bash
# Local LLM Configuration
LOCAL_LLM_ENABLED=true
LOCAL_LLM_MODEL_PATH=./models/production/mistral-7b-v0.1.Q4_K_M.gguf
LOCAL_LLM_THREADS=8
LOCAL_LLM_CONTEXT_SIZE=4096
LOCAL_LLM_GPU_LAYERS=32

# Development settings
LOCAL_LLM_DEV_MODEL_PATH=./models/development/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf

# Performance settings
LOCAL_LLM_MAX_TOKENS=1000
LOCAL_LLM_TEMPERATURE=0.7
LOCAL_LLM_TOP_P=0.9
LOCAL_LLM_TOP_K=40

# Memory management
LOCAL_LLM_MAX_MEMORY_GB=8
LOCAL_LLM_ENABLE_MMAP=true
LOCAL_LLM_ENABLE_MLOCK=false
```

#### 3. Basic Implementation

Create `services/api/src/services/ai/LocalLLMService.ts`:

```typescript
import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp';
import { config } from '../../config/environment';
import { logger } from '../../utils/logger';
import { BaseAIService, AIMessage, AIResponse } from './BaseAIService';

export interface LocalLLMConfig {
  modelPath: string;
  threads?: number;
  contextSize?: number;
  gpuLayers?: number;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export class LocalLLMService extends BaseAIService {
  private model?: LlamaModel;
  private context?: LlamaContext;
  private session?: LlamaChatSession;
  private isModelLoaded = false;
  private config: LocalLLMConfig;
  
  // Performance metrics
  private metrics = {
    inferenceCount: 0,
    totalInferenceTime: 0,
    averageTokensPerSecond: 0,
    memoryUsage: 0,
  };

  constructor(config?: Partial<LocalLLMConfig>) {
    super();
    this.config = {
      modelPath: config?.modelPath || process.env.LOCAL_LLM_MODEL_PATH!,
      threads: config?.threads || parseInt(process.env.LOCAL_LLM_THREADS || '8'),
      contextSize: config?.contextSize || parseInt(process.env.LOCAL_LLM_CONTEXT_SIZE || '4096'),
      gpuLayers: config?.gpuLayers || parseInt(process.env.LOCAL_LLM_GPU_LAYERS || '32'),
      temperature: config?.temperature || parseFloat(process.env.LOCAL_LLM_TEMPERATURE || '0.7'),
      maxTokens: config?.maxTokens || parseInt(process.env.LOCAL_LLM_MAX_TOKENS || '1000'),
      topP: config?.topP || parseFloat(process.env.LOCAL_LLM_TOP_P || '0.9'),
      topK: config?.topK || parseInt(process.env.LOCAL_LLM_TOP_K || '40'),
    };
  }

  /**
   * Load the local LLM model into memory
   */
  async loadModel(): Promise<{ success: boolean; loadTime: number; memoryUsage: number }> {
    const startTime = Date.now();
    
    try {
      logger.info('Loading local LLM model...', {
        modelPath: this.config.modelPath,
        threads: this.config.threads,
        contextSize: this.config.contextSize,
      });

      // Load model
      this.model = new LlamaModel({
        modelPath: this.config.modelPath,
        gpuLayers: this.config.gpuLayers,
      });

      // Create context
      this.context = new LlamaContext({
        model: this.model,
        contextSize: this.config.contextSize,
        threads: this.config.threads,
      });

      // Create chat session
      this.session = new LlamaChatSession({
        context: this.context,
      });

      this.isModelLoaded = true;
      const loadTime = Date.now() - startTime;
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

      logger.info('Local LLM model loaded successfully', {
        loadTime: `${loadTime}ms`,
        memoryUsage: `${memoryUsage.toFixed(2)}MB`,
      });

      return {
        success: true,
        loadTime,
        memoryUsage,
      };
    } catch (error) {
      logger.error('Failed to load local LLM model:', error);
      this.isModelLoaded = false;
      return {
        success: false,
        loadTime: Date.now() - startTime,
        memoryUsage: 0,
      };
    }
  }

  /**
   * Generate response using local LLM
   */
  async generateResponse(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.isModelLoaded || !this.session) {
      throw new Error('Local LLM model not loaded. Call loadModel() first.');
    }

    const startTime = Date.now();
    
    try {
      // Convert messages to prompt format
      const prompt = this.formatMessagesForLocalLLM(messages);
      
      logger.debug('Generating local LLM response', {
        promptLength: prompt.length,
        maxTokens: this.config.maxTokens,
      });

      // Generate response with streaming
      let fullResponse = '';
      const tokens: string[] = [];
      
      for await (const chunk of this.session.prompt(prompt, {
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        topP: this.config.topP,
        topK: this.config.topK,
      })) {
        fullResponse += chunk;
        tokens.push(chunk);
      }

      const inferenceTime = Date.now() - startTime;
      const tokensGenerated = tokens.length;
      const tokensPerSecond = tokensGenerated / (inferenceTime / 1000);

      // Update metrics
      this.updateMetrics(inferenceTime, tokensPerSecond);

      const response: AIResponse = {
        id: `local-llm-${Date.now()}`,
        content: fullResponse.trim(),
        usage: {
          promptTokens: this.estimateTokenCount(prompt),
          completionTokens: tokensGenerated,
          totalTokens: this.estimateTokenCount(prompt) + tokensGenerated,
        },
        model: 'mistral-7b-local',
        provider: 'local',
        processingMode: 'local',
        metrics: {
          inferenceTime,
          tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
        },
      };

      logger.debug('Local LLM response generated', {
        responseLength: fullResponse.length,
        tokensGenerated,
        tokensPerSecond: tokensPerSecond.toFixed(2),
        inferenceTime: `${inferenceTime}ms`,
      });

      return response;
    } catch (error) {
      logger.error('Local LLM inference failed:', error);
      throw new Error(`Local LLM inference failed: ${error.message}`);
    }
  }

  /**
   * Generate coaching response with personality
   */
  async generateCoachingResponse(
    userMessage: string,
    options: {
      personality?: string;
      context?: any;
      conversationHistory?: AIMessage[];
    } = {}
  ): Promise<AIResponse> {
    const { personality = 'supportive', context = {}, conversationHistory = [] } = options;

    // Build system prompt for coaching
    const systemPrompt = this.buildCoachingSystemPrompt(personality, context);
    
    // Create messages array
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    return this.generateResponse(messages);
  }

  /**
   * Unload model to free memory
   */
  async unloadModel(): Promise<void> {
    if (this.session) {
      await this.session.dispose();
      this.session = undefined;
    }
    
    if (this.context) {
      this.context.dispose();
      this.context = undefined;
    }
    
    if (this.model) {
      this.model.dispose();
      this.model = undefined;
    }
    
    this.isModelLoaded = false;
    logger.info('Local LLM model unloaded');
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isModelLoaded: this.isModelLoaded,
      modelPath: this.config.modelPath,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    };
  }

  /**
   * Health check for local LLM service
   */
  async healthCheck(): Promise<{
    modelLoaded: boolean;
    memoryUsage: number;
    averageResponseTime: number;
    lastError?: string;
  }> {
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const averageResponseTime = this.metrics.inferenceCount > 0 
      ? this.metrics.totalInferenceTime / this.metrics.inferenceCount 
      : 0;

    return {
      modelLoaded: this.isModelLoaded,
      memoryUsage,
      averageResponseTime,
    };
  }

  // Private helper methods

  private formatMessagesForLocalLLM(messages: AIMessage[]): string {
    let prompt = '';
    
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          prompt += `### System\n${message.content}\n\n`;
          break;
        case 'user':
          prompt += `### Human\n${message.content}\n\n`;
          break;
        case 'assistant':
          prompt += `### Assistant\n${message.content}\n\n`;
          break;
      }
    }
    
    prompt += '### Assistant\n';
    return prompt;
  }

  private buildCoachingSystemPrompt(personality: string, context: any): string {
    const personalityPrompts = {
      supportive: 'You are a supportive and empathetic life coach. Provide encouraging, understanding responses that help users feel heard and motivated.',
      motivational: 'You are an energetic and motivational coach. Your responses should inspire action and help users push through challenges with determination.',
      analytical: 'You are a thoughtful and analytical coach. Provide structured, data-driven advice that helps users understand patterns and make informed decisions.',
      mindful: 'You are a mindful and present-focused coach. Help users stay grounded and aware, offering techniques for mindfulness and self-reflection.',
    };

    const basePrompt = personalityPrompts[personality] || personalityPrompts.supportive;
    
    return `${basePrompt}

Important guidelines:
- Keep responses concise and actionable (under 200 words)
- Focus on the user's specific situation and goals
- Provide practical steps or techniques when appropriate
- Maintain a warm, professional coaching tone
- Respect user privacy and confidentiality
- If asked about technical details or unrelated topics, redirect to coaching`;
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  private updateMetrics(inferenceTime: number, tokensPerSecond: number): void {
    this.metrics.inferenceCount++;
    this.metrics.totalInferenceTime += inferenceTime;
    this.metrics.averageTokensPerSecond = 
      (this.metrics.averageTokensPerSecond * (this.metrics.inferenceCount - 1) + tokensPerSecond) 
      / this.metrics.inferenceCount;
    this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  }
}

// Singleton instance for application use
export const localLLMService = new LocalLLMService();
```

#### 4. Integration with Existing AIService

Update `services/api/src/services/ai/AIService.ts` to integrate local LLM:

```typescript
import { LocalLLMService } from './LocalLLMService';
import { HybridDecisionEngine } from './HybridDecisionEngine';

export class AIService {
  private localLLMService: LocalLLMService;
  private hybridEngine: HybridDecisionEngine;

  constructor() {
    // ... existing initialization
    this.localLLMService = new LocalLLMService();
    this.hybridEngine = new HybridDecisionEngine();
  }

  async generateResponse(messages: AIMessage[], options: AIOptions = {}): Promise<AIResponse> {
    // Determine routing decision
    const routingDecision = await this.hybridEngine.routeRequest({
      messages,
      routingHints: options.routingHints,
      deviceProfile: options.deviceProfile,
    });

    if (routingDecision.route === 'local') {
      try {
        const response = await this.localLLMService.generateResponse(messages);
        return {
          ...response,
          processingMode: 'local',
          routingReason: routingDecision.reasoning,
        };
      } catch (error) {
        logger.warn('Local LLM failed, falling back to cloud:', error);
        // Fall back to existing cloud implementation
        return this.generateCloudResponse(messages, options);
      }
    }

    // Use existing cloud implementation
    return this.generateCloudResponse(messages, options);
  }

  private async generateCloudResponse(messages: AIMessage[], options: AIOptions): Promise<AIResponse> {
    // Existing cloud implementation logic
    // ... (keep existing code)
  }
}
```

### HybridDecisionEngine Implementation

Create `services/api/src/services/ai/HybridDecisionEngine.ts`:

```typescript
export interface RoutingRequest {
  messages: AIMessage[];
  routingHints?: {
    preferLocal?: boolean;
    privacyLevel?: 'public' | 'private' | 'sensitive';
    maxLatency?: number;
  };
  deviceProfile?: {
    model: string;
    capabilities: string[];
    batteryLevel: number;
    thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
  };
}

export interface RoutingDecision {
  route: 'local' | 'cloud' | 'hybrid';
  confidence: number;
  reasoning: string;
  expectedLatency: number;
  estimatedCost: number;
}

export class HybridDecisionEngine {
  private rules: RoutingRule[] = [];
  private metrics = {
    totalRequests: 0,
    localRequests: 0,
    cloudRequests: 0,
    hybridRequests: 0,
  };

  constructor() {
    this.initializeRoutingRules();
  }

  async routeRequest(request: RoutingRequest): Promise<RoutingDecision> {
    this.metrics.totalRequests++;

    const factors = await this.analyzeRequest(request);
    const decision = this.evaluateRoutingRules(factors);

    // Update metrics
    switch (decision.route) {
      case 'local':
        this.metrics.localRequests++;
        break;
      case 'cloud':
        this.metrics.cloudRequests++;
        break;
      case 'hybrid':
        this.metrics.hybridRequests++;
        break;
    }

    logger.debug('Routing decision made', {
      route: decision.route,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      factors,
    });

    return decision;
  }

  private async analyzeRequest(request: RoutingRequest): Promise<RoutingFactors> {
    const messageContent = request.messages.map(m => m.content).join(' ');
    
    return {
      privacyScore: this.calculatePrivacyScore(request.routingHints?.privacyLevel),
      complexityScore: await this.calculateComplexityScore(messageContent),
      deviceCapability: this.assessDeviceCapability(request.deviceProfile),
      latencyRequirement: request.routingHints?.maxLatency || 2000,
      costSensitivity: 0.7, // Default cost sensitivity
      userPreference: request.routingHints?.preferLocal ? 0.8 : 0.5,
    };
  }

  private calculatePrivacyScore(privacyLevel?: string): number {
    const scores = {
      'public': 0.2,
      'private': 0.7,
      'sensitive': 1.0,
    };
    return scores[privacyLevel || 'private'] || 0.5;
  }

  private async calculateComplexityScore(content: string): Promise<number> {
    // Analyze query complexity
    const complexityIndicators = [
      /analyze|analysis|detailed|comprehensive/i,
      /compare|contrast|evaluate/i,
      /data|statistics|trends|patterns/i,
      /step.by.step|instructions|tutorial/i,
    ];

    let score = 0.3; // Base complexity
    for (const indicator of complexityIndicators) {
      if (indicator.test(content)) score += 0.2;
    }

    // Length-based complexity
    if (content.length > 500) score += 0.2;
    if (content.length > 1000) score += 0.3;

    return Math.min(score, 1.0);
  }

  private assessDeviceCapability(deviceProfile?: any): number {
    if (!deviceProfile) return 0.5;

    let capability = 0.5;

    // Battery level factor
    if (deviceProfile.batteryLevel < 20) capability -= 0.3;
    else if (deviceProfile.batteryLevel > 80) capability += 0.2;

    // Thermal state factor
    if (deviceProfile.thermalState === 'critical') capability -= 0.5;
    else if (deviceProfile.thermalState === 'serious') capability -= 0.3;

    // Device model factor (simplified)
    const highEndModels = ['iPhone 15', 'iPhone 14', 'Pixel 8', 'Galaxy S24'];
    if (highEndModels.some(model => deviceProfile.model.includes(model))) {
      capability += 0.3;
    }

    return Math.max(0, Math.min(1, capability));
  }

  // Add more implementation details...
}
```

## Mobile Integration

### Flutter Plugin Structure

Create the Flutter plugin structure:

```bash
mkdir -p mobile-app/lib/core/services/llm
touch mobile-app/lib/core/services/llm/local_llm_service.dart
touch mobile-app/lib/core/services/llm/local_llm_platform.dart
touch mobile-app/lib/core/services/llm/ios_llm_implementation.dart
touch mobile-app/lib/core/services/llm/android_llm_implementation.dart
```

### Core Service Implementation

`mobile-app/lib/core/services/llm/local_llm_service.dart`:

```dart
import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

enum LocalLLMStatus {
  notInitialized,
  loading,
  ready,
  error,
}

class LocalLLMService {
  static const MethodChannel _channel = MethodChannel('com.upcoach.local_llm');
  
  LocalLLMStatus _status = LocalLLMStatus.notInitialized;
  String? _currentModel;
  Map<String, dynamic> _metrics = {};
  
  // Performance monitoring
  final Map<String, double> _performanceMetrics = {
    'averageLatency': 0.0,
    'tokensPerSecond': 0.0,
    'batteryImpact': 0.0,
  };

  LocalLLMStatus get status => _status;
  String? get currentModel => _currentModel;
  Map<String, dynamic> get metrics => Map.from(_metrics);

  /// Initialize the local LLM service
  Future<bool> initialize() async {
    try {
      _status = LocalLLMStatus.loading;
      
      final result = await _channel.invokeMethod<bool>('initialize');
      
      if (result == true) {
        _status = LocalLLMStatus.ready;
        await _loadPerformanceMetrics();
        return true;
      } else {
        _status = LocalLLMStatus.error;
        return false;
      }
    } catch (e) {
      _status = LocalLLMStatus.error;
      debugPrint('Failed to initialize LocalLLMService: $e');
      return false;
    }
  }

  /// Load a specific model
  Future<bool> loadModel(String modelName) async {
    if (_status != LocalLLMStatus.ready) {
      throw StateError('LocalLLMService not initialized');
    }

    try {
      final result = await _channel.invokeMethod<bool>('loadModel', {
        'modelName': modelName,
      });

      if (result == true) {
        _currentModel = modelName;
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Failed to load model $modelName: $e');
      return false;
    }
  }

  /// Generate response using local LLM
  Future<LocalLLMResponse> generateResponse(
    String prompt, {
    Map<String, dynamic>? context,
    double temperature = 0.7,
    int maxTokens = 1000,
  }) async {
    if (_status != LocalLLMStatus.ready || _currentModel == null) {
      throw StateError('LocalLLMService not ready or no model loaded');
    }

    final startTime = DateTime.now();
    
    try {
      final result = await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'generateResponse',
        {
          'prompt': prompt,
          'context': context ?? {},
          'temperature': temperature,
          'maxTokens': maxTokens,
        },
      );

      final endTime = DateTime.now();
      final latency = endTime.difference(startTime).inMilliseconds;

      final response = LocalLLMResponse.fromMap(Map<String, dynamic>.from(result!));
      
      // Update performance metrics
      _updatePerformanceMetrics(latency, response.tokensGenerated);
      
      return response;
    } catch (e) {
      debugPrint('Failed to generate response: $e');
      rethrow;
    }
  }

  /// Generate coaching response with personality
  Future<LocalLLMResponse> generateCoachingResponse(
    String userMessage, {
    String personality = 'supportive',
    List<ChatMessage>? conversationHistory,
    Map<String, dynamic>? userContext,
  }) async {
    // Build coaching-specific prompt
    final prompt = _buildCoachingPrompt(
      userMessage,
      personality: personality,
      conversationHistory: conversationHistory,
      userContext: userContext,
    );

    return generateResponse(
      prompt,
      context: {
        'type': 'coaching',
        'personality': personality,
        'userContext': userContext,
      },
    );
  }

  /// Stream response for real-time generation
  Stream<String> generateResponseStream(
    String prompt, {
    Map<String, dynamic>? context,
    double temperature = 0.7,
    int maxTokens = 1000,
  }) async* {
    if (_status != LocalLLMStatus.ready || _currentModel == null) {
      throw StateError('LocalLLMService not ready or no model loaded');
    }

    try {
      final stream = _channel.invokeMethod<String>('generateResponseStream', {
        'prompt': prompt,
        'context': context ?? {},
        'temperature': temperature,
        'maxTokens': maxTokens,
      });

      // Note: This is a simplified example. Real implementation would use
      // EventChannel for proper streaming
      final response = await stream;
      if (response != null) {
        yield response;
      }
    } catch (e) {
      debugPrint('Failed to generate response stream: $e');
      rethrow;
    }
  }

  /// Check if device supports local LLM
  Future<DeviceCapability> checkDeviceCapability() async {
    try {
      final result = await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'checkDeviceCapability',
      );

      return DeviceCapability.fromMap(Map<String, dynamic>.from(result!));
    } catch (e) {
      debugPrint('Failed to check device capability: $e');
      return DeviceCapability(
        isSupported: false,
        recommendedModel: null,
        maxTokens: 0,
        estimatedLatency: 0,
      );
    }
  }

  /// Get battery-optimized configuration
  Future<BatteryOptimizedConfig> getBatteryOptimizedConfig(
    double batteryLevel,
  ) async {
    try {
      final result = await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'getBatteryOptimizedConfig',
        {'batteryLevel': batteryLevel},
      );

      return BatteryOptimizedConfig.fromMap(Map<String, dynamic>.from(result!));
    } catch (e) {
      debugPrint('Failed to get battery optimized config: $e');
      return BatteryOptimizedConfig(
        enableLocalProcessing: false,
        fallbackToCloud: true,
        maxConcurrentRequests: 1,
      );
    }
  }

  /// Handle thermal events
  void handleThermalEvent(ThermalState thermalState) {
    _channel.invokeMethod('handleThermalEvent', {
      'thermalState': thermalState.toString(),
    });
  }

  /// Unload current model to free memory
  Future<void> unloadModel() async {
    if (_currentModel != null) {
      await _channel.invokeMethod('unloadModel');
      _currentModel = null;
    }
  }

  /// Dispose service and cleanup resources
  Future<void> dispose() async {
    await unloadModel();
    await _channel.invokeMethod('dispose');
    _status = LocalLLMStatus.notInitialized;
  }

  // Private helper methods

  Future<void> _loadPerformanceMetrics() async {
    try {
      final result = await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'getPerformanceMetrics',
      );
      _metrics = Map<String, dynamic>.from(result!);
    } catch (e) {
      debugPrint('Failed to load performance metrics: $e');
    }
  }

  void _updatePerformanceMetrics(int latency, int tokensGenerated) {
    final tokensPerSecond = tokensGenerated / (latency / 1000.0);
    
    _performanceMetrics['averageLatency'] = 
        (_performanceMetrics['averageLatency']! + latency) / 2;
    _performanceMetrics['tokensPerSecond'] = 
        (_performanceMetrics['tokensPerSecond']! + tokensPerSecond) / 2;
  }

  String _buildCoachingPrompt(
    String userMessage, {
    required String personality,
    List<ChatMessage>? conversationHistory,
    Map<String, dynamic>? userContext,
  }) {
    final buffer = StringBuffer();
    
    // Add personality-specific system prompt
    buffer.writeln(_getPersonalitySystemPrompt(personality));
    buffer.writeln();
    
    // Add conversation history if available
    if (conversationHistory != null && conversationHistory.isNotEmpty) {
      buffer.writeln('Previous conversation:');
      for (final message in conversationHistory.take(5)) { // Limit to recent messages
        buffer.writeln('${message.role}: ${message.content}');
      }
      buffer.writeln();
    }
    
    // Add user context if available
    if (userContext != null && userContext.isNotEmpty) {
      buffer.writeln('User context:');
      if (userContext['goals'] != null) {
        buffer.writeln('Goals: ${userContext['goals']}');
      }
      if (userContext['preferences'] != null) {
        buffer.writeln('Preferences: ${userContext['preferences']}');
      }
      buffer.writeln();
    }
    
    // Add current user message
    buffer.writeln('User: $userMessage');
    buffer.writeln();
    buffer.writeln('Assistant:');
    
    return buffer.toString();
  }

  String _getPersonalitySystemPrompt(String personality) {
    const prompts = {
      'supportive': 'You are a supportive and empathetic life coach. Provide encouraging, understanding responses.',
      'motivational': 'You are an energetic and motivational coach. Inspire action and determination.',
      'analytical': 'You are a thoughtful and analytical coach. Provide structured, data-driven advice.',
      'mindful': 'You are a mindful coach focused on present-moment awareness and self-reflection.',
    };
    
    return prompts[personality] ?? prompts['supportive']!;
  }
}

// Data classes

class LocalLLMResponse {
  final String content;
  final int tokensGenerated;
  final double latency;
  final bool processedLocally;
  final String? fallbackReason;

  LocalLLMResponse({
    required this.content,
    required this.tokensGenerated,
    required this.latency,
    this.processedLocally = true,
    this.fallbackReason,
  });

  factory LocalLLMResponse.fromMap(Map<String, dynamic> map) {
    return LocalLLMResponse(
      content: map['content'] ?? '',
      tokensGenerated: map['tokensGenerated'] ?? 0,
      latency: (map['latency'] ?? 0).toDouble(),
      processedLocally: map['processedLocally'] ?? true,
      fallbackReason: map['fallbackReason'],
    );
  }
}

class DeviceCapability {
  final bool isSupported;
  final String? recommendedModel;
  final int maxTokens;
  final double estimatedLatency;

  DeviceCapability({
    required this.isSupported,
    required this.recommendedModel,
    required this.maxTokens,
    required this.estimatedLatency,
  });

  factory DeviceCapability.fromMap(Map<String, dynamic> map) {
    return DeviceCapability(
      isSupported: map['isSupported'] ?? false,
      recommendedModel: map['recommendedModel'],
      maxTokens: map['maxTokens'] ?? 0,
      estimatedLatency: (map['estimatedLatency'] ?? 0).toDouble(),
    );
  }
}

class BatteryOptimizedConfig {
  final bool enableLocalProcessing;
  final bool fallbackToCloud;
  final int maxConcurrentRequests;

  BatteryOptimizedConfig({
    required this.enableLocalProcessing,
    required this.fallbackToCloud,
    required this.maxConcurrentRequests,
  });

  factory BatteryOptimizedConfig.fromMap(Map<String, dynamic> map) {
    return BatteryOptimizedConfig(
      enableLocalProcessing: map['enableLocalProcessing'] ?? false,
      fallbackToCloud: map['fallbackToCloud'] ?? true,
      maxConcurrentRequests: map['maxConcurrentRequests'] ?? 1,
    );
  }
}

class ChatMessage {
  final String role;
  final String content;

  ChatMessage({required this.role, required this.content});
}

enum ThermalState {
  nominal,
  fair,
  serious,
  critical,
}

// Singleton instance
final localLLMService = LocalLLMService();
```

## Testing Strategy

### Unit Testing Setup

Create comprehensive unit tests for local LLM functionality:

`services/api/src/tests/services/ai/LocalLLMService.test.ts`:

```typescript
import { LocalLLMService } from '../../../services/ai/LocalLLMService';
import { config } from '../../../config/environment';

describe('LocalLLMService', () => {
  let service: LocalLLMService;

  beforeAll(async () => {
    // Use test model for faster testing
    service = new LocalLLMService({
      modelPath: process.env.LOCAL_LLM_DEV_MODEL_PATH,
      maxTokens: 100, // Limit tokens for faster tests
    });
  });

  afterAll(async () => {
    await service.unloadModel();
  });

  describe('Model Management', () => {
    it('should load model successfully', async () => {
      const result = await service.loadModel();
      
      expect(result.success).toBe(true);
      expect(result.loadTime).toBeGreaterThan(0);
      expect(result.loadTime).toBeLessThan(30000); // <30 seconds
      expect(result.memoryUsage).toBeGreaterThan(0);
    }, 60000); // Extended timeout for model loading

    it('should generate basic responses', async () => {
      const response = await service.generateResponse([
        { role: 'user', content: 'Hello, how are you?' }
      ]);

      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(5);
      expect(response.usage.completionTokens).toBeGreaterThan(0);
      expect(response.provider).toBe('local');
    });

    it('should generate coaching responses', async () => {
      const response = await service.generateCoachingResponse(
        'I feel unmotivated about exercising',
        { personality: 'motivational' }
      );

      expect(response.content).toBeDefined();
      expect(response.content.toLowerCase()).toMatch(/exercise|motivation|goal/);
    });

    it('should handle empty or invalid inputs gracefully', async () => {
      await expect(service.generateResponse([])).rejects.toThrow();
      
      const response = await service.generateResponse([
        { role: 'user', content: '' }
      ]);
      expect(response.content).toBeDefined();
    });
  });

  describe('Performance Testing', () => {
    it('should meet latency requirements', async () => {
      const start = Date.now();
      await service.generateResponse([
        { role: 'user', content: 'Give me a quick tip' }
      ]);
      const latency = Date.now() - start;

      expect(latency).toBeLessThan(5000); // <5 seconds for test model
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(3).fill(null).map((_, i) =>
        service.generateResponse([
          { role: 'user', content: `Request ${i}` }
        ])
      );

      const responses = await Promise.all(requests);
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.content).toBeDefined();
      });
    });
  });

  describe('Memory Management', () => {
    it('should maintain stable memory usage', async () => {
      const initialMetrics = service.getMetrics();
      
      // Generate multiple responses
      for (let i = 0; i < 10; i++) {
        await service.generateResponse([
          { role: 'user', content: `Message ${i}` }
        ]);
      }

      const finalMetrics = service.getMetrics();
      const memoryIncrease = finalMetrics.memoryUsage - initialMetrics.memoryUsage;
      
      expect(memoryIncrease).toBeLessThan(100); // <100MB increase
    });
  });
});
```

### Integration Testing

Create integration tests for hybrid decision engine:

`services/api/src/tests/integration/HybridLLMIntegration.test.ts`:

```typescript
import { AIService } from '../../../services/ai/AIService';
import { HybridDecisionEngine } from '../../../services/ai/HybridDecisionEngine';

describe('Hybrid LLM Integration', () => {
  let aiService: AIService;
  let hybridEngine: HybridDecisionEngine;

  beforeAll(async () => {
    aiService = new AIService();
    hybridEngine = new HybridDecisionEngine();
  });

  describe('Routing Logic', () => {
    it('should route privacy-sensitive content to local', async () => {
      const decision = await hybridEngine.routeRequest({
        messages: [{ role: 'user', content: 'My personal health information' }],
        routingHints: { privacyLevel: 'sensitive' },
      });

      expect(decision.route).toBe('local');
      expect(decision.confidence).toBeGreaterThan(0.7);
    });

    it('should route complex queries to cloud', async () => {
      const decision = await hybridEngine.routeRequest({
        messages: [{ 
          role: 'user', 
          content: 'Please analyze my 6-month fitness data and create a comprehensive report with trends, correlations, and predictive insights' 
        }],
        routingHints: { privacyLevel: 'public' },
      });

      expect(decision.route).toBe('cloud');
    });

    it('should consider device constraints', async () => {
      const decision = await hybridEngine.routeRequest({
        messages: [{ role: 'user', content: 'Quick motivation tip' }],
        deviceProfile: {
          model: 'iPhone 12',
          batteryLevel: 10,
          thermalState: 'critical',
          capabilities: ['neural-engine'],
        },
      });

      expect(decision.route).toBe('cloud'); // Low battery + thermal issues
    });
  });

  describe('End-to-End Workflows', () => {
    it('should handle local-to-cloud fallback', async () => {
      // Mock local service failure
      jest.spyOn(aiService['localLLMService'], 'generateResponse')
        .mockRejectedValueOnce(new Error('Model crashed'));

      const response = await aiService.generateResponse([
        { role: 'user', content: 'Help me with goal setting' }
      ], {
        routingHints: { preferLocal: true },
      });

      expect(response.processingMode).toBe('cloud');
      expect(response.routingReason).toContain('fallback');
    });
  });
});
```

### Mobile Testing

Create Flutter widget tests:

`mobile-app/test/unit/services/local_llm_service_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import '../../../lib/core/services/llm/local_llm_service.dart';

void main() {
  group('LocalLLMService', () {
    late LocalLLMService service;

    setUp(() {
      service = LocalLLMService();
    });

    group('Initialization', () => {
      testWidgets('should initialize successfully', (WidgetTester tester) async {
        final result = await service.initialize();
        expect(result, isTrue);
        expect(service.status, equals(LocalLLMStatus.ready));
      });

      testWidgets('should handle initialization failure', (WidgetTester tester) async {
        // Mock platform channel failure
        // This would require setting up proper mocking
        
        expect(service.status, equals(LocalLLMStatus.notInitialized));
      });
    });

    group('Response Generation', () => {
      testWidgets('should generate coaching responses', (WidgetTester tester) async {
        await service.initialize();
        await service.loadModel('tinyllama-test');

        final response = await service.generateCoachingResponse(
          'I need help staying motivated',
          personality: 'supportive',
        );

        expect(response.content, isNotEmpty);
        expect(response.processedLocally, isTrue);
        expect(response.tokensGenerated, greaterThan(0));
      });
    });

    group('Battery Optimization', () => {
      testWidgets('should disable local processing on low battery', (WidgetTester tester) async {
        final config = await service.getBatteryOptimizedConfig(15.0);
        
        expect(config.enableLocalProcessing, isFalse);
        expect(config.fallbackToCloud, isTrue);
      });

      testWidgets('should enable local processing on high battery', (WidgetTester tester) async {
        final config = await service.getBatteryOptimizedConfig(85.0);
        
        expect(config.enableLocalProcessing, isTrue);
        expect(config.maxConcurrentRequests, greaterThan(1));
      });
    });
  });
}
```

## Best Practices

### 1. Model Management

- **Use appropriate quantization**: Q4_K_M for best quality/size balance
- **Implement progressive loading**: Load models in background during app idle time
- **Monitor memory usage**: Unload models when memory pressure is high
- **Cache model metadata**: Store model capabilities and performance characteristics

### 2. Performance Optimization

- **Batch requests when possible**: Group multiple queries for efficiency
- **Implement streaming responses**: Provide immediate feedback to users
- **Use context caching**: Cache conversation context to reduce processing
- **Monitor thermal state**: Throttle processing during thermal events

### 3. Security Considerations

- **Validate all inputs**: Check for prompt injection attempts
- **Encrypt model files**: Protect intellectual property and prevent tampering
- **Audit processing decisions**: Log routing decisions for compliance
- **Sanitize outputs**: Ensure responses don't contain sensitive information

### 4. Error Handling

- **Implement graceful fallbacks**: Always have cloud backup available
- **Provide user feedback**: Inform users about processing mode and delays
- **Log detailed errors**: Capture sufficient information for debugging
- **Handle edge cases**: Plan for network issues, memory constraints, etc.

### 5. Testing Strategy

- **Use smaller models for testing**: Faster feedback loops during development
- **Test across device types**: Ensure compatibility with various hardware
- **Performance benchmark regularly**: Track regression in latency and quality
- **Simulate failure scenarios**: Test fallback mechanisms thoroughly

## Deployment

### Development Deployment

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Build and start backend with local LLM
cd services/api
npm run build
npm run dev:local-llm

# Start mobile development
cd ../../mobile-app
flutter run --debug --dart-define=LOCAL_LLM_ENABLED=true
```

### Production Deployment

```bash
# Build production images
docker build -f services/api/Dockerfile.local-llm -t upcoach-api-local-llm .

# Deploy with model volumes
docker run -d \
  --name upcoach-api-local-llm \
  --gpus all \
  -v /opt/upcoach/models:/app/models \
  -e LOCAL_LLM_ENABLED=true \
  -e LOCAL_LLM_MODEL_PATH=/app/models/mistral-7b-v0.1.Q4_K_M.gguf \
  upcoach-api-local-llm
```

### Environment Configuration

Production `.env` settings:

```bash
# Local LLM Production Settings
LOCAL_LLM_ENABLED=true
LOCAL_LLM_MODEL_PATH=/app/models/mistral-7b-v0.1.Q4_K_M.gguf
LOCAL_LLM_THREADS=16
LOCAL_LLM_GPU_LAYERS=64
LOCAL_LLM_CONTEXT_SIZE=8192
LOCAL_LLM_MAX_MEMORY_GB=24

# Performance tuning
LOCAL_LLM_BATCH_SIZE=512
LOCAL_LLM_CACHE_SIZE=2048
LOCAL_LLM_PRELOAD_MODELS=true

# Monitoring
LOCAL_LLM_METRICS_ENABLED=true
LOCAL_LLM_METRICS_INTERVAL=60
```

## Monitoring & Debugging

### Performance Metrics

Monitor these key metrics:

```typescript
interface LocalLLMMetrics {
  // Performance
  averageLatency: number;        // Target: <200ms P95
  tokensPerSecond: number;       // Target: >15 tokens/sec
  throughputRPS: number;         // Requests per second
  
  // Quality
  responseQuality: number;       // User ratings 1-5
  fallbackRate: number;          // Target: <10%
  errorRate: number;             // Target: <5%
  
  // Resource Usage
  memoryUsage: number;           // MB
  gpuUtilization: number;        // Percentage
  thermalEvents: number;         // Count of throttling events
  
  // Business
  costSavings: number;           // USD saved vs cloud
  localProcessingRate: number;   // Percentage of local requests
  userSatisfaction: number;      // Survey responses
}
```

### Debugging Tools

#### Backend Debugging

```typescript
// Add debug logging to LocalLLMService
const debugMode = process.env.NODE_ENV === 'development';

if (debugMode) {
  logger.debug('Local LLM inference', {
    prompt: prompt.substring(0, 100),
    modelPath: this.config.modelPath,
    parameters: {
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    },
  });
}
```

#### Mobile Debugging

```dart
// Add debug prints in LocalLLMService
if (kDebugMode) {
  print('LocalLLM: Generating response for prompt: ${prompt.substring(0, 50)}...');
  print('LocalLLM: Model: $_currentModel, Status: $_status');
}
```

### Health Monitoring

Set up monitoring endpoints:

```typescript
// Backend health endpoint
app.get('/api/ai/local/health', async (req, res) => {
  const health = await localLLMService.healthCheck();
  res.json({
    status: health.modelLoaded ? 'healthy' : 'degraded',
    metrics: health,
    timestamp: new Date().toISOString(),
  });
});
```

### Log Analysis

Use structured logging for easy analysis:

```typescript
logger.info('Local LLM response generated', {
  requestId: req.id,
  userId: req.user?.id,
  latency: response.metrics.inferenceTime,
  tokensGenerated: response.usage.completionTokens,
  processingMode: 'local',
  modelUsed: 'mistral-7b-v0.1',
  batteryLevel: req.deviceProfile?.batteryLevel,
});
```

## Troubleshooting

### Common Issues

#### Model Loading Failures

**Problem**: Model fails to load with "Out of memory" error
**Solution**:
```bash
# Check available GPU memory
nvidia-smi

# Reduce GPU layers in configuration
LOCAL_LLM_GPU_LAYERS=16  # Instead of 32

# Use smaller quantization
# Use Q4_0 instead of Q8_0 model
```

**Problem**: Model loading takes too long (>60 seconds)
**Solution**:
```bash
# Enable memory mapping
LOCAL_LLM_ENABLE_MMAP=true

# Preload models during deployment
LOCAL_LLM_PRELOAD_MODELS=true

# Use faster storage (NVMe SSD)
```

#### Performance Issues

**Problem**: Slow inference (>2 seconds per response)
**Solution**:
```typescript
// Check configuration
const config = {
  threads: Math.min(16, os.cpus().length), // Don't exceed CPU cores
  gpuLayers: 32, // Ensure GPU acceleration
  batchSize: 512, // Optimize batch size
};

// Monitor GPU utilization
// Ensure model fits in GPU memory
```

**Problem**: High memory usage growth
**Solution**:
```typescript
// Implement proper cleanup
async generateResponse() {
  try {
    // ... inference logic
  } finally {
    // Clear intermediate tensors
    await this.clearCache();
  }
}

// Regular memory monitoring
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > MAX_MEMORY_THRESHOLD) {
    this.triggerGarbageCollection();
  }
}, 60000);
```

#### Mobile Issues

**Problem**: App crashes on model loading (iOS)
**Solution**:
```swift
// Check memory warnings in iOS implementation
override func didReceiveMemoryWarning() {
    super.didReceiveMemoryWarning()
    // Unload model if memory pressure
    localLLMManager.unloadModel()
}
```

**Problem**: Battery drain too high
**Solution**:
```dart
// Implement adaptive processing
class AdaptiveLLMController {
  void adjustProcessingMode() {
    final batteryLevel = Battery().batteryLevel;
    final thermalState = ThermalStateManager.current;
    
    if (batteryLevel < 20 || thermalState == ThermalState.critical) {
      localLLMService.disableLocalProcessing();
    }
  }
}
```

### Getting Help

1. **Check logs**: Always start with application logs for error details
2. **Monitor metrics**: Use built-in metrics endpoints for performance data
3. **Community support**: Refer to model-specific documentation and forums
4. **Escalation path**: Contact the AI team for model-specific issues

---

This developer guide provides the foundation for implementing UpCoach's local LLM capabilities. Continue with the [API Specification](LOCAL_LLM_API_SPECIFICATION.md) for detailed endpoint documentation.