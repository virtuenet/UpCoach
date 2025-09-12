"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachIntelligenceService = void 0;
const sequelize_1 = require("sequelize");
const KpiTracker_1 = __importDefault(require("../../models/analytics/KpiTracker"));
const UserAnalytics_1 = __importDefault(require("../../models/analytics/UserAnalytics"));
const CoachMemory_1 = __importDefault(require("../../models/coaching/CoachMemory"));
const logger_1 = require("../../utils/logger");
const AIService_1 = require("../ai/AIService");
class CoachIntelligenceService {
    async processCoachingSession(context, conversationContent, sessionDuration, userFeedback) {
        const insights = await this.extractConversationInsights(conversationContent, context);
        const importance = this.calculateMemoryImportance(insights, userFeedback);
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
            relevanceScore: 1.0,
        });
        await this.updateRelatedMemories(memory, context);
        await this.processMemoryWithAI(memory);
        await this.updateUserAnalytics(context.userId, memory, sessionDuration, userFeedback);
        return memory;
    }
    async getRelevantMemories(userId, currentContext, limit = 10) {
        const allMemories = await CoachMemory_1.default.findAll({
            where: {
                userId,
                conversationDate: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                },
            },
            order: [['conversationDate', 'DESC']],
        });
        for (const memory of allMemories) {
            memory.updateRelevanceScore(currentContext);
            await memory.save();
        }
        return allMemories
            .filter(memory => memory.isRelevant())
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    }
    async generateCoachingRecommendations(userId, _avatarId) {
        const recommendations = [];
        const analytics = await UserAnalytics_1.default.findOne({
            where: { userId },
            order: [['calculatedAt', 'DESC']],
        });
        const activeGoals = await KpiTracker_1.default.findAll({
            where: {
                userId,
                status: ['in_progress', 'at_risk'],
            },
            order: [['priority', 'DESC']],
        });
        const recentMemories = await CoachMemory_1.default.findAll({
            where: {
                userId,
                conversationDate: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                },
            },
            order: [['conversationDate', 'DESC']],
            limit: 20,
        });
        if (analytics) {
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
    async generateWeeklyReport(userId) {
        const weekEnd = new Date();
        const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        const analytics = await UserAnalytics_1.default.findOne({
            where: {
                userId,
                periodType: 'weekly',
                periodStart: {
                    [sequelize_1.Op.gte]: weekStart,
                },
            },
        });
        const weeklyMemories = await CoachMemory_1.default.findAll({
            where: {
                userId,
                conversationDate: {
                    [sequelize_1.Op.between]: [weekStart, weekEnd],
                },
            },
            order: [['conversationDate', 'ASC']],
        });
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
            recommendations: recommendations.slice(0, 5),
            nextWeekFocus: this.generateNextWeekFocus(insights, recommendations),
        };
    }
    async calculateUserAnalytics(userId, periodType) {
        const now = new Date();
        let periodStart;
        const periodEnd = now;
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
        const engagementMetrics = {
            totalSessions: memories.length,
            totalDuration: memories.reduce((sum, m) => sum + m.coachingContext.importance * 5, 0),
            averageSessionDuration: memories.length > 0
                ? memories.reduce((sum, m) => sum + m.coachingContext.importance * 5, 0) / memories.length
                : 0,
            streakCount: this.calculateStreakCount(memories),
            missedSessions: 0,
            responsiveness: this.calculateResponsiveness(memories),
            participationScore: this.calculateParticipationScore(memories),
            followThroughRate: this.calculateFollowThroughRate(goals),
        };
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
        const behavioralData = {
            preferredSessionTime: this.calculatePreferredTime(memories),
            preferredDuration: engagementMetrics.averageSessionDuration,
            communicationStyle: this.analyzeCommunicationStyle(memories),
            topicsOfInterest: this.extractTopicsOfInterest(memories),
            challengeAreas: this.extractChallengeAreas(memories),
            moodTrends: this.calculateMoodTrends(memories),
            learningPreferences: this.analyzeLearningPreferences(memories),
        };
        const kpiMetrics = {
            userSatisfactionScore: this.calculateSatisfactionScore(memories),
            npsScore: 0,
            retentionProbability: this.calculateRetentionProbability(memories, goals),
            churnRisk: this.calculateChurnRisk(memories, goals),
            customKpis: [],
        };
        const aiInsights = {
            strengthAreas: this.identifyStrengthAreas(memories, goals),
            improvementAreas: this.identifyImprovementAreas(memories, goals),
            recommendedActions: (await this.generateCoachingRecommendations(userId, memories[0]?.avatarId || '')).map(r => r.title),
            predictedOutcomes: this.predictOutcomes(memories, goals),
            riskFactors: this.identifyRiskFactors(memories, goals),
        };
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
                userPercentile: 50,
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
    async extractConversationInsights(content, context) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: `You are an expert coaching conversation analyzer. Extract comprehensive insights from coaching conversations and return them as valid JSON.
          
Always include:
          - summary: A concise 2-3 sentence summary
          - tags: Array of relevant topic tags (5-10 tags max)
          - sentiment: Numerical score between -1 (very negative) and 1 (very positive)
          - emotionalTrends: Array of emotional states detected
          - category: Primary conversation category (goal-setting, problem-solving, motivation, reflection, skill-building, feedback)
          - actionItems: Array of specific action items mentioned
          - followUpNeeded: Boolean indicating if follow-up is required
          - keyInsights: Array of important insights or breakthroughs
          - challengesIdentified: Array of challenges or obstacles mentioned
          - progressIndicators: Array of signs of progress or improvement
          - coachingTechniques: Array of coaching techniques that would be most effective`
                },
                {
                    role: 'user',
                    content: `Context:
- User: ${context.userId}
- Avatar: ${context.avatarId}
- Current Topic: ${context.currentTopic}
- User Mood: ${context.userMood}
- Goals: ${context.goals.join(', ')}

Conversation Content:
${content}

Extract insights and return as JSON:`
                }
            ];
            const response = await AIService_1.aiService.generateResponse(messages, {
                temperature: 0.3,
                maxTokens: 1500,
                provider: 'openai'
            });
            const insights = JSON.parse(response.content);
            return {
                summary: insights.summary || content.substring(0, 200) + '...',
                tags: Array.isArray(insights.tags) ? insights.tags : [context.currentTopic].filter(Boolean),
                sentiment: typeof insights.sentiment === 'number' ? insights.sentiment : await this.analyzeSentiment(content),
                emotionalTrends: Array.isArray(insights.emotionalTrends) ? insights.emotionalTrends : [context.userMood],
                category: insights.category || 'general',
                actionItems: Array.isArray(insights.actionItems) ? insights.actionItems : this.extractActionItemsFallback(content),
                followUpNeeded: typeof insights.followUpNeeded === 'boolean' ? insights.followUpNeeded :
                    content.toLowerCase().includes('follow up') || content.toLowerCase().includes('next time'),
                keyInsights: Array.isArray(insights.keyInsights) ? insights.keyInsights : [],
                challengesIdentified: Array.isArray(insights.challengesIdentified) ? insights.challengesIdentified : [],
                progressIndicators: Array.isArray(insights.progressIndicators) ? insights.progressIndicators : [],
                coachingTechniques: Array.isArray(insights.coachingTechniques) ? insights.coachingTechniques : []
            };
        }
        catch (error) {
            logger_1.logger.error('AI insight extraction failed, using fallback:', error);
            return {
                summary: content.substring(0, 200) + '...',
                tags: context.currentTopic ? [context.currentTopic] : [],
                sentiment: this.analyzeSentimentFallback(content),
                emotionalTrends: [context.userMood],
                category: 'general',
                actionItems: this.extractActionItemsFallback(content),
                followUpNeeded: content.toLowerCase().includes('follow up') || content.toLowerCase().includes('next time'),
                keyInsights: [],
                challengesIdentified: [],
                progressIndicators: [],
                coachingTechniques: []
            };
        }
    }
    calculateMemoryImportance(insights, userFeedback) {
        let importance = 5;
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
        try {
            const messages = [
                {
                    role: 'system',
                    content: `You are an advanced coaching memory analyst. Process this coaching session memory to extract deeper insights and patterns.
          
          Analyze and return JSON with:
          - deepInsights: Array of profound insights about the user's journey
          - behavioralPatterns: Array of behavioral patterns observed
          - growthIndicators: Array of signs indicating personal growth
          - potentialBlockers: Array of potential obstacles or limiting beliefs
          - coachingOpportunities: Array of opportunities for better coaching
          - connectionPoints: Array of topics/themes that connect to other sessions
          - emergingThemes: Array of new themes emerging in the user's development
          - personalityInsights: Observations about the user's personality and preferences
          - motivationalProfile: Assessment of what motivates this user
          - learningStyle: Observed learning preferences and styles`
                },
                {
                    role: 'user',
                    content: `Memory Content:
${memory.content}

Session Summary:
${memory.summary}

Emotional Context:
- Mood: ${memory.emotionalContext.mood}
- Sentiment: ${memory.emotionalContext.sentiment}

Coaching Context:
- Topic: ${memory.coachingContext.topic}
- Category: ${memory.coachingContext.category}
- Importance: ${memory.coachingContext.importance}
- Action Items: ${memory.coachingContext.actionItems?.join(', ') || 'None'}

Tags: ${memory.tags?.join(', ') || 'None'}

Provide deep AI analysis as JSON:`
                }
            ];
            const response = await AIService_1.aiService.generateResponse(messages, {
                temperature: 0.4,
                maxTokens: 2000,
                provider: 'openai'
            });
            const aiAnalysis = JSON.parse(response.content);
            const insights = [
                ...(Array.isArray(aiAnalysis.deepInsights) ? aiAnalysis.deepInsights : []),
                ...(Array.isArray(aiAnalysis.behavioralPatterns) ? aiAnalysis.behavioralPatterns.map(p => `Pattern: ${p}`) : []),
                ...(Array.isArray(aiAnalysis.growthIndicators) ? aiAnalysis.growthIndicators.map(g => `Growth: ${g}`) : []),
                ...(Array.isArray(aiAnalysis.coachingOpportunities) ? aiAnalysis.coachingOpportunities.map(o => `Opportunity: ${o}`) : [])
            ];
            memory.aiProcessed = true;
            memory.insightsGenerated = insights.slice(0, 15);
            const updatedCoachingContext = {
                ...memory.coachingContext,
                aiAnalysis: {
                    potentialBlockers: aiAnalysis.potentialBlockers || [],
                    connectionPoints: aiAnalysis.connectionPoints || [],
                    emergingThemes: aiAnalysis.emergingThemes || [],
                    personalityInsights: aiAnalysis.personalityInsights || [],
                    motivationalProfile: aiAnalysis.motivationalProfile || [],
                    learningStyle: aiAnalysis.learningStyle || 'adaptive',
                    analysisDate: new Date()
                }
            };
            memory.coachingContext = updatedCoachingContext;
            await memory.save();
            logger_1.logger.info(`AI processing completed for memory ${memory.id}: ${insights.length} insights generated`);
        }
        catch (error) {
            logger_1.logger.error('AI memory processing failed, using basic processing:', error);
            memory.aiProcessed = true;
            memory.insightsGenerated = [
                'Memory processed and categorized',
                'Emotional context analyzed',
                'Related patterns identified',
                `Session importance: ${memory.importance}/10`,
                `Emotional tone: ${memory.emotionalContext.mood}`,
                `Topic focus: ${memory.coachingContext.topic}`
            ];
            await memory.save();
        }
    }
    async updateUserAnalytics(userId, _memory, _sessionDuration, _userFeedback) {
        await this.calculateUserAnalytics(userId, 'daily');
        await this.calculateUserAnalytics(userId, 'weekly');
    }
    async analyzeSentiment(text) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: `You are an expert emotional intelligence analyst specializing in coaching conversations. 
          Analyze the emotional sentiment and return a JSON response with:
          - overall_sentiment: A number between -1 (very negative) and 1 (very positive)
          - confidence: A number between 0 and 1 indicating confidence in the analysis
          - emotional_indicators: Array of specific emotional cues detected
          - intensity: Number between 0 and 1 indicating emotional intensity
          - dominant_emotions: Array of primary emotions (max 3)`
                },
                {
                    role: 'user',
                    content: `Analyze the sentiment of this coaching conversation text:\n\n"${text}"\n\nReturn analysis as JSON:`
                }
            ];
            const response = await AIService_1.aiService.generateResponse(messages, {
                temperature: 0.2,
                maxTokens: 800,
                provider: 'openai'
            });
            const analysis = JSON.parse(response.content);
            return typeof analysis.overall_sentiment === 'number' ? analysis.overall_sentiment : 0;
        }
        catch (error) {
            logger_1.logger.error('AI sentiment analysis failed, using fallback:', error);
            return this.analyzeSentimentFallback(text);
        }
    }
    analyzeSentimentFallback(text) {
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'progress', 'excited', 'confident', 'accomplished', 'successful'];
        const negativeWords = ['bad', 'terrible', 'frustrated', 'stuck', 'difficult', 'problem', 'worried', 'anxious', 'overwhelmed', 'disappointed'];
        const words = text.toLowerCase().split(/\s+/);
        const positive = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
        const negative = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
        if (positive + negative === 0)
            return 0;
        return (positive - negative) / (positive + negative);
    }
    extractActionItemsFallback(content) {
        const sentences = content.split(/[.!?]/);
        return sentences
            .filter(sentence => sentence.toLowerCase().includes('will') ||
            sentence.toLowerCase().includes('should') ||
            sentence.toLowerCase().includes('action') ||
            sentence.toLowerCase().includes('next') ||
            sentence.toLowerCase().includes('plan to') ||
            sentence.toLowerCase().includes('going to') ||
            sentence.toLowerCase().includes('commit to') ||
            sentence.toLowerCase().includes('by tomorrow') ||
            sentence.toLowerCase().includes('by next week'))
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 10);
    }
    calculateStreakCount(memories) {
        if (memories.length === 0)
            return 0;
        const sortedMemories = memories.sort((a, b) => new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime());
        let currentStreak = 0;
        let lastDate = null;
        for (const memory of sortedMemories) {
            const memoryDate = new Date(memory.conversationDate);
            memoryDate.setHours(0, 0, 0, 0);
            if (lastDate === null) {
                currentStreak = 1;
                lastDate = memoryDate;
            }
            else {
                const daysDiff = Math.floor((lastDate.getTime() - memoryDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff === 1) {
                    currentStreak++;
                    lastDate = memoryDate;
                }
                else if (daysDiff === 0) {
                    continue;
                }
                else {
                    break;
                }
            }
        }
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const mostRecentDate = new Date(sortedMemories[0].conversationDate);
        mostRecentDate.setHours(0, 0, 0, 0);
        if (mostRecentDate.getTime() < yesterday.getTime()) {
            return 0;
        }
        return currentStreak;
    }
    calculateResponsiveness(memories) {
        if (memories.length === 0)
            return 0.5;
        let totalResponseScore = 0;
        let validMemories = 0;
        for (const memory of memories) {
            let responseScore = 0.5;
            const actionItems = memory.coachingContext.actionItems || [];
            if (actionItems.length > 0) {
                if (memory.coachingContext.followUpNeeded) {
                    responseScore += 0.2;
                }
                responseScore += Math.min(0.2, actionItems.length * 0.05);
            }
            const importanceNormalized = memory.importance / 10;
            responseScore += importanceNormalized * 0.3;
            const sentiment = Math.abs(memory.emotionalContext.sentiment || 0);
            responseScore += sentiment * 0.2;
            const contentLength = memory.content?.length || 0;
            const insightsCount = memory.insightsGenerated?.length || 0;
            if (contentLength > 500)
                responseScore += 0.05;
            if (insightsCount > 3)
                responseScore += 0.05;
            responseScore = Math.min(1.0, responseScore);
            totalResponseScore += responseScore;
            validMemories++;
        }
        const averageResponsiveness = validMemories > 0 ? totalResponseScore / validMemories : 0.5;
        const sortedMemories = memories.sort((a, b) => new Date(b.conversationDate).getTime() - new Date(a.conversationDate).getTime());
        let weightedScore = 0;
        let totalWeight = 0;
        for (let i = 0; i < Math.min(sortedMemories.length, 10); i++) {
            const weight = Math.pow(0.9, i);
            const memoryScore = Math.min(1.0, sortedMemories[i].importance / 10 + 0.3);
            weightedScore += memoryScore * weight;
            totalWeight += weight;
        }
        const recentResponsiveness = totalWeight > 0 ? weightedScore / totalWeight : averageResponsiveness;
        return Math.round((recentResponsiveness * 0.7 + averageResponsiveness * 0.3) * 100) / 100;
    }
    calculateParticipationScore(memories) {
        if (memories.length === 0)
            return 0.0;
        let totalParticipationScore = 0;
        let validMemories = 0;
        for (const memory of memories) {
            let participationScore = 0;
            const daysSinceSession = Math.floor((Date.now() - new Date(memory.conversationDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceSession <= 7) {
                participationScore += 0.25;
            }
            else if (daysSinceSession <= 14) {
                participationScore += 0.15;
            }
            else if (daysSinceSession <= 30) {
                participationScore += 0.05;
            }
            const contentLength = memory.content?.length || 0;
            if (contentLength > 1000) {
                participationScore += 0.35;
            }
            else if (contentLength > 500) {
                participationScore += 0.25;
            }
            else if (contentLength > 200) {
                participationScore += 0.15;
            }
            else {
                participationScore += 0.05;
            }
            const actionItems = memory.coachingContext.actionItems || [];
            if (actionItems.length > 0) {
                participationScore += 0.15;
                if (memory.coachingContext.followUpNeeded) {
                    participationScore += 0.10;
                }
            }
            const sentimentStrength = Math.abs(memory.emotionalContext.sentiment || 0);
            participationScore += sentimentStrength * 0.15;
            if (memory.importance >= 8) {
                participationScore += 0.05;
            }
            const insightsCount = memory.insightsGenerated?.length || 0;
            if (insightsCount >= 5) {
                participationScore += 0.03;
            }
            participationScore = Math.min(1.0, participationScore);
            totalParticipationScore += participationScore;
            validMemories++;
        }
        const baseScore = validMemories > 0 ? totalParticipationScore / validMemories : 0;
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        const recentSessions = memories.filter(m => new Date(m.conversationDate).getTime() >= thirtyDaysAgo).length;
        let consistencyMultiplier = 1.0;
        if (recentSessions >= 12) {
            consistencyMultiplier = 1.15;
        }
        else if (recentSessions >= 8) {
            consistencyMultiplier = 1.10;
        }
        else if (recentSessions >= 4) {
            consistencyMultiplier = 1.05;
        }
        else if (recentSessions >= 2) {
            consistencyMultiplier = 1.0;
        }
        else if (recentSessions >= 1) {
            consistencyMultiplier = 0.9;
        }
        else {
            consistencyMultiplier = 0.7;
        }
        const streakCount = this.calculateStreakCount(memories);
        let streakBonus = 0;
        if (streakCount >= 7) {
            streakBonus = 0.1;
        }
        else if (streakCount >= 3) {
            streakBonus = 0.05;
        }
        const finalScore = Math.min(1.0, (baseScore * consistencyMultiplier) + streakBonus);
        return Math.round(finalScore * 100) / 100;
    }
    calculateFollowThroughRate(goals) {
        if (goals.length === 0)
            return 0.5;
        const completedActions = goals.reduce((sum, goal) => sum + goal.coachingData.actionItems.filter(item => item.status === 'completed').length, 0);
        const totalActions = goals.reduce((sum, goal) => sum + goal.coachingData.actionItems.length, 0);
        return totalActions > 0 ? completedActions / totalActions : 0.5;
    }
    calculateAvatarEffectiveness(_memories) {
        return 0.7;
    }
    calculateSkillImprovement(_memories) {
        return 0.6;
    }
    calculateConfidenceIncrease(_memories) {
        return 0.7;
    }
    calculateStressReduction(_memories) {
        return 0.5;
    }
    calculateHabitFormation(_goals) {
        return 0.6;
    }
    calculatePreferredTime(_memories) {
        return 'morning';
    }
    analyzeCommunicationStyle(_memories) {
        return 'supportive';
    }
    extractTopicsOfInterest(_memories) {
        return ['goal-setting', 'productivity', 'wellness'];
    }
    extractChallengeAreas(_memories) {
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
        return {
            visualLearner: 0.4,
            auditoryLearner: 0.4,
            kinestheticLearner: 0.2,
        };
    }
    calculateSatisfactionScore(_memories) {
        return 7.5;
    }
    calculateRetentionProbability(_memories, _goals) {
        return 0.8;
    }
    calculateChurnRisk(_memories, _goals) {
        return 0.2;
    }
    identifyStrengthAreas(_memories, _goals) {
        return ['goal-setting', 'communication'];
    }
    identifyImprovementAreas(_memories, _goals) {
        return ['consistency', 'follow-through'];
    }
    predictOutcomes(_memories, _goals) {
        return ['Likely to achieve primary goal', 'May need additional support for consistency'];
    }
    identifyRiskFactors(_memories, _goals) {
        return ['Low engagement', 'Overambitious goals'];
    }
    calculateDataQualityScore(_memories, _goals) {
        return 0.8;
    }
    analyzeEmotionalPatterns(_memories) {
        return {
            concerningTrends: [],
            positiveTrends: ['increased confidence'],
        };
    }
    calculateWeeklyGoalProgress(_goals, _weekStart, _weekEnd) {
        return 0.7;
    }
    calculateMoodTrend(_memories) {
        return 'improving';
    }
    extractAchievements(_memories, _goals) {
        return ['Completed daily meditation goal', 'Improved time management'];
    }
    extractChallenges(_memories, _goals) {
        return ['Maintaining consistency', 'Balancing multiple priorities'];
    }
    async generateWeeklyInsights(_memories, _analytics) {
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