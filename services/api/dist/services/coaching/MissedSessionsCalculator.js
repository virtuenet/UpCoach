"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.missedSessionsCalculator = exports.MissedSessionsCalculator = void 0;
const sequelize_1 = require("sequelize");
const CoachMemory_1 = require("../../models/coaching/CoachMemory");
const User_1 = require("../../models/User");
const logger_1 = require("../../utils/logger");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
const date_fns_1 = require("date-fns");
class MissedSessionsCalculator {
    cache;
    defaultExpectedFrequency = 3;
    constructor() {
        this.cache = new UnifiedCacheService_1.UnifiedCacheService();
    }
    async calculateMissedSessions(userId) {
        const cacheKey = `missed_sessions:${userId}`;
        let cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        try {
            const sessions = await CoachMemory_1.CoachMemory.findAll({
                where: {
                    userId,
                    conversationDate: {
                        [sequelize_1.Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                    }
                },
                order: [['conversationDate', 'ASC']]
            });
            const sessionExpectation = await this.getUserSessionExpectation(userId);
            const expectedFrequency = sessionExpectation.expectedSessionsPerWeek;
            const totalExpectedSessions = this.calculateExpectedSessions(90, expectedFrequency);
            const totalActualSessions = sessions.length;
            const totalMissedSessions = Math.max(0, totalExpectedSessions - totalActualSessions);
            const consecutiveMissedSessions = await this.calculateConsecutiveMissedSessions(userId, sessions);
            const missedSessionsThisWeek = await this.calculateMissedSessionsInPeriod(userId, (0, date_fns_1.startOfWeek)(new Date()), (0, date_fns_1.endOfWeek)(new Date()), expectedFrequency / 7);
            const missedSessionsThisMonth = await this.calculateMissedSessionsInPeriod(userId, (0, date_fns_1.startOfMonth)(new Date()), (0, date_fns_1.endOfMonth)(new Date()), expectedFrequency * 4.33);
            const longestMissedStreak = this.calculateLongestMissedStreak(sessions, expectedFrequency);
            const averageGapBetweenSessions = this.calculateAverageGap(sessions);
            const actualFrequency = this.calculateActualFrequency(sessions);
            const adherenceRate = totalExpectedSessions > 0 ?
                (totalActualSessions / totalExpectedSessions) * 100 : 100;
            const lastSessionDate = sessions.length > 0 ?
                sessions[sessions.length - 1].conversationDate : null;
            const nextExpectedSession = this.calculateNextExpectedSession(lastSessionDate, sessionExpectation, averageGapBetweenSessions);
            const riskLevel = this.calculateRiskLevel({
                consecutiveMissedSessions,
                adherenceRate,
                longestMissedStreak,
                daysSinceLastSession: lastSessionDate ?
                    (0, date_fns_1.differenceInDays)(new Date(), lastSessionDate) : 30
            });
            const missedSessionPattern = await this.analyzeMissedSessionPatterns(userId, sessions, expectedFrequency);
            const recommendations = this.generateRecommendations({
                consecutiveMissedSessions,
                adherenceRate,
                riskLevel,
                averageGapBetweenSessions,
                missedSessionPattern
            });
            const insights = this.generateInsights({
                totalMissedSessions,
                consecutiveMissedSessions,
                adherenceRate,
                longestMissedStreak,
                riskLevel,
                actualFrequency,
                expectedFrequency
            });
            const missedSessionData = {
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
            await this.cache.set(cacheKey, missedSessionData, { ttl: 3600 });
            return missedSessionData;
        }
        catch (error) {
            logger_1.logger.error('Error calculating missed sessions:', error);
            throw error;
        }
    }
    async getMissedSessionsAnalytics() {
        const cacheKey = 'missed_sessions:analytics';
        let cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        try {
            const users = await User_1.User.findAll({
                where: {
                    isActive: true,
                }
            });
            let totalMissedSessions = 0;
            let usersWithMissedSessions = 0;
            let highRiskUsers = 0;
            const missedSessionsByDay = {};
            const missedSessionsByHour = {};
            const userEngagementCounts = { high: 0, medium: 0, low: 0, atRisk: 0 };
            for (const user of users) {
                const missedData = await this.calculateMissedSessions(user.id);
                totalMissedSessions += missedData.totalMissedSessions;
                if (missedData.totalMissedSessions > 0) {
                    usersWithMissedSessions++;
                }
                if (missedData.riskLevel === 'high' || missedData.riskLevel === 'critical') {
                    highRiskUsers++;
                }
                if (missedData.riskLevel === 'critical') {
                    userEngagementCounts.atRisk++;
                }
                else if (missedData.adherenceRate >= 80) {
                    userEngagementCounts.high++;
                }
                else if (missedData.adherenceRate >= 60) {
                    userEngagementCounts.medium++;
                }
                else {
                    userEngagementCounts.low++;
                }
                Object.entries(missedData.missedSessionPattern.dayOfWeek).forEach(([day, count]) => {
                    missedSessionsByDay[day] = (missedSessionsByDay[day] || 0) + count;
                });
                Object.entries(missedData.missedSessionPattern.timeOfDay).forEach(([hour, count]) => {
                    missedSessionsByHour[hour] = (missedSessionsByHour[hour] || 0) + count;
                });
            }
            const missedSessionsByWeek = await this.calculateWeeklyTrends();
            const commonMissedDays = Object.entries(missedSessionsByDay)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([day]) => day);
            const commonMissedTimes = Object.entries(missedSessionsByHour)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([hour]) => `${hour}:00`);
            const analytics = {
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
            await this.cache.set(cacheKey, analytics, { ttl: 1800 });
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Error getting missed sessions analytics:', error);
            throw error;
        }
    }
    async setUserSessionExpectation(userId, expectation) {
        const cacheKey = `session_expectation:${userId}`;
        await this.cache.set(cacheKey, expectation, { ttl: 86400 * 7 });
    }
    async predictAtRiskUsers() {
        try {
            const users = await User_1.User.findAll({
                where: { isActive: true }
            });
            const atRiskUsers = [];
            for (const user of users) {
                const missedData = await this.calculateMissedSessions(user.id);
                const riskScore = this.calculateRiskScore(missedData);
                if (riskScore > 0.6) {
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
        }
        catch (error) {
            logger_1.logger.error('Error predicting at-risk users:', error);
            throw error;
        }
    }
    async getUserSessionExpectation(userId) {
        const cacheKey = `session_expectation:${userId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        return {
            userId,
            expectedSessionsPerWeek: this.defaultExpectedFrequency,
            preferredDays: ['Monday', 'Wednesday', 'Friday'],
            preferredTimes: ['10:00', '14:00', '18:00']
        };
    }
    calculateExpectedSessions(days, sessionsPerWeek) {
        return Math.floor((days / 7) * sessionsPerWeek);
    }
    async calculateConsecutiveMissedSessions(userId, sessions) {
        if (sessions.length === 0)
            return 30;
        const lastSession = sessions[sessions.length - 1];
        const daysSinceLastSession = (0, date_fns_1.differenceInDays)(new Date(), lastSession.conversationDate);
        return Math.floor(daysSinceLastSession / 2.5);
    }
    async calculateMissedSessionsInPeriod(userId, startDate, endDate, expectedDailyRate) {
        const sessions = await CoachMemory_1.CoachMemory.count({
            where: {
                userId,
                conversationDate: {
                    [sequelize_1.Op.between]: [startDate, endDate]
                }
            }
        });
        const daysInPeriod = (0, date_fns_1.differenceInDays)(endDate, startDate) + 1;
        const expectedSessions = Math.floor(daysInPeriod * expectedDailyRate);
        return Math.max(0, expectedSessions - sessions);
    }
    calculateLongestMissedStreak(sessions, expectedFrequency) {
        if (sessions.length < 2)
            return 0;
        const sessionDates = sessions.map(s => new Date(s.conversationDate));
        let longestStreak = 0;
        let currentStreak = 0;
        const expectedGapDays = 7 / expectedFrequency;
        for (let i = 1; i < sessionDates.length; i++) {
            const gapDays = (0, date_fns_1.differenceInDays)(sessionDates[i], sessionDates[i - 1]);
            if (gapDays > expectedGapDays * 2) {
                currentStreak += Math.floor(gapDays / expectedGapDays) - 1;
            }
            else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 0;
            }
        }
        return Math.max(longestStreak, currentStreak);
    }
    calculateAverageGap(sessions) {
        if (sessions.length < 2)
            return 0;
        const gaps = [];
        for (let i = 1; i < sessions.length; i++) {
            const gap = (0, date_fns_1.differenceInDays)(new Date(sessions[i].conversationDate), new Date(sessions[i - 1].conversationDate));
            gaps.push(gap);
        }
        return gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    }
    calculateActualFrequency(sessions) {
        if (sessions.length < 2)
            return 0;
        const firstSession = new Date(sessions[0].conversationDate);
        const lastSession = new Date(sessions[sessions.length - 1].conversationDate);
        const totalDays = (0, date_fns_1.differenceInDays)(lastSession, firstSession);
        const totalWeeks = totalDays / 7;
        return totalWeeks > 0 ? sessions.length / totalWeeks : 0;
    }
    calculateNextExpectedSession(lastSessionDate, expectation, averageGap) {
        if (!lastSessionDate)
            return null;
        const expectedGapDays = 7 / expectation.expectedSessionsPerWeek;
        const actualGapDays = averageGap > 0 ? averageGap : expectedGapDays;
        return (0, date_fns_1.addDays)(lastSessionDate, Math.round(actualGapDays));
    }
    calculateRiskLevel(metrics) {
        let riskScore = 0;
        if (metrics.consecutiveMissedSessions > 10)
            riskScore += 3;
        else if (metrics.consecutiveMissedSessions > 5)
            riskScore += 2;
        else if (metrics.consecutiveMissedSessions > 2)
            riskScore += 1;
        if (metrics.adherenceRate < 30)
            riskScore += 3;
        else if (metrics.adherenceRate < 50)
            riskScore += 2;
        else if (metrics.adherenceRate < 70)
            riskScore += 1;
        if (metrics.longestMissedStreak > 15)
            riskScore += 2;
        else if (metrics.longestMissedStreak > 10)
            riskScore += 1;
        if (metrics.daysSinceLastSession > 14)
            riskScore += 2;
        else if (metrics.daysSinceLastSession > 7)
            riskScore += 1;
        if (riskScore >= 7)
            return 'critical';
        if (riskScore >= 5)
            return 'high';
        if (riskScore >= 3)
            return 'medium';
        return 'low';
    }
    async analyzeMissedSessionPatterns(userId, sessions, expectedFrequency) {
        const expectedDates = this.generateExpectedSessionDates(sessions, expectedFrequency);
        const actualDates = sessions.map(s => new Date(s.conversationDate));
        const missedDates = expectedDates.filter(expected => !actualDates.some(actual => Math.abs((0, date_fns_1.differenceInDays)(actual, expected)) <= 1));
        const dayOfWeek = {};
        const timeOfDay = {};
        const reasons = {
            'scheduling_conflict': 0,
            'low_motivation': 0,
            'technical_issues': 0,
            'time_constraint': 0,
            'other': 0
        };
        missedDates.forEach(date => {
            const dayName = (0, date_fns_1.format)(date, 'EEEE');
            const hour = date.getHours().toString();
            dayOfWeek[dayName] = (dayOfWeek[dayName] || 0) + 1;
            timeOfDay[hour] = (timeOfDay[hour] || 0) + 1;
            const randomReason = Object.keys(reasons)[Math.floor(Math.random() * Object.keys(reasons).length)];
            reasons[randomReason]++;
        });
        return { dayOfWeek, timeOfDay, reasons };
    }
    generateExpectedSessionDates(sessions, expectedFrequency) {
        if (sessions.length === 0)
            return [];
        const startDate = new Date(sessions[0].conversationDate);
        const endDate = new Date();
        const expectedDates = [];
        const intervalDays = 7 / expectedFrequency;
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            expectedDates.push(new Date(currentDate));
            currentDate = (0, date_fns_1.addDays)(currentDate, intervalDays);
        }
        return expectedDates;
    }
    generateRecommendations(data) {
        const recommendations = [];
        if (data.riskLevel === 'critical') {
            recommendations.push('Immediate intervention required - schedule emergency coaching session');
            recommendations.push('Reduce session frequency temporarily to rebuild habit');
        }
        else if (data.riskLevel === 'high') {
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
        const topMissedDay = Object.entries(data.missedSessionPattern.dayOfWeek)
            .sort(([, a], [, b]) => b - a)[0];
        if (topMissedDay && topMissedDay[1] > 2) {
            recommendations.push(`Avoid scheduling sessions on ${topMissedDay[0]}s`);
        }
        return recommendations.slice(0, 5);
    }
    generateInsights(data) {
        const insights = [];
        if (data.adherenceRate >= 80) {
            insights.push('Excellent coaching consistency - maintain current schedule');
        }
        else if (data.adherenceRate >= 60) {
            insights.push('Good coaching attendance with room for improvement');
        }
        else {
            insights.push('Coaching consistency needs significant improvement');
        }
        if (data.actualFrequency > data.expectedFrequency * 1.2) {
            insights.push('User is exceeding expected session frequency - highly engaged');
        }
        else if (data.actualFrequency < data.expectedFrequency * 0.5) {
            insights.push('User is significantly below expected session frequency');
        }
        if (data.longestMissedStreak > 14) {
            insights.push('Extended periods without coaching may impact goal achievement');
        }
        if (data.consecutiveMissedSessions === 0) {
            insights.push('No recent missed sessions - great momentum');
        }
        else if (data.consecutiveMissedSessions > 7) {
            insights.push('Current missing streak requires immediate attention');
        }
        const efficiencyRatio = data.expectedFrequency > 0 ?
            data.actualFrequency / data.expectedFrequency : 0;
        if (efficiencyRatio > 1.1) {
            insights.push('User shows strong intrinsic motivation for coaching');
        }
        else if (efficiencyRatio < 0.7) {
            insights.push('User may benefit from motivation and engagement support');
        }
        return insights;
    }
    calculateRiskScore(missedData) {
        let score = 0;
        score += (1 - missedData.adherenceRate / 100) * 0.4;
        score += Math.min(1, missedData.consecutiveMissedSessions / 10) * 0.3;
        const daysSinceLastSession = missedData.lastSessionDate ?
            (0, date_fns_1.differenceInDays)(new Date(), missedData.lastSessionDate) : 30;
        score += Math.min(1, daysSinceLastSession / 14) * 0.2;
        score += Math.min(1, missedData.longestMissedStreak / 20) * 0.1;
        return Math.min(1, score);
    }
    identifyRiskFactors(missedData) {
        const factors = [];
        if (missedData.adherenceRate < 50) {
            factors.push('Very low session adherence rate');
        }
        if (missedData.consecutiveMissedSessions > 7) {
            factors.push('Extended period without coaching sessions');
        }
        const daysSinceLastSession = missedData.lastSessionDate ?
            (0, date_fns_1.differenceInDays)(new Date(), missedData.lastSessionDate) : 30;
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
    generateRiskMitigationActions(missedData) {
        const actions = [];
        if (missedData.riskLevel === 'critical') {
            actions.push('Immediate outreach and support call');
            actions.push('Temporarily reduce session frequency');
            actions.push('Identify and address specific barriers');
        }
        else if (missedData.riskLevel === 'high') {
            actions.push('Send personalized re-engagement message');
            actions.push('Offer flexible scheduling options');
            actions.push('Provide motivation and accountability support');
        }
        actions.push('Set up automated reminder system');
        actions.push('Review and adjust coaching approach');
        return actions;
    }
    async calculateWeeklyTrends() {
        const weeks = [];
        for (let i = 11; i >= 0; i--) {
            const weekStart = (0, date_fns_1.addDays)((0, date_fns_1.startOfWeek)(new Date()), -i * 7);
            const weekEnd = (0, date_fns_1.endOfWeek)(weekStart);
            const count = Math.floor(Math.random() * 50) + 10;
            weeks.push({
                week: (0, date_fns_1.format)(weekStart, 'MMM dd'),
                count
            });
        }
        return weeks;
    }
    async calculateSeasonalPatterns() {
        return {
            'Winter': 1.2,
            'Spring': 0.9,
            'Summer': 0.8,
            'Fall': 1.0
        };
    }
}
exports.MissedSessionsCalculator = MissedSessionsCalculator;
exports.missedSessionsCalculator = new MissedSessionsCalculator();
