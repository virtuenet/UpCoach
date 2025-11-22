import { MarketingAutomationService } from '../../services/marketing/MarketingAutomation';
import { analyticsService } from '../../services/analytics/AnalyticsService';
import { User } from '../../models/User';

// Mock dependencies
jest.mock('../../services/analytics/AnalyticsService');
jest.mock('../../models/User');

describe('MarketingAutomationService', () => {
  let marketingService: MarketingAutomationService;

  beforeEach(() => {
    marketingService = new MarketingAutomationService();
    jest.clearAllMocks();
  });

  describe('Analytics Integration', () => {
    it('should use analyticsService.getUserActionCount for behavior matching', async () => {
      // Mock the getUserActionCount method
      const mockGetUserActionCount = jest.spyOn(analyticsService, 'getUserActionCount')
        .mockResolvedValue(5);

      // Test behavior filter
      const behavior = {
        action: 'app_open',
        timeframe: 'last_7_days',
        count: 5,
        operator: 'equals' as const
      };

      // Access private method for testing
      const result = await (marketingService as any).matchesBehavior('user-123', behavior);

      expect(mockGetUserActionCount).toHaveBeenCalledWith('user-123', 'app_open', 'last_7_days');
      expect(result).toBe(true);
    });

    it('should use analyticsService.updateUserProperty for segment updates', async () => {
      // Mock User.findByPk
      const mockUser = {
        id: 'user-123',
        createdAt: new Date(),
        subscriptions: [{ status: 'active' }],
        activities: [{ createdAt: new Date() }],
        goals: []
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      // Mock updateUserProperty
      const mockUpdateUserProperty = jest.spyOn(analyticsService, 'updateUserProperty')
        .mockResolvedValue();

      // Test segment update
      const segmentEngine = (marketingService as any).segmentEngine;
      await segmentEngine.updateUserSegments('user-123');

      expect(mockUpdateUserProperty).toHaveBeenCalledWith(
        'user-123',
        'segments',
        expect.arrayContaining(['paid_users'])
      );
    });

    it('should include subscriptions and activities in user queries', async () => {
      // Mock User.findByPk to verify includes
      const mockFindByPk = User.findByPk as jest.Mock;
      mockFindByPk.mockResolvedValue({
        id: 'user-123',
        createdAt: new Date(),
        subscriptions: [],
        activities: [],
        goals: []
      });

      const segmentEngine = (marketingService as any).segmentEngine;
      await segmentEngine.getUserSegments('user-123');

      expect(mockFindByPk).toHaveBeenCalledWith('user-123', {
        include: ['goals', 'subscriptions', 'activities']
      });
    });
  });

  describe('User Segmentation', () => {
    it('should classify users with active subscriptions as paid_users', async () => {
      const mockUser = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        subscriptions: [{ status: 'active' }],
        activities: [],
        goals: []
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const segmentEngine = (marketingService as any).segmentEngine;
      const segments = await segmentEngine.getUserSegments('user-123');

      expect(segments).toContain('paid_users');
      expect(segments).not.toContain('free_users');
    });

    it('should classify users without active subscriptions as free_users', async () => {
      const mockUser = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        subscriptions: [],
        activities: [],
        goals: []
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const segmentEngine = (marketingService as any).segmentEngine;
      const segments = await segmentEngine.getUserSegments('user-123');

      expect(segments).toContain('free_users');
      expect(segments).not.toContain('paid_users');
    });

    it('should classify users based on activity levels', async () => {
      const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const mockUser = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        subscriptions: [],
        activities: Array(25).fill({ createdAt: recentDate }), // 25 recent activities
        goals: []
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const segmentEngine = (marketingService as any).segmentEngine;
      const segments = await segmentEngine.getUserSegments('user-123');

      expect(segments).toContain('power_users');
    });

    it('should classify new users correctly', async () => {
      const mockUser = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        subscriptions: [],
        activities: [],
        goals: []
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const segmentEngine = (marketingService as any).segmentEngine;
      const segments = await segmentEngine.getUserSegments('user-123');

      expect(segments).toContain('new_users');
    });
  });
});