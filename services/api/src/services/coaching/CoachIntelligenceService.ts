import { Op } from 'sequelize';
import CoachMemory from '../../models/coaching/CoachMemory';
import UserAnalytics from '../../models/analytics/UserAnalytics';
import KpiTracker from '../../models/analytics/KpiTracker';
import { aiService, AIMessage } from '../ai/AIService';
import { logger } from '../../utils/logger';
// import { Avatar } from '../../models/personality/Avatar';
// import { UserAvatarPreference } from '../../models/personality/UserAvatarPreference';

/**
 * Coach Intelligence Service
 * Orchestrates memory tracking, analytics processing, and intelligent coaching
 * to provide personalized and data-driven coaching experiences
 */

interface CoachingContext {
  userId: string;
  avatarId: string;
  sessionId: string;
  currentTopic: string;
  userMood: string;
  conversationHistory: string[];
  goals: string[];
}

interface MemoryInsight {
  type: 'pattern' | 'improvement' | 'concern' | 'achievement';
  title: string;
  description: string;
  relevanceScore: number;
  actionable: boolean;
  recommendations: string[];
}

interface CoachingRecommendation {
  type: 'approach' | 'topic' | 'technique' | 'schedule' | 'goal';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  implementation: string[];
}

interface WeeklyReport {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  summary: {
    totalSessions: number;
    avgSessionDuration: number;
    goalsProgress: number;
    engagementScore: number;
    moodTrend: string;
  };
  achievements: string[];
  challenges: string[];
  insights: MemoryInsight[];
  recommendations: CoachingRecommendation[];
  nextWeekFocus: string[];
}

export class CoachIntelligenceService {
  /**
   * Process and store a coaching conversation in memory
   */
  async processCoachingSession(
    context: CoachingContext,
    conversationContent: string,
    sessionDuration: number,
    userFeedback?: { rating: number; comments?: string }
  ): Promise<CoachMemory> {
    // Extract insights from conversation
    const insights = await this.extractConversationInsights(conversationContent, context);

    // Determine memory importance
    const importance = this.calculateMemoryImportance(insights, userFeedback);

    // Create memory record
    const memory = await CoachMemory.create({
      userId: context.userId,
      avatarId: context.avatarId,
      sessionId: context.sessionId,
      memoryType: 'conversation',
      content: conversationContent,
      summary: insights.summary,
      tags: insights.tags,
      emotionalContext: {
        mood: context.userMood,
        sentiment: insights.sentiment,
        emotionalTrends: insights.emotionalTrends,
      },
      coachingContext: {
        topic: context.currentTopic,
        category: insights.category,
        importance,
        actionItems: insights.actionItems,
        followUpNeeded: insights.followUpNeeded,
      },
      conversationDate: new Date(),
      importance,
      relevanceScore: 1.0, // New memories start with high relevance
    });

    // Update related memories
    await this.updateRelatedMemories(memory, context);

    // Process with AI for deeper insights
    await this.processMemoryWithAI(memory);

    // Update user analytics
    await this.updateUserAnalytics(context.userId, memory, sessionDuration, userFeedback);

    return memory;
  }

