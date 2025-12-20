/**
 * ML Model Deployment Routes
 *
 * API endpoints for model deployment management:
 * - Model serving and inference
 * - Canary deployments
 * - Shadow deployments
 * - Traffic splitting and A/B testing
 * - Model quantization
 * - Mobile model registry
 * - Health checks and monitoring
 */

import { Router, Request, Response } from 'express';
import { modelServingService } from '../services/ml/deployment/ModelServingService';
import { canaryDeploymentService } from '../services/ml/deployment/CanaryDeploymentService';
import { shadowDeploymentService } from '../services/ml/deployment/ShadowDeploymentService';
import { trafficSplitter } from '../services/ml/deployment/TrafficSplitter';
import { modelQuantizer } from '../services/ml/mobile/ModelQuantizer';
import { mobileModelRegistry } from '../services/ml/mobile/MobileModelRegistry';
import { productionMonitoringService } from '../services/monitoring/ProductionMonitoringService';
import { modelHealthCheckService } from '../services/monitoring/ModelHealthCheckService';

const router = Router();

// ============================================================================
// Model Serving Endpoints
// ============================================================================

/**
 * POST /api/deployment/models/load
 * Load a model for serving
 */
router.post('/models/load', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    const model = await modelServingService.loadModel(config);
    res.json({ success: true, model });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load model',
    });
  }
});

/**
 * POST /api/deployment/models/unload
 * Unload a model from serving
 */
router.post('/models/unload', async (req: Request, res: Response) => {
  try {
    const { modelId, version } = req.body;
    const success = await modelServingService.unloadModel(modelId, version);
    res.json({ success });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unload model',
    });
  }
});

/**
 * POST /api/deployment/models/predict
 * Run inference on a loaded model
 */
router.post('/models/predict', async (req: Request, res: Response) => {
  try {
    const request = req.body;
    const response = await modelServingService.predict(request);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Prediction failed',
    });
  }
});

/**
 * POST /api/deployment/models/predict/batch
 * Run batch inference
 */
router.post('/models/predict/batch', async (req: Request, res: Response) => {
  try {
    const request = req.body;
    const response = await modelServingService.predictBatch(request);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch prediction failed',
    });
  }
});

/**
 * GET /api/deployment/models/stats
 * Get model serving statistics
 */
router.get('/models/stats', (_req: Request, res: Response) => {
  try {
    const stats = modelServingService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

// ============================================================================
// Canary Deployment Endpoints
// ============================================================================

/**
 * POST /api/deployment/canary/start
 * Start a canary deployment
 */
router.post('/canary/start', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    const deployment = await canaryDeploymentService.startDeployment(config);
    res.json({ success: true, deployment });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start canary deployment',
    });
  }
});

/**
 * POST /api/deployment/canary/:id/promote
 * Promote canary to next stage
 */
router.post('/canary/:id/promote', async (req: Request, res: Response) => {
  try {
    const success = await canaryDeploymentService.promoteDeployment(req.params.id);
    res.json({ success });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to promote canary',
    });
  }
});

/**
 * POST /api/deployment/canary/:id/rollback
 * Rollback a canary deployment
 */
router.post('/canary/:id/rollback', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const success = await canaryDeploymentService.rollbackDeployment(req.params.id, reason);
    res.json({ success });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rollback canary',
    });
  }
});

/**
 * GET /api/deployment/canary/:id
 * Get canary deployment details
 */
router.get('/canary/:id', (req: Request, res: Response) => {
  try {
    const deployment = canaryDeploymentService.getDeployment(req.params.id);
    if (deployment) {
      res.json({ success: true, deployment });
    } else {
      res.status(404).json({ success: false, error: 'Deployment not found' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get deployment',
    });
  }
});

/**
 * GET /api/deployment/canary
 * List all canary deployments
 */
router.get('/canary', (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const allDeployments = canaryDeploymentService.getAllDeployments();
    const deployments = status
      ? allDeployments.filter(d => d.currentStage === status || d.status === status)
      : allDeployments;
    res.json({ success: true, deployments });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list deployments',
    });
  }
});

// ============================================================================
// Shadow Deployment Endpoints
// ============================================================================

/**
 * POST /api/deployment/shadow/start
 * Start a shadow deployment
 */
