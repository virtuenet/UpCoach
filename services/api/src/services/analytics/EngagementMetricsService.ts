/**
 * Engagement Metrics Service
 * Track user engagement, retention, and platform usage analytics
 */

import { AnalyticsPeriod, TrendDataPoint } from './CoachAnalyticsService';

/**
 * User engagement metrics
 */
export interface UserEngagementMetrics {
  userId: string;
  period: AnalyticsPeriod;

  // Activity metrics
  totalLogins: number;
  uniqueActiveDays: number;
  averageSessionDuration: number;
  totalTimeSpent: number;

  // Feature usage
  habitsChecked: number;
  goalsUpdated: number;
  sessionsAttended: number;
  messagesExchanged: number;
  contentViewed: number;

  // Engagement scores
  overallEngagementScore: number;
  consistencyScore: number;
  progressScore: number;
  interactionScore: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  streakHistory: Array<{ startDate: Date; endDate: Date; length: number }>;

  // Comparisons
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  comparedToAverage: number; // percentage above/below average
}

/**
 * Platform engagement overview
 */
export interface PlatformEngagementOverview {
  period: AnalyticsPeriod;

  // User metrics
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;

  // Engagement rates
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  dauMauRatio: number;

  // Retention
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;

  // Feature adoption
  featureAdoption: Array<{
    feature: string;
    usageCount: number;
    uniqueUsers: number;
    adoptionRate: number;
  }>;

  // Session metrics
  averageSessionLength: number;
  sessionsPerUser: number;
  bounceRate: number;
}

/**
 * Cohort analysis
 */
export interface CohortAnalysis {
  cohortDate: string;
  totalUsers: number;
  retention: number[];
  revenue: number[];
  engagement: number[];
}

/**
 * User segment
 */
export interface UserSegment {
  name: string;
  description: string;
  userCount: number;
  percentage: number;
  averageEngagement: number;
  averageRevenue: number;
  characteristics: string[];
}

/**
 * Engagement event
 */
export interface EngagementEvent {
  eventType: string;
  timestamp: Date;
  userId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Engagement Metrics Service
 */
export class EngagementMetricsService {
  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(
    userId: string,
    period: AnalyticsPeriod = 'month'
  ): Promise<UserEngagementMetrics> {
    // Mock implementation
    const baseEngagement = 50 + Math.random() * 50;

    return {
      userId,
      period,

      totalLogins: Math.floor(20 + Math.random() * 30),
      uniqueActiveDays: Math.floor(15 + Math.random() * 15),
      averageSessionDuration: Math.floor(10 + Math.random() * 20),
      totalTimeSpent: Math.floor(300 + Math.random() * 500),

      habitsChecked: Math.floor(50 + Math.random() * 100),
      goalsUpdated: Math.floor(10 + Math.random() * 20),
      sessionsAttended: Math.floor(3 + Math.random() * 5),
      messagesExchanged: Math.floor(20 + Math.random() * 50),
      contentViewed: Math.floor(15 + Math.random() * 30),

      overallEngagementScore: baseEngagement,
      consistencyScore: baseEngagement - 5 + Math.random() * 10,
      progressScore: baseEngagement - 10 + Math.random() * 20,
      interactionScore: baseEngagement + Math.random() * 15,

      currentStreak: Math.floor(Math.random() * 30),
      longestStreak: Math.floor(30 + Math.random() * 60),
      streakHistory: [
        {
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          length: 30,
        },
        {
          startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          length: 20,
        },
      ],

      engagementTrend: baseEngagement > 70 ? 'increasing' : baseEngagement > 50 ? 'stable' : 'decreasing',
      comparedToAverage: Math.round((baseEngagement - 65) / 65 * 100),
    };
  }

  /**
   * Get platform engagement overview
   */
  async getPlatformEngagementOverview(
    period: AnalyticsPeriod = 'month'
  ): Promise<PlatformEngagementOverview> {
    // Mock implementation
    return {
      period,

      totalUsers: 12500,
      activeUsers: 8750,
      newUsers: 1250,
      returningUsers: 7500,

      dailyActiveUsers: 2500,
      weeklyActiveUsers: 6500,
      monthlyActiveUsers: 8750,
      dauMauRatio: 0.286, // 28.6%

      day1Retention: 72,
      day7Retention: 58,
      day30Retention: 42,

      featureAdoption: [
        { feature: 'Habit Tracking', usageCount: 45000, uniqueUsers: 7200, adoptionRate: 82.3 },
        { feature: 'Goal Setting', usageCount: 12000, uniqueUsers: 5500, adoptionRate: 62.9 },
        { feature: 'Coaching Sessions', usageCount: 8500, uniqueUsers: 3200, adoptionRate: 36.6 },
        { feature: 'AI Coach', usageCount: 32000, uniqueUsers: 6100, adoptionRate: 69.7 },
        { feature: 'Community', usageCount: 18000, uniqueUsers: 4800, adoptionRate: 54.9 },
        { feature: 'Challenges', usageCount: 6500, uniqueUsers: 2100, adoptionRate: 24.0 },
      ],

      averageSessionLength: 12.5,
      sessionsPerUser: 4.2,
      bounceRate: 18.5,
    };
  }

