import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface GoalSuccessPrediction {
  goalId: string;
  userId: string;
  successProbability: number; // 0-100%
  riskFactors: Array<{ factor: string; severity: 'low' | 'medium' | 'high'; explanation: string; }>;
  recommendations: Array<{ action: string; expectedImprovement: number; difficulty: 'easy' | 'medium' | 'hard'; }>;
  optimalAdjustments: {
    suggestedDeadline?: Date;
    recommendedMilestones?: number;
    coachSupportNeeded?: boolean;
  };
  predictedAt: Date;
}

export class GoalSuccessPredictionService extends EventEmitter {
  private static instance: GoalSuccessPredictionService;
  private predictions: Map<string, GoalSuccessPrediction> = new Map();

  private constructor() { super(); }

  static getInstance(): GoalSuccessPredictionService {
    if (!GoalSuccessPredictionService.instance) {
      GoalSuccessPredictionService.instance = new GoalSuccessPredictionService();
    }
    return GoalSuccessPredictionService.instance;
  }

  async predictGoalSuccess(goalId: string, userId: string, goalData: any): Promise<GoalSuccessPrediction> {
    const successProbability = this.calculateSuccessProbability(goalData);
    const riskFactors = this.identifyRiskFactors(goalData);
    const recommendations = this.generateRecommendations(riskFactors);
    const optimalAdjustments = this.calculateOptimalAdjustments(goalData, successProbability);

    const prediction: GoalSuccessPrediction = {
      goalId,
      userId,
      successProbability,
      riskFactors,
      recommendations,
      optimalAdjustments,
      predictedAt: new Date(),
    };

    this.predictions.set(goalId, prediction);
    this.emit('prediction:generated', prediction);
    return prediction;
  }

  private calculateSuccessProbability(goalData: any): number {
    let probability = 70; // Base probability
    if (goalData.hasCoach) probability += 15;
    if (goalData.milestones > 0) probability += 10;
    if (goalData.checkInFrequency === 'daily') probability += 5;
    if (goalData.historicalCompletionRate > 70) probability += 10;
    if (goalData.daysUntilDeadline < 7) probability -= 20;
    if (goalData.complexity > 8) probability -= 15;
    return Math.max(0, Math.min(100, probability));
  }

  private identifyRiskFactors(goalData: any): GoalSuccessPrediction['riskFactors'] {
    const factors: GoalSuccessPrediction['riskFactors'] = [];
    if (goalData.daysUntilDeadline < 7) {
      factors.push({ factor: 'Short Timeframe', severity: 'high', explanation: 'Less than 7 days to complete goal' });
    }
    if (!goalData.hasCoach) {
      factors.push({ factor: 'No Coach Support', severity: 'medium', explanation: 'Could benefit from coach guidance' });
    }
    if (goalData.milestones === 0) {
      factors.push({ factor: 'No Milestones', severity: 'medium', explanation: 'Breaking goal into milestones improves success rate' });
    }
    return factors;
  }

  private generateRecommendations(factors: GoalSuccessPrediction['riskFactors']): GoalSuccessPrediction['recommendations'] {
    const recommendations: GoalSuccessPrediction['recommendations'] = [];
    if (factors.some(f => f.factor.includes('Milestones'))) {
      recommendations.push({ action: 'Break goal into 3-5 smaller milestones', expectedImprovement: 25, difficulty: 'easy' });
    }
    if (factors.some(f => f.factor.includes('Timeframe'))) {
      recommendations.push({ action: 'Extend deadline by 2 weeks', expectedImprovement: 30, difficulty: 'easy' });
    }
    if (factors.some(f => f.factor.includes('Coach'))) {
      recommendations.push({ action: 'Schedule coaching session', expectedImprovement: 20, difficulty: 'medium' });
    }
    return recommendations;
  }

  private calculateOptimalAdjustments(goalData: any, probability: number): GoalSuccessPrediction['optimalAdjustments'] {
    const adjustments: GoalSuccessPrediction['optimalAdjustments'] = {};
    if (probability < 50 && goalData.daysUntilDeadline < 14) {
      const optimal = new Date();
      optimal.setDate(optimal.getDate() + 30);
      adjustments.suggestedDeadline = optimal;
    }
    if (goalData.milestones === 0) {
      adjustments.recommendedMilestones = Math.ceil(goalData.estimatedEffort / 10);
    }
    if (probability < 40) {
      adjustments.coachSupportNeeded = true;
    }
    return adjustments;
  }

  async getPrediction(goalId: string): Promise<GoalSuccessPrediction | null> {
    return this.predictions.get(goalId) || null;
  }
}

export const goalSuccessPredictionService = GoalSuccessPredictionService.getInstance();