router.post('/shadow/start', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    const deployment = await shadowDeploymentService.startShadow(config);
    res.json({ success: true, deployment });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start shadow deployment',
    });
  }
});

/**
 * POST /api/deployment/shadow/:id/stop
 * Stop a shadow deployment
 */
router.post('/shadow/:id/stop', async (req: Request, res: Response) => {
  try {
    const success = await shadowDeploymentService.stopShadow(req.params.id);
    res.json({ success });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop shadow deployment',
    });
  }
});

/**
 * GET /api/deployment/shadow/:id/analysis
 * Get shadow deployment analysis
 */
router.get('/shadow/:id/analysis', (req: Request, res: Response) => {
  try {
    const analysis = shadowDeploymentService.analyzeShadow(req.params.id);
    if (analysis) {
      res.json({ success: true, analysis });
    } else {
      res.status(404).json({ success: false, error: 'Deployment not found' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze shadow',
    });
  }
});

/**
 * GET /api/deployment/shadow
 * List all shadow deployments
 */
router.get('/shadow', (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const allDeployments = shadowDeploymentService.getAllShadows();
    const deployments = status
      ? allDeployments.filter(d => d.status === status)
      : allDeployments;
    res.json({ success: true, deployments });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list shadow deployments',
    });
  }
});

// ============================================================================
// Traffic Splitting / A/B Testing Endpoints
// ============================================================================

/**
 * POST /api/deployment/experiments
 * Create a new experiment
 */
router.post('/experiments', (req: Request, res: Response) => {
  try {
    const config = req.body;
    const experiment = trafficSplitter.createExperiment(config);
    res.json({ success: true, experiment });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create experiment',
    });
  }
});

/**
 * POST /api/deployment/experiments/:id/start
 * Start an experiment
 */
router.post('/experiments/:id/start', (req: Request, res: Response) => {
  try {
    const success = trafficSplitter.startExperiment(req.params.id);
    res.json({ success });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start experiment',
    });
  }
});

/**
 * POST /api/deployment/experiments/:id/stop
 * Stop an experiment
 */
router.post('/experiments/:id/stop', (req: Request, res: Response) => {
  try {
    const success = trafficSplitter.stopExperiment(req.params.id);
    res.json({ success });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop experiment',
    });
  }
});

/**
 * GET /api/deployment/experiments/:id/results
 * Get experiment results
 */
router.get('/experiments/:id/results', (req: Request, res: Response) => {
  try {
    const results = trafficSplitter.getResults(req.params.id);
    if (results) {
      res.json({ success: true, results });
    } else {
      res.status(404).json({ success: false, error: 'Experiment not found' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get results',
    });
  }
});

/**
 * POST /api/deployment/experiments/:id/conversion
 * Record a conversion for an experiment
 */
router.post('/experiments/:id/conversion', (req: Request, res: Response) => {
  try {
    const { variantId, metricValue } = req.body;
    const success = trafficSplitter.recordConversion(req.params.id, variantId, metricValue);
    res.json({ success });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record conversion',
    });
  }
});

/**
 * GET /api/deployment/experiments
 * List all experiments
 */
router.get('/experiments', (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const allExperiments = trafficSplitter.getAllExperiments();
    const experiments = status
      ? allExperiments.filter(e => e.status === status)
      : allExperiments;
    res.json({ success: true, experiments });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list experiments',
    });
  }
});

// ============================================================================
// Model Quantization Endpoints
// ============================================================================

/**
 * POST /api/deployment/quantization/register
 * Register a model for quantization
 */
router.post('/quantization/register', (req: Request, res: Response) => {
  try {
    const metadata = req.body;
    modelQuantizer.registerModel(metadata);
    res.json({ success: true, message: 'Model registered' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register model',
    });
  }
});

/**
 * POST /api/deployment/quantization/quantize
 * Quantize a model
 */
router.post('/quantization/quantize', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    const result = await modelQuantizer.quantize(config);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Quantization failed',
    });
  }
});

/**
 * GET /api/deployment/quantization/:id
 * Get quantized model details
 */
