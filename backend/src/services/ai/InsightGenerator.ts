import { UserProfile } from '../../models/UserProfile';
import { Goal } from '../../models/Goal';
import { Task } from '../../models/Task';
import { Mood } from '../../models/Mood';
import { ChatMessage } from '../../models/ChatMessage';
import { Chat } from '../../models/Chat';
import { Op } from 'sequelize';
import { logger } from '../../utils/logger';
// import { aiService } from './AIService';
import { predictiveAnalytics } from './PredictiveAnalytics';
import { recommendationEngine } from './RecommendationEngine';
// import { sequelize } from '../../config/database';

export interface Insight {
  id: string;
  type: InsightType, _type: InsightType;
  title: string;
  description: string;
  category: InsightCategory;
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  evidence: Evidence[];
  actionItems: ActionItem[];
  visualizations?: Visualization[];
  relatedInsights?: string[];
  expiresAt?: Date;
  metadata?: any;
}

export type InsightType = 
  | 'pattern'
  | 'anomaly'
  | 'prediction'
  | 'recommendation'
  | 'achievement'
  | 'risk'
  | 'opportunity'
  | 'correlation';

export type InsightCategory = 
  | 'productivity'
  | 'wellbeing'
  | 'goals'
  | 'habits'
  | 'progress'
  | 'engagement'
  | 'health'
  | 'learning';

export interface Evidence {
  type: 'data' | 'pattern' | 'comparison' | 'trend';
  description: string;
  dataPoints: any[];
  strength: number; // 0-1
}

export interface ActionItem {
  id: string;
  action: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedImpact: string;
  estimatedTime: number; // minutes
  category: string;
}

export interface Visualization {
  type: 'chart' | 'metric' | 'timeline' | 'comparison';
  data: any;
  config: any;
}

export interface InsightReport {
  userId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  insights: Insight[];
  summary: {
    totalInsights: number;
    highPriorityCount: number;
    categories: Record<InsightCategory, number>;
    keyTakeaways: string[];
  };
  trends: Trend[];
  recommendations: string[];
}

export interface Trend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  significance: 'high' | 'medium' | 'low';
  interpretation: string;
}

export class InsightGenerator {
  private insightCache: Map<string, Insight[]>;
  private generationStrategies: Map<InsightType, (data: any) => Promise<Insight[]>>;

