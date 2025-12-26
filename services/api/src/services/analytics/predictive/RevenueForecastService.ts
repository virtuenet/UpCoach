import { Pool } from 'pg';
import { logger } from '../../../utils/logger';

/**
 * Revenue Forecast Service
 *
 * Predicts future revenue using time-series forecasting
 * Methods: Linear regression with trend + seasonality
 */

export interface RevenueForecast {
  forecastMonth: string;
  predictedMRR: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface ForecastSummary {
  currentMRR: number;
  forecast12Month: RevenueForecast[];
  totalPredictedRevenue: number;
  growthRate: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export class RevenueForecastService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Forecast MRR for next 12 months using linear regression
   */
  async forecastMRR(monthsAhead: number = 12): Promise<ForecastSummary> {
    // Get historical MRR data
    const historicalQuery = `
      WITH monthly_mrr AS (
        SELECT
          DATE_TRUNC('month', current_period_start) AS month,
          SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) AS mrr
        FROM subscriptions
        WHERE current_period_start >= NOW() - INTERVAL '24 months'
        GROUP BY DATE_TRUNC('month', current_period_start)
        ORDER BY month
      ),

      indexed_data AS (
        SELECT
          month,
          mrr,
          ROW_NUMBER() OVER (ORDER BY month) AS month_index
        FROM monthly_mrr
      ),

      regression AS (
        SELECT
          COUNT(*) AS n,
          SUM(month_index) AS sum_x,
          SUM(mrr) AS sum_y,
          SUM(month_index * mrr) AS sum_xy,
          SUM(month_index * month_index) AS sum_x2,
          STDDEV(mrr) AS stddev_y
        FROM indexed_data
      )

      SELECT
        n,
        (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x) AS slope,
        (sum_y - ((n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)) * sum_x) / n AS intercept,
        stddev_y,
        (SELECT MAX(month_index) FROM indexed_data) AS last_index,
        (SELECT MAX(month) FROM indexed_data) AS last_month,
        (SELECT mrr FROM indexed_data ORDER BY month DESC LIMIT 1) AS current_mrr
      FROM regression
    `;

    const regressionResult = await this.db.query(historicalQuery);
    const regression = regressionResult.rows[0];

    if (!regression) {
      throw new Error('Insufficient historical data for forecasting');
    }

    const slope = parseFloat(regression.slope);
    const intercept = parseFloat(regression.intercept);
    const stddev = parseFloat(regression.stddev_y);
    const lastIndex = parseInt(regression.last_index);
    const currentMRR = parseFloat(regression.current_mrr);

    // Generate forecasts
    const forecasts: RevenueForecast[] = [];
    let lastMonth = new Date(regression.last_month);

    for (let i = 1; i <= monthsAhead; i++) {
      const futureIndex = lastIndex + i;
      const predictedMRR = slope * futureIndex + intercept;

      // Calculate confidence interval (95%)
      const margin = 1.96 * stddev;
      const lowerBound = Math.max(0, predictedMRR - margin);
      const upperBound = predictedMRR + margin;

      // Advance month
      lastMonth = new Date(lastMonth);
      lastMonth.setMonth(lastMonth.getMonth() + 1);

      forecasts.push({
        forecastMonth: lastMonth.toISOString().substring(0, 7),
        predictedMRR: Math.round(predictedMRR),
        lowerBound: Math.round(lowerBound),
        upperBound: Math.round(upperBound),
        confidence: 0.95,
      });
    }

    // Calculate growth rate
    const firstForecast = forecasts[0].predictedMRR;
    const lastForecast = forecasts[forecasts.length - 1].predictedMRR;
    const growthRate = ((lastForecast - currentMRR) / currentMRR) * 100;

    // Determine trend
    let trend: 'increasing' | 'stable' | 'decreasing';
    if (slope > currentMRR * 0.02) {
      trend = 'increasing';
    } else if (slope < -currentMRR * 0.02) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    const totalPredictedRevenue = forecasts.reduce((sum, f) => sum + f.predictedMRR, 0);

    logger.info('Revenue forecast completed', {
      currentMRR,
      forecast12MonthMRR: forecasts[11]?.predictedMRR,
      growthRate: `${growthRate.toFixed(2)}%`,
      trend,
    });

    return {
      currentMRR,
      forecast12Month: forecasts,
      totalPredictedRevenue,
      growthRate,
      trend,
    };
  }

  /**
   * Predict churn impact on revenue
   */
  async predictChurnImpact(months: number = 6): Promise<any> {
    const query = `
      WITH recent_churn AS (
        SELECT
          DATE_TRUNC('month', canceled_at) AS churn_month,
          COUNT(*) AS churned_users,
          SUM(amount) AS churned_mrr
        FROM subscriptions
        WHERE canceled_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', canceled_at)
      ),

      churn_avg AS (
        SELECT
          AVG(churned_users) AS avg_churned_users,
          AVG(churned_mrr) AS avg_churned_mrr
        FROM recent_churn
      )

      SELECT
        avg_churned_users,
        avg_churned_mrr,
        avg_churned_users * $1 AS predicted_churned_users,
        avg_churned_mrr * $1 AS predicted_churned_mrr
      FROM churn_avg
    `;

    const result = await this.db.query(query, [months]);

    return {
      avgMonthlyChurnedUsers: Math.round(result.rows[0].avg_churned_users),
      avgMonthlyChurnedMRR: Math.round(result.rows[0].avg_churned_mrr),
      predicted ChurnedUsers: Math.round(result.rows[0].predicted_churned_users),
      predictedChurnedMRR: Math.round(result.rows[0].predicted_churned_mrr),
    };
  }

  /**
   * Predict expansion revenue opportunities
   */
  async predictExpansionRevenue(): Promise<any> {
    const query = `
      WITH upgrade_candidates AS (
        SELECT
          u.id,
          u.subscription_tier,
          COUNT(DISTINCT hc.id) AS total_checkins,
          COUNT(DISTINCT g.id) AS total_goals,
          AVG(CASE WHEN hc.status = 'completed' THEN 1.0 ELSE 0.0 END) AS completion_rate
        FROM users u
        LEFT JOIN habit_checkins hc ON u.id = hc.user_id
        LEFT JOIN goals g ON u.id = g.user_id
        WHERE u.subscription_status = 'active'
          AND u.subscription_tier IN ('free', 'basic')
        GROUP BY u.id, u.subscription_tier
        HAVING COUNT(DISTINCT hc.id) > 50
          AND AVG(CASE WHEN hc.status = 'completed' THEN 1.0 ELSE 0.0 END) > 0.7
      ),

      upgrade_potential AS (
        SELECT
          subscription_tier,
          COUNT(*) AS candidate_count,
          CASE subscription_tier
            WHEN 'free' THEN 29 -- Upgrade to $29/mo basic
            WHEN 'basic' THEN 20 -- Upgrade to $49/mo pro (delta)
          END AS avg_upgrade_value
        FROM upgrade_candidates
        GROUP BY subscription_tier
      )

      SELECT
        subscription_tier,
        candidate_count,
        avg_upgrade_value,
        candidate_count * avg_upgrade_value AS potential_monthly_expansion
      FROM upgrade_potential
    `;

    const result = await this.db.query(query);

    const totalExpansionPotential = result.rows.reduce(
      (sum, row) => sum + row.potential_monthly_expansion,
      0
    );

    return {
      upgradeCandidates: result.rows,
      totalMonthlyExpansionPotential: totalExpansionPotential,
      annualExpansionPotential: totalExpansionPotential * 12,
    };
  }
}
