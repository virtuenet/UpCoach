/**
 * Model Management Routes
 * API endpoints for ML model lifecycle management, registry, drift detection, and feature store
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

// Import ML services
import {
  modelRegistry,
  modelManager,
  modelDriftDetector,
  featureStore,
  abTestingService,
  churnPredictor,
  coachPerformancePredictor,
  sessionOutcomePredictor,
  goalCompletionPredictor,
  engagementOptimizer,
  ExperimentStatus,
} from '../services/ml';

const router = Router();

// Apply rate limiting to all routes
router.use(apiLimiter);

// ==================== Model Registry ====================

/**
 * POST /api/models/register
 * Register a new model in the registry
 */
router.post(
  '/register',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [
    body('name').isString().notEmpty(),
    body('modelType').isIn([
      'classification',
      'regression',
      'clustering',
      'recommendation',
      'time_series',
      'nlp',
      'anomaly_detection',
    ]),
    body('framework').isIn([
      'tensorflow',
      'pytorch',
      'scikit-learn',
      'xgboost',
      'lightgbm',
      'custom',
      'rule_based',
    ]),
    body('description').optional().isString(),
    body('tags').optional().isArray(),
    body('owner').isString().notEmpty(),
    body('inputSchema').isObject(),
    body('outputSchema').isObject(),
  ],
  async (req: Request, res: Response) => {
    try {
      const modelId = modelRegistry.register(req.body);

      res.status(201).json({
        success: true,
        data: { modelId },
        message: 'Model registered successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to register model',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/models
 * List all registered models
 */
router.get(
  '/',
  authenticate,
  requireRole(['admin', 'ml_engineer', 'analyst']),
  [
    query('stage').optional().isIn(['development', 'staging', 'production', 'archived']),
    query('modelType').optional().isString(),
    query('framework').optional().isString(),
    query('tags').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const criteria: Record<string, unknown> = {};

      if (req.query.stage) criteria.stage = req.query.stage;
      if (req.query.modelType) criteria.modelType = req.query.modelType;
      if (req.query.framework) criteria.framework = req.query.framework;
      if (req.query.tags) criteria.tags = (req.query.tags as string).split(',');

      const models = Object.keys(criteria).length > 0
        ? modelRegistry.searchModels(criteria)
        : modelRegistry.listModels();

      res.status(200).json({
        success: true,
        data: models,
        count: models.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to list models',
      });
    }
  }
);

/**
 * GET /api/models/:modelId
 * Get model details
 */
router.get(
  '/:modelId',
  authenticate,
  requireRole(['admin', 'ml_engineer', 'analyst']),
  [param('modelId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const model = modelRegistry.getModel(req.params.modelId);

      if (!model) {
        return res.status(404).json({
          success: false,
          error: 'Model not found',
        });
      }

      res.status(200).json({
        success: true,
        data: model,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get model',
      });
    }
  }
);

/**
 * POST /api/models/:modelId/versions
 * Create a new version for a model
 */
router.post(
  '/:modelId/versions',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [
    param('modelId').isString().notEmpty(),
    body('version').isString().notEmpty(),
    body('artifactPath').isString().notEmpty(),
    body('metrics').optional().isObject(),
    body('parameters').optional().isObject(),
    body('trainingDataHash').isString().notEmpty(),
    body('createdBy').isString().notEmpty(),
    body('description').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { modelId } = req.params;
      const versionId = modelRegistry.createVersion(modelId, req.body);

      res.status(201).json({
        success: true,
        data: { versionId },
        message: 'Version created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create version',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/models/:modelId/versions
 * List all versions for a model
 */
router.get(
  '/:modelId/versions',
  authenticate,
  requireRole(['admin', 'ml_engineer', 'analyst']),
  [param('modelId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const versions = modelRegistry.listVersions(req.params.modelId);

      res.status(200).json({
        success: true,
        data: versions,
        count: versions.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to list versions',
      });
    }
  }
);

/**
 * POST /api/models/:modelId/versions/:versionId/transition
 * Transition model version to a new stage
 */
router.post(
  '/:modelId/versions/:versionId/transition',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [
    param('modelId').isString().notEmpty(),
    param('versionId').isString().notEmpty(),
    body('stage').isIn(['development', 'staging', 'production', 'archived']),
  ],
  async (req: Request, res: Response) => {
    try {
      const { modelId, versionId } = req.params;
      const { stage } = req.body;

      modelRegistry.transitionStage(modelId, versionId, stage);

      res.status(200).json({
        success: true,
        message: `Model transitioned to ${stage}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to transition model stage',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ==================== Model Deployment ====================

/**
 * POST /api/models/:modelId/deploy
 * Deploy a model version
 */
router.post(
  '/:modelId/deploy',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [
    param('modelId').isString().notEmpty(),
    body('versionId').isString().notEmpty(),
    body('environment').isIn(['development', 'staging', 'production']),
    body('resources').optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { modelId } = req.params;
      const deployment = await modelManager.deployModel({
        modelId,
        ...req.body,
      });

      res.status(200).json({
        success: true,
        data: deployment,
        message: 'Deployment initiated',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to deploy model',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/models/:modelId/canary
 * Start canary deployment
 */
router.post(
  '/:modelId/canary',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [
    param('modelId').isString().notEmpty(),
    body('canaryVersionId').isString().notEmpty(),
    body('trafficPercentage').isFloat({ min: 1, max: 50 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const { modelId } = req.params;
      const { canaryVersionId, trafficPercentage } = req.body;

      const canary = await modelManager.canaryDeploy(
        modelId,
        canaryVersionId,
        trafficPercentage
      );

      res.status(200).json({
        success: true,
        data: canary,
        message: 'Canary deployment started',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to start canary deployment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/models/:modelId/shadow
 * Start shadow deployment
 */
router.post(
  '/:modelId/shadow',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [
    param('modelId').isString().notEmpty(),
    body('shadowVersionId').isString().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { modelId } = req.params;
      const { shadowVersionId } = req.body;

      const shadow = await modelManager.shadowDeploy(modelId, shadowVersionId);

      res.status(200).json({
        success: true,
        data: shadow,
        message: 'Shadow deployment started',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to start shadow deployment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/models/:modelId/rollback
 * Rollback to a previous version
 */
router.post(
  '/:modelId/rollback',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [
    param('modelId').isString().notEmpty(),
    body('targetVersionId').isString().notEmpty(),
    body('reason').isString().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { modelId } = req.params;
      const { targetVersionId, reason } = req.body;
      const performedBy = (req as unknown as { user: { id: string } }).user?.id || 'system';

      const rollback = await modelManager.rollbackVersion(
        modelId,
        targetVersionId,
        reason,
        performedBy
      );

      res.status(200).json({
        success: true,
        data: rollback,
        message: 'Rollback completed',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to rollback model',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/models/:modelId/health
 * Get model health status
 */
router.get(
  '/:modelId/health',
  authenticate,
  [param('modelId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const health = modelManager.getModelHealth(req.params.modelId);

      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get model health',
      });
    }
  }
);

// ==================== Drift Detection ====================

/**
 * POST /api/models/:modelId/drift/detect
 * Detect data drift
 */
router.post(
  '/:modelId/drift/detect',
  authenticate,
  requireRole(['admin', 'ml_engineer', 'analyst']),
  [
    param('modelId').isString().notEmpty(),
    body('recentData').isArray({ min: 10 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const { modelId } = req.params;
      const { recentData } = req.body;

      const driftReport = modelDriftDetector.detectDataDrift(modelId, recentData);

      res.status(200).json({
        success: true,
        data: driftReport,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to detect drift',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/models/:modelId/drift/concept
 * Detect concept drift
 */
router.post(
  '/:modelId/drift/concept',
  authenticate,
  requireRole(['admin', 'ml_engineer', 'analyst']),
  [
    param('modelId').isString().notEmpty(),
    body('predictions').isArray({ min: 10 }),
    body('actuals').isArray({ min: 10 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const { modelId } = req.params;
      const { predictions, actuals } = req.body;

      const conceptDrift = modelDriftDetector.detectConceptDrift(modelId, predictions, actuals);

      res.status(200).json({
        success: true,
        data: conceptDrift,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to detect concept drift',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/models/:modelId/drift/retrain
 * Get retraining recommendation
 */
router.get(
  '/:modelId/drift/retrain',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [param('modelId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const recommendation = modelDriftDetector.shouldRetrain(req.params.modelId);

      res.status(200).json({
        success: true,
        data: recommendation,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get retraining recommendation',
      });
    }
  }
);

// ==================== Feature Store ====================

/**
 * POST /api/models/features/register
 * Register a new feature
 */
router.post(
  '/features/register',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [
    body('name').isString().notEmpty(),
    body('type').isIn(['numeric', 'categorical', 'boolean', 'timestamp', 'embedding', 'text']),
    body('description').optional().isString(),
    body('entityType').isString().notEmpty(),
    body('tags').optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    try {
      const featureId = featureStore.registerFeature(req.body);

      res.status(201).json({
        success: true,
        data: { featureId },
        message: 'Feature registered successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to register feature',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/models/features
 * List all features
 */
router.get(
  '/features',
  authenticate,
  requireRole(['admin', 'ml_engineer', 'analyst']),
  [
    query('entityType').optional().isString(),
    query('tags').optional().isString(),
    query('status').optional().isIn(['active', 'deprecated', 'experimental']),
  ],
  async (req: Request, res: Response) => {
    try {
      const options: Record<string, unknown> = {};

      if (req.query.entityType) options.entityType = req.query.entityType;
      if (req.query.tags) options.tags = (req.query.tags as string).split(',');
      if (req.query.status) options.status = req.query.status;

      const features = featureStore.listFeatures(Object.keys(options).length > 0 ? options : undefined);

      res.status(200).json({
        success: true,
        data: features,
        count: features.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to list features',
      });
    }
  }
);

/**
 * GET /api/models/features/:entityId
 * Get features for an entity
 */
router.get(
  '/features/:entityId',
  authenticate,
  [
    param('entityId').isString().notEmpty(),
    query('features').isString().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { entityId } = req.params;
      const featureNames = (req.query.features as string).split(',');

      const featureVector = await featureStore.getFeatures(entityId, featureNames);

      res.status(200).json({
        success: true,
        data: featureVector,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get features',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/models/features/groups
 * Create a feature group
 */
router.post(
  '/features/groups',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [
    body('name').isString().notEmpty(),
    body('description').optional().isString(),
    body('features').isArray({ min: 1 }),
    body('entityType').isString().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const groupId = featureStore.createFeatureGroup(req.body);

      res.status(201).json({
        success: true,
        data: { groupId },
        message: 'Feature group created',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create feature group',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ==================== A/B Testing ====================

/**
 * POST /api/models/experiments
 * Create a new experiment
 */
router.post(
  '/experiments',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [
    body('name').isString().notEmpty(),
    body('hypothesis').isString().notEmpty(),
    body('variants').isArray({ min: 2 }),
    body('targetMetrics').isArray({ min: 1 }),
    body('targetAudience').optional().isObject(),
    body('duration').optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    try {
      const experiment = abTestingService.createExperiment(req.body);

      res.status(201).json({
        success: true,
        data: experiment,
        message: 'Experiment created',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create experiment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/models/experiments
 * List all experiments
 */
router.get(
  '/experiments',
  authenticate,
  requireRole(['admin', 'ml_engineer', 'analyst']),
  [query('status').optional().isIn(['draft', 'running', 'paused', 'completed', 'cancelled'])],
  async (req: Request, res: Response) => {
    try {
      const options: { status?: ExperimentStatus } = {};
      if (req.query.status) {
        options.status = req.query.status as ExperimentStatus;
      }

      const experiments = abTestingService.listExperiments(
        Object.keys(options).length > 0 ? options : undefined
      );

      res.status(200).json({
        success: true,
        data: experiments,
        count: experiments.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to list experiments',
      });
    }
  }
);

/**
 * POST /api/models/experiments/:experimentId/start
 * Start an experiment
 */
router.post(
  '/experiments/:experimentId/start',
  authenticate,
  requireRole(['admin', 'ml_engineer']),
  [param('experimentId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      abTestingService.startExperiment(req.params.experimentId);

      res.status(200).json({
        success: true,
        message: 'Experiment started',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to start experiment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/models/experiments/:experimentId/assign
 * Assign user to experiment variant
 */
router.get(
  '/experiments/:experimentId/assign',
  authenticate,
  [param('experimentId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const userId = (req as unknown as { user: { id: string } }).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const variant = abTestingService.assignVariant(userId, req.params.experimentId);

      res.status(200).json({
        success: true,
        data: variant,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to assign variant',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/models/experiments/:experimentId/convert
 * Record a conversion
 */
router.post(
  '/experiments/:experimentId/convert',
  authenticate,
  [
    param('experimentId').isString().notEmpty(),
    body('metricName').isString().notEmpty(),
    body('value').optional().isNumeric(),
  ],
  async (req: Request, res: Response) => {
    try {
      const userId = (req as unknown as { user: { id: string } }).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { metricName, value } = req.body;
      abTestingService.recordConversion(userId, req.params.experimentId, metricName, value);

      res.status(200).json({
        success: true,
        message: 'Conversion recorded',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to record conversion',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/models/experiments/:experimentId/results
 * Get experiment results
 */
router.get(
  '/experiments/:experimentId/results',
  authenticate,
  requireRole(['admin', 'ml_engineer', 'analyst']),
  [param('experimentId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const results = abTestingService.analyzeResults(req.params.experimentId);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to analyze results',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/models/experiments/:experimentId/significance
 * Calculate statistical significance
 */
router.get(
  '/experiments/:experimentId/significance',
  authenticate,
  requireRole(['admin', 'ml_engineer', 'analyst']),
  [
    param('experimentId').isString().notEmpty(),
    query('metric').isString().notEmpty(),
    query('control').isString().notEmpty(),
    query('treatment').isString().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { metric, control, treatment } = req.query as Record<string, string>;

      const significance = abTestingService.calculateSignificance(
        req.params.experimentId,
        metric,
        control,
        treatment
      );

      res.status(200).json({
        success: true,
        data: significance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to calculate significance',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ==================== Predictions ====================

/**
 * POST /api/models/predictions/churn
 * Predict churn probability
 */
router.post(
  '/predictions/churn',
  authenticate,
  [body('userId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const prediction = await churnPredictor.predict(req.body);

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to predict churn',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/models/predictions/coach-match
 * Find best coach matches for a client
 */
router.post(
  '/predictions/coach-match',
  authenticate,
  [
    body('client').isObject(),
    body('coaches').isArray({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 20 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const { client, coaches, limit = 5 } = req.body;

      const matches = coachPerformancePredictor.findBestMatches(coaches, client, limit);

      res.status(200).json({
        success: true,
        data: matches,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to find coach matches',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/models/predictions/session-outcome
 * Predict session outcome
 */
router.post(
  '/predictions/session-outcome',
  authenticate,
  [
    body('sessionId').optional().isString(),
    body('coachId').isString().notEmpty(),
    body('clientId').isString().notEmpty(),
    body('scheduledTime').isISO8601(),
    body('sessionType').isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const prediction = sessionOutcomePredictor.predict(req.body);

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to predict session outcome',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/models/predictions/goal-completion
 * Predict goal completion probability
 */
router.post(
  '/predictions/goal-completion',
  authenticate,
  [
    body('goalId').isString().notEmpty(),
    body('userId').isString().notEmpty(),
    body('type').isString(),
    body('difficulty').isIn(['easy', 'moderate', 'challenging', 'ambitious', 'extreme']),
    body('startDate').isISO8601(),
    body('targetDate').isISO8601(),
    body('currentProgress').isFloat({ min: 0, max: 100 }),
    body('milestones').optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    try {
      const prediction = await goalCompletionPredictor.predict(req.body);

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to predict goal completion',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/models/predictions/engagement
 * Optimize engagement for a user
 */
router.post(
  '/predictions/engagement',
  authenticate,
  [body('userId').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const recommendation = await engagementOptimizer.optimize(req.body);

      res.status(200).json({
        success: true,
        data: recommendation,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to optimize engagement',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/models/predictions/engagement/:userId/send-time
 * Get optimal send time for a user
 */
router.get(
  '/predictions/engagement/:userId/send-time',
  authenticate,
  [
    param('userId').isString().notEmpty(),
    query('type').isString().notEmpty(),
    query('channel').isIn(['push', 'email', 'sms', 'in_app']),
  ],
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { type, channel } = req.query as Record<string, string>;

      const optimization = engagementOptimizer.getSendTimeOptimization(
        userId,
        type as import('../services/ml/predictions/EngagementOptimizer').NotificationType,
        channel as import('../services/ml/predictions/EngagementOptimizer').EngagementChannel
      );

      res.status(200).json({
        success: true,
        data: optimization,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get send time optimization',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ==================== Health Check ====================

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'ml-models',
    timestamp: new Date().toISOString(),
    components: {
      registry: 'healthy',
      manager: 'healthy',
      driftDetector: 'healthy',
      featureStore: 'healthy',
      abTesting: 'healthy',
      predictions: 'healthy',
    },
  });
});

export default router;
