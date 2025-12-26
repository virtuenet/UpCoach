/**
 * Churn Prevention Service
 * Phase 11 Week 1
 *
 * Identifies users at risk of churning and triggers interventions
 */

import { PredictiveAnalytics } from '../analytics/PredictiveAnalytics';
import { NotificationService } from '../notifications/NotificationService';

export interface ChurnRiskProfile {
  userId: string;
  riskScore: number; // 0-100
  riskCategory: 'low' | 'medium' | 'high';
  riskFactors: ChurnRiskFactor[];
  recommendedInterventions: Intervention[];
  predictedChurnDate: Date | null;
}

export interface ChurnRiskFactor {
  factor: string;
  severity: number; // 0-1
  description: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface Intervention {
  type: 'push_notification' | 'email' | 'in_app_message' | 'personalized_recommendation';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  content: string;
  trigger: 'manual' | 'automated' | 'scheduled';
  scheduledFor?: Date;
}

export class ChurnPreventionService {
  private predictiveAnalytics: PredictiveAnalytics;
  private notificationService: NotificationService;

  constructor() {
    this.predictiveAnalytics = new PredictiveAnalytics();
    this.notificationService = new NotificationService();
  }

  /**
   * Analyze churn risk for a user
   */
  async analyzeChurnRisk(userId: string): Promise<ChurnRiskProfile> {
    // Fetch user activity data
    const userData = await this.getUserActivityData(userId);

    // Calculate risk indicators
    const riskIndicators = this.calculateRiskIndicators(userData);

    // Determine risk score (0-100)
    const riskScore = this.calculateRiskScore(riskIndicators);

    // Categorize risk
    const riskCategory = this.categorizeRisk(riskScore);

    // Identify top risk factors
    const riskFactors = this.identifyRiskFactors(riskIndicators);

    // Generate intervention recommendations
    const interventions = this.generateInterventions(riskCategory, riskFactors);

    // Predict churn date if high risk
    const predictedChurnDate = riskScore > 70 ? this.predictChurnDate(userData) : null;

    return {
      userId,
      riskScore,
      riskCategory,
      riskFactors,
      recommendedInterventions: interventions,
      predictedChurnDate
    };
  }

