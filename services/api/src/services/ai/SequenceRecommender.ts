/**
 * Sequence Recommender
 * Phase 11 Week 2
 *
 * Recommends optimal habit sequences based on goal templates and
 * successful user progression patterns
 */

import { HabitRecommendation, UserProfile } from './HabitRecommendationEngine';

interface HabitSequence {
  sequenceId: string;
  goalType: string;
  habits: Array<{
    habitId: string;
    order: number;
    startDay: number;
    description: string;
  }>;
  totalDuration: number;
  successRate: number;
}

export class SequenceRecommender {
  private sequenceCache: Map<string, HabitSequence[]> = new Map();

  /**
   * Recommend next habits based on optimal sequences
   */
  async recommend(
    userProfile: UserProfile,
    count: number = 5
  ): Promise<HabitRecommendation[]> {
    const recommendations: HabitRecommendation[] = [];

    // For each user goal, get sequence recommendations
    for (const goal of userProfile.goals) {
      const sequences = await this.getSequencesForGoal(goal);

      sequences.forEach(sequence => {
        // Find next habit in sequence user doesn't have
        const nextHabit = this.findNextHabitInSequence(sequence, userProfile);

        if (nextHabit) {
          recommendations.push({
            habitId: nextHabit.habitId,
            habitName: nextHabit.description,
            category: this.getCategoryForGoal(goal),
            recommendationScore: Math.round(sequence.successRate * 100),
            recommendationType: 'sequence',
            reasoning: `Step ${nextHabit.order} in ${goal} journey`,
            successProbability: Math.round(sequence.successRate * 100),
            estimatedTimeMinutes: 20,
            difficulty: this.estimateDifficulty(nextHabit.order),
            relatedHabits: sequence.habits
              .filter(h => h.order < nextHabit.order)
              .map(h => h.habitId)
          });
        }
      });
    }

    return recommendations.slice(0, count);
  }

  /**
   * Recommend habit sequence for a specific goal
   */
  async recommendForGoal(
    userProfile: UserProfile,
    goalType: string,
    count: number = 5
  ): Promise<HabitRecommendation[]> {
    const sequences = await this.getSequencesForGoal(goalType);

    if (sequences.length === 0) return [];

    // Use most successful sequence
    const bestSequence = sequences.sort((a, b) => b.successRate - a.successRate)[0];

    // Get habits user doesn't have yet
    const userHabitIds = new Set(userProfile.currentHabits.map(h => h.id));

    const recommendations = bestSequence.habits
      .filter(h => !userHabitIds.has(h.habitId))
      .slice(0, count)
      .map(habit => ({
        habitId: habit.habitId,
        habitName: habit.description,
        category: this.getCategoryForGoal(goalType),
        recommendationScore: Math.round(bestSequence.successRate * 100),
        recommendationType: 'sequence' as const,
        reasoning: `Recommended sequence for ${goalType}`,
        successProbability: Math.round(bestSequence.successRate * 100),
        estimatedTimeMinutes: 20,
        difficulty: this.estimateDifficulty(habit.order),
        relatedHabits: bestSequence.habits
          .filter(h => h.order < habit.order)
          .map(h => h.habitId)
      }));

    return recommendations;
  }

  /**
   * Get optimal habit sequences for a goal
   */
  private async getSequencesForGoal(goalType: string): Promise<HabitSequence[]> {
    // Check cache
    if (this.sequenceCache.has(goalType)) {
      return this.sequenceCache.get(goalType)!;
    }

    // Mock data - in production, would analyze successful user progression patterns
    const sequences: Record<string, HabitSequence[]> = {
      'weight_loss': [
        {
          sequenceId: 'weight_loss_gradual',
          goalType: 'weight_loss',
          habits: [
            { habitId: 'track_calories', order: 1, startDay: 1, description: 'Track daily calories' },
            { habitId: 'drink_water', order: 2, startDay: 7, description: 'Drink 8 glasses of water' },
            { habitId: 'walk_30min', order: 3, startDay: 14, description: '30-minute daily walk' },
            { habitId: 'meal_prep', order: 4, startDay: 21, description: 'Weekly meal prep' },
            { habitId: 'strength_training', order: 5, startDay: 30, description: 'Strength training 3x/week' }
          ],
          totalDuration: 90,
          successRate: 0.73
        }
      ],
      'fitness': [
        {
          sequenceId: 'fitness_foundation',
          goalType: 'fitness',
          habits: [
            { habitId: 'morning_stretch', order: 1, startDay: 1, description: '10-minute morning stretch' },
            { habitId: 'cardio_20min', order: 2, startDay: 7, description: '20-minute cardio' },
            { habitId: 'core_workout', order: 3, startDay: 14, description: 'Core strengthening' },
            { habitId: 'full_body_workout', order: 4, startDay: 21, description: 'Full body workout' }
          ],
          totalDuration: 60,
          successRate: 0.68
        }
      ],
      'mental_health': [
        {
          sequenceId: 'mindfulness_journey',
          goalType: 'mental_health',
          habits: [
            { habitId: 'breathing_exercises', order: 1, startDay: 1, description: '5-minute breathing exercises' },
            { habitId: 'gratitude_journal', order: 2, startDay: 7, description: 'Gratitude journaling' },
            { habitId: 'meditation_10min', order: 3, startDay: 14, description: '10-minute meditation' },
            { habitId: 'evening_reflection', order: 4, startDay: 21, description: 'Evening reflection' }
          ],
          totalDuration: 60,
          successRate: 0.75
        }
      ]
    };

    const result = sequences[goalType] || [];
    this.sequenceCache.set(goalType, result);

    return result;
  }

  /**
   * Find next habit in sequence that user doesn't have
   */
  private findNextHabitInSequence(
    sequence: HabitSequence,
    userProfile: UserProfile
  ): HabitSequence['habits'][0] | null {
    const userHabitIds = new Set(userProfile.currentHabits.map(h => h.id));

    // Find first habit in sequence user doesn't have
    for (const habit of sequence.habits) {
      if (!userHabitIds.has(habit.habitId)) {
        return habit;
      }
    }

    return null;
  }

  /**
   * Estimate difficulty based on position in sequence
   */
  private estimateDifficulty(order: number): number {
    // Later habits in sequence tend to be more challenging
    return Math.min(10, 3 + order);
  }

  /**
   * Get category for goal type
   */
  private getCategoryForGoal(goalType: string): string {
    const categoryMap: Record<string, string> = {
      'weight_loss': 'health_fitness',
      'fitness': 'health_fitness',
      'mental_health': 'mental_wellness',
      'productivity': 'productivity',
      'learning': 'education',
      'career': 'career_finance'
    };

    return categoryMap[goalType] || 'health_fitness';
  }
}
