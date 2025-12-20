/**
 * Events Module Index
 * Export all event-related services
 */

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
} from './EventBus';

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
} from './EventStore';
