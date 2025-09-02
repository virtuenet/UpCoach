"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextManager = exports.ContextManager = void 0;
const Goal_1 = require("../../models/Goal");
const User_1 = require("../../models/User");
const Mood_1 = require("../../models/Mood");
const Task_1 = require("../../models/Task");
const ChatMessage_1 = require("../../models/ChatMessage");
const sequelize_1 = require("sequelize");
const logger_1 = require("../../utils/logger");
class ContextManager {
    contextCache;
    CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    constructor() {
        this.contextCache = new Map();
    }
    async getUserContext(userId) {
        // Check cache first
        const cached = this.contextCache.get(userId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.context;
        }
        try {
            // Fetch user data
            const user = await User_1.User.findByPk(userId, {
                attributes: ['id', 'name', 'email', 'preferences', 'createdAt'],
            });
            if (!user) {
                throw new Error('User not found');
            }
            // Fetch current goals
            const goals = await Goal_1.Goal.findAll({
                where: {
                    userId,
                    status: 'active',
                },
                order: [
                    ['priority', 'ASC'],
                    ['createdAt', 'DESC'],
                ],
                limit: 5,
            });
            // Fetch recent moods
            const recentMoods = await Mood_1.Mood.findAll({
                where: {
                    userId,
                    createdAt: {
                        [sequelize_1.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    },
                },
                order: [['createdAt', 'DESC']],
                limit: 7,
            });
            // Fetch recent tasks
            const recentTasks = await Task_1.Task.findAll({
                where: {
                    userId,
                    updatedAt: {
                        [sequelize_1.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                    },
                },
                order: [['updatedAt', 'DESC']],
                limit: 10,
            });
            // Fetch recent conversations
            const recentMessages = await ChatMessage_1.ChatMessage.findAll({
                where: {
                    chatId: {
                        [sequelize_1.Op.in]: database_1.sequelize.literal(`(SELECT id FROM chats WHERE user_id = '${userId}' ORDER BY updated_at DESC LIMIT 5)`),
                    },
                },
                order: [['createdAt', 'DESC']],
                limit: 20,
            });
            // Build context
            const context = await this.buildUserContext(user, goals, recentMoods, recentTasks, recentMessages);
            // Cache the context
            this.contextCache.set(userId, {
                context,
                timestamp: Date.now(),
            });
            return context;
        }
        catch (error) {
            logger_1.logger.error('Error building user context:', error);
            return this.getDefaultContext(userId);
        }
    }
    async buildUserContext(user, goals, moods, tasks, messages) {
        const preferences = user.preferences || {};
        // Calculate current mood and energy
        const currentMood = moods.length > 0 ? moods[0].mood : 'neutral';
        const avgEnergy = moods.length > 0 ? moods.reduce((sum, m) => sum + (m.energy || 5), 0) / moods.length : 5;
        // Calculate streak days
        const streakDays = this.calculateStreakDays(tasks);
        // Extract recent progress
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const recentProgress = completedTasks.length > 0
            ? `Completed ${completedTasks.length} tasks recently`
            : 'No recent task completions';
        // Determine progress stage
        const accountAge = Date.now() - new Date(user.createdAt).getTime();
        const progressStage = this.determineProgressStage(accountAge, goals.length, streakDays);
        // Extract patterns from conversations
        const patterns = await this.extractConversationPatterns(messages);
        return {
            userId: user.id,
            userName: user.name,
            userGoals: goals.map(g => ({
                id: g.id,
                title: g.title,
                description: g.description,
                progress: g.progress,
                targetDate: g.targetDate,
            })),
            recentProgress,
            currentMood,
            streakDays,
            learningStyle: preferences.learningStyle || 'balanced',
            communicationPreference: preferences.communicationStyle || 'supportive',
            energyLevel: Math.round(avgEnergy),
            progressStage,
            currentGoal: goals[0]
                ? {
                    description: goals[0].description,
                    currentState: `${goals[0].progress}% complete`,
                    timeline: goals[0].targetDate,
                }
                : null,
            targetHabit: this.extractTargetHabit(goals, tasks),
            dailyRoutine: {
                summary: this.summarizeDailyRoutine(tasks),
            },
            metrics: {
                motivationLevel: this.calculateMotivationLevel(moods, tasks),
                consistencyScore: this.calculateConsistencyScore(tasks),
                engagementLevel: this.calculateEngagementLevel(messages),
            },
            todayAccomplishments: this.getTodayAccomplishments(tasks),
            todayChallenges: this.extractChallenges(messages),
            currentChallenge: this.identifyCurrentChallenge(goals, tasks, messages),
            availableResources: this.identifyAvailableResources(user),
            preferredMethods: preferences.coachingMethods || ['goal', 'habit', 'reflection'],
            recentConversations: this.summarizeRecentConversations(messages),
            achievements: await this.getUserAchievements(user.id),
            patterns,
        };
    }
    calculateStreakDays(tasks) {
        if (tasks.length === 0)
            return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let streak = 0;
        let currentDate = new Date(today);
        while (true) {
            const tasksOnDate = tasks.filter(t => {
                const taskDate = new Date(t.completedAt || t.updatedAt);
                taskDate.setHours(0, 0, 0, 0);
                return taskDate.getTime() === currentDate.getTime() && t.status === 'completed';
            });
            if (tasksOnDate.length === 0 && streak > 0) {
                break;
            }
            if (tasksOnDate.length > 0) {
                streak++;
            }
            currentDate.setDate(currentDate.getDate() - 1);
            if (currentDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
                break; // Don't look back more than 30 days
            }
        }
        return streak;
    }
    determineProgressStage(accountAge, goalCount, streakDays) {
        const days = accountAge / (24 * 60 * 60 * 1000);
        if (days < 7)
            return 'onboarding';
        if (days < 30)
            return 'early';
        if (streakDays > 21 && goalCount > 3)
            return 'advanced';
        if (streakDays > 7 || goalCount > 1)
            return 'developing';
        return 'exploring';
    }
    extractTargetHabit(goals, tasks) {
        // Look for habit-related goals
        const habitGoal = goals.find(g => g.title.toLowerCase().includes('habit') || g.category === 'habit');
        if (habitGoal) {
            return {
                name: habitGoal.title,
                description: habitGoal.description,
                progress: habitGoal.progress,
            };
        }
        // Infer from repeated tasks
        const taskTitles = tasks.map((t) => t.title.toLowerCase());
        const frequencies = taskTitles.reduce((acc, title) => {
            acc[title] = (acc[title] || 0) + 1;
            return acc;
        }, {});
        const mostFrequent = Object.entries(frequencies).sort(([, a], [, b]) => b - a)[0];
        if (mostFrequent && mostFrequent[1] > 2) {
            return {
                name: mostFrequent[0],
                description: 'Frequently performed task',
                progress: (mostFrequent[1] / 30) * 100,
            };
        }
        return null;
    }
    summarizeDailyRoutine(tasks) {
        const tasksByHour = tasks.reduce((acc, task) => {
            const hour = new Date(task.createdAt).getHours();
            const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
            acc[period] = (acc[period] || 0) + 1;
            return acc;
        }, {});
        const mostActiveTime = Object.entries(tasksByHour).sort(([, a], [, b]) => b - a)[0];
        return mostActiveTime ? `Most active in the ${mostActiveTime[0]}` : 'No clear routine pattern';
    }
    calculateMotivationLevel(moods, tasks) {
        const moodScore = moods.length > 0 ? moods.reduce((sum, m) => sum + (m.energy || 5), 0) / moods.length : 5;
        const taskCompletionRate = tasks.length > 0 ? tasks.filter(t => t.status === 'completed').length / tasks.length : 0.5;
        return Math.round(moodScore * 0.6 + taskCompletionRate * 10 * 0.4);
    }
    calculateConsistencyScore(tasks) {
        if (tasks.length === 0)
            return 0;
        const daysWithTasks = new Set(tasks.map((t) => new Date(t.createdAt).toDateString())).size;
        const dayRange = 7; // Look at last 7 days
        return Math.round((daysWithTasks / dayRange) * 100);
    }
    calculateEngagementLevel(messages) {
        if (messages.length === 0)
            return 0;
        const recentMessages = messages.filter((m) => new Date(m.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        // Simple engagement score based on message frequency
        const score = Math.min(recentMessages.length / 20, 1) * 100;
        return Math.round(score);
    }
    getTodayAccomplishments(tasks) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTasks = tasks.filter(t => {
            const taskDate = new Date(t.completedAt || t.updatedAt);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === today.getTime() && t.status === 'completed';
        });
        if (todayTasks.length === 0)
            return 'No completions yet today';
        return todayTasks.map((t) => t.title).join(', ');
    }
    extractChallenges(messages) {
        // Look for challenge-related keywords in recent messages
        const challengeKeywords = ['struggle', 'difficult', 'hard', 'challenge', 'problem', 'stuck'];
        const challengeMessages = messages.filter((m) => challengeKeywords.some(keyword => m.content.toLowerCase().includes(keyword)));
        if (challengeMessages.length === 0)
            return 'No specific challenges mentioned';
        // Extract the most recent challenge mention
        return 'Recent challenges discussed in conversations';
    }
    identifyCurrentChallenge(goals, tasks, messages) {
        // Look for stalled goals
        const stalledGoal = goals.find(g => g.progress < 50 && new Date(g.updatedAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        if (stalledGoal) {
            return {
                description: `Making progress on: ${stalledGoal.title}`,
                previousAttempts: 'Multiple attempts recorded',
                successCriteria: `Reach ${stalledGoal.targetProgress || 100}% completion`,
            };
        }
        return null;
    }
    identifyAvailableResources(user) {
        const resources = ['AI coaching', 'goal tracking', 'habit formation tools'];
        if (user.subscription?.plan === 'premium') {
            resources.push('premium coaching features', 'advanced analytics');
        }
        return resources.join(', ');
    }
    summarizeRecentConversations(messages) {
        // Group messages by conversation
        const conversations = {};
        messages.forEach(msg => {
            if (!conversations[msg.chatId]) {
                conversations[msg.chatId] = [];
            }
            conversations[msg.chatId].push(msg);
        });
        return Object.values(conversations).map(msgs => ({
            messageCount: msgs.length,
            lastMessage: msgs[0]?.createdAt,
            topics: this.extractTopics(msgs),
        }));
    }
    extractTopics(messages) {
        // Simple topic extraction based on keywords
        const topicKeywords = {
            goals: ['goal', 'objective', 'target', 'aim'],
            habits: ['habit', 'routine', 'daily', 'practice'],
            productivity: ['productivity', 'efficient', 'task', 'time'],
            wellbeing: ['mood', 'stress', 'happy', 'anxious', 'energy'],
            progress: ['progress', 'achievement', 'complete', 'success'],
        };
        const foundTopics = new Set();
        messages.forEach(msg => {
            const content = msg.content.toLowerCase();
            Object.entries(topicKeywords).forEach(([topic, keywords]) => {
                if (keywords.some(keyword => content.includes(keyword))) {
                    foundTopics.add(topic);
                }
            });
        });
        return Array.from(foundTopics);
    }
    async extractConversationPatterns(messages) {
        const patterns = {
            preferredTopics: this.extractTopics(messages),
            communicationFrequency: this.calculateCommunicationFrequency(messages),
            averageMessageLength: this.calculateAverageMessageLength(messages),
            timePreferences: this.extractTimePreferences(messages),
        };
        return patterns;
    }
    calculateCommunicationFrequency(messages) {
        if (messages.length === 0)
            return 'none';
        const daysSinceFirst = Math.max(1, (Date.now() - new Date(messages[messages.length - 1].createdAt).getTime()) /
            (24 * 60 * 60 * 1000));
        const messagesPerDay = messages.length / daysSinceFirst;
        if (messagesPerDay < 1)
            return 'low';
        if (messagesPerDay < 5)
            return 'moderate';
        return 'high';
    }
    calculateAverageMessageLength(messages) {
        if (messages.length === 0)
            return 0;
        const userMessages = messages.filter((m) => m.role === 'user');
        const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0);
        return Math.round(totalLength / userMessages.length);
    }
    extractTimePreferences(messages) {
        const hourCounts = {};
        messages.forEach(msg => {
            const hour = new Date(msg.createdAt).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const preferredHours = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
        return {
            preferredHours,
            mostActiveTime: preferredHours[0]
                ? preferredHours[0] < 12
                    ? 'morning'
                    : preferredHours[0] < 17
                        ? 'afternoon'
                        : 'evening'
                : 'no preference',
        };
    }
    async getUserAchievements(userId) {
        // This would connect to an achievements system
        // For now, return placeholder achievements based on context
        return [
            { type: 'streak', value: 7, name: 'Week Warrior' },
            { type: 'goals_completed', value: 5, name: 'Goal Getter' },
        ];
    }
    getDefaultContext(userId) {
        return {
            userId,
            userName: 'User',
            userGoals: [],
            recentProgress: 'No recent progress data',
            currentMood: 'neutral',
            streakDays: 0,
            learningStyle: 'balanced',
            communicationPreference: 'supportive',
            energyLevel: 5,
            progressStage: 'new',
            preferredMethods: ['goal', 'habit', 'reflection'],
        };
    }
    async enrichMessages(messages, context) {
        // Add contextual information to messages without modifying original content
        return messages.map((msg, index) => {
            if (msg.role === 'user' && index === messages.length - 1) {
                // Only enrich the last user message
                return {
                    ...msg,
                    _context: context,
                };
            }
            return msg;
        });
    }
    clearCache(userId) {
        if (userId) {
            this.contextCache.delete(userId);
        }
        else {
            this.contextCache.clear();
        }
    }
}
exports.ContextManager = ContextManager;
// Import sequelize instance
const database_1 = require("../../config/database");
exports.contextManager = new ContextManager();
//# sourceMappingURL=ContextManager.js.map