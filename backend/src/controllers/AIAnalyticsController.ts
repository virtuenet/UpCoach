import { Request, Response } from 'express';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { sequelize } from '../database/connection';
import { logger } from '../utils/logger';
import { aiService } from '../services/ai/AIService';

export class AIAnalyticsController {
  async getAIMetrics(req: Request, _res: Response): Promise<void> {
    try {
      const { range = 'week' } = req.query;
      const days = range === 'month' ? 30 : range === 'year' ? 365 : 7;
      const startDate = startOfDay(subDays(new Date(), days));

      // Get AI service metrics
      const serviceMetrics = aiService.getMetrics();

      // Get total interactions from database
      const [totalInteractionsResult] = await sequelize.query(
        `
        SELECT 
          COUNT(*) as total_interactions,
          COUNT(DISTINCT user_id) as active_users,
          AVG(response_time) as avg_response_time,
          SUM(tokens_used) as total_tokens
        FROM ai_interactions
        WHERE created_at >= :startDate
      `,
        {
          replacements: { startDate },
          type: 'SELECT',
        }
      );

      const results = totalInteractionsResult as any;
      const totalInteractions = parseInt(results.total_interactions) || 0;
      const activeUsers = parseInt(results.active_users) || 0;
      const avgResponseTime = parseFloat(results.avg_response_time) || 0;
      const totalTokens = parseInt(results.total_tokens) || 0;

      // Calculate satisfaction rate from feedback
      const [satisfactionResult] = await sequelize.query(
        `
        SELECT 
          COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) * 100.0 / COUNT(*) as satisfaction_rate
        FROM ai_feedback
        WHERE created_at >= :startDate
      `,
        {
          replacements: { startDate },
          type: 'SELECT',
        }
      );

      const satisfactionRate = parseFloat((satisfactionResult as any).satisfaction_rate) || 85; // Default to 85%

      // Calculate costs (rough estimates)
      const costPerThousandTokens = 0.03; // Average cost
      const totalCost = (totalTokens / 1000) * costPerThousandTokens;

      // Get model usage distribution
      const [modelUsageResult] = await sequelize.query(
        `
        SELECT 
          COUNT(CASE WHEN model LIKE '%gpt%' THEN 1 END) as openai_count,
          COUNT(CASE WHEN model LIKE '%claude%' THEN 1 END) as claude_count
        FROM ai_interactions
        WHERE created_at >= :startDate
      `,
        {
          replacements: { startDate },
          type: 'SELECT',
        }
      );

      const modelUsage = modelUsageResult as any;
      const openaiCount = parseInt(modelUsage.openai_count) || 0;
      const claudeCount = parseInt(modelUsage.claude_count) || 0;

      // Calculate trend (compare with previous period)
      const previousStartDate = startOfDay(subDays(new Date(), days * 2));
      const previousEndDate = startOfDay(subDays(new Date(), days));

      const [previousCostResult] = await sequelize.query(
        `
        SELECT SUM(tokens_used) as total_tokens
        FROM ai_interactions
        WHERE created_at >= :startDate AND created_at < :endDate
      `,
        {
          replacements: { startDate: previousStartDate, endDate: previousEndDate },
          type: 'SELECT',
        }
      );

      const previousTokens = parseInt((previousCostResult as any).total_tokens) || 1;
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
    } catch (error) {
      logger.error('Failed to get AI metrics:', error);
      _res.status(500).json({ error: 'Failed to fetch AI metrics' });
    }
  }

  async getAIInteractions(req: Request, _res: Response): Promise<void> {
    try {
      const { limit = 20 } = req.query;

      const interactions = await sequelize.query(
        `
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
      `,
        {
          replacements: { limit: parseInt(limit as string) },
          type: 'SELECT',
        }
      );

      _res.json(
        interactions.map((interaction: any) => ({
          id: interaction.id,
          userId: interaction.user_id,
          userName: interaction.user_name || 'Unknown User',
          type: interaction.type,
          model: interaction.model,
          tokens: interaction.tokens,
          responseTime: interaction.response_time,
          sentiment: interaction.sentiment,
          createdAt: interaction.created_at,
        }))
      );
    } catch (error) {
      logger.error('Failed to get AI interactions:', error);
      _res.status(500).json({ error: 'Failed to fetch AI interactions' });
    }
  }

  async getAIUsageData(req: Request, _res: Response): Promise<void> {
    try {
      const { range = 'week' } = req.query;
      const days = range === 'month' ? 30 : range === 'year' ? 365 : 7;
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Get daily usage data
      const usageData = await sequelize.query(
        `
        SELECT 
          DATE(created_at) as date,
          COUNT(CASE WHEN type = 'conversation' THEN 1 END) as conversations,
          COUNT(CASE WHEN type = 'recommendation' THEN 1 END) as recommendations,
          COUNT(CASE WHEN type = 'voice' THEN 1 END) as voice_analysis
        FROM ai_interactions
        WHERE created_at >= :startDate AND created_at <= :endDate
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
        {
          replacements: { startDate, endDate },
          type: 'SELECT',
        }
      );

      // Fill in missing dates with zero values
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const filledData = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const existing = usageData.find(
          (d: any) => format(new Date(d.date), 'yyyy-MM-dd') === dateStr
        );

        return {
          date: dateStr,
          conversations: (existing as any)?.conversations || 0,
          recommendations: (existing as any)?.recommendations || 0,
          voiceAnalysis: (existing as any)?.voice_analysis || 0,
        };
      });

      _res.json(filledData);
    } catch (error) {
      logger.error('Failed to get AI usage data:', error);
      _res.status(500).json({ error: 'Failed to fetch AI usage data' });
    }
  }

  async getAIHealthStatus_(_req: Request, _res: Response): Promise<void> {
    try {
      const health = await aiService.healthCheck();
      const metrics = aiService.getMetrics();

      _res.json({
        status: 'operational',
        services: health,
        performance: {
          averageResponseTime: metrics.averageResponseTime,
          errorRate: metrics.errorRate,
          cacheHitRate: metrics.cacheHitRate,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Failed to get AI health status:', error);
      _res.status(500).json({
        status: 'degraded',
        error: 'Failed to fetch AI health status',
      });
    }
  }

  async clearAICache_(_req: Request, _res: Response): Promise<void> {
    try {
      await aiService.clearCache();
      _res.json({ message: 'AI cache cleared successfully' });
    } catch (error) {
      logger.error('Failed to clear AI cache:', error);
      _res.status(500).json({ error: 'Failed to clear AI cache' });
    }
  }
}

export const aiAnalyticsController = new AIAnalyticsController();
