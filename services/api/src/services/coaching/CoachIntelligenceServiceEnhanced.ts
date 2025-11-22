/**
 * Enhanced Coach Intelligence Service
 * Complete implementation of all analytics and intelligence methods
 * @author UpCoach Architecture Team
 * @version 2.0.0
 */

import { Op } from 'sequelize';
import KpiTracker from '../../models/analytics/KpiTracker';
import UserAnalytics from '../../models/analytics/UserAnalytics';
import CoachMemory from '../../models/coaching/CoachMemory';
import { User } from '../../models/User';
import { Goal } from '../../models/Goal';
import { logger } from '../../utils/logger';
import { aiService } from '../ai/AIService';
import { UnifiedCacheService } from '../cache/UnifiedCacheService';
import { AnalyticsService } from '../analytics/AnalyticsService';

/**
 * Enhanced interfaces for comprehensive analytics
 */

interface EngagementMetrics {
  overallScore: number;
  dailyActive: boolean;
  weeklyActive: boolean;
  monthlyActive: boolean;
  sessionFrequency: number;
  averageSessionDuration: number;
  interactionDepth: number;
  featureAdoption: number;
  retentionRate: number;
  churnRisk: number;
}

interface NPSData {
  score: number;
  category: 'promoter' | 'passive' | 'detractor';
  trend: 'improving' | 'declining' | 'stable';
  historicalScores: Array<{ date: Date; score: number }>;
  feedback?: string[];
  improvementAreas?: string[];
}

interface SkillAssessment {
  skillName: string;
  currentLevel: number;
  previousLevel: number;
  improvement: number;
  improvementRate: number;
  timeToImprove: number;
  recommendations: string[];
  practiceAreas: string[];
}

interface CustomKPI {
  kpiId: string;
  name: string;
  value: number;
  target: number;
  achievement: number;
  trend: 'up' | 'down' | 'stable';
  forecast: number;
  insights: string[];
}

interface PredictionResult {
  successProbability: number;
  riskFactors: string[];
  successFactors: string[];
  recommendedActions: string[];
  confidenceLevel: number;
  timeToGoal: number;
}

interface BehaviorInsight {
  pattern: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  recommendations: string[];
  relatedGoals: string[];
}

interface PerformanceBenchmark {
  metric: string;
  userValue: number;
  peerAverage: number;
  topPerformerAverage: number;
  percentileRank: number;
  improvementGap: number;
  recommendations: string[];
}

/**
 * Enhanced Coach Intelligence Service with complete implementation
 */
export class CoachIntelligenceServiceEnhanced {
  private cache: UnifiedCacheService;
  private analytics: AnalyticsService;

  constructor() {
    this.cache = new UnifiedCacheService();
    this.analytics = new AnalyticsService();
  }

