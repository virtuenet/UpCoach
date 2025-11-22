import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimiter';
import { generateTokens } from '../middleware/auth';
import { googleAuthService } from '../services/auth/GoogleAuthService';
import { UserService } from '../services/userService';
import { redis } from '../services/redis';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

const router = Router();

// Security middleware for Google OAuth endpoints
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Validation schemas
const googleSignInSchema = z.object({
  id_token: z.string().min(1, 'Google ID token is required'),
  access_token: z.string().optional(),
  client_info: z.object({
    platform: z.enum(['ios', 'android', 'web']).optional(),
    app_version: z.string().optional(),
    device_id: z.string().optional(),
  }).optional(),
});

const googleRefreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

/**
 * Google Sign-In endpoint for mobile and web
 * POST /api/v2/auth/google/signin
 */
router.post(
  '/signin',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = googleSignInSchema.parse(req.body);
    const { id_token, access_token, client_info } = validatedData;

    logger.info('Google Sign-In attempt', { 
      platform: client_info?.platform,
      hasAccessToken: !!access_token 
    });

    try {
      // Verify Google token and get user info
      const googleUserInfo = await googleAuthService.getUserInfo({
        idToken: id_token,
        accessToken: access_token,
      });

      if (!googleUserInfo.email || !googleUserInfo.email_verified) {
        throw new ApiError(401, 'Google account email must be verified');
      }

      // Check if user exists by email
      let user = await UserService.findByEmail(googleUserInfo.email);
      let isNewUser = false;

      if (!user) {
        // Create new user from Google data
        isNewUser = true;
        user = await UserService.createFromGoogle({
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          googleId: googleUserInfo.sub,
          avatarUrl: googleUserInfo.picture,
          isEmailVerified: googleUserInfo.email_verified,
        });

        logger.info('New user created via Google Sign-In', { 
          userId: user.id, 
          email: user.email 
        });
      } else {
        // Update existing user with Google data if needed
        const updates: unknown = {};
        let shouldUpdate = false;

        // Link Google ID if not already linked
        if (!(user as unknown).googleId && googleUserInfo.sub) {
          updates.google_id = googleUserInfo.sub;
          updates.auth_provider = 'google';
          shouldUpdate = true;
        }

        // Update profile picture if user doesn't have one
        if (!user.avatarUrl && googleUserInfo.picture) {
          updates.avatar_url = googleUserInfo.picture;
          shouldUpdate = true;
        }

        // Update email verification status
        if (!user.isEmailVerified && googleUserInfo.email_verified) {
          updates.is_email_verified = true;
          shouldUpdate = true;
        }

        // Update provider sync timestamp
        updates.last_provider_sync = new Date();
        updates.provider_data = {
          google: {
            sub: googleUserInfo.sub,
            locale: googleUserInfo.locale,
            picture: googleUserInfo.picture,
            verified_email: googleUserInfo.email_verified,
          }
        };
        shouldUpdate = true;

        if (shouldUpdate) {
          await UserService.update(user.id as string, updates);
          logger.info('User updated with Google data', { userId: user.id });
        }
      }

      // Check if user account is active
      if (!user.isActive) {
        throw new ApiError(401, 'Account is deactivated');
      }

      // Generate JWT tokens
      const tokens = generateTokens(user.id, user.email, user.role, req);

      // Store refresh token in Redis with 30-day expiry
      await redis.setEx(
        `refresh_token:${user.id}`, 
        30 * 24 * 60 * 60, 
        tokens.refreshToken
      );

      // Store Google sign-in session for audit
      await redis.setEx(
        `google_session:${user.id}:${googleUserInfo.sub}`,
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify({
          signInTime: new Date(),
          platform: client_info?.platform,
          deviceId: client_info?.device_id,
          ipAddress: req.ip,
        })
      );

      // Update last login
      await UserService.updateLastLogin(user.id);

      // Security logging
      logger.info('Google Sign-In successful', { 
        userId: user.id, 
        email: user.email,
        isNewUser,
        platform: client_info?.platform,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        googleSub: googleUserInfo.sub,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: isNewUser ? 'Account created and signed in successfully' : 'Signed in successfully',
        data: {
          user: UserService.toResponseDto(user),
          tokens,
          isNewUser,
          authProvider: 'google',
        },
      });

    } catch (error) {
      logger.error('Google Sign-In error:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(401, 'Google Sign-In failed');
    }
  })
);

/**
 * Google token refresh endpoint
 * POST /api/v2/auth/google/refresh
 */
