import { Op } from 'sequelize';

import { Chat } from '../../models/Chat';
import { ChatMessage } from '../../models/ChatMessage';
import { Goal } from '../../models/Goal';
import { Mood } from '../../models/Mood';
import { Task } from '../../models/Task';
import { UserProfile } from '../../models/UserProfile';
import { logger } from '../../utils/logger';

import { aiService } from './AIService';
import { cacheService, Cached } from './CacheService';
// import { sequelize } from '../../config/database';

export interface Prediction {
  type: 'success' | 'churn' | 'engagement' | 'goal_completion' | 'habit_formation';
  probability: number; // 0-1
  timeframe: string;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
  confidence: number; // 0-1
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  impact: 'positive' | 'neutral' | 'negative';
  insights: string[];
}

export interface RiskAssessment {
  riskType: string;
  severity: 'low' | 'medium' | 'high';
  probability: number;
  indicators: string[];
  mitigationStrategies: string[];
  timeToIntervention: number; // days
}

export class PredictiveAnalytics {
  @Cached({ ttl: 900, keyPrefix: 'prediction:success' }) // 15 minutes
  async predictUserSuccess(userId: string): Promise<Prediction> {
    try {
      // Gather historical data
      const userData = await this.gatherUserData(userId);

      // Analyze patterns
      const patterns = await this.analyzeBehaviorPatterns(userData);

      // Calculate success indicators
      const successIndicators = this.calculateSuccessIndicators(userData, patterns);

      // Generate prediction
      const prediction = await this.generateSuccessPrediction(
        userData,
        patterns,
        successIndicators
      );

      return prediction;
    } catch (error) {
      logger.error('Error predicting user success:', error);
      throw error;
    }
  }

