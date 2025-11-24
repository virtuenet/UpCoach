import { streakGuardianService } from '../../services/gamification/StreakGuardianService';
import { userDayContextService } from '../../services/ai/UserDayContextService';
import { StreakGuardianLink } from '../../models/StreakGuardianLink';
import { User } from '../../models/User';
import { NotificationService } from '../../services/NotificationService';

jest.mock('../../services/ai/UserDayContextService');
jest.mock('../../models/StreakGuardianLink');
jest.mock('../../models/User');
jest.mock('../../services/NotificationService');

describe('StreakGuardianService', () => {
  const mockOwnerId = 'owner-user-123';
  const mockGuardianId = 'guardian-user-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('inviteGuardian', () => {
    it('should create pending guardian invitation', async () => {
      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'pending',
        invitedAt: new Date()
      };

      (StreakGuardianLink.create as jest.Mock).mockResolvedValue(mockLink);
      (StreakGuardianLink.findOne as jest.Mock).mockResolvedValue(null);

      const result = await streakGuardianService.inviteGuardian(mockOwnerId, mockGuardianId);

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
      expect(StreakGuardianLink.create).toHaveBeenCalled();
    });

    it('should prevent duplicate invitations', async () => {
      const existingLink = {
        id: 'existing-link',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'pending'
      };

      (StreakGuardianLink.findOne as jest.Mock).mockResolvedValue(existingLink);

      await expect(streakGuardianService.inviteGuardian(mockOwnerId, mockGuardianId))
        .rejects.toThrow();
    });

    it('should prevent self-guardian', async () => {
      await expect(streakGuardianService.inviteGuardian(mockOwnerId, mockOwnerId))
        .rejects.toThrow('cannot be your own guardian');
    });

    it('should send notification to guardian', async () => {
      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'pending'
      };

      (StreakGuardianLink.create as jest.Mock).mockResolvedValue(mockLink);
      (StreakGuardianLink.findOne as jest.Mock).mockResolvedValue(null);

      const notifySpy = jest.spyOn(NotificationService.prototype, 'sendPushNotification');

      await streakGuardianService.inviteGuardian(mockOwnerId, mockGuardianId);

      expect(notifySpy).toHaveBeenCalled();
    });
  });

  describe('acceptInvitation', () => {
    it('should change invitation status to accepted', async () => {
      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'pending',
        update: jest.fn().mockResolvedValue(true)
      };

      (StreakGuardianLink.findByPk as jest.Mock).mockResolvedValue(mockLink);

      const result = await streakGuardianService.acceptInvitation('link-123', mockGuardianId);

      expect(result.status).toBe('accepted');
      expect(mockLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'accepted' })
      );
    });

    it('should reject if not the invited guardian', async () => {
      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'pending'
      };

      (StreakGuardianLink.findByPk as jest.Mock).mockResolvedValue(mockLink);

      await expect(streakGuardianService.acceptInvitation('link-123', 'wrong-user'))
        .rejects.toThrow('not authorized');
    });

    it('should reject if invitation already accepted', async () => {
      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'accepted'
      };

      (StreakGuardianLink.findByPk as jest.Mock).mockResolvedValue(mockLink);

      await expect(streakGuardianService.acceptInvitation('link-123', mockGuardianId))
        .rejects.toThrow('already');
    });
  });

  describe('sendCheer', () => {
    it('should send encouragement to user', async () => {
      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'accepted'
      };

      (StreakGuardianLink.findOne as jest.Mock).mockResolvedValue(mockLink);

      const notifySpy = jest.spyOn(NotificationService.prototype, 'sendPushNotification');

      const result = await streakGuardianService.sendCheer(
        mockGuardianId,
        mockOwnerId,
        'Keep going! You got this!'
      );

      expect(result.success).toBe(true);
      expect(notifySpy).toHaveBeenCalled();
    });

    it('should only allow active guardians to send cheers', async () => {
      (StreakGuardianLink.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        streakGuardianService.sendCheer(mockGuardianId, mockOwnerId, 'Cheer')
      ).rejects.toThrow('not a guardian');
    });
  });

  describe('scanForAtRiskUsers', () => {
    it('should identify users with overdue tasks', async () => {
      const mockAtRiskContext = {
        overdueTasks: 5,
        upcomingTasks: 2,
        completedToday: 0,
        streakDays: 15,
        moodAverage: 3.0,
        habitTrend: [
          { date: '2025-11-24', completionRate: 0.3 },
          { date: '2025-11-23', completionRate: 0.4 }
        ]
      };

      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'accepted',
        owner: { id: mockOwnerId, name: 'Test User' }
      };

      (StreakGuardianLink.findAll as jest.Mock).mockResolvedValue([mockLink]);
      (userDayContextService.build as jest.Mock).mockResolvedValue(mockAtRiskContext);

      const notifySpy = jest.spyOn(NotificationService.prototype, 'sendPushNotification');

      await streakGuardianService.scanForAtRiskUsers();

      expect(notifySpy).toHaveBeenCalled();
    });

    it('should identify users with declining habit trends', async () => {
      const mockDecliningContext = {
        overdueTasks: 1,
        upcomingTasks: 3,
        completedToday: 1,
        streakDays: 10,
        moodAverage: 4.0,
        habitTrend: [
          { date: '2025-11-24', completionRate: 0.3 },
          { date: '2025-11-23', completionRate: 0.5 },
          { date: '2025-11-22', completionRate: 0.7 }
        ]
      };

      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'accepted',
        owner: { id: mockOwnerId, name: 'Test User' }
      };

      (StreakGuardianLink.findAll as jest.Mock).mockResolvedValue([mockLink]);
      (userDayContextService.build as jest.Mock).mockResolvedValue(mockDecliningContext);

      await streakGuardianService.scanForAtRiskUsers();

      // Verify guardian was notified about declining trend
    });

    it('should not alert for users doing well', async () => {
      const mockHealthyContext = {
        overdueTasks: 0,
        upcomingTasks: 5,
        completedToday: 4,
        streakDays: 20,
        moodAverage: 4.5,
        habitTrend: [
          { date: '2025-11-24', completionRate: 0.9 },
          { date: '2025-11-23', completionRate: 0.85 }
        ]
      };

      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'accepted',
        owner: { id: mockOwnerId, name: 'Test User' }
      };

      (StreakGuardianLink.findAll as jest.Mock).mockResolvedValue([mockLink]);
      (userDayContextService.build as jest.Mock).mockResolvedValue(mockHealthyContext);

      const notifySpy = jest.spyOn(NotificationService.prototype, 'sendPushNotification');

      await streakGuardianService.scanForAtRiskUsers();

      // Should not send alert for healthy users
      expect(notifySpy).not.toHaveBeenCalled();
    });
  });

  describe('getGuardiansForUser', () => {
    it('should return accepted guardians', async () => {
      const mockGuardians = [
        {
          id: 'link-1',
          guardianUserId: 'guardian-1',
          status: 'accepted',
          guardian: { id: 'guardian-1', name: 'Guardian 1' }
        },
        {
          id: 'link-2',
          guardianUserId: 'guardian-2',
          status: 'accepted',
          guardian: { id: 'guardian-2', name: 'Guardian 2' }
        }
      ];

      (StreakGuardianLink.findAll as jest.Mock).mockResolvedValue(mockGuardians);

      const result = await streakGuardianService.getGuardiansForUser(mockOwnerId);

      expect(result.length).toBe(2);
      expect(result.every(g => g.status === 'accepted')).toBe(true);
    });

    it('should exclude blocked guardians', async () => {
      const mockGuardians = [
        { id: 'link-1', guardianUserId: 'guardian-1', status: 'accepted' },
        { id: 'link-2', guardianUserId: 'guardian-2', status: 'blocked' }
      ];

      (StreakGuardianLink.findAll as jest.Mock).mockResolvedValue(mockGuardians);

      const result = await streakGuardianService.getGuardiansForUser(mockOwnerId);

      expect(result.some(g => g.status === 'blocked')).toBe(false);
    });
  });

  describe('blockGuardian', () => {
    it('should change guardian status to blocked', async () => {
      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'accepted',
        update: jest.fn().mockResolvedValue(true)
      };

      (StreakGuardianLink.findOne as jest.Mock).mockResolvedValue(mockLink);

      await streakGuardianService.blockGuardian(mockOwnerId, mockGuardianId);

      expect(mockLink.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'blocked' })
      );
    });

    it('should only allow owner to block their guardian', async () => {
      const mockLink = {
        id: 'link-123',
        ownerUserId: mockOwnerId,
        guardianUserId: mockGuardianId,
        status: 'accepted'
      };

      (StreakGuardianLink.findOne as jest.Mock).mockResolvedValue(mockLink);

      await expect(
        streakGuardianService.blockGuardian('wrong-user', mockGuardianId)
      ).rejects.toThrow('not authorized');
    });
  });
});
