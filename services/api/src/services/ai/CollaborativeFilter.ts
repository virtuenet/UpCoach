/**
 * Collaborative Filtering Recommender
 * Phase 11 Week 2
 *
 * Uses user-user and item-item collaborative filtering to recommend habits
 * based on what similar users have successfully adopted
 */

import { HabitRecommendation, UserProfile } from './HabitRecommendationEngine';

interface UserSimilarity {
  userId: string;
  similarityScore: number; // 0-1
  sharedHabits: number;
}

interface HabitCooccurrence {
  habitId1: string;
  habitId2: string;
  cooccurrenceCount: number;
  confidence: number; // P(habit2 | habit1)
}

export class CollaborativeFilter {
  private userSimilarityCache: Map<string, UserSimilarity[]> = new Map();
  private cooccurrenceCache: Map<string, HabitCooccurrence[]> = new Map();

  /**
   * Generate recommendations using collaborative filtering
   */
  async recommend(
    userProfile: UserProfile,
    count: number = 10
  ): Promise<HabitRecommendation[]> {
    // Find similar users
    const similarUsers = await this.findSimilarUsers(userProfile, 50);

    // Get habits popular among similar users
    const candidateHabits = await this.getHabitsFromSimilarUsers(
      userProfile,
      similarUsers
    );

    // Apply item-item collaborative filtering for additional candidates
    const itemBasedRecs = await this.getItemBasedRecommendations(userProfile);

    // Combine both approaches
    const combined = [...candidateHabits, ...itemBasedRecs];

    // Deduplicate and score
    const deduplicated = this.deduplicateAndScore(combined);

    return deduplicated.slice(0, count);
  }

  /**
   * Find users similar to the target user
   */
  private async findSimilarUsers(
    userProfile: UserProfile,
    count: number
  ): Promise<UserSimilarity[]> {
    // Check cache
    const cached = this.userSimilarityCache.get(userProfile.userId);
    if (cached) return cached.slice(0, count);

    // Fetch all users with their habits (in production, this would be a database query)
    const allUsers = await this.fetchAllUserProfiles();

    // Calculate similarity scores
    const similarities = allUsers
      .filter(u => u.userId !== userProfile.userId)
      .map(otherUser => ({
        userId: otherUser.userId,
        similarityScore: this.calculateUserSimilarity(userProfile, otherUser),
        sharedHabits: this.countSharedHabits(userProfile, otherUser)
      }))
      .filter(sim => sim.similarityScore > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarityScore - a.similarityScore);

    // Cache results
    this.userSimilarityCache.set(userProfile.userId, similarities);

    return similarities.slice(0, count);
  }

  /**
   * Calculate similarity between two users using Jaccard + cosine similarity
   */
  private calculateUserSimilarity(
    user1: UserProfile,
    user2: UserProfile
  ): number {
    // Jaccard similarity on current habits
    const habits1 = new Set(user1.currentHabits.map(h => h.id));
    const habits2 = new Set(user2.currentHabits.map(h => h.id));

    const intersection = new Set([...habits1].filter(h => habits2.has(h)));
    const union = new Set([...habits1, ...habits2]);

    const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;

    // Demographic similarity
    let demographicSimilarity = 0;
    if (user1.demographics.ageRange === user2.demographics.ageRange) {
      demographicSimilarity += 0.2;
    }
    if (user1.demographics.fitnessLevel === user2.demographics.fitnessLevel) {
      demographicSimilarity += 0.2;
    }

    // Goal similarity
    const goals1 = new Set(user1.goals);
    const goals2 = new Set(user2.goals);
    const goalIntersection = new Set([...goals1].filter(g => goals2.has(g)));
    const goalSimilarity = goals1.size > 0 ? goalIntersection.size / goals1.size : 0;

    // Preference similarity
    let preferenceSimilarity = 0;
    if (user1.preferences.difficulty === user2.preferences.difficulty) {
      preferenceSimilarity += 0.3;
    }
    if (user1.preferences.timeOfDay === user2.preferences.timeOfDay) {
      preferenceSimilarity += 0.2;
    }

    // Weighted combination
    return (
      jaccardSimilarity * 0.4 +
      goalSimilarity * 0.3 +
      demographicSimilarity * 0.2 +
      preferenceSimilarity * 0.1
    );
  }

  /**
   * Count shared habits between users
   */
  private countSharedHabits(user1: UserProfile, user2: UserProfile): number {
    const habits1 = new Set(user1.currentHabits.map(h => h.id));
    const habits2 = new Set(user2.currentHabits.map(h => h.id));

    return new Set([...habits1].filter(h => habits2.has(h))).size;
  }

