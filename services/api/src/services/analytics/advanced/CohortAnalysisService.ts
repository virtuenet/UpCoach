import { Pool } from 'pg';
import { logger } from '../../../utils/logger';

/**
 * Cohort Analysis Service
 *
 * Analyzes user cohorts for retention, LTV, and engagement patterns
 */

export interface CohortRetentionData {
  cohortMonth: string;
  cohortSize: number;
  retentionByMonth: {
    month: number;
    retainedUsers: number;
    retentionRate: number;
  }[];
}

export interface CohortLTVData {
  cohortMonth: string;
  cohortSize: number;
  avgLTV: number;
  totalRevenue: number;
  ltvByMonth: {
    month: number;
    cumulativeLTV: number;
  }[];
}

export class CohortAnalysisService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Get retention rates by cohort
   */
  async getRetentionCohorts(
    startDate: string,
    endDate: string,
    cohortPeriod: 'month' | 'week' = 'month'
  ): Promise<CohortRetentionData[]> {
    const periodTrunc = cohortPeriod === 'month' ? 'month' : 'week';

    const query = `
      WITH user_cohorts AS (
        SELECT
          user_id,
          DATE_TRUNC('${periodTrunc}', created_at) AS cohort_period
        FROM users
        WHERE created_at >= $1 AND created_at <= $2
      ),

      user_activity AS (
        SELECT DISTINCT
          uc.user_id,
          uc.cohort_period,
          DATE_TRUNC('${periodTrunc}', hc.created_at) AS activity_period,
          EXTRACT(EPOCH FROM (DATE_TRUNC('${periodTrunc}', hc.created_at) - uc.cohort_period)) / (86400 * 30) AS months_since_signup
        FROM user_cohorts uc
        LEFT JOIN habit_checkins hc ON uc.user_id = hc.user_id
        WHERE hc.created_at IS NOT NULL
      ),

      cohort_retention AS (
        SELECT
          cohort_period,
          COUNT(DISTINCT user_id) AS cohort_size,
          months_since_signup AS month_number,
          COUNT(DISTINCT user_id) AS retained_users,
          ROUND(100.0 * COUNT(DISTINCT user_id) / COUNT(DISTINCT user_id) FILTER (WHERE months_since_signup = 0), 2) AS retention_rate
        FROM user_activity
        GROUP BY cohort_period, months_since_signup
        ORDER BY cohort_period, months_since_signup
      )

      SELECT
        TO_CHAR(cohort_period, 'YYYY-MM') AS cohort_month,
        MAX(cohort_size) AS cohort_size,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'month', month_number,
            'retainedUsers', retained_users,
            'retentionRate', retention_rate
          ) ORDER BY month_number
        ) AS retention_by_month
      FROM cohort_retention
      GROUP BY cohort_period
      ORDER BY cohort_period
    `;

    const result = await this.db.query(query, [startDate, endDate]);

    return result.rows.map(row => ({
      cohortMonth: row.cohort_month,
      cohortSize: row.cohort_size,
      retentionByMonth: row.retention_by_month,
    }));
  }

  /**
   * Get LTV by cohort
   */
  async getLTVByCohort(
    startDate: string,
    endDate: string
  ): Promise<CohortLTVData[]> {
    const query = `
      WITH user_cohorts AS (
        SELECT
          user_id,
          DATE_TRUNC('month', created_at) AS cohort_month
        FROM users
        WHERE created_at >= $1 AND created_at <= $2
      ),

      cohort_payments AS (
        SELECT
          uc.cohort_month,
          uc.user_id,
          p.amount,
          p.created_at,
          EXTRACT(EPOCH FROM (DATE_TRUNC('month', p.created_at) - uc.cohort_month)) / (86400 * 30) AS months_since_signup
        FROM user_cohorts uc
        LEFT JOIN payments p ON uc.user_id = p.user_id
        WHERE p.status = 'succeeded'
      ),

      cohort_ltv AS (
        SELECT
          cohort_month,
          COUNT(DISTINCT user_id) AS cohort_size,
          SUM(amount) AS total_revenue,
          AVG(amount) AS avg_ltv,
          months_since_signup,
          SUM(SUM(amount)) OVER (
            PARTITION BY cohort_month
            ORDER BY months_since_signup
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS cumulative_ltv
        FROM cohort_payments
        GROUP BY cohort_month, months_since_signup
      )

      SELECT
        TO_CHAR(cohort_month, 'YYYY-MM') AS cohort_month,
        MAX(cohort_size) AS cohort_size,
        SUM(total_revenue) AS total_revenue,
        MAX(cumulative_ltv) / NULLIF(MAX(cohort_size), 0) AS avg_ltv,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'month', months_since_signup,
            'cumulativeLTV', cumulative_ltv / NULLIF(cohort_size, 0)
          ) ORDER BY months_since_signup
        ) AS ltv_by_month
      FROM cohort_ltv
      GROUP BY cohort_month
      ORDER BY cohort_month
    `;

    const result = await this.db.query(query, [startDate, endDate]);

    return result.rows.map(row => ({
      cohortMonth: row.cohort_month,
      cohortSize: row.cohort_size,
      avgLTV: row.avg_ltv || 0,
      totalRevenue: row.total_revenue || 0,
      ltvByMonth: row.ltv_by_month,
    }));
  }

  /**
   * Get feature adoption by cohort
   */
  async getFeatureAdoptionByCohort(featureName: string): Promise<any[]> {
    const query = `
      WITH user_cohorts AS (
        SELECT
          user_id,
          DATE_TRUNC('month', created_at) AS cohort_month
        FROM users
        WHERE created_at >= NOW() - INTERVAL '12 months'
      ),

      feature_usage AS (
        SELECT
          uc.cohort_month,
          COUNT(DISTINCT uc.user_id) AS cohort_size,
          COUNT(DISTINCT CASE WHEN ae.event_name = $1 THEN uc.user_id END) AS users_adopted,
          ROUND(100.0 * COUNT(DISTINCT CASE WHEN ae.event_name = $1 THEN uc.user_id END) / COUNT(DISTINCT uc.user_id), 2) AS adoption_rate
        FROM user_cohorts uc
        LEFT JOIN analytics_events ae ON uc.user_id = ae.user_id
        GROUP BY uc.cohort_month
      )

      SELECT
        TO_CHAR(cohort_month, 'YYYY-MM') AS cohort_month,
        cohort_size,
        users_adopted,
        adoption_rate
      FROM feature_usage
      ORDER BY cohort_month
    `;

    const result = await this.db.query(query, [featureName]);

    return result.rows;
  }

  /**
   * Get cohort churn analysis
   */
  async getChurnAnalysisByCohort(
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const query = `
      WITH user_cohorts AS (
        SELECT
          user_id,
          DATE_TRUNC('month', created_at) AS cohort_month
        FROM users
        WHERE created_at >= $1 AND created_at <= $2
      ),

      churn_events AS (
        SELECT
          uc.cohort_month,
          COUNT(DISTINCT uc.user_id) AS cohort_size,
          COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.user_id END) AS churned_users,
          ROUND(100.0 * COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.user_id END) / COUNT(DISTINCT uc.user_id), 2) AS churn_rate,
          AVG(CASE
            WHEN s.status = 'cancelled' THEN
              EXTRACT(DAY FROM (s.canceled_at - uc.cohort_month))
            ELSE NULL
          END) AS avg_days_to_churn
        FROM user_cohorts uc
        LEFT JOIN subscriptions s ON uc.user_id = s.user_id
        GROUP BY uc.cohort_month
      )

      SELECT
        TO_CHAR(cohort_month, 'YYYY-MM') AS cohort_month,
        cohort_size,
        churned_users,
        churn_rate,
        ROUND(avg_days_to_churn, 1) AS avg_days_to_churn
      FROM churn_events
      ORDER BY cohort_month
    `;

    const result = await this.db.query(query, [startDate, endDate]);

    logger.info('Cohort churn analysis completed', {
      cohorts: result.rows.length,
    });

    return result.rows;
  }

  /**
   * Get engagement metrics by cohort
   */
  async getEngagementByCohort(
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const query = `
      WITH user_cohorts AS (
        SELECT
          user_id,
          DATE_TRUNC('month', created_at) AS cohort_month
        FROM users
        WHERE created_at >= $1 AND created_at <= $2
      ),

      cohort_engagement AS (
        SELECT
          uc.cohort_month,
          COUNT(DISTINCT uc.user_id) AS cohort_size,
          AVG(COALESCE(hc.completion_count, 0)) AS avg_checkins_per_user,
          AVG(COALESCE(us.session_count, 0)) AS avg_sessions_per_user,
          AVG(COALESCE(us.avg_session_duration, 0)) AS avg_session_duration_minutes
        FROM user_cohorts uc
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS completion_count
          FROM habit_checkins
          WHERE status = 'completed'
          GROUP BY user_id
        ) hc ON uc.user_id = hc.user_id
        LEFT JOIN (
          SELECT
            user_id,
            COUNT(*) AS session_count,
            AVG(EXTRACT(EPOCH FROM (logout_at - login_at)) / 60) AS avg_session_duration
          FROM user_sessions
          WHERE logout_at IS NOT NULL
          GROUP BY user_id
        ) us ON uc.user_id = us.user_id
        GROUP BY uc.cohort_month
      )

      SELECT
        TO_CHAR(cohort_month, 'YYYY-MM') AS cohort_month,
        cohort_size,
        ROUND(avg_checkins_per_user, 2) AS avg_checkins_per_user,
        ROUND(avg_sessions_per_user, 2) AS avg_sessions_per_user,
        ROUND(avg_session_duration_minutes, 2) AS avg_session_duration_minutes
      FROM cohort_engagement
      ORDER BY cohort_month
    `;

    const result = await this.db.query(query, [startDate, endDate]);

    return result.rows;
  }
}
