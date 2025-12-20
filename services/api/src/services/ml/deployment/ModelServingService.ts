/**
 * Model Serving Service
 *
 * Provides unified model serving infrastructure with low-latency endpoints.
 * Supports both REST and gRPC-style protocols for predictions.
 *
 * Features:
 * - Model version management
 * - Request batching for efficiency
 * - Load balancing across model replicas
 * - Health checks and readiness probes
 * - Metrics collection
 */

import { EventEmitter } from 'events';

// Types
export type ModelFormat = 'onnx' | 'tensorflow' | 'pytorch' | 'custom';
export type ModelStatus = 'loading' | 'ready' | 'error' | 'unloading' | 'stopped';
export type EndpointType = 'rest' | 'grpc' | 'websocket';

export interface ModelConfig {
  id: string;
  name: string;
  version: string;
  format: ModelFormat;
  path: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  batchSize: number;
  maxConcurrency: number;
  timeoutMs: number;
  warmupRequests: number;
  metadata?: Record<string, unknown>;
}

export interface LoadedModel {
  config: ModelConfig;
  status: ModelStatus;
  loadedAt: Date;
  lastUsedAt: Date;
  requestCount: number;
  errorCount: number;
  avgLatencyMs: number;
  memoryUsageMB: number;
  replicas: ModelReplica[];
}

export interface ModelReplica {
  id: string;
  modelId: string;
  status: ModelStatus;
  host: string;
  port: number;
  weight: number;
  healthScore: number;
  lastHealthCheck: Date;
  activeRequests: number;
}

export interface PredictionRequest {
  modelId: string;
  modelVersion?: string;
  inputs: Record<string, unknown>;
  options?: {
    timeout?: number;
    priority?: 'low' | 'normal' | 'high';
    preferredReplica?: string;
  };
}

export interface PredictionResponse {
  requestId: string;
  modelId: string;
  modelVersion: string;
  outputs: Record<string, unknown>;
  latencyMs: number;
  replicaId: string;
  cached: boolean;
  metadata?: Record<string, unknown>;
}

export interface BatchPredictionRequest {
  modelId: string;
  modelVersion?: string;
  inputs: Record<string, unknown>[];
  options?: {
    timeout?: number;
    maxBatchSize?: number;
  };
}

export interface BatchPredictionResponse {
  requestId: string;
  modelId: string;
  modelVersion: string;
  outputs: Record<string, unknown>[];
  latencyMs: number;
  itemsProcessed: number;
}

export interface ServingEndpoint {
  id: string;
  type: EndpointType;
  modelId: string;
  path: string;
  methods: string[];
  rateLimit: number;
  authRequired: boolean;
  enabled: boolean;
  createdAt: Date;
}

export interface ServingMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  requestsPerSecond: number;
  activeConnections: number;
  queuedRequests: number;
  cacheHitRate: number;
}

export interface ModelServingStats {
  modelsLoaded: number;
  totalReplicas: number;
  healthyReplicas: number;
  endpoints: number;
  metrics: ServingMetrics;
  modelStats: Map<string, {
    requests: number;
    errors: number;
    avgLatency: number;
  }>;
}

/**
 * Model Serving Service
 */
export class ModelServingService extends EventEmitter {
  private models: Map<string, LoadedModel> = new Map();
  private endpoints: Map<string, ServingEndpoint> = new Map();
  private requestQueue: Map<string, PredictionRequest[]> = new Map();
  private latencyHistory: Map<string, number[]> = new Map();
  private cache: Map<string, { response: PredictionResponse; expiresAt: Date }> = new Map();

  private isRunning = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  // Metrics
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private cacheHits = 0;

  // Configuration
  private readonly config = {
    healthCheckIntervalMs: 10000,
    metricsIntervalMs: 5000,
    maxQueueSize: 1000,
    defaultTimeoutMs: 5000,
    maxLatencyHistorySize: 1000,
    cacheEnabled: true,
    cacheTTLMs: 60000,
    maxCacheSize: 10000,
  };

