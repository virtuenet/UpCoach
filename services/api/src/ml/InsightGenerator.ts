import { EventEmitter } from 'events';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface UserBehaviorData {
  userId: string;
  timestamp: Date;
  eventType: string;
  metadata?: Record<string, any>;
}

export interface Pattern {
  patternId: string;
  type: 'temporal' | 'behavioral' | 'engagement' | 'achievement';
  description: string;
  confidence: number;
  occurrences: number;
  firstDetected: Date;
  lastDetected: Date;
  metadata?: Record<string, any>;
}

export interface Anomaly {
  anomalyId: string;
  type: 'unusual_activity' | 'drop_off' | 'spike' | 'deviation';
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  expectedValue: number;
  actualValue: number;
  deviation: number;
}

export interface Trend {
  metricName: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number; // rate of change
  confidence: number;
  dataPoints: Array<{ timestamp: Date; value: number }>;
  forecast?: Array<{ timestamp: Date; predicted: number; confidence: number }>;
}

export interface Insight {
  insightId: string;
  userId: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  score: number; // 0-100, priority/importance
  actionable: boolean;
  recommendations?: string[];
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface WeeklyReport {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  summary: {
    totalActiveDays: number;
    goalsProgress: number;
    habitsCompleted: number;
    streakDays: number;
  };
  highlights: string[];
  insights: Insight[];
  trends: Trend[];
  recommendations: string[];
}

export interface MonthlyReport {
  userId: string;
  month: number;
  year: number;
  summary: {
    totalActiveDays: number;
    goalsCompleted: number;
    habitsFormed: number;
    longestStreak: number;
    totalProgress: number;
  };
  achievements: string[];
  insights: Insight[];
  trends: Trend[];
  comparisonToPreviousMonth: {
    activeDaysChange: number;
    goalsChange: number;
    progressChange: number;
  };
}

// ============================================================================
// INSIGHT GENERATOR
// ============================================================================

export class InsightGenerator extends EventEmitter {
  private static instance: InsightGenerator;

  private behaviorData: Map<string, UserBehaviorData[]> = new Map();
  private detectedPatterns: Map<string, Pattern[]> = new Map();
  private detectedAnomalies: Map<string, Anomaly[]> = new Map();
  private insights: Map<string, Insight[]> = new Map();

  private readonly ANOMALY_THRESHOLD = 2.0; // Standard deviations
  private readonly MIN_PATTERN_OCCURRENCES = 3;
  private readonly TREND_MIN_DATAPOINTS = 7;

  private constructor() {
    super();
  }

  static getInstance(): InsightGenerator {
    if (!InsightGenerator.instance) {
      InsightGenerator.instance = new InsightGenerator();
    }
    return InsightGenerator.instance;
  }

  // ============================================================================
  // PATTERN DETECTION
  // ============================================================================

  async detectPatterns(userId: string): Promise<Pattern[]> {
    const userBehavior = this.behaviorData.get(userId) || [];

    if (userBehavior.length < 10) {
      return []; // Not enough data
    }

    const patterns: Pattern[] = [];

    // Detect temporal patterns (e.g., "user is most active in the morning")
    const temporalPatterns = this.detectTemporalPatterns(userBehavior);
    patterns.push(...temporalPatterns);

    // Detect behavioral patterns (e.g., "user completes goals in batches")
    const behavioralPatterns = this.detectBehavioralPatterns(userBehavior);
    patterns.push(...behavioralPatterns);

    // Detect engagement patterns
    const engagementPatterns = this.detectEngagementPatterns(userBehavior);
    patterns.push(...engagementPatterns);

    // Store detected patterns
    this.detectedPatterns.set(userId, patterns);

    this.emit('patterns:detected', { userId, count: patterns.length });

    return patterns;
  }

