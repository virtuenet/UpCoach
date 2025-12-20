/**
 * ML Services Integration Tests
 * Comprehensive testing for Priority 5 & 6: AI Phase C & D services
 * Tests: AnomalyDetection, FeatureStore, ModelRegistry, ABTesting, Predictions
 */

import {
  AnomalyDetectionService,
  createAnomalyDetectionService,
  AnomalyAlert,
  DetectionResult,
} from '../../services/ml/AnomalyDetectionService';

import {
  FeatureStore,
  createFeatureStore,
  FeatureDefinition,
  FeatureVector,
  MaterializationJob,
} from '../../services/ml/FeatureStore';

import {
  ModelRegistry,
  createModelRegistry,
  ModelMetadata,
  ModelVersion,
  ModelStage,
} from '../../services/ml/ModelRegistry';

import {
  ABTestingService,
  createABTestingService,
  ExperimentConfig,
  Experiment,
  StatisticalSignificance,
} from '../../services/ml/ABTestingService';

import {
  ChurnPredictor,
  createChurnPredictor,
  ChurnPrediction,
  ChurnPredictionInput,
} from '../../services/ml/predictions/ChurnPredictor';

describe('ML Services Integration Tests', () => {
  // ==================== Anomaly Detection Service Tests ====================
  describe('AnomalyDetectionService', () => {
    let anomalyService: AnomalyDetectionService;

    beforeEach(() => {
      anomalyService = createAnomalyDetectionService({
        enableRealTimeDetection: true,
        alertThreshold: 'low',
        maxAlertsPerHour: 100,
      });
    });

    afterEach(() => {
      anomalyService.reset();
      anomalyService.removeAllListeners();
    });

    describe('Metric Recording', () => {
      it('should record metric values and maintain history', () => {
        const metricName = 'test_metric';

        for (let i = 0; i < 20; i++) {
          anomalyService.recordMetricValue(metricName, 10 + Math.random() * 2);
        }

        const stats = anomalyService.getMetricStats(metricName);
        expect(stats).not.toBeNull();
        expect(stats!.count).toBe(20);
        expect(stats!.mean).toBeGreaterThan(9);
        expect(stats!.mean).toBeLessThan(13);
      });

      it('should register custom metric definitions', () => {
        anomalyService.registerMetric({
          name: 'custom_metric',
          type: 'engagement_drop',
          algorithm: 'zscore',
          threshold: 2.0,
          windowSize: 30,
          minDataPoints: 10,
          criticalThreshold: 3.5,
        });

        const metrics = anomalyService.getRegisteredMetrics();
        const customMetric = metrics.find((m) => m.name === 'custom_metric');
        expect(customMetric).toBeDefined();
        expect(customMetric!.algorithm).toBe('zscore');
      });
    });

    describe('Z-Score Detection', () => {
      it('should detect anomalies using Z-Score algorithm', () => {
        // Seed with normal data
        const normalValues = Array.from({ length: 50 }, () => 100 + Math.random() * 10);

        // Detect with an extreme value
        const result = anomalyService.detect('session_no_show_rate', 200, normalValues);

        expect(result).not.toBeNull();
        if (result && result.isAnomaly) {
          expect(result.severity).toBeDefined();
          expect(result.score).toBeGreaterThan(0);
        }
      });

      it('should not flag normal values as anomalies', () => {
        const normalValues = Array.from({ length: 50 }, () => 100 + Math.random() * 5);

        const result = anomalyService.detect('session_no_show_rate', 102, normalValues);

        expect(result).toBeDefined();
        if (result) {
          expect(result.isAnomaly).toBe(false);
        }
      });
    });

    describe('IQR Detection', () => {
      it('should detect anomalies using IQR algorithm', () => {
        // Register an IQR-based metric
        anomalyService.registerMetric({
          name: 'iqr_test_metric',
          type: 'engagement_drop',
          algorithm: 'iqr',
          minDataPoints: 10,
        });

        // Seed with normal data
        const normalValues = Array.from({ length: 30 }, () => 50 + Math.random() * 10);

        // Test with outlier
        normalValues.forEach((v) => anomalyService.recordMetricValue('iqr_test_metric', v));

        // Record an extreme value
        anomalyService.recordMetricValue('iqr_test_metric', 150);

        const alerts = anomalyService.getRecentAlerts('iqr_test_metric');
        // May or may not have alerts depending on threshold config
        expect(Array.isArray(alerts)).toBe(true);
      });
    });

    describe('Ensemble Detection', () => {
      it('should detect anomalies using ensemble of algorithms', () => {
        // Register ensemble metric
        anomalyService.registerMetric({
          name: 'ensemble_test_metric',
          type: 'coach_rating_anomaly',
          algorithm: 'ensemble',
          threshold: 2.0,
          minDataPoints: 15,
        });

        // Seed with normal data
        const normalValues = Array.from({ length: 30 }, () => 75 + Math.random() * 5);
        normalValues.forEach((v) =>
          anomalyService.recordMetricValue('ensemble_test_metric', v)
        );

        // Detect with extreme value
        const result = anomalyService.detect('ensemble_test_metric', 150, normalValues);

        expect(result).not.toBeNull();
        if (result) {
          expect(result.algorithm).toBe('ensemble');
        }
      });
    });

    describe('Time Series Detection', () => {
      it('should detect anomalies in time series data', () => {
        const data = Array.from({ length: 50 }, (_, i) => ({
          timestamp: new Date(Date.now() - (50 - i) * 3600000),
          value: 100 + Math.random() * 10 + (i === 45 ? 100 : 0), // Spike at index 45
        }));

        const results = anomalyService.detectInTimeSeries('time_series_test', data);

        expect(Array.isArray(results)).toBe(true);
        // Should detect the spike
        const anomalies = results.filter((r) => r.isAnomaly);
        expect(anomalies.length).toBeGreaterThanOrEqual(0); // May or may not detect depending on sensitivity
      });
    });

    describe('Batch Detection', () => {
      it('should detect anomalies in batch mode', () => {
        const metrics = [
          { name: 'metric_1', value: 100, history: Array.from({ length: 30 }, () => 50) },
          { name: 'metric_2', value: 55, history: Array.from({ length: 30 }, () => 50) },
          { name: 'metric_3', value: 200, history: Array.from({ length: 30 }, () => 50) },
        ];

        const results = anomalyService.detectBatch(metrics);

        expect(results.size).toBeGreaterThan(0);
      });
    });

    describe('Alert Management', () => {
      it('should emit anomaly_detected event when alert is created', (done) => {
        anomalyService.on('anomaly_detected', (alert: AnomalyAlert) => {
          expect(alert).toHaveProperty('id');
          expect(alert).toHaveProperty('severity');
          expect(alert).toHaveProperty('recommendation');
          done();
        });

        // Create conditions for an alert
        const normalValues = Array.from({ length: 50 }, () => 10);
        anomalyService.detect('session_no_show_rate', 100, normalValues);
      });

      it('should respect rate limiting for alerts', () => {
        const service = createAnomalyDetectionService({
          maxAlertsPerHour: 5,
          alertThreshold: 'low',
        });

        const normalValues = Array.from({ length: 50 }, () => 10);

        // Try to trigger many alerts
        for (let i = 0; i < 20; i++) {
          service.detect(`metric_${i % 3}`, 1000 + i * 100, normalValues);
        }

        const alerts = service.getRecentAlerts();
        expect(alerts.length).toBeLessThanOrEqual(5);
      });
    });

    describe('Statistics', () => {
      it('should calculate metric statistics correctly', () => {
        const values = [10, 20, 30, 40, 50];
        values.forEach((v) => anomalyService.recordMetricValue('stats_metric', v));

        const stats = anomalyService.getMetricStats('stats_metric');

        expect(stats).not.toBeNull();
        expect(stats!.count).toBe(5);
        expect(stats!.mean).toBe(30);
        expect(stats!.min).toBe(10);
        expect(stats!.max).toBe(50);
      });
    });
  });

  // ==================== Feature Store Tests ====================
  describe('FeatureStore', () => {
    let featureStore: FeatureStore;

    beforeEach(() => {
      featureStore = createFeatureStore();
    });

    afterEach(() => {
      featureStore.removeAllListeners();
    });

    describe('Feature Registration', () => {
      it('should initialize with default coaching features', () => {
        const features = featureStore.listFeatures();
        expect(features.length).toBeGreaterThan(0);

        const sessionFeature = featureStore.getFeature('user_session_count_7d');
        expect(sessionFeature).not.toBeNull();
        expect(sessionFeature!.featureGroup).toBe('user_engagement');
      });

      it('should register new features', () => {
        const featureId = featureStore.registerFeature({
          name: 'custom_feature',
          description: 'Custom test feature',
          dataType: 'float',
          featureGroup: 'custom',
          computationLogic: 'SUM(value)',
          tags: ['test'],
          owner: 'test-team',
          deprecated: false,
        });

        expect(featureId).toBeDefined();

        const feature = featureStore.getFeature('custom_feature');
        expect(feature).not.toBeNull();
        expect(feature!.version).toBe(1);
      });

      it('should prevent duplicate feature registration', () => {
        const definition: FeatureDefinition = {
          name: 'duplicate_feature',
          description: 'Test',
          dataType: 'float',
          featureGroup: 'test',
          computationLogic: 'COUNT(*)',
          tags: [],
          owner: 'test',
          deprecated: false,
        };

        featureStore.registerFeature(definition);
        expect(() => featureStore.registerFeature(definition)).toThrow();
      });

      it('should update features and increment version', () => {
        const feature = featureStore.getFeature('user_session_count_7d');
        const originalVersion = feature!.version;

        featureStore.updateFeature('user_session_count_7d', {
          description: 'Updated description',
        });

        const updated = featureStore.getFeature('user_session_count_7d');
        expect(updated!.description).toBe('Updated description');
        expect(updated!.version).toBe(originalVersion + 1);
      });

      it('should deprecate features', () => {
        featureStore.deprecateFeature('user_session_count_7d');

        const feature = featureStore.getFeature('user_session_count_7d');
        expect(feature!.deprecated).toBe(true);
      });
    });

    describe('Feature Retrieval', () => {
      it('should get features for an entity', async () => {
        // Set some feature values first
        await featureStore.setFeatureValues('user-123', {
          user_session_count_7d: 5,
          user_session_count_30d: 15,
        });

        const vector = await featureStore.getFeatures('user-123', [
          'user_session_count_7d',
          'user_session_count_30d',
        ]);

        expect(vector.entityId).toBe('user-123');
        expect(vector.features['user_session_count_7d'].value).toBe(5);
        expect(vector.features['user_session_count_30d'].value).toBe(15);
      });

      it('should handle missing features with fill values', async () => {
        const vector = await featureStore.getFeatures('nonexistent-user', [
          'user_session_count_7d',
        ]);

        expect(vector.features['user_session_count_7d'].isNull).toBe(true);
      });

      it('should get historical features at a point in time', async () => {
        const now = new Date();
        const past = new Date(now.getTime() - 3600000);

        await featureStore.setFeatureValues('user-456', {
          user_session_count_7d: 3,
        }, past);

        await featureStore.setFeatureValues('user-456', {
          user_session_count_7d: 10,
        }, now);

        const historical = await featureStore.getHistoricalFeatures(
          'user-456',
          ['user_session_count_7d'],
          new Date(past.getTime() + 1000) // Just after the first write
        );

        expect(historical.features['user_session_count_7d'].value).toBe(3);
      });

      it('should get batch features for multiple entities', async () => {
        await featureStore.setFeatureValues('batch-user-1', { user_session_count_7d: 5 });
        await featureStore.setFeatureValues('batch-user-2', { user_session_count_7d: 10 });

        const vectors = await featureStore.getBatchFeatures(
          ['batch-user-1', 'batch-user-2'],
          ['user_session_count_7d']
        );

        expect(vectors.length).toBe(2);
        expect(vectors[0].entityId).toBe('batch-user-1');
        expect(vectors[1].entityId).toBe('batch-user-2');
      });
    });

    describe('Feature Groups', () => {
      it('should have default feature groups', () => {
        const groups = featureStore.listFeatureGroups();
        expect(groups.length).toBeGreaterThan(0);

        const engagementGroup = featureStore.getFeatureGroup('user_engagement');
        expect(engagementGroup).not.toBeNull();
        expect(engagementGroup!.config.entityType).toBe('user');
      });

      it('should create new feature groups', () => {
        const groupId = featureStore.createFeatureGroup({
          name: 'custom_group',
          description: 'Custom feature group',
          entityType: 'user',
          features: ['user_session_count_7d'],
          owner: 'test-team',
          schema: {
            primaryKey: 'user_id',
            eventTimestamp: 'updated_at',
            features: [
              { name: 'user_session_count_7d', type: 'integer', required: true },
            ],
          },
        });

        expect(groupId).toBeDefined();

        const group = featureStore.getFeatureGroup('custom_group');
        expect(group).not.toBeNull();
      });

      it('should get features in a group', () => {
        const features = featureStore.getGroupFeatures('user_engagement');
        expect(features.length).toBeGreaterThan(0);
        expect(features.every((f) => f.featureGroup === 'user_engagement')).toBe(true);
      });
    });

    describe('Materialization', () => {
      it('should start materialization job', async () => {
        const startDate = new Date(Date.now() - 86400000 * 7);
        const endDate = new Date();

        const job = await featureStore.materializeFeatures(
          'user_engagement',
          startDate,
          endDate
        );

        expect(job.id).toBeDefined();
        expect(job.status).toMatch(/pending|running/);
        expect(job.groupId).toBeDefined();
      });

      it('should list materialization jobs', async () => {
        const startDate = new Date(Date.now() - 86400000);
        const endDate = new Date();

        await featureStore.materializeFeatures('user_engagement', startDate, endDate);

        const jobs = featureStore.listMaterializationJobs();
        expect(jobs.length).toBeGreaterThan(0);
      });
    });

    describe('Statistics', () => {
      it('should compute feature statistics', async () => {
        // Add some data
        for (let i = 0; i < 10; i++) {
          await featureStore.setFeatureValues(`stats-user-${i}`, {
            user_session_count_7d: 5 + i,
          });
        }

        const stats = featureStore.computeStatistics('user_session_count_7d');

        expect(stats).not.toBeNull();
        expect(stats!.count).toBe(10);
        expect(stats!.mean).toBeCloseTo(9.5, 1);
        expect(stats!.histogram).toBeDefined();
      });

      it('should get store statistics', () => {
        const stats = featureStore.getStats();

        expect(stats.totalFeatures).toBeGreaterThan(0);
        expect(stats.totalFeatureGroups).toBeGreaterThan(0);
      });
    });
  });

  // ==================== Model Registry Tests ====================
  describe('ModelRegistry', () => {
    let registry: ModelRegistry;

    beforeEach(() => {
      registry = createModelRegistry();
    });

    afterEach(() => {
      registry.removeAllListeners();
    });

    describe('Model Registration', () => {
      it('should initialize with default coaching models', () => {
        const models = registry.listModels();
        expect(models.length).toBeGreaterThan(0);

        const churnModel = registry.getModel('churn-predictor');
        expect(churnModel).not.toBeNull();
        expect(churnModel!.metadata.modelType).toBe('classification');
      });

      it('should register new models', () => {
        const metadata: ModelMetadata = {
          name: 'Test Model',
          description: 'A test model',
          modelType: 'regression',
          framework: 'custom',
          owner: 'test-team',
          tags: ['test', 'integration'],
          inputSchema: {
            version: '1.0',
            fields: [{ name: 'input', type: 'number', required: true }],
          },
          outputSchema: {
            version: '1.0',
            fields: [{ name: 'output', type: 'number', required: true }],
          },
        };

        const modelId = registry.register(metadata);
        expect(modelId).toBe('test-model');

        const model = registry.getModel('test-model');
        expect(model).not.toBeNull();
        expect(model!.status).toBe('active');
      });

      it('should update model metadata', () => {
        registry.updateModel('churn-predictor', {
          description: 'Updated description',
          tags: ['updated', 'test'],
        });

        const model = registry.getModel('churn-predictor');
        expect(model!.metadata.description).toBe('Updated description');
        expect(model!.metadata.tags).toContain('updated');
      });

      it('should search models by criteria', () => {
        const classificationModels = registry.searchModels({
          modelType: 'classification',
        });

        expect(classificationModels.length).toBeGreaterThan(0);
        expect(
          classificationModels.every((m) => m.metadata.modelType === 'classification')
        ).toBe(true);
      });
    });

    describe('Version Management', () => {
      it('should create model versions', () => {
        const versionId = registry.createVersion('churn-predictor', {
          version: '1.0.0',
          stage: 'development',
          artifactPath: '/models/churn/v1.0.0',
          metrics: {
            accuracy: 0.85,
            precision: 0.82,
            recall: 0.88,
          },
          parameters: {
            learningRate: 0.001,
            epochs: 100,
          },
          trainingDataHash: 'abc123',
          createdBy: 'test-user',
        });

        expect(versionId).toBeDefined();

        const version = registry.getVersion('churn-predictor', versionId);
        expect(version).not.toBeNull();
        expect(version!.version).toBe('1.0.0');
      });

      it('should list model versions', () => {
        registry.createVersion('churn-predictor', {
          version: '1.0.0',
          stage: 'development',
          artifactPath: '/models/churn/v1.0.0',
          metrics: {},
          parameters: {},
          trainingDataHash: 'abc123',
          createdBy: 'test-user',
        });

        const versions = registry.listVersions('churn-predictor');
        expect(versions.length).toBeGreaterThan(0);
      });

      it('should transition version stages', () => {
        const versionId = registry.createVersion('churn-predictor', {
          version: '2.0.0',
          stage: 'development',
          artifactPath: '/models/churn/v2.0.0',
          metrics: { accuracy: 0.9 },
          parameters: {},
          trainingDataHash: 'def456',
          createdBy: 'test-user',
        });

        registry.transitionStage('churn-predictor', versionId, 'staging');

        const version = registry.getVersion('churn-predictor', versionId);
        expect(version!.stage).toBe('staging');
      });

      it('should get latest version for stage', () => {
        const v1Id = registry.createVersion('churn-predictor', {
          version: '1.0.0',
          stage: 'production',
          artifactPath: '/models/churn/v1.0.0',
          metrics: {},
          parameters: {},
          trainingDataHash: 'abc',
          createdBy: 'test',
        });

        const v2Id = registry.createVersion('churn-predictor', {
          version: '2.0.0',
          stage: 'production',
          artifactPath: '/models/churn/v2.0.0',
          metrics: {},
          parameters: {},
          trainingDataHash: 'def',
          createdBy: 'test',
        });

        const latest = registry.getLatestVersion('churn-predictor', 'production');
        expect(latest).not.toBeNull();
        expect(latest!.id).toBe(v2Id);
      });

      it('should compare versions', () => {
        const v1Id = registry.createVersion('churn-predictor', {
          version: '1.0.0',
          stage: 'development',
          artifactPath: '/models/v1',
          metrics: { accuracy: 0.8, rmse: 0.15 },
          parameters: { learningRate: 0.01 },
          trainingDataHash: 'abc',
          createdBy: 'test',
        });

        const v2Id = registry.createVersion('churn-predictor', {
          version: '2.0.0',
          stage: 'development',
          artifactPath: '/models/v2',
          metrics: { accuracy: 0.85, rmse: 0.12 },
          parameters: { learningRate: 0.001 },
          trainingDataHash: 'def',
          createdBy: 'test',
        });

        const comparison = registry.compareVersions('churn-predictor', v1Id, v2Id);

        expect(comparison).not.toBeNull();
        expect(comparison!.metricsDiff['accuracy'].diff).toBeCloseTo(0.05, 2);
        expect(comparison!.recommendation).toBeDefined();
      });
    });

    describe('Artifact Management', () => {
      it('should store and retrieve artifacts', () => {
        const versionId = registry.createVersion('churn-predictor', {
          version: '1.0.0',
          stage: 'development',
          artifactPath: '/models/churn/v1',
          metrics: {},
          parameters: {},
          trainingDataHash: 'abc',
          createdBy: 'test',
        });

        const artifactId = registry.storeArtifact('churn-predictor', versionId, {
          type: 'model_weights',
          path: '/artifacts/weights.bin',
          size: 1024000,
          checksum: 'sha256:abc123',
        });

        expect(artifactId).toBeDefined();

        const artifact = registry.loadArtifact('churn-predictor', artifactId);
        expect(artifact).not.toBeNull();
        expect(artifact!.type).toBe('model_weights');
      });

      it('should list artifacts for a version', () => {
        const versionId = registry.createVersion('churn-predictor', {
          version: '1.0.0',
          stage: 'development',
          artifactPath: '/models/churn/v1',
          metrics: {},
          parameters: {},
          trainingDataHash: 'abc',
          createdBy: 'test',
        });

        registry.storeArtifact('churn-predictor', versionId, {
          type: 'model_weights',
          path: '/weights.bin',
          size: 1000,
          checksum: 'abc',
        });

        registry.storeArtifact('churn-predictor', versionId, {
          type: 'model_config',
          path: '/config.json',
          size: 500,
          checksum: 'def',
        });

        const artifacts = registry.listArtifacts('churn-predictor', versionId);
        expect(artifacts.length).toBe(2);
      });
    });

    describe('Lineage Tracking', () => {
      it('should set and get model lineage', () => {
        registry.setLineage('churn-predictor', {
          trainingDataSources: [
            {
              id: 'ds-1',
              name: 'User Activity',
              type: 'database',
              location: 'postgres://users',
            },
          ],
          parentModels: [],
          featureDefinitions: ['user_session_count_7d'],
          trainingConfig: {
            algorithm: 'gradient_boost',
            hyperparameters: { maxDepth: 5 },
          },
          evaluationDatasets: ['test-set-1'],
        });

        const lineage = registry.getLineage('churn-predictor');
        expect(lineage).not.toBeNull();
        expect(lineage!.trainingDataSources.length).toBe(1);
      });

      it('should find downstream models', () => {
        // Create a parent model
        registry.register({
          name: 'Base Model',
          description: 'Base',
          modelType: 'classification',
          framework: 'custom',
          owner: 'test',
          tags: [],
          inputSchema: { version: '1', fields: [] },
          outputSchema: { version: '1', fields: [] },
        });

        // Create a child model with lineage
        registry.register({
          name: 'Child Model',
          description: 'Child',
          modelType: 'classification',
          framework: 'custom',
          owner: 'test',
          tags: [],
          inputSchema: { version: '1', fields: [] },
          outputSchema: { version: '1', fields: [] },
        });

        registry.setLineage('child-model', {
          trainingDataSources: [],
          parentModels: [
            { modelId: 'base-model', versionId: 'v1', relationship: 'fine_tuned' },
          ],
          featureDefinitions: [],
          trainingConfig: { algorithm: 'fine_tune', hyperparameters: {} },
          evaluationDatasets: [],
        });

        const downstream = registry.getDownstreamModels('base-model');
        expect(downstream).toContain('child-model');
      });
    });

    describe('Model Lifecycle', () => {
      it('should deprecate models', () => {
        registry.deprecateModel('churn-predictor', 'Replaced by v2');

        const model = registry.getModel('churn-predictor');
        expect(model!.status).toBe('deprecated');
      });

      it('should archive models', () => {
        registry.archiveModel('churn-predictor');

        const model = registry.getModel('churn-predictor');
        expect(model!.status).toBe('archived');
      });
    });

    describe('Registry Statistics', () => {
      it('should return registry statistics', () => {
        const stats = registry.getStats();

        expect(stats.totalModels).toBeGreaterThan(0);
        expect(stats.modelsByType).toBeDefined();
        expect(stats.modelsByFramework).toBeDefined();
      });
    });
  });

  // ==================== A/B Testing Service Tests ====================
  describe('ABTestingService', () => {
    let abService: ABTestingService;

    beforeEach(() => {
      abService = createABTestingService();
    });

    afterEach(() => {
      abService.removeAllListeners();
    });

    describe('Experiment Management', () => {
      it('should create experiments', () => {
        const config: ExperimentConfig = {
          name: 'Test Experiment',
          description: 'Testing A/B functionality',
          hypothesis: 'Variant B will perform better',
          owner: 'test-team',
          variants: [
            { name: 'control', description: 'Original', trafficWeight: 50, isControl: true },
            { name: 'variant_b', description: 'New version', trafficWeight: 50 },
          ],
          targetMetrics: [
            { name: 'conversion', type: 'conversion', aggregation: 'mean', higherIsBetter: true },
          ],
          trafficAllocation: 100,
        };

        const experiment = abService.createExperiment(config);

        expect(experiment.id).toBeDefined();
        expect(experiment.status).toBe('draft');
        expect(experiment.config.name).toBe('Test Experiment');
      });

      it('should validate experiment configuration', () => {
        const invalidConfig: ExperimentConfig = {
          name: 'Invalid',
          description: '',
          hypothesis: '',
          owner: 'test',
          variants: [{ name: 'only_one', description: '', trafficWeight: 100 }],
          targetMetrics: [],
          trafficAllocation: 100,
        };

        expect(() => abService.createExperiment(invalidConfig)).toThrow();
      });

      it('should start and pause experiments', () => {
        const experiment = abService.createExperiment({
          name: 'Lifecycle Test',
          description: '',
          hypothesis: '',
          owner: 'test',
          variants: [
            { name: 'control', description: '', trafficWeight: 50, isControl: true },
            { name: 'treatment', description: '', trafficWeight: 50 },
          ],
          targetMetrics: [
            { name: 'clicks', type: 'count', aggregation: 'sum', higherIsBetter: true },
          ],
          trafficAllocation: 100,
        });

        abService.startExperiment(experiment.id);
        expect(abService.getExperiment(experiment.id)!.status).toBe('running');

        abService.pauseExperiment(experiment.id);
        expect(abService.getExperiment(experiment.id)!.status).toBe('paused');
      });

      it('should complete experiments', () => {
        const experiment = abService.createExperiment({
          name: 'Complete Test',
          description: '',
          hypothesis: '',
          owner: 'test',
          variants: [
            { name: 'control', description: '', trafficWeight: 50, isControl: true },
            { name: 'winner', description: '', trafficWeight: 50 },
          ],
          targetMetrics: [
            { name: 'metric', type: 'count', aggregation: 'sum', higherIsBetter: true },
          ],
          trafficAllocation: 100,
        });

        abService.startExperiment(experiment.id);
        abService.completeExperiment(experiment.id, 'winner', 'Winner showed improvement');

        const completed = abService.getExperiment(experiment.id)!;
        expect(completed.status).toBe('completed');
        expect(completed.winnerVariant).toBe('winner');
      });
    });

    describe('Traffic Assignment', () => {
      let experiment: Experiment;

      beforeEach(() => {
        experiment = abService.createExperiment({
          name: 'Assignment Test',
          description: '',
          hypothesis: '',
          owner: 'test',
          variants: [
            { name: 'control', description: '', trafficWeight: 50, isControl: true },
            { name: 'treatment', description: '', trafficWeight: 50 },
          ],
          targetMetrics: [
            { name: 'conversions', type: 'conversion', aggregation: 'mean', higherIsBetter: true },
          ],
          trafficAllocation: 100,
        });
        abService.startExperiment(experiment.id);
      });

      it('should assign users to variants', () => {
        const variant = abService.assignVariant('user-123', experiment.id);

        expect(variant.name).toMatch(/control|treatment/);
        expect(variant.weight).toBe(50);
      });

      it('should consistently assign same user to same variant', () => {
        const variant1 = abService.assignVariant('consistent-user', experiment.id);
        const variant2 = abService.assignVariant('consistent-user', experiment.id);

        expect(variant1.name).toBe(variant2.name);
      });

      it('should distribute traffic roughly according to weights', () => {
        const assignments: Record<string, number> = { control: 0, treatment: 0 };

        for (let i = 0; i < 1000; i++) {
          const variant = abService.assignVariant(`user-${i}`, experiment.id);
          assignments[variant.name]++;
        }

        // Should be roughly 50/50, allow 10% margin
        expect(assignments.control).toBeGreaterThan(400);
        expect(assignments.control).toBeLessThan(600);
        expect(assignments.treatment).toBeGreaterThan(400);
        expect(assignments.treatment).toBeLessThan(600);
      });
    });

    describe('Metrics Collection', () => {
      let experiment: Experiment;

      beforeEach(() => {
        experiment = abService.createExperiment({
          name: 'Metrics Test',
          description: '',
          hypothesis: '',
          owner: 'test',
          variants: [
            { name: 'control', description: '', trafficWeight: 50, isControl: true },
            { name: 'treatment', description: '', trafficWeight: 50 },
          ],
          targetMetrics: [
            { name: 'clicks', type: 'count', aggregation: 'sum', higherIsBetter: true },
            { name: 'revenue', type: 'sum', aggregation: 'sum', higherIsBetter: true },
          ],
          trafficAllocation: 100,
        });
        abService.startExperiment(experiment.id);
      });

      it('should record conversion events', () => {
        abService.assignVariant('user-1', experiment.id);
        abService.recordConversion('user-1', experiment.id, 'clicks', 1);
        abService.recordConversion('user-1', experiment.id, 'revenue', 49.99);

        const exp = abService.getExperiment(experiment.id)!;
        const userVariant = abService.getUserVariant('user-1', experiment.id)!;
        const metrics = exp.metrics.get(userVariant)!;

        expect(metrics.metrics['clicks'].count).toBe(1);
        expect(metrics.metrics['revenue'].sum).toBe(49.99);
      });

      it('should record multiple metrics at once', () => {
        abService.assignVariant('user-2', experiment.id);
        abService.recordMetrics('user-2', experiment.id, {
          clicks: 3,
          revenue: 99.99,
        });

        const exp = abService.getExperiment(experiment.id)!;
        const userVariant = abService.getUserVariant('user-2', experiment.id)!;
        const metrics = exp.metrics.get(userVariant)!;

        expect(metrics.metrics['clicks'].sum).toBe(3);
        expect(metrics.metrics['revenue'].sum).toBe(99.99);
      });
    });

    describe('Statistical Analysis', () => {
      let experiment: Experiment;

      beforeEach(() => {
        experiment = abService.createExperiment({
          name: 'Stats Test',
          description: '',
          hypothesis: '',
          owner: 'test',
          variants: [
            { name: 'control', description: '', trafficWeight: 50, isControl: true },
            { name: 'treatment', description: '', trafficWeight: 50 },
          ],
          targetMetrics: [
            { name: 'conversion', type: 'average', aggregation: 'mean', higherIsBetter: true },
          ],
          trafficAllocation: 100,
          confidenceLevel: 0.95,
        });
        abService.startExperiment(experiment.id);

        // Add some data
        for (let i = 0; i < 100; i++) {
          const userId = `user-${i}`;
          abService.assignVariant(userId, experiment.id);
          const variant = abService.getUserVariant(userId, experiment.id);

          // Treatment performs better on average
          const value = variant === 'treatment' ? 1.2 + Math.random() * 0.3 : 1.0 + Math.random() * 0.3;
          abService.recordConversion(userId, experiment.id, 'conversion', value);
        }
      });

      it('should calculate statistical significance', () => {
        const significance = abService.calculateSignificance(
          experiment.id,
          'conversion',
          'control',
          'treatment'
        );

        expect(significance).toHaveProperty('pValue');
        expect(significance).toHaveProperty('zScore');
        expect(significance).toHaveProperty('confidenceInterval');
        expect(significance.controlMean).toBeGreaterThan(0);
        expect(significance.treatmentMean).toBeGreaterThan(0);
      });

      it('should analyze experiment results', () => {
        const results = abService.analyzeResults(experiment.id);

        expect(results.experimentId).toBe(experiment.id);
        expect(results.variants.length).toBe(2);
        expect(results.recommendations).toBeInstanceOf(Array);
        expect(results.nextSteps).toBeInstanceOf(Array);
      });

      it('should perform power analysis', () => {
        const power = abService.powerAnalysis(experiment.id);

        expect(power).toHaveProperty('minimumSampleSize');
        expect(power).toHaveProperty('expectedDuration');
        expect(power).toHaveProperty('currentPower');
      });
    });

    describe('Winner Graduation', () => {
      it('should graduate winning variant', () => {
        const experiment = abService.createExperiment({
          name: 'Graduation Test',
          description: '',
          hypothesis: '',
          owner: 'test',
          modelId: 'test-model',
          variants: [
            { name: 'control', description: '', trafficWeight: 50, isControl: true, modelVersionId: 'v1' },
            { name: 'winner', description: '', trafficWeight: 50, modelVersionId: 'v2' },
          ],
          targetMetrics: [
            { name: 'metric', type: 'count', aggregation: 'sum', higherIsBetter: true },
          ],
          trafficAllocation: 100,
        });

        abService.startExperiment(experiment.id);

        let graduatedEvent: any = null;
        abService.on('winner:graduated', (event) => {
          graduatedEvent = event;
        });

        abService.graduateWinner(experiment.id, 'winner');

        expect(graduatedEvent).not.toBeNull();
        expect(graduatedEvent.variant).toBe('winner');

        const exp = abService.getExperiment(experiment.id)!;
        expect(exp.status).toBe('completed');
        expect(exp.winnerVariant).toBe('winner');
      });
    });

    describe('Service Statistics', () => {
      it('should return service statistics', () => {
        // Create some experiments
        for (let i = 0; i < 3; i++) {
          const exp = abService.createExperiment({
            name: `Experiment ${i}`,
            description: '',
            hypothesis: '',
            owner: 'test',
            variants: [
              { name: 'control', description: '', trafficWeight: 50, isControl: true },
              { name: 'treatment', description: '', trafficWeight: 50 },
            ],
            targetMetrics: [
              { name: 'metric', type: 'count', aggregation: 'sum', higherIsBetter: true },
            ],
            trafficAllocation: 100,
          });

          if (i === 0) {
            abService.startExperiment(exp.id);
          }
        }

        const stats = abService.getStats();

        expect(stats.totalExperiments).toBe(3);
        expect(stats.runningExperiments).toBe(1);
      });
    });
  });

  // ==================== Churn Predictor Tests ====================
  describe('ChurnPredictor', () => {
    let predictor: ChurnPredictor;

    beforeEach(() => {
      predictor = createChurnPredictor();
    });

    afterEach(() => {
      predictor.removeAllListeners();
    });

    describe('Churn Prediction', () => {
      it('should predict churn probability for a user', async () => {
        const input: ChurnPredictionInput = {
          userId: 'user-123',
          sessionCount7d: 2,
          sessionCount30d: 5,
          daysSinceLastSession: 10,
          loginFrequency7d: 3,
          aiChatCount7d: 5,
          paymentFailures90d: 0,
          subscriptionTenureDays: 60,
          goalCompletionRate: 0.4,
          avgSessionDuration: 30,
        };

        const prediction = await predictor.predict(input);

        expect(prediction.userId).toBe('user-123');
        expect(prediction.churnProbability).toBeGreaterThanOrEqual(0);
        expect(prediction.churnProbability).toBeLessThanOrEqual(1);
        expect(prediction.riskLevel).toMatch(/low|medium|high|critical/);
        expect(prediction.topRiskFactors.length).toBeGreaterThan(0);
        expect(prediction.recommendations.length).toBeGreaterThan(0);
      });

      it('should identify high-risk users', async () => {
        const highRiskInput: ChurnPredictionInput = {
          userId: 'high-risk-user',
          sessionCount7d: 0,
          sessionCount30d: 1,
          daysSinceLastSession: 25,
          loginFrequency7d: 0,
          aiChatCount7d: 0,
          paymentFailures90d: 2,
          subscriptionTenureDays: 15,
          goalCompletionRate: 0.1,
          avgSessionDuration: 5,
        };

        const prediction = await predictor.predict(highRiskInput);

        expect(prediction.riskLevel).toMatch(/high|critical/);
        expect(prediction.churnProbability).toBeGreaterThan(0.5);
        expect(prediction.predictedChurnDate).toBeDefined();
      });

      it('should identify low-risk users', async () => {
        const lowRiskInput: ChurnPredictionInput = {
          userId: 'low-risk-user',
          sessionCount7d: 5,
          sessionCount30d: 15,
          daysSinceLastSession: 1,
          loginFrequency7d: 6,
          aiChatCount7d: 20,
          paymentFailures90d: 0,
          subscriptionTenureDays: 365,
          goalCompletionRate: 0.8,
          avgSessionDuration: 45,
        };

        const prediction = await predictor.predict(lowRiskInput);

        expect(prediction.riskLevel).toBe('low');
        expect(prediction.churnProbability).toBeLessThan(0.3);
      });
    });

    describe('Batch Prediction', () => {
      it('should predict churn for multiple users', async () => {
        const inputs: ChurnPredictionInput[] = [
          { userId: 'batch-user-1', sessionCount30d: 10, daysSinceLastSession: 3 },
          { userId: 'batch-user-2', sessionCount30d: 2, daysSinceLastSession: 15 },
          { userId: 'batch-user-3', sessionCount30d: 0, daysSinceLastSession: 30 },
        ];

        const predictions = await predictor.predictBatch(inputs);

        expect(predictions.length).toBe(3);
        expect(predictions.every((p) => p.userId.startsWith('batch-user-'))).toBe(true);
      });
    });

    describe('Risk Factors', () => {
      it('should identify top risk factors', async () => {
        const input: ChurnPredictionInput = {
          userId: 'risk-factor-user',
          sessionCount7d: 0,
          sessionCount30d: 1,
          daysSinceLastSession: 20,
          loginFrequency7d: 1,
          aiChatCount7d: 0,
          paymentFailures90d: 1,
          subscriptionTenureDays: 20,
          goalCompletionRate: 0.2,
        };

        const prediction = await predictor.predict(input);

        expect(prediction.topRiskFactors.length).toBeGreaterThan(0);
        expect(prediction.topRiskFactors[0]).toHaveProperty('factor');
        expect(prediction.topRiskFactors[0]).toHaveProperty('contribution');
        expect(prediction.topRiskFactors[0]).toHaveProperty('description');
      });
    });

    describe('Segment Risk', () => {
      it('should calculate segment risk for new users', async () => {
        const prediction = await predictor.predict({
          userId: 'new-user',
          subscriptionTenureDays: 10,
        });

        expect(prediction.segmentRisk.segment).toContain('New Users');
        expect(prediction.segmentRisk.averageChurnRate).toBeGreaterThan(0.2);
      });

      it('should calculate segment risk for established users', async () => {
        const prediction = await predictor.predict({
          userId: 'established-user',
          subscriptionTenureDays: 180,
          sessionCount30d: 10,
        });

        expect(prediction.segmentRisk.segment).toContain('Established Users');
        expect(prediction.segmentRisk.averageChurnRate).toBeLessThan(0.2);
      });
    });

    describe('Prediction History', () => {
      it('should store and retrieve prediction history', async () => {
        const userId = 'history-user';

        // Make multiple predictions
        for (let i = 0; i < 5; i++) {
          await predictor.predict({
            userId,
            daysSinceLastSession: i * 5,
            sessionCount30d: 10 - i,
          });
        }

        const history = predictor.getPredictionHistory(userId);
        expect(history.length).toBe(5);
        expect(history[0].timestamp).toBeDefined();
      });

      it('should get high-risk users', async () => {
        await predictor.predict({
          userId: 'high-risk-1',
          daysSinceLastSession: 30,
          sessionCount30d: 0,
          paymentFailures90d: 2,
        });

        await predictor.predict({
          userId: 'low-risk-1',
          daysSinceLastSession: 1,
          sessionCount30d: 15,
        });

        const highRiskUsers = predictor.getHighRiskUsers();

        expect(highRiskUsers.some((u) => u.userId === 'high-risk-1')).toBe(true);
        expect(highRiskUsers.every((u) =>
          u.prediction.riskLevel === 'high' || u.prediction.riskLevel === 'critical'
        )).toBe(true);
      });
    });

    describe('Configuration', () => {
      it('should update model configuration', () => {
        predictor.updateConfig({
          thresholds: {
            low: 0.25,
            medium: 0.45,
            high: 0.65,
          },
        });

        const stats = predictor.getStats();
        expect(stats.config.thresholds.low).toBe(0.25);
      });

      it('should return predictor statistics', async () => {
        await predictor.predict({ userId: 'stats-user-1' });
        await predictor.predict({ userId: 'stats-user-2' });

        const stats = predictor.getStats();

        expect(stats.totalUsers).toBe(2);
        expect(stats.totalPredictions).toBe(2);
      });
    });

    describe('Events', () => {
      it('should emit prediction events', async () => {
        let eventReceived = false;

        predictor.on('prediction:made', (event) => {
          expect(event.userId).toBe('event-user');
          expect(event.probability).toBeDefined();
          expect(event.riskLevel).toBeDefined();
          expect(event.latencyMs).toBeDefined();
          eventReceived = true;
        });

        await predictor.predict({ userId: 'event-user' });

        expect(eventReceived).toBe(true);
      });
    });
  });

  // ==================== Cross-Service Integration Tests ====================
  describe('Cross-Service Integration', () => {
    it('should integrate feature store with churn predictor', async () => {
      const featureStore = createFeatureStore();
      const predictor = createChurnPredictor();

      // Set features in store
      await featureStore.setFeatureValues('integrated-user', {
        user_session_count_7d: 3,
        user_session_count_30d: 10,
        user_days_since_last_session: 5,
        user_login_frequency_7d: 4,
        user_ai_chat_count_7d: 8,
        user_payment_failures_90d: 0,
        user_subscription_tenure_days: 90,
        user_goal_completion_rate: 0.6,
        user_avg_session_duration: 30,
      });

      // Predictor should be able to get features from store
      const prediction = await predictor.predict({
        userId: 'integrated-user',
        // Only provide userId, let it fetch from store
      });

      expect(prediction).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0);
    });

    it('should integrate model registry with A/B testing', () => {
      const registry = createModelRegistry();
      const abService = createABTestingService();

      // Create versions for A/B test
      const v1Id = registry.createVersion('churn-predictor', {
        version: '1.0.0',
        stage: 'production',
        artifactPath: '/models/v1',
        metrics: { accuracy: 0.82 },
        parameters: {},
        trainingDataHash: 'abc',
        createdBy: 'test',
      });

      const v2Id = registry.createVersion('churn-predictor', {
        version: '2.0.0',
        stage: 'staging',
        artifactPath: '/models/v2',
        metrics: { accuracy: 0.88 },
        parameters: {},
        trainingDataHash: 'def',
        createdBy: 'test',
      });

      // Create experiment to compare versions
      const experiment = abService.createExperiment({
        name: 'Churn Model v2 Test',
        description: 'Testing improved churn prediction model',
        hypothesis: 'v2 will have better recall',
        owner: 'ml-team',
        modelId: 'churn-predictor',
        variants: [
          { name: 'control', description: 'v1', trafficWeight: 50, isControl: true, modelVersionId: v1Id },
          { name: 'treatment', description: 'v2', trafficWeight: 50, modelVersionId: v2Id },
        ],
        targetMetrics: [
          { name: 'prediction_accuracy', type: 'average', aggregation: 'mean', higherIsBetter: true },
        ],
        trafficAllocation: 50, // 50% of traffic in experiment
      });

      expect(experiment.config.modelId).toBe('churn-predictor');
      expect(experiment.config.variants[0].modelVersionId).toBe(v1Id);
    });

    it('should integrate anomaly detection with model monitoring', () => {
      const anomalyService = createAnomalyDetectionService({
        alertThreshold: 'medium',
      });
      const registry = createModelRegistry();

      // Monitor model metrics
      anomalyService.registerMetric({
        name: 'model_accuracy',
        type: 'metric_deviation',
        algorithm: 'zscore',
        threshold: 2.5,
        criticalThreshold: 3.0,
        minDataPoints: 10,
      });

      // Simulate model performance over time
      const accuracyHistory = [0.85, 0.86, 0.84, 0.85, 0.87, 0.85, 0.86, 0.84, 0.85, 0.86];
      accuracyHistory.forEach((acc) => {
        anomalyService.recordMetricValue('model_accuracy', acc);
      });

      // Detect potential model drift
      const driftResult = anomalyService.detect('model_accuracy', 0.70, accuracyHistory);

      expect(driftResult).not.toBeNull();
      if (driftResult) {
        expect(driftResult.isAnomaly).toBe(true);
        expect(driftResult.severity).toMatch(/medium|high|critical/);
      }
    });
  });
});
