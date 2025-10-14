"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = exports.AIController = void 0;
const AdaptiveLearning_1 = require("../../services/ai/AdaptiveLearning");
const ConversationalAI_1 = require("../../services/ai/ConversationalAI");
const InsightGenerator_1 = require("../../services/ai/InsightGenerator");
const PredictiveAnalytics_1 = require("../../services/ai/PredictiveAnalytics");
const RecommendationEngine_1 = require("../../services/ai/RecommendationEngine");
const VoiceAI_1 = require("../../services/ai/VoiceAI");
const EnhancedAIService_1 = require("../../services/ai/EnhancedAIService");
const PersonalizationEngine_1 = require("../../services/ai/PersonalizationEngine");
const AnalyticsEngine_1 = require("../../services/ai/AnalyticsEngine");
const HybridDecisionEngine_1 = require("../../services/ai/HybridDecisionEngine");
const AIInteraction_1 = require("../../models/AIInteraction");
const logger_1 = require("../../utils/logger");
class AIController {
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
    async hybridGenerate(req, _res, next) {
        try {
            const userId = req.user?.id;
            const { messages, options = {} } = req.body;
            const startTime = Date.now();
            const result = await EnhancedAIService_1.enhancedAIService.generateHybridResponse(messages, {
                ...options,
                routingContext: {
                    userId,
                    requestType: 'conversation',
                    priority: options.priority || 'normal',
                },
            });
            const processingTime = Date.now() - startTime;
            if (userId) {
                await AIInteraction_1.AIInteraction.create({
                    userId,
                    type: 'conversation',
                    model: result.response.model,
                    tokensUsed: result.response.usage.totalTokens,
                    responseTime: processingTime / 1000,
                    requestData: { messages, options },
                    responseData: { content: result.response.content },
                    metadata: {
                        provider: result.metrics.provider,
                        fallbackOccurred: result.metrics.fallbackOccurred,
                        routingDecisionTime: result.metrics.routingDecisionTime,
                        qualityScore: result.metrics.qualityScore,
                    },
                });
            }
            _res.json({
                success: true,
                response: result.response,
                metrics: result.metrics,
                processingTime,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in hybrid generation:', error);
            next(error);
        }
    }
    async getRoutingDecision(req, _res, next) {
        try {
            const userId = req.user?.id;
            const { messages, options = {} } = req.body;
            const decision = await HybridDecisionEngine_1.hybridDecisionEngine.routeRequest(messages, options, {
                userId,
                requestType: 'query',
            });
            _res.json({
                success: true,
                decision,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting routing decision:', error);
            next(error);
        }
    }
    async getPersonalizationPreferences(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const preferences = await PersonalizationEngine_1.personalizationEngine.getUserPreferences(userId);
            _res.json({
                success: true,
                preferences,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting personalization preferences:', error);
            next(error);
        }
    }
    async updatePersonalization(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { preferences, behavior, context } = req.body;
            await PersonalizationEngine_1.personalizationEngine.updateUserProfile(userId, {
                preferences,
                behavior,
                context,
            });
            _res.json({
                success: true,
                message: 'Personalization updated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating personalization:', error);
            next(error);
        }
    }
    async getPersonalizedContent(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { contentType, limit = 10 } = req.query;
            const recommendations = await PersonalizationEngine_1.personalizationEngine.getPersonalizedContent(userId, contentType, parseInt(limit));
            _res.json({
                success: true,
                recommendations,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting personalized content:', error);
            next(error);
        }
    }
    async getCoachingStrategy(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const strategy = await PersonalizationEngine_1.personalizationEngine.generateCoachingStrategy(userId);
            _res.json({
                success: true,
                strategy,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting coaching strategy:', error);
            next(error);
        }
    }
    async getBehaviorPatterns(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { days = 30 } = req.query;
            const patterns = await AnalyticsEngine_1.analyticsEngine.analyzeBehaviorPatterns(userId, parseInt(days));
            _res.json({
                success: true,
                patterns,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting behavior patterns:', error);
            next(error);
        }
    }
    async getEngagementMetrics(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { startDate, endDate } = req.query;
            const metrics = await AnalyticsEngine_1.analyticsEngine.getEngagementMetrics(userId, {
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });
            _res.json({
                success: true,
                metrics,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting engagement metrics:', error);
            next(error);
        }
    }
    async getSuccessFactors(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const factors = await AnalyticsEngine_1.analyticsEngine.identifySuccessFactors(userId);
            _res.json({
                success: true,
                factors,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting success factors:', error);
            next(error);
        }
    }
    async trackAnalyticsEvent(req, _res, next) {
        try {
            const userId = req.user?.id || '';
            const { eventType, eventData, metadata } = req.body;
            await AnalyticsEngine_1.analyticsEngine.trackEvent(userId, {
                type: eventType,
                data: eventData,
                metadata,
                timestamp: new Date(),
            });
            _res.json({
                success: true,
                message: 'Event tracked successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error tracking analytics event:', error);
            next(error);
        }
    }
}
exports.AIController = AIController;
exports.aiController = new AIController();
