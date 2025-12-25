import * as tf from '@tensorflow/tfjs-node';
import { UserFeatures } from '../../../stream-processing/FeatureExtractor';
import { logger } from '../../../utils/logger';

/**
 * Goal Success Predictor
 *
 * Predicts probability of goal completion using LightGBM ensemble
 * Target accuracy: >82%
 */

export interface GoalFeatures {
  userId: string;
  goalId: string;
  goalType: string;
  targetDays: number;
  daysElapsed: number;
  progressPercentage: number;
  checkinsCompleted: number;
  checkinsMissed: number;
  currentStreak: number;
  longestStreak: number;
  avgDailyProgress: number;
  timeRemaining: number;
  userEngagementScore: number;
  userCompletionRate7d: number;
  userCompletionRate14d: number;
}

export interface GoalSuccessPrediction {
  userId: string;
  goalId: string;
  successProbability: number;
  completionEstimateDays: number;
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
  predictedAt: Date;
}

export class GoalSuccessPredictorService {
  private model: tf.GraphModel | null = null;
  private modelPath: string;
  private isLoading: boolean = false;

  constructor(modelPath: string = 'file://./models/goal-success-predictor/model.json') {
    this.modelPath = modelPath;
  }

  /**
   * Load TensorFlow.js model
   */
  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {
      logger.info('Loading Goal Success Predictor model', { path: this.modelPath });
      this.model = await tf.loadGraphModel(this.modelPath);
      logger.info('Goal Success Predictor model loaded successfully');
    } catch (error) {
      logger.warn('Failed to load Goal Success Predictor model, using rule-based fallback', { error });
      this.model = null;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Predict goal success probability
   */
  async predict(features: GoalFeatures): Promise<GoalSuccessPrediction> {
    await this.loadModel();

    let successProbability: number;
    let confidence: number;

    if (this.model) {
      try {
        const normalizedFeatures = this.normalizeFeatures(features);
        const inputTensor = tf.tensor2d([normalizedFeatures], [1, 10]);
        const prediction = this.model.predict(inputTensor) as tf.Tensor;
        const predictionData = await prediction.data();

        successProbability = predictionData[0];
        confidence = 0.85; // Model confidence

        // Cleanup tensors
        inputTensor.dispose();
        prediction.dispose();
      } catch (error) {
        logger.error('Model prediction failed, falling back to rules', { error });
        const rulePrediction = this.predictWithRules(features);
        successProbability = rulePrediction.successProbability;
        confidence = rulePrediction.confidence;
      }
    } else {
      const rulePrediction = this.predictWithRules(features);
      successProbability = rulePrediction.successProbability;
      confidence = rulePrediction.confidence;
    }

    const completionEstimateDays = this.estimateCompletionDays(features, successProbability);
    const riskFactors = this.identifyRiskFactors(features);
    const recommendations = this.generateRecommendations(features, riskFactors);

    return {
      userId: features.userId,
      goalId: features.goalId,
      successProbability,
      completionEstimateDays,
      riskFactors,
      recommendations,
      confidence,
      predictedAt: new Date(),
    };
  }

  /**
   * Normalize features for model input
   */
  private normalizeFeatures(features: GoalFeatures): number[] {
    return [
      features.progressPercentage / 100, // 0-1
      features.daysElapsed / Math.max(features.targetDays, 1), // 0-1
      features.checkinsCompleted / Math.max(features.targetDays, 1), // 0-1
      features.checkinsMissed / Math.max(features.targetDays, 1), // 0-1
      features.currentStreak / Math.max(features.targetDays, 1), // 0-1
      features.longestStreak / Math.max(features.targetDays, 1), // 0-1
      features.avgDailyProgress / 10, // Normalize to ~0-1 range
      features.timeRemaining / Math.max(features.targetDays, 1), // 0-1
      features.userEngagementScore / 100, // 0-1
      (features.userCompletionRate7d + features.userCompletionRate14d) / 2 / 100, // 0-1
    ];
  }

  /**
   * Rule-based prediction fallback
   */
  private predictWithRules(features: GoalFeatures): {
    successProbability: number;
    confidence: number;
  } {
    let score = 0.5; // Base probability
    let confidence = 0.65; // Lower confidence for rule-based

    // Progress-based factors
    if (features.progressPercentage >= 80) {
      score += 0.3;
    } else if (features.progressPercentage >= 50) {
      score += 0.15;
    } else if (features.progressPercentage < 20) {
      score -= 0.2;
    }

    // Consistency factors
    const consistencyRate = features.checkinsCompleted / Math.max(features.daysElapsed, 1);
    if (consistencyRate >= 0.8) {
      score += 0.2;
    } else if (consistencyRate < 0.5) {
      score -= 0.25;
    }

    // Streak factors
    if (features.currentStreak >= 7) {
      score += 0.15;
    } else if (features.currentStreak === 0) {
      score -= 0.1;
    }

    // Time pressure
    const progressRate = features.progressPercentage / Math.max(features.daysElapsed, 1);
    const requiredRate = (100 - features.progressPercentage) / Math.max(features.timeRemaining, 1);

    if (progressRate >= requiredRate * 1.2) {
      score += 0.1; // On track
    } else if (progressRate < requiredRate * 0.8) {
      score -= 0.2; // Behind schedule
    }

    // User engagement
    if (features.userEngagementScore >= 70) {
      score += 0.1;
    } else if (features.userEngagementScore < 40) {
      score -= 0.15;
    }

    return {
      successProbability: Math.max(0, Math.min(1, score)),
      confidence,
    };
  }

  /**
   * Estimate days to completion
   */
  private estimateCompletionDays(features: GoalFeatures, successProbability: number): number {
    if (features.progressPercentage >= 100) {
      return 0;
    }

    const remainingProgress = 100 - features.progressPercentage;
    const avgDailyProgress = features.avgDailyProgress || 1;

    // Adjust by success probability
    const adjustedDailyProgress = avgDailyProgress * successProbability;

    const estimatedDays = Math.ceil(remainingProgress / Math.max(adjustedDailyProgress, 0.1));

    return Math.min(estimatedDays, features.timeRemaining * 2); // Cap at 2x remaining time
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(features: GoalFeatures): string[] {
    const risks: string[] = [];

    if (features.currentStreak === 0 && features.daysElapsed > 3) {
      risks.push('no_active_streak');
    }

    if (features.checkinsMissed > features.checkinsCompleted && features.daysElapsed > 7) {
      risks.push('more_misses_than_completions');
    }

    if (features.avgDailyProgress < 1 && features.daysElapsed > 5) {
      risks.push('low_daily_progress');
    }

    const progressRate = features.progressPercentage / Math.max(features.daysElapsed, 1);
    const requiredRate = (100 - features.progressPercentage) / Math.max(features.timeRemaining, 1);

    if (requiredRate > progressRate * 1.5) {
      risks.push('behind_schedule');
    }

    if (features.userCompletionRate7d < 50) {
      risks.push('declining_user_engagement');
    }

    if (features.timeRemaining < 7 && features.progressPercentage < 70) {
      risks.push('time_pressure');
    }

    return risks;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(features: GoalFeatures, riskFactors: string[]): string[] {
    const recommendations: string[] = [];

    if (riskFactors.includes('no_active_streak')) {
      recommendations.push('Start a new streak today to build momentum');
    }

    if (riskFactors.includes('behind_schedule')) {
      recommendations.push('Consider increasing check-in frequency to catch up');
      recommendations.push('Break remaining progress into smaller daily milestones');
    }

    if (riskFactors.includes('low_daily_progress')) {
      recommendations.push('Set a higher daily progress target');
      recommendations.push('Schedule dedicated time blocks for this goal');
    }

    if (riskFactors.includes('declining_user_engagement')) {
      recommendations.push('Review and adjust goal difficulty if needed');
      recommendations.push('Connect with accountability partners');
    }

    if (riskFactors.includes('time_pressure')) {
      recommendations.push('Focus on critical milestones first');
      recommendations.push('Consider extending goal deadline if realistic');
    }

    if (features.currentStreak >= 7 && features.progressPercentage >= 50) {
      recommendations.push('Great progress! Maintain your current pace');
    }

    return recommendations;
  }

  /**
   * Predict batch of goals
   */
  async predictBatch(features: GoalFeatures[]): Promise<GoalSuccessPrediction[]> {
    return await Promise.all(features.map(f => this.predict(f)));
  }
}
