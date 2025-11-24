import { Op } from 'sequelize';

import { analyticsInsightsService } from '../analytics/AnalyticsInsightsService';
import { Task } from '../../models/Task';
import { Mood } from '../../models/Mood';

export interface GoalOverview {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;
  averageProgress: number;
}

export interface HabitAdherencePoint {
  date: string;
  completionRate: number;
  averageQuality: number | null;
}

export interface EngagementPoint {
  date: string;
  tasksCompleted: number;
  goalsAchieved: number;
  moodEntries: number;
  activeMinutes: number;
}

export interface DailyUserContext {
  goals: GoalOverview;
  habitTrend: HabitAdherencePoint[];
  engagement: EngagementPoint[];
  tasksDueToday: number;
  overdueTasks: number;
  todaysMood: {
    label: string;
    score: number;
    loggedAt: string;
  } | null;
}

class UserDayContextService {
  async build(userId: string): Promise<DailyUserContext> {
    const [goals, habitTrend, engagement, tasksDueToday, overdueTasks, todaysMood] =
      await Promise.all([
        analyticsInsightsService.getGoalOverview(userId),
        analyticsInsightsService.getHabitAdherence(userId, 7),
        analyticsInsightsService.getEngagementTrends(userId, 7),
        this.countTasksDueToday(userId),
        this.countOverdueTasks(userId),
        this.getTodaysMood(userId),
      ]);

    return {
      goals,
      habitTrend,
      engagement,
      tasksDueToday,
      overdueTasks,
      todaysMood,
    };
  }

  private async countTasksDueToday(userId: string): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return Task.count({
      where: {
        userId,
        dueDate: {
          [Op.between]: [start, end],
        },
        status: {
          [Op.in]: ['pending', 'in_progress'],
        },
      },
    });
  }

  private async countOverdueTasks(userId: string): Promise<number> {
    const now = new Date();
    return Task.count({
      where: {
        userId,
        dueDate: { [Op.lt]: now },
        status: { [Op.in]: ['pending', 'in_progress'] },
      },
    });
  }

  private async getTodaysMood(userId: string): Promise<DailyUserContext['todaysMood']> {
    const mood = await Mood.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    if (!mood) {
      return null;
    }

    return {
      label: mood.mood,
      score: mood.moodScore,
      loggedAt: mood.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}

export const userDayContextService = new UserDayContextService();

