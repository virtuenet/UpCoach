/**
 * Churn Prediction Service
 * Identify at-risk users and trigger retention interventions
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { analyticsDataPipeline } from '../analytics/AnalyticsDataPipeline';

export interface ChurnPrediction {
  userId: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topRiskFactors: Array<{
    factor: string;
    impact: number; // 0-100
    description: string;
  }>;
  recommendedActions: Array<{
    action: string;
    expectedImpact: number;
    urgency: 'low' | 'medium' | 'high';
  }>;
  predictionConfidence: number; // 0-100%
  predictedAt: Date;
}

export interface ChurnModelMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  lastUpdated: Date;
}

export class ChurnPredictionService extends EventEmitter {
  private static instance: ChurnPredictionService;
  private predictions: Map<string, ChurnPrediction> = new Map();
  private modelMetrics: ChurnModelMetrics = {
    precision: 0.82,
    recall: 0.78,
    f1Score: 0.80,
    auc: 0.85,
    confusionMatrix: { truePositive: 0, falsePositive: 0, trueNegative: 0, falseNegative: 0 },
    lastUpdated: new Date(),
  };

  private constructor() {
    super();
  }

  static getInstance(): ChurnPredictionService {
    if (!ChurnPredictionService.instance) {
      ChurnPredictionService.instance = new ChurnPredictionService();
    }
    return ChurnPredictionService.instance;
  }

  async predictChurn(userId: string, tenantId: string): Promise<ChurnPrediction> {
    // Calculate behavioral signals
    const signals = await this.calculateBehavioralSignals(userId, tenantId);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(signals);
    const riskLevel = this.getRiskLevel(riskScore);

    // Identify top risk factors
    const topRiskFactors = this.identifyRiskFactors(signals);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendations(riskLevel, topRiskFactors);

    const prediction: ChurnPrediction = {
      userId,
      riskScore,
      riskLevel,
      topRiskFactors,
      recommendedActions,
      predictionConfidence: this.modelMetrics.f1Score * 100,
      predictedAt: new Date(),
    };

    this.predictions.set(userId, prediction);
    this.emit('prediction:generated', prediction);

    // Trigger interventions for high-risk users
    if (riskLevel === 'high' || riskLevel === 'critical') {
      await this.triggerInterventions(prediction);
    }

    return prediction;
  }

  private async calculateBehavioralSignals(userId: string, tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Query recent activity
    const recentActivity = await analyticsDataPipeline.query({
      tenantId,
      userId,
      startDate: thirtyDaysAgo,
      endDate: now,
    });

    const previousActivity = await analyticsDataPipeline.query({
      tenantId,
      userId,
      startDate: sixtyDaysAgo,
      endDate: thirtyDaysAgo,
    });

    const recentEvents = recentActivity.events || [];
    const previousEvents = previousActivity.events || [];

    // Calculate signals
    const loginFrequency = this.calculateLoginFrequency(recentEvents);
    const loginDecline = this.calculateDecline(
      this.calculateLoginFrequency(previousEvents),
      loginFrequency
    );

    const goalActivity = recentEvents.filter(e => e.eventType.startsWith('goal.')).length;
    const goalDecline = this.calculateDecline(
      previousEvents.filter(e => e.eventType.startsWith('goal.')).length,
      goalActivity
    );

    const featureUsage = new Set(
      recentEvents.filter(e => e.eventType === 'feature.used').map(e => e.eventData.featureName)
    ).size;
    const featureDecline = this.calculateDecline(
      new Set(
        previousEvents.filter(e => e.eventType === 'feature.used').map(e => e.eventData.featureName)
      ).size,
      featureUsage
    );

    const daysSinceLastLogin = this.calculateDaysSinceLastEvent(recentEvents, 'user.login');
    const daysSinceGoalUpdate = this.calculateDaysSinceLastEvent(recentEvents, 'goal.updated');

    const supportTickets = recentEvents.filter(
      e =>
        e.eventType === 'feature.used' &&
        (e.eventData.featureName === 'support' || e.eventData.featureName === 'feedback')
    ).length;

    const subscriptionEvents = recentEvents.filter(
      e => e.eventType === 'subscription.cancelled' || e.eventType === 'payment.failed'
    ).length;

    return {
      loginFrequency,
      loginDecline,
      goalActivity,
      goalDecline,
      featureUsage,
      featureDecline,
      daysSinceLastLogin,
      daysSinceGoalUpdate,
      supportTickets,
      subscriptionEvents,
    };
  }

  private calculateLoginFrequency(events: any[]): number {
    return events.filter(e => e.eventType === 'user.login').length;
  }

  private calculateDecline(previous: number, current: number): number {
    if (previous === 0) return 0;
    return ((previous - current) / previous) * 100;
  }

  private calculateDaysSinceLastEvent(events: any[], eventType: string): number {
    const relevantEvents = events.filter(e => e.eventType === eventType);
    if (relevantEvents.length === 0) return 999;

    const lastEvent = relevantEvents.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )[0];
    return (Date.now() - lastEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24);
  }

  private calculateRiskScore(signals: any): number {
    let score = 0;

    // Login decline (0-25 points)
    if (signals.loginDecline > 50) score += 25;
    else if (signals.loginDecline > 30) score += 15;
    else if (signals.loginDecline > 10) score += 5;

    // Days since last login (0-20 points)
    if (signals.daysSinceLastLogin > 14) score += 20;
    else if (signals.daysSinceLastLogin > 7) score += 10;
    else if (signals.daysSinceLastLogin > 3) score += 5;

    // Goal activity decline (0-20 points)
    if (signals.goalDecline > 50) score += 20;
    else if (signals.goalDecline > 30) score += 12;
    else if (signals.goalDecline > 10) score += 5;

    // Days since goal update (0-15 points)
    if (signals.daysSinceGoalUpdate > 14) score += 15;
    else if (signals.daysSinceGoalUpdate > 7) score += 8;

    // Feature usage decline (0-10 points)
    if (signals.featureDecline > 50) score += 10;
    else if (signals.featureDecline > 30) score += 6;

    // Support tickets indicating frustration (0-5 points)
    score += Math.min(signals.supportTickets * 2, 5);

    // Subscription events (0-5 points)
    score += Math.min(signals.subscriptionEvents * 5, 5);

    return Math.min(score, 100);
  }

  private getRiskLevel(score: number): ChurnPrediction['riskLevel'] {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  private identifyRiskFactors(signals: any): ChurnPrediction['topRiskFactors'] {
    const factors: ChurnPrediction['topRiskFactors'] = [];

    if (signals.loginDecline > 30) {
      factors.push({
        factor: 'Declining Login Frequency',
        impact: Math.min(signals.loginDecline, 100),
        description: `Login frequency has declined by ${signals.loginDecline.toFixed(1)}% in the last 30 days`,
      });
    }

    if (signals.daysSinceLastLogin > 7) {
      factors.push({
        factor: 'Inactive User',
        impact: Math.min(signals.daysSinceLastLogin * 5, 100),
        description: `User hasn't logged in for ${Math.floor(signals.daysSinceLastLogin)} days`,
      });
    }

    if (signals.goalDecline > 30) {
      factors.push({
        factor: 'Reduced Goal Engagement',
        impact: Math.min(signals.goalDecline, 100),
        description: `Goal activity has dropped by ${signals.goalDecline.toFixed(1)}%`,
      });
    }

    if (signals.featureDecline > 30) {
      factors.push({
        factor: 'Declining Feature Usage',
        impact: Math.min(signals.featureDecline, 100),
        description: `Using ${signals.featureDecline.toFixed(1)}% fewer features`,
      });
    }

    if (signals.subscriptionEvents > 0) {
      factors.push({
        factor: 'Subscription Issues',
        impact: 90,
        description: 'Recent subscription cancellation or payment failure detected',
      });
    }

    return factors.sort((a, b) => b.impact - a.impact).slice(0, 5);
  }

  private generateRecommendations(
    riskLevel: string,
    factors: ChurnPrediction['topRiskFactors']
  ): ChurnPrediction['recommendedActions'] {
    const actions: ChurnPrediction['recommendedActions'] = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      actions.push({
        action: 'Send personalized re-engagement email campaign',
        expectedImpact: 30,
        urgency: 'high',
      });

      actions.push({
        action: 'Offer 15-20% discount for next billing cycle',
        expectedImpact: 40,
        urgency: 'high',
      });

      actions.push({
        action: 'Trigger AI coach check-in conversation',
        expectedImpact: 25,
        urgency: 'high',
      });
    }

    if (factors.some(f => f.factor.includes('Goal'))) {
      actions.push({
        action: 'Recommend new goals based on user interests',
        expectedImpact: 20,
        urgency: 'medium',
      });
    }

    if (factors.some(f => f.factor.includes('Feature'))) {
      actions.push({
        action: 'Send feature discovery email highlighting unused features',
        expectedImpact: 15,
        urgency: 'medium',
      });
    }

    actions.push({
      action: 'Send success story email from similar users',
      expectedImpact: 10,
      urgency: 'low',
    });

    return actions.slice(0, 5);
  }

  private async triggerInterventions(prediction: ChurnPrediction): Promise<void> {
    this.emit('intervention:triggered', {
      userId: prediction.userId,
      riskLevel: prediction.riskLevel,
      actions: prediction.recommendedActions,
    });

    // Implementation would trigger actual email campaigns, notifications, etc.
  }

  async getPrediction(userId: string): Promise<ChurnPrediction | null> {
    return this.predictions.get(userId) || null;
  }

  async getModelMetrics(): Promise<ChurnModelMetrics> {
    return this.modelMetrics;
  }

  async updateModelMetrics(metrics: Partial<ChurnModelMetrics>): Promise<void> {
    Object.assign(this.modelMetrics, metrics, { lastUpdated: new Date() });
    this.emit('model:updated', this.modelMetrics);
  }

  async batchPredict(userIds: string[], tenantId: string): Promise<ChurnPrediction[]> {
    const predictions = await Promise.all(
      userIds.map(userId => this.predictChurn(userId, tenantId))
    );
    return predictions;
  }

  async getHighRiskUsers(tenantId: string, limit: number = 100): Promise<ChurnPrediction[]> {
    return Array.from(this.predictions.values())
      .filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical')
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);
  }
}

export const churnPredictionService = ChurnPredictionService.getInstance();
