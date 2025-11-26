import { db } from '../database';
import { logger } from '../../utils/logger';

interface GoalOverview {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;
  averageProgress: number;
}

interface HabitAdherencePoint {
  date: string;
  completionRate: number;
  averageQuality: number | null;
}

interface EngagementPoint {
  date: string;
  tasksCompleted: number;
  goalsAchieved: number;
  moodEntries: number;
  activeMinutes: number;
}

class AnalyticsInsightsService {
  async getGoalOverview(userId: string): Promise<GoalOverview> {
    const result = await db.query<{
      total_goals: string;
      completed_goals: string;
      active_goals: string;
      avg_progress: string | null;
    }>(
      `
        SELECT
          COUNT(*)::int AS total_goals,
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_goals,
          COUNT(*) FILTER (WHERE status = 'active')::int AS active_goals,
          AVG("progress")::numeric AS avg_progress
        FROM goals
        WHERE "userId" = $1
      `,
      [userId]
    );

    const row = result.rows[0] ?? {
      total_goals: '0',
      completed_goals: '0',
      active_goals: '0',
      avg_progress: '0',
    };

    const total = Number(row.total_goals ?? 0);
    const completed = Number(row.completed_goals ?? 0);

    return {
      totalGoals: total,
      completedGoals: completed,
      activeGoals: Number(row.active_goals ?? 0),
      completionRate: total > 0 ? Number((completed / total).toFixed(2)) : 0,
      averageProgress: Number(row.avg_progress ?? 0),
    };
  }

  async getHabitAdherence(userId: string, days: number): Promise<HabitAdherencePoint[]> {
    const result = await db.query<{
      day: Date;
      completion_rate: string | null;
      avg_quality: string | null;
    }>(
      `
        SELECT
          date_trunc('day', "completedAt") AS day,
          AVG(CASE WHEN completed THEN 1 ELSE 0 END)::numeric AS completion_rate,
          0::numeric AS avg_quality
        FROM habit_check_ins
        WHERE "userId" = $1
          AND "completedAt" >= NOW() - ($2::text || ' days')::interval
        GROUP BY day
        ORDER BY day
      `,
      [userId, days.toString()]
    );

    return result.rows.map(row => ({
      date: row.day.toISOString(),
      completionRate: Number(row.completion_rate ?? 0),
      averageQuality: row.avg_quality ? Number(row.avg_quality) : null,
    }));
  }

  async getEngagementTrends(userId: string, days: number): Promise<EngagementPoint[]> {
    try {
      const result = await db.query<{
        day: Date;
        tasks_completed: number;
        goals_achieved: number;
        mood_entries: number;
        active_minutes: number;
      }>(
        `
          SELECT
            date::date AS day,
            tasks_completed,
            goals_achieved,
            mood_entries,
            active_time_minutes AS active_minutes
          FROM user_statistics
          WHERE user_id = $1
            AND date >= NOW() - ($2::text || ' days')::interval
          ORDER BY day
        `,
        [userId, days.toString()]
      );

      return result.rows.map(row => ({
        date: row.day.toISOString(),
        tasksCompleted: row.tasks_completed ?? 0,
        goalsAchieved: row.goals_achieved ?? 0,
        moodEntries: row.mood_entries ?? 0,
        activeMinutes: row.active_minutes ?? 0,
      }));
    } catch (error) {
      logger.warn('user_statistics not available, falling back to zeroed engagement data', { error });
      return [];
    }
  }
}

export const analyticsInsightsService = new AnalyticsInsightsService();