  private detectTemporalPatterns(behavior: UserBehaviorData[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Analyze activity by hour of day
    const hourlyActivity = new Map<number, number>();

    for (const event of behavior) {
      const hour = event.timestamp.getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    }

    // Find peak activity hours
    const sortedHours = Array.from(hourlyActivity.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedHours.length > 0) {
      const [peakHour, count] = sortedHours[0];
      const totalEvents = behavior.length;
      const confidence = count / totalEvents;

      if (count >= this.MIN_PATTERN_OCCURRENCES && confidence > 0.2) {
        patterns.push({
          patternId: `pattern_temporal_${Date.now()}`,
          type: 'temporal',
          description: `Most active during ${this.getTimeOfDay(peakHour)} (${peakHour}:00)`,
          confidence,
          occurrences: count,
          firstDetected: behavior[0].timestamp,
          lastDetected: behavior[behavior.length - 1].timestamp,
          metadata: { peakHour, timeOfDay: this.getTimeOfDay(peakHour) },
        });
      }
    }

    // Analyze day of week patterns
    const dayActivity = new Map<number, number>();

    for (const event of behavior) {
      const day = event.timestamp.getDay();
      dayActivity.set(day, (dayActivity.get(day) || 0) + 1);
    }

    const sortedDays = Array.from(dayActivity.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedDays.length > 0) {
      const [peakDay, count] = sortedDays[0];
      const confidence = count / behavior.length;

      if (count >= this.MIN_PATTERN_OCCURRENCES && confidence > 0.15) {
        patterns.push({
          patternId: `pattern_day_${Date.now()}`,
          type: 'temporal',
          description: `Most active on ${this.getDayName(peakDay)}s`,
          confidence,
          occurrences: count,
          firstDetected: behavior[0].timestamp,
          lastDetected: behavior[behavior.length - 1].timestamp,
          metadata: { peakDay, dayName: this.getDayName(peakDay) },
        });
      }
    }

    return patterns;
  }

  private detectBehavioralPatterns(behavior: UserBehaviorData[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Detect streaks
    const streaks = this.calculateStreaks(behavior);
    if (streaks.currentStreak >= 7) {
      patterns.push({
        patternId: `pattern_streak_${Date.now()}`,
        type: 'behavioral',
        description: `Consistent ${streaks.currentStreak}-day activity streak`,
        confidence: 0.9,
        occurrences: streaks.currentStreak,
        firstDetected: behavior[0].timestamp,
        lastDetected: behavior[behavior.length - 1].timestamp,
        metadata: { currentStreak: streaks.currentStreak, longestStreak: streaks.longestStreak },
      });
    }

    // Detect goal completion patterns
    const completionEvents = behavior.filter(e => e.eventType === 'goal_completed');
    if (completionEvents.length >= 3) {
      const avgTimeBetweenCompletions = this.calculateAverageTimeBetween(completionEvents);

      patterns.push({
        patternId: `pattern_completion_${Date.now()}`,
        type: 'behavioral',
        description: `Completes goals approximately every ${Math.round(avgTimeBetweenCompletions)} days`,
        confidence: 0.75,
        occurrences: completionEvents.length,
        firstDetected: completionEvents[0].timestamp,
        lastDetected: completionEvents[completionEvents.length - 1].timestamp,
        metadata: { avgDaysBetween: avgTimeBetweenCompletions },
      });
    }

    return patterns;
  }

  private detectEngagementPatterns(behavior: UserBehaviorData[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Calculate engagement metrics
    const last30Days = behavior.filter(e => {
      const daysDiff = (Date.now() - e.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    if (last30Days.length >= 20) {
      patterns.push({
        patternId: `pattern_high_engagement_${Date.now()}`,
        type: 'engagement',
        description: 'Highly engaged - active most days of the month',
        confidence: 0.85,
        occurrences: last30Days.length,
        firstDetected: last30Days[0].timestamp,
        lastDetected: last30Days[last30Days.length - 1].timestamp,
        metadata: { activeDaysLast30: last30Days.length },
      });
    }

    return patterns;
  }

  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================

  async detectAnomalies(userId: string, metricName: string, values: number[]): Promise<Anomaly[]> {
    if (values.length < 7) {
      return []; // Need minimum data
    }

    const anomalies: Anomaly[] = [];

    // Calculate statistics
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect outliers using z-score
    for (let i = 0; i < values.length; i++) {
      const zScore = Math.abs((values[i] - mean) / stdDev);

      if (zScore > this.ANOMALY_THRESHOLD) {
        let type: Anomaly['type'] = 'deviation';
        let severity: Anomaly['severity'] = 'low';

        if (values[i] < mean * 0.5) {
          type = 'drop_off';
          severity = 'high';
        } else if (values[i] > mean * 2) {
          type = 'spike';
          severity = 'medium';
        }

        anomalies.push({
          anomalyId: `anomaly_${Date.now()}_${i}`,
          type,
          description: `Unusual ${metricName}: ${values[i].toFixed(2)} (expected ~${mean.toFixed(2)})`,
          severity,
          detectedAt: new Date(),
          expectedValue: mean,
          actualValue: values[i],
          deviation: zScore,
        });
      }
    }

    // Detect sudden changes
    for (let i = 1; i < values.length; i++) {
      const change = Math.abs(values[i] - values[i - 1]);
      const percentChange = change / Math.max(values[i - 1], 1);

      if (percentChange > 0.5 && change > stdDev * 2) {
        anomalies.push({
          anomalyId: `anomaly_change_${Date.now()}_${i}`,
          type: 'unusual_activity',
          description: `Sudden ${percentChange > 0 ? 'increase' : 'decrease'} in ${metricName}`,
          severity: percentChange > 0.8 ? 'high' : 'medium',
          detectedAt: new Date(),
          expectedValue: values[i - 1],
          actualValue: values[i],
          deviation: percentChange,
        });
      }
    }

    this.detectedAnomalies.set(userId, anomalies);
    this.emit('anomalies:detected', { userId, count: anomalies.length });

    return anomalies;
  }

  // ============================================================================
  // TREND ANALYSIS
  // ============================================================================

  async analyzeTrends(
    metricName: string,
    dataPoints: Array<{ timestamp: Date; value: number }>
  ): Promise<Trend> {
    if (dataPoints.length < this.TREND_MIN_DATAPOINTS) {
      throw new Error('Insufficient data for trend analysis');
    }

    // Sort by timestamp
    dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate linear regression
    const n = dataPoints.length;
    const x = dataPoints.map((_, i) => i);
    const y = dataPoints.map(d => d.value);

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared (confidence)
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssResidual = y.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    // Determine direction
    let direction: Trend['direction'];
    if (Math.abs(slope) < 0.01) {
      direction = 'stable';
    } else {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Generate forecast
    const forecast = this.generateForecast(slope, intercept, dataPoints.length, 7);

    return {
      metricName,
      direction,
      rate: slope,
      confidence: Math.max(0, Math.min(1, rSquared)),
      dataPoints,
      forecast,
    };
  }

  private generateForecast(
    slope: number,
    intercept: number,
    startIndex: number,
    periods: number
  ): Array<{ timestamp: Date; predicted: number; confidence: number }> {
    const forecast = [];
    const now = Date.now();

    for (let i = 0; i < periods; i++) {
      const index = startIndex + i;
      const predicted = slope * index + intercept;
      const confidence = Math.max(0.3, 0.9 - i * 0.1); // Confidence decreases over time

      forecast.push({
        timestamp: new Date(now + i * 24 * 60 * 60 * 1000), // Next days
        predicted: Math.max(0, predicted),
        confidence,
      });
    }

    return forecast;
  }

  // ============================================================================
  // INSIGHT GENERATION
  // ============================================================================

  async generateInsights(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Generate insights from patterns
    const patterns = await this.detectPatterns(userId);
    for (const pattern of patterns) {
      insights.push(this.createInsightFromPattern(userId, pattern));
    }

    // Generate insights from anomalies
    const anomalies = this.detectedAnomalies.get(userId) || [];
    for (const anomaly of anomalies) {
      if (anomaly.severity !== 'low') {
        insights.push(this.createInsightFromAnomaly(userId, anomaly));
      }
    }

    // Score and prioritize insights
    insights.sort((a, b) => b.score - a.score);

    this.insights.set(userId, insights);
    this.emit('insights:generated', { userId, count: insights.length });

    return insights.slice(0, 10); // Top 10 insights
  }

  private createInsightFromPattern(userId: string, pattern: Pattern): Insight {
    const recommendations: string[] = [];

    if (pattern.type === 'temporal' && pattern.metadata?.peakHour) {
      recommendations.push(`Schedule important tasks during your peak hours`);
      recommendations.push(`Set reminders for ${this.getTimeOfDay(pattern.metadata.peakHour)}`);
    }

    if (pattern.type === 'behavioral' && pattern.description.includes('streak')) {
      recommendations.push(`Keep the momentum going!`);
      recommendations.push(`Set a new streak goal`);
    }

    return {
      insightId: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'pattern',
      title: 'Pattern Detected',
      description: pattern.description,
      score: Math.round(pattern.confidence * 100),
      actionable: recommendations.length > 0,
      recommendations,
      createdAt: new Date(),
      metadata: { patternId: pattern.patternId, ...pattern.metadata },
    };
  }

  private createInsightFromAnomaly(userId: string, anomaly: Anomaly): Insight {
    const recommendations: string[] = [];

    if (anomaly.type === 'drop_off') {
      recommendations.push('Review your current goals and adjust if needed');
      recommendations.push('Consider breaking goals into smaller steps');
    } else if (anomaly.type === 'spike') {
      recommendations.push('Great momentum! Keep it up');
    }

    const score = anomaly.severity === 'high' ? 90 : anomaly.severity === 'medium' ? 70 : 50;

    return {
      insightId: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'anomaly',
      title: 'Unusual Activity Detected',
      description: anomaly.description,
      score,
      actionable: true,
      recommendations,
      createdAt: new Date(),
      metadata: { anomalyId: anomaly.anomalyId, severity: anomaly.severity },
    };
  }

  // ============================================================================
  // REPORTS
  // ============================================================================

  async generateWeeklyReport(userId: string): Promise<WeeklyReport> {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const behavior = this.behaviorData.get(userId) || [];
    const weekBehavior = behavior.filter(e => e.timestamp >= weekStart);

    const uniqueDays = new Set(weekBehavior.map(e => e.timestamp.toDateString())).size;
    const goalsProgress = this.calculateGoalsProgress(weekBehavior);
    const habitsCompleted = weekBehavior.filter(e => e.eventType === 'habit_completed').length;
    const streakDays = this.calculateStreaks(behavior).currentStreak;

    const highlights = this.generateHighlights(weekBehavior);
    const insights = await this.generateInsights(userId);
    const trends = await this.generateTrends(userId, weekBehavior);

    return {
      userId,
      weekStart,
      weekEnd: now,
      summary: {
        totalActiveDays: uniqueDays,
        goalsProgress,
        habitsCompleted,
        streakDays,
      },
      highlights,
      insights: insights.slice(0, 5),
      trends: trends.slice(0, 3),
      recommendations: this.generateRecommendations(insights, trends),
    };
  }

  async generateMonthlyReport(userId: string): Promise<MonthlyReport> {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const behavior = this.behaviorData.get(userId) || [];
    const monthBehavior = behavior.filter(e => e.timestamp >= monthStart && e.timestamp <= monthEnd);

    const uniqueDays = new Set(monthBehavior.map(e => e.timestamp.toDateString())).size;
    const goalsCompleted = monthBehavior.filter(e => e.eventType === 'goal_completed').length;
    const habitsFormed = this.calculateHabitsFormed(monthBehavior);
    const longestStreak = this.calculateStreaks(behavior).longestStreak;
    const totalProgress = this.calculateGoalsProgress(monthBehavior);

    const insights = await this.generateInsights(userId);
    const trends = await this.generateTrends(userId, monthBehavior);

    // Compare with previous month
    const prevMonthStart = new Date(year, month - 1, 1);
    const prevMonthEnd = new Date(year, month, 0);
    const prevMonthBehavior = behavior.filter(
      e => e.timestamp >= prevMonthStart && e.timestamp <= prevMonthEnd
    );

    const prevActiveDays = new Set(prevMonthBehavior.map(e => e.timestamp.toDateString())).size;
    const prevGoalsCompleted = prevMonthBehavior.filter(e => e.eventType === 'goal_completed').length;
    const prevProgress = this.calculateGoalsProgress(prevMonthBehavior);

    return {
      userId,
      month,
      year,
      summary: {
        totalActiveDays: uniqueDays,
        goalsCompleted,
        habitsFormed,
        longestStreak,
        totalProgress,
      },
      achievements: this.generateAchievements(monthBehavior),
      insights: insights.slice(0, 5),
      trends: trends.slice(0, 3),
      comparisonToPreviousMonth: {
        activeDaysChange: uniqueDays - prevActiveDays,
        goalsChange: goalsCompleted - prevGoalsCompleted,
        progressChange: totalProgress - prevProgress,
      },
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  private calculateStreaks(behavior: UserBehaviorData[]): { currentStreak: number; longestStreak: number } {
    if (behavior.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const uniqueDays = Array.from(new Set(behavior.map(e => e.timestamp.toDateString())))
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDays.length; i++) {
      const daysDiff = (uniqueDays[i - 1].getTime() - uniqueDays[i].getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff === 1) {
        tempStreak++;
        if (i === 1) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { currentStreak, longestStreak };
  }

  private calculateAverageTimeBetween(events: UserBehaviorData[]): number {
    if (events.length < 2) return 0;

    let totalDays = 0;

    for (let i = 1; i < events.length; i++) {
      const days = (events[i].timestamp.getTime() - events[i - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24);
      totalDays += days;
    }

    return totalDays / (events.length - 1);
  }

  private calculateGoalsProgress(behavior: UserBehaviorData[]): number {
    const progressEvents = behavior.filter(e => e.eventType === 'goal_progress');
    if (progressEvents.length === 0) return 0;

    const totalProgress = progressEvents.reduce((sum, e) => {
      return sum + (e.metadata?.progress || 0);
    }, 0);

    return Math.round(totalProgress / progressEvents.length);
  }

  private calculateHabitsFormed(behavior: UserBehaviorData[]): number {
    // A habit is "formed" if completed 21+ times
    const habitCounts = new Map<string, number>();

    for (const event of behavior) {
      if (event.eventType === 'habit_completed' && event.metadata?.habitId) {
        const habitId = event.metadata.habitId;
        habitCounts.set(habitId, (habitCounts.get(habitId) || 0) + 1);
      }
    }

    return Array.from(habitCounts.values()).filter(count => count >= 21).length;
  }

  private generateHighlights(behavior: UserBehaviorData[]): string[] {
    const highlights: string[] = [];

    const completions = behavior.filter(e => e.eventType === 'goal_completed');
    if (completions.length > 0) {
      highlights.push(`Completed ${completions.length} goal${completions.length > 1 ? 's' : ''}!`);
    }

    const streaks = this.calculateStreaks(behavior);
    if (streaks.currentStreak >= 7) {
      highlights.push(`${streaks.currentStreak}-day activity streak!`);
    }

    return highlights;
  }

  private async generateTrends(userId: string, behavior: UserBehaviorData[]): Promise<Trend[]> {
    // Group behavior by day and count events
    const dailyCounts = new Map<string, number>();

    for (const event of behavior) {
      const dateKey = event.timestamp.toDateString();
      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
    }

    const dataPoints = Array.from(dailyCounts.entries()).map(([date, count]) => ({
      timestamp: new Date(date),
      value: count,
    }));

    if (dataPoints.length < this.TREND_MIN_DATAPOINTS) {
      return [];
    }

    const trend = await this.analyzeTrends('Daily Activity', dataPoints);
    return [trend];
  }

  private generateRecommendations(insights: Insight[], trends: Trend[]): string[] {
    const recommendations = new Set<string>();

    for (const insight of insights.slice(0, 3)) {
      if (insight.recommendations) {
        insight.recommendations.forEach(rec => recommendations.add(rec));
      }
    }

    for (const trend of trends) {
      if (trend.direction === 'decreasing') {
        recommendations.add('Consider adjusting your goals to maintain momentum');
      } else if (trend.direction === 'increasing') {
        recommendations.add('Great progress! Keep challenging yourself');
      }
    }

    return Array.from(recommendations).slice(0, 5);
  }

  private generateAchievements(behavior: UserBehaviorData[]): string[] {
    const achievements: string[] = [];

    const goalsCompleted = behavior.filter(e => e.eventType === 'goal_completed').length;
    if (goalsCompleted >= 5) {
      achievements.push('Goal Crusher - Completed 5+ goals this month');
    }

    const streaks = this.calculateStreaks(behavior);
    if (streaks.longestStreak >= 30) {
      achievements.push('Consistency Champion - 30-day streak');
    }

    return achievements;
  }

  // ============================================================================
  // DATA MANAGEMENT
  // ============================================================================

  addBehaviorData(userId: string, event: UserBehaviorData): void {
    const userBehavior = this.behaviorData.get(userId) || [];
    userBehavior.push(event);
    this.behaviorData.set(userId, userBehavior);

    // Limit stored data
    if (userBehavior.length > 1000) {
      this.behaviorData.set(userId, userBehavior.slice(-1000));
    }
  }

  clearUserData(userId: string): void {
    this.behaviorData.delete(userId);
    this.detectedPatterns.delete(userId);
    this.detectedAnomalies.delete(userId);
    this.insights.delete(userId);
  }
}

export const insightGenerator = InsightGenerator.getInstance();
