/**
 * AI Recommendation Engine
 *
 * Generates personalized recommendations for users based on their behavior,
 * goals, habits, and engagement patterns.
 */

// Types
export type RecommendationType =
  | 'habit'
  | 'goal'
  | 'content'
  | 'coach'
  | 'session'
  | 'challenge'
  | 'action';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export type RecommendationReason =
  | 'goal_alignment'
  | 'behavior_pattern'
  | 'success_prediction'
  | 'engagement_boost'
  | 'streak_protection'
  | 'personalization'
  | 'trending'
  | 'coach_suggestion';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  reason: RecommendationReason;
  reasonText: string;
  confidence: number; // 0-100
  actionText: string;
  actionRoute?: string;
  metadata: Record<string, unknown>;
  generatedAt: Date;
  expiresAt?: Date;
  isPersonalized: boolean;
}

export interface UserContext {
  userId: string;
  goals: UserGoal[];
  habits: UserHabit[];
  recentActivity: ActivityEvent[];
  preferences: UserPreferences;
  engagementScore: number;
  currentStreak: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface UserGoal {
  id: string;
  title: string;
  category: string;
  progress: number;
  isOnTrack: boolean;
  daysRemaining: number;
}

export interface UserHabit {
  id: string;
  name: string;
  category: string;
  completionRate: number;
  currentStreak: number;
  bestTimeOfDay: string;
  isStruggling: boolean;
}

export interface ActivityEvent {
  type: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface UserPreferences {
  preferredCategories: string[];
  preferredCoachingStyle: string;
  notificationPreferences: string[];
  goals: string[];
}

export interface RecommendationFilter {
  types?: RecommendationType[];
  priorities?: RecommendationPriority[];
  limit?: number;
  excludeIds?: string[];
}

export class RecommendationEngine {
  /**
   * Generate personalized recommendations for a user
   */
  async generateRecommendations(
    userId: string,
    filter: RecommendationFilter = {}
  ): Promise<Recommendation[]> {
    // Get user context
    const context = await this.getUserContext(userId);

    // Generate recommendations from different sources
    const recommendations: Recommendation[] = [];

    // 1. Habit-based recommendations
    recommendations.push(...this.generateHabitRecommendations(context));

    // 2. Goal-based recommendations
    recommendations.push(...this.generateGoalRecommendations(context));

    // 3. Engagement-based recommendations
    recommendations.push(...this.generateEngagementRecommendations(context));

    // 4. Coach/session recommendations
    recommendations.push(...this.generateCoachRecommendations(context));

    // 5. Content recommendations
    recommendations.push(...this.generateContentRecommendations(context));

    // 6. Challenge recommendations
    recommendations.push(...this.generateChallengeRecommendations(context));

    // Apply filters
    let filtered = recommendations;

    if (filter.types?.length) {
      filtered = filtered.filter((r) => filter.types!.includes(r.type));
    }

    if (filter.priorities?.length) {
      filtered = filtered.filter((r) => filter.priorities!.includes(r.priority));
    }

    if (filter.excludeIds?.length) {
      filtered = filtered.filter((r) => !filter.excludeIds!.includes(r.id));
    }

    // Sort by priority and confidence
    filtered.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.confidence - a.confidence;
    });

    // Apply limit
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Get user context for recommendation generation
   */
  private async getUserContext(userId: string): Promise<UserContext> {
    // Mock implementation - in production, this would fetch from database
    return {
      userId,
      goals: [
        {
          id: 'g1',
          title: 'Read 24 Books',
          category: 'Personal Development',
          progress: 75,
          isOnTrack: true,
          daysRemaining: 180,
        },
        {
          id: 'g2',
          title: 'Run 500km',
          category: 'Fitness',
          progress: 45,
          isOnTrack: false,
          daysRemaining: 180,
        },
      ],
      habits: [
        {
          id: 'h1',
          name: 'Morning Meditation',
          category: 'Wellness',
          completionRate: 85,
          currentStreak: 12,
          bestTimeOfDay: '7:00 AM',
          isStruggling: false,
        },
        {
          id: 'h2',
          name: 'Daily Exercise',
          category: 'Fitness',
          completionRate: 55,
          currentStreak: 2,
          bestTimeOfDay: '6:30 PM',
          isStruggling: true,
        },
      ],
      recentActivity: [
        { type: 'habit_completed', timestamp: new Date(), metadata: { habitId: 'h1' } },
        { type: 'session_attended', timestamp: new Date(Date.now() - 86400000), metadata: {} },
      ],
      preferences: {
        preferredCategories: ['Fitness', 'Personal Development'],
        preferredCoachingStyle: 'supportive',
        notificationPreferences: ['morning', 'evening'],
        goals: ['health', 'learning'],
      },
      engagementScore: 78,
      currentStreak: 12,
      riskLevel: 'low',
    };
  }

