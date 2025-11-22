import { format, subDays } from 'date-fns';
import { QueryTypes } from 'sequelize';

import { sequelize } from '../../models';
// import { User } from '../../models/User';
import { logger } from '../../utils/logger';
// import { analyticsService } from './AnalyticsService';
import { executeSecureQuery, validateQueryParams } from '../../utils/sqlSecurity';
import { getCacheService } from '../cache/UnifiedCacheService';

interface CohortDefinition {
  name: string;
  description?: string;
  type: 'signup_date' | 'subscription' | 'behavior' | 'custom';
  startDate?: Date;
  endDate?: Date;
  filters?: unknown;
}

interface RetentionData {
  period: number;
  usersRetained: number;
  retentionRate: number;
  churnRate: number;
  activeUsers: number;
}

interface FunnelStep {
  name: string;
  eventType: string;
  filters?: unknown;
}

interface FunnelData {
  step: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
  avgTimeToComplete?: number;
}

export class AdvancedAnalyticsService {
  // Create a new cohort
  async createCohort(definition: CohortDefinition, createdBy: number): Promise<number> {
    try {
      // Validate inputs
      const validatedParams = validateQueryParams({
        name: definition.name,
        description: definition.description,
        type: definition.type,
        startDate: definition.startDate,
        endDate: definition.endDate,
        filters: JSON.stringify(definition.filters || {}),
        createdBy,
      });

      // Create cohort using parameterized query
      const result = await executeSecureQuery(
        sequelize,
        `INSERT INTO user_cohorts (name, description, cohort_type, start_date, end_date, filters, created_by)
         VALUES (:name, :description, :type, :startDate, :endDate, :filters, :createdBy)
         RETURNING id`,
        validatedParams,
        QueryTypes.INSERT
      );

      const cohortId = result[0][0].id;

      // Populate cohort members based on type
      await this.populateCohortMembers(cohortId, definition);

      logger.info('Cohort created', { cohortId, name: definition.name });
      return cohortId;
    } catch (error) {
      logger.error('Failed to create cohort', { error, definition });
      throw error;
    }
  }

  // Populate cohort members based on definition
  private async populateCohortMembers(
    cohortId: number,
    definition: CohortDefinition
  ): Promise<void> {
    let userQuery = '';
    const replacements: unknown = { cohortId };

    switch (definition.type) {
      case 'signup_date':
        userQuery = `
          INSERT INTO user_cohort_members (cohort_id, user_id, acquisition_channel, initial_subscription_tier)
          SELECT 
            :cohortId,
            u.id,
            COALESCE(up.acquisition_channel, 'organic'),
            u.role
          FROM users u
          LEFT JOIN user_profiles up ON u.id = up.user_id
          WHERE u.created_at >= :startDate
            AND u.created_at <= :endDate
        `;
        replacements.startDate = definition.startDate;
        replacements.endDate = definition.endDate;
        break;

      case 'subscription':
        userQuery = `
          INSERT INTO user_cohort_members (cohort_id, user_id, initial_subscription_tier)
          SELECT 
            :cohortId,
            u.id,
            u.role
          FROM users u
          WHERE u.role = :subscriptionTier
        `;
        replacements.subscriptionTier = definition.filters?.tier || 'pro';
        break;

      case 'behavior':
        // Example: Users who completed onboarding
        userQuery = `
          INSERT INTO user_cohort_members (cohort_id, user_id)
          SELECT 
            :cohortId,
            u.id
          FROM users u
          WHERE u.onboarding_completed = true
        `;
        break;

      case 'custom':
        // Build dynamic query based on filters
        userQuery = this.buildCustomCohortQuery(definition.filters);
        Object.assign(replacements, definition.filters);
        break;
    }

    // Execute the parameterized query safely
    await executeSecureQuery(
      sequelize,
      userQuery,
      validateQueryParams(replacements),
      QueryTypes.INSERT
    );

    // Update user count using parameterized query
    await executeSecureQuery(
      sequelize,
      `UPDATE user_cohorts 
       SET user_count = (SELECT COUNT(*) FROM user_cohort_members WHERE cohort_id = :cohortId)
       WHERE id = :cohortId`,
      validateQueryParams({ cohortId }),
      QueryTypes.UPDATE
    );
  }

