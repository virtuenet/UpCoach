/**
 * Goal Completion Predictor
 *
 * Predicts goal completion probability and timeline forecasting.
 * Uses historical data, goal characteristics, and user behavior patterns.
 *
 * Features:
 * - Goal completion probability prediction
 * - Timeline estimation and forecasting
 * - Milestone tracking and progress analysis
 * - Risk factor identification
 * - Personalized recommendations
 */

import { EventEmitter } from 'events';

// ==================== Types ====================

export interface GoalProfile {
  goalId: string;
  userId: string;
  coachId?: string;
  type: GoalType;
  difficulty: GoalDifficulty;
  category: string;
  startDate: Date;
  targetDate: Date;
  description?: string;
  milestones: Milestone[];
  currentProgress: number; // 0-100
  isShared: boolean;
  hasCoachSupport: boolean;
}

export type GoalType =
  | 'habit_formation'
  | 'skill_acquisition'
  | 'health_fitness'
  | 'career_advancement'
  | 'personal_development'
  | 'financial'
  | 'relationship'
  | 'creative'
  | 'educational'
  | 'lifestyle_change';

export type GoalDifficulty = 'easy' | 'moderate' | 'challenging' | 'ambitious' | 'extreme';

export interface Milestone {
  id: string;
  name: string;
  targetDate: Date;
  completedDate?: Date;
  progress: number; // 0-100
  isCompleted: boolean;
}

export interface UserGoalHistory {
  userId: string;
  totalGoalsCreated: number;
  totalGoalsCompleted: number;
  averageCompletionRate: number;
  averageDaysToComplete: number;
  goalsByCategory: Map<string, { completed: number; abandoned: number }>;
  streakDays: number;
  lastActivityDate: Date;
  engagementLevel: EngagementLevel;
}

export type EngagementLevel = 'highly_engaged' | 'active' | 'moderate' | 'low' | 'dormant';

export interface GoalCompletionPrediction {
  goalId: string;
  completionProbability: number; // 0-1
  confidenceLevel: number; // 0-1
  predictedCompletionDate: Date | null;
  riskLevel: GoalRiskLevel;
  riskFactors: GoalRiskFactor[];
  progressAnalysis: ProgressAnalysis;
  timeline: TimelineForecast;
  recommendations: GoalRecommendation[];
  predictedAt: Date;
}

export type GoalRiskLevel = 'on_track' | 'slight_delay' | 'at_risk' | 'critical' | 'likely_abandoned';

export interface GoalRiskFactor {
  factor: string;
  impact: number; // -1 to 1 (negative = risk, positive = boost)
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigationAction?: string;
}

export interface ProgressAnalysis {
  currentProgress: number;
  expectedProgress: number;
  progressGap: number; // negative = behind, positive = ahead
  velocityTrend: 'accelerating' | 'steady' | 'decelerating' | 'stalled';
  weeklyVelocity: number; // progress % per week
  consistencyScore: number; // 0-1
}

export interface TimelineForecast {
  originalTargetDate: Date;
  predictedCompletionDate: Date | null;
  daysRemaining: number;
  estimatedDaysToComplete: number;
  isOnTrack: boolean;
  delayDays: number; // positive = delayed, negative = ahead
  confidenceInterval: {
    optimistic: Date;
    pessimistic: Date;
  };
}

export interface GoalRecommendation {
  type: RecommendationType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: number; // 0-1
  actionItems: string[];
}

export type RecommendationType =
  | 'adjust_timeline'
  | 'break_into_milestones'
  | 'increase_frequency'
  | 'seek_accountability'
  | 'simplify_goal'
  | 'celebrate_progress'
  | 'address_blockers'
  | 'adjust_difficulty'
  | 'request_coach_support';

export interface BatchPredictionResult {
  predictions: GoalCompletionPrediction[];
  summary: {
    totalGoals: number;
    onTrackCount: number;
    atRiskCount: number;
    criticalCount: number;
    averageCompletionProbability: number;
  };
  generatedAt: Date;
}

