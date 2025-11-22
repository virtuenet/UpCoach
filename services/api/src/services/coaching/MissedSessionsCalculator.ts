/**
 * Missed Sessions Calculator Service
 * Calculates and analyzes missed coaching sessions with advanced insights
 * @author UpCoach Architecture Team
 */

import { Op } from 'sequelize';
import { CoachMemory } from '../../models/coaching/CoachMemory';
import { User } from '../../models/User';
import { Goal } from '../../models/Goal';
import { logger } from '../../utils/logger';
import { UnifiedCacheService } from '../cache/UnifiedCacheService';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, format, differenceInDays } from 'date-fns';

interface MissedSessionData {
  userId: string;
  totalMissedSessions: number;
  consecutiveMissedSessions: number;
  missedSessionsThisWeek: number;
  missedSessionsThisMonth: number;
  longestMissedStreak: number;
  averageGapBetweenSessions: number;
  expectedFrequency: number; // sessions per week
  actualFrequency: number;
  adherenceRate: number; // percentage
  lastSessionDate: Date | null;
  nextExpectedSession: Date | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  missedSessionPattern: {
    dayOfWeek: Record<string, number>;
    timeOfDay: Record<string, number>;
    reasons: Record<string, number>;
  };
  recommendations: string[];
  insights: string[];
}

interface SessionExpectation {
  userId: string;
  expectedSessionsPerWeek: number;
  preferredDays: string[];
  preferredTimes: string[];
  customSchedule?: Array<{
    dayOfWeek: number;
    timeSlot: string;
  }>;
}

interface MissedSessionAnalytics {
  summary: {
    totalUsers: number;
    usersWithMissedSessions: number;
    averageMissedSessions: number;
    highRiskUsers: number;
    totalMissedSessions: number;
  };
  trends: {
    missedSessionsByDay: Record<string, number>;
    missedSessionsByHour: Record<string, number>;
    missedSessionsByWeek: Array<{ week: string; count: number }>;
  };
  patterns: {
    commonMissedDays: string[];
    commonMissedTimes: string[];
    seasonalPatterns: Record<string, number>;
  };
  userSegments: {
    highEngagement: number;
    mediumEngagement: number;
    lowEngagement: number;
    atRisk: number;
  };
}

export class MissedSessionsCalculator {
  private cache: UnifiedCacheService;
  private defaultExpectedFrequency = 3; // 3 sessions per week default

  constructor() {
    this.cache = new UnifiedCacheService();
  }

