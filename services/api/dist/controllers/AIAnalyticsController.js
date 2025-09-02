"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAnalyticsController = exports.AIAnalyticsController = void 0;
const date_fns_1 = require("date-fns");
const eachDayOfInterval_1 = require("date-fns/eachDayOfInterval");
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
const AIService_1 = require("../services/ai/AIService");
class AIAnalyticsController {
    async getAIMetrics(req, _res) {
        try {
            const { range = 'week' } = req.query;
            const days = range === 'month' ? 30 : range === 'year' ? 365 : 7;
            const startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(new Date(), days));
            // Get AI service metrics
            const serviceMetrics = AIService_1.aiService.getMetrics();
            // Get total interactions from database
            const [totalInteractionsResult] = await connection_1.sequelize.query(`
        SELECT 
          COUNT(*) as total_interactions,
          COUNT(DISTINCT user_id) as active_users,
          AVG(response_time) as avg_response_time,
          SUM(tokens_used) as total_tokens
        FROM ai_interactions
        WHERE created_at >= :startDate
      `, {
                replacements: { startDate },
                type: 'SELECT',
            });
            const results = totalInteractionsResult;
            const totalInteractions = parseInt(results.total_interactions) || 0;
            const activeUsers = parseInt(results.active_users) || 0;
            const avgResponseTime = parseFloat(results.avg_response_time) || 0;
            const totalTokens = parseInt(results.total_tokens) || 0;
            // Calculate satisfaction rate from feedback
            const [satisfactionResult] = await connection_1.sequelize.query(`
        SELECT 
          COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) * 100.0 / COUNT(*) as satisfaction_rate
        FROM ai_feedback
        WHERE created_at >= :startDate
      `, {
                replacements: { startDate },
                type: 'SELECT',
            });
            const satisfactionRate = parseFloat(satisfactionResult.satisfaction_rate) || 85; // Default to 85%
            // Calculate costs (rough estimates)
            const costPerThousandTokens = 0.03; // Average cost
            const totalCost = (totalTokens / 1000) * costPerThousandTokens;
            // Get model usage distribution
            const [modelUsageResult] = await connection_1.sequelize.query(`
        SELECT 
          COUNT(CASE WHEN model LIKE '%gpt%' THEN 1 END) as openai_count,
          COUNT(CASE WHEN model LIKE '%claude%' THEN 1 END) as claude_count
        FROM ai_interactions
        WHERE created_at >= :startDate
      `, {
                replacements: { startDate },
                type: 'SELECT',
            });
            const modelUsage = modelUsageResult;
            const openaiCount = parseInt(modelUsage.openai_count) || 0;
            const claudeCount = parseInt(modelUsage.claude_count) || 0;
            // Calculate trend (compare with previous period)
            const previousStartDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(new Date(), days * 2));
            const previousEndDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(new Date(), days));
            const [previousCostResult] = await connection_1.sequelize.query(`
        SELECT SUM(tokens_used) as total_tokens
        FROM ai_interactions
        WHERE created_at >= :startDate AND created_at < :endDate
      `, {
                replacements: { startDate: previousStartDate, endDate: previousEndDate },
                type: 'SELECT',
            });
            const previousTokens = parseInt(previousCostResult.total_tokens) || 1;
            const previousCost = (previousTokens / 1000) * costPerThousandTokens;
            const costTrend = ((totalCost - previousCost) / previousCost) * 100;
            _res.json({
                totalInteractions,
                activeUsers,
                avgResponseTime: Math.round(avgResponseTime * 10) / 10,
                satisfactionRate: Math.round(satisfactionRate),
                tokenUsage: {
                    total: totalTokens,
                    cost: totalCost,
                    trend: Math.round(costTrend * 10) / 10,
                },
                modelUsage: {
                    openai: openaiCount,
                    claude: claudeCount,
                },
                serviceMetrics,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get AI metrics:', error);
            _res.status(500).json({ error: 'Failed to fetch AI metrics' });
        }
    }
    async getAIInteractions(req, _res) {
        try {
            const { limit = 20 } = req.query;
            const interactions = await connection_1.sequelize.query(`
        SELECT 
          ai.id,
          ai.user_id,
          u.name as user_name,
          ai.type,
          ai.model,
          ai.tokens_used as tokens,
          ai.response_time,
          COALESCE(af.sentiment, 'neutral') as sentiment,
          ai.created_at
        FROM ai_interactions ai
        LEFT JOIN users u ON ai.user_id = u.id
        LEFT JOIN ai_feedback af ON ai.id = af.interaction_id
        ORDER BY ai.created_at DESC
        LIMIT :limit
      `, {
                replacements: { limit: parseInt(limit) },
                type: 'SELECT',
            });
            _res.json(interactions.map((interaction) => ({
                id: interaction.id,
                userId: interaction.user_id,
                userName: interaction.user_name || 'Unknown User',
                type: interaction.type,
                model: interaction.model,
                tokens: interaction.tokens,
                responseTime: interaction.response_time,
                sentiment: interaction.sentiment,
                createdAt: interaction.created_at,
            })));
        }
        catch (error) {
            logger_1.logger.error('Failed to get AI interactions:', error);
            _res.status(500).json({ error: 'Failed to fetch AI interactions' });
        }
    }
    async getAIUsageData(req, _res) {
        try {
            const { range = 'week' } = req.query;
            const days = range === 'month' ? 30 : range === 'year' ? 365 : 7;
            const startDate = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(new Date(), days));
            const endDate = (0, date_fns_1.endOfDay)(new Date());
            // Get daily usage data
            const usageData = await connection_1.sequelize.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(CASE WHEN type = 'conversation' THEN 1 END) as conversations,
          COUNT(CASE WHEN type = 'recommendation' THEN 1 END) as recommendations,
          COUNT(CASE WHEN type = 'voice' THEN 1 END) as voice_analysis
        FROM ai_interactions
        WHERE created_at >= :startDate AND created_at <= :endDate
        GROUP BY DATE(created_at)
        ORDER BY date
      `, {
                replacements: { startDate, endDate },
                type: 'SELECT',
            });
            // Fill in missing dates with zero values
            const dateRange = (0, eachDayOfInterval_1.eachDayOfInterval)({ start: startDate, end: endDate });
            const filledData = dateRange.map(date => {
                const dateStr = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
                const existing = usageData.find((d) => (0, date_fns_1.format)(new Date(d.date), 'yyyy-MM-dd') === dateStr);
                return {
                    date: dateStr,
                    conversations: existing?.conversations || 0,
                    recommendations: existing?.recommendations || 0,
                    voiceAnalysis: existing?.voice_analysis || 0,
                };
            });
            _res.json(filledData);
        }
        catch (error) {
            logger_1.logger.error('Failed to get AI usage data:', error);
            _res.status(500).json({ error: 'Failed to fetch AI usage data' });
        }
    }
    async getAIHealthStatus(req, res) {
        try {
            const health = await AIService_1.aiService.healthCheck();
            const metrics = AIService_1.aiService.getMetrics();
            res.json({
                status: 'operational',
                services: health,
                performance: {
                    averageResponseTime: metrics.averageResponseTime,
                    errorRate: metrics.errorRate,
                    cacheHitRate: metrics.cacheHitRate,
                },
                timestamp: new Date(),
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get AI health status:', error);
            res.status(500).json({
                status: 'degraded',
                error: 'Failed to fetch AI health status',
            });
        }
    }
    async clearAICache(req, res) {
        try {
            await AIService_1.aiService.clearCache();
            res.json({ message: 'AI cache cleared successfully' });
        }
        catch (error) {
            logger_1.logger.error('Failed to clear AI cache:', error);
            res.status(500).json({ error: 'Failed to clear AI cache' });
        }
    }
}
exports.AIAnalyticsController = AIAnalyticsController;
exports.aiAnalyticsController = new AIAnalyticsController();
//# sourceMappingURL=AIAnalyticsController.js.map