/**
 * Content-Based Recommender
 * Phase 11 Week 2
 *
 * Recommends habits based on content similarity to user's existing habits
 * and preferences using feature-based matching
 */

import { HabitRecommendation, UserProfile } from './HabitRecommendationEngine';

interface HabitFeatures {
  habitId: string;
  name: string;
  category: string;
  subCategory: string;
  tags: string[];
  difficulty: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  duration: number; // minutes
  frequency: 'daily' | 'weekly' | 'flexible';
  requiresEquipment: boolean;
  isIndoor: boolean;
  isSocial: boolean;
  energyLevel: 'low' | 'medium' | 'high';
}

export class ContentBasedRecommender {
  private habitFeaturesCache: Map<string, HabitFeatures> = new Map();

  /**
   * Generate content-based recommendations
   */
  async recommend(
    userProfile: UserProfile,
    count: number = 10
  ): Promise<HabitRecommendation[]> {
    // Build user preference profile from existing habits
    const userPreferenceVector = await this.buildUserPreferenceVector(userProfile);

    // Get all available habits
    const allHabits = await this.getAllHabits();

    // Calculate similarity scores
    const scored = allHabits.map(habit => ({
      habit,
      similarity: this.calculateSimilarity(userPreferenceVector, habit)
    }));

    // Filter and convert to recommendations
    const recommendations = scored
      .filter(s => s.similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, count)
      .map(s => this.convertToRecommendation(s.habit, s.similarity));

    return recommendations;
  }

