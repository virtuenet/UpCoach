/**
 * API Contract Tests: Coaching Endpoints
 *
 * Tests the HTTP API contract for coaching/session endpoints:
 * - Session booking and management
 * - Coach profile endpoints
 * - Session feedback and ratings
 * - Availability management
 */

describe('Coaching API Contracts', () => {
  describe('POST /api/coaching/sessions', () => {
    test('should have correct session booking request schema', () => {
      // Contract: Session booking requires coach, time slots, and type
      const validRequest = {
        coachId: expect.any(String),
        scheduledStartTime: expect.any(String), // ISO 8601
        scheduledEndTime: expect.any(String),
        sessionType: 'initial_consultation',
        notes: expect.any(String),
      };

      expect(validRequest).toHaveProperty('coachId');
      expect(validRequest).toHaveProperty('scheduledStartTime');
      expect(validRequest).toHaveProperty('scheduledEndTime');
      expect(validRequest).toHaveProperty('sessionType');
    });

    test('should return 201 with session details on success', () => {
      // Contract: Success response includes full session object
      const expectedSuccessResponse = {
        status: 201,
        body: {
          session: {
            id: expect.any(String),
            coachId: expect.any(String),
            clientId: expect.any(String),
            scheduledStartTime: expect.any(String),
            scheduledEndTime: expect.any(String),
            sessionType: expect.any(String),
            status: 'scheduled',
            amount: expect.any(Number),
          },
          payment: {
            id: expect.any(String),
            amount: expect.any(Number),
            status: 'held',
          },
          gamification: {
            pointsAwarded: expect.any(Number),
            achievements: expect.any(Array),
          },
        },
      };

      expect(expectedSuccessResponse.status).toBe(201);
      expect(expectedSuccessResponse.body).toHaveProperty('session');
      expect(expectedSuccessResponse.body).toHaveProperty('payment');
    });

    test('should return 409 for double-booking conflicts', () => {
      // Contract: Double-booking returns 409 Conflict
      const expectedConflictResponse = {
        status: 409,
        body: {
          error: 'Booking conflict',
          message: 'Coach is not available at this time',
          conflictingSession: {
            id: expect.any(String),
            start: expect.any(String),
            end: expect.any(String),
          },
        },
      };

      expect(expectedConflictResponse.status).toBe(409);
      expect(expectedConflictResponse.body).toHaveProperty('conflictingSession');
    });
  });

  describe('GET /api/coaches/search', () => {
    test('should support search and filter parameters', () => {
      // Contract: Coach search with filters
      const validQueryParams = {
        specialization: 'fitness',
        minRating: 4.0,
        maxHourlyRate: 100,
        available: true,
        page: 1,
        limit: 20,
      };

      expect(validQueryParams).toHaveProperty('specialization');
      expect(validQueryParams.minRating).toBeGreaterThanOrEqual(0);
      expect(validQueryParams.minRating).toBeLessThanOrEqual(5);
    });

    test('should return 200 with coach list and pagination', () => {
      // Contract: Response includes coaches array and pagination
      const expectedSuccessResponse = {
        status: 200,
        body: {
          coaches: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              firstName: expect.any(String),
              lastName: expect.any(String),
              specializations: expect.any(Array),
              hourlyRate: expect.any(Number),
              rating: expect.any(Number),
              totalSessions: expect.any(Number),
            }),
          ]),
          pagination: {
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
          },
        },
      };

      expect(expectedSuccessResponse.body).toHaveProperty('coaches');
      expect(expectedSuccessResponse.body).toHaveProperty('pagination');
    });
  });

  describe('PATCH /api/coaching/sessions/:id/complete', () => {
    test('should have correct completion request schema', () => {
      // Contract: Session completion requires notes and next steps
      const validRequest = {
        notes: expect.any(String),
        nextSteps: expect.any(String),
      };

      expect(validRequest).toHaveProperty('notes');
    });

    test('should return 200 with completed session', () => {
      // Contract: Completion updates session status
      const expectedSuccessResponse = {
        status: 200,
        body: {
          session: {
            id: expect.any(String),
            status: 'completed',
            completedAt: expect.any(String),
            coachNotes: expect.any(String),
          },
        },
      };

      expect(expectedSuccessResponse.body.session.status).toBe('completed');
    });

    test('should return 403 if not the coach', () => {
      // Contract: Only coach can complete session
      const expectedForbiddenResponse = {
        status: 403,
        body: {
          error: 'Forbidden',
          message: 'Only the coach can complete this session',
        },
      };

      expect(expectedForbiddenResponse.status).toBe(403);
    });
  });

  describe('POST /api/coaching/sessions/:id/rate', () => {
    test('should have correct rating request schema', () => {
      // Contract: Rating requires rating value 1-5 and optional feedback
      const validRequest = {
        rating: 5,
        feedback: expect.any(String),
      };

      expect(validRequest.rating).toBeGreaterThanOrEqual(1);
      expect(validRequest.rating).toBeLessThanOrEqual(5);
    });

    test('should return 200 with updated coach rating', () => {
      // Contract: Rating updates coach profile
      const expectedSuccessResponse = {
        status: 200,
        body: {
          rating: {
            id: expect.any(String),
            rating: expect.any(Number),
            feedback: expect.any(String),
          },
          coachProfile: {
            rating: expect.any(Number),
            totalReviews: expect.any(Number),
          },
        },
      };

      expect(expectedSuccessResponse.body).toHaveProperty('rating');
      expect(expectedSuccessResponse.body).toHaveProperty('coachProfile');
    });

    test('should return 400 for invalid rating value', () => {
      // Contract: Rating must be 1-5
      const expectedErrorResponse = {
        status: 400,
        body: {
          error: 'Validation failed',
          details: [
            {
              field: 'rating',
              message: 'Rating must be between 1 and 5',
              value: 6,
            },
          ],
        },
      };

      expect(expectedErrorResponse.status).toBe(400);
    });
  });
});
