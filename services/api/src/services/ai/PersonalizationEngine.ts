/**
 * Personalization Engine
 * Provides personalized experiences and content for users
 */

import { logger } from '../../utils/logger';

export interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'friendly';
  coachingStyle: 'supportive' | 'challenging' | 'balanced';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  motivationType: 'achievement' | 'affiliation' | 'power' | 'autonomy';
  feedbackFrequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  contentTypes: string[];
  topics: string[];
  goals: string[];
  reminders: boolean;
  privacy: 'public' | 'private' | 'selective';
}

export interface UserBehavior {
  loginFrequency: number;
  sessionDuration: number;
  featuresUsed: string[];
  contentInteractions: Array<{
    type: string;
    engagement: number;
    completionRate: number;
  }>;
  goalProgress: Array<{
    goalId: string;
    completionRate: number;
    lastActivity: Date;
  }>;
}

export interface UserContext {
  timezone: string;
  currentGoals: string[];
  recentActivity: unknown[];
  mood: string;
  stressLevel: number;
  energyLevel: number;
}

export interface PersonalizedContent {
  id: string;
  type: string;
  title: string;
  description: string;
  relevanceScore: number;
  personalizedReason: string;
  estimatedDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CoachingStrategy {
  approach: string;
  techniques: string[];
  communicationStyle: string;
  motivationTactics: string[];
  adaptations: string[];
}

export class PersonalizationEngine {
  private userProfiles: Map<string, UserPreferences> = new Map();
  private userBehaviors: Map<string, UserBehavior> = new Map();

  constructor() {
    logger.info('PersonalizationEngine initialized');
  }

