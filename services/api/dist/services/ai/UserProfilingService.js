"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userProfilingService = exports.UserProfilingService = void 0;
const sequelize_1 = require("sequelize");
const Chat_1 = require("../../models/Chat");
const ChatMessage_1 = require("../../models/ChatMessage");
const Goal_1 = require("../../models/Goal");
const Mood_1 = require("../../models/Mood");
const Task_1 = require("../../models/Task");
const User_1 = require("../../models/User");
const UserProfile_1 = require("../../models/UserProfile");
const logger_1 = require("../../utils/logger");
const AIService_1 = require("./AIService");
class UserProfilingService {
    async createOrUpdateProfile(userId) {
        try {
            let profile = await UserProfile_1.UserProfile.findOne({ where: { userId } });
            if (!profile) {
                profile = await UserProfile_1.UserProfile.create({
                    userId,
                    learningStyle: 'balanced',
                    communicationPreference: 'supportive',
                    coachingPreferences: {
                        preferredMethods: ['goal', 'habit', 'reflection'],
                        sessionFrequency: 'weekly',
                        sessionDuration: 30,
                        preferredTimes: ['morning', 'evening'],
                        focusAreas: ['productivity', 'wellbeing'],
                    },
                    behaviorPatterns: {
                        avgSessionDuration: 0,
                        completionRate: 0,
                        engagementLevel: 0,
                        preferredTopics: [],
                        responseTime: 0,
                        consistencyScore: 0,
                    },
                    progressMetrics: {
                        totalGoalsSet: 0,
                        goalsCompleted: 0,
                        currentStreak: 0,
                        longestStreak: 0,
                        totalSessions: 0,
                        accountAge: 0,
                        lastActiveDate: new Date(),
                    },
                    strengths: [],
                    growthAreas: [],
                    motivators: [],
                    obstacles: [],
                });
            }
            await this.updateProfileMetrics(profile);
            await this.analyzeUserBehavior(profile);
            await this.identifyPatternsAndInsights(profile);
            return profile;
        }
        catch (error) {
            logger_1.logger.error('Error creating/updating user profile:', error);
            throw error;
        }
    }
    async updateProfileMetrics(profile) {
        const user = await User_1.User.findByPk(profile.userId);
        if (!user)
            return;
        const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const goals = await Goal_1.Goal.findAll({ where: { userId: profile.userId } });
        const completedGoals = goals.filter(g => g.status === 'completed');
        const tasks = await Task_1.Task.findAll({
            where: {
                userId: profile.userId,
                updatedAt: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            },
        });
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;
        const currentStreak = await this.calculateCurrentStreak(profile.userId);
        const longestStreak = Math.max(currentStreak, profile.progressMetrics?.longestStreak || 0);
        const sessions = await Chat_1.Chat.findAll({
            where: { userId: profile.userId },
            include: [
                {
                    model: ChatMessage_1.ChatMessage,
                    as: 'messages',
                },
            ],
        });
        const totalSessions = sessions.length;
        const avgSessionDuration = this.calculateAvgSessionDuration(sessions);
        profile.progressMetrics = {
            totalGoalsSet: goals.length,
            goalsCompleted: completedGoals.length,
            currentStreak,
            longestStreak,
            totalSessions,
            accountAge,
            lastActiveDate: new Date(),
        };
        if (profile.behaviorPatterns) {
            profile.behaviorPatterns.completionRate = Math.round(completionRate * 100);
            profile.behaviorPatterns.avgSessionDuration = avgSessionDuration;
        }
        await profile.save();
    }
    async analyzeUserBehavior(profile) {
        const recentMessages = await ChatMessage_1.ChatMessage.findAll({
            include: [
                {
                    model: Chat_1.Chat,
                    as: 'chat',
                    where: { userId: profile.userId },
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: 100,
        });
        if (recentMessages.length > 0) {
            const patterns = await this.analyzeMessagePatterns(recentMessages);
            if (profile.behaviorPatterns) {
                profile.behaviorPatterns.preferredTopics = patterns.topics;
                profile.behaviorPatterns.responseTime = patterns.avgResponseTime;
                profile.behaviorPatterns.engagementLevel = patterns.engagementLevel;
            }
        }
        const recentMoods = await Mood_1.Mood.findAll({
            where: {
                userId: profile.userId,
                createdAt: {
                    [sequelize_1.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            },
            order: [['createdAt', 'DESC']],
        });
        if (recentMoods.length > 0) {
            const moodPatterns = this.analyzeMoodPatterns(recentMoods);
            profile.metadata = {
                ...profile.metadata,
                moodPatterns,
            };
        }
        await profile.save();
    }
    async identifyPatternsAndInsights(profile) {
        const userContext = {
            progressMetrics: profile.progressMetrics,
            behaviorPatterns: profile.behaviorPatterns,
            metadata: profile.metadata,
        };
        const insights = await this.generateAIInsights(userContext);
        if (insights.learningStyle && insights.learningStyle !== profile.learningStyle) {
            profile.learningStyle = insights.learningStyle;
        }
        if (insights.communicationPreference &&
            insights.communicationPreference !== profile.communicationPreference) {
            profile.communicationPreference = insights.communicationPreference;
        }
        if (insights.strengths.length > 0) {
            profile.strengths = [...new Set([...(profile.strengths || []), ...insights.strengths])];
        }
        if (insights.growthAreas.length > 0) {
            profile.growthAreas = [...new Set([...(profile.growthAreas || []), ...insights.growthAreas])];
        }
        if (insights.motivators.length > 0) {
            profile.motivators = [...new Set([...(profile.motivators || []), ...insights.motivators])];
        }
        if (insights.obstacles.length > 0) {
            profile.obstacles = [...new Set([...(profile.obstacles || []), ...insights.obstacles])];
        }
        await profile.save();
    }
    async calculateCurrentStreak(userId) {
        const tasks = await Task_1.Task.findAll({
            where: {
                userId,
                status: 'completed',
                completedAt: {
                    [sequelize_1.Op.ne]: null,
                },
            },
            order: [['completedAt', 'DESC']],
        });
        if (tasks.length === 0)
            return 0;
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDate = new Date(today);
        while (true) {
            const tasksOnDate = tasks.filter(t => {
                const taskDate = new Date(t.completedAt);
                taskDate.setHours(0, 0, 0, 0);
                return taskDate.getTime() === currentDate.getTime();
            });
            if (tasksOnDate.length === 0) {
                if (currentDate.getTime() === today.getTime() && streak > 0) {
                    currentDate.setDate(currentDate.getDate() - 1);
                    continue;
                }
                break;
            }
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }
        return streak;
    }
    calculateAvgSessionDuration(sessions) {
        if (sessions.length === 0)
            return 0;
        const durations = sessions.map(session => {
            if (!session.messages || session.messages.length < 2)
                return 0;
            const firstMessage = session.messages[session.messages.length - 1];
            const lastMessage = session.messages[0];
            return ((new Date(lastMessage.createdAt).getTime() - new Date(firstMessage.createdAt).getTime()) /
                (1000 * 60));
        });
        const validDurations = durations.filter(d => d > 0 && d < 120);
        if (validDurations.length === 0)
            return 0;
        return Math.round(validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length);
    }
    async analyzeMessagePatterns(messages) {
        const userMessages = messages.filter((m) => m.role === 'user');
        const topicKeywords = {
            goals: ['goal', 'objective', 'target', 'achieve', 'plan'],
            habits: ['habit', 'routine', 'daily', 'practice', 'consistency'],
            productivity: ['productivity', 'efficient', 'task', 'time', 'focus'],
            wellbeing: ['mood', 'stress', 'happy', 'anxious', 'energy', 'health'],
            motivation: ['motivation', 'inspire', 'drive', 'passion', 'purpose'],
            progress: ['progress', 'improvement', 'growth', 'development', 'success'],
        };
        const topicCounts = {};
        userMessages.forEach(msg => {
            const content = msg.content.toLowerCase();
            Object.entries(topicKeywords).forEach(([topic, keywords]) => {
                if (keywords.some(keyword => content.includes(keyword))) {
                    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
                }
            });
        });
        const preferredTopics = Object.entries(topicCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([topic]) => topic);
        const responseTimes = [];
        for (let i = 1; i < messages.length; i++) {
            if (messages[i].role === 'user' && messages[i - 1].role === 'assistant') {
                const timeDiff = (new Date(messages[i].createdAt).getTime() -
                    new Date(messages[i - 1].createdAt).getTime()) /
                    (1000 * 60);
                if (timeDiff > 0 && timeDiff < 60) {
                    responseTimes.push(timeDiff);
                }
            }
        }
        const avgResponseTime = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
            : 10;
        const messagesPerSession = messages.length / Math.max(1, messages.filter((m) => m.isFirstInSession).length);
        const avgMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / Math.max(1, userMessages.length);
        const engagementLevel = Math.min(100, Math.round(messagesPerSession * 2 +
            Math.min(avgMessageLength / 10, 10) * 3 +
            preferredTopics.length * 10));
        return {
            topics: preferredTopics,
            avgResponseTime,
            engagementLevel,
        };
    }
    analyzeMoodPatterns(moods) {
        const moodCounts = {};
        let totalEnergy = 0;
        moods.forEach(mood => {
            moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
            totalEnergy += mood.energy || 5;
        });
        const dominantMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';
        const avgEnergy = Math.round(totalEnergy / moods.length);
        const recentMoods = moods.slice(0, 7);
        const olderMoods = moods.slice(7, 14);
        const recentAvgEnergy = recentMoods.reduce((sum, m) => sum + (m.energy || 5), 0) / Math.max(1, recentMoods.length);
        const olderAvgEnergy = olderMoods.reduce((sum, m) => sum + (m.energy || 5), 0) / Math.max(1, olderMoods.length);
        const energyTrend = recentAvgEnergy > olderAvgEnergy
            ? 'improving'
            : recentAvgEnergy < olderAvgEnergy
                ? 'declining'
                : 'stable';
        return {
            dominantMood,
            avgEnergy,
            energyTrend,
            moodVariability: Object.keys(moodCounts).length,
        };
    }
    async generateAIInsights(userContext) {
        const prompt = `Analyze this user profile data and provide insights:

Progress Metrics:
${JSON.stringify(userContext.progressMetrics, null, 2)}

Behavior Patterns:
${JSON.stringify(userContext.behaviorPatterns, null, 2)}

Additional Data:
${JSON.stringify(userContext.metadata, null, 2)}

Based on this data, provide a JSON response with:
1. learningStyle: (visual, auditory, kinesthetic, reading, or balanced)
2. communicationPreference: (supportive, direct, analytical, motivational, or empathetic)
3. personalityTraits: array of 3-5 personality traits
4. strengths: array of 3-5 identified strengths
5. growthAreas: array of 2-3 areas for improvement
6. motivators: array of 2-3 key motivators
7. obstacles: array of 1-2 main obstacles
8. recommendations: array of 3-5 personalized recommendations

Consider completion rates, consistency, engagement patterns, and mood data in your analysis.`;
        try {
            const response = await AIService_1.aiService.generateResponse([
                {
                    role: 'system',
                    content: 'You are an expert behavioral analyst specializing in user profiling and personalized coaching recommendations. Always respond with valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ], {
                temperature: 0.3,
                maxTokens: 1000,
            });
            const insights = JSON.parse(response.content);
            return insights;
        }
        catch (error) {
            logger_1.logger.error('Error generating AI insights:', error);
            return {
                learningStyle: 'balanced',
                communicationPreference: 'supportive',
                personalityTraits: ['consistent', 'goal-oriented'],
                strengths: ['dedication', 'self-awareness'],
                growthAreas: ['consistency', 'goal completion'],
                motivators: ['progress tracking', 'achievement'],
                obstacles: ['time management'],
                recommendations: ['Set smaller, achievable goals', 'Focus on daily habits'],
            };
        }
    }
    async getProfileInsights(userId) {
        const profile = await this.createOrUpdateProfile(userId);
        const insights = [];
        if (profile.learningStyle !== 'balanced') {
            insights.push({
                category: 'Learning Style',
                insight: `You appear to be a ${profile.learningStyle} learner. We'll adapt coaching to include more ${this.getLearningStyleRecommendations(profile.learningStyle || 'balanced')}.`,
                confidence: 0.8,
                evidence: ['Based on your interaction patterns', 'Derived from content preferences'],
            });
        }
        if (profile.behaviorPatterns?.consistencyScore &&
            profile.behaviorPatterns?.consistencyScore > 70) {
            insights.push({
                category: 'Consistency',
                insight: 'Your consistency is excellent! You engage regularly, which is key to achieving your goals.',
                confidence: 0.9,
                evidence: [
                    `${profile.behaviorPatterns?.consistencyScore}% consistency score`,
                    `${profile.progressMetrics?.currentStreak} day streak`,
                ],
            });
        }
        else if (profile.behaviorPatterns?.consistencyScore &&
            profile.behaviorPatterns?.consistencyScore < 40) {
            insights.push({
                category: 'Consistency',
                insight: 'Building consistency could accelerate your progress. Consider setting daily reminders.',
                confidence: 0.85,
                evidence: [
                    `${profile.behaviorPatterns?.consistencyScore}% consistency score`,
                    'Irregular engagement patterns',
                ],
            });
        }
        if (profile.behaviorPatterns?.engagementLevel &&
            profile.behaviorPatterns?.engagementLevel > 70) {
            insights.push({
                category: 'Engagement',
                insight: 'Your high engagement level shows strong commitment. Keep up the great work!',
                confidence: 0.85,
                evidence: [
                    `${profile.behaviorPatterns?.engagementLevel}% engagement level`,
                    'Active participation in sessions',
                ],
            });
        }
        if (profile.behaviorPatterns?.preferredTopics &&
            profile.behaviorPatterns?.preferredTopics.length > 0) {
            insights.push({
                category: 'Focus Areas',
                insight: `You're most interested in ${profile.behaviorPatterns?.preferredTopics?.join(', ')}. We'll prioritize content in these areas.`,
                confidence: 0.75,
                evidence: ['Derived from conversation history', 'Based on goal categories'],
            });
        }
        if (profile.strengths && profile.strengths.length > 0) {
            insights.push({
                category: 'Strengths',
                insight: `Your key strengths include ${profile.strengths?.slice(0, 3).join(', ')}. Leverage these for faster progress.`,
                confidence: 0.8,
                evidence: [
                    'Identified through behavioral analysis',
                    'Consistent demonstration in activities',
                ],
            });
        }
        if (profile.growthAreas && profile.growthAreas.length > 0) {
            insights.push({
                category: 'Growth Opportunities',
                insight: `Focus on developing ${profile.growthAreas[0]} to unlock your next level of growth.`,
                confidence: 0.75,
                evidence: ['Area with most improvement potential', 'Common challenge in your journey'],
            });
        }
        return insights;
    }
    getLearningStyleRecommendations(style) {
        const recommendations = {
            visual: 'visual aids, charts, and progress visualizations',
            auditory: 'voice notes, discussions, and audio content',
            kinesthetic: 'hands-on exercises and practical applications',
            reading: 'detailed written guides and documentation',
            balanced: 'varied content formats',
        };
        return recommendations[style] || recommendations.balanced;
    }
    async updateUserPreferences(userId, preferences) {
        const profile = await this.createOrUpdateProfile(userId);
        if (preferences.learningStyle) {
            profile.learningStyle = preferences.learningStyle;
        }
        if (preferences.communicationPreference) {
            profile.communicationPreference = preferences.communicationPreference;
        }
        if (preferences.coachingPreferences) {
            profile.coachingPreferences = {
                ...profile.coachingPreferences,
                ...preferences.coachingPreferences,
            };
        }
        if (preferences.focusAreas) {
            if (profile.coachingPreferences) {
                profile.coachingPreferences.focusAreas = preferences.focusAreas;
            }
        }
        await profile.save();
        return profile;
    }
    async getPersonalizedRecommendations(userId) {
        const profile = await this.createOrUpdateProfile(userId);
        const recommendations = [];
        if (profile.behaviorPatterns?.completionRate && profile.behaviorPatterns?.completionRate < 50) {
            recommendations.push('Break down your goals into smaller, more manageable tasks');
            recommendations.push('Start with just one small habit to build momentum');
        }
        if (profile.behaviorPatterns?.consistencyScore &&
            profile.behaviorPatterns?.consistencyScore < 40) {
            recommendations.push('Set a specific time each day for your coaching check-in');
            recommendations.push('Use reminders to maintain your momentum');
        }
        if (profile.behaviorPatterns?.engagementLevel &&
            profile.behaviorPatterns?.engagementLevel < 30) {
            recommendations.push('Try voice journaling for a more natural interaction');
            recommendations.push('Explore different coaching methods to find what resonates');
        }
        if (profile.progressMetrics?.currentStreak && profile.progressMetrics?.currentStreak > 7) {
            recommendations.push('Your streak is impressive! Consider increasing your goal difficulty');
            recommendations.push('Share your success to inspire others and reinforce your commitment');
        }
        profile.behaviorPatterns?.preferredTopics?.forEach(topic => {
            switch (topic) {
                case 'productivity':
                    recommendations.push('Try time-blocking technique for better task management');
                    break;
                case 'wellbeing':
                    recommendations.push('Incorporate 5-minute mindfulness breaks into your routine');
                    break;
                case 'habits':
                    recommendations.push('Stack new habits onto existing ones for easier adoption');
                    break;
                case 'goals':
                    recommendations.push('Review and adjust your goals monthly to stay aligned');
                    break;
            }
        });
        return recommendations.slice(0, 5);
    }
    async assessReadinessLevel(userId) {
        const profile = await this.createOrUpdateProfile(userId);
        let score = 0;
        score += Math.min((profile.progressMetrics?.accountAge || 0) / 5, 20);
        score += ((profile.behaviorPatterns?.consistencyScore || 0) / 100) * 30;
        score += ((profile.behaviorPatterns?.completionRate || 0) / 100) * 25;
        score += ((profile.behaviorPatterns?.engagementLevel || 0) / 100) * 15;
        const goalCompletionRate = (profile.progressMetrics?.totalGoalsSet || 0) > 0
            ? (profile.progressMetrics?.goalsCompleted || 0) /
                (profile.progressMetrics?.totalGoalsSet || 1)
            : 0;
        score += goalCompletionRate * 10;
        let level;
        let reasoning;
        let nextSteps = [];
        if (score < 30) {
            level = 'beginner';
            reasoning =
                "You're just getting started on your journey. Focus on building consistent habits.";
            nextSteps = [
                'Complete your first week streak',
                'Set one simple, achievable goal',
                'Explore different coaching methods',
                'Establish a daily check-in routine',
            ];
        }
        else if (score < 70) {
            level = 'intermediate';
            reasoning =
                "You've built a foundation. Now it's time to challenge yourself and deepen your practice.";
            nextSteps = [
                'Increase goal complexity',
                'Mentor or inspire others',
                'Track advanced metrics',
                'Develop expertise in focus areas',
            ];
        }
        else {
            level = 'advanced';
            reasoning = "You're a seasoned practitioner. Focus on optimization and helping others grow.";
            nextSteps = [
                'Set ambitious stretch goals',
                'Share your success strategies',
                'Become a community leader',
                'Master advanced techniques',
            ];
        }
        return { level, reasoning, nextSteps };
    }
}
exports.UserProfilingService = UserProfilingService;
exports.userProfilingService = new UserProfilingService();
//# sourceMappingURL=UserProfilingService.js.map