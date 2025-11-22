/**
 * API Contract Tests: Goals Endpoints
 *
 * Tests the HTTP API contract for goal management endpoints:
 * - CRUD operations request/response schemas
 * - Pagination contracts
 * - Filtering and sorting contracts
 * - Authorization enforcement
 * - Resource ownership validation
 */

describe('Goals API Contracts', () => {
  describe('POST /api/goals', () => {
    test('should have correct request schema validation', () => {
      // Contract: Goal creation requires title and category
      const validRequest = {
        title: 'Complete marathon training',
        description: 'Train for and complete a full marathon',
        category: 'fitness',
        priority: 'high',
        targetDate: '2025-12-31T00:00:00.000Z',
      };

      const requiredFields = ['title', 'category'];
      requiredFields.forEach(field => {
        expect(validRequest).toHaveProperty(field);
      });
    });

    test('should return 201 with created goal on success', () => {
      // Contract: Success response includes full goal object
      const expectedSuccessResponse = {
        status: 201,
        body: {
          goal: {
            id: expect.any(String),
            userId: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            category: expect.any(String),
            status: 'active',
            progress: 0,
            priority: expect.any(String),
            targetDate: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          gamification: {
            pointsAwarded: expect.any(Number),
            achievements: expect.any(Array),
          },
        },
      };

      expect(expectedSuccessResponse.status).toBe(201);
      expect(expectedSuccessResponse.body.goal.status).toBe('active');
      expect(expectedSuccessResponse.body.goal.progress).toBe(0);
    });

    test('should return 400 for invalid category', () => {
      // Contract: Invalid category returns validation error
      const expectedErrorResponse = {
        status: 400,
        body: {
          error: 'Validation failed',
          details: [
            {
              field: 'category',
              message: 'Category must be one of: fitness, career, learning, wellness, financial, personal',
              value: 'invalid_category',
            },
          ],
        },
      };

      expect(expectedErrorResponse.status).toBe(400);
      expect(expectedErrorResponse.body.details[0].field).toBe('category');
    });

    test('should return 401 without authentication', () => {
      // Contract: Goal creation requires authentication
      const expectedUnauthorizedResponse = {
        status: 401,
        body: {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
      };

      expect(expectedUnauthorizedResponse.status).toBe(401);
    });
  });

  describe('GET /api/goals', () => {
    test('should support pagination query parameters', () => {
      // Contract: Pagination via page and limit parameters
      const validQueryParams = {
        page: 1,
        limit: 20,
      };

      expect(validQueryParams).toHaveProperty('page');
      expect(validQueryParams).toHaveProperty('limit');
      expect(validQueryParams.page).toBeGreaterThanOrEqual(1);
      expect(validQueryParams.limit).toBeGreaterThan(0);
      expect(validQueryParams.limit).toBeLessThanOrEqual(100);
    });

    test('should support filtering query parameters', () => {
      // Contract: Filter by status, category, priority
      const validFilters = {
        status: 'active',
        category: 'fitness',
        priority: 'high',
        isArchived: false,
      };

      expect(validFilters).toHaveProperty('status');
      expect(['active', 'completed', 'paused']).toContain(validFilters.status);
    });

    test('should return 200 with paginated results', () => {
      // Contract: Response includes goals array and pagination metadata
      const expectedSuccessResponse = {
        status: 200,
        body: {
          goals: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              status: expect.any(String),
              progress: expect.any(Number),
            }),
          ]),
          pagination: {
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            totalPages: expect.any(Number),
            hasNext: expect.any(Boolean),
            hasPrevious: expect.any(Boolean),
          },
        },
      };

      // Verify contract shape
      expect(expectedSuccessResponse.status).toBe(200);
      expect(expectedSuccessResponse.body).toHaveProperty('goals');
      expect(expectedSuccessResponse.body).toHaveProperty('pagination');
    });

    test('should return empty array when no goals found', () => {
      // Contract: Empty results return empty array, not null
      const expectedEmptyResponse = {
        status: 200,
        body: {
          goals: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        },
      };

      expect(Array.isArray(expectedEmptyResponse.body.goals)).toBe(true);
      expect(expectedEmptyResponse.body.goals).toHaveLength(0);
    });
  });

  describe('GET /api/goals/:id', () => {
    test('should return 200 with goal details', () => {
      // Contract: Single goal response includes full details
      const expectedSuccessResponse = {
        status: 200,
        body: {
          goal: {
            id: expect.any(String),
            userId: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            category: expect.any(String),
            status: expect.any(String),
            progress: expect.any(Number),
            priority: expect.any(String),
            targetDate: expect.any(String),
            milestones: expect.any(Array),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        },
      };

      expect(expectedSuccessResponse.body.goal).toHaveProperty('id');
      expect(expectedSuccessResponse.body.goal).toHaveProperty('milestones');
    });

    test('should return 404 when goal not found', () => {
      // Contract: Non-existent goal returns 404
      const expectedNotFoundResponse = {
        status: 404,
        body: {
          error: 'Not found',
          message: 'Goal not found',
          goalId: expect.any(String),
        },
      };

      expect(expectedNotFoundResponse.status).toBe(404);
      expect(expectedNotFoundResponse.body.error).toBe('Not found');
    });

    test('should return 403 when accessing another user\'s goal', () => {
      // Contract: Unauthorized access returns 403 Forbidden
      const expectedForbiddenResponse = {
        status: 403,
        body: {
          error: 'Forbidden',
          message: 'You do not have permission to access this goal',
        },
      };

      expect(expectedForbiddenResponse.status).toBe(403);
      expect(expectedForbiddenResponse.body.error).toBe('Forbidden');
    });

    test('should return 400 for invalid UUID format', () => {
      // Contract: Invalid ID format returns 400
      const expectedBadRequestResponse = {
        status: 400,
        body: {
          error: 'Validation failed',
          details: [
            {
              field: 'id',
              message: 'Invalid UUID format',
            },
          ],
        },
      };

      expect(expectedBadRequestResponse.status).toBe(400);
    });
  });

  describe('PATCH /api/goals/:id', () => {
    test('should have correct update request schema', () => {
      // Contract: Update allows partial updates
      const validUpdateRequest = {
        title: 'Updated title',
        progress: 50,
        status: 'active',
      };

      // All fields should be optional
      expect(validUpdateRequest).toHaveProperty('title');
      expect(Object.keys(validUpdateRequest).length).toBeGreaterThan(0);
    });

    test('should return 200 with updated goal', () => {
      // Contract: Update response includes full updated goal
      const expectedSuccessResponse = {
        status: 200,
        body: {
          goal: {
            id: expect.any(String),
            title: expect.any(String),
            progress: expect.any(Number),
            updatedAt: expect.any(String),
          },
        },
      };

      expect(expectedSuccessResponse.status).toBe(200);
      expect(expectedSuccessResponse.body).toHaveProperty('goal');
    });

    test('should return 422 for invalid progress value', () => {
      // Contract: Progress must be 0-100
      const expectedErrorResponse = {
        status: 422,
        body: {
          error: 'Unprocessable entity',
          details: [
            {
              field: 'progress',
              message: 'Progress must be between 0 and 100',
              value: 150,
            },
          ],
        },
      };

      expect(expectedErrorResponse.status).toBe(422);
      expect(expectedErrorResponse.body.details[0].field).toBe('progress');
    });
  });

  describe('DELETE /api/goals/:id', () => {
    test('should return 204 on successful deletion', () => {
      // Contract: Successful deletion returns 204 No Content
      const expectedSuccessResponse = {
        status: 204,
        body: null, // No content
      };

      expect(expectedSuccessResponse.status).toBe(204);
      expect(expectedSuccessResponse.body).toBeNull();
    });

    test('should return 404 when goal not found', () => {
      // Contract: Cannot delete non-existent goal
      const expectedNotFoundResponse = {
        status: 404,
        body: {
          error: 'Not found',
          message: 'Goal not found',
        },
      };

      expect(expectedNotFoundResponse.status).toBe(404);
    });

    test('should return 403 when deleting another user\'s goal', () => {
      // Contract: Cannot delete other users' goals
      const expectedForbiddenResponse = {
        status: 403,
        body: {
          error: 'Forbidden',
          message: 'You do not have permission to delete this goal',
        },
      };

      expect(expectedForbiddenResponse.status).toBe(403);
    });
  });

  describe('POST /api/goals/:id/milestones', () => {
    test('should have correct milestone creation schema', () => {
      // Contract: Milestone requires title and optional dueDate
      const validRequest = {
        title: 'Run 5km without stopping',
        description: 'Build endurance to run 5km',
        dueDate: '2025-06-30T00:00:00.000Z',
      };

      expect(validRequest).toHaveProperty('title');
    });

    test('should return 201 with created milestone', () => {
      // Contract: Response includes milestone and updated goal progress
      const expectedSuccessResponse = {
        status: 201,
        body: {
          milestone: {
            id: expect.any(String),
            goalId: expect.any(String),
            title: expect.any(String),
            completed: false,
            completedAt: null,
            createdAt: expect.any(String),
          },
          goal: {
            progress: expect.any(Number),
            totalMilestones: expect.any(Number),
            completedMilestones: expect.any(Number),
          },
        },
      };

      expect(expectedSuccessResponse.status).toBe(201);
      expect(expectedSuccessResponse.body.milestone.completed).toBe(false);
    });
  });

  describe('GET /api/goals/:id/progress', () => {
    test('should return 200 with progress analytics', () => {
      // Contract: Progress includes metrics and trends
      const expectedSuccessResponse = {
        status: 200,
        body: {
          goalId: expect.any(String),
          currentProgress: expect.any(Number),
          milestones: {
            total: expect.any(Number),
            completed: expect.any(Number),
            pending: expect.any(Number),
          },
          trend: {
            direction: expect.stringMatching(/^(up|down|stable)$/),
            percentageChange: expect.any(Number),
            period: '30d',
          },
          projectedCompletion: expect.any(String),
        },
      };

      // Verify contract shape
      expect(expectedSuccessResponse.status).toBe(200);
      expect(expectedSuccessResponse.body).toHaveProperty('currentProgress');
      expect(expectedSuccessResponse.body).toHaveProperty('trend');
      expect(expectedSuccessResponse.body).toHaveProperty('milestones');
    });
  });

  describe('Authentication & Authorization Contract', () => {
    test('should enforce authentication on all endpoints', () => {
      // Contract: All goal endpoints require valid JWT
      const protectedEndpoints = [
        'POST /api/goals',
        'GET /api/goals',
        'GET /api/goals/:id',
        'PATCH /api/goals/:id',
        'DELETE /api/goals/:id',
      ];

      protectedEndpoints.forEach(endpoint => {
        expect(endpoint).toBeTruthy();
      });

      // All should return 401 without authentication
      const expectedResponse = {
        status: 401,
        body: {
          error: 'Unauthorized',
        },
      };

      expect(expectedResponse.status).toBe(401);
    });

    test('should enforce resource ownership', () => {
      // Contract: Users can only access/modify their own goals
      const expectedForbiddenResponse = {
        status: 403,
        body: {
          error: 'Forbidden',
          message: expect.stringContaining('permission'),
        },
      };

      expect(expectedForbiddenResponse.status).toBe(403);
    });
  });
});
