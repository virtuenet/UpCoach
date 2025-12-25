import { Pool } from 'pg';
import { logger } from '../utils/logger';

/**
 * Real-Time Feature Extractor
 *
 * Extracts features from event streams for ML model inference
 * Implements rolling window aggregations with 5-second latency
 */

export interface UserFeatures {
  userId: string;

  // Engagement features
  daysSinceLastCheckin: number;
  completionRate7d: number;
  completionRate14d: number;
  completionRate30d: number;

  // Session features
  sessionFrequency14d: number;
  avgSessionDuration14d: number;
  lastSessionTimestamp: Date | null;

  // Goal features
  goalProgressRate: number;
  activeGoalsCount: number;
  completedGoalsCount: number;

  // Platform features
  daysOnPlatform: number;
  subscriptionTier: string;

  // Engagement score (composite)
  engagementScore: number;

  // Metadata
  lastUpdated: Date;
}

export class FeatureExtractorService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Extract features for a single user
   */
  async extractFeatures(userId: string): Promise<UserFeatures> {
    try {
      const [
        habitStats,
        sessionStats,
        goalStats,
        userInfo,
      ] = await Promise.all([
        this.getHabitStats(userId),
        this.getSessionStats(userId),
        this.getGoalStats(userId),
        this.getUserInfo(userId),
      ]);

      const features: UserFeatures = {
        userId,

        // Habit/engagement features
        daysSinceLastCheckin: habitStats.daysSinceLastCheckin,
        completionRate7d: habitStats.completionRate7d,
        completionRate14d: habitStats.completionRate14d,
        completionRate30d: habitStats.completionRate30d,

        // Session features
        sessionFrequency14d: sessionStats.frequency14d,
        avgSessionDuration14d: sessionStats.avgDuration14d,
        lastSessionTimestamp: sessionStats.lastSessionTimestamp,

        // Goal features
        goalProgressRate: goalStats.progressRate,
        activeGoalsCount: goalStats.activeCount,
        completedGoalsCount: goalStats.completedCount,

        // User metadata
        daysOnPlatform: userInfo.daysOnPlatform,
        subscriptionTier: userInfo.subscriptionTier,

        // Composite engagement score
        engagementScore: this.calculateEngagementScore({
          ...habitStats,
          ...sessionStats,
          ...goalStats,
        }),

        lastUpdated: new Date(),
      };

      return features;
    } catch (error) {
      logger.error('Failed to extract features', { userId, error });
      throw error;
    }
  }

  /**
   * Get habit statistics for user
   */
  private async getHabitStats(userId: string) {
    const query = `
      WITH recent_checkins AS (
        SELECT
          user_id,
          habit_id,
          completed_at,
          DATE(completed_at) as checkin_date
        FROM habit_check_ins
        WHERE user_id = $1
          AND completed_at >= NOW() - INTERVAL '30 days'
      ),
      daily_completion AS (
        SELECT
          checkin_date,
          COUNT(DISTINCT habit_id) as habits_completed,
          (SELECT COUNT(*) FROM habits WHERE user_id = $1 AND deleted_at IS NULL) as total_habits
        FROM recent_checkins
        GROUP BY checkin_date
      )
      SELECT
        COALESCE(
          EXTRACT(DAY FROM NOW() - MAX(rc.completed_at))::INTEGER,
          999
        ) as days_since_last_checkin,

        COALESCE(
          AVG(CASE
            WHEN dc.checkin_date >= CURRENT_DATE - INTERVAL '7 days'
            THEN dc.habits_completed::FLOAT / NULLIF(dc.total_habits, 0)
          END),
          0
        ) as completion_rate_7d,

        COALESCE(
          AVG(CASE
            WHEN dc.checkin_date >= CURRENT_DATE - INTERVAL '14 days'
            THEN dc.habits_completed::FLOAT / NULLIF(dc.total_habits, 0)
          END),
          0
        ) as completion_rate_14d,

        COALESCE(
          AVG(dc.habits_completed::FLOAT / NULLIF(dc.total_habits, 0)),
          0
        ) as completion_rate_30d

      FROM recent_checkins rc
      LEFT JOIN daily_completion dc ON TRUE
      WHERE rc.user_id = $1
    `;

    const result = await this.db.query(query, [userId]);

    return {
      daysSinceLastCheckin: result.rows[0]?.days_since_last_checkin || 999,
      completionRate7d: parseFloat(result.rows[0]?.completion_rate_7d || '0'),
      completionRate14d: parseFloat(result.rows[0]?.completion_rate_14d || '0'),
      completionRate30d: parseFloat(result.rows[0]?.completion_rate_30d || '0'),
    };
  }

  /**
   * Get session statistics for user
   */
  private async getSessionStats(userId: string) {
    const query = `
      WITH recent_sessions AS (
        SELECT
          started_at,
          ended_at,
          EXTRACT(EPOCH FROM (ended_at - started_at)) as duration_seconds
        FROM user_sessions
        WHERE user_id = $1
          AND started_at >= NOW() - INTERVAL '14 days'
          AND ended_at IS NOT NULL
      )
      SELECT
        COUNT(*)::INTEGER as session_count_14d,
        AVG(duration_seconds)::FLOAT as avg_duration_14d,
        MAX(started_at) as last_session_timestamp
      FROM recent_sessions
    `;

    const result = await this.db.query(query, [userId]);

    return {
      frequency14d: result.rows[0]?.session_count_14d || 0,
      avgDuration14d: result.rows[0]?.avg_duration_14d || 0,
      lastSessionTimestamp: result.rows[0]?.last_session_timestamp || null,
    };
  }

  /**
   * Get goal statistics for user
   */
  private async getGoalStats(userId: string) {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,

        AVG(
          CASE
            WHEN status = 'active' AND target_value > 0
            THEN (current_value::FLOAT / target_value)
            ELSE NULL
          END
        ) as avg_progress_rate

      FROM goals
      WHERE user_id = $1
        AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [userId]);

    return {
      activeCount: result.rows[0]?.active_count || 0,
      completedCount: result.rows[0]?.completed_count || 0,
      progressRate: parseFloat(result.rows[0]?.avg_progress_rate || '0'),
    };
  }

  /**
   * Get user metadata
   */
  private async getUserInfo(userId: string) {
    const query = `
      SELECT
        EXTRACT(DAY FROM NOW() - created_at)::INTEGER as days_on_platform,
        COALESCE(s.tier_name, 'free') as subscription_tier
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      WHERE u.id = $1
    `;

    const result = await this.db.query(query, [userId]);

    return {
      daysOnPlatform: result.rows[0]?.days_on_platform || 0,
      subscriptionTier: result.rows[0]?.subscription_tier || 'free',
    };
  }

  /**
   * Calculate composite engagement score
   */
  private calculateEngagementScore(stats: {
    completionRate7d: number;
    completionRate14d: number;
    frequency14d: number;
    avgDuration14d: number;
    progressRate: number;
  }): number {
    // Weighted engagement score (0-100)
    const weights = {
      completionRate: 0.35,
      sessionFrequency: 0.25,
      sessionDuration: 0.20,
      goalProgress: 0.20,
    };

    const normalized = {
      completionRate: stats.completionRate7d * 100,
      sessionFrequency: Math.min((stats.frequency14d / 14) * 100, 100),
      sessionDuration: Math.min((stats.avgDuration14d / 600) * 100, 100), // 10 min = 100
      goalProgress: stats.progressRate * 100,
    };

    const score =
      normalized.completionRate * weights.completionRate +
      normalized.sessionFrequency * weights.sessionFrequency +
      normalized.sessionDuration * weights.sessionDuration +
      normalized.goalProgress * weights.goalProgress;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Extract features for multiple users in batch
   */
  async extractFeaturesBatch(userIds: string[]): Promise<Map<string, UserFeatures>> {
    const results = new Map<string, UserFeatures>();

    const promises = userIds.map(async userId => {
      try {
        const features = await this.extractFeatures(userId);
        results.set(userId, features);
      } catch (error) {
        logger.error('Failed to extract features for user', { userId, error });
      }
    });

    await Promise.all(promises);

    return results;
  }
}
