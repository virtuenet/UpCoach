"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsEngine = exports.AnalyticsEngine = void 0;
const logger_1 = require("../../utils/logger");
class AnalyticsEngine {
    behaviorCache = new Map();
    metricsCache = new Map();
    userEvents = new Map();
    constructor() {
        logger_1.logger.info('AnalyticsEngine initialized');
    }
    async analyzeBehaviorPatterns(userId, days) {
        try {
            const cacheKey = `${userId}-${days}`;
            if (this.behaviorCache.has(cacheKey)) {
                return this.behaviorCache.get(cacheKey);
            }
            const patterns = [
                {
                    pattern: 'Morning Activity Peak',
                    frequency: 0.8,
                    confidence: 0.92,
                    description: 'User is most active between 7-9 AM',
                    insights: [
                        'Consistent morning routine',
                        'High engagement during early hours',
                        'Better focus and completion rates in morning'
                    ],
                    recommendations: [
                        'Schedule important tasks for morning',
                        'Send motivational content at 7 AM',
                        'Suggest morning reflection exercises'
                    ]
                },
                {
                    pattern: 'Weekly Goal Review',
                    frequency: 0.75,
                    confidence: 0.88,
                    description: 'User consistently reviews goals on weekends',
                    insights: [
                        'Strong planning and reflection habits',
                        'Takes time for self-assessment',
                        'Values structured progress review'
                    ],
                    recommendations: [
                        'Provide weekly summary reports',
                        'Suggest reflection prompts on Fridays',
                        'Offer goal adjustment guidance'
                    ]
                },
                {
                    pattern: 'Midweek Engagement Drop',
                    frequency: 0.65,
                    confidence: 0.79,
                    description: 'Reduced activity during midweek (Wed-Thu)',
                    insights: [
                        'Potential work stress impact',
                        'Need for midweek motivation',
                        'Opportunity for habit reinforcement'
                    ],
                    recommendations: [
                        'Send encouragement on Wednesday',
                        'Suggest quick 5-minute exercises',
                        'Provide stress management content'
                    ]
                }
            ];
            this.behaviorCache.set(cacheKey, patterns);
            return patterns;
        }
        catch (error) {
            logger_1.logger.error('Error analyzing behavior patterns:', error);
            throw error;
        }
    }
    async getEngagementMetrics(userId, options) {
        try {
            const cacheKey = `${userId}-metrics`;
            if (this.metricsCache.has(cacheKey)) {
                return this.metricsCache.get(cacheKey);
            }
            const metrics = {
                dailyActiveTime: 45,
                weeklyActiveTime: 315,
                sessionCount: 12,
                averageSessionDuration: 26,
                featureUsage: {
                    'goal-tracking': 25,
                    'habit-builder': 18,
                    'progress-review': 15,
                    'coaching-chat': 12,
                    'content-library': 8,
                    'community': 5
                },
                contentEngagement: {
                    views: 42,
                    completions: 31,
                    shares: 3,
                    saves: 7
                },
                goalProgress: {
                    goalsSet: 6,
                    goalsCompleted: 4,
                    averageCompletionTime: 21
                },
                trendData: this.generateTrendData(options?.startDate, options?.endDate)
            };
            this.metricsCache.set(cacheKey, metrics);
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Error getting engagement metrics:', error);
            throw error;
        }
    }
    async identifySuccessFactors(userId) {
        try {
            const factors = [
                {
                    factor: 'Consistent Daily Engagement',
                    impact: 0.85,
                    correlation: 0.78,
                    description: 'Users who engage daily are 85% more likely to achieve their goals',
                    actionable: true,
                    recommendations: [
                        'Set daily engagement reminders',
                        'Create habit streaks',
                        'Reward consecutive days of activity'
                    ]
                },
                {
                    factor: 'Goal Specificity',
                    impact: 0.72,
                    correlation: 0.81,
                    description: 'Specific, measurable goals show higher completion rates',
                    actionable: true,
                    recommendations: [
                        'Guide users in SMART goal setting',
                        'Provide goal refinement suggestions',
                        'Break large goals into specific milestones'
                    ]
                },
                {
                    factor: 'Social Support Utilization',
                    impact: 0.68,
                    correlation: 0.65,
                    description: 'Users who engage with community features show better outcomes',
                    actionable: true,
                    recommendations: [
                        'Encourage community participation',
                        'Suggest accountability partners',
                        'Highlight social features'
                    ]
                },
                {
                    factor: 'Regular Progress Review',
                    impact: 0.74,
                    correlation: 0.73,
                    description: 'Weekly progress reviews correlate with sustained motivation',
                    actionable: true,
                    recommendations: [
                        'Schedule weekly review sessions',
                        'Provide progress visualization',
                        'Send reflection prompts'
                    ]
                }
            ];
            return factors;
        }
        catch (error) {
            logger_1.logger.error('Error identifying success factors:', error);
            throw error;
        }
    }
    async trackEvent(userId, event) {
        try {
            if (!this.userEvents.has(userId)) {
                this.userEvents.set(userId, []);
            }
            const userEventList = this.userEvents.get(userId);
            userEventList.push(event);
            if (userEventList.length > 1000) {
                userEventList.splice(0, userEventList.length - 1000);
            }
            logger_1.logger.info(`Tracked event ${event.type} for user ${userId}`);
            this.invalidateUserCaches(userId);
        }
        catch (error) {
            logger_1.logger.error('Error tracking analytics event:', error);
            throw error;
        }
    }
    generateTrendData(startDate, endDate) {
        const trends = [];
        const end = endDate || new Date();
        const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            trends.push({
                date: d.toISOString().split('T')[0],
                engagement: Math.floor(Math.random() * 60) + 20,
                activities: Math.floor(Math.random() * 8) + 2
            });
        }
        return trends;
    }
    invalidateUserCaches(userId) {
        for (const key of this.behaviorCache.keys()) {
            if (key.startsWith(userId)) {
                this.behaviorCache.delete(key);
            }
        }
        this.metricsCache.delete(`${userId}-metrics`);
    }
    async getUserEvents(userId, limit) {
        try {
            const events = this.userEvents.get(userId) || [];
            return limit ? events.slice(-limit) : events;
        }
        catch (error) {
            logger_1.logger.error('Error getting user events:', error);
            throw error;
        }
    }
    async generateAnalyticsSummary(userId) {
        try {
            const [patterns, metrics, factors] = await Promise.all([
                this.analyzeBehaviorPatterns(userId, 30),
                this.getEngagementMetrics(userId),
                this.identifySuccessFactors(userId)
            ]);
            const insights = [
                `User shows ${patterns.length} distinct behavior patterns`,
                `Average session duration: ${metrics.averageSessionDuration} minutes`,
                `Goal completion rate: ${Math.round((metrics.goalProgress.goalsCompleted / metrics.goalProgress.goalsSet) * 100)}%`,
                `Top success factor: ${factors[0]?.factor || 'N/A'}`
            ];
            return { patterns, metrics, factors, insights };
        }
        catch (error) {
            logger_1.logger.error('Error generating analytics summary:', error);
            throw error;
        }
    }
}
exports.AnalyticsEngine = AnalyticsEngine;
exports.analyticsEngine = new AnalyticsEngine();
//# sourceMappingURL=AnalyticsEngine.js.map