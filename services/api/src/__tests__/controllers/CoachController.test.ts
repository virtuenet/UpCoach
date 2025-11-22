import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { CoachController } from '../../controllers/CoachController';
import { coachService } from '../../services/coach/CoachService';
import { validationResult } from 'express-validator';

// Mock dependencies
jest.mock('../../services/coach/CoachService');

jest.mock('express-validator', () => {
  // Create chainable mock functions for express-validator
  const createChainableMock = () => {
    const mock: any = jest.fn(() => mock);
    mock.optional = jest.fn(() => mock);
    mock.isString = jest.fn(() => mock);
    mock.isInt = jest.fn(() => mock);
    mock.isFloat = jest.fn(() => mock);
    mock.isBoolean = jest.fn(() => mock);
    mock.isIn = jest.fn(() => mock);
    mock.isISO8601 = jest.fn(() => mock);
    mock.notEmpty = jest.fn(() => mock);
    return mock;
  };

  return {
    ...jest.requireActual('express-validator'),
    validationResult: jest.fn(),
    body: jest.fn(() => createChainableMock()),
    query: jest.fn(() => createChainableMock()),
    param: jest.fn(() => createChainableMock()),
  };
});

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../models/CoachProfile', () => ({
  CoachProfile: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../models/CoachSession', () => ({
  CoachSession: {
    findAll: jest.fn(),
  },
  SessionType: {
    video: 'video',
    audio: 'audio',
    chat: 'chat',
  },
}));

