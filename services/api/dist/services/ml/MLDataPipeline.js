"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLDataPipeline = void 0;
const ioredis_1 = require("ioredis");
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
const User_1 = require("../../models/User");
const Goal_1 = require("../../models/Goal");
const Habit_1 = require("../../models/Habit");
const CoachMemory_1 = require("../../models/coaching/CoachMemory");
const UserAnalytics_1 = require("../../models/analytics/UserAnalytics");
const KpiTracker_1 = require("../../models/analytics/KpiTracker");
const logger_1 = require("../../utils/logger");
class MLDataPipeline extends events_1.EventEmitter {
    featureStore;
    featureEngineers;
    validationRules;
    featureCache;
    qualityMonitor;
    featureSelector;
    constructor() {
        super();
        this.featureStore = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_FEATURE_DB || '2'),
        });
        this.featureEngineers = new Map();
        this.validationRules = new Map();
        this.featureCache = new Map();
        this.qualityMonitor = new DataQualityMonitor();
        this.featureSelector = new FeatureSelector();
        this.initializeFeatureEngineers();
        this.initializeValidationRules();
    }
    initializeFeatureEngineers() {
        this.featureEngineers.set('engagement', {
            name: 'User Engagement Features',
            type: 'numeric',
            processor: this.extractEngagementFeatures.bind(this),
            normalizer: (v) => Math.min(1, v / 100),
        });
        this.featureEngineers.set('goal_progress', {
            name: 'Goal Progress Features',
            type: 'numeric',
            processor: this.extractGoalFeatures.bind(this),
            validator: (v) => v >= 0 && v <= 1,
        });
        this.featureEngineers.set('behavioral', {
            name: 'Behavioral Pattern Features',
            type: 'numeric',
            processor: this.extractBehavioralFeatures.bind(this),
        });
        this.featureEngineers.set('temporal', {
            name: 'Temporal Features',
            type: 'temporal',
            processor: this.extractTemporalFeatures.bind(this),
        });
        this.featureEngineers.set('text_embeddings', {
            name: 'Text Embedding Features',
            type: 'embedding',
            processor: this.extractTextEmbeddings.bind(this),
        });
        this.featureEngineers.set('habits', {
            name: 'Habit Features',
            type: 'numeric',
            processor: this.extractHabitFeatures.bind(this),
        });
        this.featureEngineers.set('emotional', {
            name: 'Emotional State Features',
            type: 'numeric',
            processor: this.extractEmotionalFeatures.bind(this),
        });
    }
    initializeValidationRules() {
        this.validationRules.set('user', [
            {
                field: 'userId',
                type: 'string',
                constraints: { required: true },
            },
            {
                field: 'createdAt',
                type: 'date',
                constraints: { required: true },
            },
        ]);
        this.validationRules.set('goal', [
            {
                field: 'progress',
                type: 'number',
                constraints: { min: 0, max: 100, required: true },
            },
            {
                field: 'status',
                type: 'string',
                constraints: { enum: ['active', 'completed', 'paused', 'failed'] },
            },
        ]);
        this.validationRules.set('metrics', [
            {
                field: 'engagement_score',
                type: 'number',
                constraints: { min: 0, max: 1 },
            },
            {
                field: 'consistency_score',
                type: 'number',
                constraints: { min: 0, max: 1 },
            },
        ]);
    }
    async processUserData(userId, options = {}) {
        const startTime = perf_hooks_1.performance.now();
        try {
            if (options.useCache) {
                const cached = await this.getCachedFeatures(userId);
                if (cached) {
                    logger_1.logger.info(`Using cached features for user ${userId}`);
                    return cached;
                }
            }
            const rawData = await this.collectRawData(userId);
            if (options.validate) {
                const validation = await this.validateData(rawData);
                if (!validation.isValid) {
                    throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
                }
            }
            const features = await this.engineerFeatures(rawData, options.features);
            const selectedFeatures = await this.selectFeatures(features);
            const normalizedFeatures = this.normalizeFeatures(selectedFeatures);
            const featureVector = {
                userId,
                timestamp: new Date(),
                features: normalizedFeatures.values,
                featureNames: normalizedFeatures.names,
                metadata: {
                    version: '1.0.0',
                    source: 'ml_pipeline',
                    processingTime: perf_hooks_1.performance.now() - startTime,
                },
            };
            await this.cacheFeatures(userId, featureVector);
            await this.qualityMonitor.checkDataQuality(featureVector);
            this.emit('features_processed', { userId, featureVector });
            return featureVector;
        }
        catch (error) {
            logger_1.logger.error('Feature processing failed', { userId, error });
            this.emit('processing_error', { userId, error });
            throw error;
        }
    }
    async batchProcessUsers(userIds, options = {}) {
        const batchSize = options.batchSize || 10;
        const results = [];
        if (options.parallel) {
            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch.map((userId) => this.processUserData(userId)));
                results.push(...batchResults);
            }
        }
        else {
            for (const userId of userIds) {
                const result = await this.processUserData(userId);
                results.push(result);
            }
        }
        return results;
    }
    async streamProcess(userId, eventData) {
        try {
            await this.updateIncrementalFeatures(userId, eventData);
            const features = await this.processUserData(userId, {
                useCache: false,
                validate: false,
            });
            this.emit('realtime_update', { userId, features });
        }
        catch (error) {
            logger_1.logger.error('Stream processing failed', { userId, error });
        }
    }
    async collectRawData(userId) {
        const [user, goals, habits, memories, analytics, kpis] = await Promise.all([
            User_1.User.findByPk(userId),
            Goal_1.Goal.findAll({ where: { userId } }),
            Habit_1.Habit.findAll({ where: { userId } }),
            CoachMemory_1.CoachMemory.findAll({
                where: { userId },
                order: [['conversationDate', 'DESC']],
                limit: 100,
            }),
            UserAnalytics_1.UserAnalytics.findOne({
                where: { userId },
                order: [['calculatedAt', 'DESC']],
            }),
            KpiTracker_1.KpiTracker.findAll({ where: { userId } }),
        ]);
        return {
            user,
            goals,
            habits,
            memories,
            analytics,
            kpis,
            metadata: {
                collectionTimestamp: new Date(),
                recordCounts: {
                    goals: goals.length,
                    habits: habits.length,
                    memories: memories.length,
                    kpis: kpis.length,
                },
            },
        };
    }
    async engineerFeatures(rawData, requestedFeatures) {
        const features = new Map();
        const featuresToGenerate = requestedFeatures || Array.from(this.featureEngineers.keys());
        for (const featureName of featuresToGenerate) {
            const engineer = this.featureEngineers.get(featureName);
            if (engineer) {
                try {
                    const featureValues = await engineer.processor(rawData);
                    features.set(featureName, Array.isArray(featureValues) ? featureValues : [featureValues]);
                }
                catch (error) {
                    logger_1.logger.warn(`Failed to generate feature ${featureName}`, error);
                    features.set(featureName, [0]);
                }
            }
        }
        return features;
    }
    extractEngagementFeatures(data) {
        const analytics = data.analytics;
        if (!analytics)
            return [0, 0, 0, 0, 0];
        return [
            analytics.engagementMetrics?.totalSessions || 0,
            analytics.engagementMetrics?.averageSessionDuration || 0,
            analytics.engagementMetrics?.streakCount || 0,
            analytics.engagementMetrics?.responsiveness || 0,
            analytics.engagementMetrics?.activeHours || 0,
        ];
    }
    extractGoalFeatures(data) {
        const goals = data.goals || [];
        const totalGoals = goals.length;
        const completedGoals = goals.filter((g) => g.status === 'completed').length;
        const activeGoals = goals.filter((g) => g.status === 'active').length;
        const avgProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0) / (totalGoals || 1);
        const overdueGoals = goals.filter((g) => new Date(g.deadline) < new Date() && g.status !== 'completed').length;
        return [
            totalGoals,
            completedGoals,
            activeGoals,
            avgProgress / 100,
            completedGoals / (totalGoals || 1),
            overdueGoals,
        ];
    }
    extractBehavioralFeatures(data) {
        const memories = data.memories || [];
        const habits = data.habits || [];
        const morningActivity = this.calculateTimeOfDayActivity(memories, 'morning');
        const eveningActivity = this.calculateTimeOfDayActivity(memories, 'evening');
        const weekendActivity = this.calculateWeekendActivity(memories);
        const habitConsistency = this.calculateHabitConsistency(habits);
        const engagementConsistency = this.calculateEngagementConsistency(memories);
        const recentMomentum = this.calculateRecentMomentum(memories);
        return [
            morningActivity,
            eveningActivity,
            weekendActivity,
            habitConsistency,
            engagementConsistency,
            recentMomentum,
        ];
    }
    extractTemporalFeatures(data) {
        const user = data.user;
        if (!user)
            return [0, 0, 0, 0, 0];
        const now = new Date();
        const createdAt = new Date(user.createdAt);
        const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const dayOfWeek = now.getDay() / 7;
        const hourOfDay = now.getHours() / 24;
        const dayOfMonth = now.getDate() / 31;
        const monthOfYear = now.getMonth() / 12;
        const lastActivity = data.memories?.[0]?.createdAt;
        const daysSinceLastActivity = lastActivity
            ? Math.floor((now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
        return [
            accountAge / 365,
            dayOfWeek,
            hourOfDay,
            dayOfMonth,
            monthOfYear,
            Math.min(1, daysSinceLastActivity / 30),
        ];
    }
    async extractTextEmbeddings(data) {
        const memories = data.memories || [];
        const textContent = memories
            .map((m) => m.content || '')
            .join(' ')
            .toLowerCase();
        const topics = {
            motivation: (textContent.match(/motivat|inspir|drive/g) || []).length,
            challenge: (textContent.match(/challeng|difficult|hard|struggle/g) || []).length,
            success: (textContent.match(/success|achieve|accomplish|win/g) || []).length,
            learning: (textContent.match(/learn|grow|develop|improve/g) || []).length,
            health: (textContent.match(/health|fitness|wellness|exercise/g) || []).length,
        };
        const total = Object.values(topics).reduce((sum, count) => sum + count, 1);
        return Object.values(topics).map(count => count / total);
    }
    extractHabitFeatures(data) {
        const habits = data.habits || [];
        const totalHabits = habits.length;
        const activeHabits = habits.filter((h) => h.status === 'active').length;
        const completionRate = habits.reduce((sum, h) => {
            const completed = h.completedDates?.length || 0;
            const total = h.targetDays || 1;
            return sum + (completed / total);
        }, 0) / (totalHabits || 1);
        const streakDays = Math.max(...habits.map((h) => h.currentStreak || 0), 0);
        const avgFrequency = habits.reduce((sum, h) => {
            return sum + (h.frequency === 'daily' ? 7 : h.frequency === 'weekly' ? 1 : 0.5);
        }, 0) / (totalHabits || 1);
        return [
            totalHabits,
            activeHabits,
            completionRate,
            streakDays / 100,
            avgFrequency / 7,
        ];
    }
    extractEmotionalFeatures(data) {
        const memories = data.memories || [];
        if (memories.length === 0)
            return [0.5, 0.5, 0.5, 0.5, 0.5];
        let totalSentiment = 0;
        let totalEnergy = 0;
        let totalStress = 0;
        let positiveCount = 0;
        let negativeCount = 0;
        for (const memory of memories) {
            const emotional = memory.emotionalContext || {};
            totalSentiment += emotional.sentiment || 0;
            totalEnergy += emotional.energy || 0;
            totalStress += emotional.stress || 0;
            if (emotional.sentiment > 0)
                positiveCount++;
            if (emotional.sentiment < 0)
                negativeCount++;
        }
        const count = memories.length;
        return [
            (totalSentiment / count + 1) / 2,
            (totalEnergy / count + 1) / 2,
            1 - (totalStress / count + 1) / 2,
            positiveCount / count,
            1 - negativeCount / count,
        ];
    }
    async selectFeatures(features) {
        return features;
    }
    normalizeFeatures(features) {
        const allValues = [];
        const allNames = [];
        for (const [name, values] of features) {
            for (let i = 0; i < values.length; i++) {
                allNames.push(`${name}_${i}`);
                allValues.push(this.normalizeValue(values[i]));
            }
        }
        return { values: allValues, names: allNames };
    }
    normalizeValue(value) {
        return Math.max(0, Math.min(1, value));
    }
    calculateTimeOfDayActivity(memories, timeOfDay) {
        const hourRanges = {
            morning: [6, 12],
            afternoon: [12, 18],
            evening: [18, 24],
            night: [0, 6],
        };
        const range = hourRanges[timeOfDay] || [0, 24];
        const relevantMemories = memories.filter((m) => {
            const hour = new Date(m.createdAt).getHours();
            return hour >= range[0] && hour < range[1];
        });
        return relevantMemories.length / (memories.length || 1);
    }
    calculateWeekendActivity(memories) {
        const weekendMemories = memories.filter((m) => {
            const day = new Date(m.createdAt).getDay();
            return day === 0 || day === 6;
        });
        return weekendMemories.length / (memories.length || 1);
    }
    calculateHabitConsistency(habits) {
        if (habits.length === 0)
            return 0;
        const consistencyScores = habits.map((h) => {
            const completedDays = h.completedDates?.length || 0;
            const expectedDays = h.targetDays || 1;
            return Math.min(1, completedDays / expectedDays);
        });
        return consistencyScores.reduce((sum, score) => sum + score, 0) / habits.length;
    }
    calculateEngagementConsistency(memories) {
        if (memories.length < 2)
            return 0;
        const intervals = [];
        for (let i = 1; i < memories.length; i++) {
            const current = new Date(memories[i].createdAt).getTime();
            const previous = new Date(memories[i - 1].createdAt).getTime();
            intervals.push(current - previous);
        }
        if (intervals.length === 0)
            return 0;
        const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
        const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        return Math.max(0, 1 - stdDev / avgInterval);
    }
    calculateRecentMomentum(memories) {
        if (memories.length === 0)
            return 0;
        const now = Date.now();
        const recentMemories = memories.filter((m) => {
            const age = now - new Date(m.createdAt).getTime();
            return age < 7 * 24 * 60 * 60 * 1000;
        });
        const olderMemories = memories.filter((m) => {
            const age = now - new Date(m.createdAt).getTime();
            return age >= 7 * 24 * 60 * 60 * 1000 && age < 14 * 24 * 60 * 60 * 1000;
        });
        if (olderMemories.length === 0)
            return recentMemories.length > 0 ? 1 : 0;
        return Math.min(1, recentMemories.length / olderMemories.length);
    }
    async getCachedFeatures(userId) {
        const key = `features:${userId}`;
        const cached = await this.featureStore.get(key);
        if (!cached)
            return null;
        try {
            const features = JSON.parse(cached);
            const age = Date.now() - new Date(features.timestamp).getTime();
            if (age > 3600000) {
                await this.featureStore.del(key);
                return null;
            }
            return features;
        }
        catch (error) {
            logger_1.logger.error('Failed to parse cached features', error);
            return null;
        }
    }
    async cacheFeatures(userId, features) {
        const key = `features:${userId}`;
        const ttl = 3600;
        await this.featureStore.setex(key, ttl, JSON.stringify(features));
    }
    async validateData(data) {
        const errors = [];
        if (!data.user) {
            errors.push('User data is missing');
        }
        if (data.analytics) {
            const age = Date.now() - new Date(data.analytics.calculatedAt).getTime();
            if (age > 24 * 60 * 60 * 1000) {
                errors.push('Analytics data is stale (>24 hours old)');
            }
        }
        if (data.memories && data.memories.length < 3) {
            errors.push('Insufficient memory data for accurate predictions');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    async updateIncrementalFeatures(userId, eventData) {
        const eventType = eventData.type;
        switch (eventType) {
            case 'goal_updated':
                await this.updateGoalFeatures(userId, eventData);
                break;
            case 'habit_completed':
                await this.updateHabitFeatures(userId, eventData);
                break;
            case 'session_completed':
                await this.updateEngagementFeatures(userId, eventData);
                break;
            default:
                logger_1.logger.warn(`Unknown event type: ${eventType}`);
        }
    }
    async updateGoalFeatures(userId, eventData) {
        logger_1.logger.info(`Updating goal features for user ${userId}`);
    }
    async updateHabitFeatures(userId, eventData) {
        logger_1.logger.info(`Updating habit features for user ${userId}`);
    }
    async updateEngagementFeatures(userId, eventData) {
        logger_1.logger.info(`Updating engagement features for user ${userId}`);
    }
}
exports.MLDataPipeline = MLDataPipeline;
class DataQualityMonitor {
    qualityReports;
    constructor() {
        this.qualityReports = new Map();
    }
    async checkDataQuality(features) {
        const issues = [];
        const missingCount = features.features.filter(v => v === null || v === undefined || isNaN(v)).length;
        const missingRate = missingCount / features.features.length;
        if (missingRate > 0.1) {
            issues.push({
                type: 'missing_values',
                severity: 'high',
                description: `${(missingRate * 100).toFixed(1)}% missing values`,
                affectedRecords: missingCount,
            });
        }
        const outliers = this.detectOutliers(features.features);
        const outlierRate = outliers.length / features.features.length;
        if (outlierRate > 0.05) {
            issues.push({
                type: 'outliers',
                severity: 'medium',
                description: `${(outlierRate * 100).toFixed(1)}% outliers detected`,
                affectedRecords: outliers.length,
            });
        }
        const report = {
            timestamp: new Date(),
            totalRecords: features.features.length,
            validRecords: features.features.length - missingCount,
            invalidRecords: missingCount,
            missingValueRate: missingRate,
            outlierRate,
            dataFreshness: 1.0,
            issues,
        };
        this.qualityReports.set(features.userId, report);
        return report;
    }
    detectOutliers(values) {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
        return values.filter(v => Math.abs(v - mean) > 3 * std);
    }
}
class FeatureSelector {
    async selectTopFeatures(features, k = 20) {
        const selected = new Map();
        let count = 0;
        for (const [name, values] of features) {
            if (count >= k)
                break;
            selected.set(name, values);
            count += values.length;
        }
        return selected;
    }
    calculateFeatureImportance(features) {
        const importance = [];
        for (const [name, values] of features) {
            importance.push({
                feature: name,
                importance: Math.random(),
                correlationWithTarget: Math.random(),
                varianceExplained: Math.random(),
            });
        }
        return importance.sort((a, b) => b.importance - a.importance);
    }
}
exports.default = new MLDataPipeline();
