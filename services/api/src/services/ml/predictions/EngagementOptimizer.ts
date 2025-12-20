/**
 * Engagement Optimizer
 *
 * Optimizes user engagement timing, channels, and content.
 * Uses behavioral patterns, preferences, and ML to maximize engagement.
 *
 * Features:
 * - Optimal send time prediction
 * - Channel preference optimization
 * - Content personalization recommendations
 * - Engagement score prediction
 * - A/B testing integration
 * - User segmentation
 */

import { EventEmitter } from 'events';

// ==================== Types ====================

export interface UserBehavior {
  userId: string;
  timezone: string;
  preferredLanguage: string;
  deviceTypes: DeviceType[];
  primaryDevice: DeviceType;
  activityHistory: ActivityRecord[];
  notificationHistory: NotificationRecord[];
  sessionPatterns: SessionPattern[];
  engagementPreferences: EngagementPreferences;
  lastActiveAt: Date;
  signupDate: Date;
}

export type DeviceType = 'mobile_ios' | 'mobile_android' | 'web_desktop' | 'web_mobile' | 'tablet';

export interface ActivityRecord {
  timestamp: Date;
  action: string;
  channel: EngagementChannel;
  duration?: number;
  completed: boolean;
}

export interface NotificationRecord {
  id: string;
  sentAt: Date;
  channel: EngagementChannel;
  type: NotificationType;
  opened: boolean;
  openedAt?: Date;
  clicked: boolean;
  clickedAt?: Date;
  converted: boolean;
  unsubscribed: boolean;
}

export type NotificationType =
  | 'reminder'
  | 'achievement'
  | 'coach_message'
  | 'goal_update'
  | 'weekly_summary'
  | 'session_reminder'
  | 'streak_alert'
  | 'new_feature'
  | 'promotional';

export type EngagementChannel = 'push' | 'email' | 'sms' | 'in_app';

export interface SessionPattern {
  dayOfWeek: number; // 0-6
  hourOfDay: number; // 0-23
  frequency: number; // sessions count
  avgDuration: number; // minutes
}

export interface EngagementPreferences {
  preferredChannels: EngagementChannel[];
  doNotDisturbHours: { start: number; end: number };
  frequencyPreference: 'high' | 'medium' | 'low' | 'minimal';
  topicPreferences: string[];
  unsubscribedChannels: EngagementChannel[];
}

export interface EngagementRecommendation {
  userId: string;
  optimalTimes: OptimalTimeSlot[];
  channelRanking: ChannelRecommendation[];
  contentSuggestions: ContentSuggestion[];
  engagementScore: EngagementScorePrediction;
  personalizedStrategies: EngagementStrategy[];
  generatedAt: Date;
}

export interface OptimalTimeSlot {
  dayOfWeek: number;
  hourOfDay: number;
  score: number; // 0-1
  timezone: string;
  utcHour: number;
  reason: string;
}

export interface ChannelRecommendation {
  channel: EngagementChannel;
  score: number; // 0-1
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bestForTypes: NotificationType[];
}

export interface ContentSuggestion {
  type: NotificationType;
  priority: 'high' | 'medium' | 'low';
  subject?: string;
  body?: string;
  personalizationTokens: string[];
  expectedEngagement: number;
}

export interface EngagementScorePrediction {
  currentScore: number; // 0-100
  predictedScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  riskOfChurn: number; // 0-1
  factorsPositive: string[];
  factorsNegative: string[];
}

export interface EngagementStrategy {
  name: string;
  description: string;
  targetMetric: string;
  expectedLift: number;
  actions: StrategyAction[];
  priority: number;
}

export interface StrategyAction {
  type: string;
  details: Record<string, unknown>;
  timing?: string;
}

export interface SendTimeOptimization {
  userId: string;
  notificationType: NotificationType;
  channel: EngagementChannel;
  recommendedSlots: TimeSlot[];
  avoidSlots: TimeSlot[];
  nextOptimalTime: Date;
  confidence: number;
}

export interface TimeSlot {
  dayOfWeek: number;
  hourStart: number;
  hourEnd: number;
  score: number;
  reason: string;
}

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  size: number;
  engagementProfile: SegmentProfile;
}

export interface SegmentCriteria {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: unknown;
}

export interface SegmentProfile {
  avgEngagementScore: number;
  preferredChannel: EngagementChannel;
  peakActivityHours: number[];
  avgSessionDuration: number;
  responseRate: number;
}

export interface CampaignOptimization {
  campaignId: string;
  targetSegments: string[];
  optimalSendWindows: Map<string, TimeSlot[]>;
  channelMix: Map<EngagementChannel, number>;
  expectedMetrics: CampaignMetrics;
  recommendations: string[];
}

