/**
 * Analytics Data Pipeline
 * Real-time and batch processing of user behavior, goal progress, and platform usage data
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * Analytics Event Types
 */
export type AnalyticsEventType =
  | 'user.login'
  | 'user.logout'
  | 'user.signup'
  | 'goal.created'
  | 'goal.updated'
  | 'goal.completed'
  | 'goal.deleted'
  | 'habit.created'
  | 'habit.logged'
  | 'habit.streak_milestone'
  | 'ai.session_started'
  | 'ai.message_sent'
  | 'subscription.created'
  | 'subscription.upgraded'
  | 'subscription.cancelled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'feature.used'
  | 'page.viewed'
  | 'api.request';

/**
 * Analytics Event
 */
export interface AnalyticsEvent {
  id: string;
  tenantId: string;
  userId?: string;
  sessionId?: string;
  eventType: AnalyticsEventType;
  eventData: Record<string, any>;
  timestamp: Date;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  platform?: 'ios' | 'android' | 'web';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Analytics Metrics
 */
export interface AnalyticsMetrics {
  engagement: {
    dau: number; // Daily Active Users
    wau: number; // Weekly Active Users
    mau: number; // Monthly Active Users
    avgSessionDuration: number; // seconds
    featureUsage: Record<string, number>;
    pageViews: number;
  };
  goals: {
    created: number;
    completed: number;
    completionRate: number;
    avgTimeToComplete: number; // days
    abandonmentRate: number;
    activeGoals: number;
  };
  habits: {
    created: number;
    logged: number;
    streakData: {
      avgCurrentStreak: number;
      avgLongestStreak: number;
      totalStreaks: number;
    };
    completionPattern: number[]; // By day of week [Sun, Mon, ...]
  };
  revenue: {
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    churnRate: number;
    ltv: number; // Lifetime Value
    newSubscriptions: number;
    upgrades: number;
    downgrades: number;
    cancellations: number;
  };
  ai: {
    sessions: number;
    messages: number;
    avgMessagesPerSession: number;
    satisfactionScore: number;
  };
}

/**
 * Analytics Query Parameters
 */
export interface AnalyticsQuery {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  eventTypes?: AnalyticsEventType[];
  userId?: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  filters?: Record<string, any>;
}

/**
 * Analytics Result
 */
export interface AnalyticsResult {
  metrics: Partial<AnalyticsMetrics>;
  events?: AnalyticsEvent[];
  timeSeries?: Array<{
    timestamp: Date;
    value: number;
    label?: string;
  }>;
  breakdown?: Record<string, number>;
}

/**
 * Funnel Definition
 */
export interface FunnelDefinition {
  id: string;
  name: string;
  steps: Array<{
    name: string;
    eventType: AnalyticsEventType;
    conditions?: Record<string, any>;
  }>;
  timeWindow: number; // hours - max time to complete funnel
  createdAt: Date;
}

/**
 * Funnel Progress
 */
export interface FunnelProgress {
  funnelId: string;
  userId: string;
  currentStep: number;
  completedSteps: number[];
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Analytics Data Pipeline Service
 */
export class AnalyticsDataPipeline extends EventEmitter {
  private static instance: AnalyticsDataPipeline;
  private events: Map<string, AnalyticsEvent> = new Map();
  private aggregatedMetrics: Map<string, any> = new Map();
  private funnels: Map<string, FunnelDefinition> = new Map();
  private funnelProgress: Map<string, FunnelProgress[]> = new Map();

  private constructor() {
    super();
    this.startAggregationScheduler();
  }

  static getInstance(): AnalyticsDataPipeline {
    if (!AnalyticsDataPipeline.instance) {
      AnalyticsDataPipeline.instance = new AnalyticsDataPipeline();
    }
    return AnalyticsDataPipeline.instance;
  }

