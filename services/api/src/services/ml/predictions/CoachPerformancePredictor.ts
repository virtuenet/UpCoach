/**
 * Coach Performance Predictor
 * Predicts coach performance and compatibility for client matching
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

// ==================== Type Definitions ====================

export interface CoachProfile {
  coachId: string;
  specializations: string[];
  avgRating: number;
  totalSessions: number;
  clientRetentionRate: number;
  avgResponseTimeHours: number;
  sessionCompletionRate: number;
  yearsExperience: number;
  certifications: string[];
  languageSkills: string[];
  timezone: string;
  availability: AvailabilitySlot[];
}

export interface ClientProfile {
  clientId: string;
  goals: string[];
  preferredTime: string;
  timezone: string;
  communicationStyle: CommunicationStyle;
  experienceLevel: ExperienceLevel;
  primaryLanguage: string;
  sessionHistory?: SessionHistoryItem[];
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
}

export type CommunicationStyle = 'direct' | 'supportive' | 'analytical' | 'collaborative';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface SessionHistoryItem {
  coachId: string;
  rating: number;
  completed: boolean;
  sessionType: string;
}

export interface MatchPrediction {
  coachId: string;
  clientId: string;
  compatibilityScore: number;
  predictedSatisfaction: number;
  matchFactors: MatchFactor[];
  potentialChallenges: string[];
  recommendations: string[];
  confidence: number;
  timestamp: Date;
}

export interface MatchFactor {
  factor: string;
  score: number;
  weight: number;
  description: string;
}

export interface CoachPerformanceMetrics {
  coachId: string;
  overallScore: number;
  clientSatisfaction: number;
  retentionImpact: number;
  goalAchievementRate: number;
  sessionQuality: number;
  responsiveness: number;
  trend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  areasForImprovement: string[];
}

export interface CoachRanking {
  coachId: string;
  rank: number;
  overallScore: number;
  metrics: CoachPerformanceMetrics;
}

// ==================== Coach Performance Predictor ====================

export class CoachPerformancePredictor extends EventEmitter {
  private coachProfiles: Map<string, CoachProfile> = new Map();
  private performanceCache: Map<string, CoachPerformanceMetrics> = new Map();

  private readonly matchWeights = {
    specialization: 0.25,
    availability: 0.15,
    rating: 0.15,
    timezone: 0.10,
    experience: 0.10,
    language: 0.10,
    retention: 0.10,
    responsiveness: 0.05,
  };

  constructor() {
    super();
  }

  /**
   * Predict coach-client compatibility
   */
  public predictMatch(coach: CoachProfile, client: ClientProfile): MatchPrediction {
    const startTime = Date.now();

    const matchFactors: MatchFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // 1. Specialization Match
    const specScore = this.calculateSpecializationMatch(coach.specializations, client.goals);
    matchFactors.push({
      factor: 'specialization',
      score: specScore,
      weight: this.matchWeights.specialization,
      description: `Coach specializations align ${(specScore * 100).toFixed(0)}% with client goals`,
    });
    totalScore += specScore * this.matchWeights.specialization;
    totalWeight += this.matchWeights.specialization;

    // 2. Availability Match
    const availScore = this.calculateAvailabilityMatch(coach.availability, client.preferredTime);
    matchFactors.push({
      factor: 'availability',
      score: availScore,
      weight: this.matchWeights.availability,
      description: availScore > 0.8 ? 'Excellent schedule alignment' : 'Some scheduling flexibility needed',
    });
    totalScore += availScore * this.matchWeights.availability;
    totalWeight += this.matchWeights.availability;

    // 3. Rating Score
    const ratingScore = Math.min(1, coach.avgRating / 5);
    matchFactors.push({
      factor: 'rating',
      score: ratingScore,
      weight: this.matchWeights.rating,
      description: `Coach has ${coach.avgRating.toFixed(1)}/5 average rating`,
    });
    totalScore += ratingScore * this.matchWeights.rating;
    totalWeight += this.matchWeights.rating;

    // 4. Timezone Match
    const tzScore = this.calculateTimezoneMatch(coach.timezone, client.timezone);
    matchFactors.push({
      factor: 'timezone',
      score: tzScore,
      weight: this.matchWeights.timezone,
      description: tzScore > 0.8 ? 'Same or similar timezone' : 'Some timezone difference',
    });
    totalScore += tzScore * this.matchWeights.timezone;
    totalWeight += this.matchWeights.timezone;

    // 5. Experience Match
    const expScore = this.calculateExperienceMatch(coach.yearsExperience, client.experienceLevel);
    matchFactors.push({
      factor: 'experience',
      score: expScore,
      weight: this.matchWeights.experience,
      description: `${coach.yearsExperience} years experience ${expScore > 0.7 ? 'appropriate' : 'may need adjustment'} for client level`,
    });
    totalScore += expScore * this.matchWeights.experience;
    totalWeight += this.matchWeights.experience;

    // 6. Language Match
    const langScore = coach.languageSkills.includes(client.primaryLanguage) ? 1 : 0.5;
    matchFactors.push({
      factor: 'language',
      score: langScore,
      weight: this.matchWeights.language,
      description: langScore === 1 ? 'Native language match' : 'Language accommodation may be needed',
    });
    totalScore += langScore * this.matchWeights.language;
    totalWeight += this.matchWeights.language;

    // 7. Retention Rate
    const retentionScore = Math.min(1, coach.clientRetentionRate);
    matchFactors.push({
      factor: 'retention',
      score: retentionScore,
      weight: this.matchWeights.retention,
      description: `${(coach.clientRetentionRate * 100).toFixed(0)}% client retention rate`,
    });
    totalScore += retentionScore * this.matchWeights.retention;
    totalWeight += this.matchWeights.retention;

    // 8. Responsiveness
    const respScore = this.calculateResponsivenessScore(coach.avgResponseTimeHours);
    matchFactors.push({
      factor: 'responsiveness',
      score: respScore,
      weight: this.matchWeights.responsiveness,
      description: `Average response time: ${coach.avgResponseTimeHours.toFixed(1)} hours`,
    });
    totalScore += respScore * this.matchWeights.responsiveness;
    totalWeight += this.matchWeights.responsiveness;

    // Calculate overall compatibility
    const compatibilityScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Predict satisfaction based on compatibility and historical data
    const predictedSatisfaction = this.predictSatisfaction(
      compatibilityScore,
      coach,
      client.sessionHistory
    );

    // Identify potential challenges
    const potentialChallenges = this.identifyChallenges(matchFactors, coach, client);

    // Generate recommendations
    const recommendations = this.generateMatchRecommendations(matchFactors, potentialChallenges);

    // Calculate confidence
    const confidence = this.calculateMatchConfidence(coach, client);

    const prediction: MatchPrediction = {
      coachId: coach.coachId,
      clientId: client.clientId,
      compatibilityScore,
      predictedSatisfaction,
      matchFactors: matchFactors.sort((a, b) => b.score * b.weight - a.score * a.weight),
      potentialChallenges,
      recommendations,
      confidence,
      timestamp: new Date(),
    };

    this.emit('match:predicted', {
      coachId: coach.coachId,
      clientId: client.clientId,
      compatibility: compatibilityScore,
      latencyMs: Date.now() - startTime,
    });

    return prediction;
  }

  /**
   * Find best coaches for a client
   */
  public findBestMatches(
    coaches: CoachProfile[],
    client: ClientProfile,
    limit: number = 5
  ): MatchPrediction[] {
    const predictions = coaches.map((coach) => this.predictMatch(coach, client));

    return predictions
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);
  }

  /**
   * Calculate coach performance metrics
   */
  public calculatePerformance(coach: CoachProfile): CoachPerformanceMetrics {
    // Check cache
    const cached = this.performanceCache.get(coach.coachId);
    if (cached) return cached;

    // Client satisfaction (based on rating)
    const clientSatisfaction = coach.avgRating / 5;

    // Retention impact
    const retentionImpact = coach.clientRetentionRate;

    // Session quality (completion rate)
    const sessionQuality = coach.sessionCompletionRate;

    // Responsiveness score
    const responsiveness = this.calculateResponsivenessScore(coach.avgResponseTimeHours);

    // Goal achievement (estimated from retention and satisfaction)
    const goalAchievementRate = (clientSatisfaction + retentionImpact) / 2;

    // Overall score
    const overallScore =
      clientSatisfaction * 0.3 +
      retentionImpact * 0.25 +
      sessionQuality * 0.20 +
      responsiveness * 0.15 +
      goalAchievementRate * 0.10;

    // Determine trend (would need historical data in real implementation)
    const trend: CoachPerformanceMetrics['trend'] =
      coach.avgRating >= 4.5 ? 'improving' :
      coach.avgRating >= 4.0 ? 'stable' : 'declining';

    // Identify strengths
    const strengths: string[] = [];
    if (clientSatisfaction >= 0.9) strengths.push('Exceptional client satisfaction');
    if (retentionImpact >= 0.85) strengths.push('Strong client retention');
    if (sessionQuality >= 0.95) strengths.push('High session completion rate');
    if (responsiveness >= 0.9) strengths.push('Quick response times');
    if (coach.specializations.length >= 3) strengths.push('Diverse specializations');

    // Areas for improvement
    const areasForImprovement: string[] = [];
    if (clientSatisfaction < 0.8) areasForImprovement.push('Client satisfaction could be improved');
    if (retentionImpact < 0.7) areasForImprovement.push('Focus on client retention strategies');
    if (sessionQuality < 0.85) areasForImprovement.push('Reduce session cancellations/no-shows');
    if (responsiveness < 0.7) areasForImprovement.push('Improve response time to client messages');

    const metrics: CoachPerformanceMetrics = {
      coachId: coach.coachId,
      overallScore,
      clientSatisfaction,
      retentionImpact,
      goalAchievementRate,
      sessionQuality,
      responsiveness,
      trend,
      strengths,
      areasForImprovement,
    };

    this.performanceCache.set(coach.coachId, metrics);
    return metrics;
  }

  /**
   * Rank coaches by performance
   */
  public rankCoaches(coaches: CoachProfile[]): CoachRanking[] {
    const rankings = coaches.map((coach) => {
      const metrics = this.calculatePerformance(coach);
      return {
        coachId: coach.coachId,
        rank: 0, // Will be assigned after sorting
        overallScore: metrics.overallScore,
        metrics,
      };
    });

    // Sort by overall score
    rankings.sort((a, b) => b.overallScore - a.overallScore);

    // Assign ranks
    rankings.forEach((r, index) => {
      r.rank = index + 1;
    });

    return rankings;
  }

  // ==================== Helper Methods ====================

  private calculateSpecializationMatch(coachSpecs: string[], clientGoals: string[]): number {
    if (coachSpecs.length === 0 || clientGoals.length === 0) return 0.5;

    const normalizedSpecs = coachSpecs.map((s) => s.toLowerCase());
    const normalizedGoals = clientGoals.map((g) => g.toLowerCase());

    let matchCount = 0;
    for (const goal of normalizedGoals) {
      for (const spec of normalizedSpecs) {
        if (spec.includes(goal) || goal.includes(spec)) {
          matchCount++;
          break;
        }
      }
    }

    return matchCount / clientGoals.length;
  }

  private calculateAvailabilityMatch(
    coachAvailability: AvailabilitySlot[],
    clientPreferred: string
  ): number {
    if (!coachAvailability || coachAvailability.length === 0) return 0.5;

    // Parse preferred time (e.g., "morning", "afternoon", "evening", "flexible")
    const preferredHours = this.getPreferredHours(clientPreferred);

    let matchingSlots = 0;
    for (const slot of coachAvailability) {
      if (this.hoursOverlap(slot.startHour, slot.endHour, preferredHours.start, preferredHours.end)) {
        matchingSlots++;
      }
    }

    return Math.min(1, matchingSlots / 3); // Assume 3 matching slots is ideal
  }

  private getPreferredHours(preference: string): { start: number; end: number } {
    switch (preference.toLowerCase()) {
      case 'morning':
        return { start: 6, end: 12 };
      case 'afternoon':
        return { start: 12, end: 17 };
      case 'evening':
        return { start: 17, end: 22 };
      case 'flexible':
        return { start: 6, end: 22 };
      default:
        return { start: 9, end: 18 }; // Default business hours
    }
  }

  private hoursOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  private calculateTimezoneMatch(coachTz: string, clientTz: string): number {
    if (coachTz === clientTz) return 1.0;

    // Simple timezone offset comparison
    const coachOffset = this.getTimezoneOffset(coachTz);
    const clientOffset = this.getTimezoneOffset(clientTz);
    const hourDiff = Math.abs(coachOffset - clientOffset);

    if (hourDiff <= 2) return 0.9;
    if (hourDiff <= 4) return 0.7;
    if (hourDiff <= 6) return 0.5;
    return 0.3;
  }

  private getTimezoneOffset(tz: string): number {
    // Simplified timezone offset lookup
    const offsets: Record<string, number> = {
      'UTC': 0,
      'GMT': 0,
      'EST': -5,
      'PST': -8,
      'CST': -6,
      'MST': -7,
      'CET': 1,
      'WIB': 7,
      'JST': 9,
      'IST': 5.5,
    };
    return offsets[tz.toUpperCase()] || 0;
  }

  private calculateExperienceMatch(yearsExperience: number, clientLevel: ExperienceLevel): number {
    switch (clientLevel) {
      case 'beginner':
        // Beginners do well with moderately experienced coaches
        if (yearsExperience >= 2 && yearsExperience <= 5) return 1.0;
        if (yearsExperience >= 1) return 0.8;
        return 0.6;

      case 'intermediate':
        // Intermediate clients benefit from experienced coaches
        if (yearsExperience >= 3) return 1.0;
        if (yearsExperience >= 2) return 0.8;
        return 0.5;

      case 'advanced':
        // Advanced clients need highly experienced coaches
        if (yearsExperience >= 5) return 1.0;
        if (yearsExperience >= 3) return 0.7;
        return 0.4;

      default:
        return 0.7;
    }
  }

  private calculateResponsivenessScore(avgResponseTimeHours: number): number {
    if (avgResponseTimeHours <= 1) return 1.0;
    if (avgResponseTimeHours <= 4) return 0.9;
    if (avgResponseTimeHours <= 12) return 0.7;
    if (avgResponseTimeHours <= 24) return 0.5;
    return 0.3;
  }

  private predictSatisfaction(
    compatibilityScore: number,
    coach: CoachProfile,
    sessionHistory?: SessionHistoryItem[]
  ): number {
    let baseSatisfaction = compatibilityScore;

    // Adjust based on coach's historical performance
    baseSatisfaction = baseSatisfaction * 0.6 + (coach.avgRating / 5) * 0.4;

    // Adjust based on client's history with similar coaches
    if (sessionHistory && sessionHistory.length > 0) {
      const relevantSessions = sessionHistory.filter(
        (s) => s.completed && s.rating > 0
      );
      if (relevantSessions.length > 0) {
        const avgHistoricalRating = relevantSessions.reduce((sum, s) => sum + s.rating, 0) / relevantSessions.length;
        baseSatisfaction = baseSatisfaction * 0.7 + (avgHistoricalRating / 5) * 0.3;
      }
    }

    return Math.min(1, baseSatisfaction);
  }

  private identifyChallenges(
    factors: MatchFactor[],
    coach: CoachProfile,
    client: ClientProfile
  ): string[] {
    const challenges: string[] = [];

    for (const factor of factors) {
      if (factor.score < 0.5) {
        switch (factor.factor) {
          case 'specialization':
            challenges.push('Coach specializations may not fully align with client goals');
            break;
          case 'availability':
            challenges.push('Scheduling may require flexibility from both parties');
            break;
          case 'timezone':
            challenges.push('Timezone difference may affect session timing');
            break;
          case 'language':
            challenges.push('Language barrier may require extra communication effort');
            break;
          case 'responsiveness':
            challenges.push('Response times may not meet client expectations');
            break;
        }
      }
    }

    // Check for experience mismatch
    if (client.experienceLevel === 'advanced' && coach.yearsExperience < 3) {
      challenges.push('Coach experience may be insufficient for advanced client needs');
    }

    return challenges;
  }

  private generateMatchRecommendations(
    factors: MatchFactor[],
    challenges: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Highlight top strengths
    const topFactors = factors.filter((f) => f.score >= 0.8);
    if (topFactors.length > 0) {
      recommendations.push(
        `Strong match in: ${topFactors.map((f) => f.factor).join(', ')}`
      );
    }

    // Address challenges
    if (challenges.length > 0) {
      recommendations.push('Discuss potential scheduling or communication preferences in intro session');
    }

    if (factors.find((f) => f.factor === 'specialization' && f.score >= 0.8)) {
      recommendations.push('Coach expertise aligns well - proceed with standard onboarding');
    }

    return recommendations.slice(0, 4);
  }

  private calculateMatchConfidence(coach: CoachProfile, client: ClientProfile): number {
    let confidence = 0.7; // Base confidence

    // More sessions = more reliable data
    if (coach.totalSessions >= 100) confidence += 0.1;
    if (coach.totalSessions >= 50) confidence += 0.05;

    // Session history provides better prediction
    if (client.sessionHistory && client.sessionHistory.length >= 5) confidence += 0.1;

    // Complete profiles increase confidence
    if (coach.certifications.length > 0) confidence += 0.05;

    return Math.min(1, confidence);
  }

  /**
   * Register coach profile
   */
  public registerCoach(profile: CoachProfile): void {
    this.coachProfiles.set(profile.coachId, profile);
    this.performanceCache.delete(profile.coachId); // Clear cached metrics
  }

  /**
   * Get registered coach profile
   */
  public getCoachProfile(coachId: string): CoachProfile | null {
    return this.coachProfiles.get(coachId) || null;
  }

  /**
   * Get predictor statistics
   */
  public getStats(): CoachPerformancePredictorStats {
    return {
      registeredCoaches: this.coachProfiles.size,
      cachedMetrics: this.performanceCache.size,
      matchWeights: this.matchWeights,
    };
  }
}

// ==================== Additional Types ====================

export interface CoachPerformancePredictorStats {
  registeredCoaches: number;
  cachedMetrics: number;
  matchWeights: Record<string, number>;
}

// Export singleton instance
export const coachPerformancePredictor = new CoachPerformancePredictor();

// Export factory function
export const createCoachPerformancePredictor = (): CoachPerformancePredictor => {
  return new CoachPerformancePredictor();
};