  /**
   * Get engagement trends
   */
  async getEngagementTrends(
    metric: 'dau' | 'engagement_score' | 'retention' | 'session_length',
    period: AnalyticsPeriod = 'month',
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<TrendDataPoint[]> {
    const points: TrendDataPoint[] = [];
    const { startDate, endDate } = this.getPeriodDates(period);

    const intervalDays = granularity === 'day' ? 1 : granularity === 'week' ? 7 : 30;
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const numPoints = Math.ceil(totalDays / intervalDays);

    for (let i = 0; i < numPoints; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * intervalDays);

      let value: number;
      switch (metric) {
        case 'dau':
          value = 2000 + Math.floor(Math.random() * 1000);
          break;
        case 'engagement_score':
          value = 60 + Math.random() * 20;
          break;
        case 'retention':
          value = 40 + Math.random() * 20;
          break;
        case 'session_length':
          value = 10 + Math.random() * 8;
          break;
        default:
          value = 0;
      }

      points.push({ date, value });
    }

    return points;
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(
    cohortType: 'weekly' | 'monthly' = 'weekly',
    numCohorts: number = 8
  ): Promise<CohortAnalysis[]> {
    const cohorts: CohortAnalysis[] = [];

    for (let i = 0; i < numCohorts; i++) {
      const date = new Date();
      if (cohortType === 'weekly') {
        date.setDate(date.getDate() - i * 7);
      } else {
        date.setMonth(date.getMonth() - i);
      }

      const totalUsers = 200 + Math.floor(Math.random() * 100);
      const maxWeeks = Math.min(8, i + 1);

      // Generate retention curve (typically decreasing)
      const retention: number[] = [];
      const revenue: number[] = [];
      const engagement: number[] = [];

      let retentionRate = 100;
      for (let week = 0; week < maxWeeks; week++) {
        retentionRate = week === 0 ? 100 : retentionRate * (0.7 + Math.random() * 0.2);
        retention.push(Math.round(retentionRate));
        revenue.push(Math.round(totalUsers * (retentionRate / 100) * 50));
        engagement.push(Math.round(60 + Math.random() * 30));
      }

      cohorts.push({
        cohortDate: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        totalUsers,
        retention,
        revenue,
        engagement,
      });
    }

    return cohorts;
  }

  /**
   * Get user segments
   */
  async getUserSegments(): Promise<UserSegment[]> {
    return [
      {
        name: 'Power Users',
        description: 'Highly engaged users with daily activity',
        userCount: 1250,
        percentage: 10,
        averageEngagement: 92,
        averageRevenue: 85,
        characteristics: [
          'Daily logins',
          '90%+ habit completion',
          'Regular coaching sessions',
          'Community contributors',
        ],
      },
      {
        name: 'Active Users',
        description: 'Regularly engaged with consistent usage',
        userCount: 3750,
        percentage: 30,
        averageEngagement: 72,
        averageRevenue: 55,
        characteristics: [
          '4-5 logins per week',
          '70-90% habit completion',
          'Monthly coaching sessions',
          'Occasional community engagement',
        ],
      },
      {
        name: 'Casual Users',
        description: 'Sporadic engagement patterns',
        userCount: 4375,
        percentage: 35,
        averageEngagement: 45,
        averageRevenue: 25,
        characteristics: [
          '1-3 logins per week',
          '40-70% habit completion',
          'Quarterly coaching sessions',
          'Low community participation',
        ],
      },
      {
        name: 'At-Risk Users',
        description: 'Low engagement, potential churn',
        userCount: 2500,
        percentage: 20,
        averageEngagement: 22,
        averageRevenue: 10,
        characteristics: [
          'Less than weekly logins',
          'Under 40% habit completion',
          'No recent sessions',
          'Declining activity trend',
        ],
      },
      {
        name: 'Dormant Users',
        description: 'Inactive for extended period',
        userCount: 625,
        percentage: 5,
        averageEngagement: 5,
        averageRevenue: 0,
        characteristics: [
          'No login in 30+ days',
          'No habit completions',
          'Cancelled subscriptions',
          'Churned',
        ],
      },
    ];
  }

  /**
   * Get engagement heatmap data
   */
  async getEngagementHeatmap(
    userId: string,
    weeks: number = 12
  ): Promise<Array<{ date: string; value: number }>> {
    const data: Array<{ date: string; value: number }> = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    for (let i = 0; i < weeks * 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Higher engagement on weekdays
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseValue = isWeekend ? 2 : 4;
      const value = Math.floor(Math.random() * baseValue) + (isWeekend ? 0 : 1);

      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.min(5, value), // Scale 0-5
      });
    }

