import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsPage from '../AnalyticsPage';

vi.mock('../../hooks/useAnalyticsQueries', () => ({
  useGoalOverview: () => ({
    data: { totalGoals: 10, completedGoals: 6, activeGoals: 4, completionRate: 0.6, averageProgress: 72 },
    isLoading: false,
    isError: false,
  }),
  useHabitAdherence: () => ({
    data: {
      days: 14,
      adherence: [
        { date: new Date().toISOString(), completionRate: 0.75, averageQuality: 7.2 },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useEngagementTrends: () => ({
    data: {
      days: 21,
      trends: [
        {
          date: new Date().toISOString(),
          tasksCompleted: 5,
          goalsAchieved: 2,
          moodEntries: 3,
          activeMinutes: 45,
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}));

describe('AnalyticsPage', () => {
  it('renders analytics widgets', () => {
    render(<AnalyticsPage />);

    expect(screen.getByRole('heading', { name: /Analytics/i })).toBeInTheDocument();
    expect(screen.getByText(/Total Goals/i)).toBeInTheDocument();
    expect(screen.getByText(/Habit Adherence/i)).toBeInTheDocument();
    expect(screen.getByText(/Engagement Trends/i)).toBeInTheDocument();
  });
});