  constructor() {
    this.insightCache = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies() {
    this.generationStrategies = new Map([
      ['pattern', this.generatePatternInsights.bind(this)],
      ['anomaly', this.generateAnomalyInsights.bind(this)],
      ['prediction', this.generatePredictionInsights.bind(this)],
      ['recommendation', this.generateRecommendationInsights.bind(this)],
      ['achievement', this.generateAchievementInsights.bind(this)],
      ['risk', this.generateRiskInsights.bind(this)],
      ['opportunity', this.generateOpportunityInsights.bind(this)],
      ['correlation', this.generateCorrelationInsights.bind(this)]
    ]);
  }

  async generateInsightReport(
    userId: string,
    period: { days?: number; start?: Date; end?: Date } = { days: 30 }
  ): Promise<InsightReport> {
    try {
      // Determine period
      const endDate = period.end || new Date();
      const startDate = period.start || new Date(endDate.getTime() - (period.days || 30) * 24 * 60 * 60 * 1000);

      // Gather comprehensive data
      const userData = await this.gatherUserData(userId, startDate, endDate);
      
      // Generate insights of all types
      const allInsights: Insight[] = [];
      
      for (const [type, strategy] of this.generationStrategies) {
        const insights = await strategy(userData);
        allInsights.push(...insights);
      }

      // Rank and filter insights
      const rankedInsights = this.rankInsights(allInsights);
      
      // Analyze trends
      const trends = await this.analyzeTrends(userData);
      
      // Generate summary and recommendations
      const summary = this.generateSummary(rankedInsights);
      const recommendations = await this.generateReportRecommendations(
        rankedInsights,
        trends,
        userData
      );

      const report: InsightReport = {
        userId,
        generatedAt: new Date(),
        period: {
          start: startDate,
          end: endDate
        },
        insights: rankedInsights,
        summary,
        trends,
        recommendations
      };

      // Cache insights
      this.cacheInsights(userId, rankedInsights);

      return report;
    } catch (error) {
      logger.error('Error generating insight report:', error);
      throw error;
    }
  }

  private async gatherUserData(userId: string, startDate: Date, endDate: Date): Promise<any> {
    const [profile, goals, tasks, moods, messages] = await Promise.all([
      UserProfile.findOne({ where: { userId } }),
      Goal.findAll({
        where: {
          userId,
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }),
      Task.findAll({
        where: {
          userId,
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }),
      Mood.findAll({
        where: {
          userId,
          createdAt: { [Op.between]: [startDate, endDate] }
        },
        order: [['createdAt', 'ASC']]
      }),
      ChatMessage.count({
        include: [{
          model: Chat,
          as: 'chat',
          where: { userId }
        }],
        where: {
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      })
    ]);

    // Calculate additional metrics
    const metrics = await this.calculateMetrics(userId, goals, tasks, moods);

    return {
      userId,
      profile,
      goals,
      tasks,
      moods,
      messageCount: messages,
      metrics,
      period: { startDate, endDate }
    };
  }

  private async calculateMetrics(
    userId: string,
    goals: Goal[],
    tasks: Task[],
    moods: Mood[]
  ): Promise<any> {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completedGoals = goals.filter(g => g.status === 'completed');

    const taskCompletionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;
    const goalCompletionRate = goals.length > 0 ? completedGoals.length / goals.length : 0;

    // Calculate streaks
    const currentStreak = await this.calculateCurrentStreak(tasks);
    
    // Mood analysis
    const avgMood = this.calculateAverageMood(moods);
    const moodVariability = this.calculateMoodVariability(moods);

    // Time analysis
    const productiveHours = this.analyzeProductiveHours(tasks);
    const taskVelocity = this.calculateTaskVelocity(tasks);

    return {
      taskCompletionRate,
      goalCompletionRate,
      completedTasksCount: completedTasks.length,
      completedGoalsCount: completedGoals.length,
      currentStreak,
      avgMood,
      moodVariability,
      productiveHours,
      taskVelocity,
      totalTasks: tasks.length,
      totalGoals: goals.length
    };
  }

  private async generatePatternInsights(data: any): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Task completion patterns
    const taskPatterns = this.analyzeTaskPatterns(data.tasks);
    if (taskPatterns.strongPatterns.length > 0) {
      insights.push({
        id: `pattern_${Date.now()}_tasks`,
        type: 'pattern',
        title: 'Task Completion Patterns Detected',
        description: `You're most productive ${taskPatterns.strongPatterns[0].description}`,
        category: 'productivity',
        priority: 'medium',
        confidence: taskPatterns.strongPatterns[0].confidence,
        evidence: [{
          type: 'pattern',
          description: 'Analysis of task completion times',
          dataPoints: taskPatterns.strongPatterns[0].dataPoints,
          strength: taskPatterns.strongPatterns[0].confidence
        }],
        actionItems: [{
          id: `action_${Date.now()}_1`,
          action: `Schedule important tasks during your peak productivity ${taskPatterns.strongPatterns[0].timeframe}`,
          priority: 'high',
          estimatedImpact: '30% increase in task completion',
          estimatedTime: 5,
          category: 'planning'
        }],
        visualizations: [{
          type: 'chart',
          data: {
            type: 'heatmap',
            data: taskPatterns.heatmapData
          },
          config: {
            title: 'Task Completion Heatmap',
            xAxis: 'Day of Week',
            yAxis: 'Hour of Day'
          }
        }]
      });
    }

    // Mood patterns
    const moodPatterns = this.analyzeMoodPatterns(data.moods);
    if (moodPatterns.significantPattern) {
      insights.push({
        id: `pattern_${Date.now()}_mood`,
        type: 'pattern',
        title: 'Mood Pattern Identified',
        description: moodPatterns.significantPattern.description,
        category: 'wellbeing',
        priority: moodPatterns.significantPattern.impact === 'negative' ? 'high' : 'medium',
        confidence: moodPatterns.significantPattern.confidence,
        evidence: [{
          type: 'trend',
          description: 'Mood tracking data over time',
          dataPoints: moodPatterns.significantPattern.dataPoints,
          strength: moodPatterns.significantPattern.confidence
        }],
        actionItems: moodPatterns.significantPattern.recommendations.map((rec, idx) => ({
          id: `action_${Date.now()}_mood_${idx}`,
          action: rec,
          priority: idx === 0 ? 'high' : 'medium',
          estimatedImpact: 'Improved emotional wellbeing',
          estimatedTime: 15,
          category: 'wellbeing'
        }))
      });
    }

    return insights;
  }

  private async generateAnomalyInsights(data: any): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Detect unusual productivity
    if (data.metrics.taskCompletionRate > 0.9 && data.tasks.length > 10) {
      insights.push({
        id: `anomaly_${Date.now()}_high_productivity`,
        type: 'anomaly',
        title: 'Exceptional Productivity Period',
        description: 'Your task completion rate is significantly higher than usual',
        category: 'productivity',
        priority: 'medium',
        confidence: 0.85,
        evidence: [{
          type: 'comparison',
          description: `${Math.round(data.metrics.taskCompletionRate * 100)}% completion rate vs typical 70%`,
          dataPoints: [data.metrics.taskCompletionRate],
          strength: 0.85
        }],
        actionItems: [{
          id: `action_${Date.now()}_capture`,
          action: 'Document what strategies are working exceptionally well',
          priority: 'high',
          estimatedImpact: 'Sustain high performance',
          estimatedTime: 10,
          category: 'reflection'
        }]
      });
    }

    // Detect mood anomalies
    const moodAnomaly = this.detectMoodAnomaly(data.moods);
    if (moodAnomaly) {
      insights.push({
        id: `anomaly_${Date.now()}_mood`,
        type: 'anomaly',
        title: moodAnomaly.title,
        description: moodAnomaly.description,
        category: 'wellbeing',
        priority: 'high',
        confidence: moodAnomaly.confidence,
        evidence: [{
          type: 'data',
          description: 'Unusual mood patterns detected',
          dataPoints: moodAnomaly.dataPoints,
          strength: moodAnomaly.confidence
        }],
        actionItems: moodAnomaly.actions.map((action, idx) => ({
          id: `action_${Date.now()}_anomaly_${idx}`,
          action: action,
          priority: 'urgent',
          estimatedImpact: 'Address potential wellbeing concerns',
          estimatedTime: 20,
          category: 'wellbeing'
        }))
      });
    }

    return insights;
  }

  private async generatePredictionInsights(data: any): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Goal completion predictions
    for (const goal of data.goals.filter(g => g.status === 'active')) {
      const prediction = await predictiveAnalytics.predictGoalCompletion(goal.id);
      
      if (prediction.probability < 0.5) {
        insights.push({
          id: `prediction_${Date.now()}_goal_${goal.id}`,
          type: 'prediction',
          title: 'Goal at Risk',
          description: `"${goal.title}" has a ${Math.round(prediction.probability * 100)}% chance of completion by target date`,
          category: 'goals',
          priority: 'high',
          confidence: 0.75,
          evidence: [{
            type: 'data',
            description: 'Based on current progress rate and historical patterns',
            dataPoints: [{
              currentProgress: goal.progress,
              requiredWeeklyProgress: prediction.requiredWeeklyProgress,
              obstacles: prediction.obstacles
            }],
            strength: 0.75
          }],
          actionItems: prediction.obstacles.slice(0, 2).map((obstacle, idx) => ({
            id: `action_${Date.now()}_pred_${idx}`,
            action: `Address: ${obstacle}`,
            priority: 'high',
            estimatedImpact: 'Increase success probability by 20%',
            estimatedTime: 30,
            category: 'goals'
          })),
          visualizations: [{
            type: 'chart',
            data: {
              type: 'line',
              projected: true,
              data: this.generateProgressProjection(goal, prediction)
            },
            config: {
              title: 'Goal Progress Projection',
              showConfidenceInterval: true
            }
          }]
        });
      }
    }

    // Success prediction
    const successPrediction = await predictiveAnalytics.predictUserSuccess(data.userId);
    if (successPrediction.confidence > 0.7) {
      insights.push({
        id: `prediction_${Date.now()}_success`,
        type: 'prediction',
        title: 'Success Outlook',
        description: `${Math.round(successPrediction.probability * 100)}% likelihood of achieving your goals in the next ${successPrediction.timeframe}`,
        category: 'progress',
        priority: successPrediction.probability > 0.7 ? 'low' : 'medium',
        confidence: successPrediction.confidence,
        evidence: [{
          type: 'data',
          description: 'Comprehensive analysis of your patterns and progress',
          dataPoints: [
            { factor: 'Positive factors', items: successPrediction.factors.positive },
            { factor: 'Challenges', items: successPrediction.factors.negative }
          ],
          strength: successPrediction.confidence
        }],
        actionItems: successPrediction.recommendations.slice(0, 3).map((rec, idx) => ({
          id: `action_${Date.now()}_success_${idx}`,
          action: rec,
          priority: idx === 0 ? 'high' : 'medium',
          estimatedImpact: 'Optimize success probability',
          estimatedTime: 20,
          category: 'strategy'
        }))
      });
    }

    return insights;
  }

  private async generateRecommendationInsights(data: any): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Get personalized recommendations
    const recommendations = await recommendationEngine.generateRecommendations(
      data.userId,
      ['habit', 'goal', 'wellness'],
      3
    );

    if (recommendations.length > 0) {
      const topRecommendation = recommendations[0];
      insights.push({
        id: `recommendation_${Date.now()}_top`,
        type: 'recommendation',
        title: topRecommendation.title,
        description: topRecommendation.description,
        category: this.mapRecommendationCategory(topRecommendation.category),
        priority: topRecommendation.priority,
        confidence: topRecommendation.confidence,
        evidence: [{
          type: 'data',
          description: topRecommendation.reason,
          dataPoints: [],
          strength: topRecommendation.confidence
        }],
        actionItems: topRecommendation.actionItems.map((item, idx) => ({
          id: `action_${Date.now()}_rec_${idx}`,
          action: item,
          priority: idx === 0 ? 'high' : 'medium',
          estimatedImpact: topRecommendation.expectedOutcome,
          estimatedTime: topRecommendation.estimatedTime || 15,
          category: topRecommendation.category
        }))
      });
    }

    return insights;
  }