  /**
   * Generate habit-based recommendations
   */
  private generateHabitRecommendations(context: UserContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Struggling habits
    const strugglingHabits = context.habits.filter((h) => h.isStruggling);
    for (const habit of strugglingHabits) {
      recommendations.push({
        id: `habit-${habit.id}-struggling`,
        type: 'habit',
        priority: 'high',
        title: `Revive Your ${habit.name} Habit`,
        description: `Your completion rate for ${habit.name} has dropped to ${habit.completionRate}%. Try adjusting the time or reducing the difficulty.`,
        reason: 'behavior_pattern',
        reasonText: 'Based on your recent activity patterns',
        confidence: 85,
        actionText: 'Adjust Habit',
        actionRoute: `/habits/${habit.id}/edit`,
        metadata: { habitId: habit.id, completionRate: habit.completionRate },
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isPersonalized: true,
      });
    }

    // Streak protection
    if (context.currentStreak > 5) {
      const atRiskHabits = context.habits.filter((h) => h.currentStreak === 0);
      if (atRiskHabits.length > 0) {
        recommendations.push({
          id: `streak-protection-${Date.now()}`,
          type: 'action',
          priority: 'high',
          title: 'Protect Your Streak!',
          description: `You have a ${context.currentStreak}-day streak. Complete your remaining habits today to keep it going!`,
          reason: 'streak_protection',
          reasonText: 'Your streak is at risk',
          confidence: 95,
          actionText: 'Complete Now',
          actionRoute: '/habits',
          metadata: { currentStreak: context.currentStreak },
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isPersonalized: true,
        });
      }
    }

    // New habit suggestions based on goals
    for (const goal of context.goals) {
      const relatedHabits = context.habits.filter(
        (h) => h.category.toLowerCase() === goal.category.toLowerCase()
      );
      if (relatedHabits.length < 2) {
        recommendations.push({
          id: `habit-suggestion-${goal.id}`,
          type: 'habit',
          priority: 'medium',
          title: `Add a ${goal.category} Habit`,
          description: `Supporting your "${goal.title}" goal with daily habits can increase success by 40%.`,
          reason: 'goal_alignment',
          reasonText: `Aligned with your ${goal.category} goal`,
          confidence: 75,
          actionText: 'Create Habit',
          actionRoute: '/habits/create',
          metadata: { goalId: goal.id, category: goal.category },
          generatedAt: new Date(),
          isPersonalized: true,
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate goal-based recommendations
   */
  private generateGoalRecommendations(context: UserContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const goal of context.goals) {
      // Behind schedule goals
      if (!goal.isOnTrack && goal.progress < 50) {
        recommendations.push({
          id: `goal-catchup-${goal.id}`,
          type: 'goal',
          priority: 'high',
          title: `Catch Up on "${goal.title}"`,
          description: `You're behind schedule on this goal. Consider increasing your daily target or extending the deadline.`,
          reason: 'success_prediction',
          reasonText: 'Goal completion at risk',
          confidence: 88,
          actionText: 'Review Goal',
          actionRoute: `/goals/${goal.id}`,
          metadata: { goalId: goal.id, progress: goal.progress },
          generatedAt: new Date(),
          isPersonalized: true,
        });
      }

      // Near completion celebration
      if (goal.progress >= 90) {
        recommendations.push({
          id: `goal-finish-${goal.id}`,
          type: 'goal',
          priority: 'medium',
          title: `Almost There! Finish "${goal.title}"`,
          description: `You're ${goal.progress}% complete! Just a little more effort to achieve this goal.`,
          reason: 'success_prediction',
          reasonText: 'Goal almost complete',
          confidence: 92,
          actionText: 'View Progress',
          actionRoute: `/goals/${goal.id}`,
          metadata: { goalId: goal.id, progress: goal.progress },
          generatedAt: new Date(),
          isPersonalized: true,
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate engagement-based recommendations
   */
  private generateEngagementRecommendations(context: UserContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Low engagement users
    if (context.engagementScore < 50) {
      recommendations.push({
        id: 'engagement-boost',
        type: 'action',
        priority: 'high',
        title: 'Boost Your Engagement',
        description: 'Regular check-ins help you stay on track. Try setting daily reminders for your habits.',
        reason: 'engagement_boost',
        reasonText: 'Your engagement could be improved',
        confidence: 80,
        actionText: 'Set Reminders',
        actionRoute: '/settings/notifications',
        metadata: { engagementScore: context.engagementScore },
        generatedAt: new Date(),
        isPersonalized: true,
      });
    }

    // Celebrate high engagement
    if (context.engagementScore >= 80 && context.currentStreak >= 7) {
      recommendations.push({
        id: 'engagement-celebrate',
        type: 'action',
        priority: 'low',
        title: 'You\'re on Fire!',
        description: `Amazing consistency! Your ${context.currentStreak}-day streak puts you in the top 10% of users.`,
        reason: 'personalization',
        reasonText: 'Celebrating your achievement',
        confidence: 95,
        actionText: 'Share Achievement',
        metadata: { engagementScore: context.engagementScore, streak: context.currentStreak },
        generatedAt: new Date(),
        isPersonalized: true,
      });
    }

    return recommendations;
  }

  /**
   * Generate coach/session recommendations
   */
  private generateCoachRecommendations(context: UserContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check if user hasn't had a session recently
    const lastSession = context.recentActivity.find((a) => a.type === 'session_attended');
    const daysSinceSession = lastSession
      ? Math.floor((Date.now() - lastSession.timestamp.getTime()) / (24 * 60 * 60 * 1000))
      : 30;

    if (daysSinceSession >= 14) {
      recommendations.push({
        id: 'session-reminder',
        type: 'session',
        priority: 'medium',
        title: 'Schedule Your Next Session',
        description: `It's been ${daysSinceSession} days since your last coaching session. Regular sessions accelerate progress by 3x.`,
        reason: 'success_prediction',
        reasonText: 'Sessions boost your progress',
        confidence: 85,
        actionText: 'Book Session',
        actionRoute: '/sessions/book',
        metadata: { daysSinceSession },
        generatedAt: new Date(),
        isPersonalized: true,
      });
    }

    // Coach matching for struggling users
    if (context.riskLevel === 'high') {
      recommendations.push({
        id: 'coach-matching',
        type: 'coach',
        priority: 'high',
        title: 'Get Expert Support',
        description: 'A specialized coach can help you overcome current challenges and get back on track.',
        reason: 'coach_suggestion',
        reasonText: 'Based on your current challenges',
        confidence: 82,
        actionText: 'Find a Coach',
        actionRoute: '/coaches',
        metadata: { riskLevel: context.riskLevel },
        generatedAt: new Date(),
        isPersonalized: true,
      });
    }

    return recommendations;
  }

  /**
   * Generate content recommendations
   */
  private generateContentRecommendations(context: UserContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Based on preferred categories
    for (const category of context.preferences.preferredCategories.slice(0, 2)) {
      recommendations.push({
        id: `content-${category.toLowerCase().replace(' ', '-')}`,
        type: 'content',
        priority: 'low',
        title: `New ${category} Content`,
        description: `Check out the latest articles and resources on ${category} to support your journey.`,
        reason: 'personalization',
        reasonText: `Based on your interest in ${category}`,
        confidence: 70,
        actionText: 'Explore',
        actionRoute: `/content?category=${encodeURIComponent(category)}`,
        metadata: { category },
        generatedAt: new Date(),
        isPersonalized: true,
      });
    }

    return recommendations;
  }

  /**
   * Generate challenge recommendations
   */
  private generateChallengeRecommendations(context: UserContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recommend challenges based on goals
    if (context.goals.some((g) => g.category === 'Fitness')) {
      recommendations.push({
        id: 'challenge-fitness',
        type: 'challenge',
        priority: 'medium',
        title: 'Join the 30-Day Fitness Challenge',
        description: 'Compete with others on similar fitness goals. Winners get exclusive badges and rewards!',
        reason: 'goal_alignment',
        reasonText: 'Aligned with your Fitness goals',
        confidence: 78,
        actionText: 'Join Challenge',
        actionRoute: '/challenges/fitness-30',
        metadata: { challengeType: 'fitness' },
        generatedAt: new Date(),
        isPersonalized: true,
      });
    }

    // Trending challenge
    recommendations.push({
      id: 'challenge-trending',
      type: 'challenge',
      priority: 'low',
      title: 'Trending: Morning Routine Challenge',
      description: '2,450 users are building better morning routines. Join them!',
      reason: 'trending',
      reasonText: 'Popular with users like you',
      confidence: 65,
      actionText: 'Learn More',
      actionRoute: '/challenges/morning-routine',
      metadata: { participants: 2450 },
      generatedAt: new Date(),
      isPersonalized: false,
    });

    return recommendations;
  }

  /**
   * Record recommendation interaction
   */
  async recordInteraction(
    userId: string,
    recommendationId: string,
    action: 'viewed' | 'clicked' | 'dismissed' | 'completed'
  ): Promise<void> {
    // Store interaction for future recommendation improvements
    console.log(`Recommendation interaction: ${userId} ${action} ${recommendationId}`);
    // In production, this would store to database for ML training
  }

  /**
   * Get recommendation effectiveness metrics
   */
  async getEffectivenessMetrics(): Promise<{
    clickThroughRate: number;
    completionRate: number;
    dismissRate: number;
    avgConfidence: number;
    topPerformingTypes: Array<{ type: RecommendationType; ctr: number }>;
  }> {
    // Mock implementation
    return {
      clickThroughRate: 0.32,
      completionRate: 0.18,
      dismissRate: 0.12,
      avgConfidence: 78.5,
      topPerformingTypes: [
        { type: 'habit', ctr: 0.42 },
        { type: 'goal', ctr: 0.38 },
        { type: 'session', ctr: 0.35 },
        { type: 'challenge', ctr: 0.28 },
        { type: 'content', ctr: 0.22 },
      ],
    };
  }
}
