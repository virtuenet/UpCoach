/**
 * Habit Recommendation Engine
 * Phase 11 Week 2
 *
 * Generates personalized habit recommendations using collaborative filtering,
 * content-based filtering, and sequence-aware recommendations
 */

import { CollaborativeFilter } from './CollaborativeFilter';
import { ContentBasedRecommender } from './ContentBasedRecommender';
import { SequenceRecommender } from './SequenceRecommender';

export interface HabitRecommendation {
  habitId: string;
  habitName: string;
  category: string;
  recommendationScore: number; // 0-100
  recommendationType: 'collaborative' | 'content_based' | 'sequence' | 'hybrid';
  reasoning: string;
  successProbability: number; // Predicted success rate
  estimatedTimeMinutes: number;
  difficulty: number; // 1-10
  relatedHabits: string[]; // IDs of complementary habits
}

export interface UserProfile {
  userId: string;
  currentHabits: Array<{
    id: string;
    name: string;
    category: string;
    completionRate: number;
    streakDays: number;
  }>;
  goals: string[];
  preferences: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'flexible';
    difficulty: 'easy' | 'moderate' | 'challenging';
    categories: string[];
  };
  demographics: {
    ageRange?: string;
    occupation?: string;
    fitnessLevel?: string;
  };
  historicalData: {
    successfulHabits: string[];
    abandonedHabits: string[];
    averageStreakDays: number;
  };
}

export class HabitRecommendationEngine {
  private collaborativeFilter: CollaborativeFilter;
  private contentBasedRecommender: ContentBasedRecommender;
  private sequenceRecommender: SequenceRecommender;

  constructor() {
    this.collaborativeFilter = new CollaborativeFilter();
    this.contentBasedRecommender = new ContentBasedRecommender();
    this.sequenceRecommender = new SequenceRecommender();
  }