export interface GoalInsight {
  userId: string;
  insights: Insight[];
  generatedAt: Date;
}

export interface Insight {
  type: InsightType;
  message: string;
  data: Record<string, unknown>;
  actionable: boolean;
  suggestedAction?: string;
}

export type InsightType =
  | 'pattern_detected'
  | 'success_factor'
  | 'risk_warning'
  | 'milestone_approaching'
  | 'streak_achievement'
  | 'comparison_benchmark';

// ==================== Configuration ====================

interface GoalCompletionConfig {
  baselineWeights: Record<GoalType, number>;
  difficultyMultipliers: Record<GoalDifficulty, number>;
  engagementBoosts: Record<EngagementLevel, number>;
  coachSupportBoost: number;
  milestoneCompletionBoost: number;
  consistencyWeight: number;
  velocityWeight: number;
  historyWeight: number;
  riskThresholds: {
    onTrack: number;
    slightDelay: number;
    atRisk: number;
    critical: number;
  };
}

const DEFAULT_CONFIG: GoalCompletionConfig = {
  baselineWeights: {
    habit_formation: 0.55,
    skill_acquisition: 0.50,
    health_fitness: 0.45,
    career_advancement: 0.50,
    personal_development: 0.55,
    financial: 0.45,
    relationship: 0.50,
    creative: 0.55,
    educational: 0.60,
    lifestyle_change: 0.40,
  },
  difficultyMultipliers: {
    easy: 1.2,
    moderate: 1.0,
    challenging: 0.85,
    ambitious: 0.70,
    extreme: 0.55,
  },
  engagementBoosts: {
    highly_engaged: 0.25,
    active: 0.15,
    moderate: 0.05,
    low: -0.10,
    dormant: -0.25,
  },
  coachSupportBoost: 0.15,
  milestoneCompletionBoost: 0.05,
  consistencyWeight: 0.25,
  velocityWeight: 0.20,
  historyWeight: 0.20,
  riskThresholds: {
    onTrack: 0.70,
    slightDelay: 0.50,
    atRisk: 0.30,
    critical: 0.15,
  },
};

// ==================== Service ====================

export class GoalCompletionPredictor extends EventEmitter {
  private config: GoalCompletionConfig;
  private predictionCache: Map<string, GoalCompletionPrediction> = new Map();
  private userHistoryCache: Map<string, UserGoalHistory> = new Map();
  private modelVersion: string = '1.0.0';