  constructor(config?: Partial<typeof ModelServingService.prototype.config>) {
    super();
    if (config) {
      Object.assign(this.config, config);
    }
  }

  /**
   * Start the model serving service
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;

    // Start health check loop
    this.healthCheckInterval = setInterval(
      () => this.runHealthChecks(),
      this.config.healthCheckIntervalMs
    );

    // Start metrics collection
    this.metricsInterval = setInterval(
      () => this.collectMetrics(),
      this.config.metricsIntervalMs
    );

    this.emit('started');
    console.log('[ModelServing] Service started');
  }

  /**
   * Stop the model serving service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    // Unload all models
    for (const modelId of this.models.keys()) {
      await this.unloadModel(modelId);
    }

    this.emit('stopped');
    console.log('[ModelServing] Service stopped');
  }

  /**
   * Load a model into the serving infrastructure
   */
  async loadModel(config: ModelConfig): Promise<LoadedModel> {
    console.log(`[ModelServing] Loading model: ${config.name} v${config.version}`);

    const modelKey = `${config.id}:${config.version}`;

    // Check if already loaded
    if (this.models.has(modelKey)) {
      const existing = this.models.get(modelKey)!;
      if (existing.status === 'ready') {
        console.log(`[ModelServing] Model ${config.name} already loaded`);
        return existing;
      }
    }

    const loadedModel: LoadedModel = {
      config,
      status: 'loading',
      loadedAt: new Date(),
      lastUsedAt: new Date(),
      requestCount: 0,
      errorCount: 0,
      avgLatencyMs: 0,
      memoryUsageMB: 0,
      replicas: [],
    };

    this.models.set(modelKey, loadedModel);

    try {
      // Simulate model loading (in production, would load actual model)
      await this.simulateModelLoad(config);

      // Create default replica
      const replica: ModelReplica = {
        id: `${config.id}-replica-1`,
        modelId: config.id,
        status: 'ready',
        host: 'localhost',
        port: 8080 + this.models.size,
        weight: 100,
        healthScore: 100,
        lastHealthCheck: new Date(),
        activeRequests: 0,
      };

      loadedModel.replicas.push(replica);
      loadedModel.status = 'ready';
      loadedModel.memoryUsageMB = Math.random() * 500 + 100; // Simulated

      // Run warmup requests
      if (config.warmupRequests > 0) {
        await this.runWarmup(config);
      }

      this.emit('modelLoaded', { modelId: config.id, version: config.version });
      console.log(`[ModelServing] Model ${config.name} v${config.version} loaded successfully`);

      return loadedModel;
    } catch (error) {
      loadedModel.status = 'error';
      this.emit('modelLoadError', { modelId: config.id, error });
      throw error;
    }
  }

