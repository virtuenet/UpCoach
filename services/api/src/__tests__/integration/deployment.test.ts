/**
 * Integration Tests for ML Model Deployment Services
 *
 * Tests for:
 * - Model serving and inference
 * - Canary deployments
 * - Shadow deployments
 * - Traffic splitting / A/B testing
 * - Model quantization
 * - Mobile model registry
 * - Production monitoring
 * - Health checks
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { modelServingService } from '../../services/ml/deployment/ModelServingService';
import { canaryDeploymentService } from '../../services/ml/deployment/CanaryDeploymentService';
import { shadowDeploymentService } from '../../services/ml/deployment/ShadowDeploymentService';
import { trafficSplitter } from '../../services/ml/deployment/TrafficSplitter';
import { modelQuantizer } from '../../services/ml/mobile/ModelQuantizer';
import { mobileModelRegistry } from '../../services/ml/mobile/MobileModelRegistry';
import { productionMonitoringService } from '../../services/monitoring/ProductionMonitoringService';
import { modelHealthCheckService } from '../../services/monitoring/ModelHealthCheckService';

// ============================================================================
// Model Serving Tests
// ============================================================================

describe('ModelServingService', () => {
  beforeEach(() => {
    modelServingService.reset();
  });

  afterEach(() => {
    modelServingService.reset();
  });

  describe('Model Loading', () => {
    it('should load a model successfully', async () => {
      const config = {
        modelId: 'test-model',
        version: '1.0.0',
        path: '/models/test-model.onnx',
        framework: 'onnx' as const,
        inputShape: [1, 224, 224, 3],
        outputShape: [1, 1000],
      };

      const model = await modelServingService.loadModel(config);

      expect(model).toBeDefined();
      expect(model.modelId).toBe('test-model');
      expect(model.version).toBe('1.0.0');
      expect(model.status).toBe('loaded');
    });

    it('should unload a model successfully', async () => {
      await modelServingService.loadModel({
        modelId: 'test-model',
        version: '1.0.0',
        path: '/models/test.onnx',
        framework: 'onnx' as const,
        inputShape: [1, 224, 224, 3],
        outputShape: [1, 1000],
      });

      const success = await modelServingService.unloadModel('test-model', '1.0.0');
      expect(success).toBe(true);
    });
  });

  describe('Predictions', () => {
    it('should make a prediction on a loaded model', async () => {
      await modelServingService.loadModel({
        modelId: 'predict-model',
        version: '1.0.0',
        path: '/models/predict.onnx',
        framework: 'onnx' as const,
        inputShape: [1, 10],
        outputShape: [1, 5],
      });

      const response = await modelServingService.predict({
        modelId: 'predict-model',
        input: { features: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      });

      expect(response).toBeDefined();
      expect(response.modelId).toBe('predict-model');
      expect(response.output).toBeDefined();
      expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle batch predictions', async () => {
      await modelServingService.loadModel({
        modelId: 'batch-model',
        version: '1.0.0',
        path: '/models/batch.onnx',
        framework: 'onnx' as const,
        inputShape: [1, 10],
        outputShape: [1, 5],
      });

      const response = await modelServingService.predictBatch({
        modelId: 'batch-model',
        inputs: [
          { features: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
          { features: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
        ],
      });

      expect(response).toBeDefined();
      expect(response.predictions).toHaveLength(2);
    });
  });

  describe('Statistics', () => {
    it('should track serving statistics', async () => {
      await modelServingService.loadModel({
        modelId: 'stats-model',
        version: '1.0.0',
        path: '/models/stats.onnx',
        framework: 'onnx' as const,
        inputShape: [1, 10],
        outputShape: [1, 5],
      });

      await modelServingService.predict({
        modelId: 'stats-model',
        input: { data: [1, 2, 3] },
      });

      const stats = modelServingService.getStats();

      expect(stats.loadedModels).toBe(1);
      expect(stats.totalPredictions).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Canary Deployment Tests
// ============================================================================

describe('CanaryDeploymentService', () => {
  beforeEach(() => {
    canaryDeploymentService.reset();
  });

  afterEach(() => {
    canaryDeploymentService.reset();
  });

  describe('Deployment Lifecycle', () => {
    it('should start a canary deployment', async () => {
      const deployment = await canaryDeploymentService.startDeployment({
        modelId: 'test-model',
        baselineVersion: '1.0.0',
        canaryVersion: '1.1.0',
      });

      expect(deployment).toBeDefined();
      expect(deployment.modelId).toBe('test-model');
      expect(deployment.status).toBe('canary');
      expect(deployment.trafficPercentage).toBe(5);
    });

    it('should promote a canary deployment', async () => {
      const deployment = await canaryDeploymentService.startDeployment({
        modelId: 'promote-model',
        baselineVersion: '1.0.0',
        canaryVersion: '1.1.0',
      });

      const promoted = await canaryDeploymentService.promoteDeployment(deployment.id);

      expect(promoted).toBe(true);

      const updated = canaryDeploymentService.getDeployment(deployment.id);
      expect(updated?.status).toBe('partial');
      expect(updated?.trafficPercentage).toBe(25);
    });

    it('should rollback a canary deployment', async () => {
      const deployment = await canaryDeploymentService.startDeployment({
        modelId: 'rollback-model',
        baselineVersion: '1.0.0',
        canaryVersion: '1.1.0',
      });

      const rolledBack = await canaryDeploymentService.rollbackDeployment(
        deployment.id,
        'Test rollback'
      );

      expect(rolledBack).toBe(true);

      const updated = canaryDeploymentService.getDeployment(deployment.id);
      expect(updated?.status).toBe('rolled_back');
    });
  });

  describe('Traffic Routing', () => {
    it('should route traffic based on deployment stage', async () => {
      const deployment = await canaryDeploymentService.startDeployment({
        modelId: 'route-model',
        baselineVersion: '1.0.0',
        canaryVersion: '1.1.0',
      });

      let canaryCount = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const result = canaryDeploymentService.routeRequest('route-model', {
          modelId: 'route-model',
          input: { test: true },
        });
        if (result.isCanary) canaryCount++;
      }

      // At 5% canary traffic, expect roughly 5 canary requests out of 100
      expect(canaryCount).toBeLessThan(20);
    });
  });
});

// ============================================================================
// Shadow Deployment Tests
// ============================================================================

describe('ShadowDeploymentService', () => {
  beforeEach(() => {
    shadowDeploymentService.reset();
  });

  afterEach(() => {
    shadowDeploymentService.reset();
  });

  describe('Shadow Deployment', () => {
    it('should start a shadow deployment', async () => {
      const deployment = await shadowDeploymentService.startShadow({
        modelId: 'shadow-model',
        shadowVersion: '2.0.0',
        productionVersion: '1.0.0',
      });

      expect(deployment).toBeDefined();
      expect(deployment.modelId).toBe('shadow-model');
      expect(deployment.status).toBe('active');
    });

    it('should stop a shadow deployment', async () => {
      const deployment = await shadowDeploymentService.startShadow({
        modelId: 'stop-shadow',
        shadowVersion: '2.0.0',
        productionVersion: '1.0.0',
      });

      const stopped = await shadowDeploymentService.stopShadow(deployment.id);
      expect(stopped).toBe(true);
    });

    it('should analyze shadow deployment results', async () => {
      const deployment = await shadowDeploymentService.startShadow({
        modelId: 'analyze-shadow',
        shadowVersion: '2.0.0',
        productionVersion: '1.0.0',
      });

      // Process some requests
      for (let i = 0; i < 10; i++) {
        await shadowDeploymentService.processRequest(
          'analyze-shadow',
          { modelId: 'analyze-shadow', input: { value: i } },
          { modelId: 'analyze-shadow', output: { result: i * 2 }, latencyMs: 10 + i }
        );
      }

      const analysis = shadowDeploymentService.analyzeShadow(deployment.id);

      expect(analysis).toBeDefined();
      expect(analysis?.totalComparisons).toBe(10);
    });
  });
});

// ============================================================================
// Traffic Splitter / A/B Testing Tests
// ============================================================================

describe('TrafficSplitter', () => {
  beforeEach(() => {
    trafficSplitter.reset();
  });

  afterEach(() => {
    trafficSplitter.reset();
  });

  describe('Experiment Management', () => {
    it('should create an experiment', () => {
      const experiment = trafficSplitter.createExperiment({
        name: 'Test Experiment',
        modelId: 'ab-model',
        variants: [
          { id: 'control', name: 'Control', modelVersion: '1.0.0', weight: 50 },
          { id: 'treatment', name: 'Treatment', modelVersion: '1.1.0', weight: 50 },
        ],
      });

      expect(experiment).toBeDefined();
      expect(experiment.name).toBe('Test Experiment');
      expect(experiment.status).toBe('draft');
    });

    it('should start and stop an experiment', () => {
      const experiment = trafficSplitter.createExperiment({
        name: 'Start Stop Experiment',
        modelId: 'ss-model',
        variants: [
          { id: 'a', name: 'A', modelVersion: '1.0.0', weight: 50 },
          { id: 'b', name: 'B', modelVersion: '1.1.0', weight: 50 },
        ],
      });

      const started = trafficSplitter.startExperiment(experiment.id);
      expect(started).toBe(true);

      const stopped = trafficSplitter.stopExperiment(experiment.id);
      expect(stopped).toBe(true);
    });
  });

  describe('Traffic Routing', () => {
    it('should route traffic to variants', () => {
      const experiment = trafficSplitter.createExperiment({
        name: 'Routing Experiment',
        modelId: 'route-exp-model',
        variants: [
          { id: 'control', name: 'Control', modelVersion: '1.0.0', weight: 50 },
          { id: 'treatment', name: 'Treatment', modelVersion: '1.1.0', weight: 50 },
        ],
      });

      trafficSplitter.startExperiment(experiment.id);

      const decision = trafficSplitter.routeRequest('route-exp-model');

      expect(decision).toBeDefined();
      expect(['control', 'treatment']).toContain(decision?.variantId);
    });

    it('should support sticky sessions', () => {
      const experiment = trafficSplitter.createExperiment({
        name: 'Sticky Experiment',
        modelId: 'sticky-model',
        variants: [
          { id: 'a', name: 'A', modelVersion: '1.0.0', weight: 50 },
          { id: 'b', name: 'B', modelVersion: '1.1.0', weight: 50 },
        ],
        strategy: 'sticky',
      });

      trafficSplitter.startExperiment(experiment.id);

      const sessionKey = 'user-123';
      const firstDecision = trafficSplitter.routeRequest('sticky-model', sessionKey);
      const secondDecision = trafficSplitter.routeRequest('sticky-model', sessionKey);

      expect(firstDecision?.variantId).toBe(secondDecision?.variantId);
    });
  });

  describe('Conversion Tracking', () => {
    it('should record conversions and calculate results', () => {
      const experiment = trafficSplitter.createExperiment({
        name: 'Conversion Experiment',
        modelId: 'conv-model',
        variants: [
          { id: 'control', name: 'Control', modelVersion: '1.0.0', weight: 50 },
          { id: 'treatment', name: 'Treatment', modelVersion: '1.1.0', weight: 50 },
        ],
      });

      trafficSplitter.startExperiment(experiment.id);

      // Simulate traffic and conversions
      for (let i = 0; i < 50; i++) {
        trafficSplitter.recordConversion(experiment.id, 'control', i % 5 === 0 ? 1 : 0);
        trafficSplitter.recordConversion(experiment.id, 'treatment', i % 4 === 0 ? 1 : 0);
      }

      const results = trafficSplitter.getResults(experiment.id);

      expect(results).toBeDefined();
      expect(results?.variants).toHaveLength(2);
    });
  });
});

// ============================================================================
// Model Quantization Tests
// ============================================================================

describe('ModelQuantizer', () => {
  beforeEach(() => {
    modelQuantizer.reset();
  });

  afterEach(() => {
    modelQuantizer.reset();
  });

  describe('Model Registration', () => {
    it('should register a model for quantization', () => {
      modelQuantizer.registerModel({
        id: 'quant-model',
        name: 'Quantization Model',
        version: '1.0.0',
        framework: 'tensorflow' as const,
        originalPath: '/models/original.h5',
        originalSizeBytes: 100 * 1024 * 1024,
        inputShape: [1, 224, 224, 3],
        outputShape: [1, 1000],
      });

      const model = modelQuantizer.getRegisteredModel('quant-model', '1.0.0');
      expect(model).toBeDefined();
      expect(model?.name).toBe('Quantization Model');
    });
  });

  describe('Quantization', () => {
    it('should quantize a model to INT8', async () => {
      modelQuantizer.registerModel({
        id: 'int8-model',
        name: 'INT8 Model',
        version: '1.0.0',
        framework: 'tensorflow' as const,
        originalPath: '/models/original.h5',
        originalSizeBytes: 100 * 1024 * 1024,
        inputShape: [1, 224, 224, 3],
        outputShape: [1, 1000],
      });

      const result = await modelQuantizer.quantize({
        modelId: 'int8-model',
        modelVersion: '1.0.0',
        quantizationType: 'int8',
        targetPlatform: 'tflite',
        optimizationLevel: 'basic',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.compressionRatio).toBeGreaterThan(1);
    });

    it('should quantize to FP16', async () => {
      modelQuantizer.registerModel({
        id: 'fp16-model',
        name: 'FP16 Model',
        version: '1.0.0',
        framework: 'pytorch' as const,
        originalPath: '/models/original.pt',
        originalSizeBytes: 50 * 1024 * 1024,
        inputShape: [1, 10],
        outputShape: [1, 5],
      });

      const result = await modelQuantizer.quantize({
        modelId: 'fp16-model',
        modelVersion: '1.0.0',
        quantizationType: 'fp16',
        targetPlatform: 'pytorch_mobile',
        optimizationLevel: 'aggressive',
      });

      expect(result.compressionRatio).toBeGreaterThan(1);
      expect(result.compressionRatio).toBeLessThan(3);
    });
  });

  describe('Recommendations', () => {
    it('should recommend optimization based on constraints', () => {
      modelQuantizer.registerModel({
        id: 'rec-model',
        name: 'Recommendation Model',
        version: '1.0.0',
        framework: 'tensorflow' as const,
        originalPath: '/models/rec.h5',
        originalSizeBytes: 200 * 1024 * 1024,
        inputShape: [1, 224, 224, 3],
        outputShape: [1, 1000],
      });

      const recommendation = modelQuantizer.recommendOptimization('rec-model', '1.0.0', {
        maxSizeMB: 30,
        maxLatencyMs: 50,
      });

      expect(recommendation).toBeDefined();
      expect(recommendation.quantizationType).toBe('int8');
    });
  });
});

// ============================================================================
// Mobile Model Registry Tests
// ============================================================================

describe('MobileModelRegistry', () => {
  beforeEach(() => {
    mobileModelRegistry.reset();
  });

  afterEach(() => {
    mobileModelRegistry.reset();
  });

  describe('Model Registration', () => {
    it('should register a mobile model', () => {
      const model = mobileModelRegistry.registerModel({
        name: 'coaching-model',
        displayName: 'Coaching AI',
        description: 'AI coaching model',
        category: 'coaching',
        version: '1.0.0',
        format: 'tflite',
        supportedPlatforms: ['ios', 'android'],
        minAppVersion: '1.0.0',
        sizeBytes: 10 * 1024 * 1024,
        downloadUrl: 'https://models.example.com/coaching.tflite',
        checksum: 'abc123',
        checksumAlgorithm: 'sha256',
        inputSpec: { shape: [1, 512], dtype: 'float32' },
        outputSpec: { shape: [1, 10], dtype: 'float32' },
        capabilities: ['sentiment', 'coaching'],
        requirements: { minRAMMB: 256, minStorageMB: 50, requiresGPU: false },
        metadata: {},
        isActive: true,
        isRequired: false,
        priority: 1,
      });

      expect(model).toBeDefined();
      expect(model.name).toBe('coaching-model');
    });
  });

  describe('Compatibility Checks', () => {
    it('should check device compatibility', () => {
      const model = mobileModelRegistry.registerModel({
        name: 'compat-model',
        displayName: 'Compatible Model',
        description: 'Test model',
        category: 'test',
        version: '1.0.0',
        format: 'tflite',
        supportedPlatforms: ['android'],
        minAppVersion: '1.0.0',
        sizeBytes: 5 * 1024 * 1024,
        downloadUrl: 'https://models.example.com/compat.tflite',
        checksum: 'def456',
        checksumAlgorithm: 'sha256',
        inputSpec: { shape: [1, 10], dtype: 'float32' },
        outputSpec: { shape: [1, 5], dtype: 'float32' },
        capabilities: [],
        requirements: { minRAMMB: 128, minStorageMB: 20, requiresGPU: false },
        metadata: {},
        isActive: true,
        isRequired: false,
        priority: 1,
      });

      const result = mobileModelRegistry.checkCompatibility(model.id, {
        deviceId: 'device-123',
        platform: 'android',
        osVersion: '13',
        appVersion: '1.0.0',
        availableStorageMB: 100,
        availableRAMMB: 512,
        hasGPU: true,
      });

      expect(result.isCompatible).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect incompatible platforms', () => {
      const model = mobileModelRegistry.registerModel({
        name: 'ios-only-model',
        displayName: 'iOS Only Model',
        description: 'iOS exclusive',
        category: 'test',
        version: '1.0.0',
        format: 'coreml',
        supportedPlatforms: ['ios'],
        minAppVersion: '1.0.0',
        sizeBytes: 5 * 1024 * 1024,
        downloadUrl: 'https://models.example.com/ios.mlmodel',
        checksum: 'ghi789',
        checksumAlgorithm: 'sha256',
        inputSpec: { shape: [1, 10], dtype: 'float32' },
        outputSpec: { shape: [1, 5], dtype: 'float32' },
        capabilities: [],
        requirements: { minRAMMB: 128, minStorageMB: 20, requiresGPU: false },
        metadata: {},
        isActive: true,
        isRequired: false,
        priority: 1,
      });

      const result = mobileModelRegistry.checkCompatibility(model.id, {
        deviceId: 'device-456',
        platform: 'android',
        osVersion: '13',
        appVersion: '1.0.0',
        availableStorageMB: 100,
        availableRAMMB: 512,
        hasGPU: true,
      });

      expect(result.isCompatible).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Production Monitoring Tests
// ============================================================================

describe('ProductionMonitoringService', () => {
  beforeEach(() => {
    productionMonitoringService.reset();
  });

  afterEach(() => {
    productionMonitoringService.stopMonitoring();
    productionMonitoringService.reset();
  });

  describe('Model Registration', () => {
    it('should register a model for monitoring', () => {
      const model = productionMonitoringService.registerModel({
        modelId: 'monitored-model',
        version: '1.0.0',
        environment: 'production',
        endpoint: '/api/predict',
      });

      expect(model).toBeDefined();
      expect(model.modelId).toBe('monitored-model');
      expect(model.isActive).toBe(true);
    });
  });

  describe('Metrics Recording', () => {
    it('should record metrics', () => {
      productionMonitoringService.registerModel({
        modelId: 'metrics-model',
        version: '1.0.0',
        environment: 'production',
        endpoint: '/api/predict',
      });

      productionMonitoringService.recordMetrics({
        modelId: 'metrics-model',
        version: '1.0.0',
        timestamp: new Date(),
        requestCount: 100,
        successCount: 98,
        errorCount: 2,
        latencyMs: {
          min: 10,
          max: 100,
          mean: 25,
          p50: 20,
          p90: 50,
          p95: 70,
          p99: 90,
          stdDev: 15,
        },
        throughput: 10,
        concurrentRequests: 5,
        memoryUsageMB: 256,
        cpuUsagePercent: 30,
        inputFeatureStats: [],
        outputDistribution: { type: 'classification' },
      });

      const stats = productionMonitoringService.getStats();
      expect(stats.totalModels).toBe(1);
    });
  });

  describe('Alert Management', () => {
    it('should get active alerts', () => {
      productionMonitoringService.registerModel({
        modelId: 'alert-model',
        version: '1.0.0',
        environment: 'production',
        endpoint: '/api/predict',
      });

      const alerts = productionMonitoringService.getActiveAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });
  });
});

// ============================================================================
// Model Health Check Tests
// ============================================================================

describe('ModelHealthCheckService', () => {
  beforeEach(() => {
    modelHealthCheckService.reset();
  });

  afterEach(() => {
    modelHealthCheckService.stopAllChecks();
    modelHealthCheckService.reset();
  });

  describe('Health Check Registration', () => {
    it('should register a health check', () => {
      const check = modelHealthCheckService.registerCheck({
        name: 'Test Check',
        type: 'liveness',
        targetId: 'test-model',
        targetType: 'model',
        intervalMs: 30000,
        timeoutMs: 5000,
        retries: 3,
        successThreshold: 1,
        failureThreshold: 3,
        isEnabled: false,
        metadata: {},
      });

      expect(check).toBeDefined();
      expect(check.name).toBe('Test Check');
    });
  });

  describe('Probes', () => {
    it('should respond to liveness probe', async () => {
      const result = await modelHealthCheckService.livenessProbe('test-model');

      expect(result).toBeDefined();
      expect(typeof result.alive).toBe('boolean');
      expect(typeof result.latencyMs).toBe('number');
    });

    it('should respond to readiness probe', async () => {
      const result = await modelHealthCheckService.readinessProbe('test-model');

      expect(result).toBeDefined();
      expect(typeof result.ready).toBe('boolean');
      expect(typeof result.latencyMs).toBe('number');
    });
  });

  describe('Self-Healing', () => {
    it('should register a healing rule', () => {
      const rule = modelHealthCheckService.registerHealingRule({
        name: 'Auto Restart',
        targetId: 'test-model',
        condition: {
          metric: 'consecutive_failures',
          operator: 'gte',
          value: 3,
        },
        action: 'restart',
        cooldownMinutes: 5,
        maxAttempts: 3,
        isEnabled: true,
        metadata: {},
      });

      expect(rule).toBeDefined();
      expect(rule.action).toBe('restart');
    });
  });

  describe('Aggregated Health', () => {
    it('should get aggregated health status', () => {
      const health = modelHealthCheckService.getAggregatedHealth();

      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(Array.isArray(health.models)).toBe(true);
      expect(Array.isArray(health.dependencies)).toBe(true);
    });
  });
});