  private async generateAchievementInsights(data: any): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Streak achievements
    if (data.metrics.currentStreak >= 7) {
      insights.push({
        id: `achievement_${Date.now()}_streak`,
        type: 'achievement',
        title: `${data.metrics.currentStreak}-Day Streak! 🔥`,
        description: 'You\'ve maintained consistent daily engagement',
        category: 'habits',
        priority: 'low',
        confidence: 1.0,
        evidence: [{
          type: 'data',
          description: 'Consecutive days of task completion',
          dataPoints: [{ streak: data.metrics.currentStreak }],
          strength: 1.0
        }],
        actionItems: [{
          id: `action_${Date.now()}_celebrate`,
          action: 'Celebrate this milestone and share your success',
          priority: 'low',
          estimatedImpact: 'Boost motivation and social support',
          estimatedTime: 5,
          category: 'social'
        }]
      });
    }

    // Goal completions
    if (data.metrics.completedGoalsCount > 0) {
      insights.push({
        id: `achievement_${Date.now()}_goals`,
        type: 'achievement',
        title: `${data.metrics.completedGoalsCount} Goal${data.metrics.completedGoalsCount > 1 ? 's' : ''} Completed!`,
        description: 'You\'ve successfully achieved your objectives',
        category: 'goals',
        priority: 'low',
        confidence: 1.0,
        evidence: [{
          type: 'data',
          description: 'Goals marked as completed',
          dataPoints: data.goals.filter(g => g.status === 'completed').map(g => ({
            title: g.title,
            completedAt: g.updatedAt
          })),
          strength: 1.0
        }],
        actionItems: [{
          id: `action_${Date.now()}_reflect`,
          action: 'Reflect on what made these goals successful',
          priority: 'medium',
          estimatedImpact: 'Apply success patterns to future goals',
          estimatedTime: 15,
          category: 'reflection'
        }]
      });
    }

