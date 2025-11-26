import { db } from '../database';
import { logger } from '../../utils/logger';

import { aiService } from './AIService';

export interface ProfileInsight {
  category: string;
  insight: string;
  confidence: number;
  evidence: string[];
}

export interface ProfileAssessment {
  learningStyle: string;
  communicationPreference: string;
  personalityTraits: string[];
  strengths: string[];
  growthAreas: string[];
  motivators: string[];
  obstacles: string[];
  recommendations: string[];
}

export class UserProfilingService {
  async createOrUpdateProfile(userId: string): Promise<any> {
    try {
      // Get or create profile using raw SQL
      let profileResult = await db.query<{
        id: string;
        userId: string;
        metadata: any;
      }>(
        `SELECT id, "userId", metadata FROM user_profiles WHERE "userId" = $1`,
        [userId]
      );

      let profile: any;
      const defaultMetadata = {
        learningStyle: 'balanced',
        communicationPreference: 'supportive',
        coachingPreferences: {
          preferredMethods: ['goal', 'habit', 'reflection'],
          sessionFrequency: 'weekly',
          sessionDuration: 30,
          preferredTimes: ['morning', 'evening'],
          focusAreas: ['productivity', 'wellbeing'],
        },
        behaviorPatterns: {
          avgSessionDuration: 0,
          completionRate: 0,
          engagementLevel: 0,
          preferredTopics: [],
          responseTime: 0,
          consistencyScore: 0,
        },
        progressMetrics: {
          totalGoalsSet: 0,
          goalsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalSessions: 0,
          accountAge: 0,
          lastActiveDate: new Date(),
        },
        strengths: [],
        growthAreas: [],
        motivators: [],
        obstacles: [],
      };

      if (profileResult.rows.length === 0) {
        // Create new profile with generated UUID
        const createResult = await db.query<{ id: string; userId: string; metadata: any }>(
          `
            INSERT INTO user_profiles (id, "userId", metadata, "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
            RETURNING id, "userId", metadata
          `,
          [userId, JSON.stringify(defaultMetadata)]
        );
        profile = createResult.rows[0];
      } else {
        profile = profileResult.rows[0];
        // Ensure metadata has default structure
        profile.metadata = { ...defaultMetadata, ...profile.metadata };
      }

      // Update profile with latest data
      await this.updateProfileMetrics(profile);
      await this.analyzeUserBehavior(profile);
      await this.identifyPatternsAndInsights(profile);

      return profile;
    } catch (error) {
      logger.error('Error creating/updating user profile:', error);
      throw error;
    }
  }

  private async updateProfileMetrics(profile: any): Promise<void> {
    // Query only the createdAt field to avoid avatar column error
    const userResult = await db.query<{ createdAt: Date }>(
      `SELECT "createdAt" FROM users WHERE id = $1`,
      [profile.userId]
    );

    if (userResult.rows.length === 0) return;
    const user = userResult.rows[0];

    // Calculate account age
    const accountAge = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get goals metrics using raw SQL
    const goalsResult = await db.query<{ id: string; status: string }>(
      `SELECT id, status FROM goals WHERE "userId" = $1`,
      [profile.userId]
    );
    const goals = goalsResult.rows;
    const completedGoals = goals.filter(g => g.status === 'completed');

    // Get task metrics using raw SQL
    const tasksResult = await db.query<{ id: string; status: string }>(
      `SELECT id, status FROM tasks
       WHERE "userId" = $1
       AND "updatedAt" >= NOW() - INTERVAL '30 days'`,
      [profile.userId]
    );
    const tasks = tasksResult.rows;

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

    // Calculate streaks
    const currentStreak = await this.calculateCurrentStreak(profile.userId);
    const longestStreak = Math.max(currentStreak, profile.metadata.progressMetrics?.longestStreak || 0);

    // Get session metrics using raw SQL
    const sessionsResult = await db.query<{ id: string }>(
      `SELECT id FROM chats WHERE "userId" = $1`,
      [profile.userId]
    );
    const totalSessions = sessionsResult.rows.length;

    // For now, set avgSessionDuration to 0 to avoid complex JOIN queries
    // TODO: Implement proper session duration calculation with raw SQL
    const avgSessionDuration = 0;

    // Update progress metrics
    profile.metadata.progressMetrics = {
      totalGoalsSet: goals.length,
      goalsCompleted: completedGoals.length,
      currentStreak,
      longestStreak,
      totalSessions,
      accountAge,
      lastActiveDate: new Date(),
    };

    // Update behavior patterns
    if (profile.metadata.behaviorPatterns) {
      profile.metadata.behaviorPatterns.completionRate = Math.round(completionRate * 100);
      profile.metadata.behaviorPatterns.avgSessionDuration = avgSessionDuration;
    }

    // Save back to database
    await db.query(
      `UPDATE user_profiles SET metadata = $1, "updatedAt" = NOW() WHERE "userId" = $2`,
      [JSON.stringify(profile.metadata), profile.userId]
    );
  }