  /**
   * Ingest Event
   */
  async ingestEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<AnalyticsEvent> {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.events.set(analyticsEvent.id, analyticsEvent);
    this.emit('event:ingested', analyticsEvent);

    // Track funnel progress
    if (event.userId) {
      await this.trackFunnelProgress(event.userId, analyticsEvent);
    }

    // Real-time metric updates
    this.updateRealtimeMetrics(analyticsEvent);

    return analyticsEvent;
  }

  /**
   * Batch Ingest Events
   */
  async ingestEventBatch(events: Array<Omit<AnalyticsEvent, 'id' | 'timestamp'>>): Promise<AnalyticsEvent[]> {
    const analyticsEvents = events.map(event => ({
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }));

    analyticsEvents.forEach(event => {
      this.events.set(event.id, event);
    });

    this.emit('events:batch_ingested', { count: analyticsEvents.length });

    return analyticsEvents;
  }

  /**
   * Query Analytics Data
   */
  async query(params: AnalyticsQuery): Promise<AnalyticsResult> {
    const { tenantId, startDate, endDate, eventTypes, userId, groupBy, filters } = params;

    // Filter events
    let filteredEvents = Array.from(this.events.values()).filter(event => {
      if (event.tenantId !== tenantId) return false;
      if (event.timestamp < startDate || event.timestamp > endDate) return false;
      if (eventTypes && !eventTypes.includes(event.eventType)) return false;
      if (userId && event.userId !== userId) return false;
      return true;
    });

    // Apply custom filters
    if (filters) {
      filteredEvents = filteredEvents.filter(event => {
        return Object.entries(filters).every(([key, value]) => {
          return event.eventData[key] === value || event.metadata?.[key] === value;
        });
      });
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(filteredEvents, startDate, endDate);

    // Generate time series if groupBy specified
    let timeSeries: AnalyticsResult['timeSeries'];
    if (groupBy) {
      timeSeries = this.generateTimeSeries(filteredEvents, groupBy, startDate, endDate);
    }

    return {
      metrics,
      events: filteredEvents,
      timeSeries,
    };
  }

  /**
   * Calculate Metrics
   */
  private calculateMetrics(events: AnalyticsEvent[], startDate: Date, endDate: Date): Partial<AnalyticsMetrics> {
    const metrics: Partial<AnalyticsMetrics> = {};

    // Engagement metrics
    const loginEvents = events.filter(e => e.eventType === 'user.login');
    const uniqueUsers = new Set(loginEvents.map(e => e.userId).filter(Boolean));
    const sessions = new Set(events.map(e => e.sessionId).filter(Boolean));

    metrics.engagement = {
      dau: this.calculateDAU(events),
      wau: this.calculateWAU(events),
      mau: uniqueUsers.size,
      avgSessionDuration: this.calculateAvgSessionDuration(events),
      featureUsage: this.calculateFeatureUsage(events),
      pageViews: events.filter(e => e.eventType === 'page.viewed').length,
    };

    // Goal metrics
    const goalEvents = events.filter(e => e.eventType.startsWith('goal.'));
    metrics.goals = {
      created: events.filter(e => e.eventType === 'goal.created').length,
      completed: events.filter(e => e.eventType === 'goal.completed').length,
      completionRate: this.calculateGoalCompletionRate(events),
      avgTimeToComplete: this.calculateAvgTimeToComplete(events),
      abandonmentRate: 0, // Calculated from historical data
      activeGoals: 0, // Requires current state query
    };

    // Habit metrics
    metrics.habits = {
      created: events.filter(e => e.eventType === 'habit.created').length,
      logged: events.filter(e => e.eventType === 'habit.logged').length,
      streakData: {
        avgCurrentStreak: 0,
        avgLongestStreak: 0,
        totalStreaks: events.filter(e => e.eventType === 'habit.streak_milestone').length,
      },
      completionPattern: this.calculateCompletionPattern(events),
    };

    // Revenue metrics
    const subscriptionEvents = events.filter(e => e.eventType.startsWith('subscription.'));
    const paymentEvents = events.filter(e => e.eventType.startsWith('payment.'));

    metrics.revenue = {
      mrr: this.calculateMRR(subscriptionEvents),
      arr: 0, // Calculated from MRR
      churnRate: this.calculateChurnRate(subscriptionEvents, startDate, endDate),
      ltv: 0, // Requires historical analysis
      newSubscriptions: events.filter(e => e.eventType === 'subscription.created').length,
      upgrades: events.filter(e => e.eventType === 'subscription.upgraded').length,
      downgrades: 0,
      cancellations: events.filter(e => e.eventType === 'subscription.cancelled').length,
    };

    metrics.revenue.arr = metrics.revenue.mrr * 12;

    // AI metrics
    const aiEvents = events.filter(e => e.eventType.startsWith('ai.'));
    const aiSessions = events.filter(e => e.eventType === 'ai.session_started').length;
    const aiMessages = events.filter(e => e.eventType === 'ai.message_sent').length;

    metrics.ai = {
      sessions: aiSessions,
      messages: aiMessages,
      avgMessagesPerSession: aiSessions > 0 ? aiMessages / aiSessions : 0,
      satisfactionScore: 0, // Requires feedback data
    };

    return metrics;
  }

  /**
   * Calculate DAU (Daily Active Users)
   */
  private calculateDAU(events: AnalyticsEvent[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = events.filter(e => e.timestamp >= today && e.timestamp < tomorrow);
    const uniqueUsers = new Set(todayEvents.map(e => e.userId).filter(Boolean));
    return uniqueUsers.size;
  }

  /**
   * Calculate WAU (Weekly Active Users)
   */
  private calculateWAU(events: AnalyticsEvent[]): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekEvents = events.filter(e => e.timestamp >= weekAgo);
    const uniqueUsers = new Set(weekEvents.map(e => e.userId).filter(Boolean));
    return uniqueUsers.size;
  }

  /**
   * Calculate Average Session Duration
   */
  private calculateAvgSessionDuration(events: AnalyticsEvent[]): number {
    const sessions = new Map<string, { start: Date; end: Date }>();

    events.forEach(event => {
      if (!event.sessionId) return;

      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, { start: event.timestamp, end: event.timestamp });
      } else {
        const session = sessions.get(event.sessionId)!;
        if (event.timestamp > session.end) {
          session.end = event.timestamp;
        }
      }
    });

