/**
 * Session Outcome Predictor
 * Predicts coaching session success probability and provides recommendations
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

// ==================== Type Definitions ====================

export interface SessionInput {
  sessionId: string;
  coachId: string;
  clientId: string;
  scheduledTime: Date;
  sessionType: SessionType;
  isFirstSession: boolean;
  coachRating?: number;
  clientEngagementScore?: number;
  previousSessionRating?: number;
  daysSinceLastSession?: number;
  topicsPlanned?: string[];
  clientMood?: ClientMood;
  sessionDurationMinutes?: number;
}

export type SessionType = 'intro' | 'regular' | 'goal_review' | 'crisis' | 'follow_up';
export type ClientMood = 'positive' | 'neutral' | 'anxious' | 'frustrated' | 'unknown';

export interface SessionPrediction {
  sessionId: string;
  successProbability: number;
  predictedRating: number;
  riskFactors: SessionRiskFactor[];
  successFactors: SessionSuccessFactor[];
  recommendedActions: RecommendedAction[];
  optimalDuration: number;
  prepSuggestions: string[];
  confidence: number;
  timestamp: Date;
}

export interface SessionRiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  mitigation?: string;
}

export interface SessionSuccessFactor {
  factor: string;
  contribution: number;
  description: string;
}

export interface RecommendedAction {
  action: string;
  timing: 'before' | 'during' | 'after';
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export interface SessionTimeOptimization {
  optimalDayOfWeek: number[];
  optimalTimeRanges: TimeRange[];
  avoidTimes: TimeRange[];
  reason: string;
}

export interface TimeRange {
  startHour: number;
  endHour: number;
}

// ==================== Session Outcome Predictor ====================

export class SessionOutcomePredictor extends EventEmitter {
  private sessionHistory: Map<string, SessionPrediction[]> = new Map();

  private readonly sessionTypeWeights: Record<SessionType, number> = {
    intro: 0.7, // First sessions are challenging
    regular: 0.85,
    goal_review: 0.8,
    crisis: 0.6, // Crisis sessions are difficult
    follow_up: 0.9, // Follow-ups usually go well
  };

  constructor() {
    super();
  }

  /**
   * Predict session outcome
   */
  public predict(input: SessionInput): SessionPrediction {
    const startTime = Date.now();

    // Calculate base probability from session type
    let baseProbability = this.sessionTypeWeights[input.sessionType] || 0.8;

    // Calculate adjustments from various factors
    const adjustments = this.calculateAdjustments(input);

    // Apply adjustments
    let successProbability = baseProbability;
    for (const adj of adjustments) {
      successProbability += adj.value;
    }

    // Clamp to valid range
    successProbability = Math.max(0.1, Math.min(0.95, successProbability));

    // Predict rating (1-5 scale based on success probability)
    const predictedRating = this.predictRating(successProbability, input);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(input, adjustments);

    // Identify success factors
    const successFactors = this.identifySuccessFactors(input, adjustments);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendations(input, riskFactors);

    // Calculate optimal duration
    const optimalDuration = this.calculateOptimalDuration(input);

    // Generate prep suggestions
    const prepSuggestions = this.generatePrepSuggestions(input, riskFactors);

    // Calculate confidence
    const confidence = this.calculateConfidence(input);

    const prediction: SessionPrediction = {
      sessionId: input.sessionId,
      successProbability,
      predictedRating,
      riskFactors,
      successFactors,
      recommendedActions,
      optimalDuration,
      prepSuggestions,
      confidence,
      timestamp: new Date(),
    };

    // Store prediction
    this.storePrediction(input.clientId, prediction);

    this.emit('prediction:made', {
      sessionId: input.sessionId,
      probability: successProbability,
      latencyMs: Date.now() - startTime,
    });

    return prediction;
  }

  /**
   * Calculate adjustments based on input factors
   */
  private calculateAdjustments(input: SessionInput): Array<{ factor: string; value: number }> {
    const adjustments: Array<{ factor: string; value: number }> = [];

    // Time of day adjustment
    const hour = input.scheduledTime.getHours();
    if (hour >= 9 && hour <= 11) {
      adjustments.push({ factor: 'optimal_morning', value: 0.05 });
    } else if (hour >= 14 && hour <= 16) {
      adjustments.push({ factor: 'optimal_afternoon', value: 0.03 });
    } else if (hour < 8 || hour > 20) {
      adjustments.push({ factor: 'off_hours', value: -0.1 });
    }

    // Day of week adjustment
    const dayOfWeek = input.scheduledTime.getDay();
    if (dayOfWeek === 1 || dayOfWeek === 2) { // Monday, Tuesday
      adjustments.push({ factor: 'early_week', value: 0.03 });
    } else if (dayOfWeek === 5) { // Friday
      adjustments.push({ factor: 'friday', value: -0.02 });
    } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      adjustments.push({ factor: 'weekend', value: -0.05 });
    }

    // Coach rating impact
    if (input.coachRating !== undefined) {
      if (input.coachRating >= 4.5) {
        adjustments.push({ factor: 'excellent_coach', value: 0.1 });
      } else if (input.coachRating >= 4.0) {
        adjustments.push({ factor: 'good_coach', value: 0.05 });
      } else if (input.coachRating < 3.5) {
        adjustments.push({ factor: 'low_rated_coach', value: -0.1 });
      }
    }

    // Client engagement score impact
    if (input.clientEngagementScore !== undefined) {
      if (input.clientEngagementScore >= 0.8) {
        adjustments.push({ factor: 'high_engagement', value: 0.1 });
      } else if (input.clientEngagementScore >= 0.5) {
        adjustments.push({ factor: 'moderate_engagement', value: 0.02 });
      } else {
        adjustments.push({ factor: 'low_engagement', value: -0.1 });
      }
    }

    // Previous session rating impact
    if (input.previousSessionRating !== undefined) {
      if (input.previousSessionRating >= 4) {
        adjustments.push({ factor: 'positive_history', value: 0.08 });
      } else if (input.previousSessionRating < 3) {
        adjustments.push({ factor: 'negative_history', value: -0.08 });
      }
    }

    // Time since last session
    if (input.daysSinceLastSession !== undefined) {
      if (input.daysSinceLastSession > 30) {
        adjustments.push({ factor: 'long_gap', value: -0.1 });
      } else if (input.daysSinceLastSession > 14) {
        adjustments.push({ factor: 'moderate_gap', value: -0.05 });
      } else if (input.daysSinceLastSession >= 3 && input.daysSinceLastSession <= 7) {
        adjustments.push({ factor: 'optimal_frequency', value: 0.05 });
      }
    }

    // First session penalty
    if (input.isFirstSession) {
      adjustments.push({ factor: 'first_session', value: -0.1 });
    }

    // Client mood impact
    if (input.clientMood) {
      switch (input.clientMood) {
        case 'positive':
          adjustments.push({ factor: 'positive_mood', value: 0.1 });
          break;
        case 'anxious':
          adjustments.push({ factor: 'anxious_mood', value: -0.05 });
          break;
        case 'frustrated':
          adjustments.push({ factor: 'frustrated_mood', value: -0.1 });
          break;
      }
    }

    // Topics planned
    if (input.topicsPlanned && input.topicsPlanned.length > 0) {
      adjustments.push({ factor: 'topics_prepared', value: 0.05 });
      if (input.topicsPlanned.length > 3) {
        adjustments.push({ factor: 'too_many_topics', value: -0.03 });
      }
    }

    return adjustments;
  }

  /**
   * Predict session rating
   */
  private predictRating(successProbability: number, input: SessionInput): number {
    // Base rating from probability
    let rating = successProbability * 4 + 1; // Maps 0-1 to 1-5

    // Adjust based on session type expectations
    if (input.sessionType === 'crisis') {
      rating = Math.max(rating - 0.5, 3); // Crisis sessions often rated lower
    } else if (input.sessionType === 'intro') {
      rating = Math.max(rating - 0.3, 3.5); // Intro sessions have learning curve
    }

    // Previous rating momentum
    if (input.previousSessionRating !== undefined) {
      rating = rating * 0.7 + input.previousSessionRating * 0.3;
    }

    return Math.round(rating * 10) / 10; // Round to 1 decimal
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(
    input: SessionInput,
    adjustments: Array<{ factor: string; value: number }>
  ): SessionRiskFactor[] {
    const risks: SessionRiskFactor[] = [];

    // Check for negative adjustments
    for (const adj of adjustments) {
      if (adj.value < -0.05) {
        const riskInfo = this.getRiskInfo(adj.factor);
        if (riskInfo) {
          risks.push(riskInfo);
        }
      }
    }

    // Session-specific risks
    if (input.isFirstSession) {
      risks.push({
        factor: 'first_session',
        impact: 'medium',
        description: 'First sessions require extra rapport building',
        mitigation: 'Allocate extra time for introductions and expectation setting',
      });
    }

    if (input.sessionType === 'crisis') {
      risks.push({
        factor: 'crisis_session',
        impact: 'high',
        description: 'Crisis sessions are emotionally demanding',
        mitigation: 'Prepare crisis intervention protocols and resources',
      });
    }

    if (input.daysSinceLastSession && input.daysSinceLastSession > 21) {
      risks.push({
        factor: 'long_absence',
        impact: 'medium',
        description: 'Long gap may require re-establishing connection',
        mitigation: 'Review previous session notes and send warm-up message',
      });
    }

    return risks.sort((a, b) => this.impactToNumber(b.impact) - this.impactToNumber(a.impact));
  }

  /**
   * Get risk information for a factor
   */
  private getRiskInfo(factor: string): SessionRiskFactor | null {
    const riskMap: Record<string, SessionRiskFactor> = {
      off_hours: {
        factor: 'off_hours',
        impact: 'medium',
        description: 'Session scheduled outside optimal hours',
        mitigation: 'Consider rescheduling to morning or early afternoon',
      },
      friday: {
        factor: 'end_of_week',
        impact: 'low',
        description: 'Friday sessions may have lower engagement',
        mitigation: 'Keep session focused and action-oriented',
      },
      weekend: {
        factor: 'weekend_session',
        impact: 'medium',
        description: 'Weekend sessions often have scheduling conflicts',
        mitigation: 'Confirm attendance 24 hours before',
      },
      low_rated_coach: {
        factor: 'coach_rating',
        impact: 'high',
        description: 'Coach has below-average ratings',
        mitigation: 'Review coaching techniques and seek feedback',
      },
      low_engagement: {
        factor: 'client_engagement',
        impact: 'high',
        description: 'Client shows low platform engagement',
        mitigation: 'Address engagement barriers during session',
      },
      negative_history: {
        factor: 'previous_session',
        impact: 'medium',
        description: 'Previous session received low rating',
        mitigation: 'Review feedback and adjust approach',
      },
      long_gap: {
        factor: 'session_frequency',
        impact: 'medium',
        description: 'Over 30 days since last session',
        mitigation: 'Spend time reconnecting and reviewing progress',
      },
      frustrated_mood: {
        factor: 'client_mood',
        impact: 'high',
        description: 'Client reported feeling frustrated',
        mitigation: 'Start with empathy and active listening',
      },
      anxious_mood: {
        factor: 'client_mood',
        impact: 'medium',
        description: 'Client reported feeling anxious',
        mitigation: 'Use calming techniques and provide reassurance',
      },
      too_many_topics: {
        factor: 'agenda_scope',
        impact: 'low',
        description: 'Too many topics may reduce depth',
        mitigation: 'Prioritize and potentially defer some topics',
      },
    };

    return riskMap[factor] || null;
  }

  /**
   * Identify success factors
   */
  private identifySuccessFactors(
    input: SessionInput,
    adjustments: Array<{ factor: string; value: number }>
  ): SessionSuccessFactor[] {
    const factors: SessionSuccessFactor[] = [];

    // Check for positive adjustments
    for (const adj of adjustments) {
      if (adj.value > 0.03) {
        const successInfo = this.getSuccessInfo(adj.factor, adj.value);
        if (successInfo) {
          factors.push(successInfo);
        }
      }
    }

    // Additional success factors
    if (input.topicsPlanned && input.topicsPlanned.length >= 1 && input.topicsPlanned.length <= 3) {
      factors.push({
        factor: 'focused_agenda',
        contribution: 0.05,
        description: 'Well-defined topics allow for productive discussion',
      });
    }

    if (!input.isFirstSession && input.previousSessionRating && input.previousSessionRating >= 4) {
      factors.push({
        factor: 'established_relationship',
        contribution: 0.1,
        description: 'Strong existing rapport with client',
      });
    }

    return factors.sort((a, b) => b.contribution - a.contribution);
  }

  /**
   * Get success information for a factor
   */
  private getSuccessInfo(factor: string, value: number): SessionSuccessFactor | null {
    const successMap: Record<string, Omit<SessionSuccessFactor, 'contribution'>> = {
      optimal_morning: {
        factor: 'optimal_timing',
        description: 'Morning sessions typically have higher focus and energy',
      },
      optimal_afternoon: {
        factor: 'good_timing',
        description: 'Early afternoon is a productive time slot',
      },
      early_week: {
        factor: 'early_week',
        description: 'Early week sessions benefit from fresh motivation',
      },
      excellent_coach: {
        factor: 'coach_quality',
        description: 'Coach has excellent rating and track record',
      },
      good_coach: {
        factor: 'coach_quality',
        description: 'Coach has good client feedback',
      },
      high_engagement: {
        factor: 'client_engagement',
        description: 'Client is highly engaged with the platform',
      },
      positive_history: {
        factor: 'session_history',
        description: 'Previous sessions received positive feedback',
      },
      optimal_frequency: {
        factor: 'session_cadence',
        description: 'Optimal time between sessions for continuity',
      },
      positive_mood: {
        factor: 'client_mood',
        description: 'Client in positive state increases receptiveness',
      },
      topics_prepared: {
        factor: 'preparation',
        description: 'Having planned topics improves session structure',
      },
    };

    const info = successMap[factor];
    if (info) {
      return { ...info, contribution: value };
    }
    return null;
  }

  /**
   * Generate recommended actions
   */
  private generateRecommendations(
    input: SessionInput,
    riskFactors: SessionRiskFactor[]
  ): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    // Before session actions
    if (input.isFirstSession) {
      actions.push({
        action: 'send_welcome_message',
        timing: 'before',
        priority: 'high',
        description: 'Send personalized welcome message with session preview',
      });
    }

    if (input.daysSinceLastSession && input.daysSinceLastSession > 14) {
      actions.push({
        action: 'review_previous_notes',
        timing: 'before',
        priority: 'high',
        description: 'Review previous session notes and progress since then',
      });
    }

    if (riskFactors.some((r) => r.factor === 'client_mood')) {
      actions.push({
        action: 'prepare_support_resources',
        timing: 'before',
        priority: 'high',
        description: 'Prepare relevant support materials and exercises',
      });
    }

    // During session actions
    actions.push({
      action: 'establish_session_goals',
      timing: 'during',
      priority: 'high',
      description: 'Start by confirming session goals and expectations',
    });

    if (input.sessionType === 'goal_review') {
      actions.push({
        action: 'celebrate_progress',
        timing: 'during',
        priority: 'medium',
        description: 'Acknowledge and celebrate progress made',
      });
    }

    // After session actions
    actions.push({
      action: 'send_session_summary',
      timing: 'after',
      priority: 'high',
      description: 'Send summary with key takeaways and action items',
    });

    if (input.sessionType !== 'intro') {
      actions.push({
        action: 'schedule_followup',
        timing: 'after',
        priority: 'medium',
        description: 'Confirm next session before ending',
      });
    }

    return actions;
  }

  /**
   * Calculate optimal session duration
   */
  private calculateOptimalDuration(input: SessionInput): number {
    // Base durations by session type
    const baseDurations: Record<SessionType, number> = {
      intro: 60,
      regular: 45,
      goal_review: 60,
      crisis: 60,
      follow_up: 30,
    };

    let duration = baseDurations[input.sessionType] || 45;

    // Adjust for first session
    if (input.isFirstSession && input.sessionType !== 'intro') {
      duration += 15;
    }

    // Adjust for number of topics
    if (input.topicsPlanned) {
      if (input.topicsPlanned.length > 3) {
        duration += 15;
      } else if (input.topicsPlanned.length === 1) {
        duration = Math.max(30, duration - 15);
      }
    }

    // Adjust for client mood
    if (input.clientMood === 'frustrated' || input.clientMood === 'anxious') {
      duration += 15; // More time for emotional processing
    }

    return duration;
  }

  /**
   * Generate prep suggestions
   */
  private generatePrepSuggestions(
    input: SessionInput,
    riskFactors: SessionRiskFactor[]
  ): string[] {
    const suggestions: string[] = [];

    // Session type specific suggestions
    switch (input.sessionType) {
      case 'intro':
        suggestions.push('Review client intake form and goals');
        suggestions.push('Prepare questions to understand client expectations');
        suggestions.push('Have coaching agreement ready to discuss');
        break;
      case 'goal_review':
        suggestions.push('Pull progress data and metrics');
        suggestions.push('Identify achievements to celebrate');
        suggestions.push('Prepare goal adjustment options if needed');
        break;
      case 'crisis':
        suggestions.push('Review crisis intervention protocols');
        suggestions.push('Have emergency resources readily available');
        suggestions.push('Ensure quiet, private environment');
        break;
    }

    // Risk-based suggestions
    for (const risk of riskFactors) {
      if (risk.mitigation) {
        suggestions.push(risk.mitigation);
      }
    }

    // General suggestions
    if (input.topicsPlanned && input.topicsPlanned.length > 0) {
      suggestions.push(`Prepare materials for: ${input.topicsPlanned.slice(0, 3).join(', ')}`);
    }

    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(input: SessionInput): number {
    let confidence = 0.6; // Base confidence

    // More data = higher confidence
    if (input.coachRating !== undefined) confidence += 0.1;
    if (input.clientEngagementScore !== undefined) confidence += 0.1;
    if (input.previousSessionRating !== undefined) confidence += 0.1;
    if (input.daysSinceLastSession !== undefined) confidence += 0.05;
    if (input.clientMood && input.clientMood !== 'unknown') confidence += 0.05;

    return Math.min(1, confidence);
  }

  /**
   * Optimize session time for a client-coach pair
   */
  public optimizeSessionTime(
    coachId: string,
    clientId: string,
    historicalSessions?: Array<{ dayOfWeek: number; hour: number; rating: number }>
  ): SessionTimeOptimization {
    const optimalDays = [1, 2, 3]; // Monday, Tuesday, Wednesday
    const optimalTimes: TimeRange[] = [
      { startHour: 9, endHour: 11 },
      { startHour: 14, endHour: 16 },
    ];
    const avoidTimes: TimeRange[] = [
      { startHour: 12, endHour: 14 }, // Lunch
      { startHour: 18, endHour: 22 }, // Evening
    ];

    let reason = 'Based on general coaching effectiveness patterns';

    // Adjust based on historical data if available
    if (historicalSessions && historicalSessions.length >= 5) {
      const highRated = historicalSessions.filter((s) => s.rating >= 4);
      if (highRated.length > 0) {
        const bestDays = this.findMostCommon(highRated.map((s) => s.dayOfWeek));
        const bestHours = this.findMostCommon(highRated.map((s) => s.hour));

        if (bestDays.length > 0) {
          reason = 'Based on your historical high-rated sessions';
        }
      }
    }

    return {
      optimalDayOfWeek: optimalDays,
      optimalTimeRanges: optimalTimes,
      avoidTimes,
      reason,
    };
  }

  private findMostCommon<T>(arr: T[]): T[] {
    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    const maxCount = Math.max(...counts.values());
    return Array.from(counts.entries())
      .filter(([, count]) => count === maxCount)
      .map(([item]) => item);
  }

  private impactToNumber(impact: 'low' | 'medium' | 'high'): number {
    return impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
  }

  private storePrediction(clientId: string, prediction: SessionPrediction): void {
    const history = this.sessionHistory.get(clientId) || [];
    history.push(prediction);
    if (history.length > 50) history.shift();
    this.sessionHistory.set(clientId, history);
  }

  /**
   * Get prediction history
   */
  public getPredictionHistory(clientId: string): SessionPrediction[] {
    return this.sessionHistory.get(clientId) || [];
  }

  /**
   * Get service statistics
   */
  public getStats(): SessionOutcomePredictorStats {
    let totalPredictions = 0;
    for (const history of this.sessionHistory.values()) {
      totalPredictions += history.length;
    }

    return {
      clientsTracked: this.sessionHistory.size,
      totalPredictions,
      sessionTypeWeights: this.sessionTypeWeights,
    };
  }
}

// ==================== Additional Types ====================

export interface SessionOutcomePredictorStats {
  clientsTracked: number;
  totalPredictions: number;
  sessionTypeWeights: Record<SessionType, number>;
}

// Export singleton instance
export const sessionOutcomePredictor = new SessionOutcomePredictor();

// Export factory function
export const createSessionOutcomePredictor = (): SessionOutcomePredictor => {
  return new SessionOutcomePredictor();
};
