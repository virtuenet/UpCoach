/**
 * Real-time Module Index
 * Export all real-time services for Priority 5: AI Phase C
 */

// Event Infrastructure
export {
  EventBus,
  eventBus,
  createEventBus,
  type Event,
  type EventCategory,
  type EventPriority,
  type EventMetadata,
  type EventHandler,
  type EventSubscription,
  type SubscriptionOptions,
  type PublishOptions,
  type EventBusStats,
  type DeadLetterEvent,
} from '../events/EventBus';

export {
  EventStore,
  eventStore,
  createEventStore,
  type StoredEvent,
  type EventQuery,
  type EventStream,
  type Snapshot,
  type EventStoreStats,
  type ReplayOptions,
  type ProjectionResult,
} from '../events/EventStore';

// Real-time Prediction Service
export {
  RealtimePredictionService,
  realtimePredictionService,
  createRealtimePredictionService,
  type PredictionType,
  type PredictionResult,
  type PredictionRequest,
  type BatchPredictionResult,
  type PredictionSubscriber,
  type PredictionCacheStats,
} from './RealtimePredictionService';

// Live Engagement Monitor
export {
  LiveEngagementMonitor,
  liveEngagementMonitor,
  createLiveEngagementMonitor,
  type UserStatus,
  type SessionStatus,
  type UserActivity,
  type ActiveUser,
  type LiveSession,
  type EngagementMetrics,
  type ChurnRiskAlert,
  type EngagementSubscriber,
} from './LiveEngagementMonitor';

// Streaming AI Service
export {
  StreamingAIService,
  streamingAIService,
  createStreamingAIService,
  type StreamProvider,
  type StreamStatus,
  type StreamTransport,
  type StreamOptions,
  type StreamChunk,
  type StreamMetrics,
  type ActiveStream,
  type StreamRequest,
  type StreamResult,
} from './StreamingAIService';

// Real-time Safety Detection
export {
  RealtimeSafetyDetection,
  realtimeSafetyDetection,
  createRealtimeSafetyDetection,
  type SafetyCategory,
  type SafetySeverity,
  type ContentSource,
  type SafetyAction,
  type SafetyRule,
  type SafetyDetection,
  type SafetyCheckRequest,
  type SafetyCheckResult,
  type SafetyStats,
} from './RealtimeSafetyDetection';

// WebSocket Handlers
export {
  RealtimeWebSocketHandlers,
  realtimeWebSocketHandlers,
  createRealtimeWebSocketHandlers,
  type ClientSubscription,
  type SubscriptionType,
  type RealtimeMessage,
} from './RealtimeWebSocketHandlers';

/**
 * Initialize all real-time services
 */
export async function initializeRealtimeServices(): Promise<void> {
  const { eventBus } = await import('../events/EventBus');
  const { eventStore } = await import('../events/EventStore');
  const { realtimePredictionService } = await import('./RealtimePredictionService');
  const { liveEngagementMonitor } = await import('./LiveEngagementMonitor');
  const { streamingAIService } = await import('./StreamingAIService');
  const { realtimeSafetyDetection } = await import('./RealtimeSafetyDetection');

  // Start event bus first
  await eventBus.start();

  // Start other services in parallel
  await Promise.all([
    eventStore.initialize(),
    realtimePredictionService.start(),
    liveEngagementMonitor.start(),
    streamingAIService.start(),
    realtimeSafetyDetection.start(),
  ]);

  console.log('[Realtime] All real-time services initialized');
}

/**
 * Shutdown all real-time services gracefully
 */
export async function shutdownRealtimeServices(): Promise<void> {
  const { eventBus } = await import('../events/EventBus');
  const { eventStore } = await import('../events/EventStore');
  const { realtimePredictionService } = await import('./RealtimePredictionService');
  const { liveEngagementMonitor } = await import('./LiveEngagementMonitor');
  const { streamingAIService } = await import('./StreamingAIService');
  const { realtimeSafetyDetection } = await import('./RealtimeSafetyDetection');

  // Stop services in reverse order
  await Promise.all([
    realtimeSafetyDetection.stop(),
    streamingAIService.stop(),
    liveEngagementMonitor.stop(),
    realtimePredictionService.stop(),
  ]);

  await eventStore.close();
  await eventBus.stop();

  console.log('[Realtime] All real-time services shut down');
}