  /**
   * Generate personalized habit recommendations for a user
   */
  async generateRecommendations(
    userProfile: UserProfile,
    count: number = 10
  ): Promise<HabitRecommendation[]> {
    // Get recommendations from all three approaches
    const collaborativeRecs = await this.collaborativeFilter.recommend(userProfile, count * 2);
    const contentBasedRecs = await this.contentBasedRecommender.recommend(userProfile, count * 2);
    const sequenceRecs = await this.sequenceRecommender.recommend(userProfile, count);

    // Combine and rank recommendations
    const allRecommendations = [
      ...collaborativeRecs,
      ...contentBasedRecs,
      ...sequenceRecs
    ];

    // Deduplicate and apply hybrid scoring
    const deduplicated = this.deduplicateRecommendations(allRecommendations);

    // Apply hybrid scoring algorithm
    const scored = this.applyHybridScoring(deduplicated, userProfile);

    // Filter out habits user already has
    const filtered = this.filterExistingHabits(scored, userProfile);

    // Sort by recommendation score and return top N
    return filtered
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, count);
  }

  /**
   * Get recommendations for a specific goal
   */
  async getGoalBasedRecommendations(
    userProfile: UserProfile,
    goalType: string,
    count: number = 5
  ): Promise<HabitRecommendation[]> {
    // Use sequence recommender to get optimal habit sequence for goal
    const sequenceRecs = await this.sequenceRecommender.recommendForGoal(
      userProfile,
      goalType,
      count
    );

    // Enhance with success probability predictions
    return sequenceRecs.map(rec => ({
      ...rec,
      successProbability: this.predictSuccessProbability(rec, userProfile)
    }));
  }

  /**
   * Deduplicate recommendations from multiple sources
   */
  private deduplicateRecommendations(
    recommendations: HabitRecommendation[]
  ): HabitRecommendation[] {
    const seen = new Map<string, HabitRecommendation>();

    recommendations.forEach(rec => {
      const existing = seen.get(rec.habitId);
      if (!existing || rec.recommendationScore > existing.recommendationScore) {
        seen.set(rec.habitId, rec);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Apply hybrid scoring combining multiple recommendation approaches
   */
  private applyHybridScoring(
    recommendations: HabitRecommendation[],
    userProfile: UserProfile
  ): HabitRecommendation[] {
    const weights = {
      collaborative: 0.35,
      content_based: 0.30,
      sequence: 0.25,
      success_probability: 0.10
    };

    return recommendations.map(rec => {
      // Base score from recommendation type
      let baseScore = rec.recommendationScore;

      // Adjust based on recommendation type
      let typeWeight = weights[rec.recommendationType] || 0.25;

      // Boost if aligns with user preferences
      let preferenceBoost = 0;
      if (userProfile.preferences.categories.includes(rec.category)) {
        preferenceBoost += 10;
      }

      // Boost if difficulty matches preference
      const difficultyMatch = this.matchesDifficultyPreference(
        rec.difficulty,
        userProfile.preferences.difficulty
      );
      if (difficultyMatch) {
        preferenceBoost += 5;
      }

      // Penalty for very high difficulty if user has low average streak
      let difficultyPenalty = 0;
      if (rec.difficulty >= 8 && userProfile.historicalData.averageStreakDays < 14) {
        difficultyPenalty = 15;
      }

      // Calculate final score
      const finalScore = Math.min(100, Math.max(0,
        (baseScore * typeWeight * 4) +
        preferenceBoost -
        difficultyPenalty +
        (rec.successProbability || 50) * weights.success_probability
      ));

      return {
        ...rec,
        recommendationScore: Math.round(finalScore),
        recommendationType: rec.recommendationType === 'hybrid' ?
          rec.recommendationType :
          'hybrid' as const
      };
    });
  }

  /**
   * Filter out habits user already has
   */
  private filterExistingHabits(
    recommendations: HabitRecommendation[],
    userProfile: UserProfile
  ): HabitRecommendation[] {
    const existingHabitIds = new Set(
      userProfile.currentHabits.map(h => h.id)
    );

    return recommendations.filter(rec => !existingHabitIds.has(rec.habitId));
  }

  /**
   * Check if habit difficulty matches user preference
   */
  private matchesDifficultyPreference(
    habitDifficulty: number,
    preference: 'easy' | 'moderate' | 'challenging'
  ): boolean {
    if (preference === 'easy') return habitDifficulty <= 4;
    if (preference === 'moderate') return habitDifficulty >= 4 && habitDifficulty <= 7;
    if (preference === 'challenging') return habitDifficulty >= 7;
    return true;
  }

  /**
   * Predict success probability for a habit recommendation
   */
  private predictSuccessProbability(
    recommendation: HabitRecommendation,
    userProfile: UserProfile
  ): number {
    // Simple heuristic-based prediction
    let probability = 50; // Base 50%

    // Boost if user has succeeded with similar habits
    const similarSuccessful = userProfile.historicalData.successfulHabits.filter(
      h => this.isSimilarCategory(h, recommendation.category)
    ).length;
    probability += Math.min(20, similarSuccessful * 5);

    // Penalty if difficulty too high relative to user's history
    if (recommendation.difficulty > 7 && userProfile.historicalData.averageStreakDays < 21) {
      probability -= 15;
    }

    // Boost if category matches user preferences
    if (userProfile.preferences.categories.includes(recommendation.category)) {
      probability += 10;
    }

    // Penalty if user has abandoned similar habits
    const similarAbandoned = userProfile.historicalData.abandonedHabits.filter(
      h => this.isSimilarCategory(h, recommendation.category)
    ).length;
    probability -= Math.min(15, similarAbandoned * 5);

    return Math.min(95, Math.max(5, probability));
  }

  /**
   * Check if habit categories are similar
   */
  private isSimilarCategory(habitId: string, category: string): boolean {
    // Simplified - would look up habit category from database
    const categoryMap: Record<string, string[]> = {
      'health_fitness': ['exercise', 'nutrition', 'sleep'],
      'mental_wellness': ['meditation', 'journaling', 'mindfulness'],
      'productivity': ['time_management', 'focus', 'organization'],
      'career_finance': ['skill_building', 'networking', 'investing'],
      'education': ['reading', 'learning', 'courses'],
      'relationships': ['communication', 'quality_time', 'gratitude']
    };

    return categoryMap[category]?.some(subcat => habitId.includes(subcat)) || false;
  }

  /**
   * Get "Next Best Habit" recommendation
   * Identifies the single most impactful habit to add next
   */
  async getNextBestHabit(userProfile: UserProfile): Promise<HabitRecommendation | null> {
    const recommendations = await this.generateRecommendations(userProfile, 20);

    if (recommendations.length === 0) return null;

    // Score based on:
    // 1. Complement to existing habits
    // 2. Success probability
    // 3. Impact on goals

    const scored = recommendations.map(rec => {
      let score = rec.recommendationScore;

      // Boost if complements existing habits well
      const complementScore = this.calculateComplementScore(rec, userProfile);
      score += complementScore;

      // Boost if directly supports user's primary goal
      if (userProfile.goals.length > 0) {
        const goalAlignment = this.calculateGoalAlignment(rec, userProfile.goals[0]);
        score += goalAlignment;
      }

      return { ...rec, recommendationScore: score };
    });

    return scored.sort((a, b) => b.recommendationScore - a.recommendationScore)[0];
  }

  private calculateComplementScore(
    recommendation: HabitRecommendation,
    userProfile: UserProfile
  ): number {
    let score = 0;

    // Check for complementary relationships
    const hasComplementInCurrent = userProfile.currentHabits.some(
      h => recommendation.relatedHabits.includes(h.id)
    );

    if (hasComplementInCurrent) {
      score += 15; // Strong synergy
    }

    // Check for category balance
    const categories = userProfile.currentHabits.map(h => h.category);
    const categoryCount = categories.filter(c => c === recommendation.category).length;

    if (categoryCount === 0) {
      score += 10; // Adds diversity
    } else if (categoryCount >= 3) {
      score -= 5; // Too concentrated
    }

    return score;
  }

  private calculateGoalAlignment(
    recommendation: HabitRecommendation,
    primaryGoal: string
  ): number {
    // Simplified goal alignment scoring
    const goalKeywords: Record<string, string[]> = {
      'weight_loss': ['exercise', 'nutrition', 'calories', 'workout'],
      'fitness': ['cardio', 'strength', 'yoga', 'running'],
      'mental_health': ['meditation', 'mindfulness', 'therapy', 'journaling'],
      'productivity': ['focus', 'time_management', 'organization', 'planning'],
      'learning': ['reading', 'courses', 'practice', 'study']
    };

    const keywords = goalKeywords[primaryGoal] || [];
    const nameMatch = keywords.some(kw =>
      recommendation.habitName.toLowerCase().includes(kw)
    );

    return nameMatch ? 20 : 0;
  }
}