  /**
   * Calculate comprehensive missed sessions data for a user
   */
  async calculateMissedSessions(userId: string): Promise<MissedSessionData> {
    const cacheKey = `missed_sessions:${userId}`;
    let cached = await this.cache.get(cacheKey);
    if (cached) return cached as MissedSessionData;

    try {
      // Get user's coaching sessions from last 90 days
      const sessions = await CoachMemory.findAll({
        where: {
          userId,
          conversationDate: {
            [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['conversationDate', 'ASC']]
      });

      // Get user preferences and expected frequency
      const sessionExpectation = await this.getUserSessionExpectation(userId);
      const expectedFrequency = sessionExpectation.expectedSessionsPerWeek;

      // Calculate basic metrics
      const totalExpectedSessions = this.calculateExpectedSessions(90, expectedFrequency);
      const totalActualSessions = sessions.length;
      const totalMissedSessions = Math.max(0, totalExpectedSessions - totalActualSessions);

      // Calculate consecutive missed sessions
      const consecutiveMissedSessions = await this.calculateConsecutiveMissedSessions(userId, sessions);

      // Calculate missed sessions this week and month
      const missedSessionsThisWeek = await this.calculateMissedSessionsInPeriod(
        userId,
        startOfWeek(new Date()),
        endOfWeek(new Date()),
        expectedFrequency / 7 // daily expected rate
      );

      const missedSessionsThisMonth = await this.calculateMissedSessionsInPeriod(
        userId,
        startOfMonth(new Date()),
        endOfMonth(new Date()),
        expectedFrequency * 4.33 // weekly to monthly
      );

      // Calculate longest missed streak
      const longestMissedStreak = this.calculateLongestMissedStreak(sessions, expectedFrequency);

      // Calculate session gaps
      const averageGapBetweenSessions = this.calculateAverageGap(sessions);

      // Calculate actual frequency
      const actualFrequency = this.calculateActualFrequency(sessions);

      // Calculate adherence rate
      const adherenceRate = totalExpectedSessions > 0 ?
        (totalActualSessions / totalExpectedSessions) * 100 : 100;

      // Get last session and predict next
      const lastSessionDate = sessions.length > 0 ?
        sessions[sessions.length - 1].conversationDate : null;
      const nextExpectedSession = this.calculateNextExpectedSession(
        lastSessionDate,
        sessionExpectation,
        averageGapBetweenSessions
      );

      // Calculate risk level
      const riskLevel = this.calculateRiskLevel({
        consecutiveMissedSessions,
        adherenceRate,
        longestMissedStreak,
        daysSinceLastSession: lastSessionDate ?
          differenceInDays(new Date(), lastSessionDate) : 30
      });

      // Analyze missed session patterns
      const missedSessionPattern = await this.analyzeMissedSessionPatterns(userId, sessions, expectedFrequency);

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        consecutiveMissedSessions,
        adherenceRate,
        riskLevel,
        averageGapBetweenSessions,
        missedSessionPattern
      });

      // Generate insights
      const insights = this.generateInsights({
        totalMissedSessions,
        consecutiveMissedSessions,
        adherenceRate,
        longestMissedStreak,
        riskLevel,
        actualFrequency,
        expectedFrequency
      });

      const missedSessionData: MissedSessionData = {
        userId,
        totalMissedSessions,
        consecutiveMissedSessions,
        missedSessionsThisWeek,
        missedSessionsThisMonth,
        longestMissedStreak,
        averageGapBetweenSessions,
        expectedFrequency,
        actualFrequency,
        adherenceRate,
        lastSessionDate,
        nextExpectedSession,
        riskLevel,
        missedSessionPattern,
        recommendations,
        insights
      };

      // Cache for 1 hour
      await this.cache.set(cacheKey, missedSessionData, { ttl: 3600 });

      return missedSessionData;

    } catch (error) {
      logger.error('Error calculating missed sessions:', error);
      throw error;
    }
  }

  /**
   * Get missed sessions analytics across all users
   */
  async getMissedSessionsAnalytics(): Promise<MissedSessionAnalytics> {
    const cacheKey = 'missed_sessions:analytics';
    let cached = await this.cache.get(cacheKey);
    if (cached) return cached as MissedSessionAnalytics;

    try {
      // Get all users who should have coaching sessions
      const users = await User.findAll({
        where: {
          isActive: true,
          // Add conditions for users who should have coaching sessions
        }
      });

      let totalMissedSessions = 0;
      let usersWithMissedSessions = 0;
      let highRiskUsers = 0;
      const missedSessionsByDay: Record<string, number> = {};
      const missedSessionsByHour: Record<string, number> = {};
      const userEngagementCounts = { high: 0, medium: 0, low: 0, atRisk: 0 };

      // Calculate metrics for each user
      for (const user of users) {
        const missedData = await this.calculateMissedSessions(user.id);

        totalMissedSessions += missedData.totalMissedSessions;

        if (missedData.totalMissedSessions > 0) {
          usersWithMissedSessions++;
        }

        if (missedData.riskLevel === 'high' || missedData.riskLevel === 'critical') {
          highRiskUsers++;
        }

        // Categorize user engagement
        if (missedData.riskLevel === 'critical') {
          userEngagementCounts.atRisk++;
        } else if (missedData.adherenceRate >= 80) {
          userEngagementCounts.high++;
        } else if (missedData.adherenceRate >= 60) {
          userEngagementCounts.medium++;
        } else {
          userEngagementCounts.low++;
        }

        // Aggregate pattern data
        Object.entries(missedData.missedSessionPattern.dayOfWeek).forEach(([day, count]) => {
          missedSessionsByDay[day] = (missedSessionsByDay[day] || 0) + count;
        });

        Object.entries(missedData.missedSessionPattern.timeOfDay).forEach(([hour, count]) => {
          missedSessionsByHour[hour] = (missedSessionsByHour[hour] || 0) + count;
        });
      }

      // Calculate weekly trends
      const missedSessionsByWeek = await this.calculateWeeklyTrends();

      // Identify common patterns
      const commonMissedDays = Object.entries(missedSessionsByDay)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([day]) => day);

      const commonMissedTimes = Object.entries(missedSessionsByHour)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);

