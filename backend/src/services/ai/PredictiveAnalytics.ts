import { Goal } from '../../models/Goal';
import { Task } from '../../models/Task';
import { Mood } from '../../models/Mood';
import { UserProfile } from '../../models/UserProfile';
import { ChatMessage } from '../../models/ChatMessage';
import { Chat } from '../../models/Chat';
import { Op } from 'sequelize';
import { logger } from '../../utils/logger';
import { aiService } from './AIService';
import { sequelize } from '../../config/database';

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
      const incompletionRate = userData.tasks.filter(t => t.status !== 'completed').length / 
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
      const recentGoals = userData.goals.filter(g => 
        new Date(g.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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
      const timeToIntervention = severity === 'high' ? 1 : 
                                severity === 'medium' ? 3 : 7;

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
        timeToIntervention
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
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['createdAt', 'DESC']]
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
      const weeksToComplete = progressVelocity > 0 ? 
        remainingProgress / progressVelocity : 52;
      
      const estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(
        estimatedCompletionDate.getDate() + (weeksToComplete * 7)
      );

      // Calculate required weekly progress
      const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
      const weeksRemaining = targetDate ? 
        Math.max(1, (targetDate.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)) : 
        weeksToComplete;
      
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
        accelerators
      };
    } catch (error) {
      logger.error('Error predicting goal completion:', error);
      throw error;
    }
  }

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

  private async gatherUserData(userId: string): Promise<any> {
    const [goals, tasks, moods, profile, messages] = await Promise.all([
      Goal.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 50
      }),
      Task.findAll({
        where: {
          userId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days
          }
        },
        order: [['createdAt', 'DESC']]
      }),
      Mood.findAll({
        where: {
          userId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        },
        order: [['createdAt', 'DESC']]
      }),
      UserProfile.findOne({ where: { userId } }),
      ChatMessage.count({
        include: [{
          model: Chat,
          as: 'chat',
          where: { userId }
        }],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calculate mood trends
    const avgMoodTrend = this.calculateMoodTrend(moods);

    return {
      goals,
      tasks,
      moods,
      profile,
      messageCount: messages,
      avgMoodTrend
    };
  }

  private calculateSuccessIndicators(userData: any, patterns: BehaviorPattern[]): any {
    const indicators = {
      consistencyScore: 0,
      progressRate: 0,
      engagementLevel: 0,
      adaptability: 0,
      resilience: 0
    };

    // Consistency score
    const taskPattern = patterns.find(p => p.pattern === 'task_completion');
    if (taskPattern) {
      indicators.consistencyScore = taskPattern.frequency;
    }

    // Progress rate
    const completedGoals = userData.goals.filter(g => g.status === 'completed');
    indicators.progressRate = userData.goals.length > 0 ? 
      completedGoals.length / userData.goals.length : 0;

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
    userData: any,
    patterns: BehaviorPattern[],
    indicators: any
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
    const positivePatterns = patterns.filter(p => p.impact === 'positive');
    const negativePatterns = patterns.filter(p => p.impact === 'negative');
    
    probability += positivePatterns.length * 0.05;
    probability -= negativePatterns.length * 0.05;

    probability = Math.max(0.1, Math.min(0.95, probability));

    // Determine timeframe
    const timeframe = probability > 0.7 ? '30 days' : 
                     probability > 0.5 ? '60 days' : '90 days';

    // Extract factors
    const factors = {
      positive: this.extractPositiveFactors(userData, patterns, indicators),
      negative: this.extractNegativeFactors(userData, patterns, indicators)
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
    const confidence = Math.min(0.95, 0.5 + (dataPoints / 200));

    return {
      type: 'success',
      probability,
      timeframe,
      factors,
      recommendations,
      confidence
    };
  }

  private calculateEngagementMetrics(userData: any): any {
    const recentTasks = userData.tasks.filter(t => 
      new Date(t.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );
    const olderTasks = userData.tasks.filter(t => 
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
    const uniqueDays = new Set(
      userData.tasks.map((t: any) => new Date(t.createdAt).toDateString())
    ).size;
    const weeksCovered = Math.max(1, 
      (Date.now() - new Date(userData.tasks[userData.tasks.length - 1]?.createdAt || Date.now()).getTime()) / 
      (7 * 24 * 60 * 60 * 1000)
    );
    const sessionFrequency = uniqueDays / weeksCovered;

    return {
      trend,
      sessionFrequency,
      recentEngagement,
      totalEngagement: userData.tasks.length
    };
  }

  private generateMitigationStrategies(
    indicators: string[],
    severity: 'low' | 'medium' | 'high',
    userData: any
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
      
      const weekTasks = tasks.filter(t => 
        new Date(t.createdAt) >= weekStart && 
        new Date(t.createdAt) < weekEnd &&
        t.status === 'completed'
      );

      weeklyProgress.push(weekTasks.length);
    }

    // Calculate average weekly progress
    const avgProgress = weeklyProgress.reduce((sum, p) => sum + p, 0) / weeks;
    
    // Estimate progress per week (assuming each task contributes equally)
    const progressPerTask = goal.progress / Math.max(1, 
      tasks.filter(t => t.status === 'completed').length
    );
    
    return avgProgress * progressPerTask;
  }

  private analyzeCompletionPatterns(tasks: Task[]): any {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const totalTasks = tasks.length;

    const consistency = totalTasks > 0 ? completedTasks.length / totalTasks : 0;

    // Analyze completion times
    const completionTimes = completedTasks.map((t: any) => {
      const created = new Date(t.createdAt).getTime();
      const completed = new Date(t.completedAt || t.updatedAt).getTime();
      return (completed - created) / (1000 * 60 * 60); // hours
    });

    const avgCompletionTime = completionTimes.length > 0 ?
      completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length : 24;

    return {
      consistency,
      avgCompletionTime,
      totalCompleted: completedTasks.length,
      completionRate: consistency
    };
  }

  private async identifyGoalFactors(
    goal: Goal,
    tasks: Task[],
    patterns: any
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
    if (tasks.filter(t => t.priority === 'high' && t.status === 'completed').length > 3) {
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
      accelerators: [...new Set(accelerators)].slice(0, 3)
    };
  }

  private async getAIGoalAnalysis(goal: Goal, tasks: Task[]): Promise<any> {
    const prompt = `Analyze this goal and identify obstacles and accelerators:
Goal: ${goal.title}
Progress: ${goal.progress}%
Tasks completed: ${tasks.filter(t => t.status === 'completed').length}/${tasks.length}

Provide JSON with:
- obstacles: array of 2-3 specific obstacles
- accelerators: array of 2-3 specific accelerators`;

    try {
      const response = await aiService.generateResponse([
        {
          role: 'system',
          content: 'You are an expert at analyzing goal achievement patterns. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.3,
        maxTokens: 300
      });

      return JSON.parse(response.content);
    } catch (error) {
      return { obstacles: [], accelerators: [] };
    }
  }

  private analyzeTaskPatterns(tasks: Task[]): BehaviorPattern {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const frequency = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

    // Analyze trend
    const recentTasks = tasks.filter(t => 
      new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const olderTasks = tasks.filter(t => 
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
      insights
    };
  }

  private analyzeMoodPatterns(moods: Mood[]): BehaviorPattern {
    if (moods.length === 0) {
      return {
        pattern: 'mood_tracking',
        frequency: 0,
        trend: 'stable',
        impact: 'neutral',
        insights: ['No mood data available']
      };
    }

    // Calculate average mood
    const moodValues = { happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1 };
    const avgMood = moods.reduce((sum, m) => 
      sum + (moodValues[m.mood] || 3), 0
    ) / moods.length;

    const frequency = Math.min(1, moods.length / 30); // Expecting daily tracking

    // Trend analysis
    const recentMoods = moods.slice(0, 7);
    const olderMoods = moods.slice(7, 14);
    
    const recentAvg = recentMoods.reduce((sum, m) => 
      sum + (moodValues[m.mood] || 3), 0
    ) / Math.max(1, recentMoods.length);
    
    const olderAvg = olderMoods.reduce((sum, m) => 
      sum + (moodValues[m.mood] || 3), 0
    ) / Math.max(1, olderMoods.length);

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentAvg > olderAvg + 0.5) trend = 'increasing';
    else if (recentAvg < olderAvg - 0.5) trend = 'decreasing';

    const impact = avgMood > 3.5 ? 'positive' : avgMood < 2.5 ? 'negative' : 'neutral';

    const insights = [];
    if (avgMood > 4) insights.push('Generally positive mood state');
    if (trend === 'increasing') insights.push('Mood is improving over time');
    if (frequency > 0.8) insights.push('Consistent mood tracking habit');

    return {
      pattern: 'mood_tracking',
      frequency,
      trend,
      impact,
      insights
    };
  }

  private async analyzeEngagementPatterns(userId: string): Promise<BehaviorPattern> {
    // This would analyze chat messages, session duration, etc.
    // Simplified for now
    return {
      pattern: 'engagement',
      frequency: 0.7,
      trend: 'stable',
      impact: 'positive',
      insights: ['Regular platform engagement']
    };
  }

  private analyzeGoalPatterns(goals: Goal[]): BehaviorPattern {
    const completedGoals = goals.filter(g => g.status === 'completed');
    const activeGoals = goals.filter(g => g.status === 'in_progress');
    
    const completionRate = goals.length > 0 ? completedGoals.length / goals.length : 0;
    const frequency = Math.min(1, goals.length / 12); // Expecting monthly goals

    // Analyze goal types
    const goalTypes = new Set(goals.map(g => g.category || 'general'));
    const diversity = goalTypes.size / Math.max(1, goals.length);

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    const recentGoals = goals.filter(g => 
      new Date(g.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentGoals.length > goals.length / 4) trend = 'increasing';

    const impact = completionRate > 0.6 ? 'positive' : 
                  completionRate < 0.3 ? 'negative' : 'neutral';

    const insights = [];
    if (completionRate > 0.7) insights.push('High goal achievement rate');
    if (diversity > 0.5) insights.push('Diverse goal portfolio');
    if (activeGoals.length > 3) insights.push('Ambitious with multiple active goals');

    return {
      pattern: 'goal_setting',
      frequency,
      trend,
      impact,
      insights
    };
  }

  private async analyzeTimePatterns(userData: any): Promise<BehaviorPattern> {
    // Analyze when user is most active
    const taskTimes = userData.tasks.map((t: any) => new Date(t.createdAt).getHours());
    const hourCounts = taskTimes.reduce((acc: any, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || '9';

    const insights = [];
    if (parseInt(peakHour) < 9) insights.push('Early bird - most active in morning');
    else if (parseInt(peakHour) > 20) insights.push('Night owl - most active in evening');
    else insights.push('Midday peak activity');

    return {
      pattern: 'time_preference',
      frequency: 1,
      trend: 'stable',
      impact: 'neutral',
      insights
    };
  }

  private calculateMoodTrend(moods: Mood[]): number {
    if (moods.length < 2) return 0;

    const moodValues = { happy: 5, content: 4, neutral: 3, stressed: 2, sad: 1 };
    
    // Simple linear regression
    const points = moods.map((m, i) => ({
      x: i,
      y: moodValues[m.mood] || 3
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
    const taskTypes = tasks.map((t: any) => t.category || 'general');
    
    for (let i = 1; i < taskTypes.length; i++) {
      if (taskTypes[i] !== taskTypes[i-1]) changes++;
    }

    return changes;
  }

  private calculateResilience(userData: any): number {
    // Look for bounce-back patterns after setbacks
    let resilienceScore = 0.5;

    // Check if user continues after incomplete tasks
    const incompleteTasks = userData.tasks.filter(t => t.status !== 'completed');
    const tasksAfterIncomplete = userData.tasks.filter((t, i) => 
      i > 0 && userData.tasks[i-1].status !== 'completed'
    );

    if (incompleteTasks.length > 0 && tasksAfterIncomplete.length > 0) {
      resilienceScore += 0.2;
    }

    // Check mood recovery
    const moodDips = userData.moods.filter((m: any) => 
      m.mood === 'stressed' || m.mood === 'sad'
    );
    if (moodDips.length > 0) {
      const recoveries = moodDips.filter((m, i) => 
        i < userData.moods.length - 1 && 
        (userData.moods[i+1].mood === 'happy' || userData.moods[i+1].mood === 'content')
      );
      resilienceScore += (recoveries.length / moodDips.length) * 0.3;
    }

    return Math.min(1, resilienceScore);
  }

  private extractPositiveFactors(
    userData: any,
    patterns: BehaviorPattern[],
    indicators: any
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

    const positivePatterns = patterns.filter(p => p.impact === 'positive');
    positivePatterns.forEach(p => {
      if (p.insights.length > 0) {
        factors.push(p.insights[0]);
      }
    });

    return [...new Set(factors)].slice(0, 5);
  }

  private extractNegativeFactors(
    userData: any,
    patterns: BehaviorPattern[],
    indicators: any
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

    const negativePatterns = patterns.filter(p => p.impact === 'negative');
    negativePatterns.forEach(p => {
      if (p.insights.length > 0) {
        factors.push(p.insights[0]);
      }
    });

    return [...new Set(factors)].slice(0, 3);
  }

  private async generatePersonalizedRecommendations(
    userData: any,
    patterns: BehaviorPattern[],
    indicators: any,
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
    const decliningPatterns = patterns.filter(p => p.trend === 'decreasing');
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
    riskType: 'churn' | 'burnout' | 'stagnation'
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
        expectedImpact: '40% reduction in churn probability'
      });
    }

    interventions.push({
      timing: 'Day 2-3',
      action: 'Success story sharing',
      channel: 'In-app',
      message: 'See how others overcame similar challenges',
      expectedImpact: '25% increase in engagement'
    });

    interventions.push({
      timing: 'Day 5-7',
      action: 'Simplified goal offering',
      channel: 'Push notification',
      message: 'Start fresh with a 5-minute daily win',
      expectedImpact: '30% reactivation rate'
    });

    const successMetrics = [
      'User logs in within 48 hours',
      'Completes at least one task within 7 days',
      'Engagement frequency returns to baseline',
      'Mood ratings improve or stabilize',
      'Sets a new goal within 14 days'
    ];

    return { interventions, successMetrics };
  }
}

export const predictiveAnalytics = new PredictiveAnalytics();