import { Pool } from 'pg';
import { logger } from '../../../utils/logger';

/**
 * Funnel Analytics Service
 *
 * Tracks conversion funnels and identifies drop-off points
 */

export interface FunnelStep {
  stepNumber: number;
  stepName: string;
  usersEntered: number;
  usersCompleted: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeToComplete: number; // in hours
}

export interface FunnelAnalysis {
  funnelName: string;
  totalEntered: number;
  totalCompleted: number;
  overallConversionRate: number;
  avgTimeToCompletion: number;
  steps: FunnelStep[];
}

export class FunnelAnalyticsService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Analyze onboarding funnel
   * Steps: Signup → Email Verify → First Habit → First Checkin → 7-Day Retention
   */
  async analyzeOnboardingFunnel(
    startDate: string,
    endDate: string
  ): Promise<FunnelAnalysis> {
    const query = `
      WITH cohort AS (
        SELECT
          id AS user_id,
          created_at AS signup_at
        FROM users
        WHERE created_at >= $1 AND created_at <= $2
      ),

      step1_signup AS (
        SELECT
          user_id,
          signup_at,
          1 AS step_completed
        FROM cohort
      ),

      step2_email_verify AS (
        SELECT
          c.user_id,
          c.signup_at,
          u.email_verified_at,
          EXTRACT(EPOCH FROM (u.email_verified_at - c.signup_at)) / 3600 AS hours_to_verify,
          2 AS step_completed
        FROM cohort c
        JOIN users u ON c.user_id = u.id
        WHERE u.email_verified_at IS NOT NULL
      ),

      step3_first_habit AS (
        SELECT
          c.user_id,
          c.signup_at,
          MIN(h.created_at) AS first_habit_at,
          EXTRACT(EPOCH FROM (MIN(h.created_at) - c.signup_at)) / 3600 AS hours_to_first_habit,
          3 AS step_completed
        FROM cohort c
        JOIN habits h ON c.user_id = h.user_id
        GROUP BY c.user_id, c.signup_at
      ),

      step4_first_checkin AS (
        SELECT
          c.user_id,
          c.signup_at,
          MIN(hc.created_at) AS first_checkin_at,
          EXTRACT(EPOCH FROM (MIN(hc.created_at) - c.signup_at)) / 3600 AS hours_to_first_checkin,
          4 AS step_completed
        FROM cohort c
        JOIN habit_checkins hc ON c.user_id = hc.user_id
        WHERE hc.status = 'completed'
        GROUP BY c.user_id, c.signup_at
      ),

      step5_7day_retention AS (
        SELECT
          c.user_id,
          c.signup_at,
          MAX(hc.created_at) AS last_checkin_at,
          5 AS step_completed
        FROM cohort c
        JOIN habit_checkins hc ON c.user_id = hc.user_id
        WHERE hc.created_at <= c.signup_at + INTERVAL '7 days'
          AND hc.status = 'completed'
        GROUP BY c.user_id, c.signup_at
        HAVING COUNT(DISTINCT DATE(hc.created_at)) >= 3
      ),

      funnel_data AS (
        SELECT 1 AS step_number, 'Signup' AS step_name,
               COUNT(*) AS users_entered,
               COUNT(*) AS users_completed,
               0 AS avg_time_hours
        FROM step1_signup

        UNION ALL

        SELECT 2, 'Email Verified',
               (SELECT COUNT(*) FROM step1_signup),
               COUNT(*),
               AVG(hours_to_verify)
        FROM step2_email_verify

        UNION ALL

        SELECT 3, 'First Habit Created',
               (SELECT COUNT(*) FROM step2_email_verify),
               COUNT(*),
               AVG(hours_to_first_habit)
        FROM step3_first_habit

        UNION ALL

        SELECT 4, 'First Check-in Completed',
               (SELECT COUNT(*) FROM step3_first_habit),
               COUNT(*),
               AVG(hours_to_first_checkin)
        FROM step4_first_checkin

        UNION ALL

        SELECT 5, '7-Day Retention (3+ active days)',
               (SELECT COUNT(*) FROM step4_first_checkin),
               COUNT(*),
               168
        FROM step5_7day_retention
      )

      SELECT
        step_number,
        step_name,
        users_entered,
        users_completed,
        ROUND(100.0 * users_completed / NULLIF(users_entered, 0), 2) AS conversion_rate,
        ROUND(100.0 * (users_entered - users_completed) / NULLIF(users_entered, 0), 2) AS drop_off_rate,
        ROUND(avg_time_hours, 2) AS avg_time_to_complete
      FROM funnel_data
      ORDER BY step_number
    `;

    const result = await this.db.query(query, [startDate, endDate]);

    const steps: FunnelStep[] = result.rows.map(row => ({
      stepNumber: row.step_number,
      stepName: row.step_name,
      usersEntered: row.users_entered,
      usersCompleted: row.users_completed,
      conversionRate: row.conversion_rate,
      dropOffRate: row.drop_off_rate,
      avgTimeToComplete: row.avg_time_to_complete,
    }));

    const firstStep = steps[0];
    const lastStep = steps[steps.length - 1];

    return {
      funnelName: 'Onboarding Funnel',
      totalEntered: firstStep.usersEntered,
      totalCompleted: lastStep.usersCompleted,
      overallConversionRate: lastStep.usersCompleted / firstStep.usersEntered * 100,
      avgTimeToCompletion: steps.reduce((sum, s) => sum + s.avgTimeToComplete, 0),
      steps,
    };
  }

  /**
   * Analyze subscription conversion funnel
   * Steps: Free Trial → First Payment → 30-Day Retention → Renewal
   */
  async analyzeSubscriptionFunnel(
    startDate: string,
    endDate: string
  ): Promise<FunnelAnalysis> {
    const query = `
      WITH trial_users AS (
        SELECT
          user_id,
          MIN(trial_start) AS trial_start_date
        FROM subscriptions
        WHERE trial_start >= $1 AND trial_start <= $2
        GROUP BY user_id
      ),

      step1_trial AS (
        SELECT user_id, 1 AS step_completed
        FROM trial_users
      ),

      step2_first_payment AS (
        SELECT
          tu.user_id,
          2 AS step_completed,
          EXTRACT(EPOCH FROM (MIN(p.created_at) - tu.trial_start_date)) / 3600 AS hours_to_payment
        FROM trial_users tu
        JOIN payments p ON tu.user_id = p.user_id
        WHERE p.status = 'succeeded'
        GROUP BY tu.user_id, tu.trial_start_date
      ),

      step3_30day_retention AS (
        SELECT
          tu.user_id,
          3 AS step_completed
        FROM trial_users tu
        JOIN habit_checkins hc ON tu.user_id = hc.user_id
        WHERE hc.created_at >= tu.trial_start_date
          AND hc.created_at <= tu.trial_start_date + INTERVAL '30 days'
        GROUP BY tu.user_id
        HAVING COUNT(DISTINCT DATE(hc.created_at)) >= 15
      ),

      step4_renewal AS (
        SELECT
          tu.user_id,
          4 AS step_completed
        FROM trial_users tu
        JOIN subscriptions s ON tu.user_id = s.user_id
        WHERE s.current_period_end > tu.trial_start_date + INTERVAL '30 days'
          AND s.status = 'active'
      ),

      funnel_data AS (
        SELECT 1 AS step_number, 'Started Trial' AS step_name,
               COUNT(*) AS users_entered,
               COUNT(*) AS users_completed,
               0 AS avg_time_hours
        FROM step1_trial

        UNION ALL

        SELECT 2, 'First Payment',
               (SELECT COUNT(*) FROM step1_trial),
               COUNT(*),
               AVG(hours_to_payment)
        FROM step2_first_payment

        UNION ALL

        SELECT 3, '30-Day Retention',
               (SELECT COUNT(*) FROM step2_first_payment),
               COUNT(*),
               720
        FROM step3_30day_retention

        UNION ALL

        SELECT 4, 'Renewal',
               (SELECT COUNT(*) FROM step3_30day_retention),
               COUNT(*),
               0
        FROM step4_renewal
      )

      SELECT
        step_number,
        step_name,
        users_entered,
        users_completed,
        ROUND(100.0 * users_completed / NULLIF(users_entered, 0), 2) AS conversion_rate,
        ROUND(100.0 * (users_entered - users_completed) / NULLIF(users_entered, 0), 2) AS drop_off_rate,
        ROUND(avg_time_hours, 2) AS avg_time_to_complete
      FROM funnel_data
      ORDER BY step_number
    `;

    const result = await this.db.query(query, [startDate, endDate]);

    const steps: FunnelStep[] = result.rows.map(row => ({
      stepNumber: row.step_number,
      stepName: row.step_name,
      usersEntered: row.users_entered,
      usersCompleted: row.users_completed,
      conversionRate: row.conversion_rate,
      dropOffRate: row.drop_off_rate,
      avgTimeToComplete: row.avg_time_to_complete,
    }));

    const firstStep = steps[0];
    const lastStep = steps[steps.length - 1];

    return {
      funnelName: 'Subscription Conversion Funnel',
      totalEntered: firstStep.usersEntered,
      totalCompleted: lastStep.usersCompleted,
      overallConversionRate: lastStep.usersCompleted / firstStep.usersEntered * 100,
      avgTimeToCompletion: steps.reduce((sum, s) => sum + s.avgTimeToComplete, 0),
      steps,
    };
  }

  /**
   * Analyze goal completion funnel
   */
  async analyzeGoalCompletionFunnel(
    startDate: string,
    endDate: string
  ): Promise<FunnelAnalysis> {
    const query = `
      WITH goal_cohort AS (
        SELECT
          id AS goal_id,
          user_id,
          created_at
        FROM goals
        WHERE created_at >= $1 AND created_at <= $2
      ),

      funnel_data AS (
        SELECT 1 AS step_number, 'Goal Created' AS step_name,
               COUNT(*) AS users_entered,
               COUNT(*) AS users_completed,
               0 AS avg_time_hours
        FROM goal_cohort

        UNION ALL

        SELECT 2, 'First Milestone',
               (SELECT COUNT(*) FROM goal_cohort),
               COUNT(DISTINCT gc.goal_id),
               AVG(EXTRACT(EPOCH FROM (MIN(hc.created_at) - gc.created_at)) / 3600)
        FROM goal_cohort gc
        JOIN habit_checkins hc ON gc.user_id = hc.user_id
        WHERE hc.created_at >= gc.created_at
        GROUP BY gc.goal_id
        HAVING COUNT(*) >= 1

        UNION ALL

        SELECT 3, 'Goal Completed',
               (SELECT COUNT(*) FROM goal_cohort),
               COUNT(*),
               AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)
        FROM goal_cohort gc
        JOIN goals g ON gc.goal_id = g.id
        WHERE g.status = 'completed'
      )

      SELECT
        step_number,
        step_name,
        users_entered,
        users_completed,
        ROUND(100.0 * users_completed / NULLIF(users_entered, 0), 2) AS conversion_rate,
        ROUND(100.0 * (users_entered - users_completed) / NULLIF(users_entered, 0), 2) AS drop_off_rate,
        ROUND(avg_time_hours, 2) AS avg_time_to_complete
      FROM funnel_data
      ORDER BY step_number
    `;

    const result = await this.db.query(query, [startDate, endDate]);

    const steps: FunnelStep[] = result.rows.map(row => ({
      stepNumber: row.step_number,
      stepName: row.step_name,
      usersEntered: row.users_entered,
      usersCompleted: row.users_completed,
      conversionRate: row.conversion_rate,
      dropOffRate: row.drop_off_rate,
      avgTimeToComplete: row.avg_time_to_complete,
    }));

    const firstStep = steps[0];
    const lastStep = steps[steps.length - 1];

    logger.info('Goal completion funnel analyzed', {
      totalGoals: firstStep.usersEntered,
      completedGoals: lastStep.usersCompleted,
      completionRate: lastStep.conversionRate,
    });

    return {
      funnelName: 'Goal Completion Funnel',
      totalEntered: firstStep.usersEntered,
      totalCompleted: lastStep.usersCompleted,
      overallConversionRate: lastStep.usersCompleted / firstStep.usersEntered * 100,
      avgTimeToCompletion: steps.reduce((sum, s) => sum + s.avgTimeToComplete, 0),
      steps,
    };
  }

  /**
   * Get funnel metrics with A/B test segmentation
   */
  async getFunnelWithABTest(
    funnelType: 'onboarding' | 'subscription' | 'goal',
    startDate: string,
    endDate: string,
    abTestVariant?: string
  ): Promise<FunnelAnalysis> {
    // TODO: Implement A/B test segmentation

    switch (funnelType) {
      case 'onboarding':
        return this.analyzeOnboardingFunnel(startDate, endDate);
      case 'subscription':
        return this.analyzeSubscriptionFunnel(startDate, endDate);
      case 'goal':
        return this.analyzeGoalCompletionFunnel(startDate, endDate);
      default:
        throw new Error(`Unknown funnel type: ${funnelType}`);
    }
  }
}