  /**
   * Calculate comprehensive engagement score for a user
   * Analyzes multiple engagement dimensions and provides actionable insights
   */
  async calculateEngagementScore(userId: string): Promise<EngagementMetrics> {
    const cacheKey = `engagement:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached as EngagementMetrics;

    try {
      // Get user's coaching memories from last 30 days
      const memories = await CoachMemory.findAll({
        where: {
          userId,
          conversationDate: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['conversationDate', 'DESC']]
      });

      // Get user analytics
      const analytics = await UserAnalytics.findOne({
        where: { userId },
        order: [['calculatedAt', 'DESC']]
      });

      // Calculate daily, weekly, monthly active status
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const dailyActive = memories.some(m => 
        new Date(m.conversationDate) >= oneDayAgo
      );
      const weeklyActive = memories.some(m => 
        new Date(m.conversationDate) >= oneWeekAgo
      );
      const monthlyActive = memories.some(m => 
        new Date(m.conversationDate) >= oneMonthAgo
      );

      // Calculate session frequency (sessions per week)
      const weeklyMemories = memories.filter(m => 
        new Date(m.conversationDate) >= oneWeekAgo
      );
      const sessionFrequency = weeklyMemories.length;

      // Calculate average session duration from analytics
      const averageSessionDuration = analytics?.engagementMetrics?.averageSessionDuration || 0;

      // Calculate interaction depth (based on content richness)
      const interactionDepth = this.calculateInteractionDepth(memories);

      // Calculate feature adoption (percentage of features used)
      const featureAdoption = await this.calculateFeatureAdoption(userId);

      // Calculate retention rate
      const retentionRate = await this.calculateRetentionRate(userId);

      // Calculate churn risk
      const churnRisk = await this.calculateChurnRisk(userId, {
        dailyActive,
        weeklyActive,
        sessionFrequency,
        retentionRate
      });

      // Calculate overall engagement score (weighted average)
      const overallScore = this.calculateWeightedEngagementScore({
        dailyActive,
        weeklyActive,
        monthlyActive,
        sessionFrequency,
        averageSessionDuration,
        interactionDepth,
        featureAdoption,
        retentionRate,
        churnRisk
      });

      const metrics: EngagementMetrics = {
        overallScore,
        dailyActive,
        weeklyActive,
        monthlyActive,
        sessionFrequency,
        averageSessionDuration,
        interactionDepth,
        featureAdoption,
        retentionRate,
        churnRisk
      };

      // Cache for 1 hour
      await this.cache.set(cacheKey, metrics, { ttl: 3600 });

      // Track the metric
      await this.analytics.trackUserAction(parseInt(userId), 'engagement_calculated', metrics);

      return metrics;
    } catch (error) {
      logger.error('Error calculating engagement score:', error);
      throw error;
    }
  }

  /**
   * Calculate and track NPS (Net Promoter Score)
   */
  async calculateNPSScore(userId: string): Promise<NPSData> {
    const cacheKey = `nps:${userId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached as NPSData;

    try {
      // Get user's satisfaction data from memories
      const memories = await CoachMemory.findAll({
        where: { userId },
        order: [['conversationDate', 'DESC']],
        limit: 30
      });

      // Calculate sentiment-based NPS proxy
      const sentimentScores = memories.map(m => m.emotionalContext?.sentiment || 0);
      const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
      
      // Convert sentiment (-1 to 1) to NPS scale (0-10)
      const npsScore = Math.round((avgSentiment + 1) * 5);
      
      // Categorize based on NPS score
      let category: 'promoter' | 'passive' | 'detractor';
      if (npsScore >= 9) category = 'promoter';
      else if (npsScore >= 7) category = 'passive';
      else category = 'detractor';

      // Get historical scores
      const historicalScores = await this.getNPSHistory(userId);
      
      // Determine trend
      const trend = this.calculateNPSTrend(historicalScores);

      // Generate improvement areas based on low-scoring aspects
      const improvementAreas = await this.identifyNPSImprovementAreas(userId, memories);

      // Extract feedback from memories
      const feedback = memories
        .filter(m => m.coachingContext?.followUpNeeded)
        .map(m => m.summary)
        .filter(Boolean)
        .slice(0, 5);

      const npsData: NPSData = {
        score: npsScore,
        category,
        trend,
        historicalScores,
        feedback,
        improvementAreas
      };

      // Cache for 24 hours
      await this.cache.set(cacheKey, npsData, { ttl: 86400 });

      // Store NPS score for historical tracking
      await this.storeNPSScore(userId, npsScore);

      return npsData;
    } catch (error) {
      logger.error('Error calculating NPS score:', error);
      throw error;
    }
  }

  /**
   * Get NPS trends over time
   */
  async getNPSTrends(userId: string, period: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    trend: 'improving' | 'declining' | 'stable';
    averageScore: number;
    changeRate: number;
    projection: number;
  }> {
    try {
      const historicalScores = await this.getNPSHistory(userId, period);
      
      if (historicalScores.length < 2) {
        return {
          trend: 'stable',
          averageScore: historicalScores[0]?.score || 7,
          changeRate: 0,
          projection: historicalScores[0]?.score || 7
        };
      }

      // Calculate average score
      const averageScore = historicalScores.reduce((sum, h) => sum + h.score, 0) / historicalScores.length;

      // Calculate trend using linear regression
      const n = historicalScores.length;
      const sumX = historicalScores.reduce((sum, _, i) => sum + i, 0);
      const sumY = historicalScores.reduce((sum, h) => sum + h.score, 0);
      const sumXY = historicalScores.reduce((sum, h, i) => sum + i * h.score, 0);
      const sumX2 = historicalScores.reduce((sum, _, i) => sum + i * i, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const changeRate = slope;

      // Determine trend
      let trend: 'improving' | 'declining' | 'stable';
      if (Math.abs(slope) < 0.1) trend = 'stable';
      else if (slope > 0) trend = 'improving';
      else trend = 'declining';

      // Project next period score
      const projection = Math.max(0, Math.min(10, averageScore + slope));

      return {
        trend,
        averageScore,
        changeRate,
        projection
      };
    } catch (error) {
      logger.error('Error getting NPS trends:', error);
      throw error;
    }
  }

  /**
   * Assess skill improvement over time
   */
  async assessSkillImprovement(
    userId: string,
    skillName: string
  ): Promise<SkillAssessment> {
    try {
      // Get skill-related memories and goals
      const memories = await CoachMemory.findAll({
        where: {
          userId,
          tags: {
            [Op.overlap]: [skillName.toLowerCase()]
          }
        },
        order: [['conversationDate', 'DESC']]
      });

      const goals = await KpiTracker.findAll({
        where: {
          userId,
          title: {
            [Op.iLike]: `%${skillName}%`
          }
        }
      });

      // Calculate current and previous skill levels
      const currentLevel = await this.calculateCurrentSkillLevel(memories, goals);
      const previousLevel = await this.calculatePreviousSkillLevel(memories, goals);
      
      const improvement = currentLevel - previousLevel;
      const improvementRate = previousLevel > 0 ? improvement / previousLevel : 0;

      // Calculate time to improve
      const timeToImprove = this.calculateTimeToSkillImprovement(memories, improvement);

      // Generate recommendations
      const recommendations = await this.generateSkillRecommendations(
        skillName,
        currentLevel,
        improvement,
        memories
      );

      // Identify practice areas
      const practiceAreas = await this.identifyPracticeAreas(skillName, currentLevel, memories);

      return {
        skillName,
        currentLevel,
        previousLevel,
        improvement,
        improvementRate,
        timeToImprove,
        recommendations,
        practiceAreas
      };
    } catch (error) {
      logger.error('Error assessing skill improvement:', error);
      throw error;
    }
  }

  /**
   * Track custom KPI metrics
   */
  async trackCustomKPI(
    userId: string,
    kpiName: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<CustomKPI> {
    try {
      // Find or create KPI tracker
      let kpiTracker = await KpiTracker.findOne({
        where: {
          userId,
          title: kpiName
        }
      });

      if (!kpiTracker) {
        kpiTracker = await KpiTracker.create({
          userId,
          title: kpiName,
          description: metadata?.description || `Custom KPI: ${kpiName}`,
          type: 'kpi',
          category: 'custom',
          keyResults: [],
          kpiData: {
            metric: kpiName,
            target: metadata?.target || 100,
            current: value,
            unit: metadata?.unit || 'points',
            trend: 'stable',
            frequency: 'daily'
          },
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          reviewFrequency: 'weekly',
          nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          overallProgress: 0,
          status: 'in_progress',
          milestones: [],
          performanceHistory: [],
          coachingData: {
            coachingFrequency: 'weekly',
            coachingNotes: [],
            actionItems: []
          },
          analytics: {
            averageProgress: 0,
            velocityScore: 0,
            consistencyScore: 0,
            riskFactors: [],
            successFactors: [],
            recommendations: []
          },
          collaborators: [],
          priority: (metadata?.priority as 'low' | 'medium' | 'high' | 'critical') || 'medium',
          confidentiality: 'private',
          tags: []
        });
      } else {
        // Update existing KPI
        const history = kpiTracker.performanceHistory || [];
        history.push({
          date: new Date(),
          value,
          note: metadata?.note,
          context: metadata?.context
        });

        if (kpiTracker.kpiData) {
          kpiTracker.kpiData.current = value;
        }
        kpiTracker.performanceHistory = history;
        const targetValue = kpiTracker.kpiData?.target || 100;
        kpiTracker.overallProgress = (value / targetValue) * 100;
        
        await kpiTracker.save();
      }

      // Calculate trend
      const trend = this.calculateKPITrend(kpiTracker.performanceHistory);
      
      // Generate forecast
      const forecast = await this.forecastKPIValue(kpiTracker);

      // Generate insights
      const insights = await this.generateKPIInsights(kpiTracker, trend);

      return {
        kpiId: kpiTracker.id,
        name: kpiName,
        value,
        target: kpiTracker.kpiData?.target || 0,
        achievement: kpiTracker.overallProgress,
        trend,
        forecast,
        insights
      };
    } catch (error) {
      logger.error('Error tracking custom KPI:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive KPI report
   */
  async generateKPIReport(
    userId: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<{
    summary: Record<string, any>;
    kpis: CustomKPI[];
    insights: string[];
    recommendations: string[];
    performanceScore: number;
  }> {
    try {
      // Get all KPIs for user
      const kpiTrackers = await KpiTracker.findAll({
        where: { userId },
        order: [['priority', 'DESC'], ['createdAt', 'DESC']]
      });

      // Process each KPI
      const kpis: CustomKPI[] = [];
      for (const tracker of kpiTrackers) {
        const trend = this.calculateKPITrend(tracker.performanceHistory);
        const forecast = await this.forecastKPIValue(tracker);
        const insights = await this.generateKPIInsights(tracker, trend);

        kpis.push({
          kpiId: tracker.id,
          name: tracker.title,
          value: tracker.kpiData?.current || 0,
          target: tracker.kpiData?.target || 100,
          achievement: tracker.overallProgress,
          trend,
          forecast,
          insights
        });
      }

      // Calculate summary statistics
      const summary = {
        totalKPIs: kpis.length,
        achievedKPIs: kpis.filter(k => k.achievement >= 100).length,
        averageAchievement: kpis.reduce((sum, k) => sum + k.achievement, 0) / kpis.length,
        improvingKPIs: kpis.filter(k => k.trend === 'up').length,
        decliningKPIs: kpis.filter(k => k.trend === 'down').length
      };

      // Generate overall insights
      const insights = await this.generateOverallKPIInsights(kpis, summary);

      // Generate recommendations
      const recommendations = await this.generateKPIRecommendations(kpis, summary);

      // Calculate performance score
      const performanceScore = this.calculatePerformanceScore(kpis);

      return {
        summary,
        kpis,
        insights,
        recommendations,
        performanceScore
      };
    } catch (error) {
      logger.error('Error generating KPI report:', error);
      throw error;
    }
  }

  /**
   * Predict user success probability
   */
  async predictUserSuccess(
    userId: string,
    goalId?: string
  ): Promise<PredictionResult> {
    try {
      // Get user's historical data
      const memories = await CoachMemory.findAll({
        where: { userId },
        order: [['conversationDate', 'DESC']],
        limit: 100
      });

      const goals = await KpiTracker.findAll({
        where: goalId ? { userId, id: goalId } : { userId }
      });

      const analytics = await UserAnalytics.findOne({
        where: { userId },
        order: [['calculatedAt', 'DESC']]
      });

      // Prepare features for prediction
      const features = {
        engagementScore: analytics ? (analytics.engagementMetrics.participationScore * 0.4 + analytics.engagementMetrics.followThroughRate * 0.4 + analytics.engagementMetrics.responsiveness * 0.2) : 0.5,
        consistencyScore: this.calculateConsistencyIndex(memories),
        sentimentScore: this.calculateAverageSentiment(memories),
        progressVelocity: this.calculateProgressVelocity(goals),
        historicalSuccess: this.calculateHistoricalSuccessRate(goals),
        currentMomentum: this.calculateCurrentMomentum(memories, goals)
      };

      // Apply success prediction model
      const successProbability = this.applySuccessPredictionModel(features);

      // Identify risk and success factors
      const riskFactors = this.identifyRiskFactors(features, memories, goals);
      const successFactors = this.identifySuccessFactors(features, memories, goals);

      // Generate recommended actions
      const recommendedActions = await this.generateSuccessActions(
        features,
        riskFactors,
        successFactors
      );

      // Calculate confidence level
      const confidenceLevel = this.calculatePredictionConfidence(memories, goals);

      // Estimate time to goal
      const timeToGoal = this.estimateTimeToGoal(goals, features);

      return {
        successProbability,
        riskFactors,
        successFactors,
        recommendedActions,
        confidenceLevel,
        timeToGoal
      };
    } catch (error) {
      logger.error('Error predicting user success:', error);
      throw error;
    }
  }

  /**
   * Track confidence level changes
   */
  async trackConfidenceLevel(
    userId: string,
    area: string,
    score: number
  ): Promise<{
    currentLevel: number;
    previousLevel: number;
    change: number;
    trend: 'improving' | 'declining' | 'stable';
    insights: string[];
  }> {
    try {
      const cacheKey = `confidence:${userId}:${area}`;
      
      // Get previous confidence level
      const previousData = await this.cache.get(cacheKey) as unknown;
      const previousLevel = previousData?.currentLevel || 5;

      // Store new confidence level
      const confidenceData = {
        currentLevel: score,
        previousLevel,
        timestamp: new Date(),
        area
      };

      await this.cache.set(cacheKey, confidenceData, { ttl: 86400 * 7 }); // Cache for 7 days

      // Calculate change and trend
      const change = score - previousLevel;
      let trend: 'improving' | 'declining' | 'stable';
      if (Math.abs(change) < 0.5) trend = 'stable';
      else if (change > 0) trend = 'improving';
      else trend = 'declining';

      // Generate insights
      const insights = await this.generateConfidenceInsights(
        area,
        score,
        previousLevel,
        trend
      );

      // Track in analytics
      await this.analytics.trackUserAction(parseInt(userId), 'confidence_tracked', {
        area,
        score,
        change,
        trend
      });

      return {
        currentLevel: score,
        previousLevel,
        change,
        trend,
        insights
      };
    } catch (error) {
      logger.error('Error tracking confidence level:', error);
      throw error;
    }
  }

  /**
   * Generate insights from user behavior patterns
   */
  async generateBehaviorInsights(
    userId: string
  ): Promise<BehaviorInsight[]> {
    try {
      const memories = await CoachMemory.findAll({
        where: { userId },
        order: [['conversationDate', 'DESC']],
        limit: 100
      });

      const goals = await KpiTracker.findAll({
        where: { userId }
      });

      const insights: BehaviorInsight[] = [];

      // Analyze session timing patterns
      const timingPattern = this.analyzeSessionTiming(memories);
      if (timingPattern) {
        insights.push({
          pattern: 'Session Timing Preference',
          frequency: timingPattern.frequency,
          impact: timingPattern.impact,
          description: timingPattern.description,
          recommendations: timingPattern.recommendations,
          relatedGoals: timingPattern.relatedGoals
        });
      }

      // Analyze topic preferences
      const topicPattern = this.analyzeTopicPreferences(memories);
      if (topicPattern) {
        insights.push({
          pattern: 'Topic Focus Areas',
          frequency: topicPattern.frequency,
          impact: topicPattern.impact,
          description: topicPattern.description,
          recommendations: topicPattern.recommendations,
          relatedGoals: topicPattern.relatedGoals
        });
      }

      // Analyze goal achievement patterns
      const achievementPattern = this.analyzeAchievementPatterns(goals);
      if (achievementPattern) {
        insights.push({
          pattern: 'Goal Achievement Style',
          frequency: achievementPattern.frequency,
          impact: achievementPattern.impact,
          description: achievementPattern.description,
          recommendations: achievementPattern.recommendations,
          relatedGoals: achievementPattern.relatedGoals
        });
      }

      // Analyze emotional patterns
      const emotionalPattern = this.analyzeEmotionalPatterns(memories);
      if (emotionalPattern) {
        insights.push({
          pattern: 'Emotional Response Pattern',
          frequency: emotionalPattern.frequency,
          impact: emotionalPattern.impact,
          description: emotionalPattern.description,
          recommendations: emotionalPattern.recommendations,
          relatedGoals: emotionalPattern.relatedGoals
        });
      }

      // Analyze learning style
      const learningPattern = this.analyzeLearningStyle(memories);
      if (learningPattern) {
        insights.push({
          pattern: 'Learning Style Preference',
          frequency: learningPattern.frequency,
          impact: learningPattern.impact,
          description: learningPattern.description,
          recommendations: learningPattern.recommendations,
          relatedGoals: learningPattern.relatedGoals
        });
      }

      return insights;
    } catch (error) {
      logger.error('Error generating behavior insights:', error);
      throw error;
    }
  }

  /**
   * Calculate performance percentile ranking
   */
  async calculatePercentileRank(
    userId: string,
    metric: string
  ): Promise<PerformanceBenchmark> {
    try {
      // Get user's metric value
      const userAnalytics = await UserAnalytics.findOne({
        where: { userId },
        order: [['calculatedAt', 'DESC']]
      });

      const userValue = this.extractMetricValue(userAnalytics, metric);

      // Get peer comparison data
      const peerAnalytics = await UserAnalytics.findAll({
        where: {
          userId: { [Op.ne]: userId },
          calculatedAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        limit: 1000
      });

      // Calculate peer statistics
      const peerValues = peerAnalytics
        .map(p => this.extractMetricValue(p, metric))
        .filter(v => v !== null);

      if (peerValues.length === 0) {
        return {
          metric,
          userValue,
          peerAverage: userValue,
          topPerformerAverage: userValue,
          percentileRank: 50,
          improvementGap: 0,
          recommendations: ['Not enough peer data for comparison']
        };
      }

      // Calculate percentile rank
      const belowUser = peerValues.filter(v => v < userValue).length;
      const percentileRank = Math.round((belowUser / peerValues.length) * 100);

      // Calculate averages
      const peerAverage = peerValues.reduce((a, b) => a + b, 0) / peerValues.length;
      
      // Top 10% performers
      const sortedValues = peerValues.sort((a, b) => b - a);
      const top10Percent = Math.ceil(peerValues.length * 0.1);
      const topPerformers = sortedValues.slice(0, top10Percent);
      const topPerformerAverage = topPerformers.reduce((a, b) => a + b, 0) / topPerformers.length;

      // Calculate improvement gap
      const improvementGap = topPerformerAverage - userValue;

      // Generate recommendations
      const recommendations = await this.generateBenchmarkRecommendations(
        metric,
        percentileRank,
        improvementGap,
        userValue,
        peerAverage
      );

      return {
        metric,
        userValue,
        peerAverage,
        topPerformerAverage,
        percentileRank,
        improvementGap,
        recommendations
      };
    } catch (error) {
      logger.error('Error calculating percentile rank:', error);
      throw error;
    }
  }

  // ============= Helper Methods =============

  private calculateInteractionDepth(memories: CoachMemory[]): number {
    if (memories.length === 0) return 0;
    
    const depths = memories.map(m => {
      const contentLength = m.content?.length || 0;
      const hasActionItems = (m.coachingContext?.actionItems?.length || 0) > 0;
      const hasTags = (m.tags?.length || 0) > 0;
      const hasFollowUp = m.coachingContext?.followUpNeeded || false;
      
      let depth = 0;
      if (contentLength > 500) depth += 0.3;
      else if (contentLength > 200) depth += 0.2;
      else if (contentLength > 50) depth += 0.1;
      
      if (hasActionItems) depth += 0.3;
      if (hasTags) depth += 0.2;
      if (hasFollowUp) depth += 0.2;
      
      return Math.min(1, depth);
    });
    
    return depths.reduce((a, b) => a + b, 0) / depths.length;
  }

  private async calculateFeatureAdoption(userId: string): Promise<number> {
    // Track which features the user has used
    const features = [
      'goal_setting',
      'mood_tracking',
      'voice_journal',
      'progress_photos',
      'chat_coaching',
      'habit_tracking',
      'analytics_view'
    ];
    
    // Get user feature usage from analytics
    const userAnalytics = await this.analytics.getUserAnalytics(parseInt(userId));
    const usedFeatures = userAnalytics?.features || [];
    return usedFeatures.length / features.length;
  }

  private async calculateRetentionRate(userId: string): Promise<number> {
    const user = await User.findByPk(userId);
    if (!user) return 0;
    
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const daysActive = Math.floor(accountAge / (24 * 60 * 60 * 1000));
    
    if (daysActive < 7) return 1; // New users have 100% retention
    
    // Check activity in recent periods
    const recentActivity = await CoachMemory.count({
      where: {
        userId,
        conversationDate: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    return recentActivity > 0 ? 0.8 + (Math.min(recentActivity, 10) * 0.02) : 0.3;
  }

  private async calculateChurnRisk(
    userId: string,
    metrics: Partial<EngagementMetrics>
  ): Promise<number> {
    let risk = 0;
    
    // Factor 1: Activity recency
    if (!metrics.dailyActive) risk += 0.2;
    if (!metrics.weeklyActive) risk += 0.3;
    
    // Factor 2: Session frequency decline
    if ((metrics.sessionFrequency || 0) < 2) risk += 0.2;
    
    // Factor 3: Low retention rate
    if ((metrics.retentionRate || 1) < 0.5) risk += 0.3;
    
    return Math.min(1, risk);
  }

  private calculateWeightedEngagementScore(metrics: Partial<EngagementMetrics>): number {
    const weights = {
      dailyActive: 0.15,
      weeklyActive: 0.15,
      monthlyActive: 0.05,
      sessionFrequency: 0.20,
      averageSessionDuration: 0.15,
      interactionDepth: 0.10,
      featureAdoption: 0.10,
      retentionRate: 0.10
    };
    
    let score = 0;
    score += (metrics.dailyActive ? 1 : 0) * weights.dailyActive;
    score += (metrics.weeklyActive ? 1 : 0) * weights.weeklyActive;
    score += (metrics.monthlyActive ? 1 : 0) * weights.monthlyActive;
    score += Math.min(1, (metrics.sessionFrequency || 0) / 7) * weights.sessionFrequency;
    score += Math.min(1, (metrics.averageSessionDuration || 0) / 30) * weights.averageSessionDuration;
    score += (metrics.interactionDepth || 0) * weights.interactionDepth;
    score += (metrics.featureAdoption || 0) * weights.featureAdoption;
    score += (metrics.retentionRate || 0) * weights.retentionRate;
    
    // Reduce score based on churn risk
    score *= (1 - (metrics.churnRisk || 0) * 0.3);
    
    return Math.min(1, Math.max(0, score));
  }

  private async getNPSHistory(
    userId: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<Array<{ date: Date; score: number }>> {
    const cacheKey = `nps:history:${userId}:${period}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached as Array<{ date: Date; score: number }>;
    
    // For now, generate synthetic historical data based on sentiment trends
    // In production, this would fetch from a dedicated NPS tracking table
    const memories = await CoachMemory.findAll({
      where: {
        userId,
        conversationDate: {
          [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['conversationDate', 'ASC']]
    });
    
    const history: Array<{ date: Date; score: number }> = [];
    const groupSize = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    
    for (let i = 0; i < memories.length; i += groupSize) {
      const group = memories.slice(i, i + groupSize);
      if (group.length > 0) {
        const avgSentiment = group.reduce((sum, m) => 
          sum + (m.emotionalContext?.sentiment || 0), 0
        ) / group.length;
        
        history.push({
          date: group[0].conversationDate,
          score: Math.round((avgSentiment + 1) * 5)
        });
      }
    }
    
    await this.cache.set(cacheKey, history, { ttl: 3600 });
    return history;
  }

  private calculateNPSTrend(
    historicalScores: Array<{ date: Date; score: number }>
  ): 'improving' | 'declining' | 'stable' {
    if (historicalScores.length < 2) return 'stable';
    
    const recent = historicalScores.slice(-3);
    const older = historicalScores.slice(0, 3);
    
    const recentAvg = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, h) => sum + h.score, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (Math.abs(difference) < 0.5) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  }

  private async identifyNPSImprovementAreas(
    userId: string,
    memories: CoachMemory[]
  ): Promise<string[]> {
    const areas: string[] = [];
    
    // Check session frequency
    if (memories.length < 10) {
      areas.push('Increase coaching session frequency');
    }
    
    // Check action item completion
    const withActionItems = memories.filter(m => 
      m.coachingContext?.actionItems && m.coachingContext.actionItems.length > 0
    );
    if (withActionItems.length < memories.length * 0.5) {
      areas.push('Create more actionable outcomes from sessions');
    }
    
    // Check emotional trends
    const negativeSentiment = memories.filter(m => 
      (m.emotionalContext?.sentiment || 0) < -0.3
    );
    if (negativeSentiment.length > memories.length * 0.3) {
      areas.push('Address emotional wellbeing concerns');
    }
    
    // Check engagement depth
    const shallowSessions = memories.filter(m => 
      (m.content?.length || 0) < 100
    );
    if (shallowSessions.length > memories.length * 0.4) {
      areas.push('Deepen coaching conversation engagement');
    }
    
    return areas;
  }

  private async storeNPSScore(userId: string, score: number): Promise<void> {
    // Store in analytics for historical tracking
    await this.analytics.trackUserAction(parseInt(userId), 'nps_score_recorded', { score });
  }

  private calculateKPITrend(
    performanceHistory: unknown[]
  ): 'up' | 'down' | 'stable' {
    if (!performanceHistory || performanceHistory.length < 2) return 'stable';
    
    const recent = performanceHistory.slice(-5);
    const older = performanceHistory.slice(0, 5);
    
    const recentAvg = recent.reduce((sum, h) => sum + h.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, h) => sum + h.value, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private async forecastKPIValue(kpiTracker: KpiTracker): Promise<number> {
    const history = kpiTracker.performanceHistory || [];
    if (history.length < 3) return kpiTracker.kpiData?.current || 0;
    
    // Simple linear regression forecast
    const n = history.length;
    const sumX = history.reduce((sum, _, i) => sum + i, 0);
    const sumY = history.reduce((sum, h) => sum + h.value, 0);
    const sumXY = history.reduce((sum, h, i) => sum + i * h.value, 0);
    const sumX2 = history.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Forecast next period
    const forecast = slope * n + intercept;
    
    return Math.max(0, forecast);
  }

  private async generateKPIInsights(
    kpiTracker: KpiTracker,
    trend: 'up' | 'down' | 'stable'
  ): Promise<string[]> {
    const insights: string[] = [];
    
    if (trend === 'up') {
      insights.push(`${kpiTracker.title} is showing positive momentum`);
    } else if (trend === 'down') {
      insights.push(`${kpiTracker.title} needs attention - declining trend detected`);
    }
    
    if (kpiTracker.overallProgress >= 100) {
      insights.push(`Congratulations! ${kpiTracker.title} target achieved`);
    } else if (kpiTracker.overallProgress >= 80) {
      insights.push(`${kpiTracker.title} is close to target - maintain focus`);
    } else if (kpiTracker.overallProgress < 30) {
      insights.push(`${kpiTracker.title} requires significant effort to reach target`);
    }
    
    return insights;
  }

  private calculatePerformanceScore(kpis: CustomKPI[]): number {
    if (kpis.length === 0) return 0;
    
    const scores = kpis.map(kpi => {
      let score = kpi.achievement / 100;
      if (kpi.trend === 'up') score *= 1.1;
      else if (kpi.trend === 'down') score *= 0.9;
      return Math.min(1, score);
    });
    
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  private async generateOverallKPIInsights(
    kpis: CustomKPI[],
    summary: Record<string, any>
  ): Promise<string[]> {
    const insights: string[] = [];
    
    if (summary.averageAchievement >= 80) {
      insights.push('Outstanding overall KPI performance - keep up the excellent work!');
    } else if (summary.averageAchievement >= 60) {
      insights.push('Good KPI progress - focus on underperforming areas');
    } else {
      insights.push('KPI performance needs improvement - consider adjusting targets or approach');
    }
    
    if (summary.improvingKPIs > summary.decliningKPIs) {
      insights.push('Positive momentum across most KPIs');
    } else if (summary.decliningKPIs > summary.improvingKPIs) {
      insights.push('Several KPIs showing decline - review and adjust strategies');
    }
    
    return insights;
  }

  private async generateKPIRecommendations(
    kpis: CustomKPI[],
    summary: Record<string, any>
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Focus on declining KPIs
    const declining = kpis.filter(k => k.trend === 'down');
    if (declining.length > 0) {
      recommendations.push(`Priority focus on improving: ${declining.map(k => k.name).join(', ')}`);
    }
    
    // Celebrate achieved KPIs
    const achieved = kpis.filter(k => k.achievement >= 100);
    if (achieved.length > 0) {
      recommendations.push(`Set new stretch targets for completed KPIs: ${achieved.map(k => k.name).join(', ')}`);
    }
    
    // Address low performers
    const lowPerformers = kpis.filter(k => k.achievement < 30);
    if (lowPerformers.length > 0) {
      recommendations.push(`Consider breaking down or adjusting: ${lowPerformers.map(k => k.name).join(', ')}`);
    }
    
    return recommendations;
  }

  private async calculateCurrentSkillLevel(
    memories: CoachMemory[],
    goals: KpiTracker[]
  ): Promise<number> {
    // Recent skill level based on last 10 memories
    const recentMemories = memories.slice(0, 10);
    
    if (recentMemories.length === 0) return 0;
    
    // Calculate based on sentiment and progress
    const avgSentiment = recentMemories.reduce((sum, m) => 
      sum + (m.emotionalContext?.sentiment || 0), 0
    ) / recentMemories.length;
    
    const avgProgress = goals.length > 0 ? 
      goals.reduce((sum, g) => sum + g.overallProgress, 0) / goals.length : 50;
    
    // Combine sentiment and progress for skill level (0-10 scale)
    const skillLevel = ((avgSentiment + 1) / 2) * 5 + (avgProgress / 100) * 5;
    
    return Math.min(10, Math.max(0, skillLevel));
  }

  private async calculatePreviousSkillLevel(
    memories: CoachMemory[],
    goals: KpiTracker[]
  ): Promise<number> {
    // Older skill level based on memories 11-20
    const olderMemories = memories.slice(10, 20);
    
    if (olderMemories.length === 0) return 0;
    
    const avgSentiment = olderMemories.reduce((sum, m) => 
      sum + (m.emotionalContext?.sentiment || 0), 0
    ) / olderMemories.length;
    
    // Use initial progress for older skill level
    const initialProgress = goals.length > 0 ? 30 : 0;
    
    const skillLevel = ((avgSentiment + 1) / 2) * 5 + (initialProgress / 100) * 5;
    
    return Math.min(10, Math.max(0, skillLevel));
  }

  private calculateTimeToSkillImprovement(
    memories: CoachMemory[],
    improvement: number
  ): number {
    if (memories.length < 2 || improvement === 0) return 0;
    
    const timeSpan = new Date(memories[0].conversationDate).getTime() - 
                     new Date(memories[memories.length - 1].conversationDate).getTime();
    
    const days = Math.floor(timeSpan / (1000 * 60 * 60 * 24));
    
    return days;
  }

  private async generateSkillRecommendations(
    skillName: string,
    currentLevel: number,
    improvement: number,
    memories: CoachMemory[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (currentLevel < 3) {
      recommendations.push(`Focus on foundational ${skillName} concepts`);
      recommendations.push('Increase practice frequency');
    } else if (currentLevel < 7) {
      recommendations.push(`Advance to intermediate ${skillName} techniques`);
      recommendations.push('Set specific measurable goals');
    } else {
      recommendations.push(`Master advanced ${skillName} strategies`);
      recommendations.push('Consider mentoring others');
    }
    
    if (improvement < 0) {
      recommendations.push('Review and adjust current approach');
      recommendations.push('Seek additional resources or support');
    } else if (improvement > 2) {
      recommendations.push('Maintain current momentum');
      recommendations.push('Document successful strategies');
    }
    
    return recommendations;
  }

  private async identifyPracticeAreas(
    skillName: string,
    currentLevel: number,
    memories: CoachMemory[]
  ): Promise<string[]> {
    const areas: string[] = [];
    
    // Identify weak areas from memories
    const challenges = memories.filter(m => 
      m.coachingContext?.category === 'challenge' ||
      (m.emotionalContext?.sentiment || 0) < 0
    );
    
    if (challenges.length > 0) {
      areas.push('Overcoming identified challenges');
    }
    
    // Level-based practice areas
    if (currentLevel < 5) {
      areas.push('Daily practice exercises');
      areas.push('Fundamental skill building');
    } else {
      areas.push('Advanced technique refinement');
      areas.push('Real-world application');
    }
    
    return areas;
  }

  private applySuccessPredictionModel(features: Record<string, number>): number {
    // Weighted model for success prediction
    const weights = {
      engagementScore: 0.25,
      consistencyScore: 0.20,
      sentimentScore: 0.15,
      progressVelocity: 0.15,
      historicalSuccess: 0.15,
      currentMomentum: 0.10
    };
    
    let probability = 0;
    for (const [key, weight] of Object.entries(weights)) {
      probability += (features[key] || 0) * weight;
    }
    
    // Apply sigmoid to bound between 0 and 1
    return 1 / (1 + Math.exp(-4 * (probability - 0.5)));
  }

  private calculateAverageSentiment(memories: CoachMemory[]): number {
    if (memories.length === 0) return 0;
    
    const sentiments = memories.map(m => m.emotionalContext?.sentiment || 0);
    const avg = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    
    // Normalize to 0-1 scale
    return (avg + 1) / 2;
  }

  private calculateProgressVelocity(goals: KpiTracker[]): number {
    if (goals.length === 0) return 0;
    
    const activeGoals = goals.filter(g => g.status === 'in_progress');
    if (activeGoals.length === 0) return 0;
    
    // Calculate average progress rate
    const progressRates = activeGoals.map(g => {
      const daysSinceStart = Math.max(1, 
        (Date.now() - new Date(g.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return g.overallProgress / daysSinceStart;
    });
    
    const avgRate = progressRates.reduce((a, b) => a + b, 0) / progressRates.length;
    
    // Normalize (assuming 1% per day is good)
    return Math.min(1, avgRate / 1);
  }

  private calculateHistoricalSuccessRate(goals: KpiTracker[]): number {
    const completedGoals = goals.filter(g => g.status === 'completed');
    const totalGoals = goals.filter(g => 
      g.status === 'completed' || g.status === 'failed'
    );
    
    if (totalGoals.length === 0) return 0.5; // No history
    
    return completedGoals.length / totalGoals.length;
  }

  private calculateCurrentMomentum(
    memories: CoachMemory[],
    goals: KpiTracker[]
  ): number {
    // Recent activity and progress
    const recentMemories = memories.filter(m => 
      new Date(m.conversationDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const recentProgress = goals
      .filter(g => g.status === 'in_progress')
      .reduce((sum, g) => {
        const recent = (g.performanceHistory || [])
          .filter(h => new Date(h.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        return sum + recent.length;
      }, 0);
    
    const activityScore = Math.min(1, recentMemories.length / 7);
    const progressScore = Math.min(1, recentProgress / 7);
    
    return (activityScore + progressScore) / 2;
  }

  private identifyRiskFactors(
    features: Record<string, number>,
    memories: CoachMemory[],
    goals: KpiTracker[]
  ): string[] {
    const risks: string[] = [];
    
    if (features.engagementScore < 0.3) {
      risks.push('Low engagement levels may impact goal achievement');
    }
    
    if (features.consistencyScore < 0.4) {
      risks.push('Inconsistent coaching patterns reduce success likelihood');
    }
    
    if (features.sentimentScore < 0.4) {
      risks.push('Negative emotional state affecting motivation');
    }
    
    if (features.progressVelocity < 0.2) {
      risks.push('Slow progress pace may lead to goal abandonment');
    }
    
    const stalledGoals = goals.filter(g => 
      g.status === 'in_progress' && g.overallProgress < 20
    );
    if (stalledGoals.length > 0) {
      risks.push('Multiple stalled goals requiring intervention');
    }
    
    return risks;
  }

  private identifySuccessFactors(
    features: Record<string, number>,
    memories: CoachMemory[],
    goals: KpiTracker[]
  ): string[] {
    const factors: string[] = [];
    
    if (features.engagementScore > 0.7) {
      factors.push('High engagement supporting consistent progress');
    }
    
    if (features.consistencyScore > 0.7) {
      factors.push('Excellent coaching consistency');
    }
    
    if (features.sentimentScore > 0.6) {
      factors.push('Positive emotional state enhancing motivation');
    }
    
    if (features.historicalSuccess > 0.7) {
      factors.push('Strong track record of goal achievement');
    }
    
    const completedGoals = goals.filter(g => g.status === 'completed');
    if (completedGoals.length > 3) {
      factors.push('Proven ability to complete multiple goals');
    }
    
    return factors;
  }

  private async generateSuccessActions(
    features: Record<string, number>,
    riskFactors: string[],
    successFactors: string[]
  ): Promise<string[]> {
    const actions: string[] = [];
    
    // Address risks
    if (features.engagementScore < 0.5) {
      actions.push('Schedule daily check-ins to boost engagement');
    }
    
    if (features.consistencyScore < 0.5) {
      actions.push('Establish fixed coaching schedule');
    }
    
    if (features.progressVelocity < 0.3) {
      actions.push('Break down goals into smaller milestones');
    }
    
    // Leverage success factors
    if (successFactors.length > 2) {
      actions.push('Maintain current successful strategies');
    }
    
    // General recommendations
    actions.push('Track progress daily for accountability');
    actions.push('Celebrate small wins to maintain momentum');
    
    return actions;
  }

  private calculatePredictionConfidence(
    memories: CoachMemory[],
    goals: KpiTracker[]
  ): number {
    // Confidence based on data quality and quantity
    let confidence = 0.5;
    
    if (memories.length > 50) confidence += 0.2;
    else if (memories.length > 20) confidence += 0.1;
    
    if (goals.length > 5) confidence += 0.2;
    else if (goals.length > 2) confidence += 0.1;
    
    // Recent data increases confidence
    const recentMemories = memories.filter(m => 
      new Date(m.conversationDate) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );
    if (recentMemories.length > 7) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  private estimateTimeToGoal(
    goals: KpiTracker[],
    features: Record<string, number>
  ): number {
    const activeGoals = goals.filter(g => g.status === 'in_progress');
    if (activeGoals.length === 0) return 0;
    
    // Calculate based on current velocity
    const avgProgress = activeGoals.reduce((sum, g) => sum + g.overallProgress, 0) / activeGoals.length;
    const remainingProgress = 100 - avgProgress;
    
    if (features.progressVelocity === 0) return 365; // Max 1 year
    
    const estimatedDays = remainingProgress / features.progressVelocity;
    
    return Math.min(365, Math.max(1, estimatedDays));
  }

  private async generateConfidenceInsights(
    area: string,
    currentLevel: number,
    previousLevel: number,
    trend: 'improving' | 'declining' | 'stable'
  ): Promise<string[]> {
    const insights: string[] = [];
    
    if (trend === 'improving') {
      insights.push(`Great progress! Your confidence in ${area} is increasing`);
    } else if (trend === 'declining') {
      insights.push(`Your confidence in ${area} needs attention`);
    }
    
    if (currentLevel >= 8) {
      insights.push(`Excellent confidence level in ${area} - leverage this strength`);
    } else if (currentLevel <= 3) {
      insights.push(`Low confidence in ${area} - consider additional support or practice`);
    }
    
    const change = currentLevel - previousLevel;
    if (Math.abs(change) > 2) {
      insights.push(`Significant confidence shift detected (${change > 0 ? '+' : ''}${change.toFixed(1)})`);
    }
    
    return insights;
  }

  private analyzeSessionTiming(memories: CoachMemory[]): unknown {
    if (memories.length < 5) return null;
    
    const hours = memories.map(m => 
      new Date(m.conversationDate).getHours()
    );
    
    // Find most common hour ranges
    const morning = hours.filter(h => h >= 6 && h < 12).length;
    const afternoon = hours.filter(h => h >= 12 && h < 18).length;
    const evening = hours.filter(h => h >= 18 && h < 24).length;
    
    const total = morning + afternoon + evening;
    const maxTime = Math.max(morning, afternoon, evening);
    
    let preferredTime = 'morning';
    if (afternoon === maxTime) preferredTime = 'afternoon';
    if (evening === maxTime) preferredTime = 'evening';
    
    return {
      frequency: maxTime / total,
      impact: 'positive',
      description: `User prefers ${preferredTime} coaching sessions (${Math.round(maxTime / total * 100)}% of sessions)`,
      recommendations: [
        `Schedule priority sessions in the ${preferredTime}`,
        'Respect user\'s natural rhythm for better engagement'
      ],
      relatedGoals: []
    };
  }

  private analyzeTopicPreferences(memories: CoachMemory[]): unknown {
    if (memories.length < 5) return null;
    
    const topics: Record<string, number> = {};
    
    memories.forEach(m => {
      const topic = m.coachingContext?.topic || 'general';
      topics[topic] = (topics[topic] || 0) + 1;
    });
    
    const sortedTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (sortedTopics.length === 0) return null;
    
    return {
      frequency: sortedTopics[0][1] / memories.length,
      impact: 'positive',
      description: `Primary focus areas: ${sortedTopics.map(t => t[0]).join(', ')}`,
      recommendations: [
        `Deepen exploration of ${sortedTopics[0][0]}`,
        'Connect other topics to areas of high interest'
      ],
      relatedGoals: []
    };
  }

  private analyzeAchievementPatterns(goals: KpiTracker[]): unknown {
    if (goals.length < 2) return null;
    
    const completed = goals.filter(g => g.status === 'completed');
    const completionRate = completed.length / goals.length;
    
    // Analyze goal types
    const goalTypes: Record<string, number> = {};
    completed.forEach(g => {
      const type = g.type || 'general';
      goalTypes[type] = (goalTypes[type] || 0) + 1;
    });
    
    return {
      frequency: completionRate,
      impact: completionRate > 0.5 ? 'positive' : 'negative',
      description: `${Math.round(completionRate * 100)}% goal completion rate`,
      recommendations: completionRate > 0.5 ? [
        'Continue successful goal-setting approach',
        'Consider setting stretch goals'
      ] : [
        'Break goals into smaller milestones',
        'Review goal feasibility and timeline'
      ],
      relatedGoals: goals.map(g => g.id)
    };
  }

  private analyzeEmotionalPatterns(memories: CoachMemory[]): unknown {
    if (memories.length < 5) return null;
    
    const sentiments = memories.map(m => m.emotionalContext?.sentiment || 0);
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    
    // Calculate volatility
    const variance = sentiments.reduce((sum, s) => 
      sum + Math.pow(s - avgSentiment, 2), 0
    ) / sentiments.length;
    const volatility = Math.sqrt(variance);
    
    return {
      frequency: 1,
      impact: avgSentiment > 0 ? 'positive' : 'negative',
      description: `${avgSentiment > 0 ? 'Positive' : 'Negative'} emotional baseline with ${volatility < 0.3 ? 'stable' : 'variable'} mood patterns`,
      recommendations: avgSentiment > 0 ? [
        'Leverage positive emotional state for challenging goals',
        'Maintain mood-supporting practices'
      ] : [
        'Prioritize emotional wellbeing activities',
        'Consider mood-lifting coaching techniques'
      ],
      relatedGoals: []
    };
  }

  private analyzeLearningStyle(memories: CoachMemory[]): unknown {
    if (memories.length < 5) return null;
    
    // Analyze content patterns
    const withActionItems = memories.filter(m => 
      m.coachingContext?.actionItems && m.coachingContext.actionItems.length > 0
    );
    const actionOriented = withActionItems.length / memories.length;
    
    const longContent = memories.filter(m => (m.content?.length || 0) > 500);
    const reflective = longContent.length / memories.length;
    
    let style = 'balanced';
    if (actionOriented > 0.7) style = 'action-oriented';
    else if (reflective > 0.7) style = 'reflective';
    
    return {
      frequency: 1,
      impact: 'positive',
      description: `Learning style: ${style}`,
      recommendations: style === 'action-oriented' ? [
        'Provide concrete action steps',
        'Focus on practical applications'
      ] : style === 'reflective' ? [
        'Allow time for deep exploration',
        'Use thought-provoking questions'
      ] : [
        'Mix action items with reflection',
        'Vary coaching techniques'
      ],
      relatedGoals: []
    };
  }

  private extractMetricValue(analytics: UserAnalytics | null, metric: string): number {
    if (!analytics) return 0;
    
    switch (metric) {
      case 'engagement':
        return analytics ? (analytics.engagementMetrics.participationScore * 0.4 + analytics.engagementMetrics.followThroughRate * 0.4 + analytics.engagementMetrics.responsiveness * 0.2) : 0;
      case 'goal_completion':
        return analytics.coachingMetrics?.goalCompletionRate || 0;
      case 'consistency':
        return analytics.coachingMetrics?.goalCompletionRate || 0; // Use available metric
      case 'satisfaction':
        return analytics.coachingMetrics?.goalCompletionRate || 0; // Use available metric
      default:
        return 0;
    }
  }

  private async generateBenchmarkRecommendations(
    metric: string,
    percentileRank: number,
    improvementGap: number,
    userValue: number,
    peerAverage: number
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (percentileRank < 25) {
      recommendations.push(`Focus on improving ${metric} - currently in bottom quartile`);
      recommendations.push('Study top performer strategies');
    } else if (percentileRank > 75) {
      recommendations.push(`Excellent ${metric} performance - maintain current approach`);
      recommendations.push('Consider mentoring others');
    }
    
    if (improvementGap > 0) {
      const percentImprovement = (improvementGap / userValue) * 100;
      recommendations.push(`${Math.round(percentImprovement)}% improvement potential in ${metric}`);
    }
    
    if (userValue < peerAverage * 0.8) {
      recommendations.push('Review and adjust current strategies');
    }
    
    return recommendations;
  }

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
}

// Export singleton instance
export const coachIntelligenceService = new CoachIntelligenceServiceEnhanced();