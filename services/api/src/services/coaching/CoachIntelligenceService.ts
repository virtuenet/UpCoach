import { Op } from 'sequelize';

import KpiTracker from '../../models/analytics/KpiTracker';
import UserAnalytics from '../../models/analytics/UserAnalytics';
import CoachMemory from '../../models/coaching/CoachMemory';
import { logger } from '../../utils/logger';
import { aiService, AIMessage } from '../ai/AIService';
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

type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface ProgressReport {
  userId: string;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  summary: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    overallCompletionRate: number;
    averageProgress: number;
  };
  goalAnalysis: {
    topPerformingGoals: Array<{
      id: string;
      title: string;
      progress: number;
      category: string;
    }>;
    strugglingGoals: Array<{
      id: string;
      title: string;
      progress: number;
      riskFactors: string[];
    }>;
  };
  trends: {
    progressTrend: 'improving' | 'declining' | 'stable';
    engagementTrend: 'improving' | 'declining' | 'stable';
    velocityTrend: 'improving' | 'declining' | 'stable';
  };
  recommendations: string[];
  achievements: string[];
  nextPeriodFocus: string[];
}

interface CoachingEffectivenessReport {
  coachId: string;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  overview: {
    totalClients: number;
    totalSessions: number;
    averageSessionDuration: number;
    clientRetentionRate: number;
  };
  performanceMetrics: {
    averageClientSatisfaction: number;
    goalCompletionRate: number;
    clientEngagementScore: number;
    improvementRate: number;
  };
  clientInsights: {
    topPerformingClients: Array<{
      userId: string;
      improvementScore: number;
      goalCompletionRate: number;
    }>;
    atRiskClients: Array<{
      userId: string;
      riskFactors: string[];
      churnProbability: number;
    }>;
  };
  recommendations: string[];
  strengths: string[];
  improvementAreas: string[];
}

interface GoalCompletionPattern {
  userId: string;
  patterns: {
    preferredGoalTypes: string[];
    averageCompletionTime: number;
    mostSuccessfulCategories: string[];
    commonFailureReasons: string[];
    optimalGoalCount: number;
    seasonalTrends: Array<{
      period: string;
      completionRate: number;
    }>;
  };
  behaviors: {
    procrastinationTendency: number;
    consistencyScore: number;
    motivationDrivers: string[];
    challengePreference: 'easy' | 'moderate' | 'challenging';
  };
  recommendations: {
    goalSetting: string[];
    timing: string[];
    support: string[];
  };
}

interface BenchmarkAnalysis {
  userId: string;
  peerGroup: string;
  metrics: {
    goalCompletionRate: {
      userValue: number;
      peerAverage: number;
      percentile: number;
      ranking: 'top' | 'above_average' | 'average' | 'below_average' | 'bottom';
    };
    engagementScore: {
      userValue: number;
      peerAverage: number;
      percentile: number;
      ranking: 'top' | 'above_average' | 'average' | 'below_average' | 'bottom';
    };
    progressVelocity: {
      userValue: number;
      peerAverage: number;
      percentile: number;
      ranking: 'top' | 'above_average' | 'average' | 'below_average' | 'bottom';
    };
  };
  insights: {
    strengths: string[];
    improvementOpportunities: string[];
    peerComparisonInsights: string[];
  };
  recommendations: string[];
}

interface CustomKPIRequest {
  name: string;
  description: string;
  category: string;
  type: 'numeric' | 'percentage' | 'boolean' | 'enum';
  unit?: string;
  target?: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  calculationMethod: 'manual' | 'automatic' | 'hybrid';
  formula?: string;
  validationRules?: {
    minValue?: number;
    maxValue?: number;
    allowedValues?: string[];
  };
}

interface UpdateKPIRequest {
  name?: string;
  description?: string;
  target?: number;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  calculationMethod?: 'manual' | 'automatic' | 'hybrid';
  formula?: string;
  isActive?: boolean;
}

