/**
 * Prediction Engines Index
 *
 * Centralized exports for all ML prediction engines.
 * These engines provide intelligent predictions for coaching outcomes.
 */

// ==================== Churn Prediction ====================
export {
  ChurnPredictor,
  churnPredictor,
  createChurnPredictor,
  type ChurnPrediction,
  type ChurnRiskLevel,
  type RiskFactor,
  type ChurnPredictionInput,
  type ChurnPredictionBatch,
} from './ChurnPredictor';

// ==================== Coach Performance Prediction ====================
export {
  CoachPerformancePredictor,
  coachPerformancePredictor,
  createCoachPerformancePredictor,
  type CoachProfile,
  type ClientProfile,
  type MatchPrediction,
  type CoachPerformanceMetrics,
  type CoachRanking,
  type CompatibilityFactor,
} from './CoachPerformancePredictor';

// ==================== Session Outcome Prediction ====================
export {
  SessionOutcomePredictor,
  sessionOutcomePredictor,
  createSessionOutcomePredictor,
  type SessionInput,
  type SessionPrediction,
  type SessionOutcome,
  type SessionRiskFactor,
  type RecommendedAction,
  type SessionTimeOptimization,
} from './SessionOutcomePredictor';

// ==================== Goal Completion Prediction ====================
export {
  GoalCompletionPredictor,
  goalCompletionPredictor,
  createGoalCompletionPredictor,
  type GoalProfile,
  type GoalType,
  type GoalDifficulty,
  type Milestone,
  type UserGoalHistory,
  type EngagementLevel,
  type GoalCompletionPrediction,
  type GoalRiskLevel,
  type GoalRiskFactor,
  type ProgressAnalysis,
  type TimelineForecast,
  type GoalRecommendation,
  type RecommendationType,
  type BatchPredictionResult,
  type GoalInsight,
  type Insight,
  type InsightType,
} from './GoalCompletionPredictor';

// ==================== Engagement Optimization ====================
export {
  EngagementOptimizer,
  engagementOptimizer,
  createEngagementOptimizer,
  type UserBehavior,
  type DeviceType,
  type ActivityRecord,
  type NotificationRecord,
  type NotificationType,
  type EngagementChannel,
  type SessionPattern,
  type EngagementPreferences,
  type EngagementRecommendation,
  type OptimalTimeSlot,
  type ChannelRecommendation,
  type ContentSuggestion,
  type EngagementScorePrediction,
  type EngagementStrategy,
  type StrategyAction,
  type SendTimeOptimization,
  type TimeSlot,
  type UserSegment,
  type SegmentCriteria,
  type SegmentProfile,
  type CampaignOptimization,
  type CampaignMetrics,
} from './EngagementOptimizer';

// ==================== Aggregate Exports ====================

/**
 * All prediction engine instances (singletons)
 */
export const predictionEngines = {
  churn: () => import('./ChurnPredictor').then(m => m.churnPredictor),
  coachPerformance: () => import('./CoachPerformancePredictor').then(m => m.coachPerformancePredictor),
  sessionOutcome: () => import('./SessionOutcomePredictor').then(m => m.sessionOutcomePredictor),
  goalCompletion: () => import('./GoalCompletionPredictor').then(m => m.goalCompletionPredictor),
  engagement: () => import('./EngagementOptimizer').then(m => m.engagementOptimizer),
};

/**
 * Prediction engine factory functions
 */
export const predictionFactories = {
  createChurnPredictor: () => import('./ChurnPredictor').then(m => m.createChurnPredictor),
  createCoachPerformancePredictor: () =>
    import('./CoachPerformancePredictor').then(m => m.createCoachPerformancePredictor),
  createSessionOutcomePredictor: () =>
    import('./SessionOutcomePredictor').then(m => m.createSessionOutcomePredictor),
  createGoalCompletionPredictor: () =>
    import('./GoalCompletionPredictor').then(m => m.createGoalCompletionPredictor),
  createEngagementOptimizer: () =>
    import('./EngagementOptimizer').then(m => m.createEngagementOptimizer),
};

/**
 * Prediction engine metadata
 */
export const predictionEngineMetadata = {
  churn: {
    name: 'Churn Predictor',
    version: '1.0.0',
    description: 'Predicts client churn probability based on engagement patterns',
    inputType: 'ChurnPredictionInput',
    outputType: 'ChurnPrediction',
    latencyTarget: '100ms',
  },
  coachPerformance: {
    name: 'Coach Performance Predictor',
    version: '1.0.0',
    description: 'Predicts coach-client match compatibility and coach performance',
    inputType: 'CoachProfile, ClientProfile',
    outputType: 'MatchPrediction',
    latencyTarget: '50ms',
  },
  sessionOutcome: {
    name: 'Session Outcome Predictor',
    version: '1.0.0',
    description: 'Predicts coaching session success and optimal timing',
    inputType: 'SessionInput',
    outputType: 'SessionPrediction',
    latencyTarget: '75ms',
  },
  goalCompletion: {
    name: 'Goal Completion Predictor',
    version: '1.0.0',
    description: 'Predicts goal completion probability and timeline forecasting',
    inputType: 'GoalProfile',
    outputType: 'GoalCompletionPrediction',
    latencyTarget: '100ms',
  },
  engagement: {
    name: 'Engagement Optimizer',
    version: '1.0.0',
    description: 'Optimizes user engagement timing, channels, and content',
    inputType: 'UserBehavior',
    outputType: 'EngagementRecommendation',
    latencyTarget: '150ms',
  },
};