    return data;
  }

  /**
   * Get feature usage breakdown
   */
  async getFeatureUsageBreakdown(
    userId: string,
    period: AnalyticsPeriod = 'month'
  ): Promise<Array<{
    feature: string;
    usageCount: number;
    timeSpent: number;
    lastUsed: Date;
    trend: number;
  }>> {
    return [
      {
        feature: 'Habit Tracker',
        usageCount: 85,
        timeSpent: 120,
        lastUsed: new Date(),
        trend: 12,
      },
      {
        feature: 'Goals',
        usageCount: 24,
        timeSpent: 45,
        lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        trend: 5,
      },
      {
        feature: 'AI Coach',
        usageCount: 42,
        timeSpent: 180,
        lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        trend: 28,
      },
      {
        feature: 'Sessions',
        usageCount: 4,
        timeSpent: 240,
        lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        trend: 0,
      },
      {
        feature: 'Community',
        usageCount: 18,
        timeSpent: 35,
        lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        trend: -8,
      },
      {
        feature: 'Challenges',
        usageCount: 12,
        timeSpent: 25,
        lastUsed: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        trend: 15,
      },
    ];
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(metrics: {
    logins: number;
    activeDays: number;
    habitsCompleted: number;
    goalsProgress: number;
    sessionsAttended: number;
    messagesCount: number;
  }): number {
    const weights = {
      logins: 0.1,
      activeDays: 0.2,
      habitsCompleted: 0.25,
      goalsProgress: 0.2,
      sessionsAttended: 0.15,
      messagesCount: 0.1,
    };

    // Normalize each metric to 0-100 scale
    const normalized = {
      logins: Math.min(100, (metrics.logins / 30) * 100),
      activeDays: Math.min(100, (metrics.activeDays / 30) * 100),
      habitsCompleted: Math.min(100, metrics.habitsCompleted),
      goalsProgress: Math.min(100, metrics.goalsProgress),
      sessionsAttended: Math.min(100, (metrics.sessionsAttended / 4) * 100),
      messagesCount: Math.min(100, (metrics.messagesCount / 50) * 100),
    };

    // Calculate weighted score
    const score =
      normalized.logins * weights.logins +
      normalized.activeDays * weights.activeDays +
      normalized.habitsCompleted * weights.habitsCompleted +
      normalized.goalsProgress * weights.goalsProgress +
      normalized.sessionsAttended * weights.sessionsAttended +
      normalized.messagesCount * weights.messagesCount;

    return Math.round(score);
  }

  /**
   * Track engagement event
   */
  async trackEvent(event: EngagementEvent): Promise<void> {
    // In production, this would store the event
    console.log('Engagement event tracked:', event);
  }

  /**
   * Get engagement insights
   */
  async getEngagementInsights(userId: string): Promise<Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    action?: string;
  }>> {
    const metrics = await this.getUserEngagementMetrics(userId, 'month');

    const insights: Array<{
      type: 'positive' | 'negative' | 'neutral';
      title: string;
      description: string;
      action?: string;
    }> = [];

    if (metrics.currentStreak >= 7) {
      insights.push({
        type: 'positive',
        title: `${metrics.currentStreak} Day Streak!`,
        description: 'Great consistency! Keep it up to build lasting habits.',
      });
    }

    if (metrics.engagementTrend === 'increasing') {
      insights.push({
        type: 'positive',
        title: 'Engagement Growing',
        description: 'Your activity has increased compared to last month.',
      });
    }

    if (metrics.consistencyScore < 50) {
      insights.push({
        type: 'negative',
        title: 'Consistency Opportunity',
        description: 'Try to maintain a more regular schedule for better results.',
        action: 'Set reminders',
      });
    }

    if (metrics.sessionsAttended < 2) {
      insights.push({
        type: 'neutral',
        title: 'Book a Session',
        description: 'Coaching sessions can accelerate your progress.',
        action: 'Find a coach',
      });
    }

    return insights;
  }

  // Private helper methods

  private getPeriodDates(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(2020, 0, 1);
        break;
    }

    return { startDate, endDate };
  }
}

/**
 * Create engagement metrics service instance
 */
export function createEngagementMetricsService(): EngagementMetricsService {
  return new EngagementMetricsService();
}

export default EngagementMetricsService;