export interface CampaignMetrics {
  expectedOpenRate: number;
  expectedClickRate: number;
  expectedConversionRate: number;
  estimatedReach: number;
  confidenceLevel: number;
}

// ==================== Configuration ====================

interface EngagementConfig {
  defaultTimezone: string;
  analysisWindowDays: number;
  minDataPointsForPrediction: number;
  channelWeights: Record<EngagementChannel, number>;
  notificationTypeWeights: Record<NotificationType, number>;
  engagementDecayDays: number;
  minConfidenceThreshold: number;
}

const DEFAULT_CONFIG: EngagementConfig = {
  defaultTimezone: 'UTC',
  analysisWindowDays: 30,
  minDataPointsForPrediction: 10,
  channelWeights: {
    push: 1.0,
    email: 0.8,
    sms: 0.9,
    in_app: 0.7,
  },
  notificationTypeWeights: {
    reminder: 1.0,
    achievement: 0.9,
    coach_message: 1.0,
    goal_update: 0.8,
    weekly_summary: 0.7,
    session_reminder: 1.0,
    streak_alert: 0.9,
    new_feature: 0.5,
    promotional: 0.3,
  },
  engagementDecayDays: 7,
  minConfidenceThreshold: 0.6,
};

// ==================== Service ====================

export class EngagementOptimizer extends EventEmitter {
  private config: EngagementConfig;
  private behaviorCache: Map<string, UserBehavior> = new Map();
  private segmentCache: Map<string, UserSegment> = new Map();
  private recommendationCache: Map<string, EngagementRecommendation> = new Map();
  private modelVersion: string = '1.0.0';

  constructor(config: Partial<EngagementConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeDefaultSegments();
  }

  private initializeDefaultSegments(): void {
    const defaultSegments: UserSegment[] = [
      {
        id: 'highly_engaged',
        name: 'Highly Engaged',
        description: 'Users who actively engage with all features',
        criteria: [
          { field: 'engagementScore', operator: 'gte', value: 80 },
          { field: 'lastActiveWithinDays', operator: 'lte', value: 3 },
        ],
        size: 0,
        engagementProfile: {
          avgEngagementScore: 85,
          preferredChannel: 'push',
          peakActivityHours: [9, 12, 18, 21],
          avgSessionDuration: 15,
          responseRate: 0.75,
        },
      },
      {
        id: 'casual_users',
        name: 'Casual Users',
        description: 'Users with moderate engagement',
        criteria: [
          { field: 'engagementScore', operator: 'gte', value: 40 },
          { field: 'engagementScore', operator: 'lt', value: 80 },
        ],
        size: 0,
        engagementProfile: {
          avgEngagementScore: 55,
          preferredChannel: 'email',
          peakActivityHours: [10, 19, 20],
          avgSessionDuration: 8,
          responseRate: 0.45,
        },
      },
      {
        id: 'at_risk',
        name: 'At Risk',
        description: 'Users showing declining engagement',
        criteria: [
          { field: 'engagementScore', operator: 'lt', value: 40 },
          { field: 'lastActiveWithinDays', operator: 'gte', value: 7 },
        ],
        size: 0,
        engagementProfile: {
          avgEngagementScore: 25,
          preferredChannel: 'email',
          peakActivityHours: [20],
          avgSessionDuration: 3,
          responseRate: 0.2,
        },
      },
      {
        id: 'new_users',
        name: 'New Users',
        description: 'Users in their first 14 days',
        criteria: [
          { field: 'daysSinceSignup', operator: 'lte', value: 14 },
        ],
        size: 0,
        engagementProfile: {
          avgEngagementScore: 60,
          preferredChannel: 'push',
          peakActivityHours: [10, 14, 19],
          avgSessionDuration: 10,
          responseRate: 0.6,
        },
      },
      {
        id: 'power_users',
        name: 'Power Users',
        description: 'Users with very high session frequency',
        criteria: [
          { field: 'sessionsPerWeek', operator: 'gte', value: 10 },
          { field: 'engagementScore', operator: 'gte', value: 70 },
        ],
        size: 0,
        engagementProfile: {
          avgEngagementScore: 90,
          preferredChannel: 'in_app',
          peakActivityHours: [7, 9, 12, 17, 21],
          avgSessionDuration: 20,
          responseRate: 0.85,
        },
      },
    ];

    for (const segment of defaultSegments) {
      this.segmentCache.set(segment.id, segment);
    }
  }

  // ==================== Core Optimization ====================