    const durations = Array.from(sessions.values()).map(s =>
      (s.end.getTime() - s.start.getTime()) / 1000
    );

    return durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;
  }

  /**
   * Calculate Feature Usage
   */
  private calculateFeatureUsage(events: AnalyticsEvent[]): Record<string, number> {
    const usage: Record<string, number> = {};

    events.filter(e => e.eventType === 'feature.used').forEach(event => {
      const featureName = event.eventData.featureName as string;
      usage[featureName] = (usage[featureName] || 0) + 1;
    });

    return usage;
  }

  /**
   * Calculate Goal Completion Rate
   */
  private calculateGoalCompletionRate(events: AnalyticsEvent[]): number {
    const created = events.filter(e => e.eventType === 'goal.created').length;
    const completed = events.filter(e => e.eventType === 'goal.completed').length;
    return created > 0 ? (completed / created) * 100 : 0;
  }

  /**
   * Calculate Average Time to Complete Goals
   */
  private calculateAvgTimeToComplete(events: AnalyticsEvent[]): number {
    const completionTimes: number[] = [];

    const goalCreated = new Map<string, Date>();
    events.filter(e => e.eventType === 'goal.created').forEach(e => {
      const goalId = e.eventData.goalId as string;
      goalCreated.set(goalId, e.timestamp);
    });

    events.filter(e => e.eventType === 'goal.completed').forEach(e => {
      const goalId = e.eventData.goalId as string;
      const createdAt = goalCreated.get(goalId);
      if (createdAt) {
        const days = (e.timestamp.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        completionTimes.push(days);
      }
    });

    return completionTimes.length > 0
      ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
      : 0;
  }

  /**
   * Calculate Completion Pattern by Day of Week
   */
  private calculateCompletionPattern(events: AnalyticsEvent[]): number[] {
    const pattern = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat

    events.filter(e => e.eventType === 'habit.logged').forEach(event => {
      const day = event.timestamp.getDay();
      pattern[day]++;
    });

    return pattern;
  }

  /**
   * Calculate MRR
   */
  private calculateMRR(subscriptionEvents: AnalyticsEvent[]): number {
    let mrr = 0;

    subscriptionEvents.forEach(event => {
      if (event.eventType === 'subscription.created' || event.eventType === 'subscription.upgraded') {
        const amount = event.eventData.monthlyAmount as number;
        if (amount) mrr += amount;
      }
    });

    return mrr;
  }

  /**
   * Calculate Churn Rate
   */
  private calculateChurnRate(subscriptionEvents: AnalyticsEvent[], startDate: Date, endDate: Date): number {
    const startSubs = subscriptionEvents.filter(e =>
      e.eventType === 'subscription.created' && e.timestamp < startDate
    ).length;

    const cancellations = subscriptionEvents.filter(e =>
      e.eventType === 'subscription.cancelled' &&
      e.timestamp >= startDate &&
      e.timestamp <= endDate
    ).length;

    return startSubs > 0 ? (cancellations / startSubs) * 100 : 0;
  }

  /**
   * Generate Time Series Data
   */
  private generateTimeSeries(
    events: AnalyticsEvent[],
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
  ): Array<{ timestamp: Date; value: number; label?: string }> {
    const timeSeries: Map<string, number> = new Map();

    events.forEach(event => {
      const bucket = this.getTimeBucket(event.timestamp, groupBy);
      timeSeries.set(bucket, (timeSeries.get(bucket) || 0) + 1);
    });

    return Array.from(timeSeries.entries())
      .map(([timestamp, value]) => ({
        timestamp: new Date(timestamp),
        value,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get Time Bucket for Grouping
   */
  private getTimeBucket(date: Date, groupBy: string): string {
    const d = new Date(date);

    switch (groupBy) {
      case 'hour':
        d.setMinutes(0, 0, 0);
        break;
      case 'day':
        d.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        break;
      case 'month':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        break;
    }

    return d.toISOString();
  }

  /**
   * Define Funnel
   */
  async defineFunnel(definition: Omit<FunnelDefinition, 'id' | 'createdAt'>): Promise<FunnelDefinition> {
    const funnel: FunnelDefinition = {
      ...definition,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    this.funnels.set(funnel.id, funnel);
    this.emit('funnel:created', funnel);

    return funnel;
  }

  /**
   * Track Funnel Progress
   */
  private async trackFunnelProgress(userId: string, event: AnalyticsEvent): Promise<void> {
    for (const funnel of this.funnels.values()) {
      const stepIndex = funnel.steps.findIndex(step => step.eventType === event.eventType);

      if (stepIndex === -1) continue;

      const key = `${userId}_${funnel.id}`;
      let progressList = this.funnelProgress.get(key) || [];
      let progress = progressList.find(p => !p.completed);

      if (!progress) {
        if (stepIndex === 0) {
          progress = {
            funnelId: funnel.id,
            userId,
            currentStep: 0,
            completedSteps: [],
            completed: false,
            startedAt: new Date(),
          };
          progressList.push(progress);
        }
      } else {
        if (stepIndex === progress.currentStep + 1 || stepIndex === progress.currentStep) {
          progress.completedSteps.push(stepIndex);
          progress.currentStep = stepIndex;

          if (stepIndex === funnel.steps.length - 1) {
            progress.completed = true;
            progress.completedAt = new Date();
            this.emit('funnel:completed', { userId, funnelId: funnel.id });
          }
        }
      }

      this.funnelProgress.set(key, progressList);
    }
  }

  /**
   * Get Funnel Analytics
   */
  async getFunnelAnalytics(funnelId: string): Promise<{
    totalStarts: number;
    totalCompletions: number;
    conversionRate: number;
    dropoffByStep: number[];
    avgTimeToComplete: number;
  }> {
    const funnel = this.funnels.get(funnelId);
    if (!funnel) throw new Error('Funnel not found');

    let totalStarts = 0;
    let totalCompletions = 0;
    const completionTimes: number[] = [];
    const dropoffByStep = new Array(funnel.steps.length).fill(0);

    for (const progressList of this.funnelProgress.values()) {
      for (const progress of progressList) {
        if (progress.funnelId !== funnelId) continue;

        totalStarts++;

        if (progress.completed) {
          totalCompletions++;
          if (progress.completedAt) {
            const time = progress.completedAt.getTime() - progress.startedAt.getTime();
            completionTimes.push(time / (1000 * 60 * 60)); // hours
          }
        } else {
          dropoffByStep[progress.currentStep]++;
        }
      }
    }

    return {
      totalStarts,
      totalCompletions,
      conversionRate: totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0,
      dropoffByStep,
      avgTimeToComplete: completionTimes.length > 0
        ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
        : 0,
    };
  }

  /**
   * Update Real-time Metrics
   */
  private updateRealtimeMetrics(event: AnalyticsEvent): void {
    const key = `realtime_${event.tenantId}`;
    const metrics = this.aggregatedMetrics.get(key) || {
      activeUsersNow: new Set(),
      eventsToday: 0,
      lastUpdated: new Date(),
    };

    if (event.userId) {
      metrics.activeUsersNow.add(event.userId);
    }
    metrics.eventsToday++;
    metrics.lastUpdated = new Date();

    this.aggregatedMetrics.set(key, metrics);
    this.emit('metrics:realtime_updated', { tenantId: event.tenantId, metrics });
  }

  /**
   * Aggregate Data
   */
  async aggregateData(timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<void> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'hourly':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const events = Array.from(this.events.values()).filter(e => e.timestamp >= startDate);
    const tenantGroups = new Map<string, AnalyticsEvent[]>();

    events.forEach(event => {
      if (!tenantGroups.has(event.tenantId)) {
        tenantGroups.set(event.tenantId, []);
      }
      tenantGroups.get(event.tenantId)!.push(event);
    });

    for (const [tenantId, tenantEvents] of tenantGroups) {
      const metrics = this.calculateMetrics(tenantEvents, startDate, now);
      const key = `${timeframe}_${tenantId}_${this.getTimeBucket(now, timeframe.replace('ly', '') as any)}`;
      this.aggregatedMetrics.set(key, metrics);
    }

    this.emit('aggregation:completed', { timeframe, tenantsProcessed: tenantGroups.size });
  }

  /**
   * Start Aggregation Scheduler
   */
  private startAggregationScheduler(): void {
    // Hourly aggregation
    setInterval(() => {
      this.aggregateData('hourly');
    }, 60 * 60 * 1000);

    // Daily aggregation
    setInterval(() => {
      this.aggregateData('daily');
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Get Aggregated Metrics
   */
  async getAggregatedMetrics(
    tenantId: string,
    timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly',
    date: Date
  ): Promise<Partial<AnalyticsMetrics> | null> {
    const key = `${timeframe}_${tenantId}_${this.getTimeBucket(date, timeframe.replace('ly', '') as any)}`;
    return this.aggregatedMetrics.get(key) || null;
  }

  /**
   * Cleanup Old Events
   */
  async cleanupOldEvents(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;

    for (const [id, event] of this.events) {
      if (event.timestamp < cutoffDate) {
        this.events.delete(id);
        deletedCount++;
      }
    }

    this.emit('cleanup:completed', { deletedCount, retentionDays });
    return deletedCount;
  }
}

export const analyticsDataPipeline = AnalyticsDataPipeline.getInstance();
