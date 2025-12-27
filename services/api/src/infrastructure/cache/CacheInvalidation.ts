/**
 * Cache Invalidation Service
 * Phase 12 Week 1
 *
 * Intelligent cache invalidation with pattern matching, dependency tracking,
 * and event-driven invalidation strategies
 */

import { RedisCache } from './RedisCache';
import EventEmitter from 'events';

export interface InvalidationRule {
  event: string;
  patterns: string[];
  strategy: 'immediate' | 'lazy' | 'scheduled';
  delay?: number; // ms for scheduled invalidation
  dependencies?: string[]; // dependent keys to invalidate
}

export interface InvalidationEvent {
  type: string;
  entity: string;
  entityId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface InvalidationStats {
  totalInvalidations: number;
  immediateInvalidations: number;
  lazyInvalidations: number;
  scheduledInvalidations: number;
  patternInvalidations: number;
  dependencyInvalidations: number;
}

export class CacheInvalidation extends EventEmitter {
  private rules: Map<string, InvalidationRule[]> = new Map();
  private stats: InvalidationStats;
  private scheduledInvalidations: Map<string, NodeJS.Timeout> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();

  constructor(private cache: RedisCache) {
    super();

    this.stats = {
      totalInvalidations: 0,
      immediateInvalidations: 0,
      lazyInvalidations: 0,
      scheduledInvalidations: 0,
      patternInvalidations: 0,
      dependencyInvalidations: 0
    };

    this.registerDefaultRules();
  }

  /**
   * Register invalidation rule
   */
  registerRule(rule: InvalidationRule): void {
    if (!this.rules.has(rule.event)) {
      this.rules.set(rule.event, []);
    }

    this.rules.get(rule.event)!.push(rule);

    // Build dependency graph
    if (rule.dependencies) {
      rule.dependencies.forEach(dep => {
        if (!this.dependencyGraph.has(dep)) {
          this.dependencyGraph.set(dep, new Set());
        }
        rule.patterns.forEach(pattern => {
          this.dependencyGraph.get(dep)!.add(pattern);
        });
      });
    }

    this.emit('rule:registered', rule);
  }

  /**
   * Handle invalidation event
   */
  async invalidate(event: InvalidationEvent): Promise<void> {
    const rules = this.rules.get(event.type) || [];

    if (rules.length === 0) {
      return;
    }

    for (const rule of rules) {
      await this.executeInvalidation(rule, event);
    }

    this.stats.totalInvalidations++;
    this.emit('invalidation:completed', { event, rulesApplied: rules.length });
  }

  /**
   * Invalidate specific key
   */
  async invalidateKey(key: string): Promise<boolean> {
    const deleted = await this.cache.delete(key);

    if (deleted) {
      this.stats.totalInvalidations++;
      await this.invalidateDependencies(key);
    }

    return deleted;
  }

  /**
   * Invalidate keys matching pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const count = await this.cache.deletePattern(pattern);

    if (count > 0) {
      this.stats.totalInvalidations += count;
      this.stats.patternInvalidations++;
    }

    return count;
  }

  /**
   * Invalidate multiple keys
   */
  async invalidateKeys(keys: string[]): Promise<number> {
    let deleted = 0;

    for (const key of keys) {
      const result = await this.cache.delete(key);
      if (result) deleted++;
    }

    this.stats.totalInvalidations += deleted;
    return deleted;
  }

  /**
   * Schedule invalidation for later
   */
  scheduleInvalidation(
    key: string,
    delay: number
  ): void {
    // Cancel existing scheduled invalidation
    const existing = this.scheduledInvalidations.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = setTimeout(async () => {
      await this.cache.delete(key);
      this.scheduledInvalidations.delete(key);
      this.stats.scheduledInvalidations++;
      this.emit('invalidation:scheduled_executed', { key });
    }, delay);

    this.scheduledInvalidations.set(key, timeout);
    this.emit('invalidation:scheduled', { key, delay });
  }

  /**
   * Cancel scheduled invalidation
   */
  cancelScheduledInvalidation(key: string): boolean {
    const timeout = this.scheduledInvalidations.get(key);

    if (timeout) {
      clearTimeout(timeout);
      this.scheduledInvalidations.delete(key);
      this.emit('invalidation:schedule_cancelled', { key });
      return true;
    }

    return false;
  }

  /**
   * Get invalidation statistics
   */
  getStats(): InvalidationStats {
    return { ...this.stats };
  }

  /**
   * Clear all invalidation rules
   */
  clearRules(): void {
    this.rules.clear();
    this.dependencyGraph.clear();
    this.registerDefaultRules();
  }

  /**
   * Execute invalidation based on rule strategy
   */
  private async executeInvalidation(
    rule: InvalidationRule,
    event: InvalidationEvent
  ): Promise<void> {
    const patterns = this.interpolatePatterns(rule.patterns, event);

    switch (rule.strategy) {
      case 'immediate':
        await this.executeImmediate(patterns);
        break;

      case 'lazy':
        await this.executeLazy(patterns);
        break;

      case 'scheduled':
        this.executeScheduled(patterns, rule.delay || 5000);
        break;
    }

    // Invalidate dependencies
    if (rule.dependencies) {
      for (const dep of rule.dependencies) {
        const interpolatedDep = this.interpolate(dep, event);
        await this.invalidateDependencies(interpolatedDep);
      }
    }
  }