  /**
   * Retrieve relevant memories for current coaching context
   */
  async getRelevantMemories(
    userId: string,
    currentContext: {
      topics: string[];
      mood: string;
      recentGoals: string[];
    },
    limit: number = 10
  ): Promise<CoachMemory[]> {
    // Get all memories for user
    const allMemories = await CoachMemory.findAll({
      where: {
        userId,
        conversationDate: {
          [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      order: [['conversationDate', 'DESC']],
    });

    // Update relevance scores
    for (const memory of allMemories) {
      memory.updateRelevanceScore(currentContext);
      await memory.save();
    }

    // Return most relevant memories
    return allMemories
      .filter(memory => memory.isRelevant())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Generate intelligent coaching recommendations
   */
  async generateCoachingRecommendations(
    userId: string,
    _avatarId: string
  ): Promise<CoachingRecommendation[]> {
    const recommendations: CoachingRecommendation[] = [];

    // Get user analytics
    const analytics = await UserAnalytics.findOne({
      where: { userId },
      order: [['calculatedAt', 'DESC']],
    });

    // Get KPI/Goal data
    const activeGoals = await KpiTracker.findAll({
      where: {
        userId,
        status: ['in_progress', 'at_risk'],
      },
      order: [['priority', 'DESC']],
    });

    // Get recent memories
    const recentMemories = await CoachMemory.findAll({
      where: {
        userId,
        conversationDate: {
          [Op.gte]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 2 weeks
        },
      },
      order: [['conversationDate', 'DESC']],
      limit: 20,
    });

    // Get avatar information
    // const avatar = await Avatar.findByPk(avatarId);

    if (analytics) {
      // Engagement recommendations
      if (analytics.engagementMetrics.averageSessionDuration < 20) {
        recommendations.push({
          type: 'approach',
          priority: 'medium',
          title: 'Increase Session Engagement',
          description: 'User sessions are shorter than optimal for meaningful coaching',
          rationale: `Average session duration is ${analytics.engagementMetrics.averageSessionDuration} minutes, below the recommended 20-30 minutes`,
          expectedOutcome: 'Improved coaching depth and better goal achievement',
          implementation: [
            'Start sessions with a brief check-in to build rapport',
            "Use interactive techniques matching user's learning style",
            'Break complex topics into engaging segments',
            'End with clear action items and motivation',
          ],
        });
      }

      // Goal progress recommendations
      if (analytics.coachingMetrics.goalCompletionRate < 0.6) {
        recommendations.push({
          type: 'goal',
          priority: 'high',
          title: 'Improve Goal Achievement Strategy',
          description: 'User is struggling to complete set goals',
          rationale: `Goal completion rate is ${Math.round(analytics.coachingMetrics.goalCompletionRate * 100)}%, indicating need for better goal setting`,
          expectedOutcome: 'Higher success rate and improved user motivation',
          implementation: [
            'Break large goals into smaller, achievable milestones',
            'Set SMART criteria for all goals',
            'Increase check-in frequency for accountability',
            'Adjust goals based on user capacity and circumstances',
          ],
        });
      }

      // Avatar effectiveness recommendations
      if (analytics.coachingMetrics.avatarEffectivenessScore < 0.7) {
        recommendations.push({
          type: 'approach',
          priority: 'medium',
          title: 'Optimize Coaching Style',
          description: 'Current avatar approach may not be optimal for this user',
          rationale: `Avatar effectiveness score is ${Math.round(analytics.coachingMetrics.avatarEffectivenessScore * 100)}%`,
          expectedOutcome: 'Better user-coach compatibility and improved outcomes',
          implementation: [
            "Assess user's preferred communication style",
            'Consider switching to a different avatar personality',
            "Adapt current avatar's approach based on user feedback",
            'Experiment with different coaching techniques',
          ],
        });
      }
    }

    // Analyze goal-specific recommendations
    for (const goal of activeGoals) {
      if (goal.isAtRisk()) {
        recommendations.push({
          type: 'goal',
          priority: 'urgent',
          title: `Address At-Risk Goal: ${goal.title}`,
          description: 'Goal is behind schedule and needs immediate attention',
          rationale: 'Goal progress is significantly behind expected timeline',
          expectedOutcome: 'Get goal back on track and prevent failure',
          implementation: [
            'Conduct goal review session to identify blockers',
            'Adjust timeline or scope if necessary',
            'Increase coaching frequency for this specific goal',
            'Identify and address root causes of delays',
          ],
        });
      }

      const overdueActions = goal.getOverdueActionItems();
      if (overdueActions.length > 0) {
        recommendations.push({
          type: 'technique',
          priority: 'high',
          title: 'Address Overdue Action Items',
          description: `${overdueActions.length} action items are overdue`,
          rationale: 'Overdue actions indicate accountability or capacity issues',
          expectedOutcome: 'Improved follow-through and goal progress',
          implementation: [
            'Review overdue items and prioritize',
            'Identify barriers to completion',
            'Break down complex actions into smaller steps',
            'Adjust action item complexity and timeline',
          ],
        });
      }
    }

    // Memory pattern analysis
    const emotionalPatterns = this.analyzeEmotionalPatterns(recentMemories);
    if (emotionalPatterns.concerningTrends.length > 0) {
      recommendations.push({
        type: 'approach',
        priority: 'high',
        title: 'Address Emotional Patterns',
        description: 'Concerning emotional trends detected in recent sessions',
        rationale: `Patterns detected: ${emotionalPatterns.concerningTrends.join(', ')}`,
        expectedOutcome: 'Improved emotional well-being and coaching effectiveness',
        implementation: [
          'Focus on emotional awareness and regulation techniques',
          'Explore underlying causes of negative patterns',
          'Consider incorporating mindfulness or stress management',
          'Adjust coaching pace to reduce pressure',
        ],
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate comprehensive weekly report
   */
  async generateWeeklyReport(userId: string): Promise<WeeklyReport> {
    const weekEnd = new Date();
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get weekly analytics
    const analytics = await UserAnalytics.findOne({
      where: {
        userId,
        periodType: 'weekly',
        periodStart: {
          [Op.gte]: weekStart,
        },
      },
    });

    // Get weekly memories
    const weeklyMemories = await CoachMemory.findAll({
      where: {
        userId,
        conversationDate: {
          [Op.between]: [weekStart, weekEnd],
        },
      },
      order: [['conversationDate', 'ASC']],
    });

    // Get goal progress
    const goals = await KpiTracker.findAll({
      where: { userId },
    });

    const summary = {
      totalSessions: weeklyMemories.length,
      avgSessionDuration: analytics?.engagementMetrics.averageSessionDuration || 0,
      goalsProgress: this.calculateWeeklyGoalProgress(goals, weekStart, weekEnd),
      engagementScore: analytics?.engagementMetrics.participationScore || 0.5,
      moodTrend: this.calculateMoodTrend(weeklyMemories),
    };

    const achievements = this.extractAchievements(weeklyMemories, goals);
    const challenges = this.extractChallenges(weeklyMemories, goals);
    const insights = await this.generateWeeklyInsights(weeklyMemories, analytics);
    const recommendations = await this.generateCoachingRecommendations(
      userId,
      weeklyMemories[0]?.avatarId || ''
    );

    return {
      userId,
      weekStart,
      weekEnd,
      summary,
      achievements,
      challenges,
      insights,
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      nextWeekFocus: this.generateNextWeekFocus(insights, recommendations),
    };
  }

  /**
   * Calculate analytics for a user across different time periods
   */
  async calculateUserAnalytics(
    userId: string,
    periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  ): Promise<UserAnalytics> {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;

    switch (periodType) {
      case 'daily':
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarterly':
        periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get data for the period
    const memories = await CoachMemory.findAll({
      where: {
        userId,
        conversationDate: {
          [Op.between]: [periodStart, periodEnd],
        },
      },
    });

    const goals = await KpiTracker.findAll({
      where: {
        userId,
        startDate: {
          [Op.lte]: periodEnd,
        },
        endDate: {
          [Op.gte]: periodStart,
        },
      },
    });

    // Calculate engagement metrics
    const engagementMetrics = {
      totalSessions: memories.length,
      totalDuration: memories.reduce((sum, m) => sum + m.coachingContext.importance * 5, 0), // Estimate duration
      averageSessionDuration:
        memories.length > 0
          ? memories.reduce((sum, m) => sum + m.coachingContext.importance * 5, 0) / memories.length
          : 0,
      streakCount: this.calculateStreakCount(memories),
      missedSessions: 0, // TODO: Calculate based on scheduled vs actual
      responsiveness: this.calculateResponsiveness(memories),
      participationScore: this.calculateParticipationScore(memories),
      followThroughRate: this.calculateFollowThroughRate(goals),
    };

    // Calculate coaching metrics
    const completedGoals = goals.filter(g => g.status === 'completed');
    const coachingMetrics = {
      goalsSet: goals.length,
      goalsAchieved: completedGoals.length,
      goalCompletionRate: goals.length > 0 ? completedGoals.length / goals.length : 0,
      avatarId: memories[0]?.avatarId || '',
      avatarEffectivenessScore: this.calculateAvatarEffectiveness(memories),
      avatarSwitchCount: new Set(memories.map(m => m.avatarId)).size - 1,
      progressMetrics: {
        skillImprovement: this.calculateSkillImprovement(memories),
        confidenceIncrease: this.calculateConfidenceIncrease(memories),
        stressReduction: this.calculateStressReduction(memories),
        habitFormation: this.calculateHabitFormation(goals),
      },
    };

    // Calculate behavioral data
    const behavioralData = {
      preferredSessionTime: this.calculatePreferredTime(memories),
      preferredDuration: engagementMetrics.averageSessionDuration,
      communicationStyle: this.analyzeCommunicationStyle(memories),
      topicsOfInterest: this.extractTopicsOfInterest(memories),
      challengeAreas: this.extractChallengeAreas(memories),
      moodTrends: this.calculateMoodTrends(memories),
      learningPreferences: this.analyzeLearningPreferences(memories),
    };

    // Calculate KPI metrics
    const kpiMetrics = {
      userSatisfactionScore: this.calculateSatisfactionScore(memories),
      npsScore: 0, // TODO: Implement NPS tracking
      retentionProbability: this.calculateRetentionProbability(memories, goals),
      churnRisk: this.calculateChurnRisk(memories, goals),
      customKpis: [], // TODO: Implement custom KPIs
    };

    // Generate AI insights
    const aiInsights = {
      strengthAreas: this.identifyStrengthAreas(memories, goals),
      improvementAreas: this.identifyImprovementAreas(memories, goals),
      recommendedActions: (
        await this.generateCoachingRecommendations(userId, memories[0]?.avatarId || '')
      ).map(r => r.title),
      predictedOutcomes: this.predictOutcomes(memories, goals),
      riskFactors: this.identifyRiskFactors(memories, goals),
    };

    // Create or update analytics record
    const [analytics] = await UserAnalytics.upsert({
      userId,
      periodType,
      periodStart,
      periodEnd,
      engagementMetrics,
      coachingMetrics,
      behavioralData,
      kpiMetrics,
      benchmarkData: {
        userPercentile: 50, // TODO: Calculate against other users
        industryBenchmark: 0.6,
        personalBest: Math.max(coachingMetrics.goalCompletionRate, 0.5),
      },
      aiInsights,
      calculatedAt: new Date(),
      nextCalculationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      dataQualityScore: this.calculateDataQualityScore(memories, goals),
    });

    return analytics;
  }

  // Helper methods for calculations
  private async extractConversationInsights(content: string, context: CoachingContext) {
    try {
      // Use AI to extract comprehensive insights
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are an expert coaching conversation analyzer. Extract comprehensive insights from coaching conversations and return them as valid JSON.
          
Always include:
          - summary: A concise 2-3 sentence summary
          - tags: Array of relevant topic tags (5-10 tags max)
          - sentiment: Numerical score between -1 (very negative) and 1 (very positive)
          - emotionalTrends: Array of emotional states detected
          - category: Primary conversation category (goal-setting, problem-solving, motivation, reflection, skill-building, feedback)
          - actionItems: Array of specific action items mentioned
          - followUpNeeded: Boolean indicating if follow-up is required
          - keyInsights: Array of important insights or breakthroughs
          - challengesIdentified: Array of challenges or obstacles mentioned
          - progressIndicators: Array of signs of progress or improvement
          - coachingTechniques: Array of coaching techniques that would be most effective`
        },
        {
          role: 'user',
          content: `Context:
- User: ${context.userId}
- Avatar: ${context.avatarId}
- Current Topic: ${context.currentTopic}
- User Mood: ${context.userMood}
- Goals: ${context.goals.join(', ')}

Conversation Content:
${content}

Extract insights and return as JSON:`
        }
      ];

      const response = await aiService.generateResponse(messages, {
        temperature: 0.3,
        maxTokens: 1500,
        provider: 'openai'
      });

      const insights = JSON.parse(response.content);
      
      // Validate and provide fallbacks
      return {
        summary: insights.summary || content.substring(0, 200) + '...',
        tags: Array.isArray(insights.tags) ? insights.tags : [context.currentTopic].filter(Boolean),
        sentiment: typeof insights.sentiment === 'number' ? insights.sentiment : await this.analyzeSentiment(content),
        emotionalTrends: Array.isArray(insights.emotionalTrends) ? insights.emotionalTrends : [context.userMood],
        category: insights.category || 'general',
        actionItems: Array.isArray(insights.actionItems) ? insights.actionItems : this.extractActionItemsFallback(content),
        followUpNeeded: typeof insights.followUpNeeded === 'boolean' ? insights.followUpNeeded : 
          content.toLowerCase().includes('follow up') || content.toLowerCase().includes('next time'),
        keyInsights: Array.isArray(insights.keyInsights) ? insights.keyInsights : [],
        challengesIdentified: Array.isArray(insights.challengesIdentified) ? insights.challengesIdentified : [],
        progressIndicators: Array.isArray(insights.progressIndicators) ? insights.progressIndicators : [],
        coachingTechniques: Array.isArray(insights.coachingTechniques) ? insights.coachingTechniques : []
      };
    } catch (error) {
      logger.error('AI insight extraction failed, using fallback:', error);
      // Fallback to simpler extraction
      return {
        summary: content.substring(0, 200) + '...',
        tags: context.currentTopic ? [context.currentTopic] : [],
        sentiment: this.analyzeSentimentFallback(content),
        emotionalTrends: [context.userMood],
        category: 'general',
        actionItems: this.extractActionItemsFallback(content),
        followUpNeeded:
          content.toLowerCase().includes('follow up') || content.toLowerCase().includes('next time'),
        keyInsights: [],
        challengesIdentified: [],
        progressIndicators: [],
        coachingTechniques: []
      };
    }
  }

  private calculateMemoryImportance(insights: any, userFeedback?: any): number {
    let importance = 5; // Base importance

    if (userFeedback?.rating >= 8) importance += 2;
    if (insights.actionItems.length > 0) importance += 1;
    if (insights.followUpNeeded) importance += 1;
    if (Math.abs(insights.sentiment) > 0.7) importance += 1;

    return Math.min(10, importance);
  }

  private async updateRelatedMemories(
    memory: CoachMemory,
    context: CoachingContext
  ): Promise<void> {
    // Find related memories based on tags and topics
    const relatedMemories = await CoachMemory.findAll({
      where: {
        userId: context.userId,
        id: { [Op.ne as any]: memory.id },
        tags: { [Op.overlap]: memory.tags },
      },
      limit: 5,
    });

    memory.relatedMemoryIds = relatedMemories.map(m => m.id);
    await memory.save();
  }

  private async processMemoryWithAI(memory: CoachMemory): Promise<void> {
    try {
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are an advanced coaching memory analyst. Process this coaching session memory to extract deeper insights and patterns.
          
          Analyze and return JSON with:
          - deepInsights: Array of profound insights about the user's journey
          - behavioralPatterns: Array of behavioral patterns observed
          - growthIndicators: Array of signs indicating personal growth
          - potentialBlockers: Array of potential obstacles or limiting beliefs
          - coachingOpportunities: Array of opportunities for better coaching
          - connectionPoints: Array of topics/themes that connect to other sessions
          - emergingThemes: Array of new themes emerging in the user's development
          - personalityInsights: Observations about the user's personality and preferences
          - motivationalProfile: Assessment of what motivates this user
          - learningStyle: Observed learning preferences and styles`
        },
        {
          role: 'user',
          content: `Memory Content:
${memory.content}

Session Summary:
${memory.summary}

Emotional Context:
- Mood: ${memory.emotionalContext.mood}
- Sentiment: ${memory.emotionalContext.sentiment}

Coaching Context:
- Topic: ${memory.coachingContext.topic}
- Category: ${memory.coachingContext.category}
- Importance: ${memory.coachingContext.importance}
- Action Items: ${memory.coachingContext.actionItems?.join(', ') || 'None'}

Tags: ${memory.tags?.join(', ') || 'None'}

Provide deep AI analysis as JSON:`
        }
      ];

      const response = await aiService.generateResponse(messages, {
        temperature: 0.4,
        maxTokens: 2000,
        provider: 'openai'
      });

      const aiAnalysis = JSON.parse(response.content);
      
      // Generate comprehensive insights
      const insights = [
        ...(Array.isArray(aiAnalysis.deepInsights) ? aiAnalysis.deepInsights : []),
        ...(Array.isArray(aiAnalysis.behavioralPatterns) ? aiAnalysis.behavioralPatterns.map(p => `Pattern: ${p}`) : []),
        ...(Array.isArray(aiAnalysis.growthIndicators) ? aiAnalysis.growthIndicators.map(g => `Growth: ${g}`) : []),
        ...(Array.isArray(aiAnalysis.coachingOpportunities) ? aiAnalysis.coachingOpportunities.map(o => `Opportunity: ${o}`) : [])
      ];

      // Update memory with AI insights
      memory.aiProcessed = true;
      memory.insightsGenerated = insights.slice(0, 15); // Limit to top 15 insights
      
      // Store additional AI analysis data in the JSONB field
      // TypeScript doesn't know about the extra fields, but JSONB allows them
      const updatedCoachingContext: any = {
        ...memory.coachingContext,
        aiAnalysis: {
          potentialBlockers: aiAnalysis.potentialBlockers || [],
          connectionPoints: aiAnalysis.connectionPoints || [],
          emergingThemes: aiAnalysis.emergingThemes || [],
          personalityInsights: aiAnalysis.personalityInsights || [],
          motivationalProfile: aiAnalysis.motivationalProfile || [],
          learningStyle: aiAnalysis.learningStyle || 'adaptive',
          analysisDate: new Date()
        }
      };
      
      memory.coachingContext = updatedCoachingContext;

      await memory.save();
      
      logger.info(`AI processing completed for memory ${memory.id}: ${insights.length} insights generated`);
    } catch (error) {
      logger.error('AI memory processing failed, using basic processing:', error);
      
      // Fallback processing
      memory.aiProcessed = true;
      memory.insightsGenerated = [
        'Memory processed and categorized',
        'Emotional context analyzed',
        'Related patterns identified',
        `Session importance: ${memory.importance}/10`,
        `Emotional tone: ${memory.emotionalContext.mood}`,
        `Topic focus: ${memory.coachingContext.topic}`
      ];
      
      await memory.save();
    }
  }

  private async updateUserAnalytics(
    userId: string,
    _memory: CoachMemory,
    _sessionDuration: number,
    _userFeedback?: any
  ): Promise<void> {
    // This will trigger recalculation of analytics
    await this.calculateUserAnalytics(userId, 'daily');
    await this.calculateUserAnalytics(userId, 'weekly');
  }

  private async analyzeSentiment(text: string): Promise<number> {
    try {
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are an expert emotional intelligence analyst specializing in coaching conversations. 
          Analyze the emotional sentiment and return a JSON response with:
          - overall_sentiment: A number between -1 (very negative) and 1 (very positive)
          - confidence: A number between 0 and 1 indicating confidence in the analysis
          - emotional_indicators: Array of specific emotional cues detected
          - intensity: Number between 0 and 1 indicating emotional intensity
          - dominant_emotions: Array of primary emotions (max 3)`
        },
        {
          role: 'user',
          content: `Analyze the sentiment of this coaching conversation text:\n\n"${text}"\n\nReturn analysis as JSON:`
        }
      ];

      const response = await aiService.generateResponse(messages, {
        temperature: 0.2,
        maxTokens: 800,
        provider: 'openai'
      });

      const analysis = JSON.parse(response.content);
      return typeof analysis.overall_sentiment === 'number' ? analysis.overall_sentiment : 0;
    } catch (error) {
      logger.error('AI sentiment analysis failed, using fallback:', error);
      return this.analyzeSentimentFallback(text);
    }
  }

  private analyzeSentimentFallback(text: string): number {
    // Fallback sentiment analysis using keyword matching
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'progress', 'excited', 'confident', 'accomplished', 'successful'];
    const negativeWords = ['bad', 'terrible', 'frustrated', 'stuck', 'difficult', 'problem', 'worried', 'anxious', 'overwhelmed', 'disappointed'];

    const words = text.toLowerCase().split(/\s+/);
    const positive = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
    const negative = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;

    if (positive + negative === 0) return 0;
    return (positive - negative) / (positive + negative);
  }

  private extractActionItemsFallback(content: string): string[] {
    // Fallback extraction using pattern matching
    const sentences = content.split(/[.!?]/);
    return sentences
      .filter(
        sentence =>
          sentence.toLowerCase().includes('will') ||
          sentence.toLowerCase().includes('should') ||
          sentence.toLowerCase().includes('action') ||
          sentence.toLowerCase().includes('next') ||
          sentence.toLowerCase().includes('plan to') ||
          sentence.toLowerCase().includes('going to') ||
          sentence.toLowerCase().includes('commit to') ||
          sentence.toLowerCase().includes('by tomorrow') ||
          sentence.toLowerCase().includes('by next week')
      )
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 10);
  }

  // Additional helper methods would be implemented here...
  private calculateStreakCount(memories: CoachMemory[]): number {
    if (memories.length === 0) return 0;
    
    // Sort memories by date (most recent first)
    const sortedMemories = memories.sort((a, b) => 
      new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime()
    );
    
    let currentStreak = 0;
    let lastDate: Date | null = null;
    
    for (const memory of sortedMemories) {
      const memoryDate = new Date(memory.conversationDate);
      memoryDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (lastDate === null) {
        // First memory
        currentStreak = 1;
        lastDate = memoryDate;
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - memoryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++;
          lastDate = memoryDate;
        } else if (daysDiff === 0) {
          // Same day, continue streak but don't increment
          continue;
        } else {
          // Gap in streak, stop counting
          break;
        }
      }
    }
    
    // Check if the streak is current (includes today or yesterday)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const mostRecentDate = new Date(sortedMemories[0].conversationDate);
    mostRecentDate.setHours(0, 0, 0, 0);
    
    if (mostRecentDate.getTime() < yesterday.getTime()) {
      // Streak is broken (no activity yesterday or today)
      return 0;
    }
    
    return currentStreak;
  }

  private calculateResponsiveness(memories: CoachMemory[]): number {
    if (memories.length === 0) return 0.5;
    
    let totalResponseScore = 0;
    let validMemories = 0;
    
    for (const memory of memories) {
      let responseScore = 0.5; // Base score
      
      // Factor 1: Follow-through on action items (40% weight)
      const actionItems = memory.coachingContext.actionItems || [];
      if (actionItems.length > 0) {
        // Check if follow-up was needed and provided
        if (memory.coachingContext.followUpNeeded) {
          responseScore += 0.2; // Bonus for engaging with follow-up
        }
        responseScore += Math.min(0.2, actionItems.length * 0.05); // Bonus for having action items
      }
      
      // Factor 2: Session engagement based on importance score (30% weight)
      const importanceNormalized = memory.importance / 10; // Convert to 0-1 scale
      responseScore += importanceNormalized * 0.3;
      
      // Factor 3: Emotional engagement (20% weight)
      const sentiment = Math.abs(memory.emotionalContext.sentiment || 0);
      responseScore += sentiment * 0.2; // Higher absolute sentiment = more engaged
      
      // Factor 4: Content quality based on session length and insights (10% weight)
      const contentLength = memory.content?.length || 0;
      const insightsCount = memory.insightsGenerated?.length || 0;
      if (contentLength > 500) responseScore += 0.05; // Substantial conversation
      if (insightsCount > 3) responseScore += 0.05; // Rich insights
      
      // Cap the score at 1.0
      responseScore = Math.min(1.0, responseScore);
      
      totalResponseScore += responseScore;
      validMemories++;
    }
    
    const averageResponsiveness = validMemories > 0 ? totalResponseScore / validMemories : 0.5;
    
    // Apply recency weighting (more recent sessions have higher impact)
    const sortedMemories = memories.sort((a, b) => 
      new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime()
    );
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < Math.min(sortedMemories.length, 10); i++) {
      const weight = Math.pow(0.9, i); // Exponential decay for older sessions
      const memoryScore = Math.min(1.0, sortedMemories[i].importance / 10 + 0.3);
      weightedScore += memoryScore * weight;
      totalWeight += weight;
    }
    
    const recentResponsiveness = totalWeight > 0 ? weightedScore / totalWeight : averageResponsiveness;
    
    // Combine average and recent scores (70% recent, 30% overall average)
    return Math.round((recentResponsiveness * 0.7 + averageResponsiveness * 0.3) * 100) / 100;
  }

  private calculateParticipationScore(memories: CoachMemory[]): number {
    if (memories.length === 0) return 0.0;
    
    let totalParticipationScore = 0;
    let validMemories = 0;
    
    for (const memory of memories) {
      let participationScore = 0;
      
      // Factor 1: Session frequency and consistency (25% weight)
      const daysSinceSession = Math.floor(
        (Date.now() - new Date(memory.conversationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceSession <= 7) {
        participationScore += 0.25; // Recent session
      } else if (daysSinceSession <= 14) {
        participationScore += 0.15; // Moderately recent
      } else if (daysSinceSession <= 30) {
        participationScore += 0.05; // Older but within a month
      }
      
      // Factor 2: Content depth and engagement (35% weight)
      const contentLength = memory.content?.length || 0;
      if (contentLength > 1000) {
        participationScore += 0.35; // Deep conversation
      } else if (contentLength > 500) {
        participationScore += 0.25; // Moderate conversation
      } else if (contentLength > 200) {
        participationScore += 0.15; // Basic conversation
      } else {
        participationScore += 0.05; // Minimal conversation
      }
      
      // Factor 3: Action item completion and follow-through (25% weight)
      const actionItems = memory.coachingContext.actionItems || [];
      if (actionItems.length > 0) {
        participationScore += 0.15; // Has action items
        if (memory.coachingContext.followUpNeeded) {
          participationScore += 0.10; // Committed to follow-up
        }
      }
      
      // Factor 4: Emotional engagement and authenticity (15% weight)
      const sentimentStrength = Math.abs(memory.emotionalContext.sentiment || 0);
      participationScore += sentimentStrength * 0.15;
      
      // Factor 5: Session importance and value (bonus points)
      if (memory.importance >= 8) {
        participationScore += 0.05; // High importance session bonus
      }
      
      // Factor 6: AI insights and breakthroughs (bonus points)
      const insightsCount = memory.insightsGenerated?.length || 0;
      if (insightsCount >= 5) {
        participationScore += 0.03; // Rich insights bonus
      }
      
      // Cap individual session score at 1.0
      participationScore = Math.min(1.0, participationScore);
      
      totalParticipationScore += participationScore;
      validMemories++;
    }
    
    // Calculate base average participation
    const baseScore = validMemories > 0 ? totalParticipationScore / validMemories : 0;
    
    // Apply consistency bonus/penalty based on session frequency
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const recentSessions = memories.filter(m => 
      new Date(m.conversationDate).getTime() >= thirtyDaysAgo
    ).length;
    
    let consistencyMultiplier = 1.0;
    if (recentSessions >= 12) { // 3+ sessions per week
      consistencyMultiplier = 1.15;
    } else if (recentSessions >= 8) { // 2 sessions per week
      consistencyMultiplier = 1.10;
    } else if (recentSessions >= 4) { // 1 session per week
      consistencyMultiplier = 1.05;
    } else if (recentSessions >= 2) { // Bi-weekly
      consistencyMultiplier = 1.0;
    } else if (recentSessions >= 1) { // Monthly
      consistencyMultiplier = 0.9;
    } else { // Less than monthly
      consistencyMultiplier = 0.7;
    }
    
    // Apply streak bonus
    const streakCount = this.calculateStreakCount(memories);
    let streakBonus = 0;
    if (streakCount >= 7) {
      streakBonus = 0.1; // Weekly streak bonus
    } else if (streakCount >= 3) {
      streakBonus = 0.05; // Short streak bonus
    }
    
    const finalScore = Math.min(1.0, (baseScore * consistencyMultiplier) + streakBonus);
    return Math.round(finalScore * 100) / 100;
  }

  private calculateFollowThroughRate(goals: KpiTracker[]): number {
    if (goals.length === 0) return 0.5;
    const completedActions = goals.reduce(
      (sum, goal) =>
        sum + goal.coachingData.actionItems.filter(item => item.status === 'completed').length,
      0
    );
    const totalActions = goals.reduce((sum, goal) => sum + goal.coachingData.actionItems.length, 0);
    return totalActions > 0 ? completedActions / totalActions : 0.5;
  }

  private calculateAvatarEffectiveness(_memories: CoachMemory[]): number {
    // TODO: Implement avatar effectiveness calculation
    return 0.7;
  }

  private calculateSkillImprovement(_memories: CoachMemory[]): number {
    // TODO: Implement skill improvement tracking
    return 0.6;
  }

  private calculateConfidenceIncrease(_memories: CoachMemory[]): number {
    // TODO: Implement confidence tracking
    return 0.7;
  }

  private calculateStressReduction(_memories: CoachMemory[]): number {
    // TODO: Implement stress level tracking
    return 0.5;
  }

  private calculateHabitFormation(_goals: KpiTracker[]): number {
    // TODO: Implement habit formation tracking
    return 0.6;
  }

  private calculatePreferredTime(_memories: CoachMemory[]): string {
    // TODO: Analyze session times
    return 'morning';
  }

  private analyzeCommunicationStyle(_memories: CoachMemory[]): string {
    // TODO: Analyze communication patterns
    return 'supportive';
  }

  private extractTopicsOfInterest(_memories: CoachMemory[]): string[] {
    // TODO: Extract and rank topics
    return ['goal-setting', 'productivity', 'wellness'];
  }

  private extractChallengeAreas(_memories: CoachMemory[]): string[] {
    // TODO: Identify challenge patterns
    return ['time-management', 'consistency'];
  }

  private calculateMoodTrends(memories: CoachMemory[]): any[] {
    return memories.map(m => ({
      date: m.conversationDate.toISOString().split('T')[0],
      mood: m.emotionalContext.mood,
      sentiment: m.emotionalContext.sentiment,
    }));
  }

  private analyzeLearningPreferences(_memories: CoachMemory[]): any {
    // TODO: Analyze learning style preferences
    return {
      visualLearner: 0.4,
      auditoryLearner: 0.4,
      kinestheticLearner: 0.2,
    };
  }

  private calculateSatisfactionScore(_memories: CoachMemory[]): number {
    // TODO: Calculate satisfaction from feedback
    return 7.5;
  }

  private calculateRetentionProbability(_memories: CoachMemory[], _goals: KpiTracker[]): number {
    // TODO: Implement retention probability model
    return 0.8;
  }

  private calculateChurnRisk(_memories: CoachMemory[], _goals: KpiTracker[]): number {
    // TODO: Implement churn risk calculation
    return 0.2;
  }

  private identifyStrengthAreas(_memories: CoachMemory[], _goals: KpiTracker[]): string[] {
    // TODO: Identify user strengths
    return ['goal-setting', 'communication'];
  }

  private identifyImprovementAreas(_memories: CoachMemory[], _goals: KpiTracker[]): string[] {
    // TODO: Identify improvement areas
    return ['consistency', 'follow-through'];
  }

  private predictOutcomes(_memories: CoachMemory[], _goals: KpiTracker[]): string[] {
    // TODO: Predict likely outcomes
    return ['Likely to achieve primary goal', 'May need additional support for consistency'];
  }

  private identifyRiskFactors(_memories: CoachMemory[], _goals: KpiTracker[]): string[] {
    // TODO: Identify risk factors
    return ['Low engagement', 'Overambitious goals'];
  }

  private calculateDataQualityScore(_memories: CoachMemory[], _goals: KpiTracker[]): number {
    // TODO: Calculate data quality
    return 0.8;
  }

  private analyzeEmotionalPatterns(_memories: CoachMemory[]): any {
    // TODO: Analyze emotional patterns
    return {
      concerningTrends: [],
      positiveTrends: ['increased confidence'],
    };
  }

  private calculateWeeklyGoalProgress(
    _goals: KpiTracker[],
    _weekStart: Date,
    _weekEnd: Date
  ): number {
    // TODO: Calculate weekly progress
    return 0.7;
  }

  private calculateMoodTrend(_memories: CoachMemory[]): string {
    // TODO: Calculate mood trend
    return 'improving';
  }

  private extractAchievements(_memories: CoachMemory[], _goals: KpiTracker[]): string[] {
    // TODO: Extract achievements
    return ['Completed daily meditation goal', 'Improved time management'];
  }

  private extractChallenges(_memories: CoachMemory[], _goals: KpiTracker[]): string[] {
    // TODO: Extract challenges
    return ['Maintaining consistency', 'Balancing multiple priorities'];
  }

  private async generateWeeklyInsights(
    _memories: CoachMemory[],
    _analytics: UserAnalytics | null
  ): Promise<MemoryInsight[]> {
    // TODO: Generate insights
    return [
      {
        type: 'improvement',
        title: 'Increased Session Engagement',
        description: 'User participation has improved over the week',
        relevanceScore: 0.8,
        actionable: true,
        recommendations: ['Continue current approach', 'Consider increasing session frequency'],
      },
    ];
  }

  private generateNextWeekFocus(
    _insights: MemoryInsight[],
    _recommendations: CoachingRecommendation[]
  ): string[] {
    // TODO: Generate focus areas
    return [
      'Maintain current progress',
      'Address consistency challenges',
      'Explore new goal areas',
    ];
  }
}

export default CoachIntelligenceService;