  /**
   * Generate comprehensive engagement recommendations for a user
   */
  public async optimize(behavior: UserBehavior): Promise<EngagementRecommendation> {
    const startTime = Date.now();

    // Cache behavior
    this.behaviorCache.set(behavior.userId, behavior);

    // Analyze optimal times
    const optimalTimes = this.analyzeOptimalTimes(behavior);

    // Rank channels
    const channelRanking = this.rankChannels(behavior);

    // Generate content suggestions
    const contentSuggestions = this.generateContentSuggestions(behavior);

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(behavior);

    // Generate personalized strategies
    const personalizedStrategies = this.generateStrategies(behavior, engagementScore);

    const recommendation: EngagementRecommendation = {
      userId: behavior.userId,
      optimalTimes,
      channelRanking,
      contentSuggestions,
      engagementScore,
      personalizedStrategies,
      generatedAt: new Date(),
    };

    // Cache recommendation
    this.recommendationCache.set(behavior.userId, recommendation);

    const latency = Date.now() - startTime;
    this.emit('optimization', {
      userId: behavior.userId,
      engagementScore: engagementScore.currentScore,
      topChannel: channelRanking[0]?.channel,
      latency,
    });

    return recommendation;
  }

  /**
   * Get optimal send time for a specific notification
   */
  public getSendTimeOptimization(
    userId: string,
    notificationType: NotificationType,
    channel: EngagementChannel
  ): SendTimeOptimization {
    const behavior = this.behaviorCache.get(userId);
    const now = new Date();

    if (!behavior) {
      // Return default optimization
      return this.getDefaultSendTime(userId, notificationType, channel);
    }

    const optimalSlots = this.calculateOptimalSlots(behavior, notificationType, channel);
    const avoidSlots = this.calculateAvoidSlots(behavior);

    // Find next optimal time
    const nextOptimalTime = this.findNextOptimalTime(optimalSlots, avoidSlots, behavior.timezone);

    const confidence = this.calculateSendTimeConfidence(behavior, notificationType);

    return {
      userId,
      notificationType,
      channel,
      recommendedSlots: optimalSlots,
      avoidSlots,
      nextOptimalTime,
      confidence,
    };
  }

  // ==================== Optimal Time Analysis ====================

