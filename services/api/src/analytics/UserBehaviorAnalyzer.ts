import { EventEmitter } from 'events';

export interface UserBehaviorMetrics {
  userId: string;
  sessionDuration: number;
  actionsPerSession: number;
  featuresUsed: string[];
  conversionEvents: ConversionEvent[];
  retentionScore: number;
  engagementScore: number;
  churnProbability: number;
  lastActiveAt: Date;
  totalSessions: number;
}

export interface ConversionEvent {
  type: ConversionType;
  timestamp: Date;
  value?: number;
  metadata?: Record<string, any>;
}

export enum ConversionType {
  SIGNUP = 'signup',
  GOAL_CREATED = 'goal_created',
  HABIT_CREATED = 'habit_created',
  FIRST_LOG = 'first_log',
  PREMIUM_UPGRADE = 'premium_upgrade',
  REFERRAL = 'referral',
  MILESTONE_REACHED = 'milestone_reached',
}

export interface CohortAnalytics {
  cohortId: string;
  cohortName: string;
  cohortDate: Date;
  userCount: number;
  retentionCurve: RetentionPoint[];
  avgLifetimeValue: number;
  avgEngagementScore: number;
  churnRate: number;
  topFeatures: { feature: string; usage: number }[];
}

export interface RetentionPoint {
  day: number;
  retainedUsers: number;
  retentionRate: number;
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  churnRisk: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  suggestedActions: string[];
}

export interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface SessionPattern {
  userId: string;
  preferredTimeOfDay: string;
  avgSessionDuration: number;
  sessionFrequency: number;
  peakUsageDays: string[];
  commonActions: { action: string; count: number }[];
}

/**
 * User Behavior Analyzer
 *
 * Analyzes user behavior patterns, tracks engagement, predicts churn,
 * and provides insights for retention and personalization strategies.
 */
export class UserBehaviorAnalyzer extends EventEmitter {
  private userMetrics: Map<string, UserBehaviorMetrics> = new Map();
  private cohorts: Map<string, CohortAnalytics> = new Map();
  private sessionPatterns: Map<string, SessionPattern> = new Map();

  public async analyzeUserBehavior(userId: string): Promise<UserBehaviorMetrics> {
    // Get or create user metrics
    let metrics = this.userMetrics.get(userId);
    if (!metrics) {
      metrics = await this.initializeUserMetrics(userId);
    }

    // Calculate engagement score
    metrics.engagementScore = this.calculateEngagementScore(metrics);

    // Calculate retention score
    metrics.retentionScore = this.calculateRetentionScore(metrics);

    // Predict churn probability
    metrics.churnProbability = this.calculateChurnProbability(metrics);

    this.userMetrics.set(userId, metrics);
    this.emit('user:analyzed', { userId, metrics });

    return metrics;
  }

  private async initializeUserMetrics(userId: string): Promise<UserBehaviorMetrics> {
    return {
      userId,
      sessionDuration: 0,
      actionsPerSession: 0,
      featuresUsed: [],
      conversionEvents: [],
      retentionScore: 0,
      engagementScore: 0,
      churnProbability: 0,
      lastActiveAt: new Date(),
      totalSessions: 0,
    };
  }