    return insights;
  }

  private async generateRiskInsights(data: any): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Churn risk
    const churnRisk = await predictiveAnalytics.predictChurnRisk(data.userId);
    if (churnRisk.severity !== 'low') {
      insights.push({
        id: `risk_${Date.now()}_churn`,
        type: 'risk',
        title: 'Engagement Risk Detected',
        description: `${churnRisk.severity} risk of disengagement identified`,
        category: 'engagement',
        priority: 'high',
        confidence: churnRisk.probability,
        evidence: churnRisk.indicators.map(indicator => ({
          type: 'data' as const,
          description: indicator,
          dataPoints: [],
          strength: 0.8
        })),
        actionItems: churnRisk.mitigationStrategies.slice(0, 3).map((strategy, idx) => ({
          id: `action_${Date.now()}_risk_${idx}`,
          action: strategy,
          priority: idx === 0 ? 'urgent' : 'high',
          estimatedImpact: 'Prevent disengagement',
          estimatedTime: 10,
          category: 'engagement'
        }))
      });
    }

    // Burnout risk
    if (data.metrics.taskVelocity > 20 && data.metrics.avgMood < 3) {
      insights.push({
        id: `risk_${Date.now()}_burnout`,
        type: 'risk',
        title: 'Potential Burnout Risk',
        description: 'High activity levels combined with declining mood',
        category: 'health',
        priority: 'high',
        confidence: 0.75,
        evidence: [{
          type: 'pattern' as const,
          description: 'Task volume vs mood correlation',
          dataPoints: [{
            taskVelocity: data.metrics.taskVelocity,
            avgMood: data.metrics.avgMood
          }],
          strength: 0.75
        }],
        actionItems: [
          {
            id: `action_${Date.now()}_burnout_1`,
            action: 'Schedule deliberate rest and recovery time',
            priority: 'urgent',
            estimatedImpact: 'Prevent burnout and maintain sustainability',
            estimatedTime: 60,
            category: 'wellbeing'
          },
          {
            id: `action_${Date.now()}_burnout_2`,
            action: 'Reassess and prioritize your current commitments',
            priority: 'high',
            estimatedImpact: 'Reduce overwhelm',
            estimatedTime: 30,
            category: 'planning'
          }
        ]
      });
    }

    return insights;
  }

  private async generateOpportunityInsights(data: any): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Learning opportunity based on patterns
    if (data.profile && data.profile.behaviorPatterns.consistencyScore > 70) {
      insights.push({
        id: `opportunity_${Date.now()}_learning`,
        type: 'opportunity',
        title: 'Ready for Advanced Challenges',
        description: 'Your high consistency indicates readiness for more ambitious goals',
        category: 'learning',
        priority: 'medium',
        confidence: 0.8,
        evidence: [{
          type: 'data',
          description: 'Consistency and engagement metrics',
          dataPoints: [{
            consistencyScore: data.profile.behaviorPatterns.consistencyScore,
            completionRate: data.metrics.taskCompletionRate
          }],
          strength: 0.8
        }],
        actionItems: [
          {
            id: `action_${Date.now()}_challenge_1`,
            action: 'Set a stretch goal that pushes your comfort zone',
            priority: 'medium',
            estimatedImpact: 'Accelerate personal growth',
            estimatedTime: 30,
            category: 'goals'
          },
          {
            id: `action_${Date.now()}_challenge_2`,
            action: 'Explore advanced techniques in your area of focus',
            priority: 'medium',
            estimatedImpact: 'Deepen expertise',
            estimatedTime: 45,
            category: 'learning'
          }
        ]
      });
    }

    // Collaboration opportunity
    if (data.metrics.completedGoalsCount > 2) {
      insights.push({
        id: `opportunity_${Date.now()}_collaboration`,
        type: 'opportunity',
        title: 'Share Your Success',
        description: 'Your achievements position you to help others',
        category: 'engagement',
        priority: 'low',
        confidence: 0.7,
        evidence: [{
          type: 'data',
          description: 'Success rate and completed goals',
          dataPoints: [{
            completedGoals: data.metrics.completedGoalsCount,
            successRate: data.metrics.goalCompletionRate
          }],
          strength: 0.7
        }],
        actionItems: [{
          id: `action_${Date.now()}_share`,
          action: 'Share your success strategies with the community',
          priority: 'low',
          estimatedImpact: 'Inspire others and reinforce your learning',
          estimatedTime: 20,
          category: 'social'
        }]
      });
    }

    return insights;
  }

  private async generateCorrelationInsights(data: any): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Task completion vs mood correlation
    const correlation = this.calculateTaskMoodCorrelation(data.tasks, data.moods);
    if (Math.abs(correlation.coefficient) > 0.5) {
      insights.push({
        id: `correlation_${Date.now()}_task_mood`,
        type: 'pattern' as const,
        title: correlation.coefficient > 0 ? 'Productivity Boosts Mood' : 'Mood Affects Productivity',
        description: correlation.description,
        category: 'wellbeing',
        priority: 'medium',
        confidence: Math.abs(correlation.coefficient),
        evidence: [{
          type: 'pattern' as const,
          description: 'Statistical correlation between task completion and mood',
          dataPoints: correlation.dataPoints,
          strength: Math.abs(correlation.coefficient)
        }],
        actionItems: correlation.recommendations.map((rec, idx) => ({
          id: `action_${Date.now()}_corr_${idx}`,
          action: rec,
          priority: 'medium',
          estimatedImpact: 'Optimize the productivity-wellbeing cycle',
          estimatedTime: 15,
          category: 'strategy'
        })),
        visualizations: [{
          type: 'chart',
          data: {
            type: 'scatter',
            data: correlation.scatterData
          },
          config: {
            title: 'Task Completion vs Mood',
            xAxis: 'Tasks Completed',
            yAxis: 'Mood Score',
            showTrendLine: true
          }
        }]
      });
    }

    return insights;
  }

  private analyzeTaskPatterns(tasks: Task[]): any {
    const patterns = {
      strongPatterns: [] as any[],
      heatmapData: {} as any
    };

    // Analyze by hour of day
    const hourlyCompletion: Record<number, number> = {};
    const hourlyTotal: Record<number, number> = {};

    tasks.forEach(task => {
      const hour = new Date(task.createdAt).getHours();
      hourlyTotal[hour] = (hourlyTotal[hour] || 0) + 1;
      if (task.status === 'completed') {
        hourlyCompletion[hour] = (hourlyCompletion[hour] || 0) + 1;
      }
    });

    // Find peak productivity hours
    const productivityByHour = Object.entries(hourlyTotal).map(([hour, total]) => ({
      hour: parseInt(hour),
      completionRate: (hourlyCompletion[parseInt(hour)] || 0) / total,
      total
    })).filter(h => h.total >= 3); // At least 3 tasks to be significant

    const peakHours = productivityByHour
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3);

    if (peakHours.length > 0 && peakHours[0].completionRate > 0.7) {
      const timeframe = peakHours[0].hour < 12 ? 'morning' : 
                       peakHours[0].hour < 17 ? 'afternoon' : 'evening';
      
      patterns.strongPatterns.push({
        description: `in the ${timeframe} (${peakHours[0].hour}:00 - ${peakHours[0].hour + 1}:00)`,
        timeframe,
        confidence: peakHours[0].completionRate,
        dataPoints: peakHours
      });
    }

    // Build heatmap data
    patterns.heatmapData = this.buildProductivityHeatmap(tasks);

    return patterns;
  }

  private buildProductivityHeatmap(tasks: Task[]): any {
    const heatmap: Record<string, Record<string, number>> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Initialize heatmap
    days.forEach(day => {
      heatmap[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        heatmap[day][hour] = 0;
      }
    });

    // Populate with task data
    tasks.filter(t => t.status === 'completed').forEach(task => {
      const date = new Date(task.createdAt);
      const day = days[date.getDay()];
      const hour = date.getHours();
      heatmap[day][hour]++;
    });

    return heatmap;
  }

  private analyzeMoodPatterns(moods: Mood[]): any {
    if (moods.length < 5) {
      return { significantPattern: null };
    }

    const moodValues = { happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1 };
    const moodScores = moods.map(m => ({
      date: new Date(m.createdAt),
      score: moodValues[m.mood] || 3,
      mood: m.mood
    }));

    // Calculate trend
    const firstHalf = moodScores.slice(0, Math.floor(moodScores.length / 2));
    const secondHalf = moodScores.slice(Math.floor(moodScores.length / 2));

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.score, 0) / secondHalf.length;

    const trend = secondAvg - firstAvg;

    if (Math.abs(trend) > 0.5) {
      const pattern = {
        description: trend > 0 ? 
          'Your mood has been improving over time' : 
          'Your mood has been declining recently',
        impact: trend > 0 ? 'positive' : 'negative',
        confidence: Math.min(0.9, Math.abs(trend) / 2),
        dataPoints: moodScores,
        recommendations: trend > 0 ? [
          'Continue with current positive habits',
          'Document what\'s working well'
        ] : [
          'Consider what might be causing stress',
          'Schedule self-care activities',
          'Reach out to support network if needed'
        ]
      };

      return { significantPattern: pattern };
    }

    return { significantPattern: null };
  }

  private detectMoodAnomaly(moods: Mood[]): any {
    if (moods.length < 7) return null;

    const moodValues = { happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1 };
    const recentMoods = moods.slice(-7);
    
    const negativeCount = recentMoods.filter((m: any) => 
      m.mood === 'stressed' || m.mood === 'sad'
    ).length;

    if (negativeCount >= 5) {
      return {
        title: 'Extended Period of Stress',
        description: 'You\'ve been experiencing challenging emotions for several days',
        confidence: 0.85,
        dataPoints: recentMoods.map(m => ({
          date: m.createdAt,
          mood: m.mood,
          score: moodValues[m.mood] || 3
        })),
        actions: [
          'Consider reaching out to a friend or professional for support',
          'Schedule activities that typically improve your mood',
          'Review and adjust your current goals if they\'re causing stress'
        ]
      };
    }

    return null;
  }

  private generateProgressProjection(goal: Goal, prediction: any): any {
    const currentDate = new Date();
    const targetDate = new Date(goal.targetDate || currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const dataPoints = [];
    
    // Historical progress (simplified)
    dataPoints.push({
      date: new Date(goal.createdAt),
      progress: 0,
      type: 'actual'
    });
    
    dataPoints.push({
      date: currentDate,
      progress: goal.progress,
      type: 'actual'
    });

    // Projected progress
    const remainingDays = Math.max(1, (targetDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));
    const dailyProgress = (100 - goal.progress) / remainingDays;
    
    for (let i = 1; i <= Math.min(remainingDays, 90); i += 7) {
      dataPoints.push({
        date: new Date(currentDate.getTime() + i * 24 * 60 * 60 * 1000),
        progress: Math.min(100, goal.progress + dailyProgress * i),
        type: 'projected'
      });
    }

    return dataPoints;
  }

  private mapRecommendationCategory(category: string): InsightCategory {
    const mapping: Record<string, InsightCategory> = {
      'wellness': 'wellbeing',
      'productivity': 'productivity',
      'goal': 'goals',
      'habit': 'habits',
      'health': 'health',
      'mindfulness': 'wellbeing',
      'planning': 'productivity'
    };

    return mapping[category] || 'progress';
  }

  private calculateTaskMoodCorrelation(tasks: Task[], moods: Mood[]): any {
    // Group by day
    const dailyData: Record<string, { tasks: number; mood: number }> = {};
    const moodValues = { happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1 };

    // Count completed tasks per day
    tasks.filter(t => t.status === 'completed').forEach(task => {
      const date = new Date(task.createdAt).toDateString();
      if (!dailyData[date]) dailyData[date] = { tasks: 0, mood: 3 };
      dailyData[date].tasks++;
    });

    // Add mood scores
    moods.forEach(mood => {
      const date = new Date(mood.createdAt).toDateString();
      if (dailyData[date]) {
        dailyData[date].mood = moodValues[mood.mood] || 3;
      }
    });

    // Calculate correlation
    const dataPoints = Object.values(dailyData).filter(d => d.tasks > 0);
    
    if (dataPoints.length < 5) {
      return { coefficient: 0, description: 'Insufficient data', dataPoints: [], recommendations: [] };
    }

    // Simple correlation calculation
    const avgTasks = dataPoints.reduce((sum, d) => sum + d.tasks, 0) / dataPoints.length;
    const avgMood = dataPoints.reduce((sum, d) => sum + d.mood, 0) / dataPoints.length;
    
    let numerator = 0;
    let denomTasks = 0;
    let denomMood = 0;
    
    dataPoints.forEach(d => {
      numerator += (d.tasks - avgTasks) * (d.mood - avgMood);
      denomTasks += Math.pow(d.tasks - avgTasks, 2);
      denomMood += Math.pow(d.mood - avgMood, 2);
    });

    const coefficient = numerator / (Math.sqrt(denomTasks) * Math.sqrt(denomMood));

    const description = coefficient > 0.5 ? 
      'Completing tasks significantly improves your mood' :
      coefficient < -0.5 ?
      'Low mood tends to reduce your productivity' :
      'Task completion and mood show moderate correlation';

    const recommendations = coefficient > 0 ? [
      'Use task completion as a mood booster',
      'Schedule important tasks when you need an emotional lift'
    ] : [
      'Focus on mood management to improve productivity',
      'Start with small, easy tasks when feeling low'
    ];

    return {
      coefficient,
      description,
      dataPoints,
      recommendations,
      scatterData: dataPoints.map(d => ({ x: d.tasks, y: d.mood }))
    };
  }

  private async analyzeTrends(userData: any): Promise<Trend[]> {
    const trends: Trend[] = [];

    // Task completion trend
    const taskTrend = this.calculateTrend(
      userData.tasks,
      'createdAt',
      t => t.status === 'completed'
    );
    
    trends.push({
      metric: 'Task Completion',
      direction: taskTrend.direction,
      change: taskTrend.percentage,
      significance: Math.abs(taskTrend.percentage) > 20 ? 'high' : 'medium',
      interpretation: taskTrend.interpretation
    });

    // Mood trend
    if (userData.moods.length > 5) {
      const moodTrend = this.calculateMoodTrend(userData.moods);
      trends.push({
        metric: 'Emotional Wellbeing',
        direction: moodTrend.direction,
        change: moodTrend.percentage,
        significance: Math.abs(moodTrend.percentage) > 15 ? 'high' : 'medium',
        interpretation: moodTrend.interpretation
      });
    }

    // Engagement trend
    const engagementTrend = this.calculateEngagementTrend(userData);
    trends.push({
      metric: 'Platform Engagement',
      direction: engagementTrend.direction,
      change: engagementTrend.percentage,
      significance: engagementTrend.significance,
      interpretation: engagementTrend.interpretation
    });

    return trends;
  }

  private calculateTrend(
    items: any[],
    dateField: string,
    filterFn?: (item: any) => boolean
  ): any {
    const filtered = filterFn ? items.filter(filterFn) : items;
    
    if (filtered.length < 2) {
      return { direction: 'stable', percentage: 0, interpretation: 'Insufficient data' };
    }

    const midpoint = Math.floor(filtered.length / 2);
    const firstHalf = filtered.slice(0, midpoint).length;
    const secondHalf = filtered.slice(midpoint).length;

    const change = ((secondHalf - firstHalf) / Math.max(1, firstHalf)) * 100;

    return {
      direction: change > 10 ? 'up' : change < -10 ? 'down' : 'stable',
      percentage: Math.round(change),
      interpretation: change > 10 ? 'Increasing activity' : 
                     change < -10 ? 'Decreasing activity' : 'Stable pattern'
    };
  }

  private calculateMoodTrend(moods: Mood[]): any {
    const moodValues = { happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1 };
    
    const midpoint = Math.floor(moods.length / 2);
    const firstHalf = moods.slice(0, midpoint);
    const secondHalf = moods.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percentage: Math.round(change),
      interpretation: change > 5 ? 'Mood improving over time' :
                     change < -5 ? 'Mood declining - attention needed' :
                     'Emotional state remains stable'
    };
  }

  private calculateEngagementTrend(userData: any): any {
    const totalActivities = userData.tasks.length + userData.goals.length + userData.moods.length;
    const daysInPeriod = Math.max(1, 
      (new Date(userData.period.endDate).getTime() - new Date(userData.period.startDate).getTime()) / 
      (24 * 60 * 60 * 1000)
    );
    
    const dailyEngagement = totalActivities / daysInPeriod;

    return {
      direction: dailyEngagement > 3 ? 'up' : dailyEngagement < 1 ? 'down' : 'stable',
      percentage: Math.round(dailyEngagement * 100) / 100,
      significance: dailyEngagement > 5 ? 'high' : 'medium',
      interpretation: dailyEngagement > 3 ? 'Highly engaged with platform' :
                     dailyEngagement < 1 ? 'Low engagement - consider re-engagement strategies' :
                     'Moderate engagement level'
    };
  }

  private calculateCurrentStreak(tasks: Task[]): number {
    const completedTasks = tasks
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (completedTasks.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const hasTask = completedTasks.some(t => {
        const taskDate = new Date(t.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === checkDate.getTime();
      });

      if (hasTask) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }

  private calculateAverageMood(moods: Mood[]): number {
    if (moods.length === 0) return 3;

    const moodValues = { happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1 };
    const sum = moods.reduce((total, m) => total + (moodValues[m.mood] || 3), 0);
    
    return sum / moods.length;
  }

  private calculateMoodVariability(moods: Mood[]): number {
    if (moods.length < 2) return 0;

    const moodValues = { happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1 };
    const values = moods.map(m => moodValues[m.mood] || 3);
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  private analyzeProductiveHours(tasks: Task[]): any {
    const hourlyActivity: Record<number, number> = {};
    
    tasks.forEach(task => {
      const hour = new Date(task.createdAt).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourlyActivity)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      peakHour: peakHour ? parseInt(peakHour[0]) : 9,
      distribution: hourlyActivity
    };
  }

  private calculateTaskVelocity(tasks: Task[]): number {
    const days = new Set(tasks.map((t: any) => new Date(t.createdAt).toDateString())).size;
    return days > 0 ? tasks.length / days : 0;
  }

  private rankInsights(insights: Insight[]): Insight[] {
    return insights.sort((a, b) => {
      // Priority weight
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];

      // Type weight (some types are more important)
      const typeWeight = {
        risk: 4,
        anomaly: 3,
        prediction: 3,
        opportunity: 2,
        pattern: 2,
        correlation: 2,
        recommendation: 1,
        achievement: 1
      };
      const aType = typeWeight[a.type];
      const bType = typeWeight[b.type];

      // Combined score
      const aScore = aPriority * 2 + aType + a.confidence;
      const bScore = bPriority * 2 + bType + b.confidence;

      return bScore - aScore;
    });
  }

  private generateSummary(insights: Insight[]): InsightReport['summary'] {
    const categories: Record<InsightCategory, number> = {
      productivity: 0,
      wellbeing: 0,
      goals: 0,
      habits: 0,
      progress: 0,
      engagement: 0,
      health: 0,
      learning: 0
    };

    insights.forEach(insight => {
      categories[insight.category]++;
    });

    const keyTakeaways = this.extractKeyTakeaways(insights);

    return {
      totalInsights: insights.length,
      highPriorityCount: insights.filter(i => i.priority === 'high').length,
      categories,
      keyTakeaways
    };
  }

  private extractKeyTakeaways(insights: Insight[]): string[] {
    const takeaways: string[] = [];

    // Add top risk if any
    const topRisk = insights.find(i => i.type === 'risk' && i.priority === 'high');
    if (topRisk) {
      takeaways.push(`Action needed: ${topRisk.title}`);
    }

    // Add top achievement
    const topAchievement = insights.find(i => i.type === 'achievement');
    if (topAchievement) {
      takeaways.push(`Celebrate: ${topAchievement.title}`);
    }

    // Add top opportunity
    const topOpportunity = insights.find(i => i.type === 'opportunity');
    if (topOpportunity) {
      takeaways.push(`Opportunity: ${topOpportunity.title}`);
    }

    // Add significant pattern
    const significantPattern = insights.find(i => i.type === 'pattern' && i.confidence > 0.8);
    if (significantPattern) {
      takeaways.push(`Pattern discovered: ${significantPattern.title}`);
    }

    return takeaways.slice(0, 4);
  }

  private async generateReportRecommendations(
    insights: Insight[],
    trends: Trend[],
    userData: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Priority-based recommendations
    const urgentActions = insights
      .filter(i => i.priority === 'high')
      .flatMap(i => i.actionItems.filter(a => a.priority === 'urgent'));

    if (urgentActions.length > 0) {
      recommendations.push(`Focus on: ${urgentActions[0].action}`);
    }

    // Trend-based recommendations
    const decliningTrends = trends.filter(t => t.direction === 'down' && t.significance === 'high');
    if (decliningTrends.length > 0) {
      recommendations.push(`Address declining ${decliningTrends[0].metric.toLowerCase()}`);
    }

    // Opportunity-based recommendations
    const opportunities = insights.filter(i => i.type === 'opportunity');
    if (opportunities.length > 0) {
      recommendations.push(`Leverage: ${opportunities[0].title}`);
    }

    // General optimization
    if (userData.metrics.taskCompletionRate < 0.6) {
      recommendations.push('Break down tasks into smaller, more manageable pieces');
    }

    if (userData.metrics.currentStreak > 0 && userData.metrics.currentStreak < 7) {
      recommendations.push(`Keep your ${userData.metrics.currentStreak}-day streak going!`);
    }

    return recommendations.slice(0, 5);
  }

  private cacheInsights(userId: string, insights: Insight[]) {
    this.insightCache.set(userId, insights);
    
    // Set expiration for insights
    insights.forEach(insight => {
      if (!insight.expiresAt) {
        // Default expiration based on type
        const expirationDays = {
          achievement: 30,
          pattern: 14,
          prediction: 7,
          risk: 3,
          anomaly: 3,
          opportunity: 7,
          recommendation: 7,
          correlation: 14
        };
        
        insight.expiresAt = new Date(
          Date.now() + (expirationDays[insight.type] || 7) * 24 * 60 * 60 * 1000
        );
      }
    });
  }

  async getActiveInsights(userId: string): Promise<Insight[]> {
    const cached = this.insightCache.get(userId) || [];
    const now = new Date();
    
    return cached.filter(insight => 
      !insight.expiresAt || insight.expiresAt > now
    );
  }

  async dismissInsight(userId: string, insightId: string): Promise<void> {
    const insights = this.insightCache.get(userId) || [];
    const insight = insights.find(i => i.id === insightId);
    
    if (insight) {
      insight.expiresAt = new Date(); // Expire immediately
      this.insightCache.set(userId, insights);
    }
  }
}

export const insightGenerator = new InsightGenerator();