  /**
   * Build user preference vector from their existing habits
   */
  private async buildUserPreferenceVector(
    userProfile: UserProfile
  ): Promise<HabitFeatures> {
    const habits = await Promise.all(
      userProfile.currentHabits.map(h => this.getHabitFeatures(h.id))
    );

    // Aggregate features
    const categoryCount = new Map<string, number>();
    const tagCount = new Map<string, number>();
    let totalDifficulty = 0;
    let totalDuration = 0;
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    let indoorCount = 0;
    let socialCount = 0;

    habits.forEach(habit => {
      if (!habit) return;

      // Count categories
      categoryCount.set(habit.category, (categoryCount.get(habit.category) || 0) + 1);

      // Count tags
      habit.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });

      // Aggregate numeric features
      totalDifficulty += habit.difficulty;
      totalDuration += habit.duration;

      // Count time preferences
      if (habit.timeOfDay === 'morning') morningCount++;
      if (habit.timeOfDay === 'afternoon') afternoonCount++;
      if (habit.timeOfDay === 'evening') eveningCount++;

      // Count boolean features
      if (habit.isIndoor) indoorCount++;
      if (habit.isSocial) socialCount++;
    });

    const count = habits.filter(h => h).length;

    // Determine preferred time of day
    let preferredTime: 'morning' | 'afternoon' | 'evening' | 'anytime' = 'anytime';
    const maxTime = Math.max(morningCount, afternoonCount, eveningCount);
    if (maxTime === morningCount) preferredTime = 'morning';
    else if (maxTime === afternoonCount) preferredTime = 'afternoon';
    else if (maxTime === eveningCount) preferredTime = 'evening';

    // Find most common category
    let topCategory = 'health_fitness';
    let maxCategoryCount = 0;
    categoryCount.forEach((count, category) => {
      if (count > maxCategoryCount) {
        maxCategoryCount = count;
        topCategory = category;
      }
    });

    // Get top tags
    const topTags = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      habitId: 'user_profile',
      name: 'User Preference Profile',
      category: topCategory,
      subCategory: '',
      tags: topTags,
      difficulty: Math.round(totalDifficulty / count),
      timeOfDay: preferredTime,
      duration: Math.round(totalDuration / count),
      frequency: 'daily',
      requiresEquipment: false,
      isIndoor: indoorCount > count / 2,
      isSocial: socialCount > count / 2,
      energyLevel: 'medium'
    };
  }

  /**
   * Calculate similarity between user preferences and a habit
   */
  private calculateSimilarity(
    userVector: HabitFeatures,
    habit: HabitFeatures
  ): number {
    let similarity = 0;

    // Category similarity (30%)
    if (habit.category === userVector.category) {
      similarity += 0.30;
    }

    // Tag overlap similarity (25%)
    const userTags = new Set(userVector.tags);
    const habitTags = new Set(habit.tags);
    const tagIntersection = new Set([...userTags].filter(t => habitTags.has(t)));
    const tagUnion = new Set([...userTags, ...habitTags]);

    if (tagUnion.size > 0) {
      const tagSimilarity = tagIntersection.size / tagUnion.size;
      similarity += tagSimilarity * 0.25;
    }

    // Difficulty similarity (15%)
    const difficultyDiff = Math.abs(habit.difficulty - userVector.difficulty);
    const difficultySimilarity = Math.max(0, 1 - (difficultyDiff / 10));
    similarity += difficultySimilarity * 0.15;

    // Time of day match (10%)
    if (habit.timeOfDay === userVector.timeOfDay || habit.timeOfDay === 'anytime') {
      similarity += 0.10;
    }

    // Duration similarity (10%)
    const durationDiff = Math.abs(habit.duration - userVector.duration);
    const durationSimilarity = Math.max(0, 1 - (durationDiff / 60));
    similarity += durationSimilarity * 0.10;

    // Indoor/outdoor preference (5%)
    if (habit.isIndoor === userVector.isIndoor) {
      similarity += 0.05;
    }

    // Social preference (5%)
    if (habit.isSocial === userVector.isSocial) {
      similarity += 0.05;
    }

    return Math.min(1, similarity);
  }

  /**
   * Convert habit to recommendation
   */
  private convertToRecommendation(
    habit: HabitFeatures,
    similarity: number
  ): HabitRecommendation {
    return {
      habitId: habit.habitId,
      habitName: habit.name,
      category: habit.category,
      recommendationScore: Math.round(similarity * 100),
      recommendationType: 'content_based',
      reasoning: `Similar to your ${habit.category} habits`,
      successProbability: this.estimateSuccessProbability(habit, similarity),
      estimatedTimeMinutes: habit.duration,
      difficulty: habit.difficulty,
      relatedHabits: []
    };
  }

  /**
   * Estimate success probability based on content similarity
   */
  private estimateSuccessProbability(habit: HabitFeatures, similarity: number): number {
    // Base probability from similarity
    let probability = similarity * 80;

    // Adjust for difficulty
    if (habit.difficulty <= 4) {
      probability += 10; // Easy habits have higher success rate
    } else if (habit.difficulty >= 8) {
      probability -= 10; // Hard habits have lower success rate
    }

    return Math.round(Math.min(95, Math.max(20, probability)));
  }

  /**
   * Get features for a specific habit
   */
  private async getHabitFeatures(habitId: string): Promise<HabitFeatures | null> {
    // Check cache
    if (this.habitFeaturesCache.has(habitId)) {
      return this.habitFeaturesCache.get(habitId)!;
    }

    // Mock implementation - would query database in production
    const mockFeatures: HabitFeatures = {
      habitId,
      name: 'Sample Habit',
      category: 'health_fitness',
      subCategory: 'exercise',
      tags: ['fitness', 'health', 'daily'],
      difficulty: 5,
      timeOfDay: 'morning',
      duration: 30,
      frequency: 'daily',
      requiresEquipment: false,
      isIndoor: false,
      isSocial: false,
      energyLevel: 'medium'
    };

    this.habitFeaturesCache.set(habitId, mockFeatures);
    return mockFeatures;
  }

  /**
   * Get all available habits
   */
  private async getAllHabits(): Promise<HabitFeatures[]> {
    // Mock implementation - would query database in production
    return [
      {
        habitId: 'habit_meditation_10min',
        name: '10-minute morning meditation',
        category: 'mental_wellness',
        subCategory: 'mindfulness',
        tags: ['meditation', 'mindfulness', 'morning', 'stress-relief'],
        difficulty: 4,
        timeOfDay: 'morning',
        duration: 10,
        frequency: 'daily',
        requiresEquipment: false,
        isIndoor: true,
        isSocial: false,
        energyLevel: 'low'
      },
      {
        habitId: 'habit_run_30min',
        name: '30-minute run',
        category: 'health_fitness',
        subCategory: 'cardio',
        tags: ['running', 'cardio', 'exercise', 'outdoor'],
        difficulty: 6,
        timeOfDay: 'morning',
        duration: 30,
        frequency: 'daily',
        requiresEquipment: false,
        isIndoor: false,
        isSocial: false,
        energyLevel: 'high'
      }
      // ... more habits would be loaded from database
    ];
  }
}
