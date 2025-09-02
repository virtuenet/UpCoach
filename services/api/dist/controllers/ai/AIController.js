"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = exports.AIController = void 0;
const RecommendationEngine_1 = require("../../services/ai/RecommendationEngine");
const ConversationalAI_1 = require("../../services/ai/ConversationalAI");
const PredictiveAnalytics_1 = require("../../services/ai/PredictiveAnalytics");
const AdaptiveLearning_1 = require("../../services/ai/AdaptiveLearning");
const VoiceAI_1 = require("../../services/ai/VoiceAI");
const InsightGenerator_1 = require("../../services/ai/InsightGenerator");
const logger_1 = require("../../utils/logger");
class AIController {
    // Recommendations
    async getRecommendations(req, _res, next) {
        try {
            const userId = req.user?.id || '' || req.params.userId;
            const { types, limit } = req.query;
            const recommendations = await RecommendationEngine_1.recommendationEngine.generateRecommendations(userId, types ? types.split(',') : undefined, limit ? parseInt(limit) : 5);
            _res.json({
                success: true,
                recommendations,
                generatedAt: new Date(),
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting recommendations:', error);
            next(error);
        }
    }
    async getOptimalTiming(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { activityType } = req.params;
            const timing = await RecommendationEngine_1.recommendationEngine.getOptimalTiming(userId, activityType);
            _res.json({
                success: true,
                timing,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting optimal timing:', error);
            next(error);
        }
    }
    async getAdaptiveSchedule(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { date } = req.query;
            const schedule = await RecommendationEngine_1.recommendationEngine.generateAdaptiveSchedule(userId, date ? new Date(date) : new Date());
            _res.json({
                success: true,
                schedule,
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating adaptive schedule:', error);
            next(error);
        }
    }
    // Conversational AI
    async processMessage(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { message, conversationId, context } = req.body;
            const result = await ConversationalAI_1.conversationalAI.processConversation(userId, message, conversationId, context);
            _res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            logger_1.logger.error('Error processing conversation:', error);
            next(error);
        }
    }
    async generateSmartResponse(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { message, options } = req.body;
            const response = await ConversationalAI_1.conversationalAI.generateSmartResponse(userId, message, options);
            _res.json({
                success: true,
                response,
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating smart response:', error);
            next(error);
        }
    }
    // Predictive Analytics
    async getPredictions(req, _res, next) {
        try {
            const userId = req.user?.id || '' || req.params.userId;
            const [successPrediction, churnRisk, behaviorPatterns] = await Promise.all([
                PredictiveAnalytics_1.predictiveAnalytics.predictUserSuccess(userId),
                PredictiveAnalytics_1.predictiveAnalytics.predictChurnRisk(userId),
                PredictiveAnalytics_1.predictiveAnalytics.analyzeBehaviorPatterns(userId),
            ]);
            _res.json({
                success: true,
                predictions: {
                    success: successPrediction,
                    churnRisk,
                    behaviorPatterns,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting predictions:', error);
            next(error);
        }
    }
    async predictGoalCompletion(req, _res, next) {
        try {
            const { goalId } = req.params;
            const prediction = await PredictiveAnalytics_1.predictiveAnalytics.predictGoalCompletion(goalId);
            _res.json({
                success: true,
                prediction,
            });
        }
        catch (error) {
            logger_1.logger.error('Error predicting goal completion:', error);
            next(error);
        }
    }
    async getInterventionPlan(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { riskType } = req.params;
            const plan = await PredictiveAnalytics_1.predictiveAnalytics.generateInterventionPlan(userId, riskType);
            _res.json({
                success: true,
                interventionPlan: plan,
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating intervention plan:', error);
            next(error);
        }
    }
    // Adaptive Learning
    async createLearningPath(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { goalId, options } = req.body;
            const path = await AdaptiveLearning_1.adaptiveLearning.createPersonalizedLearningPath(userId, goalId, options);
            _res.json({
                success: true,
                learningPath: path,
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating learning path:', error);
            next(error);
        }
    }
    async getLearningPaths(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const paths = await AdaptiveLearning_1.adaptiveLearning.getLearningPaths(userId);
            _res.json({
                success: true,
                learningPaths: paths,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting learning paths:', error);
            next(error);
        }
    }
    async trackLearningProgress(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { pathId, moduleId } = req.params;
            const { progress } = req.body;
            await AdaptiveLearning_1.adaptiveLearning.trackLearningProgress(userId, pathId, moduleId, progress);
            _res.json({
                success: true,
                message: 'Progress tracked successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error tracking learning progress:', error);
            next(error);
        }
    }
    async getNextModule(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { pathId } = req.params;
            const module = await AdaptiveLearning_1.adaptiveLearning.getRecommendedNextModule(userId, pathId);
            _res.json({
                success: true,
                nextModule: module,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting next module:', error);
            next(error);
        }
    }
    // Voice AI
    async analyzeVoice(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const audioBuffer = req.file?.buffer;
            if (!audioBuffer) {
                return _res.status(400).json({ error: 'Audio file required' });
            }
            const { sessionType, previousContext } = req.body;
            const analysis = await VoiceAI_1.voiceAI.analyzeVoice(userId, audioBuffer, {
                sessionType,
                previousContext,
            });
            _res.json({
                success: true,
                analysis,
            });
        }
        catch (error) {
            logger_1.logger.error('Error analyzing voice:', error);
            next(error);
        }
    }
    async getVoiceCoaching(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { voiceAnalysis, options } = req.body;
            const coaching = await VoiceAI_1.voiceAI.generateVoiceCoaching(userId, voiceAnalysis, options);
            _res.json({
                success: true,
                coaching,
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating voice coaching:', error);
            next(error);
        }
    }
    async getVoiceInsights(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { days } = req.query;
            const insights = await VoiceAI_1.voiceAI.getVoiceInsightSummary(userId, days ? parseInt(days) : 30);
            _res.json({
                success: true,
                insights,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting voice insights:', error);
            next(error);
        }
    }
    async compareVoiceSessions(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { sessionId1, sessionId2 } = req.params;
            const comparison = await VoiceAI_1.voiceAI.compareVoiceSessions(userId, sessionId1, sessionId2);
            _res.json({
                success: true,
                comparison,
            });
        }
        catch (error) {
            logger_1.logger.error('Error comparing voice sessions:', error);
            next(error);
        }
    }
    // Insights
    async getInsightReport(req, _res, next) {
        try {
            const userId = req.user?.id || '' || req.params.userId;
            const { days, startDate, endDate } = req.query;
            const report = await InsightGenerator_1.insightGenerator.generateInsightReport(userId, {
                days: days ? parseInt(days) : undefined,
                start: startDate ? new Date(startDate) : undefined,
                end: endDate ? new Date(endDate) : undefined,
            });
            _res.json({
                success: true,
                report,
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating insight report:', error);
            next(error);
        }
    }
    async getActiveInsights(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const insights = await InsightGenerator_1.insightGenerator.getActiveInsights(userId);
            _res.json({
                success: true,
                insights,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting active insights:', error);
            next(error);
        }
    }
    async dismissInsight(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { insightId } = req.params;
            await InsightGenerator_1.insightGenerator.dismissInsight(userId, insightId);
            _res.json({
                success: true,
                message: 'Insight dismissed successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error dismissing insight:', error);
            next(error);
        }
    }
}
exports.AIController = AIController;
exports.aiController = new AIController();
//# sourceMappingURL=AIController.js.map