  @Cached({ ttl: 1800, keyPrefix: 'prediction:churn' }) // 30 minutes
  async predictChurnRisk(userId: string): Promise<RiskAssessment> {
    try {
      const userData = await this.gatherUserData(userId);
      const engagementMetrics = await this.calculateEngagementMetrics(userData);

      // Churn indicators
      const indicators = [];
      let riskScore = 0;

      // Decreasing engagement
      if (engagementMetrics.trend === 'decreasing') {
        indicators.push('Engagement declining over past 2 weeks');
        riskScore += 0.3;
      }

      // Incomplete tasks
      const incompletionRate =
        userData.tasks.filter((t: unknown) => t.status !== 'completed').length /
        Math.max(1, userData.tasks.length);
      if (incompletionRate > 0.7) {
        indicators.push('High task incompletion rate');
        riskScore += 0.25;
      }

      // Mood decline
      if (userData.avgMoodTrend < 0) {
        indicators.push('Declining mood patterns');
        riskScore += 0.2;
      }

      // Infrequent sessions
      if (engagementMetrics.sessionFrequency < 2) {
        indicators.push('Less than 2 sessions per week');
        riskScore += 0.25;
      }

      // No recent goals
      const recentGoals = userData.goals.filter(
        (g: unknown) => new Date(g.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      if (recentGoals.length === 0) {
        indicators.push('No new goals in past month');
        riskScore += 0.15;
      }

      // Determine severity
      let severity: 'low' | 'medium' | 'high';
      if (riskScore < 0.3) severity = 'low';
      else if (riskScore < 0.6) severity = 'medium';
      else severity = 'high';

      // Calculate time to intervention
      const timeToIntervention = severity === 'high' ? 1 : severity === 'medium' ? 3 : 7;

      // Generate mitigation strategies
      const mitigationStrategies = this.generateMitigationStrategies(
        indicators,
        severity,
        userData
      );

      return {
        riskType: 'churn',
        severity,
        probability: Math.min(0.95, riskScore),
        indicators,
        mitigationStrategies,
        timeToIntervention,
      };
    } catch (error) {
      logger.error('Error predicting churn risk:', error);
      throw error;
    }
  }

  async predictGoalCompletion(goalId: string): Promise<{
    probability: number;
    estimatedCompletionDate: Date;
    requiredWeeklyProgress: number;
    obstacles: string[];
    accelerators: string[];
  }> {
    try {
      const goal = await Goal.findByPk(goalId);
      if (!goal) throw new Error('Goal not found');

      // Get related tasks
      const tasks = await Task.findAll({
        where: {
          goalId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        order: [['createdAt', 'DESC']],
      });

      // Calculate progress velocity
      const progressVelocity = this.calculateProgressVelocity(goal, tasks);

      // Identify patterns
      const completionPatterns = this.analyzeCompletionPatterns(tasks);

      // Calculate probability
      let probability = 0.5; // Base probability

      // Adjust based on current progress
      if (goal.progress > 70) probability += 0.3;
      else if (goal.progress > 40) probability += 0.15;

      // Adjust based on velocity
      if (progressVelocity > 10) probability += 0.2;
      else if (progressVelocity > 5) probability += 0.1;
      else if (progressVelocity < 2) probability -= 0.2;

      // Adjust based on consistency
      if (completionPatterns.consistency > 0.7) probability += 0.15;
      else if (completionPatterns.consistency < 0.3) probability -= 0.15;

      probability = Math.max(0.1, Math.min(0.95, probability));

      // Estimate completion date
      const remainingProgress = 100 - goal.progress;
      const weeksToComplete = progressVelocity > 0 ? remainingProgress / progressVelocity : 52;

      const estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + weeksToComplete * 7);

      // Calculate required weekly progress
      const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
      const weeksRemaining = targetDate
        ? Math.max(1, (targetDate.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
        : weeksToComplete;

      const requiredWeeklyProgress = remainingProgress / weeksRemaining;

      // Identify obstacles and accelerators
      const { obstacles, accelerators } = await this.identifyGoalFactors(
        goal,
        tasks,
        completionPatterns
      );

      return {
        probability,
        estimatedCompletionDate,
        requiredWeeklyProgress,
        obstacles,
        accelerators,
      };
    } catch (error) {
      logger.error('Error predicting goal completion:', error);
      throw error;
    }
  }

  @Cached({ ttl: 1200, keyPrefix: 'analysis:behavior' }) // 20 minutes
  async analyzeBehaviorPatterns(userId: string): Promise<BehaviorPattern[]> {
    const userData = await this.gatherUserData(userId);
    const patterns: BehaviorPattern[] = [];

    // Task completion patterns
    const taskPattern = this.analyzeTaskPatterns(userData.tasks);
    patterns.push(taskPattern);

    // Mood patterns
    const moodPattern = this.analyzeMoodPatterns(userData.moods);
    patterns.push(moodPattern);

    // Engagement patterns
    const engagementPattern = await this.analyzeEngagementPatterns(userId);
    patterns.push(engagementPattern);

    // Goal setting patterns
    const goalPattern = this.analyzeGoalPatterns(userData.goals);
    patterns.push(goalPattern);

    // Time-based patterns
    const timePattern = await this.analyzeTimePatterns(userData);
    patterns.push(timePattern);

    return patterns;
  }

  private async gatherUserData(userId: string): Promise<unknown> {
    const [goals, tasks, moods, profile, messages] = await Promise.all([
      Goal.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 50,
      }),
      Task.findAll({
        where: {
          userId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days
          },
        },
        order: [['createdAt', 'DESC']],
      }),
      Mood.findAll({
        where: {
          userId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
        order: [['createdAt', 'DESC']],
      }),
      UserProfile.findOne({ where: { userId } }),
      ChatMessage.count({
        include: [
          {
            model: Chat,
            as: 'chat',
            where: { userId },
          },
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Calculate mood trends
    const avgMoodTrend = this.calculateMoodTrend(moods);

    return {
      goals,
      tasks,
      moods,
      profile,
      messageCount: messages,
      avgMoodTrend,
    };
  }

  private calculateSuccessIndicators(userData: unknown, patterns: BehaviorPattern[]): unknown {
    const indicators = {
      consistencyScore: 0,
      progressRate: 0,
      engagementLevel: 0,
      adaptability: 0,
      resilience: 0,
    };

    // Consistency score
    const taskPattern = patterns.find(p => p.pattern === 'task_completion');
    if (taskPattern) {
      indicators.consistencyScore = taskPattern.frequency;
    }

    // Progress rate
    const completedGoals = userData.goals.filter((g: unknown) => g.status === 'completed');
    indicators.progressRate =
      userData.goals.length > 0 ? completedGoals.length / userData.goals.length : 0;

    // Engagement level
    const engagementPattern = patterns.find(p => p.pattern === 'engagement');
    if (engagementPattern) {
      indicators.engagementLevel = engagementPattern.frequency;
    }

    // Adaptability (how quickly user adjusts strategies)
    const strategyChanges = this.detectStrategyChanges(userData.tasks);
    indicators.adaptability = Math.min(1, strategyChanges / 10);

    // Resilience (bounce back from setbacks)
    const resilienceScore = this.calculateResilience(userData);
    indicators.resilience = resilienceScore;

    return indicators;
  }

  private async generateSuccessPrediction(
    userData: unknown,
    patterns: BehaviorPattern[],
    indicators: unknown
  ): Promise<Prediction> {
    // Calculate base probability
    let probability = 0.5;

    // Weight each indicator
    probability += indicators.consistencyScore * 0.2;
    probability += indicators.progressRate * 0.15;
    probability += indicators.engagementLevel * 0.15;
    probability += indicators.adaptability * 0.1;
    probability += indicators.resilience * 0.1;

    // Adjust for patterns
    const positivePatterns = patterns.filter((p: BehaviorPattern) => p.impact === 'positive');
    const negativePatterns = patterns.filter((p: BehaviorPattern) => p.impact === 'negative');

    probability += positivePatterns.length * 0.05;
    probability -= negativePatterns.length * 0.05;

    probability = Math.max(0.1, Math.min(0.95, probability));

    // Determine timeframe
    const timeframe = probability > 0.7 ? '30 days' : probability > 0.5 ? '60 days' : '90 days';

    // Extract factors
    const factors = {
      positive: this.extractPositiveFactors(userData, patterns, indicators),
      negative: this.extractNegativeFactors(userData, patterns, indicators),
    };

    // Generate recommendations
    const recommendations = await this.generatePersonalizedRecommendations(
      userData,
      patterns,
      indicators,
      probability
    );

    // Calculate confidence
    const dataPoints = userData.tasks.length + userData.goals.length + userData.moods.length;
    const confidence = Math.min(0.95, 0.5 + dataPoints / 200);

    return {
      type: 'success',
      probability,
      timeframe,
      factors,
      recommendations,
      confidence,
    };
  }

  private calculateEngagementMetrics(userData: unknown): unknown {
    const recentTasks = userData.tasks.filter(
      (t: unknown) => new Date(t.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );
    const olderTasks = userData.tasks.filter(
      (t: unknown) =>
        new Date(t.createdAt) <= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
        new Date(t.createdAt) > new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    );

    const recentEngagement = recentTasks.length;
    const olderEngagement = olderTasks.length;

    let trend: 'increasing' | 'stable' | 'decreasing';
    if (recentEngagement > olderEngagement * 1.2) trend = 'increasing';
    else if (recentEngagement < olderEngagement * 0.8) trend = 'decreasing';
    else trend = 'stable';

    // Calculate session frequency (sessions per week)
    const uniqueDays = new Set(userData.tasks.map((t: unknown) => new Date(t.createdAt).toDateString()))
      .size;
    const weeksCovered = Math.max(
      1,
      (Date.now() -
        new Date(userData.tasks[userData.tasks.length - 1]?.createdAt || Date.now()).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );
    const sessionFrequency = uniqueDays / weeksCovered;

    return {
      trend,
      sessionFrequency,
      recentEngagement,
      totalEngagement: userData.tasks.length,
    };
  }

  private generateMitigationStrategies(
    indicators: string[],
    severity: 'low' | 'medium' | 'high',
    _userData: unknown
  ): string[] {
    const strategies = [];

    if (indicators.includes('Engagement declining over past 2 weeks')) {
      strategies.push('Send personalized re-engagement message highlighting past successes');
      strategies.push('Offer a quick win challenge to rebuild momentum');
    }

    if (indicators.includes('High task incompletion rate')) {
      strategies.push('Suggest breaking down tasks into smaller, more manageable pieces');
      strategies.push('Implement daily check-ins with simplified goals');
    }

    if (indicators.includes('Declining mood patterns')) {
      strategies.push('Introduce mood-boosting activities and wellness checks');
      strategies.push('Recommend connecting with support resources');
    }

    if (indicators.includes('Less than 2 sessions per week')) {
      strategies.push('Set up gentle reminder notifications at optimal times');
      strategies.push('Create a 5-minute daily habit to maintain connection');
    }

    if (severity === 'high') {
      strategies.unshift('Immediate personal outreach with empathetic support');
      strategies.push('Offer free coaching session or consultation');
    }

    return strategies;
  }

  private calculateProgressVelocity(goal: Goal, tasks: Task[]): number {
    if (tasks.length === 0) return 0;

    // Get weekly progress updates
    const weeklyProgress = [];
    const weeks = 4; // Look at last 4 weeks

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);

      const weekTasks = tasks.filter(
        (t: unknown) =>
          new Date(t.createdAt) >= weekStart &&
          new Date(t.createdAt) < weekEnd &&
          t.status === 'completed'
      );

      weeklyProgress.push(weekTasks.length);
    }

    // Calculate average weekly progress
    const avgProgress = weeklyProgress.reduce((sum, p) => sum + p, 0) / weeks;

    // Estimate progress per week (assuming each task contributes equally)
    const progressPerTask =
      goal.progress / Math.max(1, tasks.filter((t: unknown) => t.status === 'completed').length);

    return avgProgress * progressPerTask;
  }

  private analyzeCompletionPatterns(tasks: Task[]): unknown {
    const completedTasks = tasks.filter((t: unknown) => t.status === 'completed');
    const totalTasks = tasks.length;

    const consistency = totalTasks > 0 ? completedTasks.length / totalTasks : 0;

    // Analyze completion times
    const completionTimes = completedTasks.map((t: unknown) => {
      const created = new Date(t.createdAt).getTime();
      const completed = new Date(t.completedAt || t.updatedAt).getTime();
      return (completed - created) / (1000 * 60 * 60); // hours
    });

    const avgCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
        : 24;

    return {
      consistency,
      avgCompletionTime,
      totalCompleted: completedTasks.length,
      completionRate: consistency,
    };
  }

  private async identifyGoalFactors(
    goal: Goal,
    tasks: Task[],
    patterns: unknown
  ): Promise<{ obstacles: string[]; accelerators: string[] }> {
    const obstacles = [];
    const accelerators = [];

    // Obstacles
    if (patterns.consistency < 0.5) {
      obstacles.push('Low task completion rate affecting momentum');
    }
    if (patterns.avgCompletionTime > 48) {
      obstacles.push('Tasks taking longer than expected to complete');
    }
    if (goal.progress < 20 && tasks.length > 10) {
      obstacles.push('Many tasks but limited progress - may need restructuring');
    }

    // Accelerators
    if (patterns.consistency > 0.7) {
      accelerators.push('Strong task completion consistency');
    }
    if (goal.progress > 60) {
      accelerators.push('Already past the halfway point - momentum advantage');
    }
    if (tasks.filter((t: unknown) => t.priority === 'high' && t.status === 'completed').length > 3) {
      accelerators.push('Successfully completing high-priority tasks');
    }

    // Use AI for deeper analysis
    try {
      const aiAnalysis = await this.getAIGoalAnalysis(goal, tasks);
      obstacles.push(...aiAnalysis.obstacles);
      accelerators.push(...aiAnalysis.accelerators);
    } catch (error) {
      logger.error('Error getting AI goal analysis:', error);
    }

    return {
      obstacles: [...new Set(obstacles)].slice(0, 3),
      accelerators: [...new Set(accelerators)].slice(0, 3),
    };
  }

  private async getAIGoalAnalysis(goal: Goal, tasks: Task[]): Promise<unknown> {
    const prompt = `Analyze this goal and identify obstacles and accelerators:
Goal: ${goal.title}
Progress: ${goal.progress}%
Tasks completed: ${tasks.filter((t: unknown) => t.status === 'completed').length}/${tasks.length}

Provide JSON with:
- obstacles: array of 2-3 specific obstacles
- accelerators: array of 2-3 specific accelerators`;

    try {
      const response = await aiService.generateResponse(
        [
          {
            role: 'system',
            content:
              'You are an expert at analyzing goal achievement patterns. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          temperature: 0.3,
          maxTokens: 300,
        }
      );

      return JSON.parse(response.content);
    } catch (error) {
      return { obstacles: [], accelerators: [] };
    }
  }

  private analyzeTaskPatterns(tasks: Task[]): BehaviorPattern {
    const completedTasks = tasks.filter((t: unknown) => t.status === 'completed');
    const frequency = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

    // Analyze trend
    const recentTasks = tasks.filter(
      t => new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const olderTasks = tasks.filter(
      t =>
        new Date(t.createdAt) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
        new Date(t.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentTasks.length > olderTasks.length * 1.2) trend = 'increasing';
    else if (recentTasks.length < olderTasks.length * 0.8) trend = 'decreasing';

    const impact = frequency > 0.7 ? 'positive' : frequency < 0.3 ? 'negative' : 'neutral';

    const insights = [];
    if (frequency > 0.8) insights.push('Excellent task completion rate');
    if (trend === 'increasing') insights.push('Task activity is increasing');
    if (completedTasks.length > 20) insights.push('Strong track record of completed tasks');

    return {
      pattern: 'task_completion',
      frequency,
      trend,
      impact,
      insights,
    };
  }

  private analyzeMoodPatterns(moods: Mood[]): BehaviorPattern {
    if (moods.length === 0) {
      return {
        pattern: 'mood_tracking',
        frequency: 0,
        trend: 'stable',
        impact: 'neutral',
        insights: ['No mood data available'],
      };
    }

    // Enhanced mood value mapping with more nuanced scoring
    const moodValues: Record<string, number> = {
      great: 5,
      good: 4,
      okay: 3,
      bad: 2,
      terrible: 1,
      // Legacy support
      happy: 5,
      content: 4,
      neutral: 3,
      stressed: 2,
      sad: 1,
    };

    const avgMood =
      moods.reduce((sum, m) => sum + (moodValues[m.mood as string] || 3), 0) / moods.length;

    const frequency = Math.min(1, moods.length / 30); // Expecting daily tracking

    // Enhanced trend analysis with volatility detection
    const recentMoods = moods.slice(0, 7);
    const olderMoods = moods.slice(7, 14);

    const recentAvg =
      recentMoods.reduce((sum, m) => sum + (moodValues[m.mood as string] || 3), 0) /
      Math.max(1, recentMoods.length);

    const olderAvg =
      olderMoods.reduce((sum, m) => sum + (moodValues[m.mood as string] || 3), 0) /
      Math.max(1, olderMoods.length);

    // Calculate mood volatility
    const moodVariance = 
      moods.reduce((sum, m) => {
        const value = moodValues[m.mood as string] || 3;
        return sum + Math.pow(value - avgMood, 2);
      }, 0) / moods.length;
    const moodVolatility = Math.sqrt(moodVariance);

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentAvg > olderAvg + 0.5) trend = 'increasing';
    else if (recentAvg < olderAvg - 0.5) trend = 'decreasing';

    const impact = avgMood > 3.5 ? 'positive' : avgMood < 2.5 ? 'negative' : 'neutral';

    // Enhanced insights with pattern detection
    const insights = this.generateMoodInsights(moods, avgMood, trend, moodVolatility, frequency);

    return {
      pattern: 'mood_tracking',
      frequency,
      trend,
      impact,
      insights,
    };
  }

  /**
   * Generate sophisticated mood insights based on patterns
   */
  private generateMoodInsights(
    moods: Mood[], 
    avgMood: number, 
    trend: 'increasing' | 'stable' | 'decreasing',
    volatility: number,
    frequency: number
  ): string[] {
    const insights = [];

    // Overall mood state insights
    if (avgMood > 4.2) insights.push('Exceptionally positive mood state');
    else if (avgMood > 3.7) insights.push('Generally positive mood state');
    else if (avgMood < 2.3) insights.push('Concerning low mood patterns detected');
    else if (avgMood < 2.8) insights.push('Below-average mood state needs attention');

    // Trend insights
    if (trend === 'increasing') insights.push('Mood is improving over time - positive momentum');
    else if (trend === 'decreasing') insights.push('Mood declining - may need intervention');

    // Frequency insights
    if (frequency > 0.8) insights.push('Consistent mood tracking habit established');
    else if (frequency < 0.3) insights.push('Irregular mood tracking - encourage consistency');

    // Volatility insights
    if (volatility > 1.5) insights.push('High mood volatility - consider stability strategies');
    else if (volatility < 0.5) insights.push('Stable mood patterns - good emotional regulation');

    // Weekly pattern analysis
    const weeklyPatterns = this.analyzeWeeklyMoodPatterns(moods);
    if (weeklyPatterns.bestDay) {
      insights.push(`${weeklyPatterns.bestDay}s tend to be your best mood days`);
    }
    if (weeklyPatterns.worstDay) {
      insights.push(`${weeklyPatterns.worstDay}s show lower mood patterns`);
    }

    // Energy correlation insights
    const energyCorrelation = this.analyzeMoodEnergyCorrelation(moods);
    if (energyCorrelation > 0.7) {
      insights.push('Strong positive correlation between mood and energy levels');
    } else if (energyCorrelation < -0.3) {
      insights.push('Mood and energy levels show concerning inverse relationship');
    }

    // Activity correlation insights
    const activityInsights = this.analyzeMoodActivityCorrelations(moods);
    insights.push(...activityInsights);

    return insights.slice(0, 6); // Limit to most relevant insights
  }

  /**
   * Analyze weekly mood patterns to identify best/worst days
   */
  private analyzeWeeklyMoodPatterns(moods: Mood[]): { bestDay?: string; worstDay?: string } {
    const moodValues: Record<string, number> = {
      great: 5, good: 4, okay: 3, bad: 2, terrible: 1,
      happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1,
    };

    const dayAverages: Record<string, number[]> = {
      Sunday: [], Monday: [], Tuesday: [], Wednesday: [], 
      Thursday: [], Friday: [], Saturday: []
    };

    moods.forEach(mood => {
      const dayName = new Date(mood.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
      const moodValue = moodValues[mood.mood as string] || 3;
      if (dayAverages[dayName]) {
        dayAverages[dayName].push(moodValue);
      }
    });

    const dayScores: Record<string, number> = {};
    Object.entries(dayAverages).forEach(([day, values]) => {
      if (values.length > 0) {
        dayScores[day] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    });

    const sortedDays = Object.entries(dayScores).sort((a, b) => b[1] - a[1]);
    
    return {
      bestDay: sortedDays.length > 0 ? sortedDays[0][0] : undefined,
      worstDay: sortedDays.length > 0 ? sortedDays[sortedDays.length - 1][0] : undefined
    };
  }

  /**
   * Analyze correlation between mood and energy levels
   */
  private analyzeMoodEnergyCorrelation(moods: Mood[]): number {
    const moodValues: Record<string, number> = {
      great: 5, good: 4, okay: 3, bad: 2, terrible: 1,
      happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1,
    };

    const validMoods = moods.filter(m => m.energyLevel != null);
    if (validMoods.length < 3) return 0;

    const moodScores = validMoods.map(m => moodValues[m.mood as string] || 3);
    const energyScores = validMoods.map(m => m.energyLevel || 5);

    // Calculate Pearson correlation coefficient
    const n = moodScores.length;
    const sumMood = moodScores.reduce((sum, val) => sum + val, 0);
    const sumEnergy = energyScores.reduce((sum, val) => sum + val, 0);
    const sumMoodSquare = moodScores.reduce((sum, val) => sum + val * val, 0);
    const sumEnergySquare = energyScores.reduce((sum, val) => sum + val * val, 0);
    const sumProduct = moodScores.reduce((sum, val, i) => sum + val * energyScores[i], 0);

    const numerator = n * sumProduct - sumMood * sumEnergy;
    const denominator = Math.sqrt((n * sumMoodSquare - sumMood * sumMood) * (n * sumEnergySquare - sumEnergy * sumEnergy));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Analyze mood correlations with activities
   */
  private analyzeMoodActivityCorrelations(moods: Mood[]): string[] {
    const insights: string[] = [];
    const activityMoodMap: Record<string, number[]> = {};

    const moodValues: Record<string, number> = {
      great: 5, good: 4, okay: 3, bad: 2, terrible: 1,
      happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1,
    };

    // Group moods by activities
    moods.forEach(mood => {
      const activities = Array.isArray(mood.activities) ? mood.activities : [];
      activities.forEach(activity => {
        if (!activityMoodMap[activity]) {
          activityMoodMap[activity] = [];
        }
        activityMoodMap[activity].push(moodValues[mood.mood as string] || 3);
      });
    });

    // Find activities with strong mood correlations
    const activityAverages = Object.entries(activityMoodMap)
      .filter(([_, values]) => values.length >= 3)
      .map(([activity, values]) => ({
        activity,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        count: values.length
      }))
      .sort((a, b) => b.average - a.average);

    if (activityAverages.length > 0) {
      const topActivity = activityAverages[0];
      if (topActivity.average > 4) {
        insights.push(`${topActivity.activity} consistently correlates with positive moods`);
      }

      const bottomActivity = activityAverages[activityAverages.length - 1];
      if (bottomActivity.average < 3 && activityAverages.length > 1) {
        insights.push(`${bottomActivity.activity} may be associated with lower moods`);
      }
    }

    return insights.slice(0, 2);
  }

  private async analyzeEngagementPatterns(_userId: string): Promise<BehaviorPattern> {
    // This would analyze chat messages, session duration, etc.
    // Simplified for now
    return {
      pattern: 'engagement',
      frequency: 0.7,
      trend: 'stable',
      impact: 'positive',
      insights: ['Regular platform engagement'],
    };
  }

  private analyzeGoalPatterns(goals: Goal[]): BehaviorPattern {
    const completedGoals = goals.filter((g: unknown) => g.status === 'completed');
    const activeGoals = goals.filter((g: unknown) => g.status === 'in_progress');

    const completionRate = goals.length > 0 ? completedGoals.length / goals.length : 0;
    const frequency = Math.min(1, goals.length / 12); // Expecting monthly goals

    // Analyze goal types
    const goalTypes = new Set(goals.map(g => g.category || 'general'));
    const diversity = goalTypes.size / Math.max(1, goals.length);

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    const recentGoals = goals.filter(
      (g: unknown) => new Date(g.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentGoals.length > goals.length / 4) trend = 'increasing';

    const impact =
      completionRate > 0.6 ? 'positive' : completionRate < 0.3 ? 'negative' : 'neutral';

    const insights = [];
    if (completionRate > 0.7) insights.push('High goal achievement rate');
    if (diversity > 0.5) insights.push('Diverse goal portfolio');
    if (activeGoals.length > 3) insights.push('Ambitious with multiple active goals');

    return {
      pattern: 'goal_setting',
      frequency,
      trend,
      impact,
      insights,
    };
  }

  private async analyzeTimePatterns(userData: unknown): Promise<BehaviorPattern> {
    // Analyze when user is most active
    const taskTimes = userData.tasks.map((t: unknown) => new Date(t.createdAt).getHours());
    const hourCounts = taskTimes.reduce(
      (acc: unknown, hour: number) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    const peakHour =
      Object.entries(hourCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] ||
      '9';

    const insights = [];
    if (parseInt(peakHour) < 9) insights.push('Early bird - most active in morning');
    else if (parseInt(peakHour) > 20) insights.push('Night owl - most active in evening');
    else insights.push('Midday peak activity');

    return {
      pattern: 'time_preference',
      frequency: 1,
      trend: 'stable',
      impact: 'neutral',
      insights,
    };
  }

  private calculateMoodTrend(moods: Mood[]): number {
    if (moods.length < 2) return 0;

    const moodValues: Record<string, number> = {
      happy: 5,
      content: 4,
      neutral: 3,
      stressed: 2,
      sad: 1,
    };

    // Simple linear regression
    const points = moods.map((m, i) => ({
      x: i,
      y: moodValues[m.mood as string] || 3,
    }));

    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return slope; // Positive = improving, negative = declining
  }

  private detectStrategyChanges(tasks: Task[]): number {
    // Detect how often user changes approach
    let changes = 0;
    const taskTypes = tasks.map((t: unknown) => t.category || 'general');

    for (let i = 1; i < taskTypes.length; i++) {
      if (taskTypes[i] !== taskTypes[i - 1]) changes++;
    }

    return changes;
  }

  private calculateResilience(userData: unknown): number {
    // Look for bounce-back patterns after setbacks
    let resilienceScore = 0.5;

    // Check if user continues after incomplete tasks
    const incompleteTasks = userData.tasks.filter((t: unknown) => t.status !== 'completed');
    const tasksAfterIncomplete = userData.tasks.filter(
      (_t: unknown, i: number) => i > 0 && userData.tasks[i - 1].status !== 'completed'
    );

    if (incompleteTasks.length > 0 && tasksAfterIncomplete.length > 0) {
      resilienceScore += 0.2;
    }

    // Check mood recovery
    const moodDips = userData.moods.filter((m: unknown) => m.mood === 'stressed' || m.mood === 'sad');
    if (moodDips.length > 0) {
      const recoveries = moodDips.filter(
        (_m: unknown, i: number) =>
          i < userData.moods.length - 1 &&
          (userData.moods[i + 1].mood === 'happy' || userData.moods[i + 1].mood === 'content')
      );
      resilienceScore += (recoveries.length / moodDips.length) * 0.3;
    }

    return Math.min(1, resilienceScore);
  }

  private extractPositiveFactors(
    _userData: unknown,
    patterns: BehaviorPattern[],
    indicators: unknown
  ): string[] {
    const factors = [];

    if (indicators.consistencyScore > 0.7) {
      factors.push('High consistency in task completion');
    }
    if (indicators.progressRate > 0.5) {
      factors.push('Strong goal achievement track record');
    }
    if (indicators.resilience > 0.7) {
      factors.push('Excellent resilience and recovery from setbacks');
    }

    const positivePatterns = patterns.filter((p: BehaviorPattern) => p.impact === 'positive');
    positivePatterns.forEach(p => {
      if (p.insights.length > 0) {
        factors.push(p.insights[0]);
      }
    });

    return [...new Set(factors)].slice(0, 5);
  }

  private extractNegativeFactors(
    userData: unknown,
    patterns: BehaviorPattern[],
    indicators: unknown
  ): string[] {
    const factors = [];

    if (indicators.consistencyScore < 0.3) {
      factors.push('Inconsistent task completion');
    }
    if (indicators.engagementLevel < 0.3) {
      factors.push('Low engagement levels');
    }
    if (userData.avgMoodTrend < -0.5) {
      factors.push('Declining mood patterns');
    }

    const negativePatterns = patterns.filter((p: BehaviorPattern) => p.impact === 'negative');
    negativePatterns.forEach(p => {
      if (p.insights.length > 0) {
        factors.push(p.insights[0]);
      }
    });

    return [...new Set(factors)].slice(0, 3);
  }

  private async generatePersonalizedRecommendations(
    _userData: unknown,
    patterns: BehaviorPattern[],
    indicators: unknown,
    probability: number
  ): Promise<string[]> {
    const recommendations = [];

    // Low consistency
    if (indicators.consistencyScore < 0.5) {
      recommendations.push('Start with tiny daily habits to build consistency');
      recommendations.push('Set specific times for your coaching activities');
    }

    // Low engagement
    if (indicators.engagementLevel < 0.5) {
      recommendations.push('Try shorter, more frequent sessions');
      recommendations.push('Focus on one area that excites you most');
    }

    // High potential but low progress
    if (probability > 0.7 && indicators.progressRate < 0.3) {
      recommendations.push('Break down your goals into smaller milestones');
      recommendations.push('Celebrate small wins to maintain momentum');
    }

    // Declining patterns
    const decliningPatterns = patterns.filter((p: BehaviorPattern) => p.trend === 'decreasing');
    if (decliningPatterns.length > 2) {
      recommendations.push('Schedule a reflection session to reassess priorities');
      recommendations.push('Consider if your goals still align with your values');
    }

    // High achiever optimization
    if (probability > 0.8) {
      recommendations.push('Challenge yourself with stretch goals');
      recommendations.push('Share your success strategies with the community');
    }

    return recommendations.slice(0, 5);
  }

  async generateInterventionPlan(
    userId: string,
    _riskType: 'churn' | 'burnout' | 'stagnation'
  ): Promise<{
    interventions: Array<{
      timing: string;
      action: string;
      channel: string;
      message: string;
      expectedImpact: string;
    }>;
    successMetrics: string[];
  }> {
    const risk = await this.predictChurnRisk(userId);
    const interventions = [];

    if (risk.severity === 'high') {
      interventions.push({
        timing: 'Immediate (within 24 hours)',
        action: 'Personal outreach',
        channel: 'Email + In-app notification',
        message: 'We noticed you might be facing challenges. How can we help?',
        expectedImpact: '40% reduction in churn probability',
      });
    }

    interventions.push({
      timing: 'Day 2-3',
      action: 'Success story sharing',
      channel: 'In-app',
      message: 'See how others overcame similar challenges',
      expectedImpact: '25% increase in engagement',
    });

    interventions.push({
      timing: 'Day 5-7',
      action: 'Simplified goal offering',
      channel: 'Push notification',
      message: 'Start fresh with a 5-minute daily win',
      expectedImpact: '30% reactivation rate',
    });

    const successMetrics = [
      'User logs in within 48 hours',
      'Completes at least one task within 7 days',
      'Engagement frequency returns to baseline',
      'Mood ratings improve or stabilize',
      'Sets a new goal within 14 days',
    ];

    return { interventions, successMetrics };
  }

  /**
   * Analyze goal completion risks and provide detailed risk assessment
   */
  async analyzeGoalRisk(goalId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    probability: number;
    factors: {
      positive: string[];
      negative: string[];
      neutral: string[];
    };
    recommendations: string[];
    timeline: {
      currentProgress: number;
      expectedProgress: number;
      daysRemaining: number;
      requiredDailyProgress: number;
    };
    interventions: Array<{
      type: 'immediate' | 'short_term' | 'long_term';
      action: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: string;
    }>;
  }> {
    try {
      const goal = await Goal.findByPk(goalId);
      if (!goal) {
        throw new Error(`Goal with ID ${goalId} not found`);
      }

      // Get related data for analysis
      const [tasks, userData, relatedGoals] = await Promise.all([
        Task.findAll({
          where: { goalId },
          order: [['createdAt', 'DESC']],
          limit: 100,
        }),
        this.gatherUserData(goal.userId),
        Goal.findAll({
          where: {
            userId: goal.userId,
            id: { [Op.ne]: goalId },
            status: { [Op.in]: ['in_progress', 'completed'] },
          },
          order: [['createdAt', 'DESC']],
          limit: 10,
        }),
      ]);

      // Calculate timeline metrics
      const timeline = this.calculateGoalTimeline(goal, tasks);

      // Analyze risk factors
      const riskFactors = await this.analyzeRiskFactors(goal, tasks, userData, relatedGoals);

      // Calculate overall risk probability
      const probability = this.calculateRiskProbability(goal, tasks, riskFactors, timeline);

      // Determine risk level
      const riskLevel = this.determineRiskLevel(probability, timeline);

      // Generate personalized recommendations
      const recommendations = await this.generateRiskMitigationRecommendations(
        goal,
        riskFactors,
        timeline,
        riskLevel
      );

      // Generate intervention plan
      const interventions = this.generateRiskInterventions(goal, riskLevel, riskFactors, timeline);

      logger.info('Goal risk analysis completed', {
        goalId,
        riskLevel,
        probability: Math.round(probability * 100),
        factorsCount: {
          positive: riskFactors.positive.length,
          negative: riskFactors.negative.length,
          neutral: riskFactors.neutral.length,
        },
      });

      return {
        riskLevel,
        probability,
        factors: riskFactors,
        recommendations,
        timeline,
        interventions,
      };
    } catch (error) {
      logger.error('Error analyzing goal risk:', error);
      throw new Error(`Failed to analyze goal risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate goal timeline and progress metrics
   */
  private calculateGoalTimeline(goal: Goal, tasks: Task[]): {
    currentProgress: number;
    expectedProgress: number;
    daysRemaining: number;
    requiredDailyProgress: number;
  } {
    const currentProgress = goal.progress || 0;
    const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
    const createdDate = new Date(goal.createdAt);
    const now = new Date();

    let daysRemaining = 30; // Default to 30 days if no target date
    let expectedProgress = currentProgress;

    if (targetDate) {
      daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const totalDays = Math.ceil((targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = totalDays - daysRemaining;
      expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
    }

    const remainingProgress = 100 - currentProgress;
    const requiredDailyProgress = daysRemaining > 0 ? remainingProgress / daysRemaining : 0;

    return {
      currentProgress,
      expectedProgress: Math.max(0, Math.min(100, expectedProgress)),
      daysRemaining,
      requiredDailyProgress: Math.max(0, requiredDailyProgress),
    };
  }

  /**
   * Analyze various risk factors affecting goal completion
   */
  private async analyzeRiskFactors(
    goal: Goal,
    tasks: Task[],
    userData: unknown,
    relatedGoals: Goal[]
  ): Promise<{
    positive: string[];
    negative: string[];
    neutral: string[];
  }> {
    const factors = {
      positive: [] as string[],
      negative: [] as string[],
      neutral: [] as string[],
    };

    // Task completion analysis
    const completedTasks = tasks.filter((t: unknown) => t.status === 'completed');
    const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

    if (completionRate > 0.8) {
      factors.positive.push(`Excellent task completion rate (${Math.round(completionRate * 100)}%)`);
    } else if (completionRate > 0.6) {
      factors.positive.push(`Good task completion rate (${Math.round(completionRate * 100)}%)`);
    } else if (completionRate < 0.3) {
      factors.negative.push(`Low task completion rate (${Math.round(completionRate * 100)}%)`);
    } else {
      factors.neutral.push(`Moderate task completion rate (${Math.round(completionRate * 100)}%)`);
    }

    // Progress velocity analysis
    const recentTasks = tasks.filter(
      (t: unknown) => new Date(t.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );
    const recentCompletions = recentTasks.filter((t: unknown) => t.status === 'completed');

    if (recentCompletions.length > 5) {
      factors.positive.push('High recent activity with multiple task completions');
    } else if (recentCompletions.length === 0 && recentTasks.length === 0) {
      factors.negative.push('No recent activity on this goal');
    }

    // Goal complexity analysis
    if (tasks.length > 20) {
      if (completionRate > 0.7) {
        factors.positive.push('Successfully managing complex goal with many tasks');
      } else {
        factors.negative.push('Complex goal with many incomplete tasks may cause overwhelm');
      }
    } else if (tasks.length < 3) {
      factors.negative.push('Goal may lack sufficient planning and breakdown');
    }

    // User engagement patterns
    const overallEngagement = await this.calculateEngagementMetrics(userData);
    if (overallEngagement.trend === 'decreasing') {
      factors.negative.push('Overall user engagement is declining');
    } else if (overallEngagement.trend === 'increasing') {
      factors.positive.push('User engagement is increasing');
    }

    // Related goals analysis
    const completedRelatedGoals = relatedGoals.filter((g: unknown) => g.status === 'completed');
    if (completedRelatedGoals.length > 2) {
      factors.positive.push('Strong track record of completing similar goals');
    } else if (completedRelatedGoals.length === 0 && relatedGoals.length > 2) {
      factors.negative.push('No completed goals in recent history');
    }

    // Time-based risk factors
    const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
    if (targetDate) {
      const daysUntilTarget = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilTarget < 7 && goal.progress < 80) {
        factors.negative.push('Goal deadline approaching with significant work remaining');
      } else if (daysUntilTarget > 90 && goal.progress < 10) {
        factors.negative.push('Long-term goal with minimal progress may lose momentum');
      } else if (daysUntilTarget > 30 && goal.progress > 50) {
        factors.positive.push('Good progress with adequate time remaining');
      }
    }

    // Mood correlation analysis
    if (userData.avgMoodTrend > 0.2) {
      factors.positive.push('Positive mood trend supports goal achievement');
    } else if (userData.avgMoodTrend < -0.2) {
      factors.negative.push('Declining mood may impact goal motivation');
    }

    // Task priority analysis
    const highPriorityTasks = tasks.filter((t: unknown) => t.priority === 'high');
    const completedHighPriorityTasks = highPriorityTasks.filter((t: unknown) => t.status === 'completed');
    
    if (highPriorityTasks.length > 0) {
      const highPriorityCompletion = completedHighPriorityTasks.length / highPriorityTasks.length;
      if (highPriorityCompletion > 0.8) {
        factors.positive.push('Excellent completion of high-priority tasks');
      } else if (highPriorityCompletion < 0.4) {
        factors.negative.push('Struggling with high-priority task completion');
      }
    }

    return factors;
  }

  /**
   * Calculate overall risk probability
   */
  private calculateRiskProbability(
    goal: Goal,
    tasks: Task[],
    riskFactors: { positive: string[]; negative: string[]; neutral: string[] },
    timeline: unknown
  ): number {
    let riskScore = 0.3; // Base risk

    // Progress vs timeline risk
    const progressGap = timeline.expectedProgress - timeline.currentProgress;
    if (progressGap > 30) riskScore += 0.3;
    else if (progressGap > 15) riskScore += 0.15;
    else if (progressGap < -10) riskScore -= 0.1; // Ahead of schedule

    // Required daily progress risk
    if (timeline.requiredDailyProgress > 5) riskScore += 0.2;
    else if (timeline.requiredDailyProgress > 2) riskScore += 0.1;

    // Factor-based risk adjustment
    const factorBalance = riskFactors.positive.length - riskFactors.negative.length;
    riskScore -= factorBalance * 0.05; // Adjust by 5% per factor difference

    // Task-based risk
    const completionRate = tasks.length > 0 
      ? tasks.filter((t: unknown) => t.status === 'completed').length / tasks.length 
      : 0;
    
    if (completionRate < 0.3) riskScore += 0.2;
    else if (completionRate > 0.8) riskScore -= 0.15;

    // Days remaining risk
    if (timeline.daysRemaining < 3 && timeline.currentProgress < 90) riskScore += 0.4;
    else if (timeline.daysRemaining < 7 && timeline.currentProgress < 70) riskScore += 0.25;

    return Math.max(0, Math.min(1, riskScore));
  }

  /**
   * Determine risk level based on probability and timeline
   */
  private determineRiskLevel(probability: number, timeline: unknown): 'low' | 'medium' | 'high' | 'critical' {
    // Critical conditions
    if (
      timeline.daysRemaining < 2 && timeline.currentProgress < 80 ||
      probability > 0.9
    ) {
      return 'critical';
    }

    // High risk conditions
    if (
      probability > 0.7 ||
      (timeline.daysRemaining < 7 && timeline.currentProgress < 60) ||
      timeline.requiredDailyProgress > 5
    ) {
      return 'high';
    }

    // Medium risk conditions
    if (
      probability > 0.4 ||
      timeline.currentProgress < timeline.expectedProgress - 20 ||
      timeline.requiredDailyProgress > 2
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate risk mitigation recommendations
   */
  private async generateRiskMitigationRecommendations(
    goal: Goal,
    riskFactors: { positive: string[]; negative: string[]; neutral: string[] },
    timeline: unknown,
    riskLevel: string
  ): Promise<string[]> {
    const recommendations = [];

    // Timeline-based recommendations
    if (timeline.requiredDailyProgress > 3) {
      recommendations.push('Break down remaining work into smaller, daily achievable tasks');
      recommendations.push('Consider extending the deadline if possible to maintain quality');
    }

    if (timeline.currentProgress < timeline.expectedProgress - 15) {
      recommendations.push('Schedule dedicated time blocks for goal-related activities');
      recommendations.push('Review and eliminate low-priority tasks to focus on essentials');
    }

    // Risk level specific recommendations
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Seek support from friends, family, or mentors');
      recommendations.push('Consider simplifying the goal scope to ensure completion');
      recommendations.push('Implement daily progress tracking and accountability');
    }

    // Factor-based recommendations
    if (riskFactors.negative.some(f => f.includes('completion rate'))) {
      recommendations.push('Review task difficulty - consider breaking tasks into smaller steps');
      recommendations.push('Identify and address barriers preventing task completion');
    }

    if (riskFactors.negative.some(f => f.includes('recent activity'))) {
      recommendations.push('Set up daily reminders to maintain momentum');
      recommendations.push('Start with just 10-15 minutes per day to rebuild the habit');
    }

    if (riskFactors.negative.some(f => f.includes('mood'))) {
      recommendations.push('Focus on small wins to rebuild confidence and motivation');
      recommendations.push('Consider addressing underlying wellness factors affecting mood');
    }

    // Positive reinforcement
    if (riskFactors.positive.length > riskFactors.negative.length) {
      recommendations.push('Leverage your current momentum - increase daily commitment slightly');
      recommendations.push('Document what\'s working well to maintain successful strategies');
    }

    // Default recommendations if none specific
    if (recommendations.length === 0) {
      recommendations.push('Maintain current pace and review progress weekly');
      recommendations.push('Prepare contingency plans for potential obstacles');
    }

    return recommendations.slice(0, 6); // Limit to 6 recommendations
  }

  /**
   * Generate intervention plan based on risk level
   */
  private generateRiskInterventions(
    goal: Goal,
    riskLevel: string,
    riskFactors: { positive: string[]; negative: string[]; neutral: string[] },
    timeline: unknown
  ): Array<{
    type: 'immediate' | 'short_term' | 'long_term';
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: string;
  }> {
    const interventions = [];

    if (riskLevel === 'critical') {
      interventions.push({
        type: 'immediate',
        action: 'Emergency goal review and scope reduction',
        priority: 'high',
        expectedImpact: '40% reduction in completion risk',
      });

      interventions.push({
        type: 'immediate',
        action: 'Daily accountability check-ins',
        priority: 'high',
        expectedImpact: '30% increase in daily progress',
      });
    }

    if (riskLevel === 'high' || riskLevel === 'critical') {
      interventions.push({
        type: 'short_term',
        action: 'Restructure remaining tasks by priority and effort',
        priority: 'high',
        expectedImpact: '25% improvement in completion rate',
      });

      interventions.push({
        type: 'short_term',
        action: 'Implement pomodoro technique for focused work',
        priority: 'medium',
        expectedImpact: '20% increase in task completion speed',
      });
    }

    if (riskLevel === 'medium') {
      interventions.push({
        type: 'short_term',
        action: 'Weekly progress review and plan adjustment',
        priority: 'medium',
        expectedImpact: '15% improvement in staying on track',
      });
    }

    // Always include long-term intervention for future prevention
    interventions.push({
      type: 'long_term',
      action: 'Develop better goal planning and breakdown skills',
      priority: 'low',
      expectedImpact: '50% reduction in future goal completion risks',
    });

    return interventions;
  }
}

export const predictiveAnalytics = new PredictiveAnalytics();