  private async analyzeUserBehavior(profile: any): Promise<void> {
    // Analyze chat messages for communication patterns using raw SQL
    // Note: chats table stores messages directly, no separate chat_messages table
    const recentMessagesResult = await db.query<{
      id: string;
      content: string;
      role: string;
      createdAt: Date;
    }>(
      `
        SELECT id, message as content, sender as role, "createdAt"
        FROM chats
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 100
      `,
      [profile.userId]
    );

    if (recentMessagesResult.rows.length > 0) {
      // Analyze message patterns
      const patterns = await this.analyzeMessagePatterns(recentMessagesResult.rows);

      if (profile.metadata.behaviorPatterns) {
        profile.metadata.behaviorPatterns.preferredTopics = patterns.topics;
        profile.metadata.behaviorPatterns.responseTime = patterns.avgResponseTime;
        profile.metadata.behaviorPatterns.engagementLevel = patterns.engagementLevel;
      }
    }

    // Analyze mood patterns from mood_entries table
    const moodResult = await db.query<{ mood: string; intensity: number }>(
      `
        SELECT mood, intensity
        FROM mood_entries
        WHERE "userId" = $1
          AND "recordedAt" >= NOW() - INTERVAL '30 days'
        ORDER BY "recordedAt" DESC
      `,
      [profile.userId]
    );

    if (moodResult.rows.length > 0) {
      const moodPatterns = this.analyzeMoodPatterns(moodResult.rows);
      profile.metadata.moodPatterns = moodPatterns;
    }

    // Save back to database
    await db.query(
      `UPDATE user_profiles SET metadata = $1, "updatedAt" = NOW() WHERE "userId" = $2`,
      [JSON.stringify(profile.metadata), profile.userId]
    );
  }

  private async identifyPatternsAndInsights(profile: any): Promise<void> {
    // Use AI to analyze user data and generate insights
    const userContext = {
      progressMetrics: profile.metadata.progressMetrics,
      behaviorPatterns: profile.metadata.behaviorPatterns,
      metadata: profile.metadata,
    };

    const insights = await this.generateAIInsights(userContext);

    // Update profile based on insights
    if (insights.learningStyle && insights.learningStyle !== profile.metadata.learningStyle) {
      profile.metadata.learningStyle = insights.learningStyle;
    }

    if (
      insights.communicationPreference &&
      insights.communicationPreference !== profile.metadata.communicationPreference
    ) {
      profile.metadata.communicationPreference = insights.communicationPreference;
    }

    if (insights.strengths.length > 0) {
      profile.metadata.strengths = [...new Set([...(profile.metadata.strengths || []), ...insights.strengths])];
    }

    if (insights.growthAreas.length > 0) {
      profile.metadata.growthAreas = [...new Set([...(profile.metadata.growthAreas || []), ...insights.growthAreas])];
    }

    if (insights.motivators.length > 0) {
      profile.metadata.motivators = [...new Set([...(profile.metadata.motivators || []), ...insights.motivators])];
    }

    if (insights.obstacles.length > 0) {
      profile.metadata.obstacles = [...new Set([...(profile.metadata.obstacles || []), ...insights.obstacles])];
    }

    // Save back to database
    await db.query(
      `UPDATE user_profiles SET metadata = $1, "updatedAt" = NOW() WHERE "userId" = $2`,
      [JSON.stringify(profile.metadata), profile.userId]
    );
  }

