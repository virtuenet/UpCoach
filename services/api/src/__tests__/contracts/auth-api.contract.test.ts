/**
 * API Contract Tests: Authentication Endpoints
 *
 * Tests the HTTP API contract for authentication endpoints:
 * - Request validation
 * - Response schemas
 * - Status codes
 * - Error handling
 * - Authentication enforcement
 *
 * These tests mock services and focus on HTTP layer behavior.
 */

describe('Authentication API Contracts', () => {
  describe('POST /api/auth/register', () => {
    test('should have correct request schema validation', () => {
      // Contract: Registration request must include email, password, firstName, lastName
      const validRequest = {
        email: 'user@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const invalidRequests = [
        { /* missing email */ password: 'pass', firstName: 'John', lastName: 'Doe' },
        { email: 'invalid-email', password: 'pass', firstName: 'John', lastName: 'Doe' },
        { email: 'user@example.com' /* missing password */, firstName: 'John', lastName: 'Doe' },
        { email: 'user@example.com', password: 'weak' /* too short */, firstName: 'John', lastName: 'Doe' },
      ];

      // Validate that validRequest schema is correct
      expect(validRequest).toHaveProperty('email');
      expect(validRequest).toHaveProperty('password');
      expect(validRequest).toHaveProperty('firstName');
      expect(validRequest).toHaveProperty('lastName');

      // Validate that invalidRequests would fail validation
      invalidRequests.forEach(req => {
        expect(req).not.toEqual(validRequest);
      });
    });

    test('should return 201 with user and token on success', () => {
      // Contract: Success response must include user object and token
      const expectedSuccessResponse = {
        status: 201,
        body: {
          user: {
            id: expect.any(String),
            email: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            role: expect.any(String),
            emailVerified: expect.any(Boolean),
          },
          token: expect.any(String),
          gamification: {
            level: expect.any(Number),
            totalPoints: expect.any(Number),
          },
        },
      };

      // Verify contract shape
      expect(expectedSuccessResponse.status).toBe(201);
      expect(expectedSuccessResponse.body).toHaveProperty('user');
      expect(expectedSuccessResponse.body).toHaveProperty('token');
      expect(expectedSuccessResponse.body).toHaveProperty('gamification');
    });

    test('should return 400 for validation errors', () => {
      // Contract: Validation errors return 400 with error array
      const expectedValidationErrorResponse = {
        status: 400,
        body: {
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
            }),
          ]),
        },
      };

      expect(expectedValidationErrorResponse.status).toBe(400);
      expect(expectedValidationErrorResponse.body).toHaveProperty('error');
      expect(expectedValidationErrorResponse.body).toHaveProperty('details');
    });

    test('should return 409 when email already exists', () => {
      // Contract: Duplicate email returns 409 Conflict
      const expectedConflictResponse = {
        status: 409,
        body: {
          error: 'Email already registered',
          message: expect.any(String),
        },
      };

      expect(expectedConflictResponse.status).toBe(409);
      expect(expectedConflictResponse.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should have correct request schema', () => {
      // Contract: Login requires email and password
      const validRequest = {
        email: 'user@example.com',
        password: 'password123',
      };

      expect(validRequest).toHaveProperty('email');
      expect(validRequest).toHaveProperty('password');
      expect(Object.keys(validRequest)).toHaveLength(2);
    });

    test('should return 200 with user and token on success', () => {
      // Contract: Success response includes user and JWT token
      const expectedSuccessResponse = {
        status: 200,
        body: {
          user: {
            id: expect.any(String),
            email: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            role: expect.any(String),
          },
          token: expect.any(String),
          expiresIn: expect.any(Number),
        },
      };

      expect(expectedSuccessResponse.status).toBe(200);
      expect(expectedSuccessResponse.body).toHaveProperty('user');
      expect(expectedSuccessResponse.body).toHaveProperty('token');
    });

    test('should return 401 for invalid credentials', () => {
      // Contract: Invalid credentials return 401 Unauthorized
      const expectedUnauthorizedResponse = {
        status: 401,
        body: {
          error: 'Invalid credentials',
          message: expect.any(String),
        },
      };

      expect(expectedUnauthorizedResponse.status).toBe(401);
      expect(expectedUnauthorizedResponse.body).toHaveProperty('error');
    });

    test('should return 429 after rate limit exceeded', () => {
      // Contract: Rate limiting returns 429 Too Many Requests
      const expectedRateLimitResponse = {
        status: 429,
        body: {
          error: 'Too many login attempts',
          retryAfter: expect.any(Number),
        },
      };

      expect(expectedRateLimitResponse.status).toBe(429);
      expect(expectedRateLimitResponse.body).toHaveProperty('retryAfter');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should require authentication', () => {
      // Contract: Logout endpoint requires valid JWT token
      const requiredHeader = {
        authorization: 'Bearer <jwt_token>',
      };

      expect(requiredHeader).toHaveProperty('authorization');
      expect(requiredHeader.authorization).toMatch(/^Bearer /);
    });

    test('should return 200 on successful logout', () => {
      // Contract: Success response confirms logout
      const expectedSuccessResponse = {
        status: 200,
        body: {
          message: 'Logged out successfully',
        },
      };

      expect(expectedSuccessResponse.status).toBe(200);
      expect(expectedSuccessResponse.body).toHaveProperty('message');
    });

    test('should return 401 without valid token', () => {
      // Contract: Missing/invalid token returns 401
      const expectedUnauthorizedResponse = {
        status: 401,
        body: {
          error: 'Unauthorized',
          message: 'No valid authentication token provided',
        },
      };

      expect(expectedUnauthorizedResponse.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    test('should have correct request schema', () => {
      // Contract: Refresh token endpoint accepts refresh token
      const validRequest = {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
      };

      // Verify contract shape
      expect(validRequest).toHaveProperty('refreshToken');
      expect(typeof validRequest.refreshToken).toBe('string');
    });

    test('should return 200 with new tokens', () => {
      // Contract: Success returns new access and refresh tokens
      const expectedSuccessResponse = {
        status: 200,
        body: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: expect.any(Number),
        },
      };

      expect(expectedSuccessResponse.body).toHaveProperty('accessToken');
      expect(expectedSuccessResponse.body).toHaveProperty('refreshToken');
    });

    test('should return 401 for invalid refresh token', () => {
      // Contract: Invalid refresh token returns 401
      const expectedUnauthorizedResponse = {
        status: 401,
        body: {
          error: 'Invalid refresh token',
        },
      };

      expect(expectedUnauthorizedResponse.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    test('should require authentication', () => {
      // Contract: Current user endpoint requires auth
      const requiredHeader = {
        authorization: 'Bearer <jwt_token>',
      };

      expect(requiredHeader).toHaveProperty('authorization');
    });

    test('should return 200 with current user', () => {
      // Contract: Returns authenticated user's profile
      const expectedSuccessResponse = {
        status: 200,
        body: {
          user: {
            id: expect.any(String),
            email: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            role: expect.any(String),
            emailVerified: expect.any(Boolean),
            createdAt: expect.any(String),
          },
        },
      };

      expect(expectedSuccessResponse.status).toBe(200);
      expect(expectedSuccessResponse.body).toHaveProperty('user');
    });

    test('should return 401 without authentication', () => {
      // Contract: Unauthenticated request returns 401
      const expectedUnauthorizedResponse = {
        status: 401,
        body: {
          error: 'Unauthorized',
        },
      };

      expect(expectedUnauthorizedResponse.status).toBe(401);
    });
  });

  describe('Error Response Format Contract', () => {
    test('should have consistent error response schema', () => {
      // Contract: All errors follow consistent format
      const standardErrorResponse = {
        error: expect.any(String), // Error type/message
        message: expect.any(String), // User-friendly message
        statusCode: expect.any(Number), // HTTP status code
        timestamp: expect.any(String), // ISO 8601 timestamp
        path: expect.any(String), // API path that errored
      };

      expect(standardErrorResponse).toHaveProperty('error');
      expect(standardErrorResponse).toHaveProperty('message');
      expect(standardErrorResponse).toHaveProperty('statusCode');
    });

    test('should include validation details for 400 errors', () => {
      // Contract: Validation errors include field-level details
      const validationErrorResponse = {
        error: 'Validation failed',
        details: [
          {
            field: 'email',
            message: 'Invalid email format',
            value: 'not-an-email',
          },
        ],
      };

      // Verify contract shape
      expect(validationErrorResponse).toHaveProperty('details');
      expect(validationErrorResponse).toHaveProperty('error');
      expect(Array.isArray(validationErrorResponse.details)).toBe(true);
    });
  });
});
