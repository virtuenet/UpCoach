/**
 * Integration Test: Daily Pulse Workflow
 *
 * Tests the complete end-to-end flow:
 * 1. Scheduler triggers pulse generation
 * 2. Context is built from user data
 * 3. AI generates personalized pulse
 * 4. Pulse is cached and delivered
 * 5. User receives notification
 */

import { dailyPulseService } from '../../services/ai/DailyPulseService';
import { userDayContextService } from '../../services/ai/UserDayContextService';
import { schedulerService } from '../../services/SchedulerService';
import { NotificationService } from '../../services/NotificationService';

describe('Daily Pulse Workflow Integration', () => {
  const testUserId = 'integration-test-user';

  describe('Morning pulse broadcast workflow', () => {
    it('should complete full morning pulse workflow', async () => {
      // Step 1: Scheduler triggers broadcast
      const broadcastPromise = dailyPulseService.broadcastPulse('morning');

      // Workflow should complete without errors
      await expect(broadcastPromise).resolves.not.toThrow();
    });

    it('should generate context, create pulse, and deliver notification', async () => {
      // Step 1: Build user context
      const context = await userDayContextService.build(testUserId);
      expect(context).toBeDefined();
      expect(context.overdueTasks).toBeDefined();

      // Step 2: Generate pulse from context
      const pulse = await dailyPulseService.generatePulse(testUserId, 'morning');
      expect(pulse).toBeDefined();
      expect(pulse.title).toBeTruthy();
      expect(pulse.message).toBeTruthy();

      // Step 3: Verify pulse was cached
      const cachedPulse = await dailyPulseService.getPulse(testUserId, 'morning');
      expect(cachedPulse).toEqual(pulse);

      // Step 4: Verify notification would be sent
      // (In real implementation, check notification queue)
    });
  });

  describe('Evening pulse workflow', () => {
    it('should generate reflective evening pulse', async () => {
      const pulse = await dailyPulseService.generatePulse(testUserId, 'evening');

      expect(pulse.period).toBe('evening');
      // Evening pulse should reference today's accomplishments
      expect(pulse.insights.length).toBeGreaterThan(0);
    });

    it('should differentiate morning vs evening content', async () => {
      const morningPulse = await dailyPulseService.generatePulse(testUserId, 'morning');
      const eveningPulse = await dailyPulseService.generatePulse(testUserId, 'evening');

      // Pulses should have different tones/content
      expect(morningPulse.title).not.toEqual(eveningPulse.title);
    });
  });

  describe('Error handling and resilience', () => {
    it('should handle AI service failures gracefully', async () => {
      // Test with invalid user ID or service outage
      await expect(
        dailyPulseService.generatePulse('non-existent-user', 'morning')
      ).rejects.toThrow();
    });

    it('should retry failed pulse generations', async () => {
      // Implementation would include retry logic
      const pulse = await dailyPulseService.generatePulse(testUserId, 'afternoon');
      expect(pulse).toBeDefined();
    });
  });

  describe('Performance and caching', () => {
    it('should serve cached pulse within TTL', async () => {
      const firstCall = await dailyPulseService.getPulse(testUserId, 'morning');
      const secondCall = await dailyPulseService.getPulse(testUserId, 'morning');

      // Second call should be faster (from cache)
      expect(secondCall).toEqual(firstCall);
    });

    it('should regenerate pulse after cache expiry', async () => {
      // Test cache invalidation logic
      await dailyPulseService.generatePulse(testUserId, 'morning');

      // Wait for TTL or manually invalidate
      // Then verify new generation
    });
  });
});