router.get('/quantization/:id', (req: Request, res: Response) => {
  try {
    const model = modelQuantizer.getQuantizedModel(req.params.id);
    if (model) {
      res.json({ success: true, model });
    } else {
      res.status(404).json({ success: false, error: 'Quantized model not found' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get model',
    });
  }
});

/**
 * GET /api/deployment/quantization/:id/benchmark
 * Get benchmark results for quantized model
 */
router.get('/quantization/:id/benchmark', async (req: Request, res: Response) => {
  try {
    const benchmark = await modelQuantizer.benchmark(req.params.id);
    res.json({ success: true, benchmark });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Benchmark failed',
    });
  }
});

/**
 * POST /api/deployment/quantization/recommend
 * Get quantization recommendations
 */
router.post('/quantization/recommend', (req: Request, res: Response) => {
  try {
    const { modelId, version, constraints } = req.body;
    const recommendation = modelQuantizer.recommendOptimization(modelId, version, constraints);
    res.json({ success: true, recommendation });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recommendations',
    });
  }
});

/**
 * GET /api/deployment/quantization/stats
 * Get quantization statistics
 */
router.get('/quantization/stats', (_req: Request, res: Response) => {
  try {
    const stats = modelQuantizer.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

// ============================================================================
// Mobile Model Registry Endpoints
// ============================================================================

/**
 * POST /api/deployment/mobile/models
 * Register a mobile model
 */
router.post('/mobile/models', (req: Request, res: Response) => {
  try {
    const model = mobileModelRegistry.registerModel(req.body);
    res.json({ success: true, model });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register model',
    });
  }
});

/**
 * GET /api/deployment/mobile/models
 * List mobile models
 */
router.get('/mobile/models', (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as string | undefined,
      format: req.query.format as 'tflite' | 'coreml' | 'onnx' | 'pytorch_mobile' | undefined,
      platform: req.query.platform as 'ios' | 'android' | 'web' | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    };
    const models = mobileModelRegistry.listModels(filters);
    res.json({ success: true, models });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list models',
    });
  }
});

/**
 * GET /api/deployment/mobile/models/:id
 * Get mobile model details
 */
router.get('/mobile/models/:id', (req: Request, res: Response) => {
  try {
    const model = mobileModelRegistry.getModel(req.params.id);
    if (model) {
      res.json({ success: true, model });
    } else {
      res.status(404).json({ success: false, error: 'Model not found' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get model',
    });
  }
});

/**
 * POST /api/deployment/mobile/models/download
 * Request model download
 */
router.post('/mobile/models/download', (req: Request, res: Response) => {
  try {
    const request = req.body;
    const response = mobileModelRegistry.requestDownload(request);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Download request failed',
    });
  }
});

/**
 * POST /api/deployment/mobile/models/check-updates
 * Check for model updates
 */
router.post('/mobile/models/check-updates', (req: Request, res: Response) => {
  try {
    const { deviceId, installedModels } = req.body;
    const result = mobileModelRegistry.checkForUpdates(deviceId, installedModels);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Update check failed',
    });
  }
});

/**
 * POST /api/deployment/mobile/models/compatibility
 * Check model compatibility
 */
router.post('/mobile/models/compatibility', (req: Request, res: Response) => {
  try {
    const { modelId, deviceInfo } = req.body;
    const result = mobileModelRegistry.checkCompatibility(modelId, deviceInfo);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Compatibility check failed',
    });
  }
});

/**
 * GET /api/deployment/mobile/stats
 * Get mobile registry statistics
 */
router.get('/mobile/stats', (_req: Request, res: Response) => {
  try {
    const stats = mobileModelRegistry.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

// ============================================================================
// Monitoring Endpoints
// ============================================================================

/**
 * POST /api/deployment/monitoring/register
 * Register a model for monitoring
 */
router.post('/monitoring/register', (req: Request, res: Response) => {
  try {
    const model = productionMonitoringService.registerModel(req.body);
    res.json({ success: true, model });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register model',
    });
  }
});

/**
 * POST /api/deployment/monitoring/metrics
 * Record metrics for a model
 */
router.post('/monitoring/metrics', (req: Request, res: Response) => {
  try {
    productionMonitoringService.recordMetrics(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record metrics',
    });
  }
});

/**
 * GET /api/deployment/monitoring/alerts
 * Get active alerts
 */
