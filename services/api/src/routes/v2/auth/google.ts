import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../middleware/errorHandler';
import { authLimiter } from '../../../middleware/rateLimiter';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';
import { googleAuthService } from '../../../services/auth/GoogleAuthService';
import { ApiError } from '../../../utils/apiError';
import { logger } from '../../../utils/logger';

const router = Router();

// Validation schemas
const googleSignInSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
  platform: z.enum(['mobile', 'web']).default('web'),
  deviceInfo: z
    .object({
      deviceId: z.string().optional(),
      deviceName: z.string().optional(),
      platform: z.string().optional(),
      appVersion: z.string().optional(),
      ipAddress: z.string().optional(),
    })
    .optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * @route   POST /api/v2/auth/google/signin
 * @desc    Sign in with Google OAuth
 * @access  Public
 * @body    {
 *            idToken: string,
 *            platform: 'mobile' | 'web',
 *            deviceInfo?: { deviceId, deviceName, platform, appVersion }
 *          }
 */
router.post(
  '/signin',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedData = googleSignInSchema.parse(req.body);

      // Get IP address from request
      const ipAddress =
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        'unknown';

      // Add IP address to device info
      const deviceInfo = {
        ...validatedData.deviceInfo,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      };

      // Process Google sign-in
      const result = await googleAuthService.signIn(
        validatedData.idToken,
        validatedData.platform,
        deviceInfo
      );

      logger.info('Google sign-in successful:', {
        userId: result.user.id,
        email: result.user.email,
        platform: validatedData.platform,
        isNewUser: result.isNewUser,
      });

      res.status(result.isNewUser ? 201 : 200).json({
        success: true,
        message: result.isNewUser
          ? 'Account created successfully'
          : 'Sign in successful',
        data: {
          user: result.user,
          tokens: result.tokens,
          isNewUser: result.isNewUser,
        },
      });
    } catch (error: unknown) {
      // Log the error but sanitize sensitive information
      logger.error('Google sign-in failed:', {
        error: error.message,
        platform: req.body.platform,
      });

      // Re-throw API errors
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle specific Google Auth errors
      if (error.message?.includes('Invalid Google')) {
        throw new ApiError(401, 'Invalid Google authentication');
      }

      if (error.message?.includes('User already exists')) {
        throw new ApiError(409, 'An account with this email already exists');
      }

      // Generic error
      throw new ApiError(500, 'Authentication failed. Please try again.');
    }
  })
);

/**
 * @route   POST /api/v2/auth/google/refresh
 * @desc    Refresh JWT tokens
 * @access  Public
 * @body    { refreshToken: string }
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      // Refresh the tokens
      const newTokens = await googleAuthService.refreshToken(refreshToken);

      logger.info('Tokens refreshed successfully');

      res.json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          tokens: newTokens,
        },
      });
    } catch (error: unknown) {
      logger.error('Token refresh failed:', {
        error: error.message,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(401, 'Failed to refresh tokens');
    }
  })
);

/**
 * @route   GET /api/v2/auth/session
 * @desc    Validate current session
 * @access  Protected
 */
router.get(
  '/session',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Validate the session
      const sessionInfo = await googleAuthService.validateSession(userId);

      if (!sessionInfo.valid) {
        throw new ApiError(401, 'Invalid session');
      }

      res.json({
        success: true,
        message: 'Session is valid',
        data: {
          user: sessionInfo.user,
        },
      });
    } catch (error: unknown) {
      logger.error('Session validation failed:', {
        error: error.message,
        userId: req.user?.id,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(401, 'Session validation failed');
    }
  })
);

/**
 * @route   POST /api/v2/auth/google/revoke
 * @desc    Revoke all tokens for the user
 * @access  Protected
 */
router.post(
  '/revoke',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Revoke all tokens
      await googleAuthService.revokeAllTokens(userId);

      logger.info('All tokens revoked for user:', { userId });

      res.json({
        success: true,
        message: 'All tokens have been revoked successfully',
      });
    } catch (error: unknown) {
      logger.error('Token revocation failed:', {
        error: error.message,
        userId: req.user?.id,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Failed to revoke tokens');
    }
  })
);

/**
 * @route   POST /api/v2/auth/google/link
 * @desc    Link Google account to existing user
 * @access  Protected
 * @body    { idToken: string }
 */
router.post(
  '/link',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { idToken } = z
        .object({
          idToken: z.string().min(1, 'Google ID token is required'),
        })
        .parse(req.body);

      // Verify the Google token
      const googleUser = await googleAuthService.verifyIdToken(idToken);

      // Check if this Google account is already linked to another user
      const existingUser = await googleAuthService['findUserByGoogleId'](
        googleUser.sub
      );

      if (existingUser && existingUser.id !== userId) {
        throw new ApiError(
          409,
          'This Google account is already linked to another user'
        );
      }

      // Link the Google account
      await googleAuthService['linkGoogleAccount'](userId, googleUser);

      logger.info('Google account linked successfully:', {
        userId,
        googleId: googleUser.sub,
      });

      res.json({
        success: true,
        message: 'Google account linked successfully',
        data: {
          googleEmail: googleUser.email,
          googleName: googleUser.name,
        },
      });
    } catch (error: unknown) {
      logger.error('Google account linking failed:', {
        error: error.message,
        userId: req.user?.id,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Failed to link Google account');
    }
  })
);

/**
 * @route   DELETE /api/v2/auth/google/unlink
 * @desc    Unlink Google account from user
 * @access  Protected
 */
router.delete(
  '/unlink',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Check if user has alternative authentication method
      const { db } = await import('../../../services/database');
      const result = await db.query(
        'SELECT password_hash, auth_provider FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new ApiError(404, 'User not found');
      }

      const user = result.rows[0];

      // Prevent unlinking if Google is the only auth method
      if (!user.password_hash && user.auth_provider === 'google') {
        throw new ApiError(
          400,
          'Cannot unlink Google account. Please set a password first.'
        );
      }

      // Unlink Google account
      await db.query(
        `UPDATE users 
         SET google_id = NULL, 
             google_email = NULL,
             auth_provider = CASE 
               WHEN password_hash IS NOT NULL THEN 'email'
               ELSE auth_provider 
             END,
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );

      logger.info('Google account unlinked successfully:', { userId });

      res.json({
        success: true,
        message: 'Google account unlinked successfully',
      });
    } catch (error: unknown) {
      logger.error('Google account unlinking failed:', {
        error: error.message,
        userId: req.user?.id,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Failed to unlink Google account');
    }
  })
);

/**
 * @route   GET /api/v2/auth/google/status
 * @desc    Check Google account link status
 * @access  Protected
 */
router.get(
  '/status',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const { db } = await import('../../../services/database');
      const result = await db.query(
        'SELECT google_id, google_email, auth_provider FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new ApiError(404, 'User not found');
      }

      const user = result.rows[0];
      const isLinked = !!user.google_id;

      res.json({
        success: true,
        data: {
          isLinked,
          googleEmail: user.google_email,
          authProvider: user.auth_provider,
        },
      });
    } catch (error: unknown) {
      logger.error('Failed to get Google account status:', {
        error: error.message,
        userId: req.user?.id,
      });

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Failed to get Google account status');
    }
  })
);

export default router;