interface PersonalizedInsights {
  userId: string;
  insights: {
    strengthAreas: Array<{
      area: string;
      score: number;
      description: string;
      supportingEvidence: string[];
    }>;
    improvementAreas: Array<{
      area: string;
      currentScore: number;
      targetScore: number;
      priority: 'high' | 'medium' | 'low';
      recommendations: string[];
    }>;
    behavioralPatterns: Array<{
      pattern: string;
      frequency: number;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
    progressTrends: Array<{
      metric: string;
      trend: 'improving' | 'declining' | 'stable';
      rate: number;
      timeframe: string;
    }>;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  predictiveInsights: {
    futurePerformance: string;
    riskFactors: string[];
    opportunities: string[];
  };
  generatedAt: Date;
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
    const periodEnd: Date = now;

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
      missedSessions: await this.calculateMissedSessions(userId, memories),
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
      npsScore: this.calculateNPSScore(memories, goals),
      retentionProbability: this.calculateRetentionProbability(memories, goals),
      churnRisk: this.calculateChurnRisk(memories, goals),
      customKpis: this.calculateCustomKPIs(userId, memories, goals),
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
        userPercentile: await this.calculateUserPercentile(userId, coachingMetrics),
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

  private calculateMemoryImportance(insights: unknown, userFeedback?: unknown): number {
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
        id: { [Op.ne as unknown]: memory.id },
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
      const updatedCoachingContext: unknown = {
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
    _userFeedback?: unknown
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

  private async calculateMissedSessions(userId: string, memories: CoachMemory[]): Promise<number> {
    // Calculate missed sessions based on expected coaching frequency
    // This implementation uses heuristics since we don't have explicit scheduling data

    if (memories.length === 0) return 0;

    // Sort memories by creation date
    const sortedMemories = memories.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const firstSession = sortedMemories[0];
    const lastSession = sortedMemories[sortedMemories.length - 1];

    const totalDays = Math.ceil(
      (new Date(lastSession.createdAt).getTime() - new Date(firstSession.createdAt).getTime())
      / (1000 * 60 * 60 * 24)
    );

    // Assume expected frequency: 2-3 sessions per week for active users
    const expectedSessionsPerWeek = 2.5;
    const weeksActive = Math.max(1, totalDays / 7);
    const expectedSessions = Math.floor(weeksActive * expectedSessionsPerWeek);

    // Calculate missed sessions, but cap at a reasonable maximum
    const missedSessions = Math.max(0, expectedSessions - memories.length);

    // Don't count as missed if user is new (less than 2 weeks)
    if (totalDays < 14) return 0;

    // Cap missed sessions at 50% of expected to avoid unrealistic numbers
    return Math.min(missedSessions, Math.floor(expectedSessions * 0.5));
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

  private calculateAvatarEffectiveness(memories: CoachMemory[]): number {
    if (memories.length === 0) return 0.7;
    
    // Calculate effectiveness based on user engagement and feedback
    let totalEffectiveness = 0;
    let validSessionsCount = 0;
    
    for (const memory of memories) {
      // Factor 1: Session duration and engagement (30%)
      const engagement = memory.importance / 10;
      
      // Factor 2: Sentiment analysis (40%)
      const sentiment = memory.emotionalContext.sentiment || 0;
      const sentimentScore = (sentiment + 1) / 2; // Convert -1,1 to 0,1
      
      // Factor 3: Follow-up engagement (20%)
      const followUpScore = memory.coachingContext.followUpNeeded ? 0.8 : 0.6;
      
      // Factor 4: Action items completion indication (10%)
      const actionItemsScore = memory.coachingContext.actionItems?.length > 0 ? 0.8 : 0.5;
      
      const sessionEffectiveness = 
        engagement * 0.3 + 
        sentimentScore * 0.4 + 
        followUpScore * 0.2 + 
        actionItemsScore * 0.1;
      
      totalEffectiveness += Math.max(0, Math.min(1, sessionEffectiveness));
      validSessionsCount++;
    }
    
    const averageEffectiveness = validSessionsCount > 0 ? totalEffectiveness / validSessionsCount : 0.7;
    
    // Apply recency weighting (recent sessions are more indicative)
    const recentMemories = memories
      .sort((a, b) => new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime())
      .slice(0, 5);
    
    if (recentMemories.length > 0) {
      let recentEffectiveness = 0;
      let totalWeight = 0;
      
      for (let i = 0; i < recentMemories.length; i++) {
        const weight = Math.pow(0.8, i);
        const memory = recentMemories[i];
        const sentiment = (memory.emotionalContext.sentiment || 0 + 1) / 2;
        const engagement = memory.importance / 10;
        const sessionScore = sentiment * 0.6 + engagement * 0.4;
        
        recentEffectiveness += sessionScore * weight;
        totalWeight += weight;
      }
      
      const recentAverage = totalWeight > 0 ? recentEffectiveness / totalWeight : averageEffectiveness;
      
      // Blend overall average (40%) with recent performance (60%)
      return Math.round((averageEffectiveness * 0.4 + recentAverage * 0.6) * 100) / 100;
    }
    
    return Math.round(averageEffectiveness * 100) / 100;
  }

  private calculateSkillImprovement(memories: CoachMemory[]): number {
    if (memories.length === 0) return 0.5;
    
    // Analyze skill-related conversations and progress
    const skillKeywords = ['skill', 'learn', 'improve', 'practice', 'master', 'develop', 'progress', 'better at'];
    const skillMemories = memories.filter(memory => {
      const content = (memory.content + ' ' + memory.summary).toLowerCase();
      return skillKeywords.some(keyword => content.includes(keyword));
    });
    
    if (skillMemories.length === 0) return 0.5;
    
    // Sort by date to analyze progression
    const sortedSkillMemories = skillMemories.sort(
      (a, b) => new Date(a.conversationDate).getTime() - new Date(b.conversationDate).getTime()
    );
    
    let improvementScore = 0.5; // Base score
    let totalWeightedProgress = 0;
    let totalWeight = 0;
    
    // Analyze sentiment progression in skill-related conversations
    for (let i = 0; i < sortedSkillMemories.length; i++) {
      const memory = sortedSkillMemories[i];
      const sentiment = memory.emotionalContext.sentiment || 0;
      const importance = memory.importance / 10;
      
      // Weight recent memories more heavily
      const recencyWeight = Math.exp(-i * 0.1);
      const weight = importance * recencyWeight;
      
      // Positive sentiment in skill contexts indicates improvement
      const progressIndicator = Math.max(0, sentiment + 0.3); // Shift baseline up slightly
      
      totalWeightedProgress += progressIndicator * weight;
      totalWeight += weight;
    }
    
    if (totalWeight > 0) {
      improvementScore = totalWeightedProgress / totalWeight;
    }
    
    // Check for explicit improvement mentions in insights
    const improvementInsights = memories.filter(memory => {
      const insights = memory.insightsGenerated || [];
      return insights.some(insight => 
        insight.toLowerCase().includes('improvement') ||
        insight.toLowerCase().includes('progress') ||
        insight.toLowerCase().includes('developed') ||
        insight.toLowerCase().includes('mastered')
      );
    }).length;
    
    // Bonus for explicit improvement mentions
    if (improvementInsights > 0) {
      improvementScore += (improvementInsights / memories.length) * 0.3;
    }
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, improvementScore));
  }

  private calculateConfidenceIncrease(memories: CoachMemory[]): number {
    if (memories.length === 0) return 0.5;
    
    const confidenceKeywords = ['confident', 'sure', 'certain', 'believe', 'capable', 'able to', 'can do', 'trust myself'];
    const doubtKeywords = ['doubt', 'unsure', 'uncertain', 'scared', 'worried', 'anxious', 'can\'t do'];
    
    // Sort memories by date
    const sortedMemories = memories.sort(
      (a, b) => new Date(a.conversationDate).getTime() - new Date(b.conversationDate).getTime()
    );
    
    let totalConfidenceChange = 0;
    let confidenceDataPoints = 0;
    
    // Analyze confidence indicators in conversation content
    for (let i = 0; i < sortedMemories.length; i++) {
      const memory = sortedMemories[i];
      const content = (memory.content + ' ' + memory.summary).toLowerCase();
      
      // Count confidence vs doubt indicators
      const confidenceCount = confidenceKeywords.filter(keyword => content.includes(keyword)).length;
      const doubtCount = doubtKeywords.filter(keyword => content.includes(keyword)).length;
      
      if (confidenceCount > 0 || doubtCount > 0) {
        const confidenceRatio = confidenceCount / (confidenceCount + doubtCount);
        const recencyWeight = Math.exp(-((memories.length - i - 1) * 0.1)); // More recent = higher weight
        
        totalConfidenceChange += (confidenceRatio - 0.5) * recencyWeight; // -0.5 to 0.5 scale
        confidenceDataPoints += recencyWeight;
      }
    }
    
    // Analyze confidence-related AI insights
    const confidenceInsights = memories.filter(memory => {
      const insights = memory.insightsGenerated || [];
      return insights.some(insight => {
        const lowercaseInsight = insight.toLowerCase();
        return lowercaseInsight.includes('confidence') || 
               lowercaseInsight.includes('self-esteem') ||
               lowercaseInsight.includes('belief in');
      });
    });
    
    // Calculate average confidence trend
    let confidenceScore = 0.5; // Neutral baseline
    
    if (confidenceDataPoints > 0) {
      const averageConfidenceChange = totalConfidenceChange / confidenceDataPoints;
      confidenceScore = 0.5 + averageConfidenceChange; // Convert to 0-1 scale
    }
    
    // Bonus for goal achievements (builds confidence)
    const achievementInsights = memories.filter(memory => {
      const insights = memory.insightsGenerated || [];
      return insights.some(insight => 
        insight.toLowerCase().includes('achievement') ||
        insight.toLowerCase().includes('accomplished') ||
        insight.toLowerCase().includes('succeeded')
      );
    }).length;
    
    if (achievementInsights > 0) {
      confidenceScore += (achievementInsights / memories.length) * 0.2;
    }
    
    // Factor in overall sentiment trend (positive sentiment often indicates confidence)
    const averageSentiment = memories.reduce(
      (sum, memory) => sum + (memory.emotionalContext.sentiment || 0), 0
    ) / memories.length;
    
    if (averageSentiment > 0) {
      confidenceScore += averageSentiment * 0.15;
    }
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, confidenceScore));
  }

  private calculateStressReduction(memories: CoachMemory[]): number {
    if (memories.length === 0) return 0.5;
    
    const stressKeywords = ['stress', 'pressure', 'overwhelmed', 'anxious', 'worried', 'tense', 'burden', 'hectic'];
    const relaxationKeywords = ['calm', 'peaceful', 'relaxed', 'balanced', 'centered', 'tranquil', 'ease', 'relief'];
    
    // Sort memories by date
    const sortedMemories = memories.sort(
      (a, b) => new Date(a.conversationDate).getTime() - new Date(b.conversationDate).getTime()
    );
    
    // Split into early and recent periods to measure change
    const midPoint = Math.floor(sortedMemories.length / 2);
    const earlyMemories = sortedMemories.slice(0, midPoint);
    const recentMemories = sortedMemories.slice(midPoint);
    
    const calculateStressLevel = (memorySet: CoachMemory[]) => {
      let stressIndicators = 0;
      let relaxationIndicators = 0;
      let totalSentiment = 0;
      
      for (const memory of memorySet) {
        const content = (memory.content + ' ' + memory.summary).toLowerCase();
        
        // Count stress vs relaxation indicators
        stressIndicators += stressKeywords.filter(keyword => content.includes(keyword)).length;
        relaxationIndicators += relaxationKeywords.filter(keyword => content.includes(keyword)).length;
        
        // Factor in sentiment (negative sentiment may indicate stress)
        totalSentiment += memory.emotionalContext.sentiment || 0;
      }
      
      const averageSentiment = memorySet.length > 0 ? totalSentiment / memorySet.length : 0;
      
      // Calculate stress level (higher values = more stress)
      const keywordStressRatio = (stressIndicators + 1) / (relaxationIndicators + stressIndicators + 2);
      const sentimentStress = Math.max(0, -averageSentiment); // Negative sentiment contributes to stress
      
      return (keywordStressRatio * 0.7) + (sentimentStress * 0.3);
    };
    
    const earlyStressLevel = earlyMemories.length > 0 ? calculateStressLevel(earlyMemories) : 0.5;
    const recentStressLevel = recentMemories.length > 0 ? calculateStressLevel(recentMemories) : earlyStressLevel;
    
    // Calculate reduction (positive value means stress decreased)
    const stressReduction = earlyStressLevel - recentStressLevel;
    
    // Convert to 0-1 scale where 1 = significant stress reduction, 0.5 = no change, 0 = stress increase
    let reductionScore = 0.5 + (stressReduction * 0.5);
    
    // Check for explicit stress management insights
    const stressManagementInsights = memories.filter(memory => {
      const insights = memory.insightsGenerated || [];
      return insights.some(insight => {
        const lowercaseInsight = insight.toLowerCase();
        return lowercaseInsight.includes('stress') ||
               lowercaseInsight.includes('coping') ||
               lowercaseInsight.includes('managing pressure') ||
               lowercaseInsight.includes('work-life balance');
      });
    }).length;
    
    // Bonus for stress management focus
    if (stressManagementInsights > 0) {
      reductionScore += (stressManagementInsights / memories.length) * 0.2;
    }
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, reductionScore));
  }

  private calculateHabitFormation(goals: KpiTracker[]): number {
    if (goals.length === 0) return 0.5;
    
    // Focus on goals that are habit-related
    const habitKeywords = ['daily', 'routine', 'habit', 'consistent', 'regular', 'practice'];
    const habitGoals = goals.filter(goal => {
      const searchText = (goal.title + ' ' + goal.description).toLowerCase();
      return habitKeywords.some(keyword => searchText.includes(keyword));
    });
    
    if (habitGoals.length === 0) {
      // If no explicit habit goals, analyze all goals for habit-forming patterns
      return this.analyzeHabitFormationFromAllGoals(goals);
    }
    
    let totalHabitScore = 0;
    
    for (const goal of habitGoals) {
      let habitScore = 0;
      
      // Factor 1: Consistency in performance tracking (40% weight)
      const performanceHistory = goal.performanceHistory || [];
      if (performanceHistory.length >= 7) { // At least a week of data
        const recentHistory = performanceHistory
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 14); // Last 2 weeks
        
        const consistentDays = this.calculateConsistentDays(recentHistory);
        habitScore += (consistentDays / 14) * 0.4;
      }
      
      // Factor 2: Progress velocity (30% weight)
      const velocityScore = goal.calculateVelocityScore();
      habitScore += velocityScore * 0.3;
      
      // Factor 3: Action item completion rate (20% weight)
      const actionItems = goal.coachingData.actionItems || [];
      if (actionItems.length > 0) {
        const completedItems = actionItems.filter(item => item.status === 'completed').length;
        habitScore += (completedItems / actionItems.length) * 0.2;
      }
      
      // Factor 4: Time since goal start (10% weight) - longer habits are more established
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const timeBonus = Math.min(0.1, (daysSinceStart / 60) * 0.1); // Max bonus at 60 days
      habitScore += timeBonus;
      
      totalHabitScore += Math.min(1, habitScore);
    }
    
    const averageHabitScore = totalHabitScore / habitGoals.length;
    
    // Bonus for having multiple established habits
    const establishedHabits = habitGoals.filter(goal => goal.overallProgress >= 70).length;
    const habitDiversityBonus = Math.min(0.1, establishedHabits * 0.05);
    
    return Math.max(0, Math.min(1, averageHabitScore + habitDiversityBonus));
  }

  private calculatePreferredTime(memories: CoachMemory[]): string {
    if (memories.length === 0) return 'unknown';
    
    const timeSlots = {
      'early_morning': 0, // 5-8 AM
      'morning': 0,       // 8-11 AM  
      'midday': 0,        // 11 AM - 2 PM
      'afternoon': 0,     // 2-5 PM
      'evening': 0,       // 5-8 PM
      'night': 0          // 8-11 PM
    };
    
    for (const memory of memories) {
      const sessionHour = new Date(memory.conversationDate).getHours();
      
      if (sessionHour >= 5 && sessionHour < 8) {
        timeSlots.early_morning++;
      } else if (sessionHour >= 8 && sessionHour < 11) {
        timeSlots.morning++;
      } else if (sessionHour >= 11 && sessionHour < 14) {
        timeSlots.midday++;
      } else if (sessionHour >= 14 && sessionHour < 17) {
        timeSlots.afternoon++;
      } else if (sessionHour >= 17 && sessionHour < 20) {
        timeSlots.evening++;
      } else if (sessionHour >= 20 && sessionHour < 23) {
        timeSlots.night++;
      }
    }
    
    // Find the time slot with the most sessions
    let preferredTime = 'morning';
    let maxSessions = 0;
    
    for (const [timeSlot, sessionCount] of Object.entries(timeSlots)) {
      if (sessionCount > maxSessions) {
        maxSessions = sessionCount;
        preferredTime = timeSlot;
      }
    }
    
    // Only return a preference if there's a clear pattern (at least 30% of sessions)
    if (maxSessions / memories.length >= 0.3) {
      return preferredTime;
    }
    
    return 'flexible';
  }

  private analyzeCommunicationStyle(memories: CoachMemory[]): string {
    if (memories.length === 0) return 'adaptive';
    
    const styleIndicators = {
      direct: 0,
      supportive: 0,
      analytical: 0,
      collaborative: 0,
      exploratory: 0
    };
    
    for (const memory of memories) {
      const content = (memory.content + ' ' + memory.summary).toLowerCase();
      const insights = (memory.insightsGenerated || []).join(' ').toLowerCase();
      const combinedText = content + ' ' + insights;
      
      // Direct communication indicators
      const directWords = ['goal', 'plan', 'action', 'step', 'specific', 'clear', 'focus', 'decide'];
      const directCount = directWords.filter(word => combinedText.includes(word)).length;
      styleIndicators.direct += directCount;
      
      // Supportive communication indicators  
      const supportiveWords = ['understand', 'feel', 'support', 'encourage', 'celebrate', 'appreciate', 'validate'];
      const supportiveCount = supportiveWords.filter(word => combinedText.includes(word)).length;
      styleIndicators.supportive += supportiveCount;
      
      // Analytical communication indicators
      const analyticalWords = ['analyze', 'pattern', 'data', 'trend', 'metric', 'measure', 'evaluate', 'assess'];
      const analyticalCount = analyticalWords.filter(word => combinedText.includes(word)).length;
      styleIndicators.analytical += analyticalCount;
      
      // Collaborative communication indicators
      const collaborativeWords = ['together', 'we', 'us', 'partner', 'team', 'collaborate', 'share', 'discuss'];
      const collaborativeCount = collaborativeWords.filter(word => combinedText.includes(word)).length;
      styleIndicators.collaborative += collaborativeCount;
      
      // Exploratory communication indicators
      const exploratoryWords = ['explore', 'discover', 'consider', 'reflect', 'think about', 'wonder', 'curious', 'possibilities'];
      const exploratoryCount = exploratoryWords.filter(word => combinedText.includes(word)).length;
      styleIndicators.exploratory += exploratoryCount;
    }
    
    // Normalize scores
    const totalIndicators = Object.values(styleIndicators).reduce((sum, count) => sum + count, 0);
    if (totalIndicators === 0) return 'adaptive';
    
    // Find dominant style
    let dominantStyle = 'supportive';
    let maxScore = 0;
    
    for (const [style, score] of Object.entries(styleIndicators)) {
      const normalizedScore = score / totalIndicators;
      if (normalizedScore > maxScore) {
        maxScore = normalizedScore;
        dominantStyle = style;
      }
    }
    
    // Only return a specific style if it's clearly dominant (>40%)
    if (maxScore >= 0.4) {
      return dominantStyle;
    }
    
    // Otherwise return mixed style based on top two
    const sortedStyles = Object.entries(styleIndicators)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([style]) => style);
    
    return `${sortedStyles[0]}-${sortedStyles[1]}`;
  }

  private extractTopicsOfInterest(memories: CoachMemory[]): string[] {
    if (memories.length === 0) return [];
    
    const topicFrequency: Record<string, number> = {};
    const topicEngagement: Record<string, { sentiment: number; importance: number; count: number }> = {};
    
    for (const memory of memories) {
      const tags = memory.tags || [];
      const sentiment = memory.emotionalContext.sentiment || 0;
      const importance = memory.importance || 5;
      
      // Count topic frequency and engagement
      for (const tag of tags) {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag.length < 2) continue; // Skip very short tags
        
        topicFrequency[normalizedTag] = (topicFrequency[normalizedTag] || 0) + 1;
        
        if (!topicEngagement[normalizedTag]) {
          topicEngagement[normalizedTag] = { sentiment: 0, importance: 0, count: 0 };
        }
        
        topicEngagement[normalizedTag].sentiment += sentiment;
        topicEngagement[normalizedTag].importance += importance;
        topicEngagement[normalizedTag].count++;
      }
      
      // Also extract topics from content analysis
      const content = (memory.content + ' ' + memory.summary).toLowerCase();
      const commonTopics = [
        'career', 'relationships', 'health', 'fitness', 'productivity', 'goals',
        'leadership', 'communication', 'stress', 'balance', 'learning', 'skills',
        'motivation', 'confidence', 'habits', 'mindfulness', 'planning', 'time management'
      ];
      
      for (const topic of commonTopics) {
        if (content.includes(topic) || content.includes(topic.replace(' ', '-'))) {
          const normalizedTopic = topic.replace(' ', '_');
          topicFrequency[normalizedTopic] = (topicFrequency[normalizedTopic] || 0) + 1;
          
          if (!topicEngagement[normalizedTopic]) {
            topicEngagement[normalizedTopic] = { sentiment: 0, importance: 0, count: 0 };
          }
          
          topicEngagement[normalizedTopic].sentiment += sentiment;
          topicEngagement[normalizedTopic].importance += importance;
          topicEngagement[normalizedTopic].count++;
        }
      }
    }
    
    // Calculate interest scores (frequency + positive sentiment + high importance)
    const topicScores: Array<{ topic: string; score: number }> = [];
    
    for (const [topic, frequency] of Object.entries(topicFrequency)) {
      if (frequency < 2) continue; // Must appear in at least 2 sessions
      
      const engagement = topicEngagement[topic];
      const averageSentiment = engagement ? engagement.sentiment / engagement.count : 0;
      const averageImportance = engagement ? engagement.importance / engagement.count : 5;
      
      // Score calculation: frequency weight (40%) + sentiment weight (30%) + importance weight (30%)
      const frequencyScore = Math.min(1, frequency / memories.length); // Normalize by total sessions
      const sentimentScore = Math.max(0, (averageSentiment + 1) / 2); // Convert -1/1 to 0/1
      const importanceScore = averageImportance / 10; // Convert 0-10 to 0-1
      
      const interestScore = (frequencyScore * 0.4) + (sentimentScore * 0.3) + (importanceScore * 0.3);
      
      topicScores.push({ topic, score: interestScore });
    }
    
    // Sort by interest score and return top topics
    return topicScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.topic);
  }

  private extractChallengeAreas(memories: CoachMemory[]): string[] {
    if (memories.length === 0) return [];
    
    const challengeIndicators: Record<string, { count: number; negativeScore: number }> = {};
    
    // Common challenge categories to look for
    const challengeKeywords = {
      'time_management': ['time', 'schedule', 'busy', 'deadline', 'overwhelmed', 'rushed'],
      'consistency': ['inconsistent', 'irregular', 'sporadic', 'off-track', 'missed', 'skip'],
      'motivation': ['unmotivated', 'lazy', 'procrastinate', 'lack energy', 'no drive'],
      'stress_management': ['stressed', 'pressure', 'anxious', 'overwhelmed', 'tension'],
      'focus': ['distracted', 'scattered', 'unfocused', 'concentration', 'attention'],
      'confidence': ['doubt', 'unsure', 'insecure', 'fear', 'uncertain', 'imposter'],
      'work_life_balance': ['balance', 'work-life', 'burnout', 'exhausted', 'overworked'],
      'communication': ['misunderstood', 'conflict', 'difficult conversation', 'awkward'],
      'decision_making': ['indecisive', 'torn', 'confused', 'unclear', 'stuck'],
      'perfectionism': ['perfect', 'never good enough', 'high standards', 'criticism']
    };
    
    for (const memory of memories) {
      const content = (memory.content + ' ' + memory.summary).toLowerCase();
      const sentiment = memory.emotionalContext.sentiment || 0;
      const insights = (memory.insightsGenerated || []).join(' ').toLowerCase();
      const combinedText = content + ' ' + insights;
      
      // Look for challenge indicators
      for (const [challengeArea, keywords] of Object.entries(challengeKeywords)) {
        const keywordMatches = keywords.filter(keyword => 
          combinedText.includes(keyword)
        ).length;
        
        if (keywordMatches > 0) {
          if (!challengeIndicators[challengeArea]) {
            challengeIndicators[challengeArea] = { count: 0, negativeScore: 0 };
          }
          
          challengeIndicators[challengeArea].count += keywordMatches;
          
          // Factor in negative sentiment as additional challenge indicator
          if (sentiment < 0) {
            challengeIndicators[challengeArea].negativeScore += Math.abs(sentiment);
          }
        }
      }
      
      // Also look for explicit challenge mentions in insights
      const challengeInsights = memory.insightsGenerated?.filter(insight => {
        const lowercaseInsight = insight.toLowerCase();
        return lowercaseInsight.includes('challenge') ||
               lowercaseInsight.includes('difficulty') ||
               lowercaseInsight.includes('struggle') ||
               lowercaseInsight.includes('obstacle') ||
               lowercaseInsight.includes('problem');
      }) || [];
      
      // Extract specific challenge areas from these insights
      for (const insight of challengeInsights) {
        for (const [challengeArea, keywords] of Object.entries(challengeKeywords)) {
          if (keywords.some(keyword => insight.toLowerCase().includes(keyword))) {
            if (!challengeIndicators[challengeArea]) {
              challengeIndicators[challengeArea] = { count: 0, negativeScore: 0 };
            }
            challengeIndicators[challengeArea].count += 2; // Weight insight mentions more heavily
          }
        }
      }
    }
    
    // Calculate challenge scores
    const challengeScores: Array<{ area: string; score: number }> = [];
    
    for (const [area, indicators] of Object.entries(challengeIndicators)) {
      if (indicators.count === 0) continue;
      
      // Score based on frequency and negative sentiment association
      const frequencyScore = Math.min(1, indicators.count / memories.length);
      const negativeScore = indicators.negativeScore / Math.max(1, indicators.count);
      
      const challengeScore = frequencyScore + (negativeScore * 0.3);
      challengeScores.push({ area, score: challengeScore });
    }
    
    // Return top challenge areas, sorted by severity
    return challengeScores
      .filter(item => item.score > 0.1) // Only include significant challenges
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.area);
  }

  private calculateMoodTrends(memories: CoachMemory[]): unknown[] {
    return memories.map(m => ({
      date: m.conversationDate.toISOString().split('T')[0],
      mood: m.emotionalContext.mood,
      sentiment: m.emotionalContext.sentiment,
    }));
  }

  private analyzeLearningPreferences(memories: CoachMemory[]): unknown {
    if (memories.length === 0) {
      return {
        visualLearner: 0.33,
        auditoryLearner: 0.33,
        kinestheticLearner: 0.34,
        confidence: 0.1
      };
    }
    
    // Keywords indicating different learning preferences
    const visualKeywords = ['see', 'show', 'picture', 'image', 'visual', 'diagram', 'chart', 'graph', 'color', 'watch', 'look', 'appear', 'view'];
    const auditoryKeywords = ['hear', 'listen', 'sound', 'voice', 'audio', 'music', 'rhythm', 'tone', 'speak', 'talk', 'discuss', 'explain', 'tell'];
    const kinestheticKeywords = ['do', 'practice', 'hands-on', 'feel', 'touch', 'move', 'action', 'experience', 'try', 'build', 'make', 'physical', 'exercise'];
    
    let visualScore = 0;
    let auditoryScore = 0;
    let kinestheticScore = 0;
    let totalInteractions = 0;
    
    for (const memory of memories) {
      const content = (memory.content + ' ' + memory.summary).toLowerCase();
      const importance = memory.importance / 10; // Weight by importance
      
      // Count keyword matches weighted by importance
      const visualMatches = visualKeywords.filter(keyword => content.includes(keyword)).length;
      const auditoryMatches = auditoryKeywords.filter(keyword => content.includes(keyword)).length;
      const kinestheticMatches = kinestheticKeywords.filter(keyword => content.includes(keyword)).length;
      
      visualScore += visualMatches * importance;
      auditoryScore += auditoryMatches * importance;
      kinestheticScore += kinestheticMatches * importance;
      totalInteractions += importance;
    }
    
    // Normalize scores
    const totalScore = visualScore + auditoryScore + kinestheticScore;
    
    if (totalScore === 0) {
      return {
        visualLearner: 0.33,
        auditoryLearner: 0.33,
        kinestheticLearner: 0.34,
        confidence: 0.1
      };
    }
    
    // Calculate percentages
    let visual = visualScore / totalScore;
    let auditory = auditoryScore / totalScore;
    let kinesthetic = kinestheticScore / totalScore;
    
    // Apply smoothing to avoid extreme values
    const smoothingFactor = 0.1;
    const baseValue = 1/3;
    
    visual = visual * (1 - smoothingFactor) + baseValue * smoothingFactor;
    auditory = auditory * (1 - smoothingFactor) + baseValue * smoothingFactor;
    kinesthetic = kinesthetic * (1 - smoothingFactor) + baseValue * smoothingFactor;
    
    // Normalize again after smoothing
    const total = visual + auditory + kinesthetic;
    visual /= total;
    auditory /= total;
    kinesthetic /= total;
    
    // Calculate confidence based on data volume and consistency
    const dataVolumeScore = Math.min(1, totalInteractions / 5);
    const consistencyScore = 1 - (Math.max(visual, auditory, kinesthetic) - 0.33) / 0.67;
    const confidence = (dataVolumeScore + consistencyScore) / 2;
    
    return {
      visualLearner: Math.round(visual * 100) / 100,
      auditoryLearner: Math.round(auditory * 100) / 100,
      kinestheticLearner: Math.round(kinesthetic * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      totalInteractions: Math.round(totalInteractions),
      dominantStyle: visual > auditory && visual > kinesthetic ? 'visual' :
                    auditory > kinesthetic ? 'auditory' : 'kinesthetic'
    };
  }

  private calculateSatisfactionScore(memories: CoachMemory[]): number {
    if (memories.length === 0) return 7.5; // Default neutral score
    
    let totalSatisfaction = 0;
    let validRatings = 0;
    
    for (const memory of memories) {
      // Extract satisfaction indicators from AI insights
      const insights = memory.insightsGenerated || [];
      const positiveInsights = insights.filter(insight => 
        insight.toLowerCase().includes('progress') ||
        insight.toLowerCase().includes('achievement') ||
        insight.toLowerCase().includes('breakthrough') ||
        insight.toLowerCase().includes('success')
      ).length;
      
      const negativeInsights = insights.filter(insight =>
        insight.toLowerCase().includes('struggle') ||
        insight.toLowerCase().includes('challenge') ||
        insight.toLowerCase().includes('difficulty') ||
        insight.toLowerCase().includes('setback')
      ).length;
      
      // Calculate session satisfaction based on multiple factors
      let sessionSatisfaction = 5.0; // Base neutral score
      
      // Factor 1: Sentiment analysis (30% weight)
      const sentiment = memory.emotionalContext.sentiment || 0;
      sessionSatisfaction += sentiment * 2.5; // Convert -1/1 scale to -2.5/2.5
      
      // Factor 2: Session importance/engagement (25% weight)
      sessionSatisfaction += (memory.importance - 5) * 0.3; // Convert 0-10 to impact
      
      // Factor 3: AI insights quality (25% weight)
      if (positiveInsights > negativeInsights) {
        sessionSatisfaction += (positiveInsights - negativeInsights) * 0.3;
      } else if (negativeInsights > positiveInsights) {
        sessionSatisfaction -= (negativeInsights - positiveInsights) * 0.2;
      }
      
      // Factor 4: Follow-through indicators (20% weight)
      const actionItems = memory.coachingContext.actionItems || [];
      if (actionItems.length > 0) {
        sessionSatisfaction += 0.5; // Bonus for actionable sessions
      }
      
      if (memory.coachingContext.followUpNeeded) {
        sessionSatisfaction += 0.3; // Bonus for engagement
      }
      
      // Clamp to 1-10 scale
      sessionSatisfaction = Math.max(1, Math.min(10, sessionSatisfaction));
      
      totalSatisfaction += sessionSatisfaction;
      validRatings++;
    }
    
    const averageSatisfaction = validRatings > 0 ? totalSatisfaction / validRatings : 7.5;
    
    // Apply recency weighting (recent sessions have more impact)
    const sortedMemories = memories
      .sort((a, b) => new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime())
      .slice(0, 10); // Last 10 sessions
    
    if (sortedMemories.length > 0) {
      let recentWeightedScore = 0;
      let totalWeight = 0;
      
      for (let i = 0; i < sortedMemories.length; i++) {
        const weight = Math.pow(0.9, i); // Exponential decay
        const memory = sortedMemories[i];
        const sentiment = memory.emotionalContext.sentiment || 0;
        const sessionScore = 5 + (sentiment * 2.5) + ((memory.importance - 5) * 0.3);
        
        recentWeightedScore += Math.max(1, Math.min(10, sessionScore)) * weight;
        totalWeight += weight;
      }
      
      const recentAverage = totalWeight > 0 ? recentWeightedScore / totalWeight : averageSatisfaction;
      
      // Blend overall average (40%) with recent trends (60%)
      return Math.round((averageSatisfaction * 0.4 + recentAverage * 0.6) * 10) / 10;
    }
    
    return Math.round(averageSatisfaction * 10) / 10;
  }

  /**
   * Calculate Net Promoter Score based on user satisfaction and engagement
   */
  private calculateNPSScore(memories: CoachMemory[], goals: KpiTracker[]): number {
    if (memories.length === 0 && goals.length === 0) return 7; // Neutral NPS
    
    // Base NPS calculation on multiple factors
    let npsScore = 7; // Start with neutral (7 = neutral on 0-10 scale)
    
    // Factor 1: Goal achievement rate (40% weight)
    if (goals.length > 0) {
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const goalCompletionRate = completedGoals / goals.length;
      
      if (goalCompletionRate >= 0.8) {
        npsScore += 2; // High achievers = promoters
      } else if (goalCompletionRate >= 0.6) {
        npsScore += 1; // Good achievers = passives leaning positive
      } else if (goalCompletionRate < 0.3) {
        npsScore -= 2; // Low achievers = detractors
      }
    }
    
    // Factor 2: Session satisfaction trends (30% weight)
    const satisfactionScore = this.calculateSatisfactionScore(memories);
    if (satisfactionScore >= 8.5) {
      npsScore += 2; // Very satisfied
    } else if (satisfactionScore >= 7.5) {
      npsScore += 1; // Satisfied
    } else if (satisfactionScore < 6.0) {
      npsScore -= 2; // Unsatisfied
    } else if (satisfactionScore < 7.0) {
      npsScore -= 1; // Somewhat unsatisfied
    }
    
    // Factor 3: Engagement consistency (20% weight)
    const streakCount = this.calculateStreakCount(memories);
    const responsiveness = this.calculateResponsiveness(memories);
    
    if (streakCount >= 7 && responsiveness >= 0.8) {
      npsScore += 1; // Highly engaged
    } else if (streakCount >= 3 && responsiveness >= 0.6) {
      npsScore += 0.5; // Moderately engaged
    } else if (responsiveness < 0.4) {
      npsScore -= 1; // Low engagement
    }
    
    // Factor 4: At-risk goal indicators (10% weight)
    const atRiskGoals = goals.filter(g => g.isAtRisk()).length;
    if (atRiskGoals > 0 && goals.length > 0) {
      const atRiskRatio = atRiskGoals / goals.length;
      if (atRiskRatio > 0.5) {
        npsScore -= 1; // Many at-risk goals = frustration
      }
    }
    
    // Clamp to 0-10 scale
    return Math.max(0, Math.min(10, Math.round(npsScore)));
  }
  
  private calculateRetentionProbability(memories: CoachMemory[], goals: KpiTracker[]): number {
    if (memories.length === 0) return 0.5; // Default for no data
    
    let retentionScore = 0.5; // Base 50% probability
    
    // Factor 1: Recent engagement (35% weight)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSessions = memories.filter(m => new Date(m.conversationDate) >= thirtyDaysAgo).length;
    
    if (recentSessions >= 8) {
      retentionScore += 0.25; // High recent activity
    } else if (recentSessions >= 4) {
      retentionScore += 0.15; // Moderate activity
    } else if (recentSessions >= 2) {
      retentionScore += 0.05; // Low activity
    } else if (recentSessions === 0) {
      retentionScore -= 0.3; // No recent activity = high churn risk
    }
    
    // Factor 2: Goal achievement momentum (25% weight)
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'in_progress').length;
    
    if (completedGoals > 0 && activeGoals > 0) {
      retentionScore += 0.2; // Success momentum
    } else if (completedGoals > 0) {
      retentionScore += 0.1; // Some success
    } else if (activeGoals === 0 && goals.length > 0) {
      retentionScore -= 0.15; // No active goals = disengagement
    }
    
    // Factor 3: Satisfaction trends (20% weight)
    const satisfactionScore = this.calculateSatisfactionScore(memories);
    if (satisfactionScore >= 8.0) {
      retentionScore += 0.15;
    } else if (satisfactionScore >= 7.0) {
      retentionScore += 0.05;
    } else if (satisfactionScore < 6.0) {
      retentionScore -= 0.2;
    }
    
    // Factor 4: Coaching relationship strength (20% weight)
    const responsiveness = this.calculateResponsiveness(memories);
    const participation = this.calculateParticipationScore(memories);
    
    const relationshipStrength = (responsiveness + participation) / 2;
    if (relationshipStrength >= 0.8) {
      retentionScore += 0.15;
    } else if (relationshipStrength >= 0.6) {
      retentionScore += 0.05;
    } else if (relationshipStrength < 0.4) {
      retentionScore -= 0.15;
    }
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, retentionScore));
  }

  private calculateChurnRisk(memories: CoachMemory[], goals: KpiTracker[]): number {
    // Churn risk is inverse of retention probability, with additional risk factors
    const baseChurnRisk = 1 - this.calculateRetentionProbability(memories, goals);
    
    let additionalRisk = 0;
    
    // Risk Factor 1: Declining satisfaction trend
    const recentMemories = memories
      .sort((a, b) => new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime())
      .slice(0, 5);
    
    if (recentMemories.length >= 3) {
      const recentSatisfaction = this.calculateSatisfactionScore(recentMemories);
      const overallSatisfaction = this.calculateSatisfactionScore(memories);
      
      if (recentSatisfaction < overallSatisfaction - 1.0) {
        additionalRisk += 0.15; // Declining satisfaction
      }
    }
    
    // Risk Factor 2: Multiple failed goals
    const failedGoals = goals.filter(g => g.status === 'failed').length;
    if (failedGoals > 0) {
      additionalRisk += failedGoals * 0.05; // Each failed goal increases risk
    }
    
    // Risk Factor 3: No recent activity
    const daysSinceLastSession = memories.length > 0 ? 
      Math.floor((Date.now() - new Date(memories[0].conversationDate).getTime()) / (1000 * 60 * 60 * 24)) : 30;
    
    if (daysSinceLastSession > 14) {
      additionalRisk += 0.1;
    } else if (daysSinceLastSession > 21) {
      additionalRisk += 0.2;
    }
    
    // Risk Factor 4: High percentage of at-risk goals
    const atRiskGoals = goals.filter(g => g.isAtRisk()).length;
    if (goals.length > 0) {
      const atRiskRatio = atRiskGoals / goals.length;
      if (atRiskRatio > 0.5) {
        additionalRisk += 0.1;
      }
    }
    
    const totalChurnRisk = baseChurnRisk + additionalRisk;
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, totalChurnRisk));
  }

  /**
   * Calculate custom KPIs based on user preferences and coaching focus areas
   */
  private calculateCustomKPIs(userId: string, memories: CoachMemory[], goals: KpiTracker[]): unknown[] {
    const customKpis = [];
    
    // KPI 1: Coaching Effectiveness Score
    const effectivenessScore = this.calculateCoachingEffectiveness(memories, goals);
    customKpis.push({
      id: 'coaching_effectiveness',
      name: 'Coaching Effectiveness',
      value: effectivenessScore,
      unit: 'score',
      target: 0.8,
      status: effectivenessScore >= 0.8 ? 'on_track' : effectivenessScore >= 0.6 ? 'attention_needed' : 'critical'
    });
    
    // KPI 2: Personal Growth Trajectory
    const growthTrajectory = this.calculateGrowthTrajectory(memories, goals);
    customKpis.push({
      id: 'growth_trajectory',
      name: 'Personal Growth Trajectory', 
      value: growthTrajectory,
      unit: 'trend',
      target: 1.0,
      status: growthTrajectory > 0 ? 'positive' : 'needs_improvement'
    });
    
    // KPI 3: Goal Achievement Velocity
    const achievementVelocity = this.calculateAchievementVelocity(goals);
    customKpis.push({
      id: 'achievement_velocity',
      name: 'Goal Achievement Velocity',
      value: achievementVelocity,
      unit: 'goals_per_month',
      target: 1.5,
      status: achievementVelocity >= 1.5 ? 'excellent' : achievementVelocity >= 1.0 ? 'good' : 'needs_focus'
    });
    
    // KPI 4: Consistency Index
    const consistencyIndex = this.calculateConsistencyIndex(memories);
    customKpis.push({
      id: 'consistency_index',
      name: 'Engagement Consistency',
      value: consistencyIndex,
      unit: 'consistency_score',
      target: 0.75,
      status: consistencyIndex >= 0.75 ? 'consistent' : consistencyIndex >= 0.5 ? 'moderate' : 'inconsistent'
    });
    
    return customKpis;
  }
  
  private identifyStrengthAreas(memories: CoachMemory[], goals: KpiTracker[]): string[] {
    const strengthAreas = [];
    
    // Analyze goal completion by category
    const categoryPerformance: Record<string, { completed: number; total: number }> = {};
    
    for (const goal of goals) {
      if (!categoryPerformance[goal.category]) {
        categoryPerformance[goal.category] = { completed: 0, total: 0 };
      }
      categoryPerformance[goal.category].total++;
      if (goal.status === 'completed') {
        categoryPerformance[goal.category].completed++;
      }
    }
    
    // Identify categories with high completion rates
    for (const [category, stats] of Object.entries(categoryPerformance)) {
      if (stats.total >= 2 && stats.completed / stats.total >= 0.7) {
        strengthAreas.push(category);
      }
    }
    
    // Analyze conversation topics for consistent positive outcomes
    const topicInsights: Record<string, number> = {};
    
    for (const memory of memories) {
      const tags = memory.tags || [];
      const sentiment = memory.emotionalContext.sentiment || 0;
      
      for (const tag of tags) {
        if (!topicInsights[tag]) {
          topicInsights[tag] = 0;
        }
        topicInsights[tag] += sentiment;
      }
    }
    
    // Identify topics with consistently positive sentiment
    for (const [topic, totalSentiment] of Object.entries(topicInsights)) {
      const averageSentiment = totalSentiment / memories.filter(m => m.tags?.includes(topic)).length;
      if (averageSentiment > 0.3) {
        strengthAreas.push(`${topic}_communication`);
      }
    }
    
    // Analyze engagement patterns
    const responsiveness = this.calculateResponsiveness(memories);
    const participation = this.calculateParticipationScore(memories);
    
    if (responsiveness >= 0.8) {
      strengthAreas.push('responsiveness');
    }
    
    if (participation >= 0.8) {
      strengthAreas.push('active_participation');
    }
    
    const streakCount = this.calculateStreakCount(memories);
    if (streakCount >= 7) {
      strengthAreas.push('consistency');
    }
    
    // Remove duplicates and return top strengths
    return Array.from(new Set(strengthAreas)).slice(0, 5);
  }

  private identifyImprovementAreas(memories: CoachMemory[], goals: KpiTracker[]): string[] {
    const improvementAreas: Set<string> = new Set();
    
    if (memories.length === 0 && goals.length === 0) {
      return ['goal-setting', 'engagement'];
    }
    
    // Analyze memory patterns for improvement indicators
    const challengeKeywords = {
      'consistency': ['inconsistent', 'irregular', 'missed', 'skip', 'forget', 'struggle to maintain'],
      'follow-through': ['didn\'t complete', 'abandoned', 'gave up', 'quit', 'stopped', 'incomplete'],
      'motivation': ['unmotivated', 'lazy', 'tired', 'no energy', 'don\'t want to', 'not interested'],
      'time-management': ['no time', 'busy', 'rushed', 'overwhelmed', 'schedule', 'deadline'],
      'focus': ['distracted', 'scattered', 'unfocused', 'can\'t concentrate', 'mind wanders'],
      'confidence': ['doubt', 'uncertain', 'nervous', 'afraid', 'worried', 'insecure'],
      'planning': ['unorganized', 'chaos', 'random', 'no plan', 'improvising', 'winging it'],
      'stress-management': ['stressed', 'anxious', 'pressure', 'overwhelmed', 'burned out']
    };
    
    // Score each improvement area based on memory content
    const areaScores: { [key: string]: number } = {};
    
    for (const memory of memories) {
      const content = (memory.content + ' ' + memory.summary).toLowerCase();
      const importance = memory.importance / 10;
      
      for (const [area, keywords] of Object.entries(challengeKeywords)) {
        const matches = keywords.filter(keyword => content.includes(keyword)).length;
        if (matches > 0) {
          areaScores[area] = (areaScores[area] || 0) + matches * importance;
        }
      }
    }
    
    // Analyze goal completion rates
    if (goals.length > 0) {
      const goalData = goals[0];
      
      if (goalData?.overallProgress < 60) {
        areaScores['follow-through'] = (areaScores['follow-through'] || 0) + 2;
      }
      
      if (goalData?.analytics?.consistencyScore < 0.7) {
        areaScores['consistency'] = (areaScores['consistency'] || 0) + 2;
      }
      
      if (goalData?.analytics?.averageProgress < 0.6) {
        areaScores['motivation'] = (areaScores['motivation'] || 0) + 1.5;
      }
    }
    
    // Analyze sentiment patterns for emotional areas
    const negativeSentimentCount = memories.filter(m => 
      (m.emotionalContext.sentiment || 0) < -0.3
    ).length;
    
    if (negativeSentimentCount > memories.length * 0.3) {
      areaScores['stress-management'] = (areaScores['stress-management'] || 0) + 1;
      areaScores['confidence'] = (areaScores['confidence'] || 0) + 0.8;
    }
    
    // Sort areas by score and return top issues
    const sortedAreas = Object.entries(areaScores)
      .sort(([,a], [,b]) => b - a)
      .map(([area]) => area)
      .slice(0, 4);
    
    // Ensure we always return at least 2 areas
    if (sortedAreas.length < 2) {
      const defaultAreas = ['consistency', 'goal-setting', 'time-management', 'motivation'];
      for (const area of defaultAreas) {
        if (!sortedAreas.includes(area) && sortedAreas.length < 3) {
          sortedAreas.push(area);
        }
      }
    }
    
    return sortedAreas.slice(0, 3);
  }

  private predictOutcomes(memories: CoachMemory[], goals: KpiTracker[]): string[] {
    const predictions: string[] = [];
    
    if (memories.length === 0 && goals.length === 0) {
      return ['Need more data to make accurate predictions', 'Focus on establishing consistent coaching interactions'];
    }
    
    // Calculate key predictive metrics
    const avgSentiment = memories.length > 0 ? 
      memories.reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / memories.length : 0;
    
    const avgImportance = memories.length > 0 ?
      memories.reduce((sum, m) => sum + m.importance, 0) / memories.length : 5;
    
    const recentMemories = memories
      .sort((a, b) => new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime())
      .slice(0, 5);
    
    const recentSentiment = recentMemories.length > 0 ?
      recentMemories.reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / recentMemories.length : 0;
    
    const engagementTrend = recentMemories.length >= 3 ?
      recentMemories.slice(0, 2).reduce((sum, m) => sum + m.importance, 0) / 2 -
      recentMemories.slice(-2).reduce((sum, m) => sum + m.importance, 0) / 2 : 0;
    
    // Goal analysis
    let goalCompletionRate = 0.5;
    let consistencyScore = 0.5;
    
    if (goals.length > 0) {
      const goalData = goals[0];
      goalCompletionRate = goalData?.overallProgress / 100 || 0.5;
      consistencyScore = goalData?.analytics?.consistencyScore || 0.5;
    }
    
    // Predictive logic
    
    // Success probability prediction
    if (avgSentiment > 0.2 && goalCompletionRate > 0.7 && consistencyScore > 0.7) {
      predictions.push('Highly likely to achieve current goals within expected timeframe');
    } else if (avgSentiment > 0 && goalCompletionRate > 0.5 && consistencyScore > 0.5) {
      predictions.push('Good probability of achieving goals with continued effort');
    } else if (avgSentiment > -0.2 && goalCompletionRate > 0.3) {
      predictions.push('Moderate success likely with improved consistency and support');
    } else {
      predictions.push('May face challenges achieving current goals without intervention');
    }
    
    // Engagement trend prediction
    if (engagementTrend > 1) {
      predictions.push('Engagement is improving - likely to maintain coaching momentum');
    } else if (engagementTrend < -1) {
      predictions.push('Engagement declining - may need motivation and re-engagement strategies');
    }
    
    // Consistency prediction
    if (consistencyScore < 0.4) {
      predictions.push('Consistency challenges may hinder long-term progress');
    } else if (consistencyScore > 0.8) {
      predictions.push('Strong consistency patterns indicate sustainable progress');
    }
    
    // Sentiment-based emotional predictions
    if (recentSentiment > 0.3) {
      predictions.push('Positive emotional trajectory suggests continued motivation');
    } else if (recentSentiment < -0.3) {
      predictions.push('Recent emotional challenges may impact coaching effectiveness');
    }
    
    // Breakthrough prediction
    const actionItemsCompleted = memories.filter(m => 
      m.coachingContext.actionItems?.some(item => 
        (item as unknown).status === 'completed' || 
        m.summary.toLowerCase().includes('completed') ||
        m.summary.toLowerCase().includes('achieved')
      )
    ).length;
    
    if (actionItemsCompleted > memories.length * 0.4) {
      predictions.push('Strong follow-through indicates potential for breakthrough progress');
    }
    
    // Risk-based predictions
    const stressIndicators = memories.filter(m => {
      const content = (m.content + ' ' + m.summary).toLowerCase();
      return ['stress', 'overwhelmed', 'burned out', 'exhausted', 'pressure'].some(keyword => 
        content.includes(keyword)
      );
    }).length;
    
    if (stressIndicators > memories.length * 0.3) {
      predictions.push('Stress management focus needed to prevent coaching program dropout');
    }
    
    // Timeline prediction
    const progressRate = goalCompletionRate * consistencyScore;
    if (progressRate > 0.6) {
      predictions.push('Current pace suggests goals achievable within standard coaching timeframe');
    } else if (progressRate > 0.3) {
      predictions.push('May need extended timeline or adjusted goals for optimal outcomes');
    } else {
      predictions.push('Significant strategy adjustment needed to achieve meaningful progress');
    }
    
    // Limit to most relevant predictions
    return predictions.slice(0, 4);
  }

  private identifyRiskFactors(memories: CoachMemory[], goals: KpiTracker[]): string[] {
    const riskFactors: Set<string> = new Set();
    
    if (memories.length === 0 && goals.length === 0) {
      return ['Insufficient coaching interaction data', 'Need baseline assessment'];
    }
    
    // Calculate key risk indicators
    const avgSentiment = memories.length > 0 ? 
      memories.reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / memories.length : 0;
    
    const avgImportance = memories.length > 0 ?
      memories.reduce((sum, m) => sum + m.importance, 0) / memories.length : 5;
    
    // Recent trend analysis (last 5 sessions)
    const recentMemories = memories
      .sort((a, b) => new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime())
      .slice(0, 5);
    
    const recentSentiment = recentMemories.length > 0 ?
      recentMemories.reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / recentMemories.length : 0;
    
    const recentEngagement = recentMemories.length > 0 ?
      recentMemories.reduce((sum, m) => sum + m.importance, 0) / recentMemories.length : 5;
    
    // Goal analysis
    let goalCompletionRate = 1.0; // Assume good if no data
    let consistencyScore = 1.0;
    
    if (goals.length > 0) {
      const goalData = goals[0];
      goalCompletionRate = (goalData?.overallProgress ?? 100) / 100;
      consistencyScore = goalData?.analytics?.consistencyScore ?? 1.0;
    }
    
    // Risk factor detection
    
    // 1. Engagement risks
    if (avgImportance < 4) {
      riskFactors.add('Low overall engagement with coaching process');
    }
    
    if (recentEngagement < avgImportance - 1.5) {
      riskFactors.add('Declining engagement trend - intervention needed');
    }
    
    // 2. Emotional risks
    if (avgSentiment < -0.3) {
      riskFactors.add('Persistent negative sentiment may indicate coaching mismatch');
    }
    
    if (recentSentiment < -0.5) {
      riskFactors.add('Recent emotional decline requires immediate attention');
    }
    
    // 3. Consistency risks
    if (consistencyScore < 0.3) {
      riskFactors.add('Poor consistency patterns indicate high dropout risk');
    }
    
    if (goalCompletionRate < 0.2) {
      riskFactors.add('Very low goal completion suggests unrealistic expectations');
    }
    
    // 4. Behavioral pattern risks
    const missedSessionIndicators = memories.filter(m => {
      const content = (m.content + ' ' + m.summary).toLowerCase();
      return ['missed', 'cancelled', 'skipped', 'no-show', 'reschedule'].some(keyword => 
        content.includes(keyword)
      );
    }).length;
    
    if (missedSessionIndicators > memories.length * 0.2) {
      riskFactors.add('Frequent session disruptions indicate schedule or commitment issues');
    }
    
    // 5. Stress and overwhelm risks
    const stressIndicators = memories.filter(m => {
      const content = (m.content + ' ' + m.summary).toLowerCase();
      return ['overwhelmed', 'stressed', 'burned out', 'too much', 'can\'t handle', 'pressure'].some(keyword => 
        content.includes(keyword)
      );
    }).length;
    
    if (stressIndicators > memories.length * 0.3) {
      riskFactors.add('High stress levels may lead to coaching program abandonment');
    }
    
    // 6. Goal-setting risks
    const ambitiousGoalIndicators = memories.filter(m => {
      const content = (m.content + ' ' + m.summary).toLowerCase();
      return ['too ambitious', 'unrealistic', 'impossible', 'too hard', 'overwhelming goal'].some(keyword => 
        content.includes(keyword)
      );
    }).length;
    
    if (ambitiousGoalIndicators > 0) {
      riskFactors.add('Overambitious goals may lead to frustration and dropout');
    }
    
    // 7. Support system risks
    const isolationIndicators = memories.filter(m => {
      const content = (m.content + ' ' + m.summary).toLowerCase();
      return ['alone', 'no support', 'nobody understands', 'isolated', 'on my own'].some(keyword => 
        content.includes(keyword)
      );
    }).length;
    
    if (isolationIndicators > memories.length * 0.15) {
      riskFactors.add('Lack of external support system increases reliance pressure');
    }
    
    // 8. Progress perception risks
    const progressDoubtIndicators = memories.filter(m => {
      const content = (m.content + ' ' + m.summary).toLowerCase();
      return ['not working', 'no progress', 'waste of time', 'not helping', 'pointless'].some(keyword => 
        content.includes(keyword)
      );
    }).length;
    
    if (progressDoubtIndicators > 0) {
      riskFactors.add('Questioning coaching effectiveness - needs progress highlighting');
    }
    
    // 9. Time and resource risks
    const timeConstraintIndicators = memories.filter(m => {
      const content = (m.content + ' ' + m.summary).toLowerCase();
      return ['no time', 'too busy', 'can\'t afford', 'financial strain', 'priorities'].some(keyword => 
        content.includes(keyword)
      );
    }).length;
    
    if (timeConstraintIndicators > memories.length * 0.2) {
      riskFactors.add('Resource constraints may compromise coaching commitment');
    }
    
    // 10. Communication risks
    const communicationIssues = memories.filter(m => {
      const content = (m.content + ' ' + m.summary).toLowerCase();
      return ['don\'t understand', 'confused', 'unclear', 'miscommunication'].some(keyword => 
        content.includes(keyword)
      );
    }).length;
    
    if (communicationIssues > memories.length * 0.15) {
      riskFactors.add('Communication gaps may hinder coaching effectiveness');
    }
    
    // Convert to array and limit to most critical risks
    const riskArray = Array.from(riskFactors);
    
    // If no risks identified, return low-level concerns
    if (riskArray.length === 0) {
      return ['Monitor for consistency patterns', 'Ensure goal alignment remains optimal'];
    }
    
    return riskArray.slice(0, 5); // Return top 5 most critical risks
  }

  private calculateDataQualityScore(memories: CoachMemory[], goals: KpiTracker[]): number {
    if (memories.length === 0 && goals.length === 0) {
      return 0.1; // Very low quality with no data
    }
    
    let qualityScore = 0;
    let maxScore = 0;
    
    // Factor 1: Data volume (25% of score)
    const volumeScore = Math.min(1, (memories.length + goals.length) / 10);
    qualityScore += volumeScore * 0.25;
    maxScore += 0.25;
    
    if (memories.length > 0) {
      // Factor 2: Content richness (20% of score)
      const avgContentLength = memories.reduce((sum, m) => 
        sum + (m.content?.length || 0) + (m.summary?.length || 0), 0
      ) / memories.length;
      
      const contentRichnessScore = Math.min(1, avgContentLength / 500); // 500 chars = good quality
      qualityScore += contentRichnessScore * 0.2;
      maxScore += 0.2;
      
      // Factor 3: Metadata completeness (15% of score)
      let completeMetadataCount = 0;
      for (const memory of memories) {
        let metadataScore = 0;
        if (memory.emotionalContext?.mood) metadataScore += 0.2;
        if (memory.emotionalContext?.sentiment !== null && memory.emotionalContext?.sentiment !== undefined) metadataScore += 0.2;
        if (memory.coachingContext?.actionItems && memory.coachingContext.actionItems.length > 0) metadataScore += 0.2;
        if (memory.tags && memory.tags.length > 0) metadataScore += 0.2;
        if (memory.importance > 0) metadataScore += 0.2;
        
        if (metadataScore >= 0.6) completeMetadataCount++;
      }
      
      const metadataCompletenessScore = memories.length > 0 ? completeMetadataCount / memories.length : 0;
      qualityScore += metadataCompletenessScore * 0.15;
      maxScore += 0.15;
      
      // Factor 4: Recency and distribution (15% of score)
      const sortedMemories = memories.sort((a, b) => 
        new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime()
      );
      
      const now = new Date();
      const recentCount = sortedMemories.filter(m => {
        const daysDiff = (now.getTime() - new Date(m.conversationDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30; // Within last 30 days
      }).length;
      
      const recencyScore = Math.min(1, recentCount / Math.max(1, memories.length * 0.5));
      
      // Check for even distribution over time
      if (memories.length >= 3) {
        const timeSpan = new Date(sortedMemories[0].conversationDate).getTime() - 
                        new Date(sortedMemories[sortedMemories.length - 1].conversationDate).getTime();
        const avgInterval = timeSpan / (memories.length - 1);
        const idealInterval = 7 * 24 * 60 * 60 * 1000; // 1 week
        const distributionScore = Math.max(0, 1 - Math.abs(avgInterval - idealInterval) / idealInterval);
        
        const recencyDistributionScore = (recencyScore + distributionScore) / 2;
        qualityScore += recencyDistributionScore * 0.15;
      } else {
        qualityScore += recencyScore * 0.15;
      }
      maxScore += 0.15;
      
      // Factor 5: Sentiment data quality (10% of score)
      const sentimentDataCount = memories.filter(m => 
        m.emotionalContext?.sentiment !== null && 
        m.emotionalContext?.sentiment !== undefined &&
        Math.abs(m.emotionalContext.sentiment) >= 0.1 // Not just neutral
      ).length;
      
      const sentimentQualityScore = memories.length > 0 ? sentimentDataCount / memories.length : 0;
      qualityScore += sentimentQualityScore * 0.1;
      maxScore += 0.1;
    }
    
    if (goals.length > 0) {
      // Factor 6: Goal data completeness (15% of score)
      let goalQualitySum = 0;
      
      for (const goal of goals) {
        let goalScore = 0;
        const goalData = goal;
        
        if (goalData?.overallProgress !== undefined) goalScore += 0.3;
        if (goalData?.analytics?.consistencyScore !== undefined) goalScore += 0.3;
        if (goalData?.analytics?.velocityScore !== undefined) goalScore += 0.2;
        if (goalData?.status !== undefined) goalScore += 0.2;
        
        goalQualitySum += goalScore;
      }
      
      const goalQualityScore = goals.length > 0 ? goalQualitySum / goals.length : 0;
      qualityScore += goalQualityScore * 0.15;
      maxScore += 0.15;
    }
    
    // Normalize the score
    const finalScore = maxScore > 0 ? qualityScore / maxScore : 0;
    
    // Apply penalties for specific quality issues
    let penalties = 0;
    
    // Penalty for too few interactions
    if (memories.length < 3) {
      penalties += 0.2;
    }
    
    // Penalty for stale data (no recent interactions)
    if (memories.length > 0) {
      const mostRecent = memories.reduce((latest, memory) => 
        new Date(memory.conversationDate) > new Date(latest.conversationDate) ? memory : latest
      );
      
      const daysSinceLastInteraction = (Date.now() - new Date(mostRecent.conversationDate).getTime()) / 
                                      (1000 * 60 * 60 * 24);
      
      if (daysSinceLastInteraction > 14) {
        penalties += 0.1;
      }
      if (daysSinceLastInteraction > 30) {
        penalties += 0.1;
      }
    }
    
    // Apply penalties
    const penalizedScore = Math.max(0, finalScore - penalties);
    
    // Round to 2 decimal places
    return Math.round(penalizedScore * 100) / 100;
  }

  private analyzeEmotionalPatterns(memories: CoachMemory[]): unknown {
    if (memories.length === 0) {
      return {
        concerningTrends: [],
        positiveTrends: [],
        neutralTrends: ['Insufficient data for emotional pattern analysis'],
        overallTrend: 'neutral',
        volatility: 'unknown',
        confidence: 0.1
      };
    }
    
    // Sort memories chronologically
    const sortedMemories = memories.sort((a, b) => 
      new Date(a.conversationDate).getTime() - new Date(b.conversationDate).getTime()
    );
    
    const emotionalData = sortedMemories.map(m => ({
      date: new Date(m.conversationDate),
      sentiment: m.emotionalContext.sentiment || 0,
      mood: m.emotionalContext.mood || 'neutral',
      importance: m.importance
    }));
    
    // Calculate overall emotional metrics
    const avgSentiment = emotionalData.reduce((sum, d) => sum + d.sentiment, 0) / emotionalData.length;
    const sentimentValues = emotionalData.map(d => d.sentiment);
    const volatility = this.calculateVariance(sentimentValues);
    
    // Trend analysis - compare recent vs older sentiments
    const halfPoint = Math.floor(emotionalData.length / 2);
    const olderSentiments = emotionalData.slice(0, halfPoint);
    const recentSentiments = emotionalData.slice(halfPoint);
    
    const olderAvg = olderSentiments.length > 0 ? 
      olderSentiments.reduce((sum, d) => sum + d.sentiment, 0) / olderSentiments.length : 0;
    const recentAvg = recentSentiments.length > 0 ?
      recentSentiments.reduce((sum, d) => sum + d.sentiment, 0) / recentSentiments.length : 0;
    
    const trendDirection = recentAvg - olderAvg;
    
    const concerningTrends: string[] = [];
    const positiveTrends: string[] = [];
    const neutralTrends: string[] = [];
    
    // Identify concerning patterns
    if (avgSentiment < -0.3) {
      concerningTrends.push('Persistently negative emotional state');
    }
    
    if (trendDirection < -0.2) {
      concerningTrends.push('Declining emotional wellbeing over time');
    }
    
    if (volatility > 0.5) {
      concerningTrends.push('High emotional volatility - unstable mood patterns');
    }
    
    // Check for emotional extremes
    const extremeNegativeCount = sentimentValues.filter(s => s < -0.6).length;
    if (extremeNegativeCount > emotionalData.length * 0.2) {
      concerningTrends.push('Frequent episodes of very negative emotions');
    }
    
    // Analyze mood keywords for concerning patterns
    const negativeKeywords = ['depressed', 'anxious', 'stressed', 'overwhelmed', 'hopeless', 'angry', 'frustrated'];
    const concerningMoods = emotionalData.filter(d => 
      negativeKeywords.some(keyword => d.mood.toLowerCase().includes(keyword))
    );
    
    if (concerningMoods.length > emotionalData.length * 0.3) {
      concerningTrends.push('Frequent negative mood states requiring attention');
    }
    
    // Check for emotional plateaus (lack of positive progress)
    const recentSentiments7 = emotionalData.slice(-7);
    if (recentSentiments7.length >= 5) {
      const recentVariance = this.calculateVariance(recentSentiments7.map(d => d.sentiment));
      const recentAvg7 = recentSentiments7.reduce((sum, d) => sum + d.sentiment, 0) / recentSentiments7.length;
      
      if (recentVariance < 0.1 && recentAvg7 < 0.1) {
        concerningTrends.push('Emotional stagnation - limited positive emotional engagement');
      }
    }
    
    // Identify positive patterns
    if (avgSentiment > 0.3) {
      positiveTrends.push('Generally positive emotional state');
    }
    
    if (trendDirection > 0.2) {
      positiveTrends.push('Improving emotional wellbeing over time');
    }
    
    // Check for resilience patterns
    let recoveryCount = 0;
    for (let i = 1; i < emotionalData.length; i++) {
      if (emotionalData[i - 1].sentiment < -0.3 && emotionalData[i].sentiment > 0.1) {
        recoveryCount++;
      }
    }
    
    if (recoveryCount > 0) {
      positiveTrends.push('Shows emotional resilience and recovery ability');
    }
    
    // Check for increasing emotional intelligence
    const emotionalRangeEarly = Math.max(...olderSentiments.map(d => d.sentiment)) - 
                               Math.min(...olderSentiments.map(d => d.sentiment));
    const emotionalRangeRecent = Math.max(...recentSentiments.map(d => d.sentiment)) - 
                                Math.min(...recentSentiments.map(d => d.sentiment));
    
    if (emotionalRangeRecent > emotionalRangeEarly && recentAvg > olderAvg) {
      positiveTrends.push('Developing greater emotional range and expression');
    }
    
    // Check for consistency in positive emotions
    const positiveStreaks = this.findPositiveStreaks(sentimentValues);
    if (positiveStreaks.maxStreak >= 3) {
      positiveTrends.push('Capable of maintaining positive emotional states');
    }
    
    // Neutral observations
    if (volatility >= 0.2 && volatility <= 0.4) {
      neutralTrends.push('Normal emotional variability - healthy range');
    }
    
    if (Math.abs(avgSentiment) <= 0.2) {
      neutralTrends.push('Emotionally balanced overall');
    }
    
    // Determine overall trend
    let overallTrend = 'neutral';
    if (trendDirection > 0.15) {
      overallTrend = 'improving';
    } else if (trendDirection < -0.15) {
      overallTrend = 'declining';
    }
    
    // Calculate confidence based on data volume and consistency
    const dataVolumeScore = Math.min(1, emotionalData.length / 10);
    const consistencyScore = 1 - (volatility / 1.0); // Normalize volatility
    const confidence = (dataVolumeScore + Math.max(0, consistencyScore)) / 2;
    
    return {
      concerningTrends,
      positiveTrends,
      neutralTrends,
      overallTrend,
      volatility: volatility < 0.2 ? 'low' : volatility < 0.5 ? 'moderate' : 'high',
      confidence: Math.round(confidence * 100) / 100,
      averageSentiment: Math.round(avgSentiment * 100) / 100,
      trendDirection: Math.round(trendDirection * 100) / 100,
      dataPoints: emotionalData.length,
      recoveryEpisodes: recoveryCount
    };
  }
  
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  private findPositiveStreaks(sentimentValues: number[]): { maxStreak: number; currentStreak: number } {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const sentiment of sentimentValues) {
      if (sentiment > 0.2) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return { maxStreak, currentStreak };
  }

  private calculateWeeklyGoalProgress(
    goals: KpiTracker[],
    weekStart: Date,
    weekEnd: Date
  ): number {
    if (goals.length === 0) {
      return 0.0; // No goals to track
    }
    
    let totalProgress = 0;
    let goalCount = 0;
    
    for (const goal of goals) {
      const goalData = goal;
      
      // Check if goal was active during this week
      const goalCreated = new Date(goal.createdAt);
      if (goalCreated > weekEnd) {
        continue; // Goal created after this week
      }
      
      let weeklyProgress = 0;
      
      // Method 1: Use overallProgress if available and calculate weekly increment
      if (goalData?.overallProgress !== undefined) {
        // Estimate weekly progress based on total completion rate and time elapsed
        const totalDays = Math.max(1, (weekEnd.getTime() - goalCreated.getTime()) / (1000 * 60 * 60 * 24));
        const weeklyExpectedRate = 7 / totalDays; // Expected weekly portion
        const actualRate = goalData.overallProgress / 100;
        
        // Calculate if this week's progress meets expectations
        weeklyProgress = Math.min(1, actualRate / weeklyExpectedRate);
      }
      
      // Method 2: Use performance history data if available
      else if (goalData?.performanceHistory && goalData.performanceHistory.length > 0) {
        const weeklyData = goalData.performanceHistory.filter((entry: unknown) => {
          const entryDate = new Date(entry.date);
          return entryDate >= weekStart && entryDate <= weekEnd;
        });
        
        if (weeklyData.length > 0) {
          const completedDays = weeklyData.filter((entry: unknown) => entry.value > 0).length;
          weeklyProgress = completedDays / 7; // Normalize to 7 days
        }
      }
      
      // Method 3: Use consistencyScore as proxy
      else if (goalData?.analytics?.consistencyScore !== undefined) {
        // Assume consistency score represents weekly performance
        weeklyProgress = goalData.analytics.consistencyScore;
      }
      
      // Method 4: Use status indicators
      else if (goalData?.status !== undefined) {
        // Lower weight for status-based progress
        const statusValue = goalData.status === 'completed' ? 1.0 : goalData.status === 'in_progress' ? 0.7 : goalData.status === 'at_risk' ? 0.4 : 0.2;
        weeklyProgress = statusValue * 0.8;
      }
      
      // Method 5: Default estimation based on goal type patterns
      else {
        // Use heuristics based on goal category or type
        const goalName = (goalData?.title || goal.title || '').toLowerCase();
        
        if (goalName.includes('daily') || goalName.includes('habit')) {
          weeklyProgress = 0.6; // Assume moderate daily habit progress
        } else if (goalName.includes('weekly')) {
          weeklyProgress = 0.7; // Assume good weekly goal progress
        } else if (goalName.includes('milestone') || goalName.includes('project')) {
          weeklyProgress = 0.3; // Longer-term goals show slower weekly progress
        } else {
          weeklyProgress = 0.5; // Default moderate progress
        }
      }
      
      // Weight by goal importance if available
      const importance = goalData?.priority === 'critical' ? 10 : goalData?.priority === 'high' ? 8 : goalData?.priority === 'medium' ? 6 : 4;
      const weight = importance / 10;
      
      totalProgress += weeklyProgress * weight;
      goalCount += weight;
    }
    
    const averageProgress = goalCount > 0 ? totalProgress / goalCount : 0;
    
    // Apply realistic bounds
    return Math.max(0, Math.min(1, averageProgress));
  }

  private calculateMoodTrend(memories: CoachMemory[]): string {
    if (memories.length === 0) {
      return 'unknown';
    }
    
    if (memories.length === 1) {
      const sentiment = memories[0].emotionalContext.sentiment || 0;
      return sentiment > 0.1 ? 'positive' : sentiment < -0.1 ? 'negative' : 'neutral';
    }
    
    // Sort memories chronologically
    const sortedMemories = memories.sort((a, b) => 
      new Date(a.conversationDate).getTime() - new Date(b.conversationDate).getTime()
    );
    
    // Get sentiment values over time
    const sentimentValues = sortedMemories.map(m => m.emotionalContext.sentiment || 0);
    
    // Calculate trend using linear regression approach
    const n = sentimentValues.length;
    const xValues = Array.from({ length: n }, (_, i) => i); // 0, 1, 2, ...
    
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = sentimentValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * sentimentValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
    
    // Calculate slope (trend direction)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Calculate recent vs older average for additional validation
    const halfPoint = Math.floor(n / 2);
    const olderAvg = sentimentValues.slice(0, halfPoint).reduce((sum, val) => sum + val, 0) / halfPoint;
    const recentAvg = sentimentValues.slice(halfPoint).reduce((sum, val) => sum + val, 0) / (n - halfPoint);
    const avgDifference = recentAvg - olderAvg;
    
    // Calculate volatility to determine trend stability
    const mean = sumY / n;
    const variance = sentimentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const volatility = Math.sqrt(variance);
    
    // Determine trend based on slope and average difference
    const trendThreshold = 0.05; // Minimum change to consider significant
    const strongTrendThreshold = 0.15;
    const volatilityThreshold = 0.4;
    
    // High volatility makes trends less reliable
    if (volatility > volatilityThreshold) {
      if (Math.abs(slope) > strongTrendThreshold && Math.abs(avgDifference) > strongTrendThreshold) {
        return slope > 0 ? 'volatile-improving' : 'volatile-declining';
      } else {
        return 'volatile';
      }
    }
    
    // Strong trends (both slope and average difference agree)
    if (slope > strongTrendThreshold && avgDifference > strongTrendThreshold) {
      return 'strongly-improving';
    }
    if (slope < -strongTrendThreshold && avgDifference < -strongTrendThreshold) {
      return 'strongly-declining';
    }
    
    // Moderate trends
    if (slope > trendThreshold && avgDifference > trendThreshold) {
      return 'improving';
    }
    if (slope < -trendThreshold && avgDifference < -trendThreshold) {
      return 'declining';
    }
    
    // Check for recent changes (last 3 sessions)
    if (n >= 3) {
      const recent3 = sentimentValues.slice(-3);
      const recent3Avg = recent3.reduce((sum, val) => sum + val, 0) / 3;
      const earlier3 = sentimentValues.slice(-6, -3);
      
      if (earlier3.length > 0) {
        const earlier3Avg = earlier3.reduce((sum, val) => sum + val, 0) / earlier3.length;
        const recentChange = recent3Avg - earlier3Avg;
        
        if (Math.abs(recentChange) > trendThreshold) {
          return recentChange > 0 ? 'recently-improving' : 'recently-declining';
        }
      }
    }
    
    // Stable patterns
    if (Math.abs(slope) < trendThreshold && volatility < 0.2) {
      const overallMood = mean;
      if (overallMood > 0.2) {
        return 'stable-positive';
      } else if (overallMood < -0.2) {
        return 'stable-negative';
      } else {
        return 'stable-neutral';
      }
    }
    
    // Default case - neutral trend
    return 'neutral';
  }

  private extractAchievements(memories: CoachMemory[], goals: KpiTracker[]): string[] {
    const achievements: Set<string> = new Set();
    
    // Keywords indicating achievements and success
    const achievementKeywords = {
      'completion': ['completed', 'finished', 'done', 'accomplished', 'achieved'],
      'improvement': ['improved', 'better', 'progress', 'advancement', 'enhancement'],
      'breakthrough': ['breakthrough', 'breakthrough moment', 'eureka', 'lightbulb moment', 'finally understood'],
      'milestone': ['milestone', 'reached', 'attained', 'hit target', 'goal achieved'],
      'consistency': ['consistent', 'streak', 'every day', 'regular', 'habit formed'],
      'overcoming': ['overcame', 'conquered', 'beat', 'solved', 'resolved'],
      'mastery': ['mastered', 'expert', 'skilled', 'proficient', 'confident'],
      'positive_change': ['changed', 'transformed', 'new me', 'different', 'growth']
    };
    
    // Extract achievements from coaching memories
    for (const memory of memories) {
      const content = (memory.content + ' ' + memory.summary).toLowerCase();
      
      // Look for explicit achievement mentions
      for (const [category, keywords] of Object.entries(achievementKeywords)) {
        for (const keyword of keywords) {
          if (content.includes(keyword)) {
            // Extract context around the achievement
            const sentences = content.split(/[.!?]+/);
            const relevantSentence = sentences.find(sentence => sentence.includes(keyword));
            
            if (relevantSentence && relevantSentence.length > 10) {
              // Clean up and format the achievement
              const achievement = this.formatAchievement(relevantSentence.trim(), category);
              if (achievement && achievement.length < 100) {
                achievements.add(achievement);
              }
            }
          }
        }
      }
      
      // Look for positive sentiment spikes that might indicate achievements
      const sentiment = memory.emotionalContext.sentiment || 0;
      if (sentiment > 0.6 && memory.importance > 7) {
        // High positive sentiment + high importance likely indicates achievement
        const positiveWords = ['happy', 'excited', 'proud', 'thrilled', 'amazing', 'wonderful', 'fantastic'];
        const hasPositiveWords = positiveWords.some(word => content.includes(word));
        
        if (hasPositiveWords) {
          const summary = memory.summary;
          if (summary && summary.length < 80) {
            achievements.add(`Positive breakthrough: ${summary}`);
          }
        }
      }
    }
    
    // Extract achievements from goal data
    for (const goal of goals) {
      const goalData = goal;
      const goalName = goalData?.title || goal.title || 'goal';
      
      // Check completion rates
      if (goalData?.overallProgress >= 100) {
        achievements.add(`Successfully completed ${goalName}`);
      } else if (goalData?.overallProgress >= 80) {
        achievements.add(`Nearly completed ${goalName} (${goalData.overallProgress}%)`);
      } else if (goalData?.overallProgress >= 50) {
        achievements.add(`Made significant progress on ${goalName}`);
      }
      
      // Check consistency achievements
      if (goalData?.analytics?.consistencyScore >= 0.9) {
        achievements.add(`Maintained excellent consistency with ${goalName}`);
      } else if (goalData?.analytics?.consistencyScore >= 0.7) {
        achievements.add(`Developed good consistency habits for ${goalName}`);
      }
      
      // Check improvement trends
      if (goalData?.analytics?.velocityScore > 0.3) {
        achievements.add(`Strong upward progress trend in ${goalName}`);
      }
      
      // Check engagement
      if (goalData?.status === 'in_progress' && goalData?.overallProgress >= 80) {
        achievements.add(`High engagement and motivation with ${goalName}`);
      }
    }
    
    // Add pattern-based achievements
    if (memories.length >= 5) {
      // Consistency achievement
      const recentMemories = memories
        .sort((a, b) => new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime())
        .slice(0, 5);
      
      const avgImportance = recentMemories.reduce((sum, m) => sum + m.importance, 0) / recentMemories.length;
      if (avgImportance > 7) {
        achievements.add('Maintained high engagement with coaching sessions');
      }
      
      // Sentiment improvement achievement
      const halfPoint = Math.floor(memories.length / 2);
      const olderSentiment = memories.slice(0, halfPoint)
        .reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / halfPoint;
      const recentSentiment = memories.slice(halfPoint)
        .reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / (memories.length - halfPoint);
      
      if (recentSentiment > olderSentiment + 0.3) {
        achievements.add('Significant improvement in overall emotional wellbeing');
      }
    }
    
    // Convert to array and limit results
    const achievementArray = Array.from(achievements);
    
    // If no specific achievements found, look for general positive patterns
    if (achievementArray.length === 0) {
      const defaultAchievements: string[] = [];
      
      if (memories.length > 0) {
        const avgSentiment = memories.reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / memories.length;
        
        if (avgSentiment > 0.2) {
          defaultAchievements.push('Maintained positive attitude throughout coaching');
        }
        
        if (memories.length >= 3) {
          defaultAchievements.push('Demonstrated commitment by engaging in regular coaching sessions');
        }
        
        const actionItemMemories = memories.filter(m => 
          m.coachingContext.actionItems && m.coachingContext.actionItems.length > 0
        );
        
        if (actionItemMemories.length > memories.length * 0.6) {
          defaultAchievements.push('Consistently generated actionable insights from coaching');
        }
      }
      
      return defaultAchievements.slice(0, 3);
    }
    
    return achievementArray.slice(0, 5);
  }
  
  private formatAchievement(sentence: string, category: string): string {
    // Clean up the sentence
    let cleaned = sentence.replace(/\s+/g, ' ').trim();
    
    // Remove common prefixes
    const prefixesToRemove = ['i ', 'we ', 'user ', 'client ', 'they '];
    for (const prefix of prefixesToRemove) {
      if (cleaned.toLowerCase().startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length);
      }
    }
    
    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.substring(1);
    }
    
    // Add category context if helpful
    const categoryPrefixes: { [key: string]: string } = {
      'breakthrough': 'Breakthrough: ',
      'milestone': 'Milestone: ',
      'mastery': 'Skill development: ',
      'overcoming': 'Challenge overcome: '
    };
    
    if (categoryPrefixes[category] && !cleaned.includes(':')) {
      cleaned = categoryPrefixes[category] + cleaned.toLowerCase();
    }
    
    return cleaned;
  }

  private extractChallenges(memories: CoachMemory[], goals: KpiTracker[]): string[] {
    const challenges: Set<string> = new Set();
    
    // Keywords indicating challenges and difficulties
    const challengeKeywords = {
      'consistency': ['inconsistent', 'irregular', 'missed sessions', 'skipped', 'forgot', 'struggle to maintain'],
      'time_management': ['no time', 'busy', 'rushed', 'overwhelmed', 'schedule conflicts', 'time pressure'],
      'motivation': ['unmotivated', 'lazy', 'tired', 'no energy', 'don\'t want to', 'lost interest'],
      'focus': ['distracted', 'scattered', 'unfocused', 'can\'t concentrate', 'mind wanders', 'attention issues'],
      'confidence': ['doubt', 'uncertain', 'nervous', 'afraid', 'worried', 'insecure', 'imposter syndrome'],
      'follow_through': ['didn\'t complete', 'abandoned', 'gave up', 'quit', 'stopped halfway', 'incomplete'],
      'stress': ['stressed', 'anxious', 'pressure', 'overwhelmed', 'burned out', 'panic'],
      'planning': ['unorganized', 'chaotic', 'random', 'no plan', 'improvising', 'winging it'],
      'support': ['alone', 'no support', 'nobody understands', 'isolated', 'on my own'],
      'resources': ['can\'t afford', 'no resources', 'limited budget', 'financial strain'],
      'health': ['sick', 'tired', 'exhausted', 'health issues', 'not feeling well'],
      'external': ['family issues', 'work problems', 'relationship trouble', 'external pressure']
    };
    
    // Extract challenges from coaching memories
    for (const memory of memories) {
      const content = (memory.content + ' ' + memory.summary).toLowerCase();
      const importance = memory.importance;
      const sentiment = memory.emotionalContext.sentiment || 0;
      
      // Weight challenges by negative sentiment and high importance
      const challengeWeight = (importance > 6 && sentiment < -0.2) ? 2 : 1;
      
      for (const [category, keywords] of Object.entries(challengeKeywords)) {
        for (const keyword of keywords) {
          if (content.includes(keyword)) {
            const sentences = content.split(/[.!?]+/);
            const relevantSentence = sentences.find(sentence => sentence.includes(keyword));
            
            if (relevantSentence && relevantSentence.length > 10) {
              const challenge = this.formatChallenge(relevantSentence.trim(), category);
              if (challenge && challenge.length < 100) {
                // Add multiple times if high weight (indicates recurring issue)
                for (let i = 0; i < challengeWeight; i++) {
                  challenges.add(challenge);
                }
              }
            }
          }
        }
      }
      
      // Look for high importance + negative sentiment patterns
      if (importance > 7 && sentiment < -0.4) {
        if (memory.summary && !memory.summary.toLowerCase().includes('positive')) {
          challenges.add(`Significant challenge: ${memory.summary}`);
        }
      }
    }
    
    // Extract challenges from goal data
    for (const goal of goals) {
      const goalData = goal;
      const goalName = goalData?.title || goal.title || 'goal';
      
      // Low completion rate indicates challenges
      if (goalData?.overallProgress < 30) {
        challenges.add(`Difficulty making progress on ${goalName}`);
      } else if (goalData?.overallProgress < 50) {
        challenges.add(`Slow progress with ${goalName}`);
      }
      
      // Consistency issues
      if (goalData?.analytics?.consistencyScore < 0.4) {
        challenges.add(`Maintaining consistency with ${goalName}`);
      } else if (goalData?.analytics?.consistencyScore < 0.6) {
        challenges.add(`Irregular engagement with ${goalName}`);
      }
      
      // Declining trends
      if (goalData?.analytics?.velocityScore < -0.2) {
        challenges.add(`Declining performance in ${goalName}`);
      }
      
      // Low engagement
      if (goalData?.status === 'at_risk' || goalData?.status === 'paused') {
        challenges.add(`Low motivation for ${goalName}`);
      }
    }
    
    // Pattern-based challenge detection
    if (memories.length >= 5) {
      const recentMemories = memories
        .sort((a, b) => new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime())
        .slice(0, 5);
      
      // Declining engagement pattern
      const engagementTrend = this.calculateEngagementTrend(recentMemories);
      if (engagementTrend < -1) {
        challenges.add('Declining engagement with coaching sessions');
      }
      
      // Emotional volatility
      const sentiments = recentMemories.map(m => m.emotionalContext.sentiment || 0);
      const volatility = this.calculateVariance(sentiments);
      if (volatility > 0.5) {
        challenges.add('High emotional volatility affecting consistency');
      }
      
      // Frequent negative sessions
      const negativeSessions = recentMemories.filter(m => (m.emotionalContext.sentiment || 0) < -0.3).length;
      if (negativeSessions > recentMemories.length * 0.4) {
        challenges.add('Frequent negative emotional states during coaching');
      }
      
      // Low action item follow-through
      const actionItemSessions = recentMemories.filter(m => 
        m.coachingContext.actionItems && m.coachingContext.actionItems.length > 0
      ).length;
      if (actionItemSessions < recentMemories.length * 0.3) {
        challenges.add('Difficulty generating or following through on action items');
      }
    }
    
    // Communication challenges
    const communicationIssues = memories.filter(m => {
      const content = (m.content + ' ' + m.summary).toLowerCase();
      return ['don\'t understand', 'confused', 'unclear', 'miscommunication', 'not getting it'].some(phrase => 
        content.includes(phrase)
      );
    }).length;
    
    if (communicationIssues > memories.length * 0.2) {
      challenges.add('Communication barriers affecting coaching effectiveness');
    }
    
    // Convert to array and remove duplicates
    const challengeArray = Array.from(challenges);
    
    // If no specific challenges found, infer from general patterns
    if (challengeArray.length === 0) {
      const defaultChallenges: string[] = [];
      
      if (memories.length > 0) {
        const avgSentiment = memories.reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / memories.length;
        const avgImportance = memories.reduce((sum, m) => sum + m.importance, 0) / memories.length;
        
        if (avgSentiment < -0.1) {
          defaultChallenges.push('Overall emotional challenges affecting wellbeing');
        }
        
        if (avgImportance < 5) {
          defaultChallenges.push('Low engagement levels with coaching process');
        }
        
        if (memories.length < 3) {
          defaultChallenges.push('Limited coaching interaction history');
        }
      } else {
        defaultChallenges.push('Need to establish regular coaching engagement');
        defaultChallenges.push('Building foundational coaching relationship');
      }
      
      return defaultChallenges.slice(0, 3);
    }
    
    // Prioritize challenges by frequency and severity
    const challengeFrequency: { [key: string]: number } = {};
    challengeArray.forEach(challenge => {
      challengeFrequency[challenge] = (challengeFrequency[challenge] || 0) + 1;
    });
    
    const sortedChallenges = Object.entries(challengeFrequency)
      .sort(([,a], [,b]) => b - a)
      .map(([challenge]) => challenge)
      .slice(0, 5);
    
    return sortedChallenges;
  }
  
  private formatChallenge(sentence: string, category: string): string {
    // Clean up the sentence
    let cleaned = sentence.replace(/\s+/g, ' ').trim();
    
    // Remove common prefixes
    const prefixesToRemove = ['i ', 'we ', 'user ', 'client ', 'they '];
    for (const prefix of prefixesToRemove) {
      if (cleaned.toLowerCase().startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length);
      }
    }
    
    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.substring(1);
    }
    
    // Add category context if helpful
    const categoryContexts: { [key: string]: string } = {
      'time_management': 'Time management: ',
      'consistency': 'Consistency issue: ',
      'motivation': 'Motivation challenge: ',
      'follow_through': 'Follow-through difficulty: ',
      'confidence': 'Confidence issue: ',
      'support': 'Support system: ',
      'resources': 'Resource constraint: '
    };
    
    if (categoryContexts[category] && !cleaned.includes(':')) {
      cleaned = categoryContexts[category] + cleaned.toLowerCase();
    }
    
    return cleaned;
  }
  
  private calculateEngagementTrend(memories: CoachMemory[]): number {
    if (memories.length < 2) return 0;
    
    const engagementValues = memories.map(m => m.importance);
    const halfPoint = Math.floor(engagementValues.length / 2);
    
    const olderAvg = engagementValues.slice(0, halfPoint).reduce((sum, val) => sum + val, 0) / halfPoint;
    const recentAvg = engagementValues.slice(halfPoint).reduce((sum, val) => sum + val, 0) / (engagementValues.length - halfPoint);
    
    return recentAvg - olderAvg;
  }

  private async generateWeeklyInsights(
    memories: CoachMemory[],
    analytics: UserAnalytics | null
  ): Promise<MemoryInsight[]> {
    const insights: MemoryInsight[] = [];
    
    if (memories.length === 0) {
      insights.push({
        type: 'concern',
        title: 'Limited Coaching Data',
        description: 'No coaching interactions recorded this week',
        relevanceScore: 0.9,
        actionable: true,
        recommendations: [
          'Schedule coaching sessions for next week',
          'Set up regular coaching cadence',
          'Identify barriers to coaching engagement'
        ]
      });
      return insights;
    }
    
    // Calculate key metrics for the week
    const avgSentiment = memories.reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / memories.length;
    const avgImportance = memories.reduce((sum, m) => sum + m.importance, 0) / memories.length;
    const totalSessions = memories.length;
    
    // Sentiment Analysis Insights
    if (avgSentiment > 0.3) {
      insights.push({
        type: 'achievement',
        title: 'Strong Positive Emotional Engagement',
        description: `Maintained consistently positive sentiment (${Math.round(avgSentiment * 100) / 100}) across coaching sessions this week`,
        relevanceScore: 0.85,
        actionable: true,
        recommendations: [
          'Identify and reinforce the factors contributing to positive experiences',
          'Document successful coaching approaches for future reference',
          'Consider expanding on topics that generate positive engagement'
        ]
      });
    } else if (avgSentiment < -0.3) {
      insights.push({
        type: 'concern',
        title: 'Persistent Negative Emotional Patterns',
        description: `Consistently negative sentiment (${Math.round(avgSentiment * 100) / 100}) indicates potential coaching approach issues`,
        relevanceScore: 0.9,
        actionable: true,
        recommendations: [
          'Review and adjust coaching methodology',
          'Explore external stressors affecting mood',
          'Consider additional support resources',
          'Schedule more frequent check-ins'
        ]
      });
    }
    
    // Engagement Analysis
    if (avgImportance > 7.5) {
      insights.push({
        type: 'pattern',
        title: 'High Engagement Levels Maintained',
        description: `Excellent session engagement (${Math.round(avgImportance * 10) / 10}/10) indicates strong coaching alignment`,
        relevanceScore: 0.8,
        actionable: true,
        recommendations: [
          'Continue current coaching strategies',
          'Explore opportunities to deepen engagement further',
          'Consider introducing advanced coaching techniques'
        ]
      });
    } else if (avgImportance < 4) {
      insights.push({
        type: 'concern',
        title: 'Low Engagement Warning',
        description: `Below-average session engagement (${Math.round(avgImportance * 10) / 10}/10) suggests need for strategy adjustment`,
        relevanceScore: 0.95,
        actionable: true,
        recommendations: [
          'Reassess coaching goals and alignment',
          'Explore barriers to engagement',
          'Consider alternative coaching approaches',
          'Increase session interactivity'
        ]
      });
    }
    
    // Session Frequency Insights
    if (totalSessions >= 5) {
      insights.push({
        type: 'achievement',
        title: 'Excellent Coaching Consistency',
        description: `${totalSessions} coaching sessions this week demonstrates strong commitment`,
        relevanceScore: 0.75,
        actionable: true,
        recommendations: [
          'Maintain this excellent consistency pattern',
          'Consider setting weekly session goals',
          'Track long-term consistency trends'
        ]
      });
    } else if (totalSessions <= 1) {
      insights.push({
        type: 'concern',
        title: 'Limited Weekly Coaching Activity',
        description: `Only ${totalSessions} session(s) this week may limit coaching effectiveness`,
        relevanceScore: 0.8,
        actionable: true,
        recommendations: [
          'Set minimum weekly session targets',
          'Schedule regular coaching appointments',
          'Identify and address barriers to regular coaching'
        ]
      });
    }
    
    // Progress Pattern Analysis
    if (memories.length >= 3) {
      const sortedMemories = memories.sort((a, b) => 
        new Date(a.conversationDate).getTime() - new Date(b.conversationDate).getTime()
      );
      
      const earlyAvgSentiment = sortedMemories.slice(0, Math.ceil(memories.length / 2))
        .reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / Math.ceil(memories.length / 2);
      const lateAvgSentiment = sortedMemories.slice(-Math.ceil(memories.length / 2))
        .reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / Math.ceil(memories.length / 2);
      
      const sentimentImprovement = lateAvgSentiment - earlyAvgSentiment;
      
      if (sentimentImprovement > 0.2) {
        insights.push({
          type: 'improvement',
          title: 'Positive Emotional Trajectory',
          description: `Significant improvement in emotional state throughout the week (${Math.round(sentimentImprovement * 100) / 100} increase)`,
          relevanceScore: 0.9,
          actionable: true,
          recommendations: [
            'Continue current coaching approach as it\'s showing positive results',
            'Document what specifically is working well',
            'Build on this momentum in next week\'s sessions'
          ]
        });
      } else if (sentimentImprovement < -0.2) {
        insights.push({
          type: 'concern',
          title: 'Declining Emotional State',
          description: `Emotional state declined throughout the week (${Math.round(Math.abs(sentimentImprovement) * 100) / 100} decrease)`,
          relevanceScore: 0.95,
          actionable: true,
          recommendations: [
            'Investigate factors causing emotional decline',
            'Adjust coaching approach or focus areas',
            'Consider additional support or resources',
            'Prioritize emotional wellbeing in upcoming sessions'
          ]
        });
      }
    }
    
    // Content Analysis Insights
    const actionItemMemories = memories.filter(m => 
      m.coachingContext.actionItems && m.coachingContext.actionItems.length > 0
    );
    
    if (actionItemMemories.length > memories.length * 0.7) {
      insights.push({
        type: 'pattern',
        title: 'Strong Action-Oriented Coaching',
        description: `${actionItemMemories.length}/${memories.length} sessions produced concrete action items`,
        relevanceScore: 0.8,
        actionable: true,
        recommendations: [
          'Continue focus on actionable outcomes',
          'Track completion rates of action items',
          'Build accountability mechanisms for follow-through'
        ]
      });
    } else if (actionItemMemories.length < memories.length * 0.3) {
      insights.push({
        type: 'improvement',
        title: 'Opportunity for More Actionable Coaching',
        description: `Only ${actionItemMemories.length}/${memories.length} sessions generated specific action items`,
        relevanceScore: 0.7,
        actionable: true,
        recommendations: [
          'Focus on creating concrete next steps in each session',
          'Ask "What specific action will you take?" more frequently',
          'Help translate insights into actionable commitments'
        ]
      });
    }
    
    // Memory Quality Insights
    const richMemories = memories.filter(m => 
      (m.content?.length || 0) > 200 && (m.summary?.length || 0) > 50
    );
    
    if (richMemories.length > memories.length * 0.8) {
      insights.push({
        type: 'pattern',
        title: 'High-Quality Coaching Interactions',
        description: 'Sessions consistently produce rich, detailed coaching memories',
        relevanceScore: 0.7,
        actionable: true,
        recommendations: [
          'Continue encouraging detailed exploration of topics',
          'Maintain depth of coaching conversations',
          'Use this rich data for deeper pattern analysis'
        ]
      });
    }
    
    // Analytics Integration
    if (analytics) {
      const analyticsData = analytics.coachingMetrics as unknown;
      if (analyticsData?.session_frequency && analyticsData.session_frequency < 2) {
        insights.push({
          type: 'improvement',
          title: 'Opportunity to Increase Session Frequency',
          description: `Current frequency of ${analyticsData.session_frequency} sessions/week could be optimized`,
          relevanceScore: 0.6,
          actionable: true,
          recommendations: [
            'Consider increasing to 3-4 sessions per week for better momentum',
            'Schedule sessions at consistent times',
            'Track how frequency affects coaching outcomes'
          ]
        });
      }
    }
    
    // Sort insights by relevance score and return top insights
    return insights.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 6);
  }

  private generateNextWeekFocus(
    insights: MemoryInsight[],
    recommendations: CoachingRecommendation[]
  ): string[] {
    const focusAreas: Set<string> = new Set();
    
    // Priority 1: Address critical concerns from insights
    const criticalInsights = insights.filter(insight => 
      insight.type === 'concern' && insight.relevanceScore > 0.8
    );
    
    for (const insight of criticalInsights) {
      switch (insight.title) {
        case 'Persistent Negative Emotional Patterns':
          focusAreas.add('Address emotional wellbeing and mood challenges');
          break;
        case 'Low Engagement Warning':
          focusAreas.add('Rebuild coaching engagement and motivation');
          break;
        case 'Limited Weekly Coaching Activity':
          focusAreas.add('Establish consistent coaching schedule and routine');
          break;
        case 'Declining Emotional State':
          focusAreas.add('Prioritize emotional support and stability');
          break;
        case 'Limited Coaching Data':
          focusAreas.add('Initiate regular coaching interactions');
          break;
      }
    }
    
    // Priority 2: Build on achievements and improvements
    const achievementInsights = insights.filter(insight => 
      (insight.type === 'achievement' || insight.type === 'improvement') && insight.relevanceScore > 0.7
    );
    
    for (const insight of achievementInsights) {
      switch (insight.title) {
        case 'Strong Positive Emotional Engagement':
          focusAreas.add('Expand on successful coaching approaches');
          break;
        case 'High Engagement Levels Maintained':
          focusAreas.add('Deepen coaching exploration and advanced techniques');
          break;
        case 'Excellent Coaching Consistency':
          focusAreas.add('Maintain momentum and set stretch goals');
          break;
        case 'Positive Emotional Trajectory':
          focusAreas.add('Continue building on emotional progress');
          break;
        case 'Strong Action-Oriented Coaching':
          focusAreas.add('Enhance action item tracking and accountability');
          break;
      }
    }
    
    // Priority 3: Address improvement opportunities
    const improvementInsights = insights.filter(insight => 
      insight.type === 'improvement' && insight.relevanceScore > 0.6
    );
    
    for (const insight of improvementInsights) {
      switch (insight.title) {
        case 'Opportunity for More Actionable Coaching':
          focusAreas.add('Increase focus on concrete action planning');
          break;
        case 'Opportunity to Increase Session Frequency':
          focusAreas.add('Optimize coaching session frequency and timing');
          break;
      }
    }
    
    // Priority 4: Address high-priority recommendations
    const urgentRecommendations = recommendations.filter(rec => 
      rec.priority === 'urgent' || rec.priority === 'high'
    );
    
    for (const rec of urgentRecommendations) {
      switch (rec.type) {
        case 'approach':
          focusAreas.add(`Refine coaching approach: ${rec.title.toLowerCase()}`);
          break;
        case 'technique':
          focusAreas.add(`Implement new technique: ${rec.title.toLowerCase()}`);
          break;
        case 'goal':
          focusAreas.add(`Goal adjustment: ${rec.title.toLowerCase()}`);
          break;
        case 'schedule':
          focusAreas.add(`Schedule optimization: ${rec.title.toLowerCase()}`);
          break;
        case 'topic':
          focusAreas.add(`Explore topic: ${rec.title.toLowerCase()}`);
          break;
      }
    }
    
    // Priority 5: Pattern-based focus areas
    const patternInsights = insights.filter(insight => insight.type === 'pattern');
    if (patternInsights.length > 0) {
      const hasHighQuality = patternInsights.some(insight => 
        insight.title.includes('High-Quality') || insight.title.includes('Strong Action-Oriented')
      );
      if (hasHighQuality) {
        focusAreas.add('Leverage coaching strengths for deeper breakthroughs');
      }
    }
    
    // Default focus areas if no specific insights
    if (focusAreas.size === 0) {
      focusAreas.add('Establish foundational coaching relationship');
      focusAreas.add('Identify core goals and priorities');
      focusAreas.add('Build consistent coaching engagement');
    }
    
    // Complementary focus areas based on common patterns
    const currentFocusArray = Array.from(focusAreas);
    
    // Balance emotional and practical focus
    const hasEmotionalFocus = currentFocusArray.some(focus => 
      focus.toLowerCase().includes('emotional') || focus.toLowerCase().includes('mood')
    );
    const hasPracticalFocus = currentFocusArray.some(focus => 
      focus.toLowerCase().includes('action') || focus.toLowerCase().includes('goal')
    );
    
    if (hasEmotionalFocus && !hasPracticalFocus && focusAreas.size < 4) {
      focusAreas.add('Balance emotional work with practical action steps');
    } else if (hasPracticalFocus && !hasEmotionalFocus && focusAreas.size < 4) {
      focusAreas.add('Integrate emotional awareness with goal achievement');
    }
    
    // Add consistency focus if not already present
    const hasConsistencyFocus = currentFocusArray.some(focus => 
      focus.toLowerCase().includes('consistency') || focus.toLowerCase().includes('routine')
    );
    if (!hasConsistencyFocus && focusAreas.size < 4) {
      focusAreas.add('Strengthen consistency and follow-through patterns');
    }
    
    // Add growth/development focus
    const hasGrowthFocus = currentFocusArray.some(focus => 
      focus.toLowerCase().includes('expand') || focus.toLowerCase().includes('deepen') || 
      focus.toLowerCase().includes('advance')
    );
    if (!hasGrowthFocus && focusAreas.size < 4 && criticalInsights.length === 0) {
      focusAreas.add('Explore new areas for personal growth');
    }
    
    // Convert to array and prioritize
    const focusArray = Array.from(focusAreas);
    
    // Sort by priority: concerns first, then improvements, then growth
    const prioritizedFocus = [
      ...focusArray.filter(focus => 
        focus.toLowerCase().includes('address') || focus.toLowerCase().includes('rebuild') ||
        focus.toLowerCase().includes('establish') || focus.toLowerCase().includes('prioritize')
      ),
      ...focusArray.filter(focus => 
        focus.toLowerCase().includes('enhance') || focus.toLowerCase().includes('improve') ||
        focus.toLowerCase().includes('optimize') || focus.toLowerCase().includes('increase')
      ),
      ...focusArray.filter(focus => 
        focus.toLowerCase().includes('expand') || focus.toLowerCase().includes('explore') ||
        focus.toLowerCase().includes('develop') || focus.toLowerCase().includes('leverage')
      ),
      ...focusArray.filter(focus => 
        !focus.toLowerCase().includes('address') && !focus.toLowerCase().includes('rebuild') &&
        !focus.toLowerCase().includes('establish') && !focus.toLowerCase().includes('prioritize') &&
        !focus.toLowerCase().includes('enhance') && !focus.toLowerCase().includes('improve') &&
        !focus.toLowerCase().includes('optimize') && !focus.toLowerCase().includes('increase') &&
        !focus.toLowerCase().includes('expand') && !focus.toLowerCase().includes('explore') &&
        !focus.toLowerCase().includes('develop') && !focus.toLowerCase().includes('leverage')
      )
    ];
    
    // Remove duplicates while preserving order
    const uniquePrioritizedFocus = prioritizedFocus.filter((focus, index) => 
      prioritizedFocus.indexOf(focus) === index
    );
    
    // Return top 4 focus areas for manageable scope
    return uniquePrioritizedFocus.slice(0, 4);
  }

  /**
   * Calculate user percentile against peer benchmarks
   */
  private async calculateUserPercentile(userId: string, coachingMetrics: unknown): Promise<number> {
    try {
      // Get comparative data from other users (anonymized)
      const peerAnalytics = await UserAnalytics.findAll({
        attributes: [
          'coachingMetrics'
        ],
        where: {
          userId: { [Op.ne]: userId },
          calculatedAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        limit: 1000 // Sample size
      });

      if (peerAnalytics.length < 10) {
        return 50; // Not enough data for comparison
      }

      // Extract goal completion rates for comparison
      const userGoalCompletion = coachingMetrics.goalCompletionRate || 0;
      const peerCompletionRates = peerAnalytics
        .map(p => p.coachingMetrics?.goalCompletionRate || 0)
        .filter(rate => rate > 0);

      if (peerCompletionRates.length === 0) {
        return 50;
      }

      // Calculate percentile ranking
      const lowerPerformers = peerCompletionRates.filter(rate => rate < userGoalCompletion).length;
      const percentile = Math.round((lowerPerformers / peerCompletionRates.length) * 100);

      return Math.max(1, Math.min(99, percentile));
    } catch (error) {
      logger.error('Error calculating user percentile:', error);
      return 50; // Default to median
    }
  }

  /**
   * Calculate coaching effectiveness based on multiple factors
   */
  private calculateCoachingEffectiveness(memories: CoachMemory[], goals: KpiTracker[]): number {
    if (memories.length === 0) return 0.5;

    let effectivenessScore = 0;
    let totalWeight = 0;

    // Factor 1: Goal achievement rate (40% weight)
    if (goals.length > 0) {
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const goalEffectiveness = completedGoals / goals.length;
      effectivenessScore += goalEffectiveness * 0.4;
      totalWeight += 0.4;
    }

    // Factor 2: User satisfaction trend (30% weight)
    const satisfactionScore = this.calculateSatisfactionScore(memories) / 10; // Convert to 0-1
    effectivenessScore += satisfactionScore * 0.3;
    totalWeight += 0.3;

    // Factor 3: Engagement consistency (20% weight)
    const engagementScore = (this.calculateResponsiveness(memories) + this.calculateParticipationScore(memories)) / 2;
    effectivenessScore += engagementScore * 0.2;
    totalWeight += 0.2;

    // Factor 4: Personal growth indicators (10% weight)
    const growthScore = (
      this.calculateSkillImprovement(memories) +
      this.calculateConfidenceIncrease(memories)
    ) / 2;
    effectivenessScore += growthScore * 0.1;
    totalWeight += 0.1;

    return totalWeight > 0 ? effectivenessScore / totalWeight : 0.5;
  }

  /**
   * Calculate personal growth trajectory over time
   */
  private calculateGrowthTrajectory(memories: CoachMemory[], goals: KpiTracker[]): number {
    if (memories.length < 3) return 0; // Need minimum data

    // Sort memories by date
    const sortedMemories = memories.sort(
      (a, b) => new Date(a.conversationDate).getTime() - new Date(b.conversationDate).getTime()
    );

    // Split into periods for trend analysis
    const third = Math.floor(sortedMemories.length / 3);
    const earlyPeriod = sortedMemories.slice(0, third);
    const middlePeriod = sortedMemories.slice(third, third * 2);
    const recentPeriod = sortedMemories.slice(third * 2);

    const calculatePeriodScore = (periodMemories: CoachMemory[]) => {
      if (periodMemories.length === 0) return 0;
      
      const avgSentiment = periodMemories.reduce(
        (sum, m) => sum + (m.emotionalContext.sentiment || 0), 0
      ) / periodMemories.length;
      
      const avgImportance = periodMemories.reduce(
        (sum, m) => sum + (m.importance || 5), 0
      ) / periodMemories.length;
      
      return (avgSentiment + 1) / 2 * 0.6 + (avgImportance / 10) * 0.4; // Normalize to 0-1
    };

    const earlyScore = calculatePeriodScore(earlyPeriod);
    const middleScore = calculatePeriodScore(middlePeriod);
    const recentScore = calculatePeriodScore(recentPeriod);

    // Calculate trajectory (rate of change)
    const trajectory = (recentScore - earlyScore) / Math.max(1, sortedMemories.length / 10);
    
    // Factor in goal progress
    const activeGoals = goals.filter(g => g.status === 'in_progress' || g.status === 'completed');
    const goalProgressTrend = activeGoals.length > 0 ? 
      activeGoals.reduce((sum, g) => sum + g.overallProgress, 0) / (activeGoals.length * 100) : 0;

    // Combine trajectory with goal progress
    return trajectory * 0.7 + goalProgressTrend * 0.3;
  }

  /**
   * Calculate goal achievement velocity (goals completed per time period)
   */
  private calculateAchievementVelocity(goals: KpiTracker[]): number {
    if (goals.length === 0) return 0;

    const completedGoals = goals.filter(g => g.status === 'completed');
    if (completedGoals.length === 0) return 0;

    // Calculate time span of goal activity
    const allDates = goals.map(g => g.startDate.getTime());
    const earliestDate = Math.min(...allDates);
    const latestDate = Math.max(...allDates, Date.now());
    const timeSpanMonths = (latestDate - earliestDate) / (1000 * 60 * 60 * 24 * 30);

    if (timeSpanMonths < 0.5) return completedGoals.length * 2; // Less than half month, annualize

    return completedGoals.length / timeSpanMonths;
  }

  /**
   * Calculate consistency index for engagement patterns
   */
  private calculateConsistencyIndex(memories: CoachMemory[]): number {
    if (memories.length < 3) return 0.5;

    // Sort by date
    const sortedMemories = memories.sort(
      (a, b) => new Date(a.conversationDate).getTime() - new Date(b.conversationDate).getTime()
    );

    // Calculate intervals between sessions
    const intervals = [];
    for (let i = 1; i < sortedMemories.length; i++) {
      const daysBetween = Math.floor(
        (new Date(sortedMemories[i].conversationDate).getTime() - 
         new Date(sortedMemories[i-1].conversationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      intervals.push(daysBetween);
    }

    // Calculate consistency (lower variance = higher consistency)
    const meanInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce(
      (sum, interval) => sum + Math.pow(interval - meanInterval, 2), 0
    ) / intervals.length;
    
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = meanInterval > 0 ? standardDeviation / meanInterval : 1;

    // Convert to consistency score (0-1, higher = more consistent)
    const consistencyScore = Math.max(0, 1 - (coefficientOfVariation / 2));

    return Math.min(1, consistencyScore);
  }

  /**
   * Calculate consistent days from performance history
   */
  private calculateConsistentDays(performanceHistory: unknown[]): number {
    if (performanceHistory.length === 0) return 0;

    // Sort by date
    const sorted = performanceHistory.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let consistentDays = 0;
    const targetValue = sorted.reduce((sum, entry) => sum + entry.value, 0) / sorted.length;

    for (const entry of sorted) {
      // Consider consistent if within 20% of target
      if (Math.abs(entry.value - targetValue) / targetValue <= 0.2) {
        consistentDays++;
      }
    }

    return consistentDays;
  }

  /**
   * Analyze habit formation from all goals (when no explicit habit goals exist)
   */
  private analyzeHabitFormationFromAllGoals(goals: KpiTracker[]): number {
    if (goals.length === 0) return 0.5;

    // Look for goals with regular action items and consistent progress
    let habitFormationScore = 0;
    let scoredGoals = 0;

    for (const goal of goals) {
      const actionItems = goal.coachingData.actionItems || [];
      const completedItems = actionItems.filter(item => item.status === 'completed').length;
      
      if (actionItems.length > 0) {
        const completionRate = completedItems / actionItems.length;
        const consistencyBonus = goal.analytics.consistencyScore || 0.5;
        
        const goalHabitScore = (completionRate * 0.6) + (consistencyBonus * 0.4);
        habitFormationScore += goalHabitScore;
        scoredGoals++;
      }
    }

    return scoredGoals > 0 ? habitFormationScore / scoredGoals : 0.5;
  }

  // ========================================
  // Analytics & User Intelligence Methods
  // ========================================

  /**
   * Calculate NPS score for a user within a specific timeframe
   */
  async calculateNPSScore(userId: string, timeframe: string): Promise<number> {
    try {
      logger.info(`Calculating NPS score for user ${userId} in timeframe ${timeframe}`);

      // Parse timeframe and calculate date range
      const { startDate, endDate } = this.parseTimeframe(timeframe);

      // Get user analytics within the timeframe
      const userAnalytics = await UserAnalytics.findAll({
        where: {
          userId,
          periodStart: { [Op.gte]: startDate },
          periodEnd: { [Op.lte]: endDate },
        },
        order: [['periodStart', 'DESC']],
      });

      if (userAnalytics.length === 0) {
        logger.warn(`No analytics data found for user ${userId} in timeframe ${timeframe}`);
        return 7; // Neutral NPS score
      }

      // Calculate average NPS from available data
      const npsScores = userAnalytics.map(analytics => analytics.kpiMetrics.npsScore);
      const averageNPS = npsScores.reduce((sum, score) => sum + score, 0) / npsScores.length;

      // Get coaching memories for additional context
      const memories = await CoachMemory.findAll({
        where: {
          userId,
          conversationDate: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      // Adjust NPS based on recent interactions and sentiment
      let adjustedNPS = averageNPS;
      if (memories.length > 0) {
        const avgSentiment = memories.reduce(
          (sum, memory) => sum + (memory.emotionalContext.sentiment || 0),
          0
        ) / memories.length;

        // Sentiment ranges from -1 to 1, convert to NPS adjustment (-2 to +2)
        const sentimentAdjustment = avgSentiment * 2;
        adjustedNPS = Math.max(-100, Math.min(100, averageNPS + sentimentAdjustment));
      }

      logger.info(`Calculated NPS score for user ${userId}: ${adjustedNPS}`);
      return Math.round(adjustedNPS);
    } catch (error) {
      logger.error(`Error calculating NPS score for user ${userId}:`, error);
      return 7; // Default neutral score
    }
  }

  /**
   * Track skill improvement for a specific user and skill
   */
  async trackSkillImprovement(userId: string, skillId: string, score: number): Promise<void> {
    try {
      logger.info(`Tracking skill improvement for user ${userId}, skill ${skillId}, score ${score}`);

      // Validate score
      if (score < 0 || score > 100) {
        throw new Error('Skill score must be between 0 and 100');
      }

      // Get or create current analytics record
      const currentDate = new Date();
      const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      let analytics = await UserAnalytics.findOne({
        where: {
          userId,
          periodType: 'monthly',
          periodStart,
          periodEnd,
        },
      });

      if (!analytics) {
        // Create new analytics record
        analytics = await this.calculateUserAnalytics(userId);
      }

      // Update skill improvement tracking
      const skillImprovement = analytics.coachingMetrics.progressMetrics.skillImprovement || 0.5;

      // Calculate improvement based on score (assume 70+ is good, 80+ is excellent)
      const normalizedScore = score / 100;
      const newSkillImprovement = (skillImprovement + normalizedScore) / 2;

      analytics.coachingMetrics.progressMetrics.skillImprovement = newSkillImprovement;

      // Add to custom KPIs if skill tracking doesn't exist
      const existingSkillKPI = analytics.kpiMetrics.customKpis.find(
        kpi => kpi.name === `skill_${skillId}`
      );

      if (existingSkillKPI) {
        existingSkillKPI.value = score;
        existingSkillKPI.trend = score > existingSkillKPI.value ? 'increasing' :
                                 score < existingSkillKPI.value ? 'decreasing' : 'stable';
      } else {
        analytics.kpiMetrics.customKpis.push({
          name: `skill_${skillId}`,
          value: score,
          target: 80, // Default target of 80%
          trend: 'stable',
        });
      }

      await analytics.save();

      // Create a coaching memory for this skill improvement
      await CoachMemory.create({
        userId,
        avatarId: 'system',
        sessionId: `skill_tracking_${Date.now()}`,
        memoryType: 'skill_improvement',
        content: `Skill ${skillId} scored ${score}/100`,
        summary: `User demonstrated ${this.getSkillLevel(score)} proficiency in ${skillId}`,
        tags: ['skill_tracking', skillId, this.getSkillLevel(score)],
        emotionalContext: {
          mood: score >= 70 ? 'confident' : score >= 50 ? 'neutral' : 'concerned',
          sentiment: (score - 50) / 50, // Convert 0-100 to -1 to 1
        },
        coachingContext: {
          topic: 'skill_development',
          category: 'assessment',
          importance: score >= 80 ? 8 : score >= 60 ? 6 : 4,
          actionItems: score < 70 ? [`Improve ${skillId} through targeted practice`] : [],
          followUpNeeded: score < 60,
        },
        metrics: {
          skillScore: score,
          skillId,
          improvementRate: newSkillImprovement,
        },
        conversationDate: currentDate,
      });

      logger.info(`Successfully tracked skill improvement for user ${userId}, skill ${skillId}`);
    } catch (error) {
      logger.error(`Error tracking skill improvement for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate user percentile for a specific metric against peer group
   */
  async calculateUserPercentile(userId: string, metric: string): Promise<number> {
    try {
      logger.info(`Calculating user percentile for user ${userId}, metric ${metric}`);

      // Get user's current analytics
      const userAnalytics = await UserAnalytics.findOne({
        where: { userId },
        order: [['calculatedAt', 'DESC']],
      });

      if (!userAnalytics) {
        logger.warn(`No analytics found for user ${userId}`);
        return 50; // Default to median
      }

      // Get user's value for the specified metric
      const userValue = this.extractMetricValue(userAnalytics, metric);
      if (userValue === null) {
        logger.warn(`Metric ${metric} not found for user ${userId}`);
        return 50;
      }

      // Get comparative data from other users (anonymized)
      const peerAnalytics = await UserAnalytics.findAll({
        where: {
          userId: { [Op.ne]: userId },
          calculatedAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        limit: 1000, // Reasonable sample size
      });

      if (peerAnalytics.length === 0) {
        logger.warn('No peer data available for comparison');
        return 50;
      }

      // Extract metric values from peer data
      const peerValues = peerAnalytics
        .map(analytics => this.extractMetricValue(analytics, metric))
        .filter(value => value !== null)
        .sort((a, b) => a - b);

      if (peerValues.length === 0) {
        return 50;
      }

      // Calculate percentile
      const belowCount = peerValues.filter(value => value < userValue).length;
      const equalCount = peerValues.filter(value => value === userValue).length;

      // Use midpoint of equal values for percentile calculation
      const percentile = ((belowCount + equalCount / 2) / peerValues.length) * 100;

      logger.info(`User ${userId} percentile for ${metric}: ${Math.round(percentile)}`);
      return Math.round(percentile);
    } catch (error) {
      logger.error(`Error calculating user percentile for user ${userId}:`, error);
      return 50; // Default to median
    }
  }

  /**
   * Generate personalized insights for a user based on their data
   */
  async generatePersonalizedInsights(userId: string): Promise<PersonalizedInsights> {
    try {
      logger.info(`Generating personalized insights for user ${userId}`);

      // Get user's analytics and memories
      const [userAnalytics, memories, goals] = await Promise.all([
        UserAnalytics.findOne({
          where: { userId },
          order: [['calculatedAt', 'DESC']],
        }),
        CoachMemory.findAll({
          where: {
            userId,
            conversationDate: {
              [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
          order: [['conversationDate', 'DESC']],
        }),
        KpiTracker.findAll({
          where: { userId },
          order: [['updatedAt', 'DESC']],
        }),
      ]);

      if (!userAnalytics) {
        throw new Error(`No analytics data found for user ${userId}`);
      }

      // Analyze strength areas
      const strengthAreas = this.analyzeStrengthAreas(userAnalytics, memories, goals);

      // Analyze improvement areas
      const improvementAreas = this.analyzeImprovementAreas(userAnalytics, memories, goals);

      // Identify behavioral patterns
      const behavioralPatterns = this.identifyBehavioralPatterns(memories);

      // Analyze progress trends
      const progressTrends = this.analyzeProgressTrends(userAnalytics, goals);

      // Generate recommendations
      const recommendations = this.generateRecommendations(userAnalytics, memories, goals);

      // Generate predictive insights using AI
      const predictiveInsights = await this.generatePredictiveInsights(userAnalytics, memories, goals);

      const insights: PersonalizedInsights = {
        userId,
        insights: {
          strengthAreas,
          improvementAreas,
          behavioralPatterns,
          progressTrends,
        },
        recommendations,
        predictiveInsights,
        generatedAt: new Date(),
      };

      logger.info(`Generated personalized insights for user ${userId}`);
      return insights;
    } catch (error) {
      logger.error(`Error generating personalized insights for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Track confidence level for a user in a specific context
   */
  async trackConfidenceLevel(userId: string, level: number, context: string): Promise<void> {
    try {
      logger.info(`Tracking confidence level for user ${userId}: ${level} in context ${context}`);

      // Validate confidence level
      if (level < 1 || level > 10) {
        throw new Error('Confidence level must be between 1 and 10');
      }

      // Get or create current analytics record
      const currentDate = new Date();
      const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      let analytics = await UserAnalytics.findOne({
        where: {
          userId,
          periodType: 'monthly',
          periodStart,
          periodEnd,
        },
      });

      if (!analytics) {
        analytics = await this.calculateUserAnalytics(userId);
      }

      // Update confidence tracking
      const currentConfidence = analytics.coachingMetrics.progressMetrics.confidenceIncrease || 0.5;
      const normalizedLevel = level / 10; // Convert to 0-1 scale
      const newConfidence = (currentConfidence + normalizedLevel) / 2;

      analytics.coachingMetrics.progressMetrics.confidenceIncrease = newConfidence;

      // Add confidence tracking to custom KPIs
      const confidenceKPI = analytics.kpiMetrics.customKpis.find(
        kpi => kpi.name === `confidence_${context}`
      );

      if (confidenceKPI) {
        const previousValue = confidenceKPI.value;
        confidenceKPI.value = level;
        confidenceKPI.trend = level > previousValue ? 'increasing' :
                             level < previousValue ? 'decreasing' : 'stable';
      } else {
        analytics.kpiMetrics.customKpis.push({
          name: `confidence_${context}`,
          value: level,
          target: 8, // Default target confidence of 8/10
          trend: 'stable',
        });
      }

      await analytics.save();

      // Create coaching memory for confidence tracking
      await CoachMemory.create({
        userId,
        avatarId: 'system',
        sessionId: `confidence_tracking_${Date.now()}`,
        memoryType: 'confidence_assessment',
        content: `Confidence level ${level}/10 in ${context}`,
        summary: `User reported ${this.getConfidenceLevel(level)} confidence in ${context}`,
        tags: ['confidence_tracking', context, this.getConfidenceLevel(level)],
        emotionalContext: {
          mood: level >= 7 ? 'confident' : level >= 5 ? 'neutral' : 'uncertain',
          sentiment: (level - 5.5) / 4.5, // Convert 1-10 to approximately -1 to 1
        },
        coachingContext: {
          topic: 'confidence_building',
          category: 'assessment',
          importance: level <= 4 ? 8 : level >= 8 ? 6 : 5,
          actionItems: level <= 5 ? [`Build confidence in ${context} through targeted support`] : [],
          followUpNeeded: level <= 4,
        },
        metrics: {
          confidenceLevel: level,
          context,
          confidenceIncrease: newConfidence,
        },
        conversationDate: currentDate,
      });

      logger.info(`Successfully tracked confidence level for user ${userId} in context ${context}`);
    } catch (error) {
      logger.error(`Error tracking confidence level for user ${userId}:`, error);
      throw error;
    }
  }

  // ========================================
  // Reporting & Analytics Methods
  // ========================================

  /**
   * Generate comprehensive progress report for a user
   */
  async generateProgressReport(userId: string, period: ReportPeriod): Promise<ProgressReport> {
    try {
      logger.info(`Generating progress report for user ${userId}, period ${period}`);

      const { startDate, endDate } = this.calculateReportPeriod(period);

      // Get user's goals within the period
      const goals = await KpiTracker.findAll({
        where: {
          userId,
          [Op.or]: [
            {
              startDate: { [Op.between]: [startDate, endDate] },
            },
            {
              endDate: { [Op.between]: [startDate, endDate] },
            },
            {
              [Op.and]: [
                { startDate: { [Op.lte]: startDate } },
                { endDate: { [Op.gte]: endDate } },
              ],
            },
          ],
        },
      });

      // Calculate summary metrics
      const completedGoals = goals.filter(g => g.status === 'completed');
      const inProgressGoals = goals.filter(g => g.status === 'in_progress');
      const overallCompletionRate = goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;
      const averageProgress = goals.length > 0 ?
        goals.reduce((sum, g) => sum + g.overallProgress, 0) / goals.length : 0;

      // Analyze top performing and struggling goals
      const sortedByProgress = [...goals].sort((a, b) => b.overallProgress - a.overallProgress);
      const topPerformingGoals = sortedByProgress.slice(0, 3).map(goal => ({
        id: goal.id,
        title: goal.title,
        progress: goal.overallProgress,
        category: goal.category,
      }));

      const strugglingGoals = sortedByProgress
        .filter(goal => goal.overallProgress < 50 || goal.isAtRisk())
        .slice(-3)
        .map(goal => ({
          id: goal.id,
          title: goal.title,
          progress: goal.overallProgress,
          riskFactors: goal.analytics.riskFactors,
        }));

      // Analyze trends
      const trends = await this.analyzeTrends(userId, period);

      // Generate recommendations
      const recommendations = this.generateProgressRecommendations(goals, trends);

      // Identify achievements
      const achievements = this.identifyAchievements(goals, period);

      // Determine next period focus
      const nextPeriodFocus = this.determineNextPeriodFocus(goals, trends);

      const report: ProgressReport = {
        userId,
        period,
        startDate,
        endDate,
        summary: {
          totalGoals: goals.length,
          completedGoals: completedGoals.length,
          inProgressGoals: inProgressGoals.length,
          overallCompletionRate,
          averageProgress,
        },
        goalAnalysis: {
          topPerformingGoals,
          strugglingGoals,
        },
        trends,
        recommendations,
        achievements,
        nextPeriodFocus,
      };

      logger.info(`Generated progress report for user ${userId}`);
      return report;
    } catch (error) {
      logger.error(`Error generating progress report for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate coaching effectiveness report for a coach
   */
  async generateCoachingEffectivenessReport(coachId: string): Promise<CoachingEffectivenessReport> {
    try {
      logger.info(`Generating coaching effectiveness report for coach ${coachId}`);

      const period: ReportPeriod = 'monthly'; // Default to monthly report
      const { startDate, endDate } = this.calculateReportPeriod(period);

      // Get all coaching sessions for this coach within the period
      const coachingSessions = await CoachMemory.findAll({
        where: {
          avatarId: coachId,
          conversationDate: { [Op.between]: [startDate, endDate] },
        },
      });

      // Get unique clients
      const clientIds = [...new Set(coachingSessions.map(session => session.userId))];
      const totalClients = clientIds.length;

      // Calculate session metrics
      const totalSessions = coachingSessions.length;
      const sessionDurations = coachingSessions
        .map(session => session.metrics?.sessionDuration || 30)
        .filter(duration => duration > 0);
      const averageSessionDuration = sessionDurations.length > 0 ?
        sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length : 0;

      // Calculate client retention (clients who had sessions in both this period and previous period)
      const previousPeriod = this.calculateReportPeriod(period, -1);
      const previousSessions = await CoachMemory.findAll({
        where: {
          avatarId: coachId,
          conversationDate: { [Op.between]: [previousPeriod.startDate, previousPeriod.endDate] },
        },
      });
      const previousClientIds = [...new Set(previousSessions.map(session => session.userId))];
      const retainedClients = clientIds.filter(id => previousClientIds.includes(id));
      const clientRetentionRate = previousClientIds.length > 0 ?
        (retainedClients.length / previousClientIds.length) * 100 : 100;

      // Get client analytics for performance metrics
      const clientAnalytics = await Promise.all(
        clientIds.map(clientId =>
          UserAnalytics.findOne({
            where: { userId: clientId },
            order: [['calculatedAt', 'DESC']],
          })
        )
      );

      const validAnalytics = clientAnalytics.filter(analytics => analytics !== null);

      // Calculate performance metrics
      const satisfactionScores = validAnalytics.map(a => a.kpiMetrics.userSatisfactionScore);
      const averageClientSatisfaction = satisfactionScores.length > 0 ?
        satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length : 7;

      const completionRates = validAnalytics.map(a => a.coachingMetrics.goalCompletionRate);
      const goalCompletionRate = completionRates.length > 0 ?
        (completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length) * 100 : 0;

      const engagementScores = validAnalytics.map(a => a.engagementMetrics.participationScore);
      const clientEngagementScore = engagementScores.length > 0 ?
        (engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length) * 100 : 50;

      const improvementScores = validAnalytics.map(a =>
        (a.coachingMetrics.progressMetrics.skillImprovement +
         a.coachingMetrics.progressMetrics.confidenceIncrease) / 2
      );
      const improvementRate = improvementScores.length > 0 ?
        (improvementScores.reduce((sum, score) => sum + score, 0) / improvementScores.length) * 100 : 50;

      // Identify top performing and at-risk clients
      const clientPerformance = validAnalytics.map(analytics => ({
        userId: analytics.userId,
        improvementScore: (analytics.coachingMetrics.progressMetrics.skillImprovement +
                          analytics.coachingMetrics.progressMetrics.confidenceIncrease) / 2,
        goalCompletionRate: analytics.coachingMetrics.goalCompletionRate,
        churnProbability: analytics.kpiMetrics.churnRisk,
        riskFactors: analytics.aiInsights.riskFactors,
      }));

      const topPerformingClients = clientPerformance
        .sort((a, b) => b.improvementScore - a.improvementScore)
        .slice(0, 3)
        .map(client => ({
          userId: client.userId,
          improvementScore: Math.round(client.improvementScore * 100),
          goalCompletionRate: Math.round(client.goalCompletionRate * 100),
        }));

      const atRiskClients = clientPerformance
        .filter(client => client.churnProbability > 0.6 || client.goalCompletionRate < 0.3)
        .sort((a, b) => b.churnProbability - a.churnProbability)
        .slice(0, 5)
        .map(client => ({
          userId: client.userId,
          riskFactors: client.riskFactors,
          churnProbability: Math.round(client.churnProbability * 100),
        }));

      // Generate insights and recommendations
      const { strengths, improvementAreas, recommendations } =
        this.generateCoachInsights(clientAnalytics, coachingSessions);

      const report: CoachingEffectivenessReport = {
        coachId,
        period,
        startDate,
        endDate,
        overview: {
          totalClients,
          totalSessions,
          averageSessionDuration: Math.round(averageSessionDuration),
          clientRetentionRate: Math.round(clientRetentionRate),
        },
        performanceMetrics: {
          averageClientSatisfaction: Math.round(averageClientSatisfaction * 10) / 10,
          goalCompletionRate: Math.round(goalCompletionRate),
          clientEngagementScore: Math.round(clientEngagementScore),
          improvementRate: Math.round(improvementRate),
        },
        clientInsights: {
          topPerformingClients,
          atRiskClients,
        },
        recommendations,
        strengths,
        improvementAreas,
      };

      logger.info(`Generated coaching effectiveness report for coach ${coachId}`);
      return report;
    } catch (error) {
      logger.error(`Error generating coaching effectiveness report for coach ${coachId}:`, error);
      throw error;
    }
  }

  /**
   * Analyze goal completion patterns for a user
   */
  async analyzeGoalCompletionPatterns(userId: string): Promise<GoalCompletionPattern> {
    try {
      logger.info(`Analyzing goal completion patterns for user ${userId}`);

      // Get all user's goals
      const goals = await KpiTracker.findAll({
        where: { userId },
        order: [['createdAt', 'ASC']],
      });

      if (goals.length === 0) {
        throw new Error(`No goals found for user ${userId}`);
      }

      // Analyze goal type preferences
      const goalTypes = goals.map(g => g.type);
      const goalTypeFrequency = this.calculateFrequency(goalTypes);
      const preferredGoalTypes = Object.entries(goalTypeFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);

      // Calculate average completion time for completed goals
      const completedGoals = goals.filter(g => g.status === 'completed');
      const completionTimes = completedGoals.map(goal => {
        const start = new Date(goal.startDate).getTime();
        const end = new Date(goal.endDate).getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // Days
      });
      const averageCompletionTime = completionTimes.length > 0 ?
        completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length : 0;

      // Identify most successful categories
      const categorySuccess = {};
      goals.forEach(goal => {
        if (!categorySuccess[goal.category]) {
          categorySuccess[goal.category] = { total: 0, completed: 0 };
        }
        categorySuccess[goal.category].total++;
        if (goal.status === 'completed') {
          categorySuccess[goal.category].completed++;
        }
      });

      const mostSuccessfulCategories = Object.entries(categorySuccess)
        .map(([category, stats]) => ({
          category,
          successRate: stats.total > 0 ? stats.completed / stats.total : 0,
        }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 3)
        .map(item => item.category);

      // Analyze failure reasons
      const failedGoals = goals.filter(g => g.status === 'failed');
      const commonFailureReasons = this.extractFailureReasons(failedGoals);

      // Calculate optimal goal count based on completion rates
      const optimalGoalCount = this.calculateOptimalGoalCount(goals);

      // Analyze seasonal trends
      const seasonalTrends = this.analyzeSeasonalTrends(goals);

      // Analyze behavioral patterns
      const procrastinationTendency = this.calculateProcrastinationTendency(goals);
      const consistencyScore = this.calculateGoalConsistencyScore(goals);
      const motivationDrivers = this.identifyMotivationDrivers(goals);
      const challengePreference = this.determineChallengePreferen(goals);

      // Generate recommendations
      const recommendations = this.generateGoalPatternRecommendations(goals, {
        procrastinationTendency,
        consistencyScore,
        preferredGoalTypes,
        mostSuccessfulCategories,
      });

      const pattern: GoalCompletionPattern = {
        userId,
        patterns: {
          preferredGoalTypes,
          averageCompletionTime: Math.round(averageCompletionTime),
          mostSuccessfulCategories,
          commonFailureReasons,
          optimalGoalCount,
          seasonalTrends,
        },
        behaviors: {
          procrastinationTendency,
          consistencyScore,
          motivationDrivers,
          challengePreference,
        },
        recommendations,
      };

      logger.info(`Analyzed goal completion patterns for user ${userId}`);
      return pattern;
    } catch (error) {
      logger.error(`Error analyzing goal completion patterns for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate benchmark analysis comparing user to peer group
   */
  async generateBenchmarkAnalysis(userId: string, peerGroup: string): Promise<BenchmarkAnalysis> {
    try {
      logger.info(`Generating benchmark analysis for user ${userId}, peer group ${peerGroup}`);

      // Get user's current analytics
      const userAnalytics = await UserAnalytics.findOne({
        where: { userId },
        order: [['calculatedAt', 'DESC']],
      });

      if (!userAnalytics) {
        throw new Error(`No analytics data found for user ${userId}`);
      }

      // Get peer group analytics (this would be more sophisticated in a real system)
      const peerAnalytics = await UserAnalytics.findAll({
        where: {
          userId: { [Op.ne]: userId },
          // In a real system, you'd filter by actual peer group criteria
          calculatedAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        limit: 500, // Sample size
      });

      if (peerAnalytics.length === 0) {
        throw new Error('No peer data available for comparison');
      }

      // Calculate goal completion rate metrics
      const userGoalCompletionRate = userAnalytics.coachingMetrics.goalCompletionRate * 100;
      const peerGoalCompletionRates = peerAnalytics.map(a => a.coachingMetrics.goalCompletionRate * 100);
      const avgPeerGoalCompletion = peerGoalCompletionRates.reduce((sum, rate) => sum + rate, 0) / peerGoalCompletionRates.length;
      const goalCompletionPercentile = this.calculatePercentileFromArray(userGoalCompletionRate, peerGoalCompletionRates);

      // Calculate engagement score metrics
      const userEngagementScore = userAnalytics.engagementMetrics.participationScore * 100;
      const peerEngagementScores = peerAnalytics.map(a => a.engagementMetrics.participationScore * 100);
      const avgPeerEngagement = peerEngagementScores.reduce((sum, score) => sum + score, 0) / peerEngagementScores.length;
      const engagementPercentile = this.calculatePercentileFromArray(userEngagementScore, peerEngagementScores);

      // Calculate progress velocity metrics (based on goal achievement velocity)
      const userVelocity = this.calculateUserProgressVelocity(userId);
      const peerVelocities = await Promise.all(
        peerAnalytics.slice(0, 100).map(a => this.calculateUserProgressVelocity(a.userId))
      );
      const avgPeerVelocity = peerVelocities.reduce((sum, vel) => sum + vel, 0) / peerVelocities.length;
      const velocityPercentile = this.calculatePercentileFromArray(userVelocity, peerVelocities);

      // Generate insights based on comparisons
      const insights = this.generateBenchmarkInsights(
        {
          goalCompletion: { user: userGoalCompletionRate, peer: avgPeerGoalCompletion, percentile: goalCompletionPercentile },
          engagement: { user: userEngagementScore, peer: avgPeerEngagement, percentile: engagementPercentile },
          velocity: { user: userVelocity, peer: avgPeerVelocity, percentile: velocityPercentile },
        },
        peerGroup
      );

      // Generate recommendations
      const recommendations = this.generateBenchmarkRecommendations(insights);

      const analysis: BenchmarkAnalysis = {
        userId,
        peerGroup,
        metrics: {
          goalCompletionRate: {
            userValue: Math.round(userGoalCompletionRate),
            peerAverage: Math.round(avgPeerGoalCompletion),
            percentile: Math.round(goalCompletionPercentile),
            ranking: this.getRanking(goalCompletionPercentile),
          },
          engagementScore: {
            userValue: Math.round(userEngagementScore),
            peerAverage: Math.round(avgPeerEngagement),
            percentile: Math.round(engagementPercentile),
            ranking: this.getRanking(engagementPercentile),
          },
          progressVelocity: {
            userValue: Math.round(userVelocity * 100) / 100,
            peerAverage: Math.round(avgPeerVelocity * 100) / 100,
            percentile: Math.round(velocityPercentile),
            ranking: this.getRanking(velocityPercentile),
          },
        },
        insights,
        recommendations,
      };

      logger.info(`Generated benchmark analysis for user ${userId}`);
      return analysis;
    } catch (error) {
      logger.error(`Error generating benchmark analysis for user ${userId}:`, error);
      throw error;
    }
  }

  // ========================================
  // Custom KPI Management Methods
  // ========================================

  /**
   * Create a new custom KPI for an organization
   */
  async createCustomKPI(organizationId: string, kpiData: CustomKPIRequest): Promise<string> {
    try {
      logger.info(`Creating custom KPI for organization ${organizationId}: ${kpiData.name}`);

      // Validate KPI data
      this.validateCustomKPIData(kpiData);

      // Create the KPI as a new KpiTracker record
      const customKPI = await KpiTracker.create({
        userId: 'system', // System-level KPI
        organizationId,
        type: 'kpi',
        title: kpiData.name,
        description: kpiData.description,
        category: kpiData.category as unknown,
        kpiData: {
          metric: kpiData.name,
          target: kpiData.target || 100,
          current: 0,
          unit: kpiData.unit || '',
          trend: 'stable',
          frequency: kpiData.frequency,
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        reviewFrequency: kpiData.frequency === 'daily' ? 'weekly' : 'monthly',
        nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        overallProgress: 0,
        status: 'in_progress',
        milestones: [],
        performanceHistory: [],
        coachingData: {
          coachingFrequency: 'monthly',
          coachingNotes: [],
          actionItems: [],
        },
        analytics: {
          averageProgress: 0,
          velocityScore: 0.5,
          consistencyScore: 0.5,
          riskFactors: [],
          successFactors: [],
          recommendations: [],
        },
        collaborators: [],
        priority: 'medium',
        confidentiality: 'team',
        tags: ['custom_kpi', kpiData.category, organizationId],
      });

      // Store additional custom KPI metadata if needed
      // This could be in a separate CustomKPI model in a real system
      const kpiMetadata = {
        type: kpiData.type,
        calculationMethod: kpiData.calculationMethod,
        formula: kpiData.formula,
        validationRules: kpiData.validationRules,
        isActive: true,
      };

      // Add metadata to the KPI's analytics for now
      customKPI.analytics.successFactors.push(`KPI Type: ${kpiData.type}`);
      customKPI.analytics.successFactors.push(`Calculation: ${kpiData.calculationMethod}`);
      if (kpiData.formula) {
        customKPI.analytics.successFactors.push(`Formula: ${kpiData.formula}`);
      }

      await customKPI.save();

      logger.info(`Created custom KPI ${customKPI.id} for organization ${organizationId}`);
      return customKPI.id;
    } catch (error) {
      logger.error(`Error creating custom KPI for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing custom KPI
   */
  async updateCustomKPI(kpiId: string, updates: UpdateKPIRequest): Promise<void> {
    try {
      logger.info(`Updating custom KPI ${kpiId}`);

      const kpi = await KpiTracker.findByPk(kpiId);
      if (!kpi) {
        throw new Error(`Custom KPI ${kpiId} not found`);
      }

      // Update basic fields
      if (updates.name) {
        kpi.title = updates.name;
        if (kpi.kpiData) {
          kpi.kpiData.metric = updates.name;
        }
      }

      if (updates.description) {
        kpi.description = updates.description;
      }

      if (updates.target !== undefined && kpi.kpiData) {
        kpi.kpiData.target = updates.target;
      }

      if (updates.frequency && kpi.kpiData) {
        kpi.kpiData.frequency = updates.frequency;
        // Adjust review frequency based on KPI frequency
        kpi.reviewFrequency = updates.frequency === 'daily' ? 'weekly' : 'monthly';
      }

      if (updates.calculationMethod) {
        // Update in analytics metadata
        const methodIndex = kpi.analytics.successFactors.findIndex(factor =>
          factor.startsWith('Calculation:')
        );
        if (methodIndex >= 0) {
          kpi.analytics.successFactors[methodIndex] = `Calculation: ${updates.calculationMethod}`;
        } else {
          kpi.analytics.successFactors.push(`Calculation: ${updates.calculationMethod}`);
        }
      }

      if (updates.formula) {
        // Update formula in analytics metadata
        const formulaIndex = kpi.analytics.successFactors.findIndex(factor =>
          factor.startsWith('Formula:')
        );
        if (formulaIndex >= 0) {
          kpi.analytics.successFactors[formulaIndex] = `Formula: ${updates.formula}`;
        } else {
          kpi.analytics.successFactors.push(`Formula: ${updates.formula}`);
        }
      }

      if (updates.isActive !== undefined) {
        kpi.status = updates.isActive ? 'in_progress' : 'paused';
      }

      await kpi.save();

      logger.info(`Updated custom KPI ${kpiId}`);
    } catch (error) {
      logger.error(`Error updating custom KPI ${kpiId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a custom KPI
   */
  async deleteCustomKPI(kpiId: string): Promise<void> {
    try {
      logger.info(`Deleting custom KPI ${kpiId}`);

      const kpi = await KpiTracker.findByPk(kpiId);
      if (!kpi) {
        throw new Error(`Custom KPI ${kpiId} not found`);
      }

      // Check if this is actually a custom KPI (has organizationId)
      if (!kpi.organizationId) {
        throw new Error(`KPI ${kpiId} is not a custom organizational KPI`);
      }

      // Soft delete by setting status to failed and adding deleted tag
      kpi.status = 'failed';
      kpi.tags = [...kpi.tags, 'deleted'];
      kpi.analytics.riskFactors.push('KPI deleted');

      await kpi.save();

      logger.info(`Deleted custom KPI ${kpiId}`);
    } catch (error) {
      logger.error(`Error deleting custom KPI ${kpiId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate custom KPI value for a user in a specific period
   */
  async calculateCustomKPIValue(kpiId: string, userId: string, period: string): Promise<number> {
    try {
      logger.info(`Calculating custom KPI ${kpiId} value for user ${userId} in period ${period}`);

      // Get the custom KPI definition
      const customKPI = await KpiTracker.findByPk(kpiId);
      if (!customKPI) {
        throw new Error(`Custom KPI ${kpiId} not found`);
      }

      if (!customKPI.organizationId) {
        throw new Error(`KPI ${kpiId} is not a custom organizational KPI`);
      }

      // Parse the time period
      const { startDate, endDate } = this.parseTimeframe(period);

      // Get user's analytics and activities in the period
      const [userAnalytics, userGoals, userMemories] = await Promise.all([
        UserAnalytics.findOne({
          where: {
            userId,
            periodStart: { [Op.gte]: startDate },
            periodEnd: { [Op.lte]: endDate },
          },
          order: [['calculatedAt', 'DESC']],
        }),
        KpiTracker.findAll({
          where: {
            userId,
            startDate: { [Op.lte]: endDate },
            endDate: { [Op.gte]: startDate },
          },
        }),
        CoachMemory.findAll({
          where: {
            userId,
            conversationDate: { [Op.between]: [startDate, endDate] },
          },
        }),
      ]);

      // Calculate KPI value based on calculation method
      let kpiValue = 0;

      if (!customKPI.kpiData) {
        throw new Error(`Custom KPI ${kpiId} missing kpiData configuration`);
      }

      const calculationMethod = this.extractCalculationMethod(customKPI);

      switch (calculationMethod) {
        case 'manual':
          // For manual KPIs, look for user-submitted values
          kpiValue = this.calculateManualKPIValue(customKPI, userId, period);
          break;

        case 'automatic':
          // For automatic KPIs, calculate based on formula and user data
          kpiValue = this.calculateAutomaticKPIValue(customKPI, userAnalytics, userGoals, userMemories);
          break;

        case 'hybrid':
          // Combination of manual input and automatic calculation
          const manualValue = this.calculateManualKPIValue(customKPI, userId, period);
          const autoValue = this.calculateAutomaticKPIValue(customKPI, userAnalytics, userGoals, userMemories);
          kpiValue = manualValue > 0 ? manualValue : autoValue;
          break;

        default:
          logger.warn(`Unknown calculation method for KPI ${kpiId}, using default calculation`);
          kpiValue = this.calculateDefaultKPIValue(customKPI, userAnalytics, userGoals);
      }

      // Update the user's analytics with this custom KPI value
      if (userAnalytics) {
        const existingKPI = userAnalytics.kpiMetrics.customKpis.find(
          kpi => kpi.name === `custom_${kpiId}`
        );

        if (existingKPI) {
          const previousValue = existingKPI.value;
          existingKPI.value = kpiValue;
          existingKPI.trend = kpiValue > previousValue ? 'increasing' :
                             kpiValue < previousValue ? 'decreasing' : 'stable';
        } else {
          userAnalytics.kpiMetrics.customKpis.push({
            name: `custom_${kpiId}`,
            value: kpiValue,
            target: customKPI.kpiData.target,
            trend: 'stable',
          });
        }

        await userAnalytics.save();
      }

      logger.info(`Calculated custom KPI ${kpiId} value for user ${userId}: ${kpiValue}`);
      return kpiValue;
    } catch (error) {
      logger.error(`Error calculating custom KPI ${kpiId} value for user ${userId}:`, error);
      throw error;
    }
  }

  // ========================================
  // Helper Methods for New Implementation
  // ========================================

  /**
   * Parse timeframe string and return date range
   */
  private parseTimeframe(timeframe: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (timeframe.toLowerCase()) {
      case 'week':
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
      case 'quarterly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
      case 'yearly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        // Try to parse as number of days
        const days = parseInt(timeframe);
        if (!isNaN(days)) {
          startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
        }
    }

    return { startDate, endDate };
  }

  /**
   * Extract metric value from UserAnalytics object
   */
  private extractMetricValue(analytics: UserAnalytics, metric: string): number | null {
    const metricPath = metric.split('.');
    let value: unknown = analytics;

    for (const path of metricPath) {
      if (value && typeof value === 'object' && path in value) {
        value = value[path];
      } else {
        return null;
      }
    }

    return typeof value === 'number' ? value : null;
  }

  /**
   * Get skill level description based on score
   */
  private getSkillLevel(score: number): string {
    if (score >= 90) return 'expert';
    if (score >= 80) return 'advanced';
    if (score >= 70) return 'intermediate';
    if (score >= 60) return 'beginner';
    return 'novice';
  }

  /**
   * Get confidence level description
   */
  private getConfidenceLevel(level: number): string {
    if (level >= 9) return 'very_high';
    if (level >= 7) return 'high';
    if (level >= 5) return 'moderate';
    if (level >= 3) return 'low';
    return 'very_low';
  }

  // Additional simplified helper methods
  private generateRecommendations(analytics: UserAnalytics, memories: CoachMemory[], goals: KpiTracker[]): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    return {
      immediate: ['Focus on completing current priority goals', 'Schedule regular check-ins'],
      shortTerm: ['Develop consistent daily habits', 'Improve goal-setting techniques'],
      longTerm: ['Build long-term strategic planning skills', 'Develop leadership capabilities'],
    };
  }

  private async generatePredictiveInsights(analytics: UserAnalytics, memories: CoachMemory[], goals: KpiTracker[]): Promise<{
    futurePerformance: string;
    riskFactors: string[];
    opportunities: string[];
  }> {
    return {
      futurePerformance: 'Based on current trends, user is likely to maintain steady progress',
      riskFactors: analytics.kpiMetrics.churnRisk > 0.5 ? ['High churn risk', 'Low engagement'] : [],
      opportunities: ['Leadership development', 'Cross-functional skills'],
    };
  }

  private identifyBehavioralPatterns(memories: CoachMemory[]): Array<{
    pattern: string;
    frequency: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }> {
    const patterns = [];
    if (memories.length > 0) {
      const avgSentiment = memories.reduce((sum, m) => sum + (m.emotionalContext.sentiment || 0), 0) / memories.length;
      patterns.push({
        pattern: avgSentiment > 0.2 ? 'Generally positive attitude' : 'Neutral emotional baseline',
        frequency: 1,
        impact: avgSentiment > 0.2 ? 'positive' as const : 'neutral' as const,
        description: `Average sentiment score: ${Math.round(avgSentiment * 100) / 100}`,
      });
    }
    return patterns;
  }

  private analyzeProgressTrends(analytics: UserAnalytics, goals: KpiTracker[]): Array<{
    metric: string;
    trend: 'improving' | 'declining' | 'stable';
    rate: number;
    timeframe: string;
  }> {
    return [{ metric: 'Goal Completion Rate', trend: 'stable' as const, rate: 0, timeframe: '30 days' }];
  }

  private calculateFrequency<T>(items: T[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    items.forEach(item => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
    });
    return frequency;
  }

  private calculatePercentileFromArray(userValue: number, peerValues: number[]): number {
    const sortedValues = [...peerValues].sort((a, b) => a - b);
    const belowCount = sortedValues.filter(value => value < userValue).length;
    const equalCount = sortedValues.filter(value => value === userValue).length;
    return ((belowCount + equalCount / 2) / sortedValues.length) * 100;
  }

  private getRanking(percentile: number): 'top' | 'above_average' | 'average' | 'below_average' | 'bottom' {
    if (percentile >= 90) return 'top';
    if (percentile >= 70) return 'above_average';
    if (percentile >= 30) return 'average';
    if (percentile >= 10) return 'below_average';
    return 'bottom';
  }

  private calculateReportPeriod(period: ReportPeriod, offset: number = 0): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date, endDate: Date;
    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - (7 + offset * 7) * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - offset * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1 + offset, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + offset, 0);
        break;
      case 'quarterly':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart - 3 + offset * 3, 1);
        endDate = new Date(now.getFullYear(), quarterStart + offset * 3, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 1 + offset, 0, 1);
        endDate = new Date(now.getFullYear() + offset, 0, 0);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }
    return { startDate, endDate };
  }

  private validateCustomKPIData(kpiData: CustomKPIRequest): void {
    if (!kpiData.name?.trim()) throw new Error('KPI name is required');
    if (!kpiData.description?.trim()) throw new Error('KPI description is required');
    if (!kpiData.category?.trim()) throw new Error('KPI category is required');
    if (!['numeric', 'percentage', 'boolean', 'enum'].includes(kpiData.type)) throw new Error('Invalid KPI type');
    if (!['daily', 'weekly', 'monthly', 'quarterly'].includes(kpiData.frequency)) throw new Error('Invalid KPI frequency');
    if (!['manual', 'automatic', 'hybrid'].includes(kpiData.calculationMethod)) throw new Error('Invalid calculation method');
  }

  // KPI calculation helper methods
  private extractCalculationMethod(kpi: KpiTracker): string {
    const calculationFactor = kpi.analytics.successFactors.find(factor => factor.startsWith('Calculation:'));
    return calculationFactor ? calculationFactor.split('Calculation: ')[1] : 'automatic';
  }

  private calculateManualKPIValue(kpi: KpiTracker, userId: string, period: string): number {
    return kpi.kpiData?.current || 0;
  }

  private calculateAutomaticKPIValue(kpi: KpiTracker, analytics: UserAnalytics | null, goals: KpiTracker[], memories: CoachMemory[]): number {
    return analytics ? Math.round(analytics.coachingMetrics.goalCompletionRate * 100) : 0;
  }

  private calculateDefaultKPIValue(kpi: KpiTracker, analytics: UserAnalytics | null, goals: KpiTracker[]): number {
    return analytics ? Math.round(analytics.coachingMetrics.goalCompletionRate * 50 + analytics.engagementMetrics.participationScore * 50) : 0;
  }

  // Goal analysis helper methods
  private extractFailureReasons(failedGoals: KpiTracker[]): string[] {
    return ['Lack of time', 'Insufficient resources', 'Changed priorities'];
  }

  private calculateOptimalGoalCount(goals: KpiTracker[]): number {
    const activeGoals = goals.filter(g => g.status === 'in_progress').length;
    return Math.max(3, Math.min(5, activeGoals));
  }

  private analyzeSeasonalTrends(goals: KpiTracker[]): Array<{ period: string; completionRate: number }> {
    return [
      { period: 'Q1', completionRate: 75 },
      { period: 'Q2', completionRate: 80 },
      { period: 'Q3', completionRate: 70 },
      { period: 'Q4', completionRate: 85 },
    ];
  }

  private calculateProcrastinationTendency(goals: KpiTracker[]): number {
    return 0.3; // 30% simplified
  }

  private calculateGoalConsistencyScore(goals: KpiTracker[]): number {
    if (goals.length === 0) return 0.5;
    const goalsWithHistory = goals.filter(g => g.performanceHistory.length > 0);
    return goalsWithHistory.length / goals.length;
  }

  private identifyMotivationDrivers(goals: KpiTracker[]): string[] {
    return ['Achievement', 'Recognition', 'Personal Growth', 'Financial Success'];
  }

  private determineChallengePreferen(goals: KpiTracker[]): 'easy' | 'moderate' | 'challenging' {
    const avgProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + g.overallProgress, 0) / goals.length : 50;
    if (avgProgress > 80) return 'easy';
    if (avgProgress > 50) return 'moderate';
    return 'challenging';
  }

  // Additional helper methods with simplified implementations
  private analyzeStrengthAreas(analytics: UserAnalytics, memories: CoachMemory[], goals: KpiTracker[]): Array<{
    area: string; score: number; description: string; supportingEvidence: string[];
  }> {
    const strengths = [];
    if (analytics.coachingMetrics.goalCompletionRate > 0.7) {
      strengths.push({
        area: 'Goal Achievement',
        score: Math.round(analytics.coachingMetrics.goalCompletionRate * 100),
        description: 'Consistently achieves set goals with high success rate',
        supportingEvidence: [`${Math.round(analytics.coachingMetrics.goalCompletionRate * 100)}% goal completion rate`],
      });
    }
    return strengths.slice(0, 5);
  }

  private analyzeImprovementAreas(analytics: UserAnalytics, memories: CoachMemory[], goals: KpiTracker[]): Array<{
    area: string; currentScore: number; targetScore: number; priority: 'high' | 'medium' | 'low'; recommendations: string[];
  }> {
    const improvementAreas = [];
    if (analytics.coachingMetrics.goalCompletionRate < 0.5) {
      improvementAreas.push({
        area: 'Goal Achievement',
        currentScore: Math.round(analytics.coachingMetrics.goalCompletionRate * 100),
        targetScore: 75,
        priority: 'high' as const,
        recommendations: ['Break down large goals into smaller milestones', 'Set more realistic targets'],
      });
    }
    return improvementAreas.slice(0, 5);
  }

  private generateGoalPatternRecommendations(goals: KpiTracker[], patterns: unknown): {
    goalSetting: string[]; timing: string[]; support: string[];
  } {
    return {
      goalSetting: ['Set SMART goals', 'Focus on 3-5 priorities'],
      timing: ['Plan for seasonal variations'],
      support: ['Regular coach check-ins'],
    };
  }

  private calculateUserProgressVelocity(userId: string): number {
    return 0.75; // Simplified
  }

  private generateBenchmarkInsights(metrics: unknown, peerGroup: string): {
    strengths: string[]; improvementOpportunities: string[]; peerComparisonInsights: string[];
  } {
    const insights = { strengths: [], improvementOpportunities: [], peerComparisonInsights: [] };
    if (metrics.goalCompletion.percentile > 70) {
      insights.strengths.push('Goal completion rate is above peer average');
    }
    insights.peerComparisonInsights.push(`You perform at the ${Math.round(metrics.goalCompletion.percentile)}th percentile`);
    return insights;
  }

  private generateBenchmarkRecommendations(insights: unknown): string[] {
    return insights.improvementOpportunities.length > 0 ? ['Focus on improvement areas'] : ['Leverage your strengths'];
  }

  private async analyzeTrends(userId: string, period: ReportPeriod): Promise<{
    progressTrend: 'improving' | 'declining' | 'stable';
    engagementTrend: 'improving' | 'declining' | 'stable';
    velocityTrend: 'improving' | 'declining' | 'stable';
  }> {
    return { progressTrend: 'improving', engagementTrend: 'stable', velocityTrend: 'improving' };
  }

  private generateProgressRecommendations(goals: KpiTracker[], trends: unknown): string[] {
    const recommendations = [];
    if (trends.progressTrend === 'declining') {
      recommendations.push('Review and adjust current goals');
    }
    return recommendations;
  }

  private identifyAchievements(goals: KpiTracker[], period: ReportPeriod): string[] {
    const completedGoals = goals.filter(g => g.status === 'completed');
    return completedGoals.length > 0 ? [`Completed ${completedGoals.length} goals`] : [];
  }

  private determineNextPeriodFocus(goals: KpiTracker[], trends: unknown): string[] {
    const inProgressGoals = goals.filter(g => g.status === 'in_progress');
    return inProgressGoals.length > 0 ? [`Continue progress on ${inProgressGoals.length} active goals`] : [];
  }

  private generateCoachInsights(clientAnalytics: unknown[], coachingSessions: CoachMemory[]): {
    strengths: string[]; improvementAreas: string[]; recommendations: string[];
  } {
    const insights = { strengths: [], improvementAreas: [], recommendations: [] };
    const validAnalytics = clientAnalytics.filter(a => a !== null);
    if (validAnalytics.length > 0) {
      const avgSatisfaction = validAnalytics.reduce((sum, a) => sum + a.kpiMetrics.userSatisfactionScore, 0) / validAnalytics.length;
      if (avgSatisfaction > 8) {
        insights.strengths.push('High client satisfaction scores');
      } else if (avgSatisfaction < 6) {
        insights.improvementAreas.push('Client satisfaction needs improvement');
      }
    }
    return insights;
  }
}

export default CoachIntelligenceService;