  constructor(config: Partial<GoalCompletionConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==================== Core Prediction ====================

  /**
   * Predict goal completion probability and timeline
   */
  public async predict(
    goal: GoalProfile,
    userHistory?: UserGoalHistory
  ): Promise<GoalCompletionPrediction> {
    const startTime = Date.now();

    // Use cached history if not provided
    const history = userHistory || this.userHistoryCache.get(goal.userId) || this.createDefaultHistory(goal.userId);

    // Calculate progress analysis
    const progressAnalysis = this.analyzeProgress(goal);

    // Calculate risk factors
    const riskFactors = this.identifyRiskFactors(goal, history, progressAnalysis);

    // Calculate base probability
    let probability = this.calculateBaseProbability(goal, history);

    // Apply progress adjustments
    probability = this.applyProgressAdjustments(probability, progressAnalysis);

    // Apply risk factor impacts
    for (const factor of riskFactors) {
      probability += factor.impact * 0.1;
    }

    // Clamp probability
    probability = Math.max(0, Math.min(1, probability));

    // Calculate timeline
    const timeline = this.forecastTimeline(goal, progressAnalysis, probability);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(probability, progressAnalysis);

    // Generate recommendations
    const recommendations = this.generateRecommendations(goal, riskFactors, progressAnalysis, riskLevel);

    // Calculate confidence
    const confidenceLevel = this.calculateConfidence(goal, history, progressAnalysis);

    const prediction: GoalCompletionPrediction = {
      goalId: goal.goalId,
      completionProbability: probability,
      confidenceLevel,
      predictedCompletionDate: timeline.predictedCompletionDate,
      riskLevel,
      riskFactors,
      progressAnalysis,
      timeline,
      recommendations,
      predictedAt: new Date(),
    };

    // Cache prediction
    this.predictionCache.set(goal.goalId, prediction);

    const latency = Date.now() - startTime;
    this.emit('prediction', {
      goalId: goal.goalId,
      probability,
      riskLevel,
      latency,
    });

    return prediction;
  }

  /**
   * Predict for multiple goals
   */
  public async predictBatch(
    goals: GoalProfile[],
    userHistories?: Map<string, UserGoalHistory>
  ): Promise<BatchPredictionResult> {
    const predictions: GoalCompletionPrediction[] = [];

    for (const goal of goals) {
      const history = userHistories?.get(goal.userId);
      const prediction = await this.predict(goal, history);
      predictions.push(prediction);
    }

    const onTrackCount = predictions.filter(p => p.riskLevel === 'on_track').length;
    const atRiskCount = predictions.filter(p => p.riskLevel === 'at_risk').length;
    const criticalCount = predictions.filter(p =>
      p.riskLevel === 'critical' || p.riskLevel === 'likely_abandoned'
    ).length;

    const avgProbability = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.completionProbability, 0) / predictions.length
      : 0;

    return {
      predictions,
      summary: {
        totalGoals: predictions.length,
        onTrackCount,
        atRiskCount,
        criticalCount,
        averageCompletionProbability: avgProbability,
      },
      generatedAt: new Date(),
    };
  }

  // ==================== Progress Analysis ====================

  private analyzeProgress(goal: GoalProfile): ProgressAnalysis {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const targetDate = new Date(goal.targetDate);

    const totalDuration = targetDate.getTime() - startDate.getTime();
    const elapsedDuration = now.getTime() - startDate.getTime();
    const timeProgress = Math.max(0, Math.min(1, elapsedDuration / totalDuration));

    const expectedProgress = timeProgress * 100;
    const progressGap = goal.currentProgress - expectedProgress;

    // Calculate velocity from milestones
    const completedMilestones = goal.milestones.filter(m => m.isCompleted);
    let weeklyVelocity = 0;
    let velocityTrend: ProgressAnalysis['velocityTrend'] = 'steady';

    if (completedMilestones.length >= 2) {
      const recentMilestones = completedMilestones.slice(-3);
      const velocities: number[] = [];

      for (let i = 1; i < recentMilestones.length; i++) {
        const prev = recentMilestones[i - 1];
        const curr = recentMilestones[i];
        if (prev.completedDate && curr.completedDate) {
          const daysDiff = (curr.completedDate.getTime() - prev.completedDate.getTime()) / (1000 * 60 * 60 * 24);
          const progressDiff = curr.progress - prev.progress;
          if (daysDiff > 0) {
            velocities.push((progressDiff / daysDiff) * 7);
          }
        }
      }

      if (velocities.length > 0) {
        weeklyVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;

        if (velocities.length >= 2) {
          const recent = velocities[velocities.length - 1];
          const older = velocities[0];
          const changeRatio = recent / older;

          if (changeRatio > 1.2) velocityTrend = 'accelerating';
          else if (changeRatio < 0.8) velocityTrend = 'decelerating';
          else velocityTrend = 'steady';
        }
      }
    } else if (goal.currentProgress > 0) {
      const daysElapsed = elapsedDuration / (1000 * 60 * 60 * 24);
      weeklyVelocity = daysElapsed > 0 ? (goal.currentProgress / daysElapsed) * 7 : 0;
    }

    if (weeklyVelocity < 0.5 && goal.currentProgress < 10) {
      velocityTrend = 'stalled';
    }

    // Calculate consistency from milestone completion
    const consistencyScore = this.calculateConsistencyScore(goal);

    return {
      currentProgress: goal.currentProgress,
      expectedProgress,
      progressGap,
      velocityTrend,
      weeklyVelocity,
      consistencyScore,
    };
  }