  /**
   * Get habit recommendations from similar users
   */
  private async getHabitsFromSimilarUsers(
    userProfile: UserProfile,
    similarUsers: UserSimilarity[]
  ): Promise<HabitRecommendation[]> {
    const userHabitIds = new Set(userProfile.currentHabits.map(h => h.id));

    // Count habit occurrences among similar users
    const habitCounts = new Map<string, { count: number; totalSimilarity: number }>();

    for (const similarUser of similarUsers) {
      const userHabits = await this.getUserHabits(similarUser.userId);

      userHabits.forEach(habit => {
        if (!userHabitIds.has(habit.id)) {
          const current = habitCounts.get(habit.id) || { count: 0, totalSimilarity: 0 };
          habitCounts.set(habit.id, {
            count: current.count + 1,
            totalSimilarity: current.totalSimilarity + similarUser.similarityScore
          });
        }
      });
    }

    // Convert to recommendations
    const recommendations: HabitRecommendation[] = [];

    for (const [habitId, stats] of habitCounts.entries()) {
      const habitDetails = await this.getHabitDetails(habitId);

      if (habitDetails) {
        // Score based on popularity among similar users and their similarity
        const popularityScore = (stats.count / similarUsers.length) * 100;
        const similarityScore = (stats.totalSimilarity / similarUsers.length) * 100;
        const recommendationScore = (popularityScore * 0.6 + similarityScore * 0.4);

        recommendations.push({
          habitId,
          habitName: habitDetails.name,
          category: habitDetails.category,
          recommendationScore: Math.round(recommendationScore),
          recommendationType: 'collaborative',
          reasoning: `${stats.count} similar users have this habit`,
          successProbability: this.estimateSuccessProbability(stats.count, similarUsers.length),
          estimatedTimeMinutes: habitDetails.estimatedTimeMinutes || 15,
          difficulty: habitDetails.difficulty || 5,
          relatedHabits: habitDetails.relatedHabits || []
        });
      }
    }

    return recommendations;
  }

  /**
   * Get item-based (habit-habit) collaborative filtering recommendations
   */
  private async getItemBasedRecommendations(
    userProfile: UserProfile
  ): Promise<HabitRecommendation[]> {
    const recommendations: HabitRecommendation[] = [];

    // For each habit user has, find habits that frequently co-occur
    for (const userHabit of userProfile.currentHabits) {
      const cooccurrences = await this.getHabitCooccurrences(userHabit.id);

      cooccurrences.forEach(cooccur => {
        const habitDetails = this.getCachedHabitDetails(cooccur.habitId2);

        if (habitDetails) {
          recommendations.push({
            habitId: cooccur.habitId2,
            habitName: habitDetails.name,
            category: habitDetails.category,
            recommendationScore: Math.round(cooccur.confidence * 100),
            recommendationType: 'collaborative',
            reasoning: `Often paired with "${userHabit.name}"`,
            successProbability: Math.round(cooccur.confidence * 100),
            estimatedTimeMinutes: habitDetails.estimatedTimeMinutes || 15,
            difficulty: habitDetails.difficulty || 5,
            relatedHabits: [userHabit.id]
          });
        }
      });
    }

    return recommendations;
  }

  /**
   * Get habits that frequently co-occur with a given habit
   */
  private async getHabitCooccurrences(habitId: string): Promise<HabitCooccurrence[]> {
    // Check cache
    const cached = this.cooccurrenceCache.get(habitId);
    if (cached) return cached;

    // Calculate co-occurrences from all users
    const allUsers = await this.fetchAllUserProfiles();

    const cooccurrences = new Map<string, { count: number; totalUsers: number }>();

    // Count how many users have both habits
    let usersWithHabit1 = 0;

    allUsers.forEach(user => {
      const userHabitIds = user.currentHabits.map(h => h.id);
      const hasHabit1 = userHabitIds.includes(habitId);

      if (hasHabit1) {
        usersWithHabit1++;

        userHabitIds.forEach(otherHabitId => {
          if (otherHabitId !== habitId) {
            const current = cooccurrences.get(otherHabitId) || { count: 0, totalUsers: 0 };
            cooccurrences.set(otherHabitId, {
              count: current.count + 1,
              totalUsers: allUsers.length
            });
          }
        });
      }
    });

    // Convert to cooccurrence objects with confidence scores
    const result = Array.from(cooccurrences.entries())
      .map(([habitId2, stats]) => ({
        habitId1: habitId,
        habitId2,
        cooccurrenceCount: stats.count,
        confidence: stats.count / usersWithHabit1 // P(habit2 | habit1)
      }))
      .filter(c => c.confidence > 0.1) // Minimum 10% confidence
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Top 10 co-occurrences

    // Cache results
    this.cooccurrenceCache.set(habitId, result);

    return result;
  }

  /**
   * Deduplicate and score recommendations
   */
  private deduplicateAndScore(
    recommendations: HabitRecommendation[]
  ): HabitRecommendation[] {
    const habitMap = new Map<string, HabitRecommendation>();

    recommendations.forEach(rec => {
      const existing = habitMap.get(rec.habitId);

      if (!existing || rec.recommendationScore > existing.recommendationScore) {
        habitMap.set(rec.habitId, rec);
      }
    });

    return Array.from(habitMap.values())
      .sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Estimate success probability based on popularity
   */
  private estimateSuccessProbability(adopters: number, totalSimilar: number): number {
    const adoptionRate = adopters / totalSimilar;

    // Higher adoption among similar users suggests higher success probability
    return Math.round(Math.min(95, 40 + (adoptionRate * 60)));
  }

  /**
   * Fetch all user profiles (mock implementation)
   */
  private async fetchAllUserProfiles(): Promise<UserProfile[]> {
    // Mock data - in production, query database
    return [];
  }

  /**
   * Get habits for a specific user
   */
  private async getUserHabits(userId: string): Promise<Array<{ id: string; name: string }>> {
    // Mock implementation
    return [];
  }

  /**
   * Get habit details by ID
   */
  private async getHabitDetails(habitId: string): Promise<any> {
    // Mock implementation
    return {
      name: 'Sample Habit',
      category: 'health_fitness',
      estimatedTimeMinutes: 20,
      difficulty: 5,
      relatedHabits: []
    };
  }

  /**
   * Get cached habit details
   */
  private getCachedHabitDetails(habitId: string): any {
    // Mock implementation
    return {
      name: 'Sample Habit',
      category: 'health_fitness',
      estimatedTimeMinutes: 20,
      difficulty: 5
    };
  }
}