router.post(
  '/refresh',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = googleRefreshSchema.parse(req.body);

    try {
      // Verify refresh token (reuse existing logic from main auth)
      const { verifyRefreshToken } = await import('../middleware/auth');
      const { userId } = verifyRefreshToken(refresh_token);

      // Check if refresh token exists in Redis
      const storedToken = await redis.get(`refresh_token:${userId}`);
      if (!storedToken || storedToken !== refresh_token) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      // Check if user still exists and is active
      const user = await UserService.findById(userId);
      if (!user || !user.isActive) {
        throw new ApiError(401, 'User not found or deactivated');
      }

      // Generate new tokens
      const newTokens = generateTokens(userId, user.email, user.role, req);

      // Update refresh token in Redis
      await redis.setEx(
        `refresh_token:${userId}`, 
        30 * 24 * 60 * 60, 
        newTokens.refreshToken
      );

      // Blacklist old refresh token
      const { blacklistToken } = await import('../middleware/auth');
      await blacklistToken(refresh_token);

      logger.info('Google tokens refreshed successfully', { userId });

      res.json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          tokens: newTokens,
        },
      });

    } catch (error) {
      logger.error('Google token refresh error:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(401, 'Token refresh failed');
    }
  })
);

/**
 * Google account linking endpoint for existing users
 * POST /api/v2/auth/google/link
 */
router.post(
  '/link',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id_token } = z.object({
      id_token: z.string().min(1, 'Google ID token is required'),
    }).parse(req.body);

    // Get authenticated user from JWT middleware
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    try {
      // Verify Google token
      const googleUserInfo = await googleAuthService.getUserInfo({
        idToken: id_token,
      });

      if (!googleUserInfo.email || !googleUserInfo.email_verified) {
        throw new ApiError(400, 'Google account email must be verified');
      }

      // Get current user
      const currentUser = await UserService.findById(userId);
      if (!currentUser) {
        throw new ApiError(404, 'User not found');
      }

      // Check if Google account is already linked to another user
      const existingGoogleUser = await UserService.findByGoogleId(googleUserInfo.sub);
      if (existingGoogleUser && existingGoogleUser.id !== userId) {
        throw new ApiError(409, 'Google account is already linked to another user');
      }

      // Check if email matches current user
      if (googleUserInfo.email !== currentUser.email) {
        throw new ApiError(400, 'Google account email must match your current account email');
      }

      // Link Google account to current user
      const updateData = {
        google_id: googleUserInfo.sub,
        auth_provider: currentUser.authProvider === 'email' ? 'google' : currentUser.authProvider,
        provider_data: {
          ...((currentUser as unknown).providerData || {}),
          google: {
            sub: googleUserInfo.sub,
            email: googleUserInfo.email,
            name: googleUserInfo.name,
            picture: googleUserInfo.picture,
            locale: googleUserInfo.locale,
            verified_email: googleUserInfo.email_verified,
            linked_at: new Date(),
          }
        },
        last_provider_sync: new Date(),
      };

      // Update avatar if user doesn't have one
      if (!currentUser.avatarUrl && googleUserInfo.picture) {
        (updateData as unknown).avatar_url = googleUserInfo.picture;
      }

      await UserService.update(userId, updateData);

      // Log security event
      logger.info('Google account linked successfully', {
        userId,
        email: currentUser.email,
        googleSub: googleUserInfo.sub,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Google account linked successfully',
        data: {
          googleEmail: googleUserInfo.email,
          linkedAt: new Date(),
        },
      });

    } catch (error) {
      logger.error('Google account linking error:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Failed to link Google account');
    }
  })
);

/**
 * Google account unlinking endpoint
 * POST /api/v2/auth/google/unlink
 */
router.post(
  '/unlink',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    // Get authenticated user from JWT middleware
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    try {
      // Get current user
      const currentUser = await UserService.findById(userId);
      if (!currentUser) {
        throw new ApiError(404, 'User not found');
      }

      // Check if user has Google account linked
      if (!(currentUser as unknown).googleId) {
        throw new ApiError(400, 'No Google account is currently linked');
      }

      // Check if this is the only authentication method
      const hasPassword = !!(currentUser as unknown).passwordHash;
      const hasOtherProviders = currentUser.authProvider &&
        currentUser.authProvider !== 'google' &&
        currentUser.authProvider !== 'email';

      if (!hasPassword && !hasOtherProviders) {
        throw new ApiError(400, 'Cannot unlink Google account as it is your only authentication method. Please set a password first.');
      }

      // Prepare update data to remove Google linking
      const updateData = {
        google_id: null,
        auth_provider: hasPassword ? 'email' : currentUser.authProvider,
        provider_data: {
          ...((currentUser as unknown).providerData || {}),
        },
        last_provider_sync: new Date(),
      };

      // Remove Google data from provider_data
      if (updateData.provider_data.google) {
        delete updateData.provider_data.google;
      }

      await UserService.update(userId, updateData);

      // Invalidate all Google-related sessions in Redis
      const googleSessionPattern = `google_session:${userId}:*`;
      const keys = await redis.keys(googleSessionPattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }

      // Log security event
      logger.info('Google account unlinked successfully', {
        userId,
        email: currentUser.email,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Google account unlinked successfully',
        data: {
          unlinkedAt: new Date(),
          remainingAuthMethods: {
            password: hasPassword,
            otherProviders: !!hasOtherProviders,
          },
        },
      });

    } catch (error) {
      logger.error('Google account unlinking error:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Failed to unlink Google account');
    }
  })
);

export default router;