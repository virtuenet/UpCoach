/**
 * ML Model Deployment Services Index
 *
 * Exports all deployment-related services for model serving,
 * canary deployments, shadow deployments, and traffic splitting.
 */

// Model Serving Service
export {
  ModelServingService,
  modelServingService,
  createModelServingService,
  type ModelFormat,
  type ModelStatus,
  type EndpointType,
  type ModelConfig,
  type LoadedModel,
  type ModelReplica,
  type PredictionRequest,
  type PredictionResponse,
  type BatchPredictionRequest,
  type BatchPredictionResponse,
} from './ModelServingService';

// Canary Deployment Service
export {
  CanaryDeploymentService,
  canaryDeploymentService,
  createCanaryDeploymentService,
  type DeploymentStage,
  type DeploymentStatus,
  type CanaryConfig,
  type DeploymentStageConfig,
  type SuccessCriteria,
  type RollbackThreshold,
  type CanaryDeployment,
  type DeploymentMetrics,
  type StageTransition,
  type DeploymentDecision,
  type CanaryStats,
} from './CanaryDeploymentService';

// Shadow Deployment Service
export {
  ShadowDeploymentService,
  shadowDeploymentService,
  createShadowDeploymentService,
  type ShadowStatus,
  type ComparisonType,
  type ShadowConfig,
  type ShadowDeployment,
  type ShadowMetrics,
  type ComparisonResult,
  type DivergenceRecord,
  type ShadowAnalysis,
  type ShadowStats,
} from './ShadowDeploymentService';

// Traffic Splitter Service
export {
  TrafficSplitter,
  trafficSplitter,
  createTrafficSplitter,
  type ExperimentType,
  type ExperimentStatus,
  type AllocationStrategy,
  type ExperimentConfig,
  type VariantConfig,
  type Experiment,
  type VariantState,
  type ExperimentResults,
  type VariantResult,
  type TrafficDecision,
  type SplitterStats,
} from './TrafficSplitter';