  private calculateConsistencyScore(goal: GoalProfile): number {
    if (goal.milestones.length === 0) {
      return 0.5; // Default for no milestones
    }

    const completedMilestones = goal.milestones.filter(m => m.isCompleted);
    if (completedMilestones.length < 2) {
      return completedMilestones.length > 0 ? 0.6 : 0.4;
    }

    // Check if milestones were completed on time
    let onTimeCount = 0;
    for (const milestone of completedMilestones) {
      if (milestone.completedDate && milestone.completedDate <= milestone.targetDate) {
        onTimeCount++;
      }
    }

    return onTimeCount / completedMilestones.length;
  }

  // ==================== Risk Factors ====================

  private identifyRiskFactors(
    goal: GoalProfile,
    history: UserGoalHistory,
    progress: ProgressAnalysis
  ): GoalRiskFactor[] {
    const factors: GoalRiskFactor[] = [];

    // Progress gap risk
    if (progress.progressGap < -20) {
      factors.push({
        factor: 'significant_progress_gap',
        impact: -0.3,
        severity: 'high',
        description: `${Math.abs(progress.progressGap).toFixed(1)}% behind expected progress`,
        mitigationAction: 'Consider breaking goal into smaller milestones',
      });
    } else if (progress.progressGap < -10) {
      factors.push({
        factor: 'moderate_progress_gap',
        impact: -0.15,
        severity: 'medium',
        description: `${Math.abs(progress.progressGap).toFixed(1)}% behind expected progress`,
        mitigationAction: 'Increase weekly focus time',
      });
    } else if (progress.progressGap > 10) {
      factors.push({
        factor: 'ahead_of_schedule',
        impact: 0.15,
        severity: 'low',
        description: `${progress.progressGap.toFixed(1)}% ahead of schedule`,
      });
    }

    // Velocity trend
    if (progress.velocityTrend === 'stalled') {
      factors.push({
        factor: 'stalled_progress',
        impact: -0.4,
        severity: 'high',
        description: 'Goal progress has stalled',
        mitigationAction: 'Identify and address blockers immediately',
      });
    } else if (progress.velocityTrend === 'decelerating') {
      factors.push({
        factor: 'decelerating_velocity',
        impact: -0.2,
        severity: 'medium',
        description: 'Progress rate is slowing down',
        mitigationAction: 'Review and adjust approach',
      });
    } else if (progress.velocityTrend === 'accelerating') {
      factors.push({
        factor: 'accelerating_velocity',
        impact: 0.2,
        severity: 'low',
        description: 'Progress rate is increasing',
      });
    }

    // Historical completion rate
    if (history.averageCompletionRate < 0.3) {
      factors.push({
        factor: 'low_historical_completion',
        impact: -0.25,
        severity: 'high',
        description: `Historical completion rate: ${(history.averageCompletionRate * 100).toFixed(0)}%`,
        mitigationAction: 'Consider working with a coach for accountability',
      });
    } else if (history.averageCompletionRate > 0.7) {
      factors.push({
        factor: 'high_historical_completion',
        impact: 0.15,
        severity: 'low',
        description: `Strong track record: ${(history.averageCompletionRate * 100).toFixed(0)}% completion rate`,
      });
    }

    // Engagement level
    if (history.engagementLevel === 'dormant') {
      factors.push({
        factor: 'user_dormant',
        impact: -0.35,
        severity: 'high',
        description: 'User has been inactive',
        mitigationAction: 'Re-engage with goal review session',
      });
    } else if (history.engagementLevel === 'low') {
      factors.push({
        factor: 'low_engagement',
        impact: -0.2,
        severity: 'medium',
        description: 'Low user engagement',
        mitigationAction: 'Increase check-in frequency',
      });
    }

    // Goal difficulty vs history
    const categoryHistory = history.goalsByCategory.get(goal.category);
    if (categoryHistory) {
      const categoryCompletionRate = categoryHistory.completed /
        (categoryHistory.completed + categoryHistory.abandoned);
      if (categoryCompletionRate < 0.4) {
        factors.push({
          factor: 'category_struggle',
          impact: -0.15,
          severity: 'medium',
          description: `Historically struggles with ${goal.category} goals`,
          mitigationAction: 'Consider different approach for this category',
        });
      }
    }

    // Time pressure
    const now = new Date();
    const daysRemaining = (new Date(goal.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const progressNeeded = 100 - goal.currentProgress;
    const requiredDailyProgress = progressNeeded / Math.max(1, daysRemaining);

    if (requiredDailyProgress > 5) {
      factors.push({
        factor: 'extreme_time_pressure',
        impact: -0.3,
        severity: 'high',
        description: `Need ${requiredDailyProgress.toFixed(1)}% daily progress to complete on time`,
        mitigationAction: 'Extend deadline or reduce scope',
      });
    } else if (requiredDailyProgress > 2) {
      factors.push({
        factor: 'time_pressure',
        impact: -0.15,
        severity: 'medium',
        description: `Need ${requiredDailyProgress.toFixed(1)}% daily progress`,
      });
    }

    // Coach support factor
    if (goal.hasCoachSupport) {
      factors.push({
        factor: 'has_coach_support',
        impact: 0.15,
        severity: 'low',
        description: 'Active coach support increases success probability',
      });
    }

    // Milestones factor
    const milestoneCompletionRate = goal.milestones.length > 0
      ? goal.milestones.filter(m => m.isCompleted).length / goal.milestones.length
      : 0;

    if (milestoneCompletionRate > 0.7 && goal.milestones.length >= 3) {
      factors.push({
        factor: 'strong_milestone_progress',
        impact: 0.2,
        severity: 'low',
        description: 'Consistently completing milestones',
      });
    }

    return factors;
  }

  // ==================== Probability Calculation ====================

  private calculateBaseProbability(goal: GoalProfile, history: UserGoalHistory): number {
    // Start with baseline for goal type
    let probability = this.config.baselineWeights[goal.type];

    // Apply difficulty multiplier
    probability *= this.config.difficultyMultipliers[goal.difficulty];

    // Apply engagement boost
    probability += this.config.engagementBoosts[history.engagementLevel];

    // Apply coach support boost
    if (goal.hasCoachSupport) {
      probability += this.config.coachSupportBoost;
    }

    // Apply historical completion weight
    const historyAdjustment = (history.averageCompletionRate - 0.5) * this.config.historyWeight;
    probability += historyAdjustment;

    return Math.max(0.1, Math.min(0.95, probability));
  }

  private applyProgressAdjustments(probability: number, progress: ProgressAnalysis): number {
    // Consistency adjustment
    const consistencyAdjustment = (progress.consistencyScore - 0.5) * this.config.consistencyWeight;
    probability += consistencyAdjustment;

    // Velocity adjustment
    let velocityAdjustment = 0;
    if (progress.weeklyVelocity > 10) velocityAdjustment = 0.1;
    else if (progress.weeklyVelocity > 5) velocityAdjustment = 0.05;
    else if (progress.weeklyVelocity < 1) velocityAdjustment = -0.1;

    probability += velocityAdjustment * this.config.velocityWeight;

    // Progress gap adjustment (normalized)
    const normalizedGap = progress.progressGap / 50; // Scale to -1 to 1 range
    probability += normalizedGap * 0.15;

    return probability;
  }

  // ==================== Timeline Forecasting ====================

  private forecastTimeline(
    goal: GoalProfile,
    progress: ProgressAnalysis,
    probability: number
  ): TimelineForecast {
    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const startDate = new Date(goal.startDate);

    const daysRemaining = Math.max(0, (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const remainingProgress = 100 - goal.currentProgress;

    // Estimate days to complete based on velocity
    let estimatedDaysToComplete: number;
    if (progress.weeklyVelocity > 0) {
      estimatedDaysToComplete = (remainingProgress / progress.weeklyVelocity) * 7;
    } else {
      // Fallback: use time-based linear extrapolation
      const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (goal.currentProgress > 0) {
        const daysPerPercent = elapsedDays / goal.currentProgress;
        estimatedDaysToComplete = remainingProgress * daysPerPercent;
      } else {
        estimatedDaysToComplete = daysRemaining * 2; // Pessimistic if no progress
      }
    }

    const predictedCompletionDate = new Date(now.getTime() + estimatedDaysToComplete * 24 * 60 * 60 * 1000);
    const delayDays = (predictedCompletionDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);
    const isOnTrack = delayDays <= 0;

    // Confidence interval (±20% adjustment based on consistency)
    const varianceMultiplier = 1 + (1 - progress.consistencyScore) * 0.4;
    const optimisticDays = estimatedDaysToComplete * 0.8;
    const pessimisticDays = estimatedDaysToComplete * varianceMultiplier;

    return {
      originalTargetDate: targetDate,
      predictedCompletionDate: probability > 0.1 ? predictedCompletionDate : null,
      daysRemaining,
      estimatedDaysToComplete: Math.ceil(estimatedDaysToComplete),
      isOnTrack,
      delayDays: Math.round(delayDays),
      confidenceInterval: {
        optimistic: new Date(now.getTime() + optimisticDays * 24 * 60 * 60 * 1000),
        pessimistic: new Date(now.getTime() + pessimisticDays * 24 * 60 * 60 * 1000),
      },
    };
  }

  // ==================== Risk Level & Recommendations ====================

  private determineRiskLevel(probability: number, progress: ProgressAnalysis): GoalRiskLevel {
    if (probability >= this.config.riskThresholds.onTrack && progress.velocityTrend !== 'stalled') {
      return 'on_track';
    } else if (probability >= this.config.riskThresholds.slightDelay) {
      return 'slight_delay';
    } else if (probability >= this.config.riskThresholds.atRisk) {
      return 'at_risk';
    } else if (probability >= this.config.riskThresholds.critical) {
      return 'critical';
    } else {
      return 'likely_abandoned';
    }
  }

  private generateRecommendations(
    goal: GoalProfile,
    riskFactors: GoalRiskFactor[],
    progress: ProgressAnalysis,
    riskLevel: GoalRiskLevel
  ): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = [];

    // Timeline adjustment recommendation
    if (progress.progressGap < -15 || riskLevel === 'critical') {
      recommendations.push({
        type: 'adjust_timeline',
        priority: 'high',
        title: 'Adjust Target Date',
        description: 'Current timeline is unrealistic. Consider extending the deadline to reduce pressure and increase success probability.',
        expectedImpact: 0.2,
        actionItems: [
          'Review and extend target date by 20-30%',
          'Communicate adjusted timeline to stakeholders',
          'Set new milestone checkpoints',
        ],
      });
    }

    // Milestone recommendation
    if (goal.milestones.length < 3 && goal.currentProgress < 50) {
      recommendations.push({
        type: 'break_into_milestones',
        priority: 'high',
        title: 'Add More Milestones',
        description: 'Breaking the goal into smaller milestones improves tracking and motivation.',
        expectedImpact: 0.15,
        actionItems: [
          'Identify 3-5 key checkpoints',
          'Set dates for each milestone',
          'Define success criteria for each',
        ],
      });
    }

    // Accountability recommendation
    if (!goal.hasCoachSupport && riskLevel !== 'on_track') {
      recommendations.push({
        type: 'request_coach_support',
        priority: 'medium',
        title: 'Get Coach Support',
        description: 'Working with a coach increases goal completion by up to 33%.',
        expectedImpact: 0.15,
        actionItems: [
          'Connect with an available coach',
          'Schedule weekly check-ins',
          'Share goal details and blockers',
        ],
      });
    }

    // Velocity improvement
    if (progress.velocityTrend === 'stalled' || progress.velocityTrend === 'decelerating') {
      recommendations.push({
        type: 'address_blockers',
        priority: 'high',
        title: 'Address Progress Blockers',
        description: 'Your progress has slowed. Identify and remove obstacles.',
        expectedImpact: 0.25,
        actionItems: [
          'List current blockers',
          'Prioritize by impact',
          'Create action plan for each',
          'Consider simplifying approach',
        ],
      });
    }

    // Celebrate progress
    if (progress.currentProgress > 50 && goal.milestones.filter(m => m.isCompleted).length > 0) {
      recommendations.push({
        type: 'celebrate_progress',
        priority: 'low',
        title: 'Celebrate Your Progress',
        description: 'You\'re over halfway there! Acknowledging progress boosts motivation.',
        expectedImpact: 0.05,
        actionItems: [
          'Share your achievement',
          'Reward yourself appropriately',
          'Reflect on what\'s working',
        ],
      });
    }

    // Simplify for extreme difficulty
    if (goal.difficulty === 'extreme' || goal.difficulty === 'ambitious') {
      const hasBlockerFactors = riskFactors.some(f =>
        f.factor === 'significant_progress_gap' || f.factor === 'stalled_progress'
      );
      if (hasBlockerFactors) {
        recommendations.push({
          type: 'simplify_goal',
          priority: 'medium',
          title: 'Consider Simplifying',
          description: 'The goal may be too ambitious. Consider reducing scope for a quick win.',
          expectedImpact: 0.2,
          actionItems: [
            'Identify the core outcome',
            'Remove nice-to-have elements',
            'Focus on 80% of value with 20% effort',
          ],
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, 5); // Return top 5
  }

  // ==================== Insights ====================

  /**
   * Generate personalized insights for a user's goals
   */
  public async generateInsights(
    userId: string,
    goals: GoalProfile[],
    history: UserGoalHistory
  ): Promise<GoalInsight> {
    const insights: Insight[] = [];

    // Pattern: Time of week success
    const completedMilestones = goals.flatMap(g =>
      g.milestones.filter(m => m.isCompleted && m.completedDate)
    );

    if (completedMilestones.length >= 5) {
      const weekdayCounts = new Map<number, number>();
      for (const m of completedMilestones) {
        const day = m.completedDate!.getDay();
        weekdayCounts.set(day, (weekdayCounts.get(day) || 0) + 1);
      }
      const mostProductiveDay = [...weekdayCounts.entries()]
        .sort((a, b) => b[1] - a[1])[0];

      if (mostProductiveDay) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        insights.push({
          type: 'pattern_detected',
          message: `You complete most milestones on ${days[mostProductiveDay[0]]}s. Schedule important work accordingly.`,
          data: { dayOfWeek: mostProductiveDay[0], count: mostProductiveDay[1] },
          actionable: true,
          suggestedAction: `Plan key goal activities for ${days[mostProductiveDay[0]]}`,
        });
      }
    }

    // Success factor: Categories
    const categorySuccessRates: Array<{ category: string; rate: number }> = [];
    history.goalsByCategory.forEach((stats, category) => {
      const rate = stats.completed / (stats.completed + stats.abandoned);
      if (stats.completed + stats.abandoned >= 2) {
        categorySuccessRates.push({ category, rate });
      }
    });

    const bestCategory = categorySuccessRates.sort((a, b) => b.rate - a.rate)[0];
    if (bestCategory && bestCategory.rate > 0.7) {
      insights.push({
        type: 'success_factor',
        message: `You excel at ${bestCategory.category} goals (${(bestCategory.rate * 100).toFixed(0)}% success rate).`,
        data: { category: bestCategory.category, successRate: bestCategory.rate },
        actionable: false,
      });
    }

    // Risk warning: Active goals at risk
    const predictions = await this.predictBatch(goals.filter(g => g.currentProgress < 100));
    const atRiskGoals = predictions.predictions.filter(p =>
      p.riskLevel === 'at_risk' || p.riskLevel === 'critical'
    );

    if (atRiskGoals.length > 0) {
      insights.push({
        type: 'risk_warning',
        message: `${atRiskGoals.length} goal(s) need attention. Review and adjust before they slip further.`,
        data: { goalIds: atRiskGoals.map(g => g.goalId), count: atRiskGoals.length },
        actionable: true,
        suggestedAction: 'Review at-risk goals and consider adjusting timelines',
      });
    }

    // Milestone approaching
    const now = new Date();
    const upcomingMilestones = goals.flatMap(g =>
      g.milestones.filter(m => {
        const daysUntil = (new Date(m.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return !m.isCompleted && daysUntil > 0 && daysUntil <= 7;
      })
    );

    if (upcomingMilestones.length > 0) {
      insights.push({
        type: 'milestone_approaching',
        message: `${upcomingMilestones.length} milestone(s) due within the next week.`,
        data: { milestones: upcomingMilestones.map(m => ({ id: m.id, name: m.name, targetDate: m.targetDate })) },
        actionable: true,
        suggestedAction: 'Focus on completing upcoming milestones',
      });
    }

    // Streak achievement
    if (history.streakDays >= 7) {
      insights.push({
        type: 'streak_achievement',
        message: `${history.streakDays}-day activity streak! Keep the momentum going.`,
        data: { streakDays: history.streakDays },
        actionable: false,
      });
    }

    return {
      userId,
      insights,
      generatedAt: new Date(),
    };
  }

  // ==================== Utility Methods ====================

  private calculateConfidence(
    goal: GoalProfile,
    history: UserGoalHistory,
    progress: ProgressAnalysis
  ): number {
    let confidence = 0.5;

    // More history = more confidence
    if (history.totalGoalsCreated >= 10) confidence += 0.15;
    else if (history.totalGoalsCreated >= 5) confidence += 0.1;
    else if (history.totalGoalsCreated >= 2) confidence += 0.05;

    // More milestones = more data points
    if (goal.milestones.length >= 5) confidence += 0.1;
    else if (goal.milestones.length >= 3) confidence += 0.05;

    // Higher consistency = more predictable
    confidence += progress.consistencyScore * 0.15;

    // Steady velocity is more predictable
    if (progress.velocityTrend === 'steady') confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  private createDefaultHistory(userId: string): UserGoalHistory {
    return {
      userId,
      totalGoalsCreated: 0,
      totalGoalsCompleted: 0,
      averageCompletionRate: 0.5,
      averageDaysToComplete: 30,
      goalsByCategory: new Map(),
      streakDays: 0,
      lastActivityDate: new Date(),
      engagementLevel: 'moderate',
    };
  }

  /**
   * Get at-risk goals for a user
   */
  public getAtRiskGoals(): Array<{ goalId: string; prediction: GoalCompletionPrediction }> {
    const atRisk: Array<{ goalId: string; prediction: GoalCompletionPrediction }> = [];

    this.predictionCache.forEach((prediction, goalId) => {
      if (prediction.riskLevel === 'at_risk' || prediction.riskLevel === 'critical' || prediction.riskLevel === 'likely_abandoned') {
        atRisk.push({ goalId, prediction });
      }
    });

    return atRisk.sort((a, b) =>
      a.prediction.completionProbability - b.prediction.completionProbability
    );
  }

  /**
   * Update user history cache
   */
  public updateUserHistory(history: UserGoalHistory): void {
    this.userHistoryCache.set(history.userId, history);
    this.emit('historyUpdated', { userId: history.userId });
  }

  /**
   * Clear prediction cache
   */
  public clearCache(): void {
    this.predictionCache.clear();
    this.emit('cacheCleared');
  }

  /**
   * Get model version
   */
  public getModelVersion(): string {
    return this.modelVersion;
  }
}

// ==================== Export ====================

export const goalCompletionPredictor = new GoalCompletionPredictor();

export function createGoalCompletionPredictor(
  config?: Partial<GoalCompletionConfig>
): GoalCompletionPredictor {
  return new GoalCompletionPredictor(config);
}

export default GoalCompletionPredictor;