router.get('/monitoring/alerts', (req: Request, res: Response) => {
  try {
    const modelId = req.query.modelId as string | undefined;
    const alerts = productionMonitoringService.getActiveAlerts(modelId);
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get alerts',
    });
  }
});

/**
 * POST /api/deployment/monitoring/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/monitoring/alerts/:id/acknowledge', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const success = productionMonitoringService.acknowledgeAlert(req.params.id, userId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acknowledge alert',
    });
  }
});

/**
 * GET /api/deployment/monitoring/drift/:modelId/:version
 * Get drift report
 */
router.get('/monitoring/drift/:modelId/:version', (req: Request, res: Response) => {
  try {
    const report = productionMonitoringService.generateDriftReport(req.params.modelId, req.params.version);
    if (report) {
      res.json({ success: true, report });
    } else {
      res.status(404).json({ success: false, error: 'No drift data available' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate drift report',
    });
  }
});

/**
 * GET /api/deployment/monitoring/sla/:modelId/:version
 * Get SLA report
 */
router.get('/monitoring/sla/:modelId/:version', (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const report = productionMonitoringService.generateSLAReport(req.params.modelId, req.params.version, hours);
    if (report) {
      res.json({ success: true, report });
    } else {
      res.status(404).json({ success: false, error: 'No SLA data available' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate SLA report',
    });
  }
});

/**
 * GET /api/deployment/monitoring/stats
 * Get monitoring statistics
 */
router.get('/monitoring/stats', (_req: Request, res: Response) => {
  try {
    const stats = productionMonitoringService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

// ============================================================================
// Health Check Endpoints
// ============================================================================

/**
 * POST /api/deployment/health/checks
 * Register a health check
 */
router.post('/health/checks', (req: Request, res: Response) => {
  try {
    const check = modelHealthCheckService.registerCheck(req.body);
    res.json({ success: true, check });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register check',
    });
  }
});

/**
 * GET /api/deployment/health/models/:modelId
 * Get model health status
 */
router.get('/health/models/:modelId', (req: Request, res: Response) => {
  try {
    const health = modelHealthCheckService.getModelHealth(req.params.modelId);
    if (health) {
      res.json({ success: true, health });
    } else {
      res.status(404).json({ success: false, error: 'Model health not found' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health',
    });
  }
});

/**
 * GET /api/deployment/health/aggregated
 * Get aggregated health status
 */
router.get('/health/aggregated', (_req: Request, res: Response) => {
  try {
    const health = modelHealthCheckService.getAggregatedHealth();
    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health',
    });
  }
});

/**
 * GET /api/deployment/health/liveness/:modelId
 * Liveness probe for a model
 */
router.get('/health/liveness/:modelId', async (req: Request, res: Response) => {
  try {
    const result = await modelHealthCheckService.livenessProbe(req.params.modelId);
    res.status(result.alive ? 200 : 503).json(result);
  } catch (error) {
    res.status(503).json({
      alive: false,
      error: error instanceof Error ? error.message : 'Liveness check failed',
    });
  }
});

/**
 * GET /api/deployment/health/readiness/:modelId
 * Readiness probe for a model
 */
router.get('/health/readiness/:modelId', async (req: Request, res: Response) => {
  try {
    const result = await modelHealthCheckService.readinessProbe(req.params.modelId);
    res.status(result.ready ? 200 : 503).json(result);
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Readiness check failed',
    });
  }
});

/**
 * POST /api/deployment/health/healing/rules
 * Register a healing rule
 */
router.post('/health/healing/rules', (req: Request, res: Response) => {
  try {
    const rule = modelHealthCheckService.registerHealingRule(req.body);
    res.json({ success: true, rule });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register rule',
    });
  }
});

/**
 * GET /api/deployment/health/healing/events
 * Get healing events
 */
router.get('/health/healing/events', (req: Request, res: Response) => {
  try {
    const targetId = req.query.targetId as string | undefined;
    const events = modelHealthCheckService.getHealingEvents(targetId);
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get events',
    });
  }
});

/**
 * GET /api/deployment/health/stats
 * Get health check statistics
 */
router.get('/health/stats', (_req: Request, res: Response) => {
  try {
    const stats = modelHealthCheckService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

export default router;
