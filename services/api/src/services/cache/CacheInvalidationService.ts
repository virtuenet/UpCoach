/**
 * Cache Invalidation Service
 *
 * Smart cache invalidation strategies including event-based invalidation,
 * cascading invalidation, and pattern-based clearing.
 */

import { RedisCacheService, getCacheService, CACHE_NAMESPACES } from './RedisCacheService';

// Invalidation event types
export type InvalidationEvent =
  | 'user:updated'
  | 'user:deleted'
  | 'habit:created'
  | 'habit:updated'
  | 'habit:deleted'
  | 'habit:completed'
  | 'goal:created'
  | 'goal:updated'
  | 'goal:deleted'
  | 'goal:milestone_updated'
  | 'session:created'
  | 'session:completed'
  | 'coach:profile_updated'
  | 'coach:availability_changed'
  | 'content:published'
  | 'content:updated'
  | 'content:deleted'
  | 'analytics:refresh'
  | 'recommendations:refresh'
  | 'subscription:changed';

// Invalidation rule configuration
export interface InvalidationRule {
  event: InvalidationEvent;
  patterns: string[];
  tags: string[];
  cascadeEvents?: InvalidationEvent[];
}

// Invalidation context
export interface InvalidationContext {
  userId?: string;
  coachId?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
}

// Invalidation result
export interface InvalidationResult {
  event: InvalidationEvent;
  keysInvalidated: number;
  cascadedEvents: InvalidationEvent[];
  duration: number;
  success: boolean;
}

export class CacheInvalidationService {
  private cache: RedisCacheService;
  private rules: Map<InvalidationEvent, InvalidationRule>;
  private eventHistory: Array<{
    event: InvalidationEvent;
    context: InvalidationContext;
    timestamp: number;
  }> = [];
  private maxHistorySize = 1000;

  constructor(cache?: RedisCacheService) {
    this.cache = cache || getCacheService();
    this.rules = new Map();
    this.initializeRules();
  }

  /**
   * Initialize default invalidation rules
   */
  private initializeRules(): void {
    // User-related invalidations
    this.addRule({
      event: 'user:updated',
      patterns: [
        'user:profile:*',
        'user:preferences:*',
        'user:statistics:*',
      ],
      tags: ['user-profile'],
      cascadeEvents: ['recommendations:refresh'],
    });

    this.addRule({
      event: 'user:deleted',
      patterns: [
        'user:*',
        'habits:user:*',
        'goals:user:*',
        'analytics:user:*',
        'recommendations:user:*',
      ],
      tags: ['user-data'],
    });

    // Habit-related invalidations
    this.addRule({
      event: 'habit:created',
      patterns: [
        'habits:user:{userId}:*',
        'analytics:habits:*',
      ],
      tags: ['habits', 'user-habits'],
      cascadeEvents: ['recommendations:refresh'],
    });

    this.addRule({
      event: 'habit:updated',
      patterns: [
        'habits:user:{userId}:*',
        'habits:detail:{entityId}',
      ],
      tags: ['habits'],
    });

    this.addRule({
      event: 'habit:deleted',
      patterns: [
        'habits:user:{userId}:*',
        'habits:detail:{entityId}',
        'analytics:habits:*',
      ],
      tags: ['habits'],
    });

    this.addRule({
      event: 'habit:completed',
      patterns: [
        'habits:user:{userId}:today',
        'habits:user:{userId}:streak',
        'analytics:habits:completion:*',
        'gamification:user:{userId}:*',
      ],
      tags: ['habit-completions'],
    });

    // Goal-related invalidations
    this.addRule({
      event: 'goal:created',
      patterns: [
        'goals:user:{userId}:*',
        'analytics:goals:*',
      ],
      tags: ['goals'],
      cascadeEvents: ['recommendations:refresh'],
    });

    this.addRule({
      event: 'goal:updated',
      patterns: [
        'goals:user:{userId}:*',
        'goals:detail:{entityId}',
      ],
      tags: ['goals'],
    });

    this.addRule({
      event: 'goal:deleted',
      patterns: [
        'goals:user:{userId}:*',
        'goals:detail:{entityId}',
      ],
      tags: ['goals'],
    });

    this.addRule({
      event: 'goal:milestone_updated',
      patterns: [
        'goals:detail:{entityId}',
        'goals:user:{userId}:progress',
      ],
      tags: ['goal-milestones'],
    });

    // Session-related invalidations
    this.addRule({
      event: 'session:created',
      patterns: [
        'sessions:user:{userId}:*',
        'sessions:coach:{coachId}:*',
        'analytics:sessions:*',
      ],
      tags: ['sessions'],
    });

    this.addRule({
      event: 'session:completed',
      patterns: [
        'sessions:user:{userId}:*',
        'sessions:coach:{coachId}:*',
        'analytics:sessions:*',
        'analytics:coach:{coachId}:*',
      ],
      tags: ['sessions', 'session-completions'],
    });

    // Coach-related invalidations
    this.addRule({
      event: 'coach:profile_updated',
      patterns: [
        'coach:profile:{coachId}',
        'coach:listing:*',
        'recommendations:coaches:*',
      ],
      tags: ['coach-profiles'],
    });

    this.addRule({
      event: 'coach:availability_changed',
      patterns: [
        'coach:availability:{coachId}',
        'coach:slots:{coachId}:*',
      ],
      tags: ['coach-availability'],
    });

    // Content-related invalidations
    this.addRule({
      event: 'content:published',
      patterns: [
        'content:feed:*',
        'content:category:*',
        'recommendations:content:*',
      ],
      tags: ['content', 'content-feed'],
    });

    this.addRule({
      event: 'content:updated',
      patterns: [
        'content:detail:{entityId}',
        'content:feed:*',
      ],
      tags: ['content'],
    });

    this.addRule({
      event: 'content:deleted',
      patterns: [
        'content:detail:{entityId}',
        'content:feed:*',
        'content:category:*',
      ],
      tags: ['content'],
    });

    // Analytics invalidations
    this.addRule({
      event: 'analytics:refresh',
      patterns: [
        'analytics:*',
      ],
      tags: ['analytics'],
    });

    // Recommendations invalidations
    this.addRule({
      event: 'recommendations:refresh',
      patterns: [
        'recommendations:user:{userId}:*',
        'recommendations:content:*',
      ],
      tags: ['recommendations'],
    });

    // Subscription invalidations
    this.addRule({
      event: 'subscription:changed',
      patterns: [
        'user:subscription:{userId}',
        'user:entitlements:{userId}',
        'user:features:{userId}',
      ],
      tags: ['subscriptions'],
    });
  }