  // Build custom cohort query based on filters
  private buildCustomCohortQuery(filters: unknown): string {
    // This is a simplified version - in production, you'd want more robust query building
    const conditions = [];

    if (filters.minSessions) {
      conditions.push(`
        (SELECT COUNT(*) FROM user_activity_logs 
         WHERE user_id = u.id AND activity_type = 'session_start') >= :minSessions
      `);
    }

    if (filters.hasCompletedGoal) {
      conditions.push(`
        EXISTS (SELECT 1 FROM goals WHERE user_id = u.id AND status = 'completed')
      `);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return `
      INSERT INTO user_cohort_members (cohort_id, user_id)
      SELECT :cohortId, u.id
      FROM users u
      ${whereClause}
    `;
  }

  // Calculate retention metrics for a cohort
  async calculateRetention(
    cohortId: number,
    periodType: 'day' | 'week' | 'month' = 'day'
  ): Promise<RetentionData[]> {
    try {
      // Validate period type
      if (!['day', 'week', 'month'].includes(periodType)) {
        throw new Error('Invalid period type');
      }

      // Call the stored procedure with validated parameters
      await executeSecureQuery(
        sequelize,
        'SELECT calculate_cohort_retention(:cohortId, :periodType)',
        validateQueryParams({ cohortId, periodType }),
        QueryTypes.SELECT
      );

      // Fetch calculated metrics with parameterized query
      const metrics = await executeSecureQuery(
        sequelize,
        `SELECT 
          period_number as period,
          users_retained as "usersRetained",
          retention_rate as "retentionRate",
          100 - retention_rate as "churnRate",
          active_users as "activeUsers"
         FROM retention_metrics
         WHERE cohort_id = :cohortId
           AND period_type = :periodType
         ORDER BY period_number`,
        validateQueryParams({ cohortId, periodType }),
        QueryTypes.SELECT
      );

      return metrics as RetentionData[];
    } catch (error) {
      logger.error('Failed to calculate retention', { error, cohortId });
      throw error;
    }
  }

  // Track user activity
  async trackActivity(
    userId: number,
    activityType: string,
    data?: unknown,
    sessionId?: string
  ): Promise<void> {
    try {
      // Validate and sanitize activity type
      const validatedParams = validateQueryParams({
        userId,
        activityType: activityType.substring(0, 100), // Limit length
        data: JSON.stringify(data || {}),
        sessionId,
        platform: data?.platform || 'web',
        deviceType: data?.deviceType || 'desktop',
      });

      await executeSecureQuery(
        sequelize,
        `INSERT INTO user_activity_logs 
         (user_id, activity_type, activity_data, session_id, platform, device_type)
         VALUES (:userId, :activityType, :data, :sessionId, :platform, :deviceType)`,
        validatedParams,
        QueryTypes.INSERT
      );

      // Update feature usage stats
      if (activityType.startsWith('feature_')) {
        await this.updateFeatureUsage(activityType.replace('feature_', ''), userId);
      }
    } catch (error) {
      logger.error('Failed to track activity', { error, userId, activityType });
    }
  }

  // Update feature usage statistics
  private async updateFeatureUsage(featureName: string, userId: number): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Sanitize feature name to prevent injection
    const sanitizedFeatureName = featureName.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);