  /**
   * Unload a model from the serving infrastructure
   */
  async unloadModel(modelId: string, version?: string): Promise<boolean> {
    const keys = version
      ? [`${modelId}:${version}`]
      : Array.from(this.models.keys()).filter(k => k.startsWith(`${modelId}:`));

    for (const key of keys) {
      const model = this.models.get(key);
      if (model) {
        model.status = 'unloading';

        // Wait for active requests to complete
        const activeRequests = model.replicas.reduce((sum, r) => sum + r.activeRequests, 0);
        if (activeRequests > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        model.status = 'stopped';
        this.models.delete(key);

        // Remove associated endpoints
        for (const [endpointId, endpoint] of this.endpoints) {
          if (endpoint.modelId === modelId) {
            this.endpoints.delete(endpointId);
          }
        }

        this.emit('modelUnloaded', { modelId, version: model.config.version });
        console.log(`[ModelServing] Model ${modelId} v${model.config.version} unloaded`);
      }
    }

    return true;
  }

  /**
   * Make a prediction using a loaded model
   */
  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    const startTime = Date.now();
    this.totalRequests++;

    const modelKey = request.modelVersion
      ? `${request.modelId}:${request.modelVersion}`
      : this.findLatestVersion(request.modelId);

    if (!modelKey) {
      this.failedRequests++;
      throw new Error(`Model not found: ${request.modelId}`);
    }

    const model = this.models.get(modelKey);
    if (!model || model.status !== 'ready') {
      this.failedRequests++;
      throw new Error(`Model not ready: ${request.modelId}`);
    }

    // Check cache
    const cacheKey = this.getCacheKey(request);
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > new Date()) {
        this.cacheHits++;
        this.successfulRequests++;
        return { ...cached.response, cached: true };
      }
    }

    // Select best replica
    const replica = this.selectReplica(model);
    if (!replica) {
      this.failedRequests++;
      throw new Error(`No healthy replicas for model: ${request.modelId}`);
    }

    try {
      replica.activeRequests++;

      // Simulate prediction (in production, would call actual model)
      const outputs = await this.simulatePrediction(model, request.inputs);

      const latencyMs = Date.now() - startTime;

      const response: PredictionResponse = {
        requestId: `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        modelId: request.modelId,
        modelVersion: model.config.version,
        outputs,
        latencyMs,
        replicaId: replica.id,
        cached: false,
      };

      // Update metrics
      model.requestCount++;
      model.lastUsedAt = new Date();
      this.updateLatencyMetrics(modelKey, latencyMs);
      this.successfulRequests++;

      // Cache response
      if (this.config.cacheEnabled) {
        this.cacheResponse(cacheKey, response);
      }

      return response;
    } catch (error) {
      model.errorCount++;
      this.failedRequests++;
      throw error;
    } finally {
      replica.activeRequests--;
    }
  }

  /**
   * Make batch predictions
   */
  async predictBatch(request: BatchPredictionRequest): Promise<BatchPredictionResponse> {
    const startTime = Date.now();

    const modelKey = request.modelVersion
      ? `${request.modelId}:${request.modelVersion}`
      : this.findLatestVersion(request.modelId);

    if (!modelKey) {
      throw new Error(`Model not found: ${request.modelId}`);
    }

    const model = this.models.get(modelKey);
    if (!model || model.status !== 'ready') {
      throw new Error(`Model not ready: ${request.modelId}`);
    }

    const maxBatchSize = request.options?.maxBatchSize || model.config.batchSize;
    const batches: Record<string, unknown>[][] = [];

    // Split into batches
    for (let i = 0; i < request.inputs.length; i += maxBatchSize) {
      batches.push(request.inputs.slice(i, i + maxBatchSize));
    }

    const allOutputs: Record<string, unknown>[] = [];

    // Process each batch
    for (const batch of batches) {
      const batchOutputs = await Promise.all(
        batch.map(input => this.simulatePrediction(model, input))
      );
      allOutputs.push(...batchOutputs);
    }

    const latencyMs = Date.now() - startTime;

    return {
      requestId: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      modelId: request.modelId,
      modelVersion: model.config.version,
      outputs: allOutputs,
      latencyMs,
      itemsProcessed: request.inputs.length,
    };
  }

  /**
   * Create a serving endpoint for a model
   */
  createEndpoint(
    modelId: string,
    type: EndpointType,
    path: string,
    options?: Partial<ServingEndpoint>
  ): ServingEndpoint {
    const endpoint: ServingEndpoint = {
      id: `endpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      modelId,
      path,
      methods: options?.methods || ['POST'],
      rateLimit: options?.rateLimit || 1000,
      authRequired: options?.authRequired ?? true,
      enabled: options?.enabled ?? true,
      createdAt: new Date(),
    };

    this.endpoints.set(endpoint.id, endpoint);
    this.emit('endpointCreated', endpoint);

    console.log(`[ModelServing] Endpoint created: ${type} ${path} -> ${modelId}`);
    return endpoint;
  }

  /**
   * Remove a serving endpoint
   */
  removeEndpoint(endpointId: string): boolean {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return false;

    this.endpoints.delete(endpointId);
    this.emit('endpointRemoved', endpoint);

    return true;
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string, version?: string): LoadedModel | undefined {
    if (version) {
      return this.models.get(`${modelId}:${version}`);
    }

    const key = this.findLatestVersion(modelId);
    return key ? this.models.get(key) : undefined;
  }

  /**
   * Get all loaded models
   */
  getAllModels(): LoadedModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get all endpoints
   */
  getAllEndpoints(): ServingEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Get serving statistics
   */
  getStats(): ModelServingStats {
    const models = Array.from(this.models.values());
    const allReplicas = models.flatMap(m => m.replicas);

    const modelStats = new Map<string, { requests: number; errors: number; avgLatency: number }>();

    for (const model of models) {
      modelStats.set(model.config.id, {
        requests: model.requestCount,
        errors: model.errorCount,
        avgLatency: model.avgLatencyMs,
      });
    }

    return {
      modelsLoaded: this.models.size,
      totalReplicas: allReplicas.length,
      healthyReplicas: allReplicas.filter(r => r.status === 'ready' && r.healthScore >= 80).length,
      endpoints: this.endpoints.size,
      metrics: this.getMetrics(),
      modelStats,
    };
  }

  /**
   * Get serving metrics
   */
  getMetrics(): ServingMetrics {
    const allLatencies: number[] = [];
    for (const history of this.latencyHistory.values()) {
      allLatencies.push(...history);
    }

    allLatencies.sort((a, b) => a - b);

    const p50 = allLatencies[Math.floor(allLatencies.length * 0.5)] || 0;
    const p95 = allLatencies[Math.floor(allLatencies.length * 0.95)] || 0;
    const p99 = allLatencies[Math.floor(allLatencies.length * 0.99)] || 0;
    const avg = allLatencies.length > 0
      ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length
      : 0;

    const queuedRequests = Array.from(this.requestQueue.values())
      .reduce((sum, queue) => sum + queue.length, 0);

    const activeConnections = Array.from(this.models.values())
      .flatMap(m => m.replicas)
      .reduce((sum, r) => sum + r.activeRequests, 0);

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      avgLatencyMs: avg,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      requestsPerSecond: this.calculateRPS(),
      activeConnections,
      queuedRequests,
      cacheHitRate: this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0,
    };
  }

  /**
   * Check if model is healthy
   */
  isModelHealthy(modelId: string, version?: string): boolean {
    const model = this.getModel(modelId, version);
    if (!model || model.status !== 'ready') return false;

    const healthyReplicas = model.replicas.filter(
      r => r.status === 'ready' && r.healthScore >= 80
    );

    return healthyReplicas.length > 0;
  }

  // Private methods

  private findLatestVersion(modelId: string): string | null {
    const versions = Array.from(this.models.keys())
      .filter(k => k.startsWith(`${modelId}:`))
      .sort((a, b) => {
        const vA = a.split(':')[1];
        const vB = b.split(':')[1];
        return vB.localeCompare(vA, undefined, { numeric: true });
      });

    return versions[0] || null;
  }

  private selectReplica(model: LoadedModel): ModelReplica | null {
    const healthyReplicas = model.replicas.filter(
      r => r.status === 'ready' && r.healthScore >= 50
    );

    if (healthyReplicas.length === 0) return null;

    // Weighted random selection based on health score and load
    const totalWeight = healthyReplicas.reduce((sum, r) => {
      const loadFactor = Math.max(0.1, 1 - (r.activeRequests / 100));
      return sum + (r.weight * r.healthScore * loadFactor);
    }, 0);

    let random = Math.random() * totalWeight;

    for (const replica of healthyReplicas) {
      const loadFactor = Math.max(0.1, 1 - (replica.activeRequests / 100));
      const weight = replica.weight * replica.healthScore * loadFactor;
      random -= weight;
      if (random <= 0) return replica;
    }

    return healthyReplicas[0];
  }

  private async simulateModelLoad(config: ModelConfig): Promise<void> {
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  }

  private async runWarmup(config: ModelConfig): Promise<void> {
    console.log(`[ModelServing] Running ${config.warmupRequests} warmup requests for ${config.name}`);

    for (let i = 0; i < config.warmupRequests; i++) {
      try {
        await this.predict({
          modelId: config.id,
          modelVersion: config.version,
          inputs: { warmup: true },
        });
      } catch {
        // Ignore warmup errors
      }
    }
  }

  private async simulatePrediction(
    model: LoadedModel,
    inputs: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Simulate prediction latency
    await new Promise(resolve =>
      setTimeout(resolve, 5 + Math.random() * 20)
    );

    // Return mock prediction based on model type
    const modelName = model.config.name.toLowerCase();

    if (modelName.includes('churn')) {
      return {
        churnProbability: Math.random(),
        riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        confidence: 0.8 + Math.random() * 0.2,
      };
    }

    if (modelName.includes('engagement')) {
      return {
        engagementScore: Math.random() * 100,
        predictedActions: ['complete_goal', 'start_session'],
        nextBestAction: 'send_reminder',
      };
    }

    if (modelName.includes('sentiment')) {
      return {
        sentiment: Math.random() > 0.6 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative',
        score: Math.random(),
        emotions: ['happy', 'motivated'],
      };
    }

    // Default prediction
    return {
      prediction: Math.random(),
      confidence: 0.7 + Math.random() * 0.3,
      processed: true,
    };
  }

  private getCacheKey(request: PredictionRequest): string {
    return `${request.modelId}:${request.modelVersion || 'latest'}:${JSON.stringify(request.inputs)}`;
  }

  private cacheResponse(key: string, response: PredictionResponse): void {
    // Enforce cache size limit
    if (this.cache.size >= this.config.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      response,
      expiresAt: new Date(Date.now() + this.config.cacheTTLMs),
    });
  }

  private updateLatencyMetrics(modelKey: string, latencyMs: number): void {
    let history = this.latencyHistory.get(modelKey);
    if (!history) {
      history = [];
      this.latencyHistory.set(modelKey, history);
    }

    history.push(latencyMs);

    // Trim to max size
    if (history.length > this.config.maxLatencyHistorySize) {
      history.shift();
    }

    // Update model average
    const model = this.models.get(modelKey);
    if (model) {
      model.avgLatencyMs = history.reduce((a, b) => a + b, 0) / history.length;
    }
  }

  private calculateRPS(): number {
    // Simple RPS calculation based on recent requests
    // In production, would use a sliding window
    return this.totalRequests / Math.max(1, (Date.now() / 1000));
  }

  private async runHealthChecks(): Promise<void> {
    for (const model of this.models.values()) {
      for (const replica of model.replicas) {
        try {
          // Simulate health check
          const healthy = Math.random() > 0.05; // 95% success rate

          replica.healthScore = healthy
            ? Math.min(100, replica.healthScore + 5)
            : Math.max(0, replica.healthScore - 20);

          replica.lastHealthCheck = new Date();

          if (replica.healthScore < 50 && replica.status === 'ready') {
            replica.status = 'error';
            this.emit('replicaUnhealthy', { modelId: model.config.id, replicaId: replica.id });
          } else if (replica.healthScore >= 80 && replica.status === 'error') {
            replica.status = 'ready';
            this.emit('replicaRecovered', { modelId: model.config.id, replicaId: replica.id });
          }
        } catch (error) {
          replica.healthScore = Math.max(0, replica.healthScore - 20);
        }
      }
    }
  }

  private collectMetrics(): void {
    const metrics = this.getMetrics();
    this.emit('metrics', metrics);

    // Clean up expired cache entries
    const now = new Date();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const modelServingService = new ModelServingService();

// Factory function
export function createModelServingService(
  config?: Partial<ConstructorParameters<typeof ModelServingService>[0]>
): ModelServingService {
  return new ModelServingService(config);
}
