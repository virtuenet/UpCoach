"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coachIntelligenceML = exports.CoachIntelligenceMLService = void 0;
const tslib_1 = require("tslib");
const tf = tslib_1.__importStar(require("@tensorflow/tfjs-node"));
const ort = tslib_1.__importStar(require("onnxruntime-node"));
const ioredis_1 = require("ioredis");
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
const User_1 = require("../../models/User");
const Goal_1 = require("../../models/Goal");
const CoachMemory_1 = require("../../models/coaching/CoachMemory");
const UserAnalytics_1 = require("../../models/analytics/UserAnalytics");
const logger_1 = require("../../utils/logger");
class CoachIntelligenceMLService extends events_1.EventEmitter {
    models;
    featureStore;
    modelConfigs;
    metricsCollector;
    constructor() {
        super();
        this.models = new Map();
        this.modelConfigs = new Map();
        this.featureStore = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });
        this.metricsCollector = new MetricsCollector();
        this.initializeModels();
    }
    async initializeModels() {
        try {
            await this.loadModel('nps_predictor', {
                modelPath: '/models/nps/model.json',
                version: '1.0.0',
                inputShape: [1, 20],
                outputShape: [1, 1],
                preprocessing: this.preprocessNPSFeatures,
                postprocessing: this.postprocessNPSPrediction,
            });
            await this.loadModel('skill_tracker', {
                modelPath: '/models/skill/model.onnx',
                version: '1.0.0',
                inputShape: [1, 15],
                outputShape: [1, 1],
            });
            await this.loadModel('goal_predictor', {
                modelPath: '/models/goal/model.json',
                version: '1.0.0',
                inputShape: [1, 25],
                outputShape: [1, 1],
            });
            await this.loadModel('insight_generator', {
                modelPath: '/models/insight/model.onnx',
                version: '1.0.0',
                inputShape: [1, 512],
                outputShape: [1, 256],
            });
            logger_1.logger.info('All ML models initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize ML models', error);
            throw error;
        }
    }
    async loadModel(name, config) {
        try {
            let model;
            if (config.modelPath.endsWith('.onnx')) {
                model = await ort.InferenceSession.create(config.modelPath);
            }
            else {
                model = await tf.loadLayersModel(`file://${config.modelPath}`);
            }
            this.models.set(name, model);
            this.modelConfigs.set(name, config);
            logger_1.logger.info(`Model ${name} loaded successfully`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to load model ${name}`, error);
            throw error;
        }
    }
    async predictNPSScore(userId, timeframe = '30d') {
        const startTime = perf_hooks_1.performance.now();
        try {
            const features = await this.getUserFeatures(userId, timeframe);
            const inputTensor = this.preprocessNPSFeatures(features);
            const model = this.models.get('nps_predictor');
            const prediction = model.predict(inputTensor);
            const score = (await prediction.data())[0];
            const factors = this.calculateNPSFactors(features);
            const recommendations = this.generateNPSRecommendations(score, factors);
            const category = this.categorizeNPS(score);
            const inferenceTime = perf_hooks_1.performance.now() - startTime;
            this.metricsCollector.recordInference('nps_predictor', inferenceTime);
            inputTensor.dispose();
            prediction.dispose();
            return {
                score: Math.round(score * 10) / 10,
                category,
                confidence: this.calculateConfidence(features),
                factors,
                recommendations,
            };
        }
        catch (error) {
            logger_1.logger.error('NPS prediction failed', { userId, error });
            throw error;
        }
    }
    async trackSkillImprovement(userId, skillId, assessmentScore) {
        const startTime = perf_hooks_1.performance.now();
        try {
            await this.storeSkillAssessment(userId, skillId, assessmentScore);
            const history = await this.getSkillHistory(userId, skillId);
            const features = this.prepareSkillFeatures(history, assessmentScore);
            const session = this.models.get('skill_tracker');
            const feeds = { input: new ort.Tensor('float32', features, [1, 15]) };
            const results = await session.run(feeds);
            const improvement = results.output.data[0];
            const velocity = this.calculateLearningVelocity(history);
            const projectedDate = this.projectMasteryDate(assessmentScore, velocity);
            const recommendations = this.generateSkillRecommendations(skillId, assessmentScore, improvement, velocity);
            const inferenceTime = perf_hooks_1.performance.now() - startTime;
            this.metricsCollector.recordInference('skill_tracker', inferenceTime);
            return {
                skillId,
                currentLevel: assessmentScore,
                improvement: Math.round(improvement * 100) / 100,
                projectedMasteryDate: projectedDate,
                learningVelocity: velocity,
                recommendations,
            };
        }
        catch (error) {
            logger_1.logger.error('Skill tracking failed', { userId, skillId, error });
            throw error;
        }
    }
    async predictGoalSuccess(userId, goalId) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const goal = await Goal_1.Goal.findByPk(goalId);
            const userFeatures = await this.getUserFeatures(userId);
            const goalFeatures = this.extractGoalFeatures(goal);
            const combinedFeatures = [...userFeatures, ...goalFeatures];
            const inputTensor = tf.tensor2d([combinedFeatures], [1, 25]);
            const model = this.models.get('goal_predictor');
            const prediction = model.predict(inputTensor);
            const probability = (await prediction.data())[0];
            const completionDate = this.estimateCompletionDate(goal, probability);
            const riskFactors = this.identifyRiskFactors(goal, userFeatures);
            const successFactors = this.identifySuccessFactors(goal, userFeatures);
            const actions = this.recommendActions(goal, probability, riskFactors);
            const ci = this.calculateConfidenceInterval(probability, combinedFeatures);
            const inferenceTime = perf_hooks_1.performance.now() - startTime;
            this.metricsCollector.recordInference('goal_predictor', inferenceTime);
            inputTensor.dispose();
            prediction.dispose();
            return {
                probability: Math.round(probability * 100) / 100,
                estimatedCompletionDate: completionDate,
                riskFactors,
                successFactors,
                recommendedActions: actions,
                confidenceInterval: ci,
            };
        }
        catch (error) {
            logger_1.logger.error('Goal prediction failed', { userId, goalId, error });
            throw error;
        }
    }
    async generatePersonalizedInsights(userId) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const context = await this.gatherUserContext(userId);
            const embeddings = await this.generateContextEmbeddings(context);
            const session = this.models.get('insight_generator');
            const feeds = { context: new ort.Tensor('float32', embeddings, [1, 512]) };
            const results = await session.run(feeds);
            const insightEmbeddings = results.insights.data;
            const insights = await this.decodeInsights(insightEmbeddings, context);
            const rankedInsights = this.rankInsights(insights, context);
            const inferenceTime = perf_hooks_1.performance.now() - startTime;
            this.metricsCollector.recordInference('insight_generator', inferenceTime);
            return rankedInsights.slice(0, 5);
        }
        catch (error) {
            logger_1.logger.error('Insight generation failed', { userId, error });
            throw error;
        }
    }
    async calculateUserPercentile(userId, metric) {
        try {
            const userValue = await this.getUserMetricValue(userId, metric);
            const distribution = await this.getMetricDistribution(metric);
            const percentile = this.calculatePercentile(userValue, distribution);
            return Math.round(percentile * 100) / 100;
        }
        catch (error) {
            logger_1.logger.error('Percentile calculation failed', { userId, metric, error });
            throw error;
        }
    }
    async generateCoachingEffectivenessReport(coachId) {
        try {
            const users = await this.getCoachUsers(coachId);
            const metrics = {
                avgNPS: 0,
                avgGoalCompletion: 0,
                avgEngagement: 0,
                skillImprovement: 0,
                retentionRate: 0,
            };
            for (const user of users) {
                const userMetrics = await this.getUserMetrics(user.id);
                metrics.avgNPS += userMetrics.nps;
                metrics.avgGoalCompletion += userMetrics.goalCompletion;
                metrics.avgEngagement += userMetrics.engagement;
                metrics.skillImprovement += userMetrics.skillProgress;
            }
            const userCount = users.length;
            Object.keys(metrics).forEach((key) => {
                metrics[key] = metrics[key] / userCount;
            });
            const insights = this.generateCoachingInsights(metrics);
            return {
                coachId,
                period: '30d',
                metrics,
                insights,
                recommendations: this.generateCoachingRecommendations(metrics),
            };
        }
        catch (error) {
            logger_1.logger.error('Effectiveness report generation failed', { coachId, error });
            throw error;
        }
    }
    async getUserFeatures(userId, timeframe = '30d') {
        const cacheKey = `features:${userId}:${timeframe}`;
        const cached = await this.featureStore.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const features = await this.calculateUserFeatures(userId, timeframe);
        await this.featureStore.setex(cacheKey, 3600, JSON.stringify(features));
        return features;
    }
    async calculateUserFeatures(userId, timeframe) {
        const user = await User_1.User.findByPk(userId);
        const analytics = await UserAnalytics_1.UserAnalytics.findOne({ where: { userId } });
        const memories = await CoachMemory_1.CoachMemory.findAll({ where: { userId }, limit: 100 });
        const goals = await Goal_1.Goal.findAll({ where: { userId } });
        const features = [
            analytics?.engagementMetrics?.totalSessions || 0,
            analytics?.engagementMetrics?.averageSessionDuration || 0,
            analytics?.engagementMetrics?.streakCount || 0,
            analytics?.engagementMetrics?.responsiveness || 0,
            goals.filter((g) => g.status === 'completed').length,
            goals.filter((g) => g.status === 'active').length,
            this.calculateAverageProgress(goals),
            this.calculateConsistencyScore(memories),
            this.calculateMoodTrend(memories),
            this.getDaysSinceSignup(user),
            this.getActivityRecency(memories),
        ];
        return features;
    }
    preprocessNPSFeatures(features) {
        const normalized = features.map((f, i) => {
            const ranges = [100, 60, 30, 1, 20, 10, 100, 1, 1, 365, 30];
            return f / ranges[i];
        });
        return tf.tensor2d([normalized], [1, normalized.length]);
    }
    calculateNPSFactors(features) {
        return {
            engagement: Math.min(features[0] / 30, 1) * 100,
            satisfaction: features[3] * 100,
            goalProgress: features[6],
            consistency: features[7] * 100,
        };
    }
    generateNPSRecommendations(score, factors) {
        const recommendations = [];
        if (score < 7) {
            if (factors.engagement < 50) {
                recommendations.push('Increase session frequency to improve engagement');
            }
            if (factors.goalProgress < 50) {
                recommendations.push('Focus on helping user achieve current goals');
            }
            if (factors.consistency < 50) {
                recommendations.push('Encourage more consistent platform usage');
            }
        }
        else if (score < 9) {
            recommendations.push('Continue current coaching approach');
            if (factors.satisfaction < 80) {
                recommendations.push('Gather feedback to improve satisfaction');
            }
        }
        else {
            recommendations.push('Maintain excellent coaching relationship');
            recommendations.push('Consider user for case studies or testimonials');
        }
        return recommendations;
    }
    categorizeNPS(score) {
        if (score >= 9)
            return 'promoter';
        if (score >= 7)
            return 'passive';
        return 'detractor';
    }
    calculateConfidence(features) {
        const nonZeroFeatures = features.filter((f) => f !== 0).length;
        const completeness = nonZeroFeatures / features.length;
        const recency = Math.exp(-features[features.length - 1] / 7);
        return Math.min(completeness * 0.7 + recency * 0.3, 1);
    }
    async storeSkillAssessment(userId, skillId, score) {
        const key = `skill:${userId}:${skillId}`;
        const assessment = {
            score,
            timestamp: new Date(),
        };
        await this.featureStore.lpush(key, JSON.stringify(assessment));
        await this.featureStore.ltrim(key, 0, 99);
    }
    async getSkillHistory(userId, skillId) {
        const key = `skill:${userId}:${skillId}`;
        const history = await this.featureStore.lrange(key, 0, -1);
        return history.map((h) => JSON.parse(h));
    }
    calculateLearningVelocity(history) {
        if (history.length < 2)
            return 0;
        const improvements = [];
        for (let i = 1; i < history.length; i++) {
            const improvement = history[i].score - history[i - 1].score;
            const timeDiff = (new Date(history[i].timestamp).getTime() -
                new Date(history[i - 1].timestamp).getTime()) /
                (1000 * 60 * 60 * 24);
            improvements.push(improvement / timeDiff);
        }
        return improvements.reduce((a, b) => a + b, 0) / improvements.length;
    }
    projectMasteryDate(currentScore, velocity) {
        const targetScore = 90;
        const remaining = targetScore - currentScore;
        if (velocity <= 0) {
            return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }
        const daysToMastery = remaining / velocity;
        return new Date(Date.now() + daysToMastery * 24 * 60 * 60 * 1000);
    }
    calculateAverageProgress(goals) {
        if (goals.length === 0)
            return 0;
        return goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length;
    }
    calculateConsistencyScore(memories) {
        return 0.75;
    }
    calculateMoodTrend(memories) {
        return 0.5;
    }
    getDaysSinceSignup(user) {
        const signup = new Date(user.createdAt);
        const now = new Date();
        return Math.floor((now.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24));
    }
    getActivityRecency(memories) {
        if (memories.length === 0)
            return 999;
        const lastActivity = new Date(memories[0].createdAt);
        const now = new Date();
        return Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    }
}
exports.CoachIntelligenceMLService = CoachIntelligenceMLService;
class MetricsCollector {
    metrics;
    constructor() {
        this.metrics = new Map();
    }
    recordInference(modelName, inferenceTime) {
        if (!this.metrics.has(modelName)) {
            this.metrics.set(modelName, []);
        }
        this.metrics.get(modelName).push(inferenceTime);
        if (inferenceTime > 100) {
            logger_1.logger.warn(`Slow inference for ${modelName}: ${inferenceTime}ms`);
        }
    }
    getMetrics(modelName) {
        const times = this.metrics.get(modelName) || [];
        if (times.length === 0)
            return null;
        return {
            count: times.length,
            avg: times.reduce((a, b) => a + b, 0) / times.length,
            p95: this.percentile(times, 0.95),
            p99: this.percentile(times, 0.99),
        };
    }
    percentile(arr, p) {
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[index];
    }
}
exports.coachIntelligenceML = new CoachIntelligenceMLService();