  /**
   * Calculate risk indicators from user activity
   */
  private calculateRiskIndicators(userData: any): Map<string, number> {
    const indicators = new Map<string, number>();

    // Days since last check-in
    const daysSinceLastCheckIn = userData.daysSinceLastCheckIn || 0;
    indicators.set('inactivity_days', daysSinceLastCheckIn / 30); // Normalize to 0-1

    // Declining check-in frequency
    const recentFreq = userData.checkInsLast7Days || 0;
    const previousFreq = userData.checkInsPrevious7Days || 1;
    const frequencyTrend = (previousFreq - recentFreq) / previousFreq;
    indicators.set('frequency_decline', Math.max(0, frequencyTrend));

    // Missed notification responses
    const notificationResponseRate = userData.notificationResponseRate || 0.5;
    indicators.set('low_engagement', 1 - notificationResponseRate);

    // Decreasing session duration
    const avgSessionDuration = userData.avgSessionDurationSeconds || 60;
    indicators.set('low_session_duration', Math.max(0, 1 - (avgSessionDuration / 300))); // 5 min = good

    // Negative mood trends
    const moodTrend = userData.moodTrend || 0; // -1 to 1
    indicators.set('negative_mood', Math.max(0, -moodTrend));

    // Habit streak breaks
    const streakBreaks = userData.streakBreaksLast30Days || 0;
    indicators.set('streak_instability', Math.min(1, streakBreaks / 5));

    // Feature usage decline
    const featureUsageRate = userData.featureUsageRate || 0.5;
    indicators.set('feature_abandonment', 1 - featureUsageRate);

    return indicators;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(indicators: Map<string, number>): number {
    // Weighted risk score
    const weights = {
      inactivity_days: 0.25,
      frequency_decline: 0.20,
      low_engagement: 0.15,
      low_session_duration: 0.10,
      negative_mood: 0.10,
      streak_instability: 0.10,
      feature_abandonment: 0.10
    };

    let weightedScore = 0;
    let totalWeight = 0;

    indicators.forEach((value, key) => {
      const weight = weights[key as keyof typeof weights] || 0.1;
      weightedScore += value * weight;
      totalWeight += weight;
    });

    return Math.round((weightedScore / totalWeight) * 100);
  }

  /**
   * Categorize risk level
   */
  private categorizeRisk(score: number): 'low' | 'medium' | 'high' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Identify top risk factors
   */
  private identifyRiskFactors(indicators: Map<string, number>): ChurnRiskFactor[] {
    const factors: ChurnRiskFactor[] = [];

    const factorDescriptions: Record<string, string> = {
      inactivity_days: 'User has not checked in recently',
      frequency_decline: 'Check-in frequency is declining',
      low_engagement: 'Low response to notifications',
      low_session_duration: 'Decreasing time spent in app',
      negative_mood: 'Negative mood trend detected',
      streak_instability: 'Frequent streak breaks',
      feature_abandonment: 'Reduced feature usage'
    };

    // Sort by severity
    const sorted = Array.from(indicators.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 factors

    sorted.forEach(([factor, severity]) => {
      if (severity > 0.3) { // Only include significant factors
        factors.push({
          factor,
          severity,
          description: factorDescriptions[factor] || factor,
          trend: severity > 0.7 ? 'declining' : severity > 0.4 ? 'stable' : 'improving'
        });
      }
    });

    return factors;
  }

  /**
   * Generate intervention recommendations
   */
  private generateInterventions(
    riskCategory: 'low' | 'medium' | 'high',
    riskFactors: ChurnRiskFactor[]
  ): Intervention[] {
    const interventions: Intervention[] = [];

    if (riskCategory === 'high') {
      // Immediate personalized push notification
      interventions.push({
        type: 'push_notification',
        priority: 'immediate',
        content: `We miss you! 🌟 Your ${this.getTopHabit()} streak is waiting. Check in now to keep the momentum going!`,
        trigger: 'automated'
      });

      // Follow-up email
      interventions.push({
        type: 'email',
        priority: 'high',
        content: 'Personalized re-engagement email with success stories and tips',
        trigger: 'automated',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // In-app motivational message
      interventions.push({
        type: 'in_app_message',
        priority: 'high',
        content: 'Special streak recovery bonus available',
        trigger: 'automated'
      });
    } else if (riskCategory === 'medium') {
      // Encouraging email after 24 hours
      interventions.push({
        type: 'email',
        priority: 'medium',
        content: 'Weekly progress summary with encouraging insights',
        trigger: 'scheduled',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      // Personalized recommendations
      interventions.push({
        type: 'personalized_recommendation',
        priority: 'medium',
        content: 'New habit suggestions based on your goals',
        trigger: 'automated'
      });
    } else {
      // Low risk - weekly motivational summary
      interventions.push({
        type: 'email',
        priority: 'low',
        content: 'Weekly motivational summary and insights',
        trigger: 'scheduled',
        scheduledFor: this.getNextSunday()
      });
    }

    return interventions;
  }

  /**
   * Predict when user will churn
   */
  private predictChurnDate(userData: any): Date | null {
    const daysSinceLastActivity = userData.daysSinceLastCheckIn || 0;
    const declineRate = userData.activityDeclineRate || 0.1;

    // Simple projection: if current trend continues, when will activity hit zero?
    const daysUntilChurn = Math.max(7, 30 - (daysSinceLastActivity * (1 + declineRate)));

    return new Date(Date.now() + daysUntilChurn * 24 * 60 * 60 * 1000);
  }

  /**
   * Execute interventions for at-risk users
   */
  async executeInterventions(userId: string, interventions: Intervention[]): Promise<void> {
    for (const intervention of interventions) {
      if (intervention.priority === 'immediate' && intervention.trigger === 'automated') {
        await this.executeIntervention(userId, intervention);
      } else if (intervention.scheduledFor) {
        await this.scheduleIntervention(userId, intervention);
      }
    }
  }

  private async executeIntervention(userId: string, intervention: Intervention): Promise<void> {
    switch (intervention.type) {
      case 'push_notification':
        await this.notificationService.sendPushNotification(userId, {
          title: 'We miss you!',
          body: intervention.content,
          priority: 'high'
        });
        break;
      case 'email':
        await this.notificationService.sendEmail(userId, {
          subject: 'Keep your momentum going',
          body: intervention.content
        });
        break;
      case 'in_app_message':
        await this.notificationService.createInAppMessage(userId, intervention.content);
        break;
    }
  }

  private async scheduleIntervention(userId: string, intervention: Intervention): Promise<void> {
    // Schedule for future execution
    console.log(`Scheduled ${intervention.type} for ${userId} at ${intervention.scheduledFor}`);
  }

  private getTopHabit(): string {
    return 'meditation'; // Placeholder - would fetch from user data
  }

  private getNextSunday(): Date {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(18, 0, 0, 0); // 6 PM
    return nextSunday;
  }

  private async getUserActivityData(userId: string): Promise<any> {
    // Placeholder - would fetch from database
    return {
      daysSinceLastCheckIn: 3,
      checkInsLast7Days: 4,
      checkInsPrevious7Days: 6,
      notificationResponseRate: 0.4,
      avgSessionDurationSeconds: 120,
      moodTrend: -0.2,
      streakBreaksLast30Days: 2,
      featureUsageRate: 0.6,
      activityDeclineRate: 0.15
    };
  }
}