  private analyzeOptimalTimes(behavior: UserBehavior): OptimalTimeSlot[] {
    const slots: OptimalTimeSlot[] = [];
    const hourScores = new Map<string, { total: number; count: number }>();

    // Analyze activity history
    for (const activity of behavior.activityHistory) {
      const date = new Date(activity.timestamp);
      const dayOfWeek = date.getDay();
      const hourOfDay = date.getHours();
      const key = `${dayOfWeek}-${hourOfDay}`;

      const existing = hourScores.get(key) || { total: 0, count: 0 };
      existing.total += activity.completed ? 1 : 0.5;
      existing.count += 1;
      hourScores.set(key, existing);
    }

    // Analyze notification opens
    for (const notification of behavior.notificationHistory) {
      if (notification.opened && notification.openedAt) {
        const date = new Date(notification.openedAt);
        const dayOfWeek = date.getDay();
        const hourOfDay = date.getHours();
        const key = `${dayOfWeek}-${hourOfDay}`;

        const existing = hourScores.get(key) || { total: 0, count: 0 };
        existing.total += 1.5; // Weight opens higher
        existing.count += 1;
        hourScores.set(key, existing);
      }
    }

    // Include session patterns
    for (const pattern of behavior.sessionPatterns) {
      const key = `${pattern.dayOfWeek}-${pattern.hourOfDay}`;
      const existing = hourScores.get(key) || { total: 0, count: 0 };
      existing.total += pattern.frequency * 2; // Weight patterns high
      existing.count += pattern.frequency;
      hourScores.set(key, existing);
    }

    // Calculate scores for each slot
    hourScores.forEach((value, key) => {
      const [day, hour] = key.split('-').map(Number);
      const score = value.count > 0 ? value.total / value.count : 0;
      const normalizedScore = Math.min(1, score / 2);

      // Check if within DND hours
      const dnd = behavior.engagementPreferences.doNotDisturbHours;
      if (hour >= dnd.start && hour < dnd.end) {
        return; // Skip DND hours
      }

      slots.push({
        dayOfWeek: day,
        hourOfDay: hour,
        score: normalizedScore,
        timezone: behavior.timezone,
        utcHour: this.convertToUtc(hour, behavior.timezone),
        reason: this.getTimeSlotReason(value.count, normalizedScore),
      });
    });

    // Sort by score and return top slots
    return slots
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private calculateOptimalSlots(
    behavior: UserBehavior,
    notificationType: NotificationType,
    channel: EngagementChannel
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const typeWeight = this.config.notificationTypeWeights[notificationType];
    const channelWeight = this.config.channelWeights[channel];

    // Filter notifications by type and channel
    const relevantNotifications = behavior.notificationHistory.filter(
      n => n.type === notificationType && n.channel === channel && n.opened
    );

    // Group by day and hour window
    const windowScores = new Map<string, { opens: number; total: number }>();

    for (const notification of relevantNotifications) {
      if (notification.openedAt) {
        const date = new Date(notification.openedAt);
        const dayOfWeek = date.getDay();
        const hourStart = Math.floor(date.getHours() / 2) * 2; // 2-hour windows

        const key = `${dayOfWeek}-${hourStart}`;
        const existing = windowScores.get(key) || { opens: 0, total: 0 };
        existing.opens += 1;
        existing.total += 1;
        windowScores.set(key, existing);
      }
    }

    // Add sent but not opened to total
    for (const notification of behavior.notificationHistory) {
      if (notification.type === notificationType && notification.channel === channel && !notification.opened) {
        const date = new Date(notification.sentAt);
        const dayOfWeek = date.getDay();
        const hourStart = Math.floor(date.getHours() / 2) * 2;

        const key = `${dayOfWeek}-${hourStart}`;
        const existing = windowScores.get(key) || { opens: 0, total: 0 };
        existing.total += 1;
        windowScores.set(key, existing);
      }
    }

    windowScores.forEach((value, key) => {
      const [day, hourStart] = key.split('-').map(Number);
      const openRate = value.total > 0 ? value.opens / value.total : 0;
      const score = openRate * typeWeight * channelWeight;

      if (score > 0.2) {
        slots.push({
          dayOfWeek: day,
          hourStart,
          hourEnd: hourStart + 2,
          score,
          reason: `${(openRate * 100).toFixed(0)}% open rate for ${notificationType}`,
        });
      }
    });

    return slots.sort((a, b) => b.score - a.score);
  }

  private calculateAvoidSlots(behavior: UserBehavior): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // DND hours
    const dnd = behavior.engagementPreferences.doNotDisturbHours;
    for (let day = 0; day < 7; day++) {
      slots.push({
        dayOfWeek: day,
        hourStart: dnd.start,
        hourEnd: dnd.end,
        score: 0,
        reason: 'Do Not Disturb period',
      });
    }

    // Hours with very low engagement
    const lowEngagementHours = behavior.notificationHistory.filter(n => {
      const date = new Date(n.sentAt);
      return !n.opened && !n.unsubscribed;
    });

    const hourFailures = new Map<number, number>();
    for (const n of lowEngagementHours) {
      const hour = new Date(n.sentAt).getHours();
      hourFailures.set(hour, (hourFailures.get(hour) || 0) + 1);
    }

    hourFailures.forEach((count, hour) => {
      if (count >= 5) {
        for (let day = 0; day < 7; day++) {
          slots.push({
            dayOfWeek: day,
            hourStart: hour,
            hourEnd: hour + 1,
            score: 0,
            reason: 'Low historical engagement',
          });
        }
      }
    });

    return slots;
  }

  private findNextOptimalTime(
    optimalSlots: TimeSlot[],
    avoidSlots: TimeSlot[],
    timezone: string
  ): Date {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    // Look for optimal slot in next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDay = (currentDay + dayOffset) % 7;

      for (const slot of optimalSlots) {
        if (slot.dayOfWeek !== targetDay) continue;

        const targetHour = slot.hourStart;

        // Skip if in the past today
        if (dayOffset === 0 && targetHour <= currentHour) continue;

        // Check against avoid slots
        const isAvoided = avoidSlots.some(avoid =>
          avoid.dayOfWeek === targetDay &&
          targetHour >= avoid.hourStart &&
          targetHour < avoid.hourEnd
        );

        if (!isAvoided) {
          const nextTime = new Date(now);
          nextTime.setDate(nextTime.getDate() + dayOffset);
          nextTime.setHours(targetHour, 0, 0, 0);
          return nextTime;
        }
      }
    }

