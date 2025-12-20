/**
 * Churn Predictor
 * Predicts client churn probability based on engagement and financial signals
 * Uses feature-based scoring with weighted factors
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { featureStore, FeatureVector } from '../FeatureStore';

// ==================== Type Definitions ====================

export interface ChurnPredictionInput {
  userId: string;
  sessionCount7d?: number;
  sessionCount30d?: number;
  daysSinceLastSession?: number;
  loginFrequency7d?: number;
  aiChatCount7d?: number;
  paymentFailures90d?: number;
  subscriptionTenureDays?: number;
  goalCompletionRate?: number;
  avgSessionDuration?: number;
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  riskLevel: ChurnRiskLevel;
  topRiskFactors: RiskFactor[];
  segmentRisk: SegmentRisk;
  predictedChurnDate?: Date;
  confidence: number;
  recommendations: string[];
  timestamp: Date;
}

export type ChurnRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  factor: string;
  contribution: number;
  currentValue: number;
  threshold: number;
  description: string;
}

export interface SegmentRisk {
  segment: string;
  averageChurnRate: number;
  userPosition: 'below_average' | 'average' | 'above_average';
}

export interface ChurnThresholds {
  low: number;
  medium: number;
  high: number;
}

export interface ChurnModelConfig {
  weights: Record<string, number>;
  thresholds: ChurnThresholds;
  lookbackDays: number;
}

// ==================== Churn Predictor ====================

export class ChurnPredictor extends EventEmitter {
  private config: ChurnModelConfig;
  private predictionHistory: Map<string, ChurnPrediction[]> = new Map();

  private readonly defaultConfig: ChurnModelConfig = {
    weights: {
      sessionRecency: 0.25,
      sessionFrequency: 0.20,
      engagementScore: 0.15,
      paymentHealth: 0.15,
      goalProgress: 0.10,
      tenureRisk: 0.10,
      aiUsage: 0.05,
    },
    thresholds: {
      low: 0.3,
      medium: 0.5,
      high: 0.7,
    },
    lookbackDays: 90,
  };

  constructor(config?: Partial<ChurnModelConfig>) {
    super();
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Predict churn probability for a user
   */
  public async predict(input: ChurnPredictionInput): Promise<ChurnPrediction> {
    const startTime = Date.now();

    // Get features from store or use provided values
    const features = await this.getFeatures(input);

    // Calculate risk scores for each factor
    const riskScores = this.calculateRiskScores(features);

    // Calculate weighted churn probability
    const churnProbability = this.calculateChurnProbability(riskScores);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(churnProbability);

    // Identify top risk factors
    const topRiskFactors = this.identifyTopRiskFactors(riskScores, features);

    // Determine segment risk
    const segmentRisk = this.calculateSegmentRisk(features, churnProbability);

    // Generate recommendations
    const recommendations = this.generateRecommendations(topRiskFactors, riskLevel);

    // Estimate churn date for high-risk users
    const predictedChurnDate = riskLevel === 'high' || riskLevel === 'critical'
      ? this.estimateChurnDate(churnProbability, features)
      : undefined;

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(features);

    const prediction: ChurnPrediction = {
      userId: input.userId,
      churnProbability,
      riskLevel,
      topRiskFactors,
      segmentRisk,
      predictedChurnDate,
      confidence,
      recommendations,
      timestamp: new Date(),
    };

    // Store prediction for tracking
    this.storePrediction(prediction);

    this.emit('prediction:made', {
      userId: input.userId,
      probability: churnProbability,
      riskLevel,
      latencyMs: Date.now() - startTime,
    });

    return prediction;
  }

  /**
   * Predict churn for multiple users
   */
  public async predictBatch(inputs: ChurnPredictionInput[]): Promise<ChurnPrediction[]> {
    const predictions = await Promise.all(inputs.map((input) => this.predict(input)));
    return predictions;
  }

  /**
   * Get features from store or use provided values
   */
  private async getFeatures(input: ChurnPredictionInput): Promise<UserChurnFeatures> {
    // Try to get from feature store first
    let storeFeatures: FeatureVector | null = null;
    try {
      storeFeatures = await featureStore.getFeatures(input.userId, [
        'user_session_count_7d',
        'user_session_count_30d',
        'user_days_since_last_session',
        'user_login_frequency_7d',
        'user_ai_chat_count_7d',
        'user_payment_failures_90d',
        'user_subscription_tenure_days',
        'user_goal_completion_rate',
        'user_avg_session_duration',
      ]);
    } catch {
      // Feature store not available, use provided values
    }

    // Merge provided values with store values (provided takes precedence)
    return {
      sessionCount7d: input.sessionCount7d ??
        (storeFeatures?.features['user_session_count_7d']?.value as number) ?? 0,
      sessionCount30d: input.sessionCount30d ??
        (storeFeatures?.features['user_session_count_30d']?.value as number) ?? 0,
      daysSinceLastSession: input.daysSinceLastSession ??
        (storeFeatures?.features['user_days_since_last_session']?.value as number) ?? 30,
      loginFrequency7d: input.loginFrequency7d ??
        (storeFeatures?.features['user_login_frequency_7d']?.value as number) ?? 0,
      aiChatCount7d: input.aiChatCount7d ??
        (storeFeatures?.features['user_ai_chat_count_7d']?.value as number) ?? 0,
      paymentFailures90d: input.paymentFailures90d ??
        (storeFeatures?.features['user_payment_failures_90d']?.value as number) ?? 0,
      subscriptionTenureDays: input.subscriptionTenureDays ??
        (storeFeatures?.features['user_subscription_tenure_days']?.value as number) ?? 0,
      goalCompletionRate: input.goalCompletionRate ??
        (storeFeatures?.features['user_goal_completion_rate']?.value as number) ?? 0,
      avgSessionDuration: input.avgSessionDuration ??
        (storeFeatures?.features['user_avg_session_duration']?.value as number) ?? 0,
    };
  }

  /**
   * Calculate risk scores for each factor
   */
  private calculateRiskScores(features: UserChurnFeatures): Record<string, number> {
    const scores: Record<string, number> = {};

    // Session Recency Risk (0-1, higher = more risk)
    // Risk increases significantly after 7 days, critical after 14 days
    scores.sessionRecency = Math.min(1, features.daysSinceLastSession / 14);

    // Session Frequency Risk (0-1)
    // Compare to expected sessions (e.g., 4 per month)
    const expectedSessions30d = 4;
    scores.sessionFrequency = Math.max(0, 1 - (features.sessionCount30d / expectedSessions30d));

    // Engagement Score (composite of login and AI usage)
    const loginRisk = Math.max(0, 1 - (features.loginFrequency7d / 5)); // Expect 5 logins/week
    const aiRisk = Math.max(0, 1 - (features.aiChatCount7d / 10)); // Expect 10 chats/week
    scores.engagementScore = (loginRisk + aiRisk) / 2;

    // Payment Health Risk
    // Any payment failure is concerning, multiple is critical
    scores.paymentHealth = Math.min(1, features.paymentFailures90d * 0.33);

    // Goal Progress Risk
    // Low goal completion suggests disengagement
    scores.goalProgress = Math.max(0, 1 - features.goalCompletionRate);

    // Tenure Risk (new users churn more)
    // Risk decreases with tenure, stabilizes after 90 days
    if (features.subscriptionTenureDays < 30) {
      scores.tenureRisk = 0.8; // Very high risk in first month
    } else if (features.subscriptionTenureDays < 90) {
      scores.tenureRisk = 0.5; // Moderate risk in first quarter
    } else {
      scores.tenureRisk = 0.2; // Lower risk for established users
    }

    // AI Usage Risk (low AI usage may indicate low value perception)
    scores.aiUsage = features.aiChatCount7d > 0 ? Math.max(0, 1 - (features.aiChatCount7d / 15)) : 0.7;

    return scores;
  }

  /**
   * Calculate weighted churn probability
   */
  private calculateChurnProbability(riskScores: Record<string, number>): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [factor, weight] of Object.entries(this.config.weights)) {
      const score = riskScores[factor] || 0;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    // Normalize to 0-1
    const probability = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Apply sigmoid-like smoothing for more realistic distribution
    return this.sigmoid(probability);
  }

  /**
   * Sigmoid function for probability smoothing
   */
  private sigmoid(x: number): number {
    // Shift and scale sigmoid for 0-1 input/output
    const k = 6; // Steepness
    const x0 = 0.5; // Midpoint
    return 1 / (1 + Math.exp(-k * (x - x0)));
  }

  /**
   * Determine risk level based on probability
   */
  private determineRiskLevel(probability: number): ChurnRiskLevel {
    const { thresholds } = this.config;

    if (probability >= thresholds.high) return 'critical';
    if (probability >= thresholds.medium) return 'high';
    if (probability >= thresholds.low) return 'medium';
    return 'low';
  }

  /**
   * Identify top contributing risk factors
   */
  private identifyTopRiskFactors(
    riskScores: Record<string, number>,
    features: UserChurnFeatures
  ): RiskFactor[] {
    const factorDetails: Record<string, {
      currentValue: number;
      threshold: number;
      description: string;
    }> = {
      sessionRecency: {
        currentValue: features.daysSinceLastSession,
        threshold: 7,
        description: 'Days since last coaching session',
      },
      sessionFrequency: {
        currentValue: features.sessionCount30d,
        threshold: 4,
        description: 'Sessions in last 30 days',
      },
      engagementScore: {
        currentValue: features.loginFrequency7d,
        threshold: 5,
        description: 'Weekly login frequency',
      },
      paymentHealth: {
        currentValue: features.paymentFailures90d,
        threshold: 0,
        description: 'Payment failures in last 90 days',
      },
      goalProgress: {
        currentValue: features.goalCompletionRate,
        threshold: 0.5,
        description: 'Goal completion rate',
      },
      tenureRisk: {
        currentValue: features.subscriptionTenureDays,
        threshold: 90,
        description: 'Subscription tenure in days',
      },
      aiUsage: {
        currentValue: features.aiChatCount7d,
        threshold: 10,
        description: 'AI chat interactions per week',
      },
    };

    const factors: RiskFactor[] = [];

    for (const [factor, score] of Object.entries(riskScores)) {
      const weight = this.config.weights[factor] || 0;
      const contribution = score * weight;
      const details = factorDetails[factor];

      if (contribution > 0.05) { // Only include significant factors
        factors.push({
          factor,
          contribution,
          currentValue: details?.currentValue || 0,
          threshold: details?.threshold || 0,
          description: details?.description || factor,
        });
      }
    }

    // Sort by contribution and return top 5
    return factors
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 5);
  }

  /**
   * Calculate segment risk comparison
   */
  private calculateSegmentRisk(
    features: UserChurnFeatures,
    probability: number
  ): SegmentRisk {
    // Determine user segment
    let segment: string;
    let averageChurnRate: number;

    if (features.subscriptionTenureDays < 30) {
      segment = 'New Users (< 30 days)';
      averageChurnRate = 0.35; // 35% churn rate for new users
    } else if (features.subscriptionTenureDays < 90) {
      segment = 'Early Users (30-90 days)';
      averageChurnRate = 0.20;
    } else if (features.subscriptionTenureDays < 365) {
      segment = 'Established Users (3-12 months)';
      averageChurnRate = 0.10;
    } else {
      segment = 'Long-term Users (> 1 year)';
      averageChurnRate = 0.05;
    }

    let userPosition: SegmentRisk['userPosition'];
    if (probability < averageChurnRate * 0.8) {
      userPosition = 'below_average';
    } else if (probability > averageChurnRate * 1.2) {
      userPosition = 'above_average';
    } else {
      userPosition = 'average';
    }

    return { segment, averageChurnRate, userPosition };
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    topFactors: RiskFactor[],
    riskLevel: ChurnRiskLevel
  ): string[] {
    const recommendations: string[] = [];

    // Risk-level specific urgency
    if (riskLevel === 'critical') {
      recommendations.push('🚨 Immediate outreach recommended - high churn risk detected');
    } else if (riskLevel === 'high') {
      recommendations.push('📞 Schedule a check-in call within the next 48 hours');
    }

    // Factor-specific recommendations
    for (const factor of topFactors.slice(0, 3)) {
      switch (factor.factor) {
        case 'sessionRecency':
          if (factor.currentValue > 14) {
            recommendations.push('Send a personalized re-engagement email with session scheduling link');
          } else if (factor.currentValue > 7) {
            recommendations.push('Send a gentle reminder about upcoming coaching opportunities');
          }
          break;

        case 'sessionFrequency':
          recommendations.push('Review session scheduling barriers and offer flexible timing options');
          break;

        case 'engagementScore':
          recommendations.push('Highlight new features or content that may interest this user');
          recommendations.push('Consider a personalized push notification with relevant tips');
          break;

        case 'paymentHealth':
          recommendations.push('Proactively reach out about payment issues before renewal');
          recommendations.push('Offer flexible payment options or temporary pause instead of cancellation');
          break;

        case 'goalProgress':
          recommendations.push('Review and potentially adjust goal difficulty settings');
          recommendations.push('Schedule a goal-review session with their coach');
          break;

        case 'tenureRisk':
          recommendations.push('Ensure proper onboarding completion');
          recommendations.push('Assign a dedicated success manager for new user support');
          break;

        case 'aiUsage':
          recommendations.push('Send tips on how to get more value from AI coaching features');
          break;
      }
    }

    return [...new Set(recommendations)].slice(0, 5);
  }

  /**
   * Estimate when user might churn
   */
  private estimateChurnDate(
    probability: number,
    features: UserChurnFeatures
  ): Date {
    // Base estimate on probability and engagement trends
    let daysUntilChurn: number;

    if (probability >= 0.8) {
      daysUntilChurn = 7; // Critical - likely within a week
    } else if (probability >= 0.7) {
      daysUntilChurn = 14; // High - likely within 2 weeks
    } else {
      daysUntilChurn = 30; // Moderate - within a month
    }

    // Adjust based on recency
    if (features.daysSinceLastSession > 14) {
      daysUntilChurn = Math.min(daysUntilChurn, 7);
    }

    // Adjust based on payment issues
    if (features.paymentFailures90d > 1) {
      daysUntilChurn = Math.min(daysUntilChurn, 14);
    }

    const churnDate = new Date();
    churnDate.setDate(churnDate.getDate() + daysUntilChurn);
    return churnDate;
  }

  /**
   * Calculate prediction confidence based on data availability
   */
  private calculateConfidence(features: UserChurnFeatures): number {
    let dataPoints = 0;
    let availablePoints = 0;

    const checks = [
      features.sessionCount7d >= 0,
      features.sessionCount30d >= 0,
      features.daysSinceLastSession >= 0,
      features.loginFrequency7d >= 0,
      features.aiChatCount7d >= 0,
      features.paymentFailures90d >= 0,
      features.subscriptionTenureDays > 0,
      features.goalCompletionRate >= 0,
      features.avgSessionDuration >= 0,
    ];

    for (const check of checks) {
      dataPoints++;
      if (check) availablePoints++;
    }

    const dataAvailability = availablePoints / dataPoints;

    // Confidence also depends on tenure (more history = more reliable)
    const tenureConfidence = Math.min(1, features.subscriptionTenureDays / 90);

    return Math.round((dataAvailability * 0.6 + tenureConfidence * 0.4) * 100);
  }

  /**
   * Store prediction for tracking
   */
  private storePrediction(prediction: ChurnPrediction): void {
    const history = this.predictionHistory.get(prediction.userId) || [];
    history.push(prediction);

    // Keep last 30 predictions per user
    if (history.length > 30) {
      history.shift();
    }

    this.predictionHistory.set(prediction.userId, history);
  }

  /**
   * Get prediction history for a user
   */
  public getPredictionHistory(userId: string): ChurnPrediction[] {
    return this.predictionHistory.get(userId) || [];
  }

  /**
   * Get high-risk users
   */
  public getHighRiskUsers(): Array<{ userId: string; prediction: ChurnPrediction }> {
    const highRisk: Array<{ userId: string; prediction: ChurnPrediction }> = [];

    for (const [userId, history] of this.predictionHistory.entries()) {
      const latest = history[history.length - 1];
      if (latest && (latest.riskLevel === 'high' || latest.riskLevel === 'critical')) {
        highRisk.push({ userId, prediction: latest });
      }
    }

    return highRisk.sort((a, b) => b.prediction.churnProbability - a.prediction.churnProbability);
  }

  /**
   * Update model configuration
   */
  public updateConfig(config: Partial<ChurnModelConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Updated churn predictor configuration');
  }

  /**
   * Get model statistics
   */
  public getStats(): ChurnPredictorStats {
    let totalPredictions = 0;
    let highRiskCount = 0;

    for (const history of this.predictionHistory.values()) {
      totalPredictions += history.length;
      const latest = history[history.length - 1];
      if (latest && (latest.riskLevel === 'high' || latest.riskLevel === 'critical')) {
        highRiskCount++;
      }
    }

    return {
      totalUsers: this.predictionHistory.size,
      totalPredictions,
      highRiskUsers: highRiskCount,
      config: this.config,
    };
  }
}

// ==================== Helper Types ====================

interface UserChurnFeatures {
  sessionCount7d: number;
  sessionCount30d: number;
  daysSinceLastSession: number;
  loginFrequency7d: number;
  aiChatCount7d: number;
  paymentFailures90d: number;
  subscriptionTenureDays: number;
  goalCompletionRate: number;
  avgSessionDuration: number;
}

export interface ChurnPredictorStats {
  totalUsers: number;
  totalPredictions: number;
  highRiskUsers: number;
  config: ChurnModelConfig;
}

// Export singleton instance
export const churnPredictor = new ChurnPredictor();

// Export factory function
export const createChurnPredictor = (config?: Partial<ChurnModelConfig>): ChurnPredictor => {
  return new ChurnPredictor(config);
};
