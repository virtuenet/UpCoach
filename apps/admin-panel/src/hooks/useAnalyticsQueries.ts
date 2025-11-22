import { useQuery } from '@tanstack/react-query';
import {
  getGoalOverview,
  getHabitAdherence,
  getEngagementTrends,
  HabitAdherenceDTO,
  EngagementTrendsDTO,
  GoalOverviewDTO,
} from '../services/analyticsService';

export const useGoalOverview = () =>
  useQuery<GoalOverviewDTO>({
    queryKey: ['analytics', 'goals', 'overview'],
    queryFn: getGoalOverview,
    staleTime: 5 * 60 * 1000,
  });

export const useHabitAdherence = (days: number) =>
  useQuery<HabitAdherenceDTO>({
    queryKey: ['analytics', 'habits', days],
    queryFn: () => getHabitAdherence(days),
    staleTime: 5 * 60 * 1000,
  });

export const useEngagementTrends = (days: number) =>
  useQuery<EngagementTrendsDTO>({
    queryKey: ['analytics', 'engagement', days],
    queryFn: () => getEngagementTrends(days),
    staleTime: 5 * 60 * 1000,
  });