  private calculateEngagementScore(metrics: UserBehaviorMetrics): number {
    // Engagement score formula: weighted combination of multiple factors
    const sessionWeight = 0.3;
    const actionsWeight = 0.3;
    const featuresWeight = 0.2;
    const recencyWeight = 0.2;

    // Normalize session duration (max 30 minutes = 100%)
    const sessionScore = Math.min((metrics.sessionDuration / 1800) * 100, 100);

    // Normalize actions per session (max 50 actions = 100%)
    const actionsScore = Math.min((metrics.actionsPerSession / 50) * 100, 100);

    // Normalize features used (max 10 features = 100%)
    const featuresScore = Math.min((metrics.featuresUsed.length / 10) * 100, 100);

    // Recency score (active within last 24h = 100%)
    const hoursSinceActive = (Date.now() - metrics.lastActiveAt.getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(100 - (hoursSinceActive / 24) * 100, 0);

    const engagementScore =
      sessionScore * sessionWeight +
      actionsScore * actionsWeight +
      featuresScore * featuresWeight +
      recencyScore * recencyWeight;

    return Math.round(engagementScore);
  }

  private calculateRetentionScore(metrics: UserBehaviorMetrics): number {
    // Retention score based on session frequency and consistency
    const now = Date.now();
    const daysSinceLastActive = (now - metrics.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);

    // High retention if user is consistently active
    if (daysSinceLastActive < 1 && metrics.totalSessions > 10) {
      return 90;
    } else if (daysSinceLastActive < 3 && metrics.totalSessions > 5) {
      return 70;
    } else if (daysSinceLastActive < 7) {
      return 50;
    } else if (daysSinceLastActive < 30) {
      return 30;
    } else {
      return 10;
    }
  }

  private calculateChurnProbability(metrics: UserBehaviorMetrics): number {
    // Churn probability: inverse of retention and engagement
    const baseChurn = 100 - metrics.retentionScore;
    const engagementFactor = (100 - metrics.engagementScore) * 0.5;
    const churnProbability = (baseChurn + engagementFactor) / 2;

    return Math.min(Math.max(churnProbability, 0), 100);
  }

  public async analyzeCohort(cohortId: string): Promise<CohortAnalytics> {
    const cohort = this.cohorts.get(cohortId);
    if (cohort) {
      return cohort;
    }

    // Create new cohort analysis
    const newCohort: CohortAnalytics = {
      cohortId,
      cohortName: `Cohort ${cohortId}`,
      cohortDate: new Date(),
      userCount: 0,
      retentionCurve: this.generateRetentionCurve(),
      avgLifetimeValue: 0,
      avgEngagementScore: 0,
      churnRate: 0,
      topFeatures: [],
    };

    this.cohorts.set(cohortId, newCohort);
    this.emit('cohort:analyzed', newCohort);

    return newCohort;
  }

  private generateRetentionCurve(): RetentionPoint[] {
    // Typical SaaS retention curve
    const curve: RetentionPoint[] = [];
    const days = [1, 7, 14, 30, 60, 90];
    const baseRetention = 100;

    days.forEach((day, index) => {
      const retentionRate = baseRetention * Math.pow(0.85, index); // 15% drop-off each period
      curve.push({
        day,
        retainedUsers: 0,
        retentionRate,
      });
    });

    return curve;
  }

  public async predictChurn(userId: string): Promise<ChurnPrediction> {
    const metrics = await this.analyzeUserBehavior(userId);
    const riskFactors: RiskFactor[] = [];

    // Identify risk factors
    if (metrics.engagementScore < 30) {
      riskFactors.push({
        factor: 'Low Engagement',
        impact: 0.4,
        description: 'User has low engagement score',
      });
    }

    if (metrics.retentionScore < 30) {
      riskFactors.push({
        factor: 'Infrequent Usage',
        impact: 0.3,
        description: 'User has not been active recently',
      });
    }

    if (metrics.actionsPerSession < 5) {
      riskFactors.push({
        factor: 'Low Activity',
        impact: 0.2,
        description: 'User performs few actions per session',
      });
    }

    if (metrics.featuresUsed.length < 2) {
      riskFactors.push({
        factor: 'Limited Feature Adoption',
        impact: 0.1,
        description: 'User uses only a few features',
      });
    }

    // Determine churn risk level
    let churnRisk: 'low' | 'medium' | 'high';
    if (metrics.churnProbability < 30) {
      churnRisk = 'low';
    } else if (metrics.churnProbability < 60) {
      churnRisk = 'medium';
    } else {
      churnRisk = 'high';
    }

    // Generate suggested actions
    const suggestedActions: string[] = [];
    if (churnRisk === 'high' || churnRisk === 'medium') {
      suggestedActions.push('Send re-engagement email');
      suggestedActions.push('Offer personalized coaching session');
      suggestedActions.push('Provide feature discovery tips');
    }
    if (metrics.featuresUsed.length < 3) {
      suggestedActions.push('Highlight unused features');
    }
    if (metrics.conversionEvents.length === 0) {
      suggestedActions.push('Encourage first goal creation');
    }

    const prediction: ChurnPrediction = {
      userId,
      churnProbability: metrics.churnProbability,
      churnRisk,
      riskFactors,
      suggestedActions,
    };

    this.emit('churn:predicted', prediction);

    return prediction;
  }

  public async trackConversion(event: ConversionEvent): Promise<void> {
    // Track conversion event
    this.emit('conversion:tracked', event);
  }

  public async analyzeSessionPattern(userId: string): Promise<SessionPattern> {
    // Analyze when and how user typically uses the app
    const pattern: SessionPattern = {
      userId,
      preferredTimeOfDay: 'morning', // 6am-12pm
      avgSessionDuration: 1200, // 20 minutes
      sessionFrequency: 2.5, // times per day
      peakUsageDays: ['Monday', 'Wednesday', 'Friday'],
      commonActions: [
        { action: 'view_dashboard', count: 45 },
        { action: 'log_habit', count: 38 },
        { action: 'update_goal', count: 22 },
        { action: 'ai_coaching', count: 15 },
      ],
    };

    this.sessionPatterns.set(userId, pattern);
    this.emit('session_pattern:analyzed', pattern);

    return pattern;
  }

  public getEngagementTrend(userId: string, days: number = 30): number[] {
    // Return engagement score trend over time
    const trend: number[] = [];
    for (let i = 0; i < days; i++) {
      trend.push(Math.floor(Math.random() * 100)); // Simulated data
    }
    return trend;
  }

  public getUserSegment(metrics: UserBehaviorMetrics): 'power_user' | 'active' | 'casual' | 'at_risk' {
    if (metrics.engagementScore >= 80 && metrics.retentionScore >= 80) {
      return 'power_user';
    } else if (metrics.engagementScore >= 50 && metrics.retentionScore >= 50) {
      return 'active';
    } else if (metrics.churnProbability < 50) {
      return 'casual';
    } else {
      return 'at_risk';
    }
  }

  public getMetrics(userId: string): UserBehaviorMetrics | undefined {
    return this.userMetrics.get(userId);
  }

  public getAllCohorts(): CohortAnalytics[] {
    return Array.from(this.cohorts.values());
  }
}

export default UserBehaviorAnalyzer;