  /**
   * Get user's personalization preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // In a real implementation, this would fetch from database
      if (this.userProfiles.has(userId)) {
        return this.userProfiles.get(userId)!;
      }

      // Return default preferences
      const defaultPreferences: UserPreferences = {
        communicationStyle: 'friendly',
        coachingStyle: 'balanced',
        learningStyle: 'visual',
        motivationType: 'achievement',
        feedbackFrequency: 'daily',
        contentTypes: ['articles', 'exercises', 'videos'],
        topics: ['personal development', 'goal setting', 'productivity'],
        goals: [],
        reminders: true,
        privacy: 'private'
      };

      this.userProfiles.set(userId, defaultPreferences);
      return defaultPreferences;
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user profile with new preferences, behavior, or context
   */
  async updateUserProfile(userId: string, updates: {
    preferences?: Partial<UserPreferences>;
    behavior?: Partial<UserBehavior>;
    context?: Partial<UserContext>;
  }): Promise<void> {
    try {
      if (updates.preferences) {
        const currentPrefs = await this.getUserPreferences(userId);
        const updatedPrefs = { ...currentPrefs, ...updates.preferences };
        this.userProfiles.set(userId, updatedPrefs);
      }

      if (updates.behavior) {
        const currentBehavior = this.userBehaviors.get(userId) || {
          loginFrequency: 0,
          sessionDuration: 0,
          featuresUsed: [],
          contentInteractions: [],
          goalProgress: []
        };
        const updatedBehavior = { ...currentBehavior, ...updates.behavior };
        this.userBehaviors.set(userId, updatedBehavior);
      }

      logger.info(`Updated profile for user ${userId}`);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get personalized content recommendations
   */
  async getPersonalizedContent(
    userId: string,
    contentType: string,
    limit: number
  ): Promise<PersonalizedContent[]> {
    try {
      const preferences = await this.getUserPreferences(userId);
      const behavior = this.userBehaviors.get(userId);

      // Mock personalized content based on preferences
      const mockContent: PersonalizedContent[] = [
        {
          id: 'content-1',
          type: contentType || 'article',
          title: 'Personalized Goal Setting Strategy',
          description: 'A tailored approach to setting and achieving your personal goals',
          relevanceScore: 0.95,
          personalizedReason: `Based on your ${preferences.learningStyle} learning style and ${preferences.motivationType} motivation`,
          estimatedDuration: 15,
          difficulty: 'medium'
        },
        {
          id: 'content-2',
          type: contentType || 'exercise',
          title: 'Daily Reflection Practice',
          description: 'A personalized reflection exercise tailored to your communication style',
          relevanceScore: 0.88,
          personalizedReason: `Matches your ${preferences.communicationStyle} communication preference`,
          estimatedDuration: 10,
          difficulty: 'easy'
        },
        {
          id: 'content-3',
          type: contentType || 'video',
          title: 'Productivity Techniques for Your Style',
          description: 'Video content adapted to your learning and coaching preferences',
          relevanceScore: 0.82,
          personalizedReason: `Aligned with your ${preferences.coachingStyle} coaching style preference`,
          estimatedDuration: 20,
          difficulty: 'medium'
        }
      ];

      return mockContent.slice(0, limit);
    } catch (error) {
      logger.error('Error getting personalized content:', error);
      throw error;
    }
  }

  /**
   * Generate personalized coaching strategy
   */
  async generateCoachingStrategy(userId: string): Promise<CoachingStrategy> {
    try {
      const preferences = await this.getUserPreferences(userId);
      const behavior = this.userBehaviors.get(userId);

      // Generate strategy based on user profile
      const strategy: CoachingStrategy = {
        approach: this.getCoachingApproach(preferences),
        techniques: this.getRecommendedTechniques(preferences, behavior),
        communicationStyle: preferences.communicationStyle,
        motivationTactics: this.getMotivationTactics(preferences.motivationType),
        adaptations: this.getAdaptations(preferences, behavior)
      };

      return strategy;
    } catch (error) {
      logger.error('Error generating coaching strategy:', error);
      throw error;
    }
  }

  private getCoachingApproach(preferences: UserPreferences): string {
    switch (preferences.coachingStyle) {
      case 'supportive':
        return 'Emphasis on encouragement, positive reinforcement, and emotional support';
      case 'challenging':
        return 'Focus on pushing boundaries, setting stretch goals, and constructive challenge';
      case 'balanced':
      default:
        return 'Balanced approach combining support with appropriate challenge';
    }
  }

  private getRecommendedTechniques(
    preferences: UserPreferences,
    behavior?: UserBehavior
  ): string[] {
    const techniques = [];

    if (preferences.learningStyle === 'visual') {
      techniques.push('Visual goal tracking', 'Infographic summaries', 'Progress charts');
    } else if (preferences.learningStyle === 'auditory') {
      techniques.push('Audio feedback', 'Verbal affirmations', 'Discussion-based exercises');
    } else if (preferences.learningStyle === 'kinesthetic') {
      techniques.push('Hands-on activities', 'Movement-based exercises', 'Practical applications');
    }

    if (preferences.feedbackFrequency === 'immediate') {
      techniques.push('Real-time notifications', 'Instant feedback loops');
    }

    return techniques;
  }

  private getMotivationTactics(motivationType: string): string[] {
    switch (motivationType) {
      case 'achievement':
        return ['Goal completion rewards', 'Progress milestones', 'Personal bests tracking'];
      case 'affiliation':
        return ['Community engagement', 'Peer support', 'Social sharing features'];
      case 'power':
        return ['Leadership challenges', 'Influence metrics', 'Decision-making exercises'];
      case 'autonomy':
        return ['Self-directed learning', 'Choice in activities', 'Flexible scheduling'];
      default:
        return ['Balanced motivational approach'];
    }
  }

  private getAdaptations(
    preferences: UserPreferences,
    behavior?: UserBehavior
  ): string[] {
    const adaptations = [];

    if (behavior?.loginFrequency < 3) {
      adaptations.push('Engagement reminders', 'Simpler onboarding');
    }

    if (behavior?.sessionDuration < 10) {
      adaptations.push('Bite-sized content', 'Quick wins focus');
    }

    return adaptations;
  }
}

export const personalizationEngine = new PersonalizationEngine();