import { analyticsInsightsService } from '../AnalyticsInsightsService';
import { db } from '../../database';
import { logger } from '../../utils/logger';

jest.mock('../../database', () => ({
  db: {
    query: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockedQuery = db.query as jest.MockedFunction<typeof db.query>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it('returns goal overview with completion rate', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [
        {
          total_goals: '4',
          completed_goals: '2',
          active_goals: '2',
          avg_progress: '75.5',
        },
      ],
    } as any);

    const result = await analyticsInsightsService.getGoalOverview('user-1');

    expect(result).toEqual({
      totalGoals: 4,
      completedGoals: 2,
      activeGoals: 2,
      completionRate: 0.5,
      averageProgress: 75.5,
    });
  });

  it('maps habit adherence rows into chart friendly dataset', async () => {
    const now = new Date();
    mockedQuery.mockResolvedValueOnce({
      rows: [
        {
          day: now,
          completion_rate: '0.8',
          avg_quality: '7.3',
        },
      ],
    } as any);

    const result = await analyticsInsightsService.getHabitAdherence('user-1', 7);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: now.toISOString(),
      completionRate: 0.8,
      averageQuality: 7.3,
    });
  });

  it('returns empty engagement array when table missing', async () => {
    mockedQuery.mockRejectedValueOnce(new Error('relation "user_statistics" does not exist'));

    const result = await analyticsInsightsService.getEngagementTrends('user-1', 21);

    expect(result).toEqual([]);
    expect(logger.warn).toHaveBeenCalled();
  });
});


