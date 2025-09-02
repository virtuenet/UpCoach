"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachIntelligenceService = void 0;
const sequelize_1 = require("sequelize");
const CoachMemory_1 = __importDefault(require("../../models/coaching/CoachMemory"));
const UserAnalytics_1 = __importDefault(require("../../models/analytics/UserAnalytics"));
const KpiTracker_1 = __importDefault(require("../../models/analytics/KpiTracker"));
class CoachIntelligenceService {
    /**
     * Process and store a coaching conversation in memory
     */
    async processCoachingSession(context, conversationContent, sessionDuration, userFeedback) {
        // Extract insights from conversation
        const insights = await this.extractConversationInsights(conversationContent, context);
        // Determine memory importance
        const importance = this.calculateMemoryImportance(insights, userFeedback);
        // Create memory record
        const memory = await CoachMemory_1.default.create({
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
    async getRelevantMemories(userId, currentContext, limit = 10) {
        // Get all memories for user
        const allMemories = await CoachMemory_1.default.findAll({
            where: {
                userId,
                conversationDate: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
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
    async generateCoachingRecommendations(userId, _avatarId) {
        const recommendations = [];
        // Get user analytics
        const analytics = await UserAnalytics_1.default.findOne({
            where: { userId },
            order: [['calculatedAt', 'DESC']],
        });
        // Get KPI/Goal data
        const activeGoals = await KpiTracker_1.default.findAll({
            where: {
                userId,
                status: ['in_progress', 'at_risk'],
            },
            order: [['priority', 'DESC']],
        });
        // Get recent memories
        const recentMemories = await CoachMemory_1.default.findAll({
            where: {
                userId,
                conversationDate: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 2 weeks
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
    async generateWeeklyReport(userId) {
        const weekEnd = new Date();
        const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        // Get weekly analytics
        const analytics = await UserAnalytics_1.default.findOne({
            where: {
                userId,
                periodType: 'weekly',
                periodStart: {
                    [sequelize_1.Op.gte]: weekStart,
                },
            },
        });
        // Get weekly memories
        const weeklyMemories = await CoachMemory_1.default.findAll({
            where: {
                userId,
                conversationDate: {
                    [sequelize_1.Op.between]: [weekStart, weekEnd],
                },
            },
            order: [['conversationDate', 'ASC']],
        });
        // Get goal progress
        const goals = await KpiTracker_1.default.findAll({
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
        const recommendations = await this.generateCoachingRecommendations(userId, weeklyMemories[0]?.avatarId || '');
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
    async calculateUserAnalytics(userId, periodType) {
        const now = new Date();
        let periodStart;
        let periodEnd = now;
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
        const memories = await CoachMemory_1.default.findAll({
            where: {
                userId,
                conversationDate: {
                    [sequelize_1.Op.between]: [periodStart, periodEnd],
                },
            },
        });
        const goals = await KpiTracker_1.default.findAll({
            where: {
                userId,
                startDate: {
                    [sequelize_1.Op.lte]: periodEnd,
                },
                endDate: {
                    [sequelize_1.Op.gte]: periodStart,
                },
            },
        });
        // Calculate engagement metrics
        const engagementMetrics = {
            totalSessions: memories.length,
            totalDuration: memories.reduce((sum, m) => sum + m.coachingContext.importance * 5, 0), // Estimate duration
            averageSessionDuration: memories.length > 0
                ? memories.reduce((sum, m) => sum + m.coachingContext.importance * 5, 0) / memories.length
                : 0,
            streakCount: this.calculateStreakCount(memories),
            missedSessions: 0, // TODO: Calculate based on scheduled vs actual
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
            npsScore: 0, // TODO: Implement NPS tracking
            retentionProbability: this.calculateRetentionProbability(memories, goals),
            churnRisk: this.calculateChurnRisk(memories, goals),
            customKpis: [], // TODO: Implement custom KPIs
        };
        // Generate AI insights
        const aiInsights = {
            strengthAreas: this.identifyStrengthAreas(memories, goals),
            improvementAreas: this.identifyImprovementAreas(memories, goals),
            recommendedActions: (await this.generateCoachingRecommendations(userId, memories[0]?.avatarId || '')).map(r => r.title),
            predictedOutcomes: this.predictOutcomes(memories, goals),
            riskFactors: this.identifyRiskFactors(memories, goals),
        };
        // Create or update analytics record
        const [analytics] = await UserAnalytics_1.default.upsert({
            userId,
            periodType,
            periodStart,
            periodEnd,
            engagementMetrics,
            coachingMetrics,
            behavioralData,
            kpiMetrics,
            benchmarkData: {
                userPercentile: 50, // TODO: Calculate against other users
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
    async extractConversationInsights(content, context) {
        // TODO: Implement AI-powered insight extraction
        return {
            summary: content.substring(0, 200) + '...',
            tags: context.currentTopic ? [context.currentTopic] : [],
            sentiment: this.analyzeSentiment(content),
            emotionalTrends: [context.userMood],
            category: 'general',
            actionItems: this.extractActionItems(content),
            followUpNeeded: content.toLowerCase().includes('follow up') || content.toLowerCase().includes('next time'),
        };
    }
    calculateMemoryImportance(insights, userFeedback) {
        let importance = 5; // Base importance
        if (userFeedback?.rating >= 8)
            importance += 2;
        if (insights.actionItems.length > 0)
            importance += 1;
        if (insights.followUpNeeded)
            importance += 1;
        if (Math.abs(insights.sentiment) > 0.7)
            importance += 1;
        return Math.min(10, importance);
    }
    async updateRelatedMemories(memory, context) {
        // Find related memories based on tags and topics
        const relatedMemories = await CoachMemory_1.default.findAll({
            where: {
                userId: context.userId,
                id: { [sequelize_1.Op.ne]: memory.id },
                tags: { [sequelize_1.Op.overlap]: memory.tags },
            },
            limit: 5,
        });
        memory.relatedMemoryIds = relatedMemories.map(m => m.id);
        await memory.save();
    }
    async processMemoryWithAI(memory) {
        // TODO: Implement AI processing for deeper insights
        memory.aiProcessed = true;
        memory.insightsGenerated = [
            'Memory processed and categorized',
            'Emotional context analyzed',
            'Related patterns identified',
        ];
        await memory.save();
    }
    async updateUserAnalytics(userId, _memory, _sessionDuration, _userFeedback) {
        // This will trigger recalculation of analytics
        await this.calculateUserAnalytics(userId, 'daily');
        await this.calculateUserAnalytics(userId, 'weekly');
    }
    analyzeSentiment(text) {
        // Simple sentiment analysis - replace with proper AI
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'progress'];
        const negativeWords = ['bad', 'terrible', 'frustrated', 'stuck', 'difficult', 'problem'];
        const words = text.toLowerCase().split(/\s+/);
        const positive = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
        const negative = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
        if (positive + negative === 0)
            return 0;
        return (positive - negative) / (positive + negative);
    }
    extractActionItems(content) {
        // Simple extraction - replace with proper NLP
        const sentences = content.split(/[.!?]/);
        return sentences
            .filter(sentence => sentence.toLowerCase().includes('will') ||
            sentence.toLowerCase().includes('should') ||
            sentence.toLowerCase().includes('action') ||
            sentence.toLowerCase().includes('next'))
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 10);
    }
    // Additional helper methods would be implemented here...
    calculateStreakCount(_memories) {
        // TODO: Implement streak calculation
        return 0;
    }
    calculateResponsiveness(_memories) {
        // TODO: Implement responsiveness calculation
        return 0.7;
    }
    calculateParticipationScore(_memories) {
        // TODO: Implement participation scoring
        return 0.8;
    }
    calculateFollowThroughRate(goals) {
        if (goals.length === 0)
            return 0.5;
        const completedActions = goals.reduce((sum, goal) => sum + goal.coachingData.actionItems.filter(item => item.status === 'completed').length, 0);
        const totalActions = goals.reduce((sum, goal) => sum + goal.coachingData.actionItems.length, 0);
        return totalActions > 0 ? completedActions / totalActions : 0.5;
    }
    calculateAvatarEffectiveness(_memories) {
        // TODO: Implement avatar effectiveness calculation
        return 0.7;
    }
    calculateSkillImprovement(_memories) {
        // TODO: Implement skill improvement tracking
        return 0.6;
    }
    calculateConfidenceIncrease(_memories) {
        // TODO: Implement confidence tracking
        return 0.7;
    }
    calculateStressReduction(_memories) {
        // TODO: Implement stress level tracking
        return 0.5;
    }
    calculateHabitFormation(_goals) {
        // TODO: Implement habit formation tracking
        return 0.6;
    }
    calculatePreferredTime(_memories) {
        // TODO: Analyze session times
        return 'morning';
    }
    analyzeCommunicationStyle(_memories) {
        // TODO: Analyze communication patterns
        return 'supportive';
    }
    extractTopicsOfInterest(_memories) {
        // TODO: Extract and rank topics
        return ['goal-setting', 'productivity', 'wellness'];
    }
    extractChallengeAreas(_memories) {
        // TODO: Identify challenge patterns
        return ['time-management', 'consistency'];
    }
    calculateMoodTrends(memories) {
        return memories.map(m => ({
            date: m.conversationDate.toISOString().split('T')[0],
            mood: m.emotionalContext.mood,
            sentiment: m.emotionalContext.sentiment,
        }));
    }
    analyzeLearningPreferences(_memories) {
        // TODO: Analyze learning style preferences
        return {
            visualLearner: 0.4,
            auditoryLearner: 0.4,
            kinestheticLearner: 0.2,
        };
    }
    calculateSatisfactionScore(_memories) {
        // TODO: Calculate satisfaction from feedback
        return 7.5;
    }
    calculateRetentionProbability(_memories, _goals) {
        // TODO: Implement retention probability model
        return 0.8;
    }
    calculateChurnRisk(_memories, _goals) {
        // TODO: Implement churn risk calculation
        return 0.2;
    }
    identifyStrengthAreas(_memories, _goals) {
        // TODO: Identify user strengths
        return ['goal-setting', 'communication'];
    }
    identifyImprovementAreas(_memories, _goals) {
        // TODO: Identify improvement areas
        return ['consistency', 'follow-through'];
    }
    predictOutcomes(_memories, _goals) {
        // TODO: Predict likely outcomes
        return ['Likely to achieve primary goal', 'May need additional support for consistency'];
    }
    identifyRiskFactors(_memories, _goals) {
        // TODO: Identify risk factors
        return ['Low engagement', 'Overambitious goals'];
    }
    calculateDataQualityScore(_memories, _goals) {
        // TODO: Calculate data quality
        return 0.8;
    }
    analyzeEmotionalPatterns(_memories) {
        // TODO: Analyze emotional patterns
        return {
            concerningTrends: [],
            positiveTrends: ['increased confidence'],
        };
    }
    calculateWeeklyGoalProgress(_goals, _weekStart, _weekEnd) {
        // TODO: Calculate weekly progress
        return 0.7;
    }
    calculateMoodTrend(_memories) {
        // TODO: Calculate mood trend
        return 'improving';
    }
    extractAchievements(_memories, _goals) {
        // TODO: Extract achievements
        return ['Completed daily meditation goal', 'Improved time management'];
    }
    extractChallenges(_memories, _goals) {
        // TODO: Extract challenges
        return ['Maintaining consistency', 'Balancing multiple priorities'];
    }
    async generateWeeklyInsights(_memories, _analytics) {
        // TODO: Generate insights
        return [
            {
                type: 'improvement',
                title: 'Increased Session Engagement',
                description: 'User participation has improved over the week',
                relevanceScore: 0.8,
                actionable: true,
                recommendations: ['Continue current approach', 'Consider increasing session frequency'],
            },
        ];
    }
    generateNextWeekFocus(_insights, _recommendations) {
        // TODO: Generate focus areas
        return [
            'Maintain current progress',
            'Address consistency challenges',
            'Explore new goal areas',
        ];
    }
}
exports.CoachIntelligenceService = CoachIntelligenceService;
exports.default = CoachIntelligenceService;
//# sourceMappingURL=CoachIntelligenceService.js.map