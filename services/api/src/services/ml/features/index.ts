/**
 * Feature Engineering Module
 * Exports all feature engineering components
 * @version 1.0.0
 */

// Core feature store (re-export from parent)
export {
  FeatureStore,
  featureStore,
  createFeatureStore,
  type FeatureDefinition,
  type RegisteredFeature,
  type FeatureVector,
  type FeatureValue,
  type FeatureGroupConfig,
  type RegisteredFeatureGroup,
  type MaterializationJob,
  type FeatureStatistics,
  type FeatureStoreStats,
  type FeatureDataType,
  type AggregationType,
  type EntityType,
} from '../FeatureStore';

// Advanced feature definitions
export {
  userBehaviorFeatures,
  aiInteractionFeatures,
  churnPredictionFeatures,
  goalProgressFeatures,
  sessionCoachingFeatures,
  contentPersonalizationFeatures,
  socialCommunityFeatures,
  allAdvancedFeatures,
  advancedFeatureGroups,
} from './AdvancedFeatureDefinitions';

// Feature engineering pipeline
export {
  FeatureEngineeringPipeline,
  createFeatureEngineeringPipeline,
  FeatureTransformers,
  type PipelineConfig,
  type FeatureTransformConfig,
  type TransformType,
  type ComputationResult,
  type ComputationError,
  type PipelineStats,
  type FeatureComputationContext,
} from './FeatureEngineeringPipeline';

// Streaming feature processor
export {
  StreamingFeatureProcessor,
  createStreamingFeatureProcessor,
  type StreamingConfig,
  type AggregationType as StreamAggregationType,
  type StreamEvent,
  type AggregatedFeature,
  type FeatureWindow,
  type StreamingStats,
  type FeatureStreamSubscription,
  type StreamEventFilter,
} from './StreamingFeatureProcessor';

// Feature sync service
export {
  FeatureSyncService,
  createFeatureSyncService,
  type SyncConfig,
  type FeatureSyncPacket,
  type SyncFeatureValue,
  type SyncMetadata,
  type SyncState,
  type ConflictResolution,
  type MobileFeatureUpdate,
  type FeatureSyncResult,
  type SyncError,
} from './FeatureSyncService';