  /**
   * Add or update an invalidation rule
   */
  addRule(rule: InvalidationRule): void {
    this.rules.set(rule.event, rule);
  }

  /**
   * Remove an invalidation rule
   */
  removeRule(event: InvalidationEvent): boolean {
    return this.rules.delete(event);
  }

  /**
   * Get all rules
   */
  getRules(): InvalidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Invalidate cache based on event
   */
  async invalidate(
    event: InvalidationEvent,
    context: InvalidationContext = {}
  ): Promise<InvalidationResult> {
    const startTime = Date.now();
    const result: InvalidationResult = {
      event,
      keysInvalidated: 0,
      cascadedEvents: [],
      duration: 0,
      success: false,
    };

    try {
      const rule = this.rules.get(event);
      if (!rule) {
        console.warn(`No invalidation rule found for event: ${event}`);
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Invalidate by patterns
      for (const pattern of rule.patterns) {
        const resolvedPattern = this.resolvePattern(pattern, context);
        const deleted = await this.cache.deletePattern(resolvedPattern);
        result.keysInvalidated += deleted;
      }

      // Invalidate by tags
      if (rule.tags.length > 0) {
        const deleted = await this.cache.invalidateByTags(rule.tags);
        result.keysInvalidated += deleted;
      }

      // Handle cascade events
      if (rule.cascadeEvents && rule.cascadeEvents.length > 0) {
        for (const cascadeEvent of rule.cascadeEvents) {
          const cascadeResult = await this.invalidate(cascadeEvent, context);
          result.cascadedEvents.push(cascadeEvent);
          result.keysInvalidated += cascadeResult.keysInvalidated;
        }
      }

      // Record event in history
      this.recordEvent(event, context);

      result.success = true;
    } catch (error) {
      console.error(`Cache invalidation error for event ${event}:`, error);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Batch invalidate multiple events
   */
  async invalidateBatch(
    events: Array<{ event: InvalidationEvent; context?: InvalidationContext }>
  ): Promise<InvalidationResult[]> {
    const results: InvalidationResult[] = [];

    for (const { event, context } of events) {
      const result = await this.invalidate(event, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Invalidate all caches for a user
   */
  async invalidateUserCache(userId: string): Promise<number> {
    const patterns = [
      `user:*:${userId}*`,
      `habits:user:${userId}:*`,
      `goals:user:${userId}:*`,
      `sessions:user:${userId}:*`,
      `analytics:user:${userId}:*`,
      `recommendations:user:${userId}:*`,
      `gamification:user:${userId}:*`,
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.cache.deletePattern(pattern);
    }

    return totalDeleted;
  }

  /**
   * Invalidate all caches for a coach
   */
  async invalidateCoachCache(coachId: string): Promise<number> {
    const patterns = [
      `coach:*:${coachId}*`,
      `sessions:coach:${coachId}:*`,
      `analytics:coach:${coachId}:*`,
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.cache.deletePattern(pattern);
    }

    return totalDeleted;
  }

  /**
   * Invalidate namespace
   */
  async invalidateNamespace(namespace: string): Promise<number> {
    return await this.cache.deletePattern(`${namespace}:*`);
  }

  /**
   * Resolve pattern placeholders
   */
  private resolvePattern(
    pattern: string,
    context: InvalidationContext
  ): string {
    let resolved = pattern;

    if (context.userId) {
      resolved = resolved.replace('{userId}', context.userId);
    }
    if (context.coachId) {
      resolved = resolved.replace('{coachId}', context.coachId);
    }
    if (context.entityId) {
      resolved = resolved.replace('{entityId}', context.entityId);
    }
    if (context.entityType) {
      resolved = resolved.replace('{entityType}', context.entityType);
    }

    return resolved;
  }

  /**
   * Record event in history
   */
  private recordEvent(
    event: InvalidationEvent,
    context: InvalidationContext
  ): void {
    this.eventHistory.push({
      event,
      context,
      timestamp: Date.now(),
    });

    // Trim history if too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get recent invalidation events
   */
  getRecentEvents(
    limit: number = 100
  ): Array<{
    event: InvalidationEvent;
    context: InvalidationContext;
    timestamp: number;
  }> {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Get invalidation statistics
   */
  getStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentActivity: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const eventsByType: Record<string, number> = {};
    let recentActivity = 0;

    for (const record of this.eventHistory) {
      eventsByType[record.event] = (eventsByType[record.event] || 0) + 1;
      if (record.timestamp > oneHourAgo) {
        recentActivity++;
      }
    }

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      recentActivity,
    };
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
}

// Singleton instance
let invalidationService: CacheInvalidationService | null = null;

export function getInvalidationService(): CacheInvalidationService {
  if (!invalidationService) {
    invalidationService = new CacheInvalidationService();
  }
  return invalidationService;
}

export default CacheInvalidationService;
