/**
 * ML Services Index
 * Export all machine learning services
 */

// ==================== Anomaly Detection ====================
export {
  AnomalyDetectionService,
  anomalyDetectionService,
  createAnomalyDetectionService,
  type AnomalyAlert,
  type AnomalyType,
  type DetectionAlgorithm,
  type DetectionResult,
  type MetricDefinition,
  type TimeSeriesDataPoint,
  type AnomalyDetectionConfig,
} from './AnomalyDetectionService';

// ==================== Explanation Engine ====================
export {
  ExplanationEngine,
  explanationEngine,
  createExplanationEngine,
  type Explanation,
  type FeatureContribution,
  type FeatureImportance,
  type ModelExplanation,
} from './ExplanationEngine';

// ==================== Algorithms ====================
export {
  ZScoreDetector,
  createZScoreDetector,
  IQRDetector,
  createIQRDetector,
  IsolationForestDetector,
  createIsolationForestDetector,
  type ZScoreResult,
  type ZScoreConfig,
  type IQRResult,
  type IQRConfig,
  type IQRStatistics,
  type IsolationForestResult,
  type IsolationForestConfig,
} from './algorithms';

// ==================== Model Registry ====================
export {
  ModelRegistry,
  modelRegistry,
  createModelRegistry,
  type RegisteredModel,
  type ModelVersion,
  type ModelStage,
  type ModelLineage,
  type ModelMetadata,
  type ModelArtifact,
  type ModelTag,
  type ModelSearchCriteria,
} from './ModelRegistry';

// ==================== Model Manager ====================
export {
  ModelManager,
  modelManager,
  createModelManager,
  type DeploymentStatus,
  type CanaryDeployment,
  type ShadowDeployment,
  type ModelHealth,
  type RollbackInfo,
  type ModelConfig,
  type DeploymentState,
  type HealthStatus,
} from './ModelManager';

// ==================== Model Drift Detector ====================
export {
  ModelDriftDetector,
  modelDriftDetector,
  createModelDriftDetector,
  type DriftReport,
  type ConceptDriftReport,
  type RetrainingRecommendation,
  type FeatureDrift,
  type DriftThreshold,
  type DriftSeverity,
} from './ModelDriftDetector';

// ==================== Feature Store ====================
export {
  FeatureStore,
  featureStore,
  createFeatureStore,
  type FeatureDefinition,
  type FeatureVector,
  type FeatureGroupConfig,
  type MaterializationJob,
  type FeatureType,
  type FeatureStatus,
  type FeatureStatistics,
  type FeatureValidation,
} from './FeatureStore';

// ==================== A/B Testing ====================
export {
  ABTestingService,
  abTestingService,
  createABTestingService,
  type Experiment,
  type ExperimentResults,
  type StatisticalSignificance,
  type Variant,
  type ExperimentConfig,
  type ExperimentStatus,
  type MetricResult,
  type VariantAssignment,
} from './ABTestingService';

// ==================== Prediction Engines ====================
export * from './predictions';