  /**
   * Execute immediate invalidation
   */
  private async executeImmediate(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      await this.cache.deletePattern(pattern);
    }

    this.stats.immediateInvalidations++;
  }

  /**
   * Execute lazy invalidation (mark for invalidation on next access)
   */
  private async executeLazy(patterns: string[]): Promise<void> {
    // Set TTL to 0 to expire keys on next access
    for (const pattern of patterns) {
      const keys = await this.cache.keys(pattern);
      for (const key of keys) {
        await this.cache.set(key, { __invalidated: true }, 1); // 1 second TTL
      }
    }

    this.stats.lazyInvalidations++;
  }

  /**
   * Execute scheduled invalidation
   */
  private executeScheduled(patterns: string[], delay: number): void {
    patterns.forEach(pattern => {
      this.scheduleInvalidation(pattern, delay);
    });
  }

  /**
   * Invalidate dependent keys
   */
  private async invalidateDependencies(key: string): Promise<void> {
    const dependencies = this.dependencyGraph.get(key);

    if (dependencies && dependencies.size > 0) {
      for (const depPattern of dependencies) {
        await this.cache.deletePattern(depPattern);
        this.stats.dependencyInvalidations++;
      }
    }
  }

  /**
   * Interpolate patterns with event data
   */
  private interpolatePatterns(
    patterns: string[],
    event: InvalidationEvent
  ): string[] {
    return patterns.map(pattern => this.interpolate(pattern, event));
  }

  /**
   * Interpolate single pattern with event data
   */
  private interpolate(pattern: string, event: InvalidationEvent): string {
    return pattern
      .replace('{entity}', event.entity)
      .replace('{entityId}', event.entityId)
      .replace('{type}', event.type);
  }

  /**
   * Register default invalidation rules
   */
  private registerDefaultRules(): void {
    // User update invalidations
    this.registerRule({
      event: 'user:updated',
      patterns: ['user:{entityId}:*', 'users:list:*'],
      strategy: 'immediate'
    });

    // Habit CRUD invalidations
    this.registerRule({
      event: 'habit:created',
      patterns: ['user:{entityId}:habits:*', 'habits:list:*'],
      strategy: 'immediate'
    });

    this.registerRule({
      event: 'habit:updated',
      patterns: ['habit:{entityId}:*', 'user:*:habits:*'],
      strategy: 'immediate'
    });

    this.registerRule({
      event: 'habit:deleted',
      patterns: ['habit:{entityId}:*', 'user:*:habits:*'],
      strategy: 'immediate'
    });

    // Check-in invalidations
    this.registerRule({
      event: 'checkin:created',
      patterns: [
        'habit:{entityId}:checkins:*',
        'habit:{entityId}:streak:*',
        'user:*:analytics:*'
      ],
      strategy: 'immediate',
      dependencies: ['habit:{entityId}:stats']
    });

    // Goal invalidations
    this.registerRule({
      event: 'goal:updated',
      patterns: ['goal:{entityId}:*', 'user:*:goals:*'],
      strategy: 'immediate'
    });

    // Analytics invalidations (lazy - can tolerate stale data)
    this.registerRule({
      event: 'analytics:updated',
      patterns: ['analytics:*'],
      strategy: 'lazy'
    });

    // Coach assignment invalidations
    this.registerRule({
      event: 'coach:assigned',
      patterns: [
        'user:{entityId}:coach:*',
        'coach:*:clients:*'
      ],
      strategy: 'immediate'
    });

    // Subscription invalidations
    this.registerRule({
      event: 'subscription:updated',
      patterns: [
        'user:{entityId}:subscription:*',
        'subscription:*:features:*'
      ],
      strategy: 'immediate'
    });

    // Scheduled cache refresh (morning daily stats)
    this.registerRule({
      event: 'daily:refresh',
      patterns: ['stats:daily:*', 'leaderboard:*'],
      strategy: 'scheduled',
      delay: 3600000 // 1 hour
    });
  }

  /**
   * Cleanup scheduled invalidations on shutdown
   */
  cleanup(): void {
    this.scheduledInvalidations.forEach(timeout => {
      clearTimeout(timeout);
    });

    this.scheduledInvalidations.clear();
  }
}

/**
 * Singleton invalidation manager
 */
export class InvalidationManager {
  private static instance: CacheInvalidation;

  static initialize(cache: RedisCache): void {
    if (this.instance) {
      throw new Error('Invalidation manager already initialized');
    }

    this.instance = new CacheInvalidation(cache);
  }

  static getInstance(): CacheInvalidation {
    if (!this.instance) {
      throw new Error('Invalidation manager not initialized');
    }

    return this.instance;
  }

  static cleanup(): void {
    if (this.instance) {
      this.instance.cleanup();
    }
  }
}