    // Default: tomorrow at 10am
    const defaultTime = new Date(now);
    defaultTime.setDate(defaultTime.getDate() + 1);
    defaultTime.setHours(10, 0, 0, 0);
    return defaultTime;
  }

  // ==================== Channel Ranking ====================

  private rankChannels(behavior: UserBehavior): ChannelRecommendation[] {
    const channels: EngagementChannel[] = ['push', 'email', 'sms', 'in_app'];
    const recommendations: ChannelRecommendation[] = [];

    for (const channel of channels) {
      // Skip unsubscribed channels
      if (behavior.engagementPreferences.unsubscribedChannels.includes(channel)) {
        continue;
      }

      const channelNotifications = behavior.notificationHistory.filter(n => n.channel === channel);

      if (channelNotifications.length === 0) {
        // No data - use defaults
        recommendations.push({
          channel,
          score: this.config.channelWeights[channel] * 0.5,
          openRate: 0.3,
          clickRate: 0.1,
          conversionRate: 0.05,
          bestForTypes: this.getDefaultBestTypes(channel),
        });
        continue;
      }

      const opened = channelNotifications.filter(n => n.opened).length;
      const clicked = channelNotifications.filter(n => n.clicked).length;
      const converted = channelNotifications.filter(n => n.converted).length;
      const total = channelNotifications.length;

      const openRate = opened / total;
      const clickRate = clicked / total;
      const conversionRate = converted / total;

      // Calculate composite score
      const score = (openRate * 0.3 + clickRate * 0.4 + conversionRate * 0.3) *
        this.config.channelWeights[channel];

      // Determine best notification types for this channel
      const typePerformance = new Map<NotificationType, number>();
      for (const n of channelNotifications) {
        if (n.opened || n.clicked) {
          typePerformance.set(n.type, (typePerformance.get(n.type) || 0) + 1);
        }
      }

      const bestForTypes = [...typePerformance.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type);

      recommendations.push({
        channel,
        score,
        openRate,
        clickRate,
        conversionRate,
        bestForTypes: bestForTypes.length > 0 ? bestForTypes : this.getDefaultBestTypes(channel),
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private getDefaultBestTypes(channel: EngagementChannel): NotificationType[] {
    switch (channel) {
      case 'push':
        return ['reminder', 'session_reminder', 'streak_alert'];
      case 'email':
        return ['weekly_summary', 'achievement', 'new_feature'];
      case 'sms':
        return ['session_reminder', 'coach_message'];
      case 'in_app':
        return ['goal_update', 'achievement', 'promotional'];
    }
  }

  // ==================== Content Suggestions ====================

  private generateContentSuggestions(behavior: UserBehavior): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    const now = new Date();

    // Based on engagement level
    const engagementScore = this.calculateRawEngagementScore(behavior);

    if (engagementScore < 30) {
      // Re-engagement content
      suggestions.push({
        type: 'reminder',
        priority: 'high',
        subject: "We miss you! Let's get back on track",
        personalizationTokens: ['{{first_name}}', '{{last_goal_name}}', '{{days_inactive}}'],
        expectedEngagement: 0.25,
      });
    }

    // Streak-based suggestions
    const streakDays = this.calculateStreakDays(behavior);
    if (streakDays >= 3 && streakDays < 7) {
      suggestions.push({
        type: 'streak_alert',
        priority: 'medium',
        subject: `${streakDays} days and counting! Keep it up`,
        personalizationTokens: ['{{first_name}}', '{{streak_days}}'],
        expectedEngagement: 0.5,
      });
    } else if (streakDays >= 7) {
      suggestions.push({
        type: 'achievement',
        priority: 'high',
        subject: `Amazing! You've hit a ${streakDays}-day streak!`,
        personalizationTokens: ['{{first_name}}', '{{streak_days}}', '{{achievement_badge}}'],
        expectedEngagement: 0.65,
      });
    }

    // Session reminder (if no recent sessions)
    const lastSession = behavior.activityHistory
      .filter(a => a.action === 'session')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (lastSession) {
      const daysSinceSession = (now.getTime() - new Date(lastSession.timestamp).getTime()) /
        (1000 * 60 * 60 * 24);

      if (daysSinceSession >= 3) {
        suggestions.push({
          type: 'session_reminder',
          priority: 'high',
          subject: 'Time for a check-in with your coach?',
          personalizationTokens: ['{{first_name}}', '{{coach_name}}', '{{days_since_session}}'],
          expectedEngagement: 0.4,
        });
      }
    }

    // Weekly summary (if engaged and hasn't received one this week)
    if (engagementScore >= 40) {
      const lastSummary = behavior.notificationHistory
        .filter(n => n.type === 'weekly_summary')
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];

      const shouldSendSummary = !lastSummary ||
        (now.getTime() - new Date(lastSummary.sentAt).getTime()) / (1000 * 60 * 60 * 24) >= 7;

      if (shouldSendSummary && now.getDay() === 0) { // Sunday
        suggestions.push({
          type: 'weekly_summary',
          priority: 'medium',
          subject: 'Your weekly progress summary is ready',
          personalizationTokens: ['{{first_name}}', '{{goals_progress}}', '{{week_highlights}}'],
          expectedEngagement: 0.55,
        });
      }
    }

    // Goal update
    suggestions.push({
      type: 'goal_update',
      priority: 'low',
      subject: 'Quick update on your goals',
      personalizationTokens: ['{{first_name}}', '{{active_goals_count}}', '{{next_milestone}}'],
      expectedEngagement: 0.35,
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // ==================== Engagement Score ====================

  private calculateEngagementScore(behavior: UserBehavior): EngagementScorePrediction {
    const currentScore = this.calculateRawEngagementScore(behavior);

    // Calculate trend
    const recentActivity = behavior.activityHistory.filter(a => {
      const age = (Date.now() - new Date(a.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return age <= 7;
    });

    const olderActivity = behavior.activityHistory.filter(a => {
      const age = (Date.now() - new Date(a.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return age > 7 && age <= 14;
    });

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentActivity.length > olderActivity.length * 1.2) {
      trend = 'improving';
    } else if (recentActivity.length < olderActivity.length * 0.8) {
      trend = 'declining';
    }

    // Predict future score
    let predictedScore = currentScore;
    if (trend === 'improving') {
      predictedScore = Math.min(100, currentScore * 1.1);
    } else if (trend === 'declining') {
      predictedScore = Math.max(0, currentScore * 0.9);
    }

    // Calculate churn risk
    const riskOfChurn = this.calculateChurnRisk(behavior, currentScore, trend);

    // Identify factors
    const factorsPositive: string[] = [];
    const factorsNegative: string[] = [];

    if (behavior.sessionPatterns.length >= 3) {
      factorsPositive.push('Consistent session patterns');
    }
    if (this.calculateStreakDays(behavior) >= 5) {
      factorsPositive.push(`${this.calculateStreakDays(behavior)}-day activity streak`);
    }
    if (behavior.engagementPreferences.preferredChannels.length > 0) {
      factorsPositive.push('Clear channel preferences set');
    }

    if (trend === 'declining') {
      factorsNegative.push('Declining activity trend');
    }
    const daysSinceActive = (Date.now() - new Date(behavior.lastActiveAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceActive > 3) {
      factorsNegative.push(`${Math.floor(daysSinceActive)} days since last activity`);
    }
    if (behavior.notificationHistory.some(n => n.unsubscribed)) {
      factorsNegative.push('Has unsubscribed from some channels');
    }

    return {
      currentScore,
      predictedScore,
      trend,
      riskOfChurn,
      factorsPositive,
      factorsNegative,
    };
  }

  private calculateRawEngagementScore(behavior: UserBehavior): number {
    let score = 0;

    // Recency (0-25 points)
    const daysSinceActive = (Date.now() - new Date(behavior.lastActiveAt).getTime()) /
      (1000 * 60 * 60 * 24);
    score += Math.max(0, 25 - daysSinceActive * 3);

    // Frequency (0-25 points)
    const recentActivities = behavior.activityHistory.filter(a => {
      const age = (Date.now() - new Date(a.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return age <= this.config.analysisWindowDays;
    });
    const activityPerDay = recentActivities.length / this.config.analysisWindowDays;
    score += Math.min(25, activityPerDay * 10);

    // Duration/Depth (0-25 points)
    const avgDuration = behavior.sessionPatterns.reduce((sum, p) => sum + p.avgDuration, 0) /
      Math.max(1, behavior.sessionPatterns.length);
    score += Math.min(25, avgDuration * 1.5);

    // Notification responsiveness (0-25 points)
    const recentNotifications = behavior.notificationHistory.filter(n => {
      const age = (Date.now() - new Date(n.sentAt).getTime()) / (1000 * 60 * 60 * 24);
      return age <= this.config.analysisWindowDays;
    });

    if (recentNotifications.length > 0) {
      const openRate = recentNotifications.filter(n => n.opened).length / recentNotifications.length;
      const clickRate = recentNotifications.filter(n => n.clicked).length / recentNotifications.length;
      score += (openRate * 15 + clickRate * 10);
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateChurnRisk(
    behavior: UserBehavior,
    engagementScore: number,
    trend: 'improving' | 'stable' | 'declining'
  ): number {
    let risk = 0;

    // Base risk from engagement score (inverted)
    risk += (100 - engagementScore) / 100 * 0.4;

    // Trend impact
    if (trend === 'declining') risk += 0.2;
    else if (trend === 'improving') risk -= 0.1;

    // Inactivity impact
    const daysSinceActive = (Date.now() - new Date(behavior.lastActiveAt).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceActive > 14) risk += 0.3;
    else if (daysSinceActive > 7) risk += 0.15;

    // Unsubscribe impact
    const unsubscribeCount = behavior.notificationHistory.filter(n => n.unsubscribed).length;
    risk += unsubscribeCount * 0.1;

    return Math.min(1, Math.max(0, risk));
  }

  // ==================== Strategy Generation ====================

  private generateStrategies(
    behavior: UserBehavior,
    engagementScore: EngagementScorePrediction
  ): EngagementStrategy[] {
    const strategies: EngagementStrategy[] = [];

    // Re-engagement strategy
    if (engagementScore.riskOfChurn > 0.5 || engagementScore.currentScore < 30) {
      strategies.push({
        name: 'Re-engagement Campaign',
        description: 'Multi-touch campaign to re-activate dormant user',
        targetMetric: 'session_start',
        expectedLift: 0.25,
        priority: 1,
        actions: [
          { type: 'send_personalized_email', details: { template: 'we_miss_you' } },
          { type: 'trigger_push_notification', details: { delay: '2d' }, timing: '2 days after email' },
          { type: 'in_app_message', details: { trigger: 'next_open' } },
        ],
      });
    }

    // Streak building
    if (engagementScore.currentScore >= 40 && engagementScore.currentScore < 70) {
      strategies.push({
        name: 'Streak Builder',
        description: 'Encourage daily engagement through streak mechanics',
        targetMetric: 'daily_active_days',
        expectedLift: 0.35,
        priority: 2,
        actions: [
          { type: 'enable_streak_notifications', details: { threshold: 3 } },
          { type: 'show_streak_ui', details: { prominent: true } },
          { type: 'streak_milestone_rewards', details: { milestones: [7, 14, 30] } },
        ],
      });
    }

    // Power user cultivation
    if (engagementScore.currentScore >= 70) {
      strategies.push({
        name: 'Power User Cultivation',
        description: 'Deepen engagement and encourage advocacy',
        targetMetric: 'feature_adoption',
        expectedLift: 0.2,
        priority: 3,
        actions: [
          { type: 'unlock_advanced_features', details: { features: ['analytics', 'export'] } },
          { type: 'request_review', details: { delay: '7d' }, timing: 'After 7 days of high engagement' },
          { type: 'invite_to_beta', details: { program: 'early_access' } },
        ],
      });
    }

    // Channel optimization
    const preferredChannel = behavior.engagementPreferences.preferredChannels[0];
    if (preferredChannel) {
      strategies.push({
        name: 'Channel Optimization',
        description: `Focus communications on ${preferredChannel}`,
        targetMetric: 'notification_open_rate',
        expectedLift: 0.15,
        priority: 4,
        actions: [
          { type: 'prioritize_channel', details: { channel: preferredChannel } },
          { type: 'reduce_secondary_channels', details: { reduce_by: 0.5 } },
        ],
      });
    }

    // Time optimization
    strategies.push({
      name: 'Optimal Timing',
      description: 'Send messages at personalized optimal times',
      targetMetric: 'notification_click_rate',
      expectedLift: 0.2,
      priority: 5,
      actions: [
        { type: 'enable_send_time_optimization', details: { model: 'personalized' } },
        { type: 'batch_notifications', details: { max_per_day: 3 } },
      ],
    });

    return strategies.sort((a, b) => a.priority - b.priority);
  }

  // ==================== Campaign Optimization ====================

  /**
   * Optimize a campaign for target segments
   */
  public optimizeCampaign(
    campaignId: string,
    targetSegmentIds: string[],
    notificationType: NotificationType
  ): CampaignOptimization {
    const segments = targetSegmentIds
      .map(id => this.segmentCache.get(id))
      .filter((s): s is UserSegment => s !== undefined);

    const optimalSendWindows = new Map<string, TimeSlot[]>();
    const channelMix = new Map<EngagementChannel, number>();

    for (const segment of segments) {
      // Calculate optimal windows per segment
      const windows: TimeSlot[] = [];
      for (const hour of segment.engagementProfile.peakActivityHours) {
        windows.push({
          dayOfWeek: -1, // All days
          hourStart: hour,
          hourEnd: hour + 1,
          score: 0.8,
          reason: `Peak activity hour for ${segment.name}`,
        });
      }
      optimalSendWindows.set(segment.id, windows);

      // Aggregate channel preferences
      const channel = segment.engagementProfile.preferredChannel;
      channelMix.set(channel, (channelMix.get(channel) || 0) + segment.size);
    }

    // Normalize channel mix
    const totalSize = segments.reduce((sum, s) => sum + s.size, 0);
    channelMix.forEach((size, channel) => {
      channelMix.set(channel, size / (totalSize || 1));
    });

    // Estimate metrics
    const avgResponseRate = segments.reduce(
      (sum, s) => sum + s.engagementProfile.responseRate * s.size,
      0
    ) / (totalSize || 1);

    const expectedMetrics: CampaignMetrics = {
      expectedOpenRate: avgResponseRate * 0.8,
      expectedClickRate: avgResponseRate * 0.3,
      expectedConversionRate: avgResponseRate * 0.1,
      estimatedReach: totalSize,
      confidenceLevel: segments.length >= 2 ? 0.8 : 0.6,
    };

    const recommendations: string[] = [];
    if (channelMix.size > 2) {
      recommendations.push('Consider multi-channel approach for broader reach');
    }
    if (avgResponseRate < 0.3) {
      recommendations.push('Consider re-engagement campaign before main send');
    }

    return {
      campaignId,
      targetSegments: targetSegmentIds,
      optimalSendWindows,
      channelMix,
      expectedMetrics,
      recommendations,
    };
  }

  // ==================== Utility Methods ====================

  private getDefaultSendTime(
    userId: string,
    notificationType: NotificationType,
    channel: EngagementChannel
  ): SendTimeOptimization {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    return {
      userId,
      notificationType,
      channel,
      recommendedSlots: [
        { dayOfWeek: -1, hourStart: 9, hourEnd: 11, score: 0.7, reason: 'Default morning window' },
        { dayOfWeek: -1, hourStart: 18, hourEnd: 20, score: 0.6, reason: 'Default evening window' },
      ],
      avoidSlots: [
        { dayOfWeek: -1, hourStart: 22, hourEnd: 7, score: 0, reason: 'Default quiet hours' },
      ],
      nextOptimalTime: tomorrow,
      confidence: 0.3,
    };
  }

  private calculateSendTimeConfidence(behavior: UserBehavior, notificationType: NotificationType): number {
    const relevantNotifications = behavior.notificationHistory.filter(n => n.type === notificationType);

    if (relevantNotifications.length < this.config.minDataPointsForPrediction) {
      return 0.3;
    }

    const dataPoints = relevantNotifications.length;
    const baseConfidence = Math.min(0.9, 0.3 + dataPoints * 0.03);

    // Adjust for recency
    const recentNotifications = relevantNotifications.filter(n => {
      const age = (Date.now() - new Date(n.sentAt).getTime()) / (1000 * 60 * 60 * 24);
      return age <= this.config.analysisWindowDays;
    });

    const recencyFactor = recentNotifications.length / relevantNotifications.length;

    return baseConfidence * (0.7 + recencyFactor * 0.3);
  }

  private calculateStreakDays(behavior: UserBehavior): number {
    const activities = behavior.activityHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (activities.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const hasActivity = activities.some(a => {
        const activityDate = new Date(a.timestamp);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate.getTime() === currentDate.getTime();
      });

      if (hasActivity) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (i === 0) {
        // No activity today - check yesterday
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    return streak;
  }

  private convertToUtc(hour: number, timezone: string): number {
    // Simplified UTC conversion (in production, use proper timezone library)
    const timezoneOffsets: Record<string, number> = {
      'UTC': 0,
      'America/New_York': -5,
      'America/Los_Angeles': -8,
      'Europe/London': 0,
      'Europe/Paris': 1,
      'Asia/Tokyo': 9,
      'Asia/Jakarta': 7,
      'Australia/Sydney': 10,
    };

    const offset = timezoneOffsets[timezone] || 0;
    return (hour - offset + 24) % 24;
  }

  private getTimeSlotReason(count: number, score: number): string {
    if (score >= 0.8) return 'Highly active time period';
    if (score >= 0.6) return 'Good engagement time';
    if (score >= 0.4) return 'Moderate activity observed';
    return 'Some activity detected';
  }

  /**
   * Get all segments
   */
  public getSegments(): UserSegment[] {
    return Array.from(this.segmentCache.values());
  }

  /**
   * Add or update a segment
   */
  public upsertSegment(segment: UserSegment): void {
    this.segmentCache.set(segment.id, segment);
    this.emit('segmentUpdated', { segmentId: segment.id });
  }

  /**
   * Get cached recommendation
   */
  public getCachedRecommendation(userId: string): EngagementRecommendation | null {
    return this.recommendationCache.get(userId) || null;
  }

  /**
   * Clear caches
   */
  public clearCaches(): void {
    this.behaviorCache.clear();
    this.recommendationCache.clear();
    this.emit('cachesCleared');
  }

  /**
   * Get model version
   */
  public getModelVersion(): string {
    return this.modelVersion;
  }
}

// ==================== Export ====================

export const engagementOptimizer = new EngagementOptimizer();

export function createEngagementOptimizer(config?: Partial<EngagementConfig>): EngagementOptimizer {
  return new EngagementOptimizer(config);
}

export default EngagementOptimizer;
