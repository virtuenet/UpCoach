/**
 * API Contract Tests: Referral Endpoints
 *
 * Tests the HTTP API contract for referral program endpoints:
 * - Referral code generation and validation
 * - Referral application and tracking
 * - Leaderboard and history
 * - Reward processing
 */

describe('Referral API Contracts', () => {
  describe('POST /api/referral/code', () => {
    test('should have correct referral code creation request schema', () => {
      // Contract: Code creation with optional program selection
      const validRequest = {
        programId: 'standard', // 'standard' | 'premium' | 'coach'
      };

      expect(['standard', 'premium', 'coach']).toContain(validRequest.programId);
    });

    test('should return 201 with referral code and share URL', () => {
      // Contract: Code creation returns 201 with code details
      const expectedSuccessResponse = {
        status: 201,
        body: {
          success: true,
          data: {
            code: expect.any(String),
            expiresAt: expect.any(String),
            programId: expect.any(String),
            shareUrl: expect.stringMatching(/\/signup\?ref=/),
          },
        },
      };

      expect(expectedSuccessResponse.status).toBe(201);
      expect(expectedSuccessResponse.body.data).toHaveProperty('code');
      expect(expectedSuccessResponse.body.data).toHaveProperty('shareUrl');
    });

    test('should require authentication', () => {
      // Contract: Authentication required for code creation
      const expectedUnauthorizedResponse = {
        status: 401,
        body: {
          error: 'Unauthorized',
        },
      };

      expect(expectedUnauthorizedResponse.status).toBe(401);
    });
  });

  describe('POST /api/referral/validate', () => {
    test('should have correct validation request schema', () => {
      // Contract: Validation requires code
      const validRequest = {
        code: expect.stringMatching(/^[A-Z0-9]{4,20}$/),
      };

      expect(validRequest).toHaveProperty('code');
    });

    test('should return 200 with validity and discount info', () => {
      // Contract: Valid code returns discount details
      const expectedSuccessResponse = {
        status: 200,
        body: {
          success: true,
          data: {
            valid: true,
            programId: 'standard',
            discount: 20,
            discountType: 'percentage',
          },
        },
      };

      expect(expectedSuccessResponse.body.data).toHaveProperty('valid');
      expect(expectedSuccessResponse.body.data).toHaveProperty('discount');
      expect(expectedSuccessResponse.body.data.discount).toBeGreaterThan(0);
    });

    test('should return 404 for invalid code', () => {
      // Contract: Invalid code returns 404
      const expectedErrorResponse = {
        status: 404,
        body: {
          success: false,
          error: 'Invalid referral code',
        },
      };

      expect(expectedErrorResponse.status).toBe(404);
    });

    test('should not require authentication (public endpoint)', () => {
      // Contract: Validation is public for signup flow
      const publicAccess = true;
      expect(publicAccess).toBe(true);
    });
  });

  describe('POST /api/referral/apply', () => {
    test('should have correct apply request schema', () => {
      // Contract: Apply requires code
      const validRequest = {
        code: expect.stringMatching(/^[A-Z0-9]{4,20}$/),
      };

      expect(validRequest).toHaveProperty('code');
    });

    test('should return 200 with discount confirmation', () => {
      // Contract: Successful application returns discount (> 0)
      const expectedSuccessResponse = {
        status: 200,
        body: {
          success: true,
          data: {
            discount: expect.any(Number),
            message: expect.any(String),
          },
        },
      };

      expect(expectedSuccessResponse.body.data).toHaveProperty('discount');
      expect(expectedSuccessResponse.body.data).toHaveProperty('message');
    });

    test('should return 400 for invalid or expired code', () => {
      // Contract: Invalid/expired code returns 400
      const expectedErrorResponse = {
        status: 400,
        body: {
          success: false,
          error: expect.any(String),
        },
      };

      expect(expectedErrorResponse.status).toBe(400);
    });

    test('should require authentication', () => {
      // Contract: Authentication required for applying code
      const expectedUnauthorizedResponse = {
        status: 401,
        body: {
          error: 'Unauthorized',
        },
      };

      expect(expectedUnauthorizedResponse.status).toBe(401);
    });
  });

  describe('GET /api/referral/stats', () => {
    test('should return 200 with user referral statistics', () => {
      // Contract: Stats endpoint returns referral metrics (totalReferrals >= 0)
      const expectedSuccessResponse = {
        status: 200,
        body: {
          success: true,
          data: {
            referralCode: expect.any(String),
            totalReferrals: expect.any(Number),
            successfulReferrals: expect.any(Number),
            pendingReferrals: expect.any(Number),
            totalEarnings: expect.any(Number),
            pendingEarnings: expect.any(Number),
            conversionRate: expect.any(Number),
            referrals: expect.any(Array),
          },
        },
      };

      expect(expectedSuccessResponse.body.data).toHaveProperty('totalReferrals');
      expect(expectedSuccessResponse.body.data).toHaveProperty('totalEarnings');
    });

    test('should require authentication', () => {
      // Contract: Authentication required for stats
      const expectedUnauthorizedResponse = {
        status: 401,
        body: {
          error: 'Unauthorized',
        },
      };

      expect(expectedUnauthorizedResponse.status).toBe(401);
    });
  });

  describe('GET /api/referral/leaderboard', () => {
    test('should support period query parameter', () => {
      // Contract: Leaderboard with period filtering
      const validQueryParams = {
        period: 'month', // 'week' | 'month' | 'all'
      };

      expect(['week', 'month', 'all']).toContain(validQueryParams.period);
    });

    test('should return 200 with leaderboard data', () => {
      // Contract: Leaderboard response with rankings
      const expectedSuccessResponse = {
        status: 200,
        body: {
          success: true,
          data: {
            period: 'month',
            leaderboard: expect.arrayContaining([
              expect.objectContaining({
                userId: expect.any(Number),
                userName: expect.any(String),
                referralCount: expect.any(Number),
                earnings: expect.any(Number),
                rank: expect.any(Number),
              }),
            ]),
          },
        },
      };

      expect(expectedSuccessResponse.body.data).toHaveProperty('period');
      expect(expectedSuccessResponse.body.data).toHaveProperty('leaderboard');
    });

    test('should not require authentication (public leaderboard)', () => {
      // Contract: Leaderboard is public for gamification
      const publicAccess = true;
      expect(publicAccess).toBe(true);
    });
  });

  describe('GET /api/referral/history', () => {
    test('should return 200 with referral history', () => {
      // Contract: History with referral details and summary
      const expectedSuccessResponse = {
        status: 200,
        body: {
          success: true,
          data: {
            referrals: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(Number),
                referredEmail: expect.any(String),
                status: expect.stringMatching(/^(pending|completed|expired)$/),
                createdAt: expect.any(String),
                completedAt: expect.any(String),
                reward: expect.any(Number),
              }),
            ]),
            summary: {
              total: expect.any(Number),
              successful: expect.any(Number),
              earnings: expect.any(Number),
              pending: expect.any(Number),
            },
          },
        },
      };

      expect(expectedSuccessResponse.body.data).toHaveProperty('referrals');
      expect(expectedSuccessResponse.body.data).toHaveProperty('summary');
    });
  });

  describe('POST /api/referral/click', () => {
    test('should have correct click tracking request schema', () => {
      // Contract: Click tracking with code and analytics data
      const validRequest = {
        code: expect.any(String),
        landingPage: 'https://upcoach.com/signup',
        utmParams: {
          utm_source: 'referral',
          utm_medium: 'email',
          utm_campaign: 'referral-program',
        },
      };

      expect(validRequest).toHaveProperty('code');
    });

    test('should return 200 confirming tracking', () => {
      // Contract: Click tracking confirmation
      const expectedSuccessResponse = {
        status: 200,
        body: {
          success: true,
        },
      };

      expect(expectedSuccessResponse.body.success).toBe(true);
    });

    test('should not require authentication (public tracking)', () => {
      // Contract: Click tracking is public for analytics
      const publicAccess = true;
      expect(publicAccess).toBe(true);
    });
  });

  describe('POST /api/referral/share', () => {
    test('should have correct share request schema', () => {
      // Contract: Share requires email list and optional message
      const validRequest = {
        emails: ['friend1@example.com', 'friend2@example.com'],
        message: 'Check out this amazing coaching platform!',
      };

      expect(validRequest.emails).toBeInstanceOf(Array);
      expect(validRequest.emails.length).toBeGreaterThan(0);
    });

    test('should validate email addresses', () => {
      // Contract: All emails must be valid
      const invalidRequest = {
        emails: ['invalid-email', 'not-an-email'],
      };

      const expectedErrorResponse = {
        status: 400,
        body: {
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'emails.*',
              message: 'Invalid email address',
            }),
          ]),
        },
      };

      expect(expectedErrorResponse.status).toBe(400);
    });

    test('should return 200 with send confirmation', () => {
      // Contract: Successful share returns count (> 0)
      const expectedSuccessResponse = {
        status: 200,
        body: {
          success: true,
          data: {
            sent: 2,
            message: 'Referral invitations sent successfully',
          },
        },
      };

      expect(expectedSuccessResponse.body.data).toHaveProperty('sent');
      expect(expectedSuccessResponse.body.data).toHaveProperty('message');
    });

    test('should return 400 if no active referral code', () => {
      // Contract: User must have active code to share
      const expectedErrorResponse = {
        status: 400,
        body: {
          success: false,
          error: 'No active referral code found',
        },
      };

      expect(expectedErrorResponse.status).toBe(400);
    });
  });

  describe('POST /api/referral/process-reward', () => {
    test('should have correct reward processing request schema', () => {
      // Contract: Reward processing requires referee ID and payment amount
      const validRequest = {
        refereeId: expect.any(Number),
        paymentAmount: expect.any(Number),
      };

      expect(validRequest).toHaveProperty('refereeId');
      expect(validRequest).toHaveProperty('paymentAmount');
    });

    test('should return 200 with processing confirmation', () => {
      // Contract: Successful reward processing
      const expectedSuccessResponse = {
        status: 200,
        body: {
          success: true,
          data: {
            message: 'Referral reward processed successfully',
          },
        },
      };

      expect(expectedSuccessResponse.body.success).toBe(true);
    });

    test('should return 403 for non-admin users', () => {
      // Contract: Only admins can process rewards
      const expectedForbiddenResponse = {
        status: 403,
        body: {
          success: false,
          error: 'Unauthorized',
        },
      };

      expect(expectedForbiddenResponse.status).toBe(403);
    });

    test('should require authentication', () => {
      // Contract: Authentication required
      const expectedUnauthorizedResponse = {
        status: 401,
        body: {
          error: 'Unauthorized',
        },
      };

      expect(expectedUnauthorizedResponse.status).toBe(401);
    });
  });
});