  private async calculateCurrentStreak(userId: string): Promise<number> {
    // Fetch completed tasks using raw SQL
    const tasksResult = await db.query<{ id: string; completedAt: Date }>(
      `SELECT id, "completedAt" FROM tasks
       WHERE "userId" = $1
       AND status = 'completed'
       AND "completedAt" IS NOT NULL
       ORDER BY "completedAt" DESC`,
      [userId]
    );
    const tasks = tasksResult.rows;

    if (tasks.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDate = new Date(today);
    let shouldContinue = true;
    const maxIterations = 365; // Prevent infinite loops
    let iterations = 0;

    while (shouldContinue && iterations < maxIterations) {
      iterations++;
      
      const tasksOnDate = tasks.filter(t => {
        const taskDate = new Date(t.completedAt!);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === currentDate.getTime();
      });

      if (tasksOnDate.length === 0) {
        // Check if it's today (no tasks today doesn't break streak)
        if (currentDate.getTime() === today.getTime() && streak > 0) {
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        }
        shouldContinue = false;
        break;
      }

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  private async analyzeMessagePatterns(
    messages: Array<{ content: string; role: string; createdAt: Date }>
  ): Promise<{ topics: string[]; avgResponseTime: number; engagementLevel: number }> {
    const userMessages = messages.filter(m => m.role === 'user');

    // Topic extraction
    const topicKeywords = {
      goals: ['goal', 'objective', 'target', 'achieve', 'plan'],
      habits: ['habit', 'routine', 'daily', 'practice', 'consistency'],
      productivity: ['productivity', 'efficient', 'task', 'time', 'focus'],
      wellbeing: ['mood', 'stress', 'happy', 'anxious', 'energy', 'health'],
      motivation: ['motivation', 'inspire', 'drive', 'passion', 'purpose'],
      progress: ['progress', 'improvement', 'growth', 'development', 'success'],
    };

    const topicCounts: Record<string, number> = {};

    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => content.includes(keyword))) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      });
    });

    const preferredTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);

    // Calculate average response time
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === 'user' && messages[i - 1].role === 'assistant') {
        const timeDiff =
          (new Date(messages[i].createdAt).getTime() -
            new Date(messages[i - 1].createdAt).getTime()) /
          (1000 * 60);
        if (timeDiff > 0 && timeDiff < 60) {
          // Within an hour
          responseTimes.push(timeDiff);
        }
      }
    }

    const avgResponseTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
        : 10;

    // Calculate engagement level (0-100)
    // Estimate sessions based on time gaps > 30 minutes between messages
    let sessionCount = 1;
    for (let i = 1; i < messages.length; i++) {
      const timeDiff =
        new Date(messages[i - 1].createdAt).getTime() - new Date(messages[i].createdAt).getTime();
      if (timeDiff > 30 * 60 * 1000) {
        // 30 minute gap = new session
        sessionCount++;
      }
    }
    const messagesPerSession = messages.length / Math.max(1, sessionCount);
    const avgMessageLength =
      userMessages.reduce((sum, m) => sum + m.content.length, 0) / Math.max(1, userMessages.length);

    const engagementLevel = Math.min(
      100,
      Math.round(
        messagesPerSession * 2 + // Weight: 2x
          Math.min(avgMessageLength / 10, 10) * 3 + // Weight: 3x, cap at 10
          preferredTopics.length * 10 // Weight: 10 per topic
      )
    );

    return {
      topics: preferredTopics,
      avgResponseTime,
      engagementLevel,
    };
  }

  private analyzeMoodPatterns(
    moods: Array<{ mood: string; intensity: number }>
  ): { dominantMood: string; avgIntensity: number; intensityTrend: string; moodVariability: number } {
    const moodCounts: Record<string, number> = {};
    let totalIntensity = 0;

    moods.forEach(mood => {
      moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
      totalIntensity += mood.intensity || 3;
    });

    const dominantMood =
      Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

    const avgIntensity = Math.round(totalIntensity / moods.length);

    // Analyze mood trends
    const recentMoods = moods.slice(0, 7);
    const olderMoods = moods.slice(7, 14);

    const recentAvgIntensity =
      recentMoods.reduce((sum, m) => sum + (m.intensity || 3), 0) / Math.max(1, recentMoods.length);
    const olderAvgIntensity =
      olderMoods.reduce((sum, m) => sum + (m.intensity || 3), 0) / Math.max(1, olderMoods.length);

    const intensityTrend =
      recentAvgIntensity > olderAvgIntensity
        ? 'improving'
        : recentAvgIntensity < olderAvgIntensity
          ? 'declining'
          : 'stable';

    return {
      dominantMood,
      avgIntensity,
      intensityTrend,
      moodVariability: Object.keys(moodCounts).length,
    };
  }

  private async generateAIInsights(userContext: {
    progressMetrics: Record<string, unknown>;
    behaviorPatterns: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }): Promise<ProfileAssessment> {
    const prompt = `Analyze this user profile data and provide insights:

Progress Metrics:
${JSON.stringify(userContext.progressMetrics, null, 2)}

Behavior Patterns:
${JSON.stringify(userContext.behaviorPatterns, null, 2)}

Additional Data:
${JSON.stringify(userContext.metadata, null, 2)}

Based on this data, provide a JSON response with:
1. learningStyle: (visual, auditory, kinesthetic, reading, or balanced)
2. communicationPreference: (supportive, direct, analytical, motivational, or empathetic)
3. personalityTraits: array of 3-5 personality traits
4. strengths: array of 3-5 identified strengths
5. growthAreas: array of 2-3 areas for improvement
6. motivators: array of 2-3 key motivators
7. obstacles: array of 1-2 main obstacles
8. recommendations: array of 3-5 personalized recommendations

Consider completion rates, consistency, engagement patterns, and mood data in your analysis.`;

    try {
      const response = await aiService.generateResponse(
        [
          {
            role: 'system',
            content:
              'You are an expert behavioral analyst specializing in user profiling and personalized coaching recommendations. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          temperature: 0.3,
          maxTokens: 1000,
        }
      );

      const insights = JSON.parse(response.content);
      return insights;
    } catch (error) {
      logger.error('Error generating AI insights:', error);

      // Return default insights
      return {
        learningStyle: 'balanced',
        communicationPreference: 'supportive',
        personalityTraits: ['consistent', 'goal-oriented'],
        strengths: ['dedication', 'self-awareness'],
        growthAreas: ['consistency', 'goal completion'],
        motivators: ['progress tracking', 'achievement'],
        obstacles: ['time management'],
        recommendations: ['Set smaller, achievable goals', 'Focus on daily habits'],
      };
    }
  }

  async getProfileInsights(userId: string): Promise<ProfileInsight[]> {
    const profile = await this.createOrUpdateProfile(userId);
    const insights: ProfileInsight[] = [];

    // Learning style insight
    if (profile.metadata.learningStyle !== 'balanced') {
      insights.push({
        category: 'Learning Style',
        insight: `You appear to be a ${profile.metadata.learningStyle} learner. We'll adapt coaching to include more ${this.getLearningStyleRecommendations(profile.metadata.learningStyle || 'balanced')}.`,
        confidence: 0.8,
        evidence: ['Based on your interaction patterns', 'Derived from content preferences'],
      });
    }

    // Consistency insight
    if (
      profile.metadata.behaviorPatterns?.consistencyScore &&
      profile.metadata.behaviorPatterns?.consistencyScore > 70
    ) {
      insights.push({
        category: 'Consistency',
        insight:
          'Your consistency is excellent! You engage regularly, which is key to achieving your goals.',
        confidence: 0.9,
        evidence: [
          `${profile.metadata.behaviorPatterns?.consistencyScore}% consistency score`,
          `${profile.metadata.progressMetrics?.currentStreak} day streak`,
        ],
      });
    } else if (
      profile.metadata.behaviorPatterns?.consistencyScore &&
      profile.metadata.behaviorPatterns?.consistencyScore < 40
    ) {
      insights.push({
        category: 'Consistency',
        insight:
          'Building consistency could accelerate your progress. Consider setting daily reminders.',
        confidence: 0.85,
        evidence: [
          `${profile.metadata.behaviorPatterns?.consistencyScore}% consistency score`,
          'Irregular engagement patterns',
        ],
      });
    }

    // Engagement insight
    if (
      profile.metadata.behaviorPatterns?.engagementLevel &&
      profile.metadata.behaviorPatterns?.engagementLevel > 70
    ) {
      insights.push({
        category: 'Engagement',
        insight: 'Your high engagement level shows strong commitment. Keep up the great work!',
        confidence: 0.85,
        evidence: [
          `${profile.metadata.behaviorPatterns?.engagementLevel}% engagement level`,
          'Active participation in sessions',
        ],
      });
    }

    // Topic preferences
    if (
      profile.metadata.behaviorPatterns?.preferredTopics &&
      profile.metadata.behaviorPatterns?.preferredTopics.length > 0
    ) {
      insights.push({
        category: 'Focus Areas',
        insight: `You're most interested in ${profile.metadata.behaviorPatterns?.preferredTopics?.join(', ')}. We'll prioritize content in these areas.`,
        confidence: 0.75,
        evidence: ['Derived from conversation history', 'Based on goal categories'],
      });
    }

    // Strengths
    if (profile.metadata.strengths && profile.metadata.strengths.length > 0) {
      insights.push({
        category: 'Strengths',
        insight: `Your key strengths include ${profile.metadata.strengths?.slice(0, 3).join(', ')}. Leverage these for faster progress.`,
        confidence: 0.8,
        evidence: [
          'Identified through behavioral analysis',
          'Consistent demonstration in activities',
        ],
      });
    }

    // Growth opportunities
    if (profile.metadata.growthAreas && profile.metadata.growthAreas.length > 0) {
      insights.push({
        category: 'Growth Opportunities',
        insight: `Focus on developing ${profile.metadata.growthAreas[0]} to unlock your next level of growth.`,
        confidence: 0.75,
        evidence: ['Area with most improvement potential', 'Common challenge in your journey'],
      });
    }

    return insights;
  }

  private getLearningStyleRecommendations(style: string): string {
    const recommendations: Record<string, any> = {
      visual: 'visual aids, charts, and progress visualizations',
      auditory: 'voice notes, discussions, and audio content',
      kinesthetic: 'hands-on exercises and practical applications',
      reading: 'detailed written guides and documentation',
      balanced: 'varied content formats',
    };

    return recommendations[style] || recommendations.balanced;
  }

  async updateUserPreferences(
    userId: string,
    preferences: {
      learningStyle?: string;
      communicationPreference?: string;
      coachingPreferences?: Record<string, unknown>;
      focusAreas?: string[];
    }
  ): Promise<{ id: string; userId: string; metadata: Record<string, unknown> }> {
    const profile = await this.createOrUpdateProfile(userId);

    if (preferences.learningStyle) {
      profile.metadata.learningStyle = preferences.learningStyle;
    }

    if (preferences.communicationPreference) {
      profile.metadata.communicationPreference = preferences.communicationPreference;
    }

    if (preferences.coachingPreferences) {
      profile.metadata.coachingPreferences = {
        ...(profile.metadata.coachingPreferences as Record<string, unknown>),
        ...preferences.coachingPreferences,
      };
    }

    if (preferences.focusAreas) {
      if (profile.metadata.coachingPreferences) {
        (profile.metadata.coachingPreferences as Record<string, unknown>).focusAreas =
          preferences.focusAreas;
      }
    }

    // Save back to database
    await db.query(
      `UPDATE user_profiles SET metadata = $1, "updatedAt" = NOW() WHERE "userId" = $2`,
      [JSON.stringify(profile.metadata), profile.userId]
    );

    return profile;
  }

  async getPersonalizedRecommendations(userId: string): Promise<string[]> {
    const profile = await this.createOrUpdateProfile(userId);
    const recommendations: string[] = [];

    // Based on completion rate
    if (profile.metadata.behaviorPatterns?.completionRate && profile.metadata.behaviorPatterns?.completionRate < 50) {
      recommendations.push('Break down your goals into smaller, more manageable tasks');
      recommendations.push('Start with just one small habit to build momentum');
    }

    // Based on consistency
    if (
      profile.metadata.behaviorPatterns?.consistencyScore &&
      profile.metadata.behaviorPatterns?.consistencyScore < 40
    ) {
      recommendations.push('Set a specific time each day for your coaching check-in');
      recommendations.push('Use reminders to maintain your momentum');
    }

    // Based on engagement
    if (
      profile.metadata.behaviorPatterns?.engagementLevel &&
      profile.metadata.behaviorPatterns?.engagementLevel < 30
    ) {
      recommendations.push('Try voice journaling for a more natural interaction');
      recommendations.push('Explore different coaching methods to find what resonates');
    }

    // Based on streak
    if (profile.metadata.progressMetrics?.currentStreak && profile.metadata.progressMetrics?.currentStreak > 7) {
      recommendations.push('Your streak is impressive! Consider increasing your goal difficulty');
      recommendations.push('Share your success to inspire others and reinforce your commitment');
    }

    // Based on preferred topics
    const preferredTopics = profile.metadata.behaviorPatterns?.preferredTopics as string[] | undefined;
    preferredTopics?.forEach((topic: string) => {
      switch (topic) {
        case 'productivity':
          recommendations.push('Try time-blocking technique for better task management');
          break;
        case 'wellbeing':
          recommendations.push('Incorporate 5-minute mindfulness breaks into your routine');
          break;
        case 'habits':
          recommendations.push('Stack new habits onto existing ones for easier adoption');
          break;
        case 'goals':
          recommendations.push('Review and adjust your goals monthly to stay aligned');
          break;
      }
    });

    // Limit to top 5 recommendations
    return recommendations.slice(0, 5);
  }

  async assessReadinessLevel(userId: string): Promise<{
    level: 'beginner' | 'intermediate' | 'advanced';
    reasoning: string;
    nextSteps: string[];
  }> {
    const profile = await this.createOrUpdateProfile(userId);

    // Calculate readiness score
    let score = 0;

    // Account age (max 20 points)
    score += Math.min((profile.metadata.progressMetrics?.accountAge || 0) / 5, 20);

    // Consistency (max 30 points)
    score += ((profile.metadata.behaviorPatterns?.consistencyScore || 0) / 100) * 30;

    // Completion rate (max 25 points)
    score += ((profile.metadata.behaviorPatterns?.completionRate || 0) / 100) * 25;

    // Engagement (max 15 points)
    score += ((profile.metadata.behaviorPatterns?.engagementLevel || 0) / 100) * 15;

    // Goals completed (max 10 points)
    const goalCompletionRate =
      (profile.metadata.progressMetrics?.totalGoalsSet || 0) > 0
        ? (profile.metadata.progressMetrics?.goalsCompleted || 0) /
          (profile.metadata.progressMetrics?.totalGoalsSet || 1)
        : 0;
    score += goalCompletionRate * 10;

    // Determine level
    let level: 'beginner' | 'intermediate' | 'advanced';
    let reasoning: string;
    let nextSteps: string[] = [];

    if (score < 30) {
      level = 'beginner';
      reasoning =
        "You're just getting started on your journey. Focus on building consistent habits.";
      nextSteps = [
        'Complete your first week streak',
        'Set one simple, achievable goal',
        'Explore different coaching methods',
        'Establish a daily check-in routine',
      ];
    } else if (score < 70) {
      level = 'intermediate';
      reasoning =
        "You've built a foundation. Now it's time to challenge yourself and deepen your practice.";
      nextSteps = [
        'Increase goal complexity',
        'Mentor or inspire others',
        'Track advanced metrics',
        'Develop expertise in focus areas',
      ];
    } else {
      level = 'advanced';
      reasoning = "You're a seasoned practitioner. Focus on optimization and helping others grow.";
      nextSteps = [
        'Set ambitious stretch goals',
        'Share your success strategies',
        'Become a community leader',
        'Master advanced techniques',
      ];
    }

    return { level, reasoning, nextSteps };
  }
}

export const userProfilingService = new UserProfilingService();
