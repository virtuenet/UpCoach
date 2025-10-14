"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedAnalyticsService = exports.AdvancedAnalyticsService = void 0;
const date_fns_1 = require("date-fns");
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const sqlSecurity_1 = require("../../utils/sqlSecurity");
const UnifiedCacheService_1 = require("../cache/UnifiedCacheService");
class AdvancedAnalyticsService {
    async createCohort(definition, createdBy) {
        try {
            const validatedParams = (0, sqlSecurity_1.validateQueryParams)({
                name: definition.name,
                description: definition.description,
                type: definition.type,
                startDate: definition.startDate,
                endDate: definition.endDate,
                filters: JSON.stringify(definition.filters || {}),
                createdBy,
            });
            const result = await (0, sqlSecurity_1.executeSecureQuery)(models_1.sequelize, `INSERT INTO user_cohorts (name, description, cohort_type, start_date, end_date, filters, created_by)
         VALUES (:name, :description, :type, :startDate, :endDate, :filters, :createdBy)
         RETURNING id`, validatedParams, sequelize_1.QueryTypes.INSERT);
            const cohortId = result[0][0].id;
            await this.populateCohortMembers(cohortId, definition);
            logger_1.logger.info('Cohort created', { cohortId, name: definition.name });
            return cohortId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create cohort', { error, definition });
            throw error;
        }
    }
    async populateCohortMembers(cohortId, definition) {
        let userQuery = '';
        const replacements = { cohortId };
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
                userQuery = this.buildCustomCohortQuery(definition.filters);
                Object.assign(replacements, definition.filters);
                break;
        }
        await (0, sqlSecurity_1.executeSecureQuery)(models_1.sequelize, userQuery, (0, sqlSecurity_1.validateQueryParams)(replacements), sequelize_1.QueryTypes.INSERT);
        await (0, sqlSecurity_1.executeSecureQuery)(models_1.sequelize, `UPDATE user_cohorts 
       SET user_count = (SELECT COUNT(*) FROM user_cohort_members WHERE cohort_id = :cohortId)
       WHERE id = :cohortId`, (0, sqlSecurity_1.validateQueryParams)({ cohortId }), sequelize_1.QueryTypes.UPDATE);
    }
    buildCustomCohortQuery(filters) {
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
    async calculateRetention(cohortId, periodType = 'day') {
        try {
            if (!['day', 'week', 'month'].includes(periodType)) {
                throw new Error('Invalid period type');
            }
            await (0, sqlSecurity_1.executeSecureQuery)(models_1.sequelize, 'SELECT calculate_cohort_retention(:cohortId, :periodType)', (0, sqlSecurity_1.validateQueryParams)({ cohortId, periodType }), sequelize_1.QueryTypes.SELECT);
            const metrics = await (0, sqlSecurity_1.executeSecureQuery)(models_1.sequelize, `SELECT 
          period_number as period,
          users_retained as "usersRetained",
          retention_rate as "retentionRate",
          100 - retention_rate as "churnRate",
          active_users as "activeUsers"
         FROM retention_metrics
         WHERE cohort_id = :cohortId
           AND period_type = :periodType
         ORDER BY period_number`, (0, sqlSecurity_1.validateQueryParams)({ cohortId, periodType }), sequelize_1.QueryTypes.SELECT);
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate retention', { error, cohortId });
            throw error;
        }
    }
    async trackActivity(userId, activityType, data, sessionId) {
        try {
            const validatedParams = (0, sqlSecurity_1.validateQueryParams)({
                userId,
                activityType: activityType.substring(0, 100),
                data: JSON.stringify(data || {}),
                sessionId,
                platform: data?.platform || 'web',
                deviceType: data?.deviceType || 'desktop',
            });
            await (0, sqlSecurity_1.executeSecureQuery)(models_1.sequelize, `INSERT INTO user_activity_logs 
         (user_id, activity_type, activity_data, session_id, platform, device_type)
         VALUES (:userId, :activityType, :data, :sessionId, :platform, :deviceType)`, validatedParams, sequelize_1.QueryTypes.INSERT);
            if (activityType.startsWith('feature_')) {
                await this.updateFeatureUsage(activityType.replace('feature_', ''), userId);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to track activity', { error, userId, activityType });
        }
    }
    async updateFeatureUsage(featureName, userId) {
        const today = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        const sanitizedFeatureName = featureName.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
        await (0, sqlSecurity_1.executeSecureQuery)(models_1.sequelize, `INSERT INTO feature_usage_stats (feature_name, date, unique_users, total_uses)
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
         total_uses = feature_usage_stats.total_uses + 1`, (0, sqlSecurity_1.validateQueryParams)({
            featureName: sanitizedFeatureName,
            date: today,
            userId,
            activityType: `feature_${sanitizedFeatureName}`,
        }), sequelize_1.QueryTypes.INSERT);
    }
    async createFunnel(name, steps, description) {
        try {
            const result = await models_1.sequelize.query(`INSERT INTO conversion_funnels (name, description, steps)
         VALUES (:name, :description, :steps)
         RETURNING id`, {
                replacements: {
                    name,
                    description,
                    steps: JSON.stringify(steps),
                },
                type: sequelize_1.QueryTypes.INSERT,
            });
            return result[0][0].id;
        }
        catch (error) {
            logger_1.logger.error('Failed to create funnel', { error, name });
            throw error;
        }
    }
    async trackFunnelStep(funnelId, userId, stepIndex, attribution) {
        try {
            const prevStep = await models_1.sequelize.query(`SELECT completed_at FROM funnel_completions
         WHERE funnel_id = :funnelId AND user_id = :userId AND step_index = :prevStep`, {
                replacements: {
                    funnelId,
                    userId,
                    prevStep: stepIndex - 1,
                },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const timeToComplete = prevStep[0]
                ? Math.floor((Date.now() - new Date(prevStep[0].completed_at).getTime()) / 1000)
                : null;
            await models_1.sequelize.query(`INSERT INTO funnel_completions 
         (funnel_id, user_id, step_index, time_to_complete_seconds, 
          attribution_source, attribution_medium, attribution_campaign)
         VALUES (:funnelId, :userId, :stepIndex, :timeToComplete,
                 :source, :medium, :campaign)
         ON CONFLICT (funnel_id, user_id, step_index) DO NOTHING`, {
                replacements: {
                    funnelId,
                    userId,
                    stepIndex,
                    timeToComplete,
                    source: attribution?.source,
                    medium: attribution?.medium,
                    campaign: attribution?.campaign,
                },
                type: sequelize_1.QueryTypes.INSERT,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to track funnel step', { error, funnelId, userId, stepIndex });
        }
    }
    async getFunnelAnalytics(funnelId, startDate, endDate) {
        try {
            const dateFilter = startDate && endDate ? 'AND fc.completed_at BETWEEN :startDate AND :endDate' : '';
            const result = await models_1.sequelize.query(`WITH funnel_info AS (
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
         ORDER BY s.step_index`, {
                replacements: {
                    funnelId,
                    startDate,
                    endDate,
                },
                type: sequelize_1.QueryTypes.SELECT,
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get funnel analytics', { error, funnelId });
            throw error;
        }
    }
    async calculateRevenueAnalytics(date) {
        try {
            const dateStr = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
            const _monthStart = (0, date_fns_1.format)(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd');
            await models_1.sequelize.query(`INSERT INTO revenue_analytics (
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
           mrr_growth_rate = EXCLUDED.mrr_growth_rate`, {
                replacements: { date: dateStr },
                type: sequelize_1.QueryTypes.INSERT,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate revenue analytics', { error, date });
        }
    }
    async compareCohorts(cohortIds, metricType) {
        try {
            const cacheKey = `cohort-comparison:${cohortIds.join('-')}:${metricType}`;
            const cached = await (0, UnifiedCacheService_1.getCacheService)().get(cacheKey);
            if (cached)
                return cached;
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
            const result = await models_1.sequelize.query(query, {
                replacements: { cohortIds },
                type: sequelize_1.QueryTypes.SELECT,
            });
            await (0, UnifiedCacheService_1.getCacheService)().set(cacheKey, result, { ttl: 3600 });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to compare cohorts', { error, cohortIds });
            throw error;
        }
    }
    async getFeatureAdoption(featureName, startDate, endDate) {
        try {
            const dateFilter = startDate && endDate
                ? 'WHERE date BETWEEN :startDate AND :endDate'
                : "WHERE date >= CURRENT_DATE - INTERVAL '30 days'";
            const featureFilter = featureName ? 'AND feature_name = :featureName' : '';
            const result = await models_1.sequelize.query(`SELECT 
           feature_name,
           date,
           unique_users,
           total_uses,
           avg_uses_per_user,
           adoption_rate
         FROM feature_usage_stats
         ${dateFilter}
         ${featureFilter}
         ORDER BY date DESC, unique_users DESC`, {
                replacements: {
                    featureName,
                    startDate: startDate ? (0, date_fns_1.format)(startDate, 'yyyy-MM-dd') : null,
                    endDate: endDate ? (0, date_fns_1.format)(endDate, 'yyyy-MM-dd') : null,
                },
                type: sequelize_1.QueryTypes.SELECT,
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to get feature adoption', { error });
            throw error;
        }
    }
    async getUserLifecycleStage(userId) {
        try {
            const result = await models_1.sequelize.query(`WITH user_stats AS (
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
         FROM user_stats`, {
                replacements: { userId },
                type: sequelize_1.QueryTypes.SELECT,
            });
            return result[0]?.lifecycle_stage || 'unknown';
        }
        catch (error) {
            logger_1.logger.error('Failed to get user lifecycle stage', { error, userId });
            return 'unknown';
        }
    }
    async runDailyAnalytics() {
        try {
            const yesterday = (0, date_fns_1.subDays)(new Date(), 1);
            await this.calculateRevenueAnalytics(yesterday);
            const activeCohorts = await models_1.sequelize.query('SELECT id FROM user_cohorts WHERE is_active = true', { type: sequelize_1.QueryTypes.SELECT });
            for (const cohort of activeCohorts) {
                await this.calculateRetention(cohort.id, 'day');
                await this.calculateRetention(cohort.id, 'week');
                await this.calculateRetention(cohort.id, 'month');
            }
            await models_1.sequelize.query(`UPDATE feature_usage_stats
         SET adoption_rate = ROUND(unique_users::decimal / 
           (SELECT COUNT(DISTINCT user_id) FROM user_activity_logs 
            WHERE DATE(created_at) = feature_usage_stats.date) * 100, 2)
         WHERE date = :yesterday`, {
                replacements: { yesterday: (0, date_fns_1.format)(yesterday, 'yyyy-MM-dd') },
                type: sequelize_1.QueryTypes.UPDATE,
            });
            logger_1.logger.info('Daily analytics completed');
        }
        catch (error) {
            logger_1.logger.error('Failed to run daily analytics', { error });
        }
    }
}
exports.AdvancedAnalyticsService = AdvancedAnalyticsService;
exports.advancedAnalyticsService = new AdvancedAnalyticsService();