    await executeSecureQuery(
      sequelize,
      `INSERT INTO feature_usage_stats (feature_name, date, unique_users, total_uses)
       VALUES (:featureName, :date, 1, 1)
       ON CONFLICT (feature_name, date)
       DO UPDATE SET
         unique_users = feature_usage_stats.unique_users + 
           CASE WHEN NOT EXISTS (
             SELECT 1 FROM user_activity_logs
             WHERE user_id = :userId
               AND activity_type = :activityType
               AND DATE(created_at) = :date
               AND id < (SELECT MAX(id) FROM user_activity_logs WHERE user_id = :userId AND activity_type = :activityType)
           ) THEN 1 ELSE 0 END,
         total_uses = feature_usage_stats.total_uses + 1`,
      validateQueryParams({
        featureName: sanitizedFeatureName,
        date: today,
        userId,
        activityType: `feature_${sanitizedFeatureName}`,
      }),
      QueryTypes.INSERT
    );
  }

  // Create and track conversion funnel
  async createFunnel(name: string, steps: FunnelStep[], description?: string): Promise<number> {
    try {
      const result = await sequelize.query(
        `INSERT INTO conversion_funnels (name, description, steps)
         VALUES (:name, :description, :steps)
         RETURNING id`,
        {
          replacements: {
            name,
            description,
            steps: JSON.stringify(steps),
          },
          type: QueryTypes.INSERT,
        }
      );

      return (result as unknown)[0][0].id;
    } catch (error) {
      logger.error('Failed to create funnel', { error, name });
      throw error;
    }
  }

  // Track funnel completion
  async trackFunnelStep(
    funnelId: number,
    userId: number,
    stepIndex: number,
    attribution?: {
      source?: string;
      medium?: string;
      campaign?: string;
    }
  ): Promise<void> {
    try {
      // Get previous step completion time
      const prevStep = await sequelize.query(
        `SELECT completed_at FROM funnel_completions
         WHERE funnel_id = :funnelId AND user_id = :userId AND step_index = :prevStep`,
        {
          replacements: {
            funnelId,
            userId,
            prevStep: stepIndex - 1,
          },
          type: QueryTypes.SELECT,
        }
      );

      const timeToComplete = prevStep[0]
        ? Math.floor((Date.now() - new Date((prevStep[0] as unknown).completed_at).getTime()) / 1000)
        : null;

      await sequelize.query(
        `INSERT INTO funnel_completions 
         (funnel_id, user_id, step_index, time_to_complete_seconds, 
          attribution_source, attribution_medium, attribution_campaign)
         VALUES (:funnelId, :userId, :stepIndex, :timeToComplete,
                 :source, :medium, :campaign)
         ON CONFLICT (funnel_id, user_id, step_index) DO NOTHING`,
        {
          replacements: {
            funnelId,
            userId,
            stepIndex,
            timeToComplete,
            source: attribution?.source,
            medium: attribution?.medium,
            campaign: attribution?.campaign,
          },
          type: QueryTypes.INSERT,
        }
      );
    } catch (error) {
      logger.error('Failed to track funnel step', { error, funnelId, userId, stepIndex });
    }
  }

  // Get funnel analytics
  async getFunnelAnalytics(
    funnelId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<FunnelData[]> {
    try {
      const dateFilter =
        startDate && endDate ? 'AND fc.completed_at BETWEEN :startDate AND :endDate' : '';

      const result = await sequelize.query(
        `WITH funnel_info AS (
           SELECT id, steps::json as steps
           FROM conversion_funnels
           WHERE id = :funnelId
         ),
         step_completions AS (
           SELECT 
             fc.step_index,
             COUNT(DISTINCT fc.user_id) as users,
             AVG(fc.time_to_complete_seconds) as avg_time
           FROM funnel_completions fc
           WHERE fc.funnel_id = :funnelId
             ${dateFilter}
           GROUP BY fc.step_index
         )
         SELECT 
           s.step_index,
           fi.steps->s.step_index->>'name' as step,
           COALESCE(sc.users, 0) as users,
           CASE 
             WHEN s.step_index = 0 THEN 100
             ELSE ROUND(COALESCE(sc.users, 0)::decimal / 
                       NULLIF((SELECT users FROM step_completions WHERE step_index = 0), 0) * 100, 2)
           END as "conversionRate",
           CASE
             WHEN s.step_index = 0 THEN 0
             ELSE 100 - ROUND(COALESCE(sc.users, 0)::decimal / 
                             NULLIF((SELECT users FROM step_completions WHERE step_index = s.step_index - 1), 0) * 100, 2)
           END as "dropoffRate",
           sc.avg_time as "avgTimeToComplete"
         FROM funnel_info fi
         CROSS JOIN LATERAL generate_series(0, jsonb_array_length(fi.steps::jsonb) - 1) as s(step_index)
         LEFT JOIN step_completions sc ON sc.step_index = s.step_index
         ORDER BY s.step_index`,
        {
          replacements: {
            funnelId,
            startDate,
            endDate,
          },
          type: QueryTypes.SELECT,
        }
      );

      return result as FunnelData[];
    } catch (error) {
      logger.error('Failed to get funnel analytics', { error, funnelId });
      throw error;
    }
  }

  // Calculate revenue analytics
  async calculateRevenueAnalytics(date: Date): Promise<void> {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const _monthStart = format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd');

      await sequelize.query(
        `INSERT INTO revenue_analytics (
           date,
           total_revenue,
           recurring_revenue,
           new_revenue,
           total_customers,
           new_customers,
           arpu,
           mrr_growth_rate
         )
         WITH daily_stats AS (
           SELECT 
             COUNT(DISTINCT CASE WHEN t.type = 'subscription' THEN t.user_id END) as total_customers,
             COUNT(DISTINCT CASE WHEN t.type = 'subscription' AND DATE(u.created_at) = :date THEN t.user_id END) as new_customers,
             SUM(t.amount) as total_revenue,
             SUM(CASE WHEN t.type = 'subscription' THEN t.amount ELSE 0 END) as recurring_revenue,
             SUM(CASE WHEN t.type = 'subscription' AND DATE(u.created_at) = :date THEN t.amount ELSE 0 END) as new_revenue
           FROM transactions t
           JOIN users u ON t.user_id = u.id
           WHERE DATE(t.created_at) = :date
             AND t.status = 'completed'
         ),
         prev_month_mrr AS (
           SELECT SUM(amount) as mrr
           FROM transactions
           WHERE DATE(created_at) = DATE(:date - INTERVAL '1 month')
             AND type = 'subscription'
             AND status = 'completed'
         )
         SELECT 
           :date,
           ds.total_revenue,
           ds.recurring_revenue,
           ds.new_revenue,
           ds.total_customers,
           ds.new_customers,
           CASE WHEN ds.total_customers > 0 
                THEN ROUND(ds.total_revenue / ds.total_customers, 2) 
                ELSE 0 END,
           CASE WHEN pm.mrr > 0 
                THEN ROUND((ds.recurring_revenue - pm.mrr) / pm.mrr * 100, 2)
                ELSE 0 END
         FROM daily_stats ds
         CROSS JOIN prev_month_mrr pm
         ON CONFLICT (date)
         DO UPDATE SET
           total_revenue = EXCLUDED.total_revenue,
           recurring_revenue = EXCLUDED.recurring_revenue,
           new_revenue = EXCLUDED.new_revenue,
           total_customers = EXCLUDED.total_customers,
           new_customers = EXCLUDED.new_customers,
           arpu = EXCLUDED.arpu,
           mrr_growth_rate = EXCLUDED.mrr_growth_rate`,
        {
          replacements: { date: dateStr },
          type: QueryTypes.INSERT,
        }
      );
    } catch (error) {
      logger.error('Failed to calculate revenue analytics', { error, date });
    }
  }

  // Get cohort comparison
  async compareCohorts(
    cohortIds: number[],
    metricType: 'retention' | 'revenue' | 'engagement'
  ): Promise<unknown> {
    try {
      const cacheKey = `cohort-comparison:${cohortIds.join('-')}:${metricType}`;
      const cached = await getCacheService().get(cacheKey);
      if (cached) return cached;

      let query = '';
      switch (metricType) {
        case 'retention':
          query = `
            SELECT 
              c.id as cohort_id,
              c.name as cohort_name,
              rm.period_number,
              rm.retention_rate,
              rm.active_users
            FROM user_cohorts c
            JOIN retention_metrics rm ON c.id = rm.cohort_id
            WHERE c.id = ANY(:cohortIds)
              AND rm.period_type = 'day'
              AND rm.period_number <= 30
            ORDER BY c.id, rm.period_number
          `;
          break;

        case 'revenue':
          query = `
            SELECT 
              c.id as cohort_id,
              c.name as cohort_name,
              DATE_PART('day', t.created_at - ucm.joined_at) as days_since_join,
              AVG(t.amount) as avg_revenue,
              SUM(t.amount) as total_revenue
            FROM user_cohorts c
            JOIN user_cohort_members ucm ON c.id = ucm.cohort_id
            JOIN transactions t ON ucm.user_id = t.user_id
            WHERE c.id = ANY(:cohortIds)
              AND t.status = 'completed'
              AND t.created_at >= ucm.joined_at
            GROUP BY c.id, c.name, days_since_join
            ORDER BY c.id, days_since_join
          `;
          break;

        case 'engagement':
          query = `
            SELECT 
              c.id as cohort_id,
              c.name as cohort_name,
              DATE(ual.created_at) as date,
              COUNT(DISTINCT ual.user_id) as active_users,
              COUNT(ual.id) as total_activities,
              AVG(ual.duration_seconds) as avg_session_duration
            FROM user_cohorts c
            JOIN user_cohort_members ucm ON c.id = ucm.cohort_id
            JOIN user_activity_logs ual ON ucm.user_id = ual.user_id
            WHERE c.id = ANY(:cohortIds)
              AND ual.created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY c.id, c.name, DATE(ual.created_at)
            ORDER BY c.id, date
          `;
          break;
      }

      const result = await sequelize.query(query, {
        replacements: { cohortIds },
        type: QueryTypes.SELECT,
      });

      await getCacheService().set(cacheKey, result, { ttl: 3600 }); // 1 hour cache
      return result;
    } catch (error) {
      logger.error('Failed to compare cohorts', { error, cohortIds });
      throw error;
    }
  }

  // Get feature adoption metrics
  async getFeatureAdoption(featureName?: string, startDate?: Date, endDate?: Date): Promise<unknown> {
    try {
      const dateFilter =
        startDate && endDate
          ? 'WHERE date BETWEEN :startDate AND :endDate'
          : "WHERE date >= CURRENT_DATE - INTERVAL '30 days'";

      const featureFilter = featureName ? 'AND feature_name = :featureName' : '';

      const result = await sequelize.query(
        `SELECT 
           feature_name,
           date,
           unique_users,
           total_uses,
           avg_uses_per_user,
           adoption_rate
         FROM feature_usage_stats
         ${dateFilter}
         ${featureFilter}
         ORDER BY date DESC, unique_users DESC`,
        {
          replacements: {
            featureName,
            startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
            endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
          },
          type: QueryTypes.SELECT,
        }
      );

      return result;
    } catch (error) {
      logger.error('Failed to get feature adoption', { error });
      throw error;
    }
  }

  // Get user lifecycle stage
  async getUserLifecycleStage(userId: number): Promise<string> {
    try {
      const result = await sequelize.query(
        `WITH user_stats AS (
           SELECT 
             u.created_at,
             u.last_login_at,
             COUNT(DISTINCT DATE(ual.created_at)) as active_days,
             MAX(ual.created_at) as last_activity,
             COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_transactions
           FROM users u
           LEFT JOIN user_activity_logs ual ON u.id = ual.user_id
             AND ual.created_at >= CURRENT_DATE - INTERVAL '30 days'
           LEFT JOIN transactions t ON u.id = t.user_id
           WHERE u.id = :userId
           GROUP BY u.id, u.created_at, u.last_login_at
         )
         SELECT 
           CASE 
             WHEN last_activity IS NULL OR last_activity < CURRENT_DATE - INTERVAL '30 days' THEN 'dormant'
             WHEN created_at > CURRENT_DATE - INTERVAL '7 days' THEN 'new'
             WHEN active_days >= 15 AND completed_transactions > 0 THEN 'power'
             WHEN active_days >= 7 THEN 'active'
             WHEN active_days >= 1 THEN 'casual'
             ELSE 'at_risk'
           END as lifecycle_stage
         FROM user_stats`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      );

      return (result[0] as unknown)?.lifecycle_stage || 'unknown';
    } catch (error) {
      logger.error('Failed to get user lifecycle stage', { error, userId });
      return 'unknown';
    }
  }

  // Schedule daily analytics calculations
  async runDailyAnalytics(): Promise<void> {
    try {
      const yesterday = subDays(new Date(), 1);

      // Calculate revenue analytics
      await this.calculateRevenueAnalytics(yesterday);

      // Update retention for active cohorts
      const activeCohorts = await sequelize.query(
        'SELECT id FROM user_cohorts WHERE is_active = true',
        { type: QueryTypes.SELECT }
      );

      for (const cohort of activeCohorts) {
        await this.calculateRetention((cohort as unknown).id, 'day');
        await this.calculateRetention((cohort as unknown).id, 'week');
        await this.calculateRetention((cohort as unknown).id, 'month');
      }

      // Calculate feature adoption rates
      await sequelize.query(
        `UPDATE feature_usage_stats
         SET adoption_rate = ROUND(unique_users::decimal / 
           (SELECT COUNT(DISTINCT user_id) FROM user_activity_logs 
            WHERE DATE(created_at) = feature_usage_stats.date) * 100, 2)
         WHERE date = :yesterday`,
        {
          replacements: { yesterday: format(yesterday, 'yyyy-MM-dd') },
          type: QueryTypes.UPDATE,
        }
      );

      logger.info('Daily analytics completed');
    } catch (error) {
      logger.error('Failed to run daily analytics', { error });
    }
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();
