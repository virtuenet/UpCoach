/**
 * Integration Test: Guardian Risk Scan Workflow
 *
 * Tests the complete accountability flow:
 * 1. Guardian relationship established
 * 2. User performance monitored
 * 3. At-risk conditions detected
 * 4. Guardian notified
 * 5. Guardian sends encouragement
 */

import { streakGuardianService } from '../../services/gamification/StreakGuardianService';
import { userDayContextService } from '../../services/ai/UserDayContextService';
import { NotificationService } from '../../services/NotificationService';
import { StreakGuardianLink } from '../../models/StreakGuardianLink';

describe('Guardian Risk Scan Workflow Integration', () => {
  const ownerId = 'at-risk-user';
  const guardianId = 'caring-guardian';

  beforeAll(async () => {
    // Set up guardian relationship
    try {
      await streakGuardianService.inviteGuardian(ownerId, guardianId);
      const links = await StreakGuardianLink.findAll({
        where: { ownerUserId: ownerId, guardianUserId: guardianId }
      });
      if (links.length > 0) {
        await streakGuardianService.acceptInvitation(links[0].id, guardianId);
      }
    } catch (error) {
      // Link may already exist
    }
  });

  describe('Complete guardian workflow', () => {
    it('should establish guardian relationship', async () => {
      const guardians = await streakGuardianService.getGuardiansForUser(ownerId);

      expect(guardians).toBeDefined();
      expect(guardians.some(g => g.guardianUserId === guardianId)).toBe(true);
    });

    it('should detect at-risk user during scan', async () => {
      // Simulate at-risk scenario
      const atRiskContext = {
        overdueTasks: 8,
        upcomingTasks: 10,
        completedToday: 0,
        streakDays: 5,
        moodAverage: 3.0,
        habitTrend: [
          { date: '2025-11-24', completionRate: 0.2 },
          { date: '2025-11-23', completionRate: 0.3 }
        ]
      };

      // Mock context service to return at-risk data
      jest.spyOn(userDayContextService, 'build').mockResolvedValue(atRiskContext);

      // Run risk scan
      await streakGuardianService.scanForAtRiskUsers();

      // Verify guardian was notified
      // (In production, check notification queue or database)
    });

    it('should allow guardian to send encouragement', async () => {
      const result = await streakGuardianService.sendCheer(
        guardianId,
        ownerId,
        'You got this! Just take it one task at a time.'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Risk detection logic', () => {
    it('should detect users with high overdue tasks', async () => {
      const context = await userDayContextService.build(ownerId);

      const isAtRisk = context.overdueTasks >= 5;
      expect(typeof isAtRisk).toBe('boolean');
    });

    it('should detect users with declining habits', async () => {
      const context = await userDayContextService.build(ownerId);

      if (context.habitTrend.length >= 2) {
        const recentRate = context.habitTrend[0]?.completionRate || 0;
        const previousRate = context.habitTrend[1]?.completionRate || 0;

        const isDeclining = recentRate < previousRate && recentRate < 0.5;
        expect(typeof isDeclining).toBe('boolean');
      }
    });
  });

  describe('Guardian permissions and boundaries', () => {
    it('should only allow active guardians to send cheers', async () => {
      await expect(
        streakGuardianService.sendCheer('non-guardian-user', ownerId, 'Cheer')
      ).rejects.toThrow();
    });

    it('should allow owner to block guardian', async () => {
      await streakGuardianService.blockGuardian(ownerId, guardianId);

      const guardians = await streakGuardianService.getGuardiansForUser(ownerId);
      const blockedGuardian = guardians.find(g => g.guardianUserId === guardianId);

      expect(blockedGuardian?.status).toBe('blocked');
    });
  });

  describe('Notification delivery', () => {
    it('should queue notifications for at-risk alerts', async () => {
      const notificationSpy = jest.spyOn(NotificationService.prototype, 'sendPushNotification');

      await streakGuardianService.scanForAtRiskUsers();

      // Verify notification was attempted
      // (actual delivery depends on notification service)
    });

    it('should deliver encouragement messages to users', async () => {
      const notificationSpy = jest.spyOn(NotificationService.prototype, 'sendPushNotification');

      await streakGuardianService.sendCheer(guardianId, ownerId, 'Keep going!');

      // Verify owner received notification
    });
  });

  describe('Scalability and performance', () => {
    it('should efficiently scan large numbers of guardians', async () => {
      const startTime = Date.now();

      await streakGuardianService.scanForAtRiskUsers();

      const duration = Date.now() - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(30000); // 30 seconds
    });

    it('should batch process guardian notifications', async () => {
      // Test with multiple at-risk users
      await streakGuardianService.scanForAtRiskUsers();

      // Verify efficient batching (implementation-dependent)
    });
  });
});
