/**
 * Real-time Insights Generator
 * Dynamic generation of actionable insights from user data
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';
import { Op } from 'sequelize';

// Database models
import UserAnalytics from '../../models/analytics/UserAnalytics';
import KpiTracker from '../../models/analytics/KpiTracker';
import CoachMemory from '../../models/coaching/CoachMemory';
import Goal from '../../models/Goal';
import { logger } from '../../utils/logger';

// Services
import PredictiveCoachingEngine from './PredictiveCoachingEngine';
import UserBehaviorAnalyticsService from '../analytics/UserBehaviorAnalyticsService';
import AnalyticsPipelineService from '../analytics/AnalyticsPipelineService';

// ==================== Type Definitions ====================

interface Insight {
  id: string;
  userId: string;
  type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  importance: number;
  urgency: number;
  confidence: number;
  actionable: boolean;
  actions: ActionableItem[];
  supportingData: SupportingData;
  relatedInsights: string[];
  timestamp: Date;
  expiresAt: Date;
}

type InsightType =
  | 'opportunity'
  | 'risk'
  | 'achievement'
  | 'trend'
  | 'anomaly'
  | 'recommendation'
  | 'prediction';

type InsightCategory =
  | 'performance'
  | 'engagement'
  | 'goal'
  | 'habit'
  | 'wellness'
  | 'learning'
  | 'social';

interface ActionableItem {
  id: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: number;
  estimatedEffort: 'low' | 'medium' | 'high';
  deadline?: Date;
  resources?: Resource[];
}

interface Resource {
  type: 'article' | 'video' | 'tool' | 'coach' | 'peer';
  title: string;
  url?: string;
  duration?: string;
}

interface SupportingData {
  metrics: Record<string, number>;
  trends: TrendData[];
  comparisons: ComparisonData[];
  visualizations?: Visualization[];
}

interface TrendData {
  metric: string;
  period: string;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  significance: number;
}

interface ComparisonData {
  metric: string;
  userValue: number;
  benchmark: number;
  percentile: number;
  interpretation: string;
}

interface Visualization {
  type: 'chart' | 'graph' | 'heatmap' | 'timeline';
  data: unknown;
  config: Record<string, any>;
}

interface InsightGenerationContext {
  userId: string;
  timeframe: string;
  focus?: string[];
  excludeTypes?: InsightType[];
  minImportance?: number;
  maxInsights?: number;
}

interface InsightRule {
  id: string;
  name: string;
  condition: (data: unknown) => boolean;
  generator: (data: unknown) => Insight;
  priority: number;
  enabled: boolean;
}

interface InsightStream {
  userId: string;
  insights: Insight[];
  lastGenerated: Date;
  nextScheduled: Date;
}

// ==================== Main Insights Generator ====================

export class RealTimeInsightsGenerator extends EventEmitter {
  private redis: Redis;
  private insightRules: Map<string, InsightRule>;
  private insightCache: Map<string, Insight[]>;
  private generationQueue: Set<string>;
  private streamManager: StreamManager;

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 3, // Dedicated DB for insights
    });

    this.insightRules = new Map();
    this.insightCache = new Map();
    this.generationQueue = new Set();
    this.streamManager = new StreamManager();

    this.initializeRules();
    this.startGenerationWorker();
  }

  /**
   * Initialize insight generation rules
   */
  private initializeRules(): void {
    // Performance insights
    this.addRule({
      id: 'goal_at_risk',
      name: 'Goal at Risk Detection',
      condition: (data) => data.goalProgress < 0.3 && data.daysRemaining < 14,
      generator: this.generateGoalAtRiskInsight.bind(this),
      priority: 9,
      enabled: true,
    });

    this.addRule({
      id: 'streak_achievement',
      name: 'Streak Achievement',
      condition: (data) => data.streakDays >= 7,
      generator: this.generateStreakInsight.bind(this),
      priority: 7,
      enabled: true,
    });

    this.addRule({
      id: 'engagement_drop',
      name: 'Engagement Drop Detection',
      condition: (data) => data.engagementTrend === 'decreasing' && data.dropPercent > 20,
      generator: this.generateEngagementDropInsight.bind(this),
      priority: 8,
      enabled: true,
    });

    this.addRule({
      id: 'skill_improvement',
      name: 'Skill Improvement Detection',
      condition: (data) => data.skillImprovement > 15,
      generator: this.generateSkillImprovementInsight.bind(this),
      priority: 6,
      enabled: true,
    });

    this.addRule({
      id: 'optimal_time',
      name: 'Optimal Time Discovery',
      condition: (data) => data.hasOptimalTime && data.confidence > 0.8,
      generator: this.generateOptimalTimeInsight.bind(this),
      priority: 5,
      enabled: true,
    });

    logger.info(`Initialized ${this.insightRules.size} insight generation rules`);
  }

  /**
   * Generate insights for a user
   */
  async generateInsights(context: InsightGenerationContext): Promise<Insight[]> {
    const startTime = performance.now();

    try {
      // Check cache first
      const cached = this.getCachedInsights(context.userId);
      if (cached && this.isCacheValid(cached, context)) {
        return this.filterInsights(cached, context);
      }

      // Fetch user data
      const userData = await this.fetchUserData(context.userId, context.timeframe);

      // Analyze data for insights
      const analysisResults = await this.analyzeUserData(userData);

      // Generate insights based on rules
      const insights = await this.applyRules(analysisResults, context);

      // Enhance insights with predictions
      const enhancedInsights = await this.enhanceWithPredictions(insights, userData);

      // Rank and filter insights
      const finalInsights = this.rankAndFilter(enhancedInsights, context);

      // Cache insights
      this.cacheInsights(context.userId, finalInsights);

      // Track performance
      const generationTime = performance.now() - startTime;
      logger.info(`Generated ${finalInsights.length} insights in ${generationTime}ms`);

      // Emit event
      this.emit('insights:generated', {
        userId: context.userId,
        count: finalInsights.length,
        generationTime,
      });

      return finalInsights;
    } catch (error) {
      logger.error('Failed to generate insights', error);
      throw error;
    }
  }

  /**
   * Stream real-time insights
   */
  async *streamInsights(userId: string, options: {
    interval?: number;
    stopCondition?: () => boolean;
  } = {}): AsyncGenerator<Insight> {
    const interval = options.interval || 5000; // Default 5 seconds
    const stream = this.streamManager.createStream(userId);

    while (!options.stopCondition || !options.stopCondition()) {
      // Generate fresh insights
      const insights = await this.generateInsights({
        userId,
        timeframe: '1d',
        minImportance: 0.5,
      });

      // Yield new insights
      for (const insight of insights) {
        if (!stream.hasDelivered(insight.id)) {
          yield insight;
          stream.markDelivered(insight.id);
        }
      }

      // Wait before next generation
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  /**
   * Generate contextual insight
   */
  async generateContextualInsight(
    userId: string,
    context: {
      currentActivity?: string;
      recentActions?: string[];
      mood?: string;
      timeOfDay?: string;
    }
  ): Promise<Insight | null> {
    try {
      // Fetch recent data
      const recentData = await this.fetchRecentData(userId, 1); // Last hour

      // Analyze context
      const contextAnalysis = this.analyzeContext(context, recentData);

      // Generate appropriate insight
      if (contextAnalysis.needsMotivation) {
        return this.generateMotivationalInsight(userId, contextAnalysis);
      } else if (contextAnalysis.needsGuidance) {
        return this.generateGuidanceInsight(userId, contextAnalysis);
      } else if (contextAnalysis.hasOpportunity) {
        return this.generateOpportunityInsight(userId, contextAnalysis);
      }

      return null;
    } catch (error) {
      logger.error('Failed to generate contextual insight', error);
      return null;
    }
  }

  /**
   * Generate comparative insights
   */
  async generateComparativeInsights(
    userId: string,
    comparisonGroup: 'peers' | 'top_performers' | 'similar_goals'
  ): Promise<Insight[]> {
    try {
      // Fetch comparison data
      const comparisonData = await this.fetchComparisonData(userId, comparisonGroup);

      // Analyze differences
      const analysis = this.analyzeComparisons(comparisonData);

      // Generate insights
      const insights: Insight[] = [];

      if (analysis.strengths.length > 0) {
        insights.push(this.generateStrengthInsight(userId, analysis.strengths));
      }

      if (analysis.improvements.length > 0) {
        insights.push(this.generateImprovementInsight(userId, analysis.improvements));
      }

      if (analysis.opportunities.length > 0) {
        insights.push(this.generateOpportunityInsight(userId, analysis.opportunities));
      }

      return insights;
    } catch (error) {
      logger.error('Failed to generate comparative insights', error);
      return [];
    }
  }

  /**
   * Generate predictive insights
   */
  async generatePredictiveInsights(userId: string): Promise<Insight[]> {
    try {
      const insights: Insight[] = [];

      // Goal success predictions
      const goalPredictions = await PredictiveCoachingEngine.predictGoalSuccess(userId, userId, 30);
      if (goalPredictions.probability < 0.5) {
        insights.push(this.generateGoalRiskInsight(userId, goalPredictions));
      }

      // Engagement predictions
      const engagementPredictions = await PredictiveCoachingEngine.predictEngagement(userId);
      if (engagementPredictions.riskOfDisengagement > 0.7) {
        insights.push(this.generateDisengagementRiskInsight(userId, engagementPredictions));
      }

      // Behavior predictions
      const behaviorPredictions = await PredictiveCoachingEngine.predictBehaviorPatterns(userId);
      for (const pattern of behaviorPredictions.patterns) {
        if (pattern.type === 'negative' && pattern.strength > 0.6) {
          insights.push(this.generateBehaviorPatternInsight(userId, pattern));
        }
      }

      return insights;
    } catch (error) {
      logger.error('Failed to generate predictive insights', error);
      return [];
    }
  }

  // ==================== Rule Management ====================

  /**
   * Add insight generation rule
   */
  addRule(rule: InsightRule): void {
    this.insightRules.set(rule.id, rule);
  }

  /**
   * Remove insight generation rule
   */
  removeRule(ruleId: string): void {
    this.insightRules.delete(ruleId);
  }

  /**
   * Enable/disable rule
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.insightRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  // ==================== Helper Methods ====================

  private async fetchUserData(userId: string, timeframe: string): Promise<unknown> {
    const [analytics, memories, goals, kpis] = await Promise.all([
      UserAnalytics.findOne({ where: { userId } }),
      CoachMemory.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: this.getTimeframeDate(timeframe) },
        },
      }),
      Goal.findAll({ where: { userId } }),
      KpiTracker.findAll({ where: { userId } }),
    ]);

    return { analytics, memories, goals, kpis };
  }

  private async analyzeUserData(data: unknown): Promise<unknown> {
    const analysis = {
      // Goal analysis
      goalProgress: this.calculateGoalProgress(data.goals),
      goalsAtRisk: this.identifyGoalsAtRisk(data.goals),

      // Engagement analysis
      engagementScore: data.analytics?.engagementScore || 0,
      engagementTrend: this.calculateEngagementTrend(data.memories),
      streakDays: this.calculateStreak(data.memories),

      // Performance analysis
      performanceMetrics: this.calculatePerformanceMetrics(data.kpis),
      skillImprovement: this.calculateSkillImprovement(data.kpis),

      // Behavioral analysis
      patterns: await this.extractPatterns(data.memories),
      optimalTimes: this.identifyOptimalTimes(data.memories),

      // Context
      lastActive: data.analytics?.lastActive,
      totalSessions: data.memories.filter(m => m.type === 'session').length,
    };

    return analysis;
  }

  private async applyRules(analysis: unknown, context: InsightGenerationContext): Promise<Insight[]> {
    const insights: Insight[] = [];

    for (const [ruleId, rule] of this.insightRules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(analysis)) {
          const insight = rule.generator(analysis);
          if (insight && (!context.excludeTypes || !context.excludeTypes.includes(insight.type))) {
            insights.push(insight);
          }
        }
      } catch (error) {
        logger.error(`Failed to apply rule ${ruleId}`, error);
      }
    }

    return insights;
  }

  private async enhanceWithPredictions(insights: Insight[], userData: unknown): Promise<Insight[]> {
    // Add predictive elements to existing insights
    for (const insight of insights) {
      if (insight.type === 'risk' || insight.type === 'opportunity') {
        const prediction = await this.getPredictionForInsight(insight, userData);
        if (prediction) {
          insight.supportingData.metrics['predicted_outcome'] = prediction.probability;
          insight.supportingData.trends.push({
            metric: 'predicted_trend',
            period: '30d',
            direction: prediction.trend,
            changePercent: prediction.change,
            significance: prediction.confidence,
          });
        }
      }
    }

    return insights;
  }

  private rankAndFilter(insights: Insight[], context: InsightGenerationContext): Insight[] {
    // Calculate relevance score for each insight
    const scoredInsights = insights.map(insight => ({
      insight,
      score: this.calculateRelevanceScore(insight, context),
    }));

    // Sort by score
    scoredInsights.sort((a, b) => b.score - a.score);

    // Apply filters
    let filtered = scoredInsights
      .filter(item => !context.minImportance || item.insight.importance >= context.minImportance)
      .map(item => item.insight);

    // Limit number of insights
    if (context.maxInsights) {
      filtered = filtered.slice(0, context.maxInsights);
    }

    return filtered;
  }

  private calculateRelevanceScore(insight: Insight, context: InsightGenerationContext): number {
    let score = insight.importance * 0.4 + insight.urgency * 0.3 + insight.confidence * 0.3;

    // Boost score for focused areas
    if (context.focus && context.focus.includes(insight.category)) {
      score *= 1.5;
    }

    // Boost actionable insights
    if (insight.actionable) {
      score *= 1.2;
    }

    return Math.min(1, score);
  }

  private getCachedInsights(userId: string): Insight[] | null {
    return this.insightCache.get(userId) || null;
  }

  private isCacheValid(insights: Insight[], context: InsightGenerationContext): boolean {
    if (insights.length === 0) return false;

    const oldestInsight = insights.reduce((oldest, current) =>
      current.timestamp < oldest.timestamp ? current : oldest
    );

    const cacheAge = Date.now() - oldestInsight.timestamp.getTime();
    const maxAge = this.getMaxCacheAge(context.timeframe);

    return cacheAge < maxAge;
  }

  private filterInsights(insights: Insight[], context: InsightGenerationContext): Insight[] {
    return insights.filter(insight => {
      if (context.excludeTypes && context.excludeTypes.includes(insight.type)) {
        return false;
      }
      if (context.minImportance && insight.importance < context.minImportance) {
        return false;
      }
      return true;
    });
  }

  private cacheInsights(userId: string, insights: Insight[]): void {
    this.insightCache.set(userId, insights);

    // Also cache in Redis for persistence
    this.redis.setex(
      `insights:${userId}`,
      3600,
      JSON.stringify(insights)
    );
  }

  private startGenerationWorker(): void {
    setInterval(async () => {
      for (const userId of this.generationQueue) {
        try {
          await this.generateInsights({
            userId,
            timeframe: '7d',
            minImportance: 0.5,
          });
          this.generationQueue.delete(userId);
        } catch (error) {
          logger.error(`Failed to generate insights for user ${userId}`, error);
        }
      }
    }, 30000); // Run every 30 seconds
  }

  // ==================== Insight Generators ====================

  private generateGoalAtRiskInsight(data: unknown): Insight {
    const goalAtRisk = data.goalsAtRisk[0];

    return {
      id: `goal_risk_${Date.now()}`,
      userId: data.userId,
      type: 'risk',
      category: 'goal',
      title: 'Goal at Risk',
      description: `Your goal "${goalAtRisk.title}" is at risk of not being completed on time`,
      importance: 0.9,
      urgency: 0.95,
      confidence: 0.85,
      actionable: true,
      actions: [
        {
          id: 'action_1',
          action: 'Review and adjust your goal timeline',
          priority: 'high',
          estimatedImpact: 0.7,
          estimatedEffort: 'low',
        },
        {
          id: 'action_2',
          action: 'Break down the goal into smaller tasks',
          priority: 'medium',
          estimatedImpact: 0.6,
          estimatedEffort: 'medium',
        },
      ],
      supportingData: {
        metrics: {
          current_progress: goalAtRisk.progress,
          required_progress: goalAtRisk.requiredProgress,
          days_remaining: goalAtRisk.daysRemaining,
        },
        trends: [],
        comparisons: [],
      },
      relatedInsights: [],
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  private generateStreakInsight(data: unknown): Insight {
    return {
      id: `streak_${Date.now()}`,
      userId: data.userId,
      type: 'achievement',
      category: 'engagement',
      title: `${data.streakDays} Day Streak!`,
      description: `Congratulations! You've maintained a ${data.streakDays} day streak`,
      importance: 0.7,
      urgency: 0.3,
      confidence: 1.0,
      actionable: true,
      actions: [
        {
          id: 'action_1',
          action: 'Share your achievement',
          priority: 'low',
          estimatedImpact: 0.3,
          estimatedEffort: 'low',
        },
      ],
      supportingData: {
        metrics: {
          streak_days: data.streakDays,
          consistency_score: data.consistencyScore,
        },
        trends: [],
        comparisons: [],
      },
      relatedInsights: [],
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  private generateEngagementDropInsight(data: unknown): Insight {
    return {
      id: `engagement_drop_${Date.now()}`,
      userId: data.userId,
      type: 'risk',
      category: 'engagement',
      title: 'Engagement Decrease Detected',
      description: `Your engagement has decreased by ${data.dropPercent}% this week`,
      importance: 0.8,
      urgency: 0.7,
      confidence: 0.9,
      actionable: true,
      actions: [
        {
          id: 'action_1',
          action: 'Schedule shorter, more frequent sessions',
          priority: 'high',
          estimatedImpact: 0.6,
          estimatedEffort: 'low',
        },
        {
          id: 'action_2',
          action: 'Review and adjust your goals',
          priority: 'medium',
          estimatedImpact: 0.5,
          estimatedEffort: 'medium',
        },
      ],
      supportingData: {
        metrics: {
          engagement_drop: data.dropPercent,
          current_engagement: data.engagementScore,
        },
        trends: [
          {
            metric: 'engagement',
            period: '7d',
            direction: 'down',
            changePercent: data.dropPercent,
            significance: 0.9,
          },
        ],
        comparisons: [],
      },
      relatedInsights: [],
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };
  }

  private generateSkillImprovementInsight(data: unknown): Insight {
    return {
      id: `skill_improvement_${Date.now()}`,
      userId: data.userId,
      type: 'achievement',
      category: 'learning',
      title: 'Skill Improvement Detected',
      description: `Your skills have improved by ${data.skillImprovement}% this month`,
      importance: 0.8,
      urgency: 0.4,
      confidence: 0.85,
      actionable: true,
      actions: [
        {
          id: 'action_1',
          action: 'Take on more challenging tasks',
          priority: 'medium',
          estimatedImpact: 0.7,
          estimatedEffort: 'medium',
        },
      ],
      supportingData: {
        metrics: {
          improvement_percent: data.skillImprovement,
        },
        trends: [],
        comparisons: [],
      },
      relatedInsights: [],
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  private generateOptimalTimeInsight(data: unknown): Insight {
    return {
      id: `optimal_time_${Date.now()}`,
      userId: data.userId,
      type: 'opportunity',
      category: 'performance',
      title: 'Optimal Performance Time Identified',
      description: `You perform best during ${data.optimalTime}`,
      importance: 0.7,
      urgency: 0.5,
      confidence: data.confidence,
      actionable: true,
      actions: [
        {
          id: 'action_1',
          action: `Schedule important tasks during ${data.optimalTime}`,
          priority: 'medium',
          estimatedImpact: 0.8,
          estimatedEffort: 'low',
        },
      ],
      supportingData: {
        metrics: {
          performance_boost: data.performanceBoost,
          confidence: data.confidence,
        },
        trends: [],
        comparisons: [],
      },
      relatedInsights: [],
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };
  }

  // Stub implementations for helper methods
  private getTimeframeDate(timeframe: string): Date {
    const now = new Date();
    const match = timeframe.match(/(\d+)([hdwmy])/);
    if (!match) return now;

    const [, value, unit] = match;
    const amount = parseInt(value);

    switch (unit) {
      case 'h': return new Date(now.getTime() - amount * 60 * 60 * 1000);
      case 'd': return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
      case 'w': return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
      case 'm': return new Date(now.getTime() - amount * 30 * 24 * 60 * 60 * 1000);
      case 'y': return new Date(now.getTime() - amount * 365 * 24 * 60 * 60 * 1000);
      default: return now;
    }
  }

  private getMaxCacheAge(timeframe: string): number {
    const match = timeframe.match(/(\d+)([hdwmy])/);
    if (!match) return 3600000; // 1 hour default

    const [, , unit] = match;
    switch (unit) {
      case 'h': return 300000; // 5 minutes
      case 'd': return 3600000; // 1 hour
      case 'w': return 21600000; // 6 hours
      default: return 86400000; // 24 hours
    }
  }

  private calculateGoalProgress(goals: unknown[]): number {
    if (!goals || goals.length === 0) return 0;
    const totalProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0);
    return totalProgress / goals.length;
  }

  private identifyGoalsAtRisk(goals: unknown[]): unknown[] {
    return goals.filter(g => g.progress < 0.5 && g.daysRemaining < 14);
  }

  private calculateEngagementTrend(memories: unknown[]): string {
    // Simplified trend calculation
    return 'stable';
  }

  private calculateStreak(memories: unknown[]): number {
    // Simplified streak calculation
    return 7;
  }

  private calculatePerformanceMetrics(kpis: unknown[]): unknown {
    return {};
  }

  private calculateSkillImprovement(kpis: unknown[]): number {
    return 15;
  }

  private async extractPatterns(memories: unknown[]): Promise<any[]> {
    return [];
  }

  private identifyOptimalTimes(memories: unknown[]): unknown {
    return { hasOptimalTime: true, optimalTime: '9:00 AM - 11:00 AM', confidence: 0.85 };
  }

  private async getPredictionForInsight(insight: Insight, userData: unknown): Promise<unknown> {
    return {
      probability: 0.75,
      trend: 'up' as const,
      change: 15,
      confidence: 0.8,
    };
  }

  private async fetchRecentData(userId: string, hours: number): Promise<unknown> {
    return {};
  }

  private analyzeContext(context: unknown, data: unknown): unknown {
    return {
      needsMotivation: false,
      needsGuidance: true,
      hasOpportunity: false,
    };
  }

  private async generateMotivationalInsight(userId: string, analysis: unknown): Promise<Insight> {
    return this.generateStreakInsight({ userId, streakDays: 7 });
  }

  private async generateGuidanceInsight(userId: string, analysis: unknown): Promise<Insight> {
    return this.generateOptimalTimeInsight({ userId, optimalTime: '9:00 AM', confidence: 0.8 });
  }

  private async generateOpportunityInsight(userId: string, analysis: unknown): Promise<Insight> {
    return this.generateSkillImprovementInsight({ userId, skillImprovement: 20 });
  }

  private async fetchComparisonData(userId: string, group: string): Promise<unknown> {
    return {};
  }

  private analyzeComparisons(data: unknown): unknown {
    return {
      strengths: [],
      improvements: [],
      opportunities: [],
    };
  }

  private generateStrengthInsight(userId: string, strengths: unknown[]): Insight {
    return this.generateSkillImprovementInsight({ userId, skillImprovement: 25 });
  }

  private generateImprovementInsight(userId: string, improvements: unknown[]): Insight {
    return this.generateEngagementDropInsight({ userId, dropPercent: 10, engagementScore: 70 });
  }

  private generateGoalRiskInsight(userId: string, predictions: unknown): Insight {
    return this.generateGoalAtRiskInsight({
      userId,
      goalsAtRisk: [{ title: 'Goal', progress: 0.3, requiredProgress: 0.5, daysRemaining: 10 }]
    });
  }

  private generateDisengagementRiskInsight(userId: string, predictions: unknown): Insight {
    return this.generateEngagementDropInsight({ userId, dropPercent: 25, engagementScore: 60 });
  }

  private generateBehaviorPatternInsight(userId: string, pattern: unknown): Insight {
    return this.generateOptimalTimeInsight({ userId, optimalTime: '10:00 AM', confidence: 0.9 });
  }
}

// ==================== Supporting Classes ====================

class StreamManager {
  private streams: Map<string, UserStream>;

  constructor() {
    this.streams = new Map();
  }

  createStream(userId: string): UserStream {
    if (!this.streams.has(userId)) {
      this.streams.set(userId, new UserStream(userId));
    }
    return this.streams.get(userId)!;
  }

  closeStream(userId: string): void {
    this.streams.delete(userId);
  }
}

class UserStream {
  private userId: string;
  private deliveredInsights: Set<string>;

  constructor(userId: string) {
    this.userId = userId;
    this.deliveredInsights = new Set();
  }

  hasDelivered(insightId: string): boolean {
    return this.deliveredInsights.has(insightId);
  }

  markDelivered(insightId: string): void {
    this.deliveredInsights.add(insightId);
  }
}

export default new RealTimeInsightsGenerator();