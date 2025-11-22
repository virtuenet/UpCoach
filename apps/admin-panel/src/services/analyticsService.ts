import apiClient from './api';

export interface GoalOverviewDTO {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;
  averageProgress: number;
}

export interface HabitAdherenceDTO {
  days: number;
  adherence: Array<{
    date: string;
    completionRate: number;
    averageQuality: number | null;
  }>;
}

export interface EngagementTrendsDTO {
  days: number;
  trends: Array<{
    date: string;
    tasksCompleted: number;
    goalsAchieved: number;
    moodEntries: number;
    activeMinutes: number;
  }>;
}

export const getGoalOverview = async (): Promise<GoalOverviewDTO> => {
  const { data } = await apiClient.get<{ success: boolean; data: GoalOverviewDTO }>('/analytics/v2/goals/overview');
  return data.data;
};

export const getHabitAdherence = async (days: number): Promise<HabitAdherenceDTO> => {
  const { data } = await apiClient.get<{ success: boolean; data: HabitAdherenceDTO }>(`/analytics/v2/habits/adherence`, {
    params: { days },
  });
  return data.data;
};

export const getEngagementTrends = async (days: number): Promise<EngagementTrendsDTO> => {
  const { data } = await apiClient.get<{ success: boolean; data: EngagementTrendsDTO }>(`/analytics/v2/engagement/trends`, {
    params: { days },
  });
  return data.data;
};


