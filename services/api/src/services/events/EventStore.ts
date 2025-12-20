/**
 * Event Store Service
 * Event sourcing and audit trail storage
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { redis } from '../redis';
import { Event, EventCategory, EventPriority } from './EventBus';

// ==================== Types ====================

export interface StoredEvent extends Event {
  storedAt: Date;
  sequence: number;
  aggregateId?: string;
  aggregateType?: string;
}

export interface EventQuery {
  type?: string;
  category?: EventCategory;
  aggregateId?: string;
  aggregateType?: string;
  userId?: string;
  tenantId?: string;
  startTime?: Date;
  endTime?: Date;
  priority?: EventPriority;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface EventStream {
  streamId: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  events: StoredEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Snapshot {
  id: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: unknown;
  createdAt: Date;
}

export interface EventStoreStats {
  totalEvents: number;
  totalStreams: number;
  eventsToday: number;
  oldestEvent?: Date;
  newestEvent?: Date;
  averageEventsPerStream: number;
}

export interface ReplayOptions {
  fromSequence?: number;
  toSequence?: number;
  fromTime?: Date;
  toTime?: Date;
  aggregateId?: string;
  batchSize?: number;
  onEvent?: (event: StoredEvent) => Promise<void>;
}

export interface ProjectionResult {
  aggregateId: string;
  state: unknown;
  version: number;
  lastEventAt: Date;
}

// ==================== Event Store Implementation ====================

export class EventStore extends EventEmitter {
  private sequence = 0;
  private isInitialized = false;

  private readonly config = {
    keyPrefix: 'upcoach:eventstore:',
    eventsKey: 'events',
    streamsKey: 'streams',
    snapshotsKey: 'snapshots',
    indexesKey: 'indexes',
    sequenceKey: 'sequence',
    maxEventsInMemory: 10000,
    snapshotInterval: 100, // Create snapshot every N events
    retentionDays: 90,
    batchSize: 1000,
  };

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Initialize event store
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load sequence number from Redis
      const storedSequence = await redis.get(this.getKey(this.config.sequenceKey));
      this.sequence = storedSequence ? parseInt(storedSequence, 10) : 0;

      this.isInitialized = true;
      logger.info('EventStore initialized', { sequence: this.sequence });
    } catch (error) {
      logger.error('Failed to initialize EventStore:', error);
      throw error;
    }
  }

  /**
   * Append event to store
   */
  async append(event: Event, aggregateId?: string, aggregateType?: string): Promise<StoredEvent> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const sequence = ++this.sequence;

    const storedEvent: StoredEvent = {
      ...event,
      storedAt: new Date(),
      sequence,
      aggregateId,
      aggregateType,
    };

    try {
      // Store event
      const eventKey = this.getKey(`${this.config.eventsKey}:${storedEvent.id}`);
      await redis.setEx(
        eventKey,
        this.config.retentionDays * 24 * 60 * 60,
        JSON.stringify(storedEvent)
      );

      // Update sequence
      await redis.set(this.getKey(this.config.sequenceKey), sequence.toString());

      // Add to event stream if aggregate specified
      if (aggregateId && aggregateType) {
        await this.appendToStream(storedEvent, aggregateId, aggregateType);
      }

      // Update indexes
      await this.updateIndexes(storedEvent);

      // Check if snapshot needed
      if (aggregateId && aggregateType && sequence % this.config.snapshotInterval === 0) {
        this.emit('snapshotNeeded', { aggregateId, aggregateType, sequence });
      }

      this.emit('eventAppended', storedEvent);

      logger.debug('Event appended to store', {
        eventId: storedEvent.id,
        sequence,
        aggregateId,
      });

      return storedEvent;
    } catch (error) {
      logger.error('Failed to append event:', { eventId: event.id, error });
      throw error;
    }
  }

  /**
   * Append event to stream
   */
  private async appendToStream(
    event: StoredEvent,
    aggregateId: string,
    aggregateType: string
  ): Promise<void> {
    const streamKey = this.getStreamKey(aggregateId, aggregateType);

    // Add to stream sorted set (score is sequence number)
    await redis.zAdd(streamKey, {
      score: event.sequence,
      value: event.id,
    });

    // Update stream metadata
    const metaKey = `${streamKey}:meta`;
    await redis.hSet(metaKey, {
      aggregateId,
      aggregateType,
      version: event.sequence.toString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Update indexes for event
   */
  private async updateIndexes(event: StoredEvent): Promise<void> {
    const pipeline = redis.multi();

    // Type index
    const typeKey = this.getKey(`${this.config.indexesKey}:type:${event.type}`);
    pipeline.zAdd(typeKey, { score: event.sequence, value: event.id });

    // Category index
    const categoryKey = this.getKey(`${this.config.indexesKey}:category:${event.category}`);
    pipeline.zAdd(categoryKey, { score: event.sequence, value: event.id });

    // User index
    if (event.metadata.userId) {
      const userKey = this.getKey(`${this.config.indexesKey}:user:${event.metadata.userId}`);
      pipeline.zAdd(userKey, { score: event.sequence, value: event.id });
    }

    // Tenant index
    if (event.metadata.tenantId) {
      const tenantKey = this.getKey(`${this.config.indexesKey}:tenant:${event.metadata.tenantId}`);
      pipeline.zAdd(tenantKey, { score: event.sequence, value: event.id });
    }

    // Date index
    const dateKey = this.getKey(`${this.config.indexesKey}:date:${this.getDateKey(event.timestamp)}`);
    pipeline.zAdd(dateKey, { score: event.sequence, value: event.id });

    // Tag indexes
    if (event.metadata.tags) {
      for (const tag of event.metadata.tags) {
        const tagKey = this.getKey(`${this.config.indexesKey}:tag:${tag}`);
        pipeline.zAdd(tagKey, { score: event.sequence, value: event.id });
      }
    }

    await pipeline.exec();
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<StoredEvent | null> {
    try {
      const eventKey = this.getKey(`${this.config.eventsKey}:${eventId}`);
      const data = await redis.get(eventKey);

      if (!data) return null;

      const event = JSON.parse(data) as StoredEvent;
      event.timestamp = new Date(event.timestamp);
      event.storedAt = new Date(event.storedAt);

      return event;
    } catch (error) {
      logger.error('Failed to get event:', { eventId, error });
      throw error;
    }
  }

  /**
   * Query events
   */
  async query(query: EventQuery): Promise<StoredEvent[]> {
    try {
      let eventIds: string[] = [];
      const limit = query.limit || 100;
      const offset = query.offset || 0;

      // Determine which index to use
      if (query.aggregateId && query.aggregateType) {
        const streamKey = this.getStreamKey(query.aggregateId, query.aggregateType);
        eventIds = await redis.zRange(streamKey, offset, offset + limit - 1);
      } else if (query.type) {
        const typeKey = this.getKey(`${this.config.indexesKey}:type:${query.type}`);
        eventIds = await redis.zRange(typeKey, offset, offset + limit - 1);
      } else if (query.category) {
        const categoryKey = this.getKey(`${this.config.indexesKey}:category:${query.category}`);
        eventIds = await redis.zRange(categoryKey, offset, offset + limit - 1);
      } else if (query.userId) {
        const userKey = this.getKey(`${this.config.indexesKey}:user:${query.userId}`);
        eventIds = await redis.zRange(userKey, offset, offset + limit - 1);
      } else {
        // Fallback to scanning all events (not recommended for production)
        const pattern = this.getKey(`${this.config.eventsKey}:*`);
        const keys = await redis.keys(pattern);
        eventIds = keys.slice(offset, offset + limit).map(k => k.split(':').pop()!);
      }

      // Fetch events
      const events: StoredEvent[] = [];
      for (const eventId of eventIds) {
        const event = await this.getEvent(eventId);
        if (event && this.matchesQuery(event, query)) {
          events.push(event);
        }
      }

      // Sort by sequence
      events.sort((a, b) => a.sequence - b.sequence);

      return events;
    } catch (error) {
      logger.error('Failed to query events:', { query, error });
      throw error;
    }
  }

  /**
   * Check if event matches query
   */
  private matchesQuery(event: StoredEvent, query: EventQuery): boolean {
    if (query.type && event.type !== query.type) return false;
    if (query.category && event.category !== query.category) return false;
    if (query.priority && event.metadata.priority !== query.priority) return false;
    if (query.userId && event.metadata.userId !== query.userId) return false;
    if (query.tenantId && event.metadata.tenantId !== query.tenantId) return false;

    if (query.startTime && new Date(event.timestamp) < query.startTime) return false;
    if (query.endTime && new Date(event.timestamp) > query.endTime) return false;

    if (query.tags && query.tags.length > 0) {
      const eventTags = event.metadata.tags || [];
      if (!query.tags.some(tag => eventTags.includes(tag))) return false;
    }

    return true;
  }

  /**
   * Get event stream
   */
  async getStream(aggregateId: string, aggregateType: string): Promise<EventStream | null> {
    try {
      const streamKey = this.getStreamKey(aggregateId, aggregateType);
      const metaKey = `${streamKey}:meta`;

      // Get metadata
      const meta = await redis.hGetAll(metaKey);
      if (!meta || Object.keys(meta).length === 0) return null;

      // Get events
      const eventIds = await redis.zRange(streamKey, 0, -1);
      const events: StoredEvent[] = [];

      for (const eventId of eventIds) {
        const event = await this.getEvent(eventId);
        if (event) events.push(event);
      }

      return {
        streamId: `${aggregateType}:${aggregateId}`,
        aggregateId,
        aggregateType,
        version: parseInt(meta.version || '0', 10),
        events,
        createdAt: events[0]?.storedAt || new Date(),
        updatedAt: new Date(meta.updatedAt || new Date()),
      };
    } catch (error) {
      logger.error('Failed to get stream:', { aggregateId, aggregateType, error });
      throw error;
    }
  }

  /**
   * Save snapshot
   */
  async saveSnapshot(
    aggregateId: string,
    aggregateType: string,
    version: number,
    state: unknown
  ): Promise<Snapshot> {
    const snapshot: Snapshot = {
      id: uuidv4(),
      aggregateId,
      aggregateType,
      version,
      state,
      createdAt: new Date(),
    };

    try {
      const snapshotKey = this.getKey(`${this.config.snapshotsKey}:${aggregateType}:${aggregateId}`);
      await redis.set(snapshotKey, JSON.stringify(snapshot));

      this.emit('snapshotSaved', snapshot);

      logger.debug('Snapshot saved', { aggregateId, aggregateType, version });

      return snapshot;
    } catch (error) {
      logger.error('Failed to save snapshot:', { aggregateId, error });
      throw error;
    }
  }

  /**
   * Get snapshot
   */
  async getSnapshot(aggregateId: string, aggregateType: string): Promise<Snapshot | null> {
    try {
      const snapshotKey = this.getKey(`${this.config.snapshotsKey}:${aggregateType}:${aggregateId}`);
      const data = await redis.get(snapshotKey);

      if (!data) return null;

      const snapshot = JSON.parse(data) as Snapshot;
      snapshot.createdAt = new Date(snapshot.createdAt);

      return snapshot;
    } catch (error) {
      logger.error('Failed to get snapshot:', { aggregateId, error });
      throw error;
    }
  }

  /**
   * Replay events
   */
  async replay(options: ReplayOptions): Promise<number> {
    const batchSize = options.batchSize || this.config.batchSize;
    let processedCount = 0;
    let offset = 0;

    try {
      while (true) {
        const query: EventQuery = {
          limit: batchSize,
          offset,
        };

        if (options.aggregateId) {
          // Query specific aggregate - need to determine type
          // For simplicity, we'll scan all events with matching aggregateId
        }

        if (options.fromTime) query.startTime = options.fromTime;
        if (options.toTime) query.endTime = options.toTime;

        const events = await this.query(query);

        if (events.length === 0) break;

        // Filter by sequence if specified
        const filteredEvents = events.filter(event => {
          if (options.fromSequence && event.sequence < options.fromSequence) return false;
          if (options.toSequence && event.sequence > options.toSequence) return false;
          if (options.aggregateId && event.aggregateId !== options.aggregateId) return false;
          return true;
        });

        // Process events
        for (const event of filteredEvents) {
          if (options.onEvent) {
            await options.onEvent(event);
          }
          this.emit('eventReplayed', event);
          processedCount++;
        }

        offset += batchSize;

        // Safety check
        if (events.length < batchSize) break;
      }

      logger.info('Replay completed', { processedCount });
      return processedCount;
    } catch (error) {
      logger.error('Replay failed:', { options, error });
      throw error;
    }
  }

  /**
   * Project aggregate state from events
   */
  async project<T>(
    aggregateId: string,
    aggregateType: string,
    reducer: (state: T | null, event: StoredEvent) => T,
    initialState: T | null = null
  ): Promise<ProjectionResult> {
    // Try to get snapshot first
    const snapshot = await this.getSnapshot(aggregateId, aggregateType);
    let state = snapshot ? (snapshot.state as T) : initialState;
    let fromSequence = snapshot ? snapshot.version + 1 : 0;

    // Get events after snapshot
    const stream = await this.getStream(aggregateId, aggregateType);

    if (stream) {
      const newEvents = stream.events.filter(e => e.sequence > fromSequence);

      for (const event of newEvents) {
        state = reducer(state, event);
      }
    }

    const lastEvent = stream?.events[stream.events.length - 1];

    return {
      aggregateId,
      state,
      version: lastEvent?.sequence || snapshot?.version || 0,
      lastEventAt: lastEvent?.storedAt || snapshot?.createdAt || new Date(),
    };
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<EventStoreStats> {
    try {
      // Count events by scanning index
      const typePattern = this.getKey(`${this.config.indexesKey}:type:*`);
      const typeKeys = await redis.keys(typePattern);

      let totalEvents = 0;
      for (const key of typeKeys) {
        const count = await redis.zCard(key);
        totalEvents += count;
      }

      // Count streams
      const streamPattern = this.getKey(`${this.config.streamsKey}:*:meta`);
      const streamKeys = await redis.keys(streamPattern);
      const totalStreams = streamKeys.length;

      // Count today's events
      const todayKey = this.getKey(`${this.config.indexesKey}:date:${this.getDateKey(new Date())}`);
      const eventsToday = await redis.zCard(todayKey);

      return {
        totalEvents,
        totalStreams,
        eventsToday,
        averageEventsPerStream: totalStreams > 0 ? totalEvents / totalStreams : 0,
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return {
        totalEvents: 0,
        totalStreams: 0,
        eventsToday: 0,
        averageEventsPerStream: 0,
      };
    }
  }

  /**
   * Get key with prefix
   */
  private getKey(suffix: string): string {
    return `${this.config.keyPrefix}${suffix}`;
  }

  /**
   * Get stream key
   */
  private getStreamKey(aggregateId: string, aggregateType: string): string {
    return this.getKey(`${this.config.streamsKey}:${aggregateType}:${aggregateId}`);
  }

  /**
   * Get date key for indexing
   */
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current sequence number
   */
  getSequence(): number {
    return this.sequence;
  }
}

// ==================== Singleton Instance ====================

let eventStoreInstance: EventStore | null = null;

export const eventStore = (() => {
  if (!eventStoreInstance) {
    eventStoreInstance = new EventStore();
  }
  return eventStoreInstance;
})();

export const createEventStore = (): EventStore => {
  return new EventStore();
};

export default EventStore;
