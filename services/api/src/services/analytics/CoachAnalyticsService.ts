/**
 * Coach Analytics Service
 * Comprehensive analytics for coach performance and metrics
 */

import { Op } from 'sequelize';

/**
 * Time period for analytics
 */
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * Coach performance metrics
 */
export interface CoachPerformanceMetrics {
  coachId: string;
  period: AnalyticsPeriod;
  periodStart: Date;
  periodEnd: Date;

  // Session metrics
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  sessionCompletionRate: number;
  averageSessionDuration: number;
  totalSessionHours: number;

  // Client metrics
  totalClients: number;
  activeClients: number;
  newClients: number;
  churnedClients: number;
  clientRetentionRate: number;
  averageClientLifespan: number;

  // Rating metrics
  averageRating: number;
  totalReviews: number;
  fiveStarReviews: number;
  ratingDistribution: Record<number, number>;
  npsScore: number;

  // Engagement metrics
  responseTime: number; // average in minutes
  messagesSent: number;
  messagesReceived: number;
  engagementScore: number;

  // Goal metrics
  goalsCreated: number;
  goalsCompleted: number;
  goalCompletionRate: number;
  averageGoalDuration: number;
}

/**
 * Client progress overview
 */
export interface ClientProgressOverview {
  clientId: string;
  clientName: string;
  joinedAt: Date;
  lastActiveAt: Date;

  // Progress metrics
  overallProgress: number;
  goalsCompleted: number;
  goalsInProgress: number;
  habitsActive: number;
  habitCompletionRate: number;
  currentStreak: number;
  longestStreak: number;

  // Session history
  totalSessions: number;
  upcomingSessions: number;
  lastSessionDate?: Date;

  // Engagement
  engagementLevel: 'high' | 'medium' | 'low' | 'at_risk';
  engagementScore: number;
  lastMessageDate?: Date;

  // Trends
  progressTrend: 'improving' | 'stable' | 'declining';
  riskFactors: string[];
}

/**
 * Session analytics
 */
export interface SessionAnalytics {
  totalSessions: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  byTimeSlot: Record<string, number>;
  peakHours: string[];
  averageDuration: number;
  completionRate: number;
  cancellationReasons: Array<{ reason: string; count: number }>;
}

/**
 * Trend data point
 */
export interface TrendDataPoint {
  date: Date;
  value: number;
  label?: string;
}

/**
 * Coach comparison metrics
 */
export interface CoachBenchmark {
  metric: string;
  coachValue: number;
  platformAverage: number;
  topPerformerValue: number;
  percentile: number;
}

/**
 * Coach Analytics Service
 */
export class CoachAnalyticsService {
  /**
   * Get coach performance metrics
   */
  async getPerformanceMetrics(
    coachId: string,
    period: AnalyticsPeriod = 'month'
  ): Promise<CoachPerformanceMetrics> {
    const { startDate, endDate } = this.getPeriodDates(period);

    // In production, these would be actual database queries
    const sessionMetrics = await this.calculateSessionMetrics(coachId, startDate, endDate);
    const clientMetrics = await this.calculateClientMetrics(coachId, startDate, endDate);
    const ratingMetrics = await this.calculateRatingMetrics(coachId, startDate, endDate);
    const engagementMetrics = await this.calculateEngagementMetrics(coachId, startDate, endDate);
    const goalMetrics = await this.calculateGoalMetrics(coachId, startDate, endDate);

    return {
      coachId,
      period,
      periodStart: startDate,
      periodEnd: endDate,
      ...sessionMetrics,
      ...clientMetrics,
      ...ratingMetrics,
      ...engagementMetrics,
      ...goalMetrics,
    };
  }

  /**
   * Get client progress overview for a coach
   */
  async getClientProgressOverview(
    coachId: string,
    options: {
      limit?: number;
      sortBy?: 'progress' | 'engagement' | 'risk' | 'recent';
      filterEngagement?: 'high' | 'medium' | 'low' | 'at_risk';
    } = {}
  ): Promise<ClientProgressOverview[]> {
    const { limit = 50, sortBy = 'recent', filterEngagement } = options;

    // Mock implementation - would query actual client data
    const clients = await this.fetchCoachClients(coachId);

    let overviews: ClientProgressOverview[] = clients.map(client =>
      this.calculateClientOverview(client)
    );

    // Filter by engagement level
    if (filterEngagement) {
      overviews = overviews.filter(c => c.engagementLevel === filterEngagement);
    }

    // Sort
    switch (sortBy) {
      case 'progress':
        overviews.sort((a, b) => b.overallProgress - a.overallProgress);
        break;
      case 'engagement':
        overviews.sort((a, b) => b.engagementScore - a.engagementScore);
        break;
      case 'risk':
        overviews.sort((a, b) => {
          const riskOrder = { at_risk: 0, low: 1, medium: 2, high: 3 };
          return riskOrder[a.engagementLevel] - riskOrder[b.engagementLevel];
        });
        break;
      case 'recent':
      default:
        overviews.sort((a, b) =>
          new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
        );
    }

    return overviews.slice(0, limit);
  }