      const analytics: MissedSessionAnalytics = {
        summary: {
          totalUsers: users.length,
          usersWithMissedSessions,
          averageMissedSessions: users.length > 0 ? totalMissedSessions / users.length : 0,
          highRiskUsers,
          totalMissedSessions
        },
        trends: {
          missedSessionsByDay,
          missedSessionsByHour,
          missedSessionsByWeek
        },
        patterns: {
          commonMissedDays,
          commonMissedTimes,
          seasonalPatterns: await this.calculateSeasonalPatterns()
        },
        userSegments: {
          highEngagement: userEngagementCounts.high,
          mediumEngagement: userEngagementCounts.medium,
          lowEngagement: userEngagementCounts.low,
          atRisk: userEngagementCounts.atRisk
        }
      };

      // Cache for 30 minutes
      await this.cache.set(cacheKey, analytics, { ttl: 1800 });

      return analytics;

    } catch (error) {
      logger.error('Error getting missed sessions analytics:', error);
      throw error;
    }
  }

  /**
   * Set user session expectations
   */
  async setUserSessionExpectation(userId: string, expectation: SessionExpectation): Promise<void> {
    const cacheKey = `session_expectation:${userId}`;
    await this.cache.set(cacheKey, expectation, { ttl: 86400 * 7 }); // Cache for 1 week
  }

  /**
   * Predict users at risk of missing sessions
   */
  async predictAtRiskUsers(): Promise<Array<{
    userId: string;
    riskScore: number;
    riskFactors: string[];
    recommendedActions: string[];
  }>> {
    try {
      const users = await User.findAll({
        where: { isActive: true }
      });

      const atRiskUsers = [];

      for (const user of users) {
        const missedData = await this.calculateMissedSessions(user.id);

        // Calculate risk score
        const riskScore = this.calculateRiskScore(missedData);

        if (riskScore > 0.6) { // High risk threshold
          const riskFactors = this.identifyRiskFactors(missedData);
          const recommendedActions = this.generateRiskMitigationActions(missedData);

          atRiskUsers.push({
            userId: user.id,
            riskScore,
            riskFactors,
            recommendedActions
          });
        }
      }

      return atRiskUsers.sort((a, b) => b.riskScore - a.riskScore);

    } catch (error) {
      logger.error('Error predicting at-risk users:', error);
      throw error;
    }
  }

  // ============= Private Helper Methods =============

  private async getUserSessionExpectation(userId: string): Promise<SessionExpectation> {
    const cacheKey = `session_expectation:${userId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return cached as SessionExpectation;
    }

    // Default expectation
    return {
      userId,
      expectedSessionsPerWeek: this.defaultExpectedFrequency,
      preferredDays: ['Monday', 'Wednesday', 'Friday'],
      preferredTimes: ['10:00', '14:00', '18:00']
    };
  }

  private calculateExpectedSessions(days: number, sessionsPerWeek: number): number {
    return Math.floor((days / 7) * sessionsPerWeek);
  }

  private async calculateConsecutiveMissedSessions(
    userId: string,
    sessions: CoachMemory[]
  ): Promise<number> {
    if (sessions.length === 0) return 30; // No sessions = 30 missed (arbitrary high number)

    const lastSession = sessions[sessions.length - 1];
    const daysSinceLastSession = differenceInDays(new Date(), lastSession.conversationDate);

    // Assume 1 session every 2-3 days on average
    return Math.floor(daysSinceLastSession / 2.5);
  }

  private async calculateMissedSessionsInPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
    expectedDailyRate: number
  ): Promise<number> {
    const sessions = await CoachMemory.count({
      where: {
        userId,
        conversationDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const daysInPeriod = differenceInDays(endDate, startDate) + 1;
    const expectedSessions = Math.floor(daysInPeriod * expectedDailyRate);

    return Math.max(0, expectedSessions - sessions);
  }

  private calculateLongestMissedStreak(
    sessions: CoachMemory[],
    expectedFrequency: number
  ): number {
    if (sessions.length < 2) return 0;

    const sessionDates = sessions.map(s => new Date(s.conversationDate));
    let longestStreak = 0;
    let currentStreak = 0;
    const expectedGapDays = 7 / expectedFrequency;

    for (let i = 1; i < sessionDates.length; i++) {
      const gapDays = differenceInDays(sessionDates[i], sessionDates[i - 1]);

      if (gapDays > expectedGapDays * 2) { // More than double expected gap
        currentStreak += Math.floor(gapDays / expectedGapDays) - 1;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 0;
      }
    }

    return Math.max(longestStreak, currentStreak);
  }

  private calculateAverageGap(sessions: CoachMemory[]): number {
    if (sessions.length < 2) return 0;

    const gaps = [];
    for (let i = 1; i < sessions.length; i++) {
      const gap = differenceInDays(
        new Date(sessions[i].conversationDate),
        new Date(sessions[i - 1].conversationDate)
      );
      gaps.push(gap);
    }

    return gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  }

  private calculateActualFrequency(sessions: CoachMemory[]): number {
    if (sessions.length < 2) return 0;

    const firstSession = new Date(sessions[0].conversationDate);
    const lastSession = new Date(sessions[sessions.length - 1].conversationDate);
    const totalDays = differenceInDays(lastSession, firstSession);
    const totalWeeks = totalDays / 7;

    return totalWeeks > 0 ? sessions.length / totalWeeks : 0;
  }

  private calculateNextExpectedSession(
    lastSessionDate: Date | null,
    expectation: SessionExpectation,
    averageGap: number
  ): Date | null {
    if (!lastSessionDate) return null;

    const expectedGapDays = 7 / expectation.expectedSessionsPerWeek;
    const actualGapDays = averageGap > 0 ? averageGap : expectedGapDays;

    return addDays(lastSessionDate, Math.round(actualGapDays));
  }

  private calculateRiskLevel(metrics: {
    consecutiveMissedSessions: number;
    adherenceRate: number;
    longestMissedStreak: number;
    daysSinceLastSession: number;
  }): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    // Factor in consecutive missed sessions
    if (metrics.consecutiveMissedSessions > 10) riskScore += 3;
    else if (metrics.consecutiveMissedSessions > 5) riskScore += 2;
    else if (metrics.consecutiveMissedSessions > 2) riskScore += 1;

    // Factor in adherence rate
    if (metrics.adherenceRate < 30) riskScore += 3;
    else if (metrics.adherenceRate < 50) riskScore += 2;
    else if (metrics.adherenceRate < 70) riskScore += 1;

    // Factor in longest streak
    if (metrics.longestMissedStreak > 15) riskScore += 2;
    else if (metrics.longestMissedStreak > 10) riskScore += 1;

    // Factor in days since last session
    if (metrics.daysSinceLastSession > 14) riskScore += 2;
    else if (metrics.daysSinceLastSession > 7) riskScore += 1;

    if (riskScore >= 7) return 'critical';
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private async analyzeMissedSessionPatterns(
    userId: string,
    sessions: CoachMemory[],
    expectedFrequency: number
  ): Promise<{
    dayOfWeek: Record<string, number>;
    timeOfDay: Record<string, number>;
    reasons: Record<string, number>;
  }> {
    // Generate expected session dates
    const expectedDates = this.generateExpectedSessionDates(sessions, expectedFrequency);
    const actualDates = sessions.map(s => new Date(s.conversationDate));

    // Find missed dates
    const missedDates = expectedDates.filter(expected =>
      !actualDates.some(actual =>
        Math.abs(differenceInDays(actual, expected)) <= 1
      )
    );

    // Analyze patterns
    const dayOfWeek: Record<string, number> = {};
    const timeOfDay: Record<string, number> = {};
    const reasons: Record<string, number> = {
      'scheduling_conflict': 0,
      'low_motivation': 0,
      'technical_issues': 0,
      'time_constraint': 0,
      'other': 0
    };

    missedDates.forEach(date => {
      const dayName = format(date, 'EEEE');
      const hour = date.getHours().toString();

      dayOfWeek[dayName] = (dayOfWeek[dayName] || 0) + 1;
      timeOfDay[hour] = (timeOfDay[hour] || 0) + 1;

      // Simulate reason analysis (in real implementation, this would come from user feedback)
      const randomReason = Object.keys(reasons)[Math.floor(Math.random() * Object.keys(reasons).length)];
      reasons[randomReason]++;
    });

    return { dayOfWeek, timeOfDay, reasons };
  }

  private generateExpectedSessionDates(
    sessions: CoachMemory[],
    expectedFrequency: number
  ): Date[] {
    if (sessions.length === 0) return [];

    const startDate = new Date(sessions[0].conversationDate);
    const endDate = new Date();
    const expectedDates: Date[] = [];
    const intervalDays = 7 / expectedFrequency;

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      expectedDates.push(new Date(currentDate));
      currentDate = addDays(currentDate, intervalDays);
    }

    return expectedDates;
  }

  private generateRecommendations(data: {
    consecutiveMissedSessions: number;
    adherenceRate: number;
    riskLevel: string;
    averageGapBetweenSessions: number;
    missedSessionPattern: unknown;
  }): string[] {
    const recommendations: string[] = [];

    if (data.riskLevel === 'critical') {
      recommendations.push('Immediate intervention required - schedule emergency coaching session');
      recommendations.push('Reduce session frequency temporarily to rebuild habit');
    } else if (data.riskLevel === 'high') {
      recommendations.push('Schedule check-in call to understand barriers');
      recommendations.push('Consider flexible scheduling options');
    }

    if (data.adherenceRate < 50) {
      recommendations.push('Review and adjust coaching schedule to better fit lifestyle');
      recommendations.push('Set smaller, more achievable session goals');
    }

    if (data.consecutiveMissedSessions > 5) {
      recommendations.push('Break the missing pattern with a brief, low-pressure session');
      recommendations.push('Send motivational reminder messages');
    }

    if (data.averageGapBetweenSessions > 7) {
      recommendations.push('Increase session frequency with shorter duration');
      recommendations.push('Add automated reminders 24 hours before sessions');
    }

    // Pattern-based recommendations
    const topMissedDay = Object.entries(data.missedSessionPattern.dayOfWeek)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];

    if (topMissedDay && topMissedDay[1] > 2) {
      recommendations.push(`Avoid scheduling sessions on ${topMissedDay[0]}s`);
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  private generateInsights(data: {
    totalMissedSessions: number;
    consecutiveMissedSessions: number;
    adherenceRate: number;
    longestMissedStreak: number;
    riskLevel: string;
    actualFrequency: number;
    expectedFrequency: number;
  }): string[] {
    const insights: string[] = [];

    if (data.adherenceRate >= 80) {
      insights.push('Excellent coaching consistency - maintain current schedule');
    } else if (data.adherenceRate >= 60) {
      insights.push('Good coaching attendance with room for improvement');
    } else {
      insights.push('Coaching consistency needs significant improvement');
    }

    if (data.actualFrequency > data.expectedFrequency * 1.2) {
      insights.push('User is exceeding expected session frequency - highly engaged');
    } else if (data.actualFrequency < data.expectedFrequency * 0.5) {
      insights.push('User is significantly below expected session frequency');
    }

    if (data.longestMissedStreak > 14) {
      insights.push('Extended periods without coaching may impact goal achievement');
    }

    if (data.consecutiveMissedSessions === 0) {
      insights.push('No recent missed sessions - great momentum');
    } else if (data.consecutiveMissedSessions > 7) {
      insights.push('Current missing streak requires immediate attention');
    }

    const efficiencyRatio = data.expectedFrequency > 0 ?
      data.actualFrequency / data.expectedFrequency : 0;

    if (efficiencyRatio > 1.1) {
      insights.push('User shows strong intrinsic motivation for coaching');
    } else if (efficiencyRatio < 0.7) {
      insights.push('User may benefit from motivation and engagement support');
    }

    return insights;
  }

  private calculateRiskScore(missedData: MissedSessionData): number {
    let score = 0;

    // Adherence rate factor (40% weight)
    score += (1 - missedData.adherenceRate / 100) * 0.4;

    // Consecutive missed sessions factor (30% weight)
    score += Math.min(1, missedData.consecutiveMissedSessions / 10) * 0.3;

    // Time since last session factor (20% weight)
    const daysSinceLastSession = missedData.lastSessionDate ?
      differenceInDays(new Date(), missedData.lastSessionDate) : 30;
    score += Math.min(1, daysSinceLastSession / 14) * 0.2;

    // Longest streak factor (10% weight)
    score += Math.min(1, missedData.longestMissedStreak / 20) * 0.1;

    return Math.min(1, score);
  }

  private identifyRiskFactors(missedData: MissedSessionData): string[] {
    const factors: string[] = [];

    if (missedData.adherenceRate < 50) {
      factors.push('Very low session adherence rate');
    }

    if (missedData.consecutiveMissedSessions > 7) {
      factors.push('Extended period without coaching sessions');
    }

    const daysSinceLastSession = missedData.lastSessionDate ?
      differenceInDays(new Date(), missedData.lastSessionDate) : 30;

    if (daysSinceLastSession > 10) {
      factors.push('Long gap since last session');
    }

    if (missedData.longestMissedStreak > 15) {
      factors.push('History of extended missed periods');
    }

    if (missedData.actualFrequency < missedData.expectedFrequency * 0.5) {
      factors.push('Significantly below expected engagement level');
    }

    return factors;
  }

  private generateRiskMitigationActions(missedData: MissedSessionData): string[] {
    const actions: string[] = [];

    if (missedData.riskLevel === 'critical') {
      actions.push('Immediate outreach and support call');
      actions.push('Temporarily reduce session frequency');
      actions.push('Identify and address specific barriers');
    } else if (missedData.riskLevel === 'high') {
      actions.push('Send personalized re-engagement message');
      actions.push('Offer flexible scheduling options');
      actions.push('Provide motivation and accountability support');
    }

    actions.push('Set up automated reminder system');
    actions.push('Review and adjust coaching approach');

    return actions;
  }

  private async calculateWeeklyTrends(): Promise<Array<{ week: string; count: number }>> {
    // Placeholder implementation - would aggregate actual data
    const weeks: Array<{ week: string; count: number }> = [];

    for (let i = 11; i >= 0; i--) {
      const weekStart = addDays(startOfWeek(new Date()), -i * 7);
      const weekEnd = endOfWeek(weekStart);

      // In real implementation, would count actual missed sessions
      const count = Math.floor(Math.random() * 50) + 10; // Simulated data

      weeks.push({
        week: format(weekStart, 'MMM dd'),
        count
      });
    }

    return weeks;
  }

  private async calculateSeasonalPatterns(): Promise<Record<string, number>> {
    // Placeholder implementation for seasonal analysis
    return {
      'Winter': 1.2, // 20% more missed sessions in winter
      'Spring': 0.9,
      'Summer': 0.8, // 20% fewer missed sessions in summer
      'Fall': 1.0
    };
  }
}

// Export singleton instance
export const missedSessionsCalculator = new MissedSessionsCalculator();