jest.mock('../../models/CoachReview', () => ({
  CoachReview: {
    findAll: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock('../../models/User', () => ({
  User: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
}));

describe('CoachController', () => {
  let controller: CoachController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  const mockUserId = 'user-123';
  const mockUserRole = 'user';

  const mockCoach = {
    id: 1,
    userId: 'coach-user-123',
    name: 'John Doe',
    email: 'coach@example.com',
    specialization: 'Life Coaching',
    bio: 'Experienced life coach',
    hourlyRate: 100,
    rating: 4.8,
    totalSessions: 150,
    languages: ['English', 'Spanish'],
    isAvailable: true,
    isVerified: true,
    isFeatured: false,
  };

  beforeAll(() => {
    // Create controller once before all tests
    controller = new CoachController();
  });

  beforeEach(() => {
    // Reset controller state if needed (but don't recreate)

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();

    mockRequest = {
      userId: mockUserId,
      userRole: mockUserRole,
      query: {},
      params: {},
      body: {},
      headers: {},
    } as any;

    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    // Mock validationResult to return no errors by default
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('searchCoaches', () => {
    test('should search coaches with filters', async () => {
      mockRequest.query = {
        specialization: 'Life Coaching',
        minRating: '4.5',
        page: '1',
        limit: '20',
      };

      const mockSearchResult = {
        coaches: [mockCoach],
        total: 1,
        pages: 1,
      };

      (coachService.searchCoaches as jest.Mock).mockResolvedValue(mockSearchResult);

      const handler = controller.searchCoaches[controller.searchCoaches.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.searchCoaches).toHaveBeenCalledWith(
        expect.objectContaining({
          specialization: 'Life Coaching',
          minRating: 4.5,
        }),
        1,
        20
      );

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [mockCoach],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });
    });

    test('should use default pagination values', async () => {
      mockRequest.query = {};

      (coachService.searchCoaches as jest.Mock).mockResolvedValue({
        coaches: [],
        total: 0,
        pages: 0,
      });

      const handler = controller.searchCoaches[controller.searchCoaches.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.searchCoaches).toHaveBeenCalledWith(
        expect.any(Object),
        1,  // default page
        20  // default limit
      );
    });

    test('should handle validation errors', async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid minRating', param: 'minRating' }],
      });

      const handler = controller.searchCoaches[controller.searchCoaches.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        errors: [{ msg: 'Invalid minRating', param: 'minRating' }],
      });
    });

    test('should handle search errors', async () => {
      (coachService.searchCoaches as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const handler = controller.searchCoaches[controller.searchCoaches.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to search coaches',
      });
    });

    test('should apply price range filters', async () => {
      mockRequest.query = {
        minPrice: '50',
        maxPrice: '150',
      };

      (coachService.searchCoaches as jest.Mock).mockResolvedValue({
        coaches: [mockCoach],
        total: 1,
        pages: 1,
      });

      const handler = controller.searchCoaches[controller.searchCoaches.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.searchCoaches).toHaveBeenCalledWith(
        expect.objectContaining({
          minPrice: 50,
          maxPrice: 150,
        }),
        expect.any(Number),
        expect.any(Number)
      );
    });

    test('should support sorting options', async () => {
      mockRequest.query = {
        sortBy: 'rating',
        order: 'DESC',
      };

      (coachService.searchCoaches as jest.Mock).mockResolvedValue({
        coaches: [mockCoach],
        total: 1,
        pages: 1,
      });

      const handler = controller.searchCoaches[controller.searchCoaches.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.searchCoaches).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'rating',
          order: 'DESC',
        }),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('getCoachDetails', () => {
    test('should retrieve coach details by ID', async () => {
      mockRequest.params = { id: '1' };

      (coachService.getCoachDetails as jest.Mock).mockResolvedValue(mockCoach);

      const handler = controller.getCoachDetails[controller.getCoachDetails.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.getCoachDetails).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCoach,
      });
    });

    test('should return 404 if coach not found', async () => {
      mockRequest.params = { id: '999' };

      (coachService.getCoachDetails as jest.Mock).mockResolvedValue(null);

      const handler = controller.getCoachDetails[controller.getCoachDetails.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Coach not found',
      });
    });

    test('should handle invalid coach ID', async () => {
      mockRequest.params = { id: 'invalid' };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid ID', param: 'id' }],
      });

      const handler = controller.getCoachDetails[controller.getCoachDetails.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('getCoachAvailability', () => {
    test('should retrieve coach availability for date range', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.query = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-07T23:59:59Z',
      };

      const mockAvailability = [
        { date: '2024-01-01', slots: [{ start: '09:00', end: '10:00', available: true }] },
        { date: '2024-01-02', slots: [{ start: '09:00', end: '10:00', available: true }] },
      ];

      (coachService.getCoachAvailability as jest.Mock).mockResolvedValue(mockAvailability);

      const handler = controller.getCoachAvailability[controller.getCoachAvailability.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.getCoachAvailability).toHaveBeenCalledWith(
        1,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockAvailability,
      });
    });

    test('should reject invalid date range', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.query = {
        startDate: '2024-01-07T00:00:00Z',
        endDate: '2024-01-01T00:00:00Z', // End before start
      };

      const handler = controller.getCoachAvailability[controller.getCoachAvailability.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'End date must be after start date',
      });
    });

    test('should reject date range exceeding 30 days', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.query = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-02-15T00:00:00Z', // 45 days
      };

      const handler = controller.getCoachAvailability[controller.getCoachAvailability.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Date range cannot exceed 30 days',
      });
    });
  });

  describe('bookSession', () => {
    test('should book a coaching session successfully', async () => {
      mockRequest.body = {
        coachId: 1,
        sessionType: 'video',
        scheduledAt: '2024-01-15T10:00:00Z',
        durationMinutes: 60,
        title: 'First session',
        description: 'Initial coaching session',
        timezone: 'UTC',
      };

      const mockBooking = {
        id: 'session-123',
        coachId: 1,
        clientId: 'user-123',
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        durationMinutes: 60,
        status: 'pending_payment',
        amount: 100,
      };

      (coachService.bookSession as jest.Mock).mockResolvedValue(mockBooking);

      const handler = controller.bookSession[controller.bookSession.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.bookSession).toHaveBeenCalledWith(
        expect.objectContaining({
          coachId: 1,
          clientId: 'user-123',
          sessionType: 'video',
          title: 'First session',
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockBooking,
      });
    });

    test('should handle validation errors', async () => {
      mockRequest.body = {
        coachId: 1,
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'scheduledAt is required', param: 'scheduledAt' }],
      });

      const handler = controller.bookSession[controller.bookSession.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        errors: [{ msg: 'scheduledAt is required', param: 'scheduledAt' }],
      });
    });

    test('should handle unavailable time slots', async () => {
      mockRequest.body = {
        coachId: 1,
        sessionType: 'video',
        scheduledAt: '2024-01-15T10:00:00Z',
        durationMinutes: 60,
        title: 'Session',
        timezone: 'UTC',
      };

      (coachService.bookSession as jest.Mock).mockRejectedValue(
        new Error('Time slot not available')
      );

      const handler = controller.bookSession[controller.bookSession.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Time slot not available',
      });
    });
  });

  describe('submitReview', () => {
    test('should submit a review for a coach', async () => {
      mockRequest.params = { sessionId: '123' };
      mockRequest.body = {
        rating: 5,
        comment: 'Excellent coaching session!',
      };

      const mockReview = {
        id: 'review-123',
        sessionId: 123,
        clientId: 'user-123',
        rating: 5,
        comment: 'Excellent coaching session!',
        createdAt: new Date(),
      };

      (coachService.submitReview as jest.Mock).mockResolvedValue(mockReview);

      const handler = controller.submitReview[controller.submitReview.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.submitReview).toHaveBeenCalledWith(
        123,
        'user-123',
        expect.objectContaining({
          rating: 5,
          comment: 'Excellent coaching session!',
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockReview,
      });
    });

    test('should validate rating range', async () => {
      mockRequest.params = { sessionId: '123' };
      mockRequest.body = {
        rating: 6, // Invalid rating
        comment: 'Test',
      };

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Rating must be between 1 and 5', param: 'rating' }],
      });

      const handler = controller.submitReview[controller.submitReview.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    test('should prevent duplicate reviews for same session', async () => {
      mockRequest.params = { sessionId: '123' };
      mockRequest.body = {
        rating: 5,
        comment: 'Test',
      };

      (coachService.submitReview as jest.Mock).mockRejectedValue(
        new Error('Review already exists for this session')
      );

      const handler = controller.submitReview[controller.submitReview.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('getCoachPackages', () => {
    test('should retrieve coach packages', async () => {
      mockRequest.params = { coachId: '1' };

      const mockPackages = [
        {
          id: 'pkg-1',
          coachId: 1,
          name: '5 Session Package',
          sessions: 5,
          price: 450,
          validityDays: 90,
        },
        {
          id: 'pkg-2',
          coachId: 1,
          name: '10 Session Package',
          sessions: 10,
          price: 850,
          validityDays: 180,
        },
      ];

      (coachService.getCoachPackages as jest.Mock).mockResolvedValue(mockPackages);

      const handler = controller.getCoachPackages[controller.getCoachPackages.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.getCoachPackages).toHaveBeenCalledWith(1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockPackages,
      });
    });

    test('should return empty array if no packages available', async () => {
      mockRequest.params = { coachId: '1' };

      (coachService.getCoachPackages as jest.Mock).mockResolvedValue([]);

      const handler = controller.getCoachPackages[controller.getCoachPackages.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('getClientSessions', () => {
    test('should retrieve client session history', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          coachId: 1,
          coachName: 'John Doe',
          date: '2024-01-15',
          startTime: '10:00',
          status: 'completed',
          rating: 5,
        },
        {
          id: 'session-2',
          coachId: 1,
          coachName: 'John Doe',
          date: '2024-01-08',
          startTime: '10:00',
          status: 'completed',
          rating: 4,
        },
      ];

      (coachService.getClientSessions as jest.Mock).mockResolvedValue({
        sessions: mockSessions,
        total: 2,
        pages: 1,
      });

      const handler = controller.getClientSessions[controller.getClientSessions.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.getClientSessions).toHaveBeenCalledWith('user-123', undefined, 1, 10);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSessions,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
    });

    test('should filter sessions by status', async () => {
      mockRequest.query = { status: 'completed' };

      (coachService.getClientSessions as jest.Mock).mockResolvedValue({
        sessions: [],
        total: 0,
        pages: 0,
      });

      const handler = controller.getClientSessions[controller.getClientSessions.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.getClientSessions).toHaveBeenCalledWith(
        'user-123',
        'completed',
        1,
        10
      );
    });
  });

  describe('cancelSession', () => {
    test('should cancel a session successfully', async () => {
      mockRequest.params = { id: '123' };
      mockRequest.body = { reason: 'Schedule conflict' };

      const mockCancellation = {
        id: 123,
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'Schedule conflict',
        refundAmount: 100,
      };

      (coachService.cancelSession as jest.Mock).mockResolvedValue(mockCancellation);

      const handler = controller.cancelSession[controller.cancelSession.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(coachService.cancelSession).toHaveBeenCalledWith(
        123,
        'user-123',
        'user',
        'Schedule conflict'
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Session cancelled successfully',
      });
    });

    test('should enforce cancellation policy timeframe', async () => {
      mockRequest.params = { id: '123' };

      (coachService.cancelSession as jest.Mock).mockRejectedValue(
        new Error('Cannot cancel within 24 hours of session')
      );

      const handler = controller.cancelSession[controller.cancelSession.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot cancel within 24 hours of session',
      });
    });
  });

  describe('Admin Functions', () => {
    beforeEach(() => {
      mockRequest.userRole = 'admin';
    });

    test('adminUpdateCoachStatus - should update coach status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { isActive: false };

      const { CoachProfile } = require('../../models/CoachProfile');
      CoachProfile.update = jest.fn().mockResolvedValue([1]);

      const handler = controller.adminUpdateCoachStatus[controller.adminUpdateCoachStatus.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Coach status updated successfully',
      });
    });

    test('adminVerifyCoach - should verify coach profile', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { isVerified: true };

      const { CoachProfile } = require('../../models/CoachProfile');
      CoachProfile.update = jest.fn().mockResolvedValue([1]);

      const handler = controller.adminVerifyCoach[controller.adminVerifyCoach.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Coach verification updated successfully',
      });
    });

    test('adminFeatureCoach - should feature/unfeature coach', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { isFeatured: true };

      const { CoachProfile } = require('../../models/CoachProfile');
      CoachProfile.update = jest.fn().mockResolvedValue([1]);

      const handler = controller.adminFeatureCoach[controller.adminFeatureCoach.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Coach feature status updated successfully',
      });
    });

    test('adminDeleteReview - should delete inappropriate review', async () => {
      mockRequest.params = { id: '123' };

      const { CoachReview } = require('../../models/CoachReview');
      CoachReview.destroy = jest.fn().mockResolvedValue(1);

      const handler = controller.adminDeleteReview[controller.adminDeleteReview.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Review deleted successfully',
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle service errors gracefully', async () => {
      (coachService.searchCoaches as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const handler = controller.searchCoaches[controller.searchCoaches.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to search coaches',
      });
    });

    test('should handle missing required fields', async () => {
      mockRequest.body = {}; // Empty body

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'coachId is required', param: 'coachId' }],
      });

      const handler = controller.bookSession[controller.bookSession.length - 1] as Function;
      await handler(mockRequest, mockResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });
});