  /**
   * Get at-risk clients
   */
  async getAtRiskClients(coachId: string): Promise<ClientProgressOverview[]> {
    return this.getClientProgressOverview(coachId, {
      filterEngagement: 'at_risk',
      sortBy: 'risk',
    });
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(
    coachId: string,
    period: AnalyticsPeriod = 'month'
  ): Promise<SessionAnalytics> {
    const { startDate, endDate } = this.getPeriodDates(period);

    // Mock implementation
    return {
      totalSessions: 48,
      byType: {
        'one_on_one': 32,
        'group': 10,
        'workshop': 6,
      },
      byStatus: {
        'completed': 42,
        'cancelled': 4,
        'no_show': 2,
      },
      byDayOfWeek: {
        'Monday': 10,
        'Tuesday': 12,
        'Wednesday': 8,
        'Thursday': 10,
        'Friday': 6,
        'Saturday': 2,
        'Sunday': 0,
      },
      byTimeSlot: {
        '08:00-10:00': 8,
        '10:00-12:00': 15,
        '12:00-14:00': 5,
        '14:00-16:00': 12,
        '16:00-18:00': 6,
        '18:00-20:00': 2,
      },
      peakHours: ['10:00-12:00', '14:00-16:00'],
      averageDuration: 52,
      completionRate: 87.5,
      cancellationReasons: [
        { reason: 'Client request', count: 2 },
        { reason: 'Schedule conflict', count: 1 },
        { reason: 'Technical issues', count: 1 },
      ],
    };
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(
    coachId: string,
    metric: 'sessions' | 'clients' | 'revenue' | 'rating',
    period: AnalyticsPeriod = 'month',
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<TrendDataPoint[]> {
    const { startDate, endDate } = this.getPeriodDates(period);
    const points: TrendDataPoint[] = [];

    // Generate mock trend data
    const daysInPeriod = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const interval = granularity === 'day' ? 1 : granularity === 'week' ? 7 : 30;
    const numPoints = Math.ceil(daysInPeriod / interval);

    for (let i = 0; i < numPoints; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * interval);

      let value: number;
      switch (metric) {
        case 'sessions':
          value = Math.floor(Math.random() * 10) + 5;
          break;
        case 'clients':
          value = Math.floor(Math.random() * 5) + 20;
          break;
        case 'revenue':
          value = Math.floor(Math.random() * 500) + 1000;
          break;
        case 'rating':
          value = 4 + Math.random() * 0.8;
          break;
        default:
          value = 0;
      }

      points.push({ date, value });
    }

    return points;
  }

  /**
   * Get coach benchmarks compared to platform averages
   */
  async getCoachBenchmarks(coachId: string): Promise<CoachBenchmark[]> {
    // Mock benchmarks - would calculate from actual platform data
    return [
      {
        metric: 'Session Completion Rate',
        coachValue: 92,
        platformAverage: 85,
        topPerformerValue: 98,
        percentile: 78,
      },
      {
        metric: 'Client Retention Rate',
        coachValue: 88,
        platformAverage: 75,
        topPerformerValue: 95,
        percentile: 82,
      },
      {
        metric: 'Average Rating',
        coachValue: 4.7,
        platformAverage: 4.3,
        topPerformerValue: 4.95,
        percentile: 75,
      },
      {
        metric: 'Response Time (hours)',
        coachValue: 2.5,
        platformAverage: 8,
        topPerformerValue: 1,
        percentile: 85,
      },
      {
        metric: 'Goal Completion Rate',
        coachValue: 76,
        platformAverage: 65,
        topPerformerValue: 88,
        percentile: 72,
      },
      {
        metric: 'Engagement Score',
        coachValue: 85,
        platformAverage: 70,
        topPerformerValue: 95,
        percentile: 80,
      },
    ];
  }

  /**
   * Get coach dashboard summary
   */
  async getDashboardSummary(coachId: string): Promise<{
    metrics: CoachPerformanceMetrics;
    trends: {
      sessions: TrendDataPoint[];
      revenue: TrendDataPoint[];
      rating: TrendDataPoint[];
    };
    atRiskClients: ClientProgressOverview[];
    upcomingSessions: number;
    pendingMessages: number;
    benchmarks: CoachBenchmark[];
  }> {
    const [metrics, sessionTrends, revenueTrends, ratingTrends, atRiskClients, benchmarks] =
      await Promise.all([
        this.getPerformanceMetrics(coachId, 'month'),
        this.getPerformanceTrends(coachId, 'sessions', 'month', 'day'),
        this.getPerformanceTrends(coachId, 'revenue', 'month', 'day'),
        this.getPerformanceTrends(coachId, 'rating', 'month', 'week'),
        this.getAtRiskClients(coachId),
        this.getCoachBenchmarks(coachId),
      ]);

    return {
      metrics,
      trends: {
        sessions: sessionTrends,
        revenue: revenueTrends,
        rating: ratingTrends,
      },
      atRiskClients,
      upcomingSessions: 8, // Mock
      pendingMessages: 12, // Mock
      benchmarks,
    };
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

  private async calculateSessionMetrics(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Partial<CoachPerformanceMetrics>> {
    // Mock implementation
    return {
      totalSessions: 48,
      completedSessions: 42,
      cancelledSessions: 6,
      sessionCompletionRate: 87.5,
      averageSessionDuration: 52,
      totalSessionHours: 36.4,
    };
  }

  private async calculateClientMetrics(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Partial<CoachPerformanceMetrics>> {
    // Mock implementation
    return {
      totalClients: 28,
      activeClients: 22,
      newClients: 5,
      churnedClients: 2,
      clientRetentionRate: 88,
      averageClientLifespan: 6.5, // months
    };
  }

  private async calculateRatingMetrics(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Partial<CoachPerformanceMetrics>> {
    // Mock implementation
    return {
      averageRating: 4.7,
      totalReviews: 35,
      fiveStarReviews: 28,
      ratingDistribution: {
        5: 28,
        4: 5,
        3: 2,
        2: 0,
        1: 0,
      },
      npsScore: 72,
    };
  }

  private async calculateEngagementMetrics(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Partial<CoachPerformanceMetrics>> {
    // Mock implementation
    return {
      responseTime: 2.5, // hours
      messagesSent: 245,
      messagesReceived: 312,
      engagementScore: 85,
    };
  }

  private async calculateGoalMetrics(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Partial<CoachPerformanceMetrics>> {
    // Mock implementation
    return {
      goalsCreated: 32,
      goalsCompleted: 24,
      goalCompletionRate: 75,
      averageGoalDuration: 45, // days
    };
  }

  private async fetchCoachClients(coachId: string): Promise<any[]> {
    // Mock implementation
    return Array.from({ length: 28 }, (_, i) => ({
      id: `client-${i + 1}`,
      name: `Client ${i + 1}`,
      joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    }));
  }

  private calculateClientOverview(client: any): ClientProgressOverview {
    const daysSinceActive = Math.floor(
      (Date.now() - new Date(client.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    let engagementLevel: 'high' | 'medium' | 'low' | 'at_risk';
    let engagementScore: number;

    if (daysSinceActive <= 2) {
      engagementLevel = 'high';
      engagementScore = 85 + Math.random() * 15;
    } else if (daysSinceActive <= 5) {
      engagementLevel = 'medium';
      engagementScore = 60 + Math.random() * 25;
    } else if (daysSinceActive <= 10) {
      engagementLevel = 'low';
      engagementScore = 35 + Math.random() * 25;
    } else {
      engagementLevel = 'at_risk';
      engagementScore = 10 + Math.random() * 25;
    }

    const riskFactors: string[] = [];
    if (daysSinceActive > 7) riskFactors.push('No recent activity');
    if (engagementScore < 50) riskFactors.push('Low engagement score');

    return {
      clientId: client.id,
      clientName: client.name,
      joinedAt: client.joinedAt,
      lastActiveAt: client.lastActiveAt,
      overallProgress: Math.floor(Math.random() * 100),
      goalsCompleted: Math.floor(Math.random() * 10),
      goalsInProgress: Math.floor(Math.random() * 5) + 1,
      habitsActive: Math.floor(Math.random() * 8) + 1,
      habitCompletionRate: 50 + Math.random() * 50,
      currentStreak: Math.floor(Math.random() * 30),
      longestStreak: Math.floor(Math.random() * 60) + 10,
      totalSessions: Math.floor(Math.random() * 20) + 5,
      upcomingSessions: Math.floor(Math.random() * 3),
      lastSessionDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      engagementLevel,
      engagementScore,
      lastMessageDate: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
      progressTrend: Math.random() > 0.3 ? 'improving' : Math.random() > 0.5 ? 'stable' : 'declining',
      riskFactors,
    };
  }
}

/**
 * Create coach analytics service instance
 */
export function createCoachAnalyticsService(): CoachAnalyticsService {
  return new CoachAnalyticsService();
}

export default CoachAnalyticsService;
