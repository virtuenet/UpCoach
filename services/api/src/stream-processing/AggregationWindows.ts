import { Pool } from 'pg';
import { logger } from '../utils/logger';

/**
 * Flink-style Aggregation Windows for Feature Computation
 *
 * Computes rolling window aggregations for real-time feature extraction
 * Target latency: < 5 seconds for all window computations
 */

export interface WindowConfig {
  windowSizeMs: number;
  slideIntervalMs: number;
  allowedLateness: number;
}

export interface AggregationResult {
  userId: string;
  windowStart: Date;
  windowEnd: Date;
  metrics: Record<string, number>;
}

export class AggregationWindowService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Compute 7-day rolling window aggregations
   */
  async compute7DayWindow(userId: string): Promise<AggregationResult> {
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const query = `
      SELECT
        COUNT(DISTINCT DATE(created_at)) FILTER (WHERE status = 'completed') as completed_days,
        COUNT(*) FILTER (WHERE status = 'completed') as total_completions,
        COUNT(*) FILTER (WHERE status = 'missed') as total_misses,
        COALESCE(
          CAST(COUNT(*) FILTER (WHERE status = 'completed') AS FLOAT) /
          NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'missed')), 0),
          0
        ) as completion_rate
      FROM habit_checkins
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at <= $3
    `;

    const result = await this.db.query(query, [userId, windowStart, windowEnd]);
    const row = result.rows[0];

    return {
      userId,
      windowStart,
      windowEnd,
      metrics: {
        completed_days_7d: row.completed_days || 0,
        total_completions_7d: row.total_completions || 0,
        total_misses_7d: row.total_misses || 0,
        completion_rate_7d: row.completion_rate || 0,
      },
    };
  }

  /**
   * Compute 14-day rolling window aggregations
   */
  async compute14DayWindow(userId: string): Promise<AggregationResult> {
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [habitMetrics, sessionMetrics] = await Promise.all([
      this.computeHabitMetrics14d(userId, windowStart, windowEnd),
      this.computeSessionMetrics14d(userId, windowStart, windowEnd),
    ]);

    return {
      userId,
      windowStart,
      windowEnd,
      metrics: {
        ...habitMetrics,
        ...sessionMetrics,
      },
    };
  }

  /**
   * Compute 30-day rolling window aggregations
   */
  async compute30DayWindow(userId: string): Promise<AggregationResult> {
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    const query = `
      SELECT
        COUNT(DISTINCT DATE(created_at)) as active_days,
        AVG(EXTRACT(EPOCH FROM (logout_at - login_at))) FILTER (WHERE logout_at IS NOT NULL) as avg_session_duration_sec,
        COUNT(*) as total_sessions,
        COUNT(DISTINCT goal_id) as unique_goals_worked
      FROM user_sessions
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at <= $3
    `;

    const result = await this.db.query(query, [userId, windowStart, windowEnd]);
    const row = result.rows[0];

    return {
      userId,
      windowStart,
      windowEnd,
      metrics: {
        active_days_30d: row.active_days || 0,
        avg_session_duration_30d: row.avg_session_duration_sec || 0,
        total_sessions_30d: row.total_sessions || 0,
        unique_goals_worked_30d: row.unique_goals_worked || 0,
      },
    };
  }

  /**
   * Compute habit metrics for 14-day window
   */
  private async computeHabitMetrics14d(
    userId: string,
    windowStart: Date,
    windowEnd: Date
  ): Promise<Record<string, number>> {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed') as total_completions,
        COUNT(*) FILTER (WHERE status = 'missed') as total_misses,
        COALESCE(
          CAST(COUNT(*) FILTER (WHERE status = 'completed') AS FLOAT) /
          NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'missed')), 0),
          0
        ) as completion_rate
      FROM habit_checkins
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at <= $3
    `;

    const result = await this.db.query(query, [userId, windowStart, windowEnd]);
    const row = result.rows[0];

    return {
      total_completions_14d: row.total_completions || 0,
      total_misses_14d: row.total_misses || 0,
      completion_rate_14d: row.completion_rate || 0,
    };
  }

  /**
   * Compute session metrics for 14-day window
   */
  private async computeSessionMetrics14d(
    userId: string,
    windowStart: Date,
    windowEnd: Date
  ): Promise<Record<string, number>> {
    const query = `
      SELECT
        COUNT(*) as total_sessions,
        AVG(EXTRACT(EPOCH FROM (logout_at - login_at))) FILTER (WHERE logout_at IS NOT NULL) as avg_session_duration_sec,
        COALESCE(CAST(COUNT(*) AS FLOAT) / 14.0, 0) as session_frequency
      FROM user_sessions
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at <= $3
    `;

    const result = await this.db.query(query, [userId, windowStart, windowEnd]);
    const row = result.rows[0];

    return {
      total_sessions_14d: row.total_sessions || 0,
      avg_session_duration_14d: row.avg_session_duration_sec || 0,
      session_frequency_14d: row.session_frequency || 0,
    };
  }

  /**
   * Compute all windows in parallel
   */
  async computeAllWindows(userId: string): Promise<{
    window7d: AggregationResult;
    window14d: AggregationResult;
    window30d: AggregationResult;
  }> {
    const startTime = Date.now();

    const [window7d, window14d, window30d] = await Promise.all([
      this.compute7DayWindow(userId),
      this.compute14DayWindow(userId),
      this.compute30DayWindow(userId),
    ]);

    const latencyMs = Date.now() - startTime;

    logger.debug('Window aggregations computed', {
      userId,
      latencyMs,
      windows: ['7d', '14d', '30d'],
    });

    return { window7d, window14d, window30d };
  }

  /**
   * Compute engagement trend (comparing recent vs historical)
   */
  async computeEngagementTrend(userId: string): Promise<{
    trend: 'increasing' | 'stable' | 'declining';
    percentChange: number;
  }> {
    const recent7d = await this.compute7DayWindow(userId);
    const historical14d = await this.compute14DayWindow(userId);

    const recentRate = recent7d.metrics.completion_rate_7d;
    const historicalRate = historical14d.metrics.completion_rate_14d;

    const percentChange = historicalRate > 0
      ? ((recentRate - historicalRate) / historicalRate) * 100
      : 0;

    let trend: 'increasing' | 'stable' | 'declining';
    if (percentChange > 5) {
      trend = 'increasing';
    } else if (percentChange < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return { trend, percentChange };
  }
}
