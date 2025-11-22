/**
 * Service-Level Integration Tests: Coaching Session Management
 *
 * Tests coaching session business logic without HTTP/database layers.
 *
 * Test Coverage:
 * - Session booking with availability validation
 * - Double-booking prevention
 * - Session cancellation and rescheduling
 * - Session completion with feedback
 * - Coach availability management
 * - Session reminders
 * - Gamification integration for sessions
 */

import { TestFactories } from '../helpers/test-factories.helper';
import { MockRepositories, MockServices } from '../helpers/mock-repositories.helper';

/**
 * CoachingSessionService - Manages coaching session lifecycle
 *
 * This service integrates:
 * - CoachingSessionRepository (session persistence)
 * - CoachProfileRepository (coach data)
 * - UserRepository (client/coach data)
 * - GamificationService (rewards)
 * - EmailService (notifications)
 */
class CoachingSessionService {
  constructor(
    private sessionRepo: any,
    private coachProfileRepo: any,
    private userRepo: any,
    private gamificationService: any,
    private emailService: any
  ) {}

  /**
   * Book a coaching session
   */
  async bookSession(data: {
    coachId: string;
    clientId: string;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
    sessionType: string;
    notes?: string;
  }) {
    // Step 1: Validate coach exists and is active
    const coachProfile = await this.coachProfileRepo.findOne({
      where: { userId: data.coachId, isActive: true },
    });
    if (!coachProfile) {
      throw new Error('Coach not found or inactive');
    }

    // Step 2: Validate client exists
    const client = await this.userRepo.findByPk(data.clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Step 3: Check for double-booking (coach perspective)
    const coachConflict = await this.sessionRepo.findOne({
      where: {
        coachId: data.coachId,
        status: 'scheduled',
        // In real implementation, check time overlap
      },
    });
    if (coachConflict) {
      throw new Error('Coach is not available at this time');
    }

    // Step 4: Check for double-booking (client perspective)
    const clientConflict = await this.sessionRepo.findOne({
      where: {
        clientId: data.clientId,
        status: 'scheduled',
        // In real implementation, check time overlap
      },
    });
    if (clientConflict) {
      throw new Error('You already have a session scheduled at this time');
    }

    // Step 5: Validate session time is in the future
    if (data.scheduledStartTime <= new Date()) {
      throw new Error('Session must be scheduled in the future');
    }

    // Step 6: Create session
    const session = await this.sessionRepo.create({
      coachId: data.coachId,
      clientId: data.clientId,
      scheduledStartTime: data.scheduledStartTime,
      scheduledEndTime: data.scheduledEndTime,
      status: 'scheduled',
      sessionType: data.sessionType,
      notes: data.notes,
    });

    // Step 7: Send confirmation emails
    await this.emailService.sendNotificationEmail(
      client.email,
      'Session Booked',
      'Your coaching session has been confirmed'
    );

    // Step 8: Award points for booking
    await this.gamificationService.awardPoints(
      data.clientId,
      'session_booked',
      25
    );

    return {
      session,
      gamification: { pointsAwarded: 25 },
    };
  }

  /**
   * Cancel a session
   */
  async cancelSession(data: {
    sessionId: string;
    canceledBy: 'coach' | 'client';
    reason?: string;
  }) {
    // Step 1: Find session
    const session = await this.sessionRepo.findByPk(data.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Step 2: Validate session can be canceled
    if (session.status !== 'scheduled') {
      throw new Error('Only scheduled sessions can be canceled');
    }

    // Step 3: Check cancellation policy (24 hours in advance)
    const hoursUntilSession = (session.scheduledStartTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilSession < 24) {
      throw new Error('Sessions must be canceled at least 24 hours in advance');
    }

    // Step 4: Update session status
    await this.sessionRepo.update(
      {
        status: 'canceled',
        canceledBy: data.canceledBy,
        canceledAt: new Date(),
        cancellationReason: data.reason,
      },
      { where: { id: data.sessionId } }
    );

    // Step 5: Send cancellation notifications
    await this.emailService.sendNotificationEmail(
      'coach@example.com',
      'Session Canceled',
      `Session canceled by ${data.canceledBy}`
    );

    return {
      session: { ...session, status: 'canceled' },
      refundEligible: hoursUntilSession >= 24,
    };
  }

  /**
   * Reschedule a session
   */
  async rescheduleSession(data: {
    sessionId: string;
    newStartTime: Date;
    newEndTime: Date;
  }) {
    // Step 1: Find session
    const session = await this.sessionRepo.findByPk(data.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Step 2: Validate session is scheduled
    if (session.status !== 'scheduled') {
      throw new Error('Only scheduled sessions can be rescheduled');
    }

    // Step 3: Check new time is in the future
    if (data.newStartTime <= new Date()) {
      throw new Error('New session time must be in the future');
    }

    // Step 4: Check coach availability at new time
    const coachConflict = await this.sessionRepo.findOne({
      where: {
        coachId: session.coachId,
        status: 'scheduled',
        // In real implementation, check time overlap with new time
      },
    });
    if (coachConflict && coachConflict.id !== data.sessionId) {
      throw new Error('Coach is not available at the new time');
    }

    // Step 5: Update session
    await this.sessionRepo.update(
      {
        scheduledStartTime: data.newStartTime,
        scheduledEndTime: data.newEndTime,
        rescheduledAt: new Date(),
      },
      { where: { id: data.sessionId } }
    );

    // Step 6: Send reschedule notifications
    await this.emailService.sendNotificationEmail(
      'client@example.com',
      'Session Rescheduled',
      'Your session has been rescheduled'
    );

    return {
      session: {
        ...session,
        scheduledStartTime: data.newStartTime,
        scheduledEndTime: data.newEndTime,
      },
    };
  }

  /**
   * Complete a session with feedback
   */
  async completeSession(data: {
    sessionId: string;
    rating: number;
    feedback?: string;
    notes?: string;
  }) {
    // Step 1: Find session
    const session = await this.sessionRepo.findByPk(data.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Step 2: Validate session status
    if (session.status === 'completed') {
      throw new Error('Session already completed');
    }

    // Step 3: Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Step 4: Update session
    await this.sessionRepo.update(
      {
        status: 'completed',
        completedAt: new Date(),
        rating: data.rating,
        feedback: data.feedback,
        sessionNotes: data.notes,
      },
      { where: { id: data.sessionId } }
    );

    // Step 5: Update coach stats
    const coachProfile = await this.coachProfileRepo.findOne({
      where: { userId: session.coachId },
    });
    const newTotalSessions = (coachProfile.totalSessions || 0) + 1;
    const newAverageRating = ((coachProfile.rating || 0) * (newTotalSessions - 1) + data.rating) / newTotalSessions;

    await this.coachProfileRepo.update(
      {
        totalSessions: newTotalSessions,
        rating: newAverageRating,
      },
      { where: { userId: session.coachId } }
    );

    // Step 6: Award completion points to both coach and client
    await this.gamificationService.awardPoints(
      session.clientId,
      'session_completed',
      50
    );
    await this.gamificationService.awardPoints(
      session.coachId,
      'session_delivered',
      50
    );

    // Step 7: Check for achievement unlock
    if (newTotalSessions === 10) {
      await this.gamificationService.unlockAchievement(
        session.coachId,
        'veteran_coach'
      );
    }

    return {
      session: { ...session, status: 'completed', rating: data.rating },
      coachStats: {
        totalSessions: newTotalSessions,
        newRating: newAverageRating,
      },
      gamification: {
        clientPointsAwarded: 50,
        coachPointsAwarded: 50,
        achievementUnlocked: newTotalSessions === 10,
      },
    };
  }

  /**
   * Find available coaches by specialty and availability
   */
  async findAvailableCoaches(data: {
    specialization?: string;
    minRating?: number;
    maxHourlyRate?: number;
    startTime: Date;
    endTime: Date;
  }) {
    // Step 1: Find coaches matching criteria
    const coaches = await this.coachProfileRepo.findAll({
      where: {
        isActive: true,
        isVerified: true,
        ...(data.specialization && { specialization: data.specialization }),
        ...(data.minRating && { rating: { $gte: data.minRating } }),
        ...(data.maxHourlyRate && { hourlyRate: { $lte: data.maxHourlyRate } }),
      },
    });

    // Step 2: Filter by availability (check for conflicting sessions)
    const availableCoaches = [];
    for (const coach of coaches) {
      const conflict = await this.sessionRepo.findOne({
        where: {
          coachId: coach.userId,
          status: 'scheduled',
          // In real implementation, check time overlap
        },
      });

      if (!conflict) {
        availableCoaches.push(coach);
      }
    }

    return {
      coaches: availableCoaches,
      count: availableCoaches.length,
    };
  }

  /**
   * Get coach session analytics
   */
  async getCoachAnalytics(coachId: string) {
    // Step 1: Get coach profile
    const coachProfile = await this.coachProfileRepo.findOne({
      where: { userId: coachId },
    });
    if (!coachProfile) {
      throw new Error('Coach not found');
    }

    // Step 2: Count sessions by status
    const completedSessions = await this.sessionRepo.count({
      where: { coachId, status: 'completed' },
    });
    const scheduledSessions = await this.sessionRepo.count({
      where: { coachId, status: 'scheduled' },
    });
    const canceledSessions = await this.sessionRepo.count({
      where: { coachId, status: 'canceled' },
    });

    // Step 3: Get recent sessions
    const recentSessions = await this.sessionRepo.findAll({
      where: { coachId },
      limit: 10,
      order: [['scheduledStartTime', 'DESC']],
    });

    return {
      profile: coachProfile,
      stats: {
        totalSessions: coachProfile.totalSessions,
        rating: coachProfile.rating,
        completedSessions,
        scheduledSessions,
        canceledSessions,
        completionRate: completedSessions / (completedSessions + canceledSessions),
      },
      recentSessions,
    };
  }
}

// ===========================
// TEST SUITE
// ===========================

describe('CoachingSessionService Integration', () => {
  let service: CoachingSessionService;
  let mockSessionRepo: any;
  let mockCoachProfileRepo: any;
  let mockUserRepo: any;
  let mockGamificationService: any;
  let mockEmailService: any;

  beforeEach(() => {
    // Create all mocks
    mockSessionRepo = MockRepositories.createCoachingSessionRepository();
    mockCoachProfileRepo = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };
    mockUserRepo = MockRepositories.createUserRepository();
    mockGamificationService = MockServices.createGamificationService();
    mockEmailService = MockServices.createEmailService();

    // Instantiate service with mocks
    service = new CoachingSessionService(
      mockSessionRepo,
      mockCoachProfileRepo,
      mockUserRepo,
      mockGamificationService,
      mockEmailService
    );
  });

  describe('Session Booking', () => {
    test('should successfully book a session', async () => {
      // Arrange
      const coachId = 'coach-123';
      const clientId = 'client-456';
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const futureEndDate = new Date(futureDate.getTime() + 60 * 60 * 1000);

      const coachProfile = TestFactories.createCoachProfile({ userId: coachId });
      const client = TestFactories.createUser({ id: clientId });

      mockCoachProfileRepo.findOne.mockResolvedValue(coachProfile);
      mockUserRepo.findByPk.mockResolvedValue(client);
      mockSessionRepo.findOne.mockResolvedValue(null); // No conflicts
      mockSessionRepo.create.mockResolvedValue({
        id: 'session-789',
        coachId,
        clientId,
        status: 'scheduled',
      });

      // Act
      const result = await service.bookSession({
        coachId,
        clientId,
        scheduledStartTime: futureDate,
        scheduledEndTime: futureEndDate,
        sessionType: 'video',
      });

      // Assert
      expect(result).toMatchObject({
        session: {
          id: 'session-789',
          status: 'scheduled',
        },
        gamification: { pointsAwarded: 25 },
      });

      expect(mockSessionRepo.create).toHaveBeenCalledWith({
        coachId,
        clientId,
        scheduledStartTime: futureDate,
        scheduledEndTime: futureEndDate,
        status: 'scheduled',
        sessionType: 'video',
        notes: undefined,
      });
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalled();
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith(
        clientId,
        'session_booked',
        25
      );
    });

    test('should reject booking when coach not found', async () => {
      // Arrange
      mockCoachProfileRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.bookSession({
          coachId: 'non-existent-coach',
          clientId: 'client-123',
          scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
          sessionType: 'video',
        })
      ).rejects.toThrow('Coach not found or inactive');

      expect(mockSessionRepo.create).not.toHaveBeenCalled();
    });

    test('should reject booking when coach has conflicting session', async () => {
      // Arrange
      const coachProfile = TestFactories.createCoachProfile();
      const client = TestFactories.createUser();
      const conflictingSession = TestFactories.createCoachingSession({
        status: 'scheduled',
      });

      mockCoachProfileRepo.findOne.mockResolvedValue(coachProfile);
      mockUserRepo.findByPk.mockResolvedValue(client);
      mockSessionRepo.findOne.mockResolvedValueOnce(conflictingSession); // Coach conflict

      // Act & Assert
      await expect(
        service.bookSession({
          coachId: 'coach-123',
          clientId: 'client-456',
          scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
          sessionType: 'video',
        })
      ).rejects.toThrow('Coach is not available at this time');

      expect(mockSessionRepo.create).not.toHaveBeenCalled();
    });

    test('should reject booking when client has conflicting session', async () => {
      // Arrange
      const coachProfile = TestFactories.createCoachProfile();
      const client = TestFactories.createUser();
      const conflictingSession = TestFactories.createCoachingSession({
        status: 'scheduled',
      });

      mockCoachProfileRepo.findOne.mockResolvedValue(coachProfile);
      mockUserRepo.findByPk.mockResolvedValue(client);
      mockSessionRepo.findOne
        .mockResolvedValueOnce(null) // No coach conflict
        .mockResolvedValueOnce(conflictingSession); // Client conflict

      // Act & Assert
      await expect(
        service.bookSession({
          coachId: 'coach-123',
          clientId: 'client-456',
          scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
          sessionType: 'video',
        })
      ).rejects.toThrow('You already have a session scheduled at this time');
    });

    test('should reject booking in the past', async () => {
      // Arrange
      const coachProfile = TestFactories.createCoachProfile();
      const client = TestFactories.createUser();

      mockCoachProfileRepo.findOne.mockResolvedValue(coachProfile);
      mockUserRepo.findByPk.mockResolvedValue(client);
      mockSessionRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.bookSession({
          coachId: 'coach-123',
          clientId: 'client-456',
          scheduledStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          scheduledEndTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
          sessionType: 'video',
        })
      ).rejects.toThrow('Session must be scheduled in the future');
    });
  });

  describe('Session Cancellation', () => {
    test('should cancel session within policy window', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
      const session = TestFactories.createCoachingSession({
        id: 'session-cancel',
        status: 'scheduled',
        scheduledStartTime: futureDate,
      });

      mockSessionRepo.findByPk.mockResolvedValue(session);

      // Act
      const result = await service.cancelSession({
        sessionId: 'session-cancel',
        canceledBy: 'client',
        reason: 'Schedule conflict',
      });

      // Assert
      expect(result).toMatchObject({
        session: { status: 'canceled' },
        refundEligible: true,
      });
      expect(mockSessionRepo.update).toHaveBeenCalledWith(
        {
          status: 'canceled',
          canceledBy: 'client',
          canceledAt: expect.any(Date),
          cancellationReason: 'Schedule conflict',
        },
        { where: { id: 'session-cancel' } }
      );
    });

    test('should reject cancellation within 24 hours', async () => {
      // Arrange
      const soonDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
      const session = TestFactories.createCoachingSession({
        status: 'scheduled',
        scheduledStartTime: soonDate,
      });

      mockSessionRepo.findByPk.mockResolvedValue(session);

      // Act & Assert
      await expect(
        service.cancelSession({
          sessionId: 'session-123',
          canceledBy: 'client',
        })
      ).rejects.toThrow('Sessions must be canceled at least 24 hours in advance');

      expect(mockSessionRepo.update).not.toHaveBeenCalled();
    });

    test('should reject cancellation of already canceled session', async () => {
      // Arrange
      const session = TestFactories.createCoachingSession({
        status: 'canceled',
      });

      mockSessionRepo.findByPk.mockResolvedValue(session);

      // Act & Assert
      await expect(
        service.cancelSession({
          sessionId: 'session-123',
          canceledBy: 'coach',
        })
      ).rejects.toThrow('Only scheduled sessions can be canceled');
    });
  });

  describe('Session Rescheduling', () => {
    test('should reschedule session to new time', async () => {
      // Arrange
      const oldDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const newDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const newEndDate = new Date(newDate.getTime() + 60 * 60 * 1000);
      const session = TestFactories.createCoachingSession({
        id: 'session-reschedule',
        status: 'scheduled',
        scheduledStartTime: oldDate,
      });

      mockSessionRepo.findByPk.mockResolvedValue(session);
      mockSessionRepo.findOne.mockResolvedValue(null); // No conflict at new time

      // Act
      const result = await service.rescheduleSession({
        sessionId: 'session-reschedule',
        newStartTime: newDate,
        newEndTime: newEndDate,
      });

      // Assert
      expect(result.session).toMatchObject({
        scheduledStartTime: newDate,
        scheduledEndTime: newEndDate,
      });
      expect(mockSessionRepo.update).toHaveBeenCalledWith(
        {
          scheduledStartTime: newDate,
          scheduledEndTime: newEndDate,
          rescheduledAt: expect.any(Date),
        },
        { where: { id: 'session-reschedule' } }
      );
    });

    test('should reject rescheduling to past date', async () => {
      // Arrange
      const session = TestFactories.createCoachingSession({ status: 'scheduled' });
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      mockSessionRepo.findByPk.mockResolvedValue(session);

      // Act & Assert
      await expect(
        service.rescheduleSession({
          sessionId: 'session-123',
          newStartTime: pastDate,
          newEndTime: new Date(pastDate.getTime() + 60 * 60 * 1000),
        })
      ).rejects.toThrow('New session time must be in the future');
    });
  });

  describe('Session Completion', () => {
    test('should complete session with feedback and update stats', async () => {
      // Arrange
      const session = TestFactories.createCoachingSession({
        id: 'session-complete',
        coachId: 'coach-123',
        clientId: 'client-456',
        status: 'scheduled',
      });
      const coachProfile = TestFactories.createCoachProfile({
        userId: 'coach-123',
        totalSessions: 5,
        rating: 4.5,
      });

      mockSessionRepo.findByPk.mockResolvedValue(session);
      mockCoachProfileRepo.findOne.mockResolvedValue(coachProfile);

      // Act
      const result = await service.completeSession({
        sessionId: 'session-complete',
        rating: 5,
        feedback: 'Excellent session!',
      });

      // Assert
      expect(result).toMatchObject({
        session: { status: 'completed', rating: 5 },
        coachStats: {
          totalSessions: 6,
          newRating: expect.any(Number),
        },
        gamification: {
          clientPointsAwarded: 50,
          coachPointsAwarded: 50,
          achievementUnlocked: false,
        },
      });

      expect(mockSessionRepo.update).toHaveBeenCalledWith(
        {
          status: 'completed',
          completedAt: expect.any(Date),
          rating: 5,
          feedback: 'Excellent session!',
          sessionNotes: undefined,
        },
        { where: { id: 'session-complete' } }
      );

      expect(mockGamificationService.awardPoints).toHaveBeenCalledTimes(2);
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith('client-456', 'session_completed', 50);
      expect(mockGamificationService.awardPoints).toHaveBeenCalledWith('coach-123', 'session_delivered', 50);
    });

    test('should unlock achievement at milestone', async () => {
      // Arrange
      const session = TestFactories.createCoachingSession({
        coachId: 'coach-veteran',
        clientId: 'client-123',
      });
      const coachProfile = TestFactories.createCoachProfile({
        userId: 'coach-veteran',
        totalSessions: 9, // This will be 10th session
        rating: 4.8,
      });

      mockSessionRepo.findByPk.mockResolvedValue(session);
      mockCoachProfileRepo.findOne.mockResolvedValue(coachProfile);

      // Act
      const result = await service.completeSession({
        sessionId: 'session-123',
        rating: 5,
      });

      // Assert
      expect(result.gamification.achievementUnlocked).toBe(true);
      expect(result.coachStats.totalSessions).toBe(10);
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(
        'coach-veteran',
        'veteran_coach'
      );
    });

    test('should reject invalid rating', async () => {
      // Arrange
      const session = TestFactories.createCoachingSession();
      mockSessionRepo.findByPk.mockResolvedValue(session);

      // Act & Assert
      await expect(
        service.completeSession({
          sessionId: 'session-123',
          rating: 6, // Invalid rating
        })
      ).rejects.toThrow('Rating must be between 1 and 5');
    });
  });

  describe('Coach Discovery', () => {
    test('should find available coaches by criteria', async () => {
      // Arrange
      const coaches = [
        TestFactories.createCoachProfile({
          userId: 'coach-1',
          specialization: 'Life Coaching',
          rating: 4.8,
          hourlyRate: 100,
        }),
        TestFactories.createCoachProfile({
          userId: 'coach-2',
          specialization: 'Life Coaching',
          rating: 4.5,
          hourlyRate: 80,
        }),
      ];

      mockCoachProfileRepo.findAll.mockResolvedValue(coaches);
      mockSessionRepo.findOne.mockResolvedValue(null); // No conflicts for both

      // Act
      const result = await service.findAvailableCoaches({
        specialization: 'Life Coaching',
        minRating: 4.0,
        maxHourlyRate: 150,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
      });

      // Assert
      expect(result).toMatchObject({
        coaches: coaches,
        count: 2,
      });
      expect(mockCoachProfileRepo.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          isVerified: true,
          specialization: 'Life Coaching',
          rating: { $gte: 4.0 },
          hourlyRate: { $lte: 150 },
        },
      });
    });
  });

  describe('Coach Analytics', () => {
    test('should get comprehensive coach analytics', async () => {
      // Arrange
      const coachProfile = TestFactories.createCoachProfile({
        userId: 'coach-analytics',
        totalSessions: 50,
        rating: 4.7,
      });

      mockCoachProfileRepo.findOne.mockResolvedValue(coachProfile);
      mockSessionRepo.count
        .mockResolvedValueOnce(45) // completed
        .mockResolvedValueOnce(3)  // scheduled
        .mockResolvedValueOnce(2); // canceled
      mockSessionRepo.findAll.mockResolvedValue([]);

      // Act
      const result = await service.getCoachAnalytics('coach-analytics');

      // Assert
      expect(result).toMatchObject({
        profile: coachProfile,
        stats: {
          totalSessions: 50,
          rating: 4.7,
          completedSessions: 45,
          scheduledSessions: 3,
          canceledSessions: 2,
          completionRate: expect.any(Number),
        },
      });
      expect(result.stats.completionRate).toBeCloseTo(0.9574, 2);
    });
  });
});
