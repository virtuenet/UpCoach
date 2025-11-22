import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../../middleware/errorHandler';
import { authLimiter } from '../../middleware/rateLimiter';
import { googleAuthService } from '../../services/auth/GoogleAuthService';
import { UserService } from '../../services/userService';
import { redis } from '../../services/redis';
import { generateTokens } from '../../middleware/auth';
import { ApiError } from '../../utils/apiError';
import { logger } from '../../utils/logger';

const router = Router();

// Validation schemas
const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
  platform: z.enum(['web', 'mobile']).optional().default('web'),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
    platform: z.string().optional(),
    appVersion: z.string().optional(),
  }).optional(),
});

const googleCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
});

/**
 * Google OAuth login/signup endpoint
 * POST /auth/google
 */
router.post(
  '/',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = googleAuthSchema.parse(req.body);

    try {
      // Process Google sign-in
      const result = await googleAuthService.signIn(
        validatedData.idToken,
        validatedData.platform,
        validatedData.deviceInfo
      );

      // Log successful authentication
      logger.info('Google authentication successful', {
        userId: result.user.id,
        email: result.user.email,
        isNewUser: result.isNewUser,
        platform: validatedData.platform,
      });

      // Return success response
      res.json({
        success: true,
        message: result.isNewUser ? 'Account created successfully' : 'Login successful',
        data: {
          user: result.user,
          tokens: result.tokens,
          isNewUser: result.isNewUser,
        },
      });
    } catch (error) {
      logger.error('Google authentication failed:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Google authentication failed');
    }
  })
);

/**
 * Google OAuth callback endpoint (for web OAuth flow)
 * GET /auth/google/callback
 */
router.get(
  '/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    // Handle OAuth errors
    if (error) {
      logger.error('Google OAuth error:', error);
      return res.redirect(`${process.env.SITE_URL}/auth/error?message=${encodeURIComponent(String(error))}`);
    }

    // Validate required parameters
    if (!code || !state) {
      return res.redirect(`${process.env.SITE_URL}/auth/error?message=Missing+required+parameters`);
    }

    try {
      // Validate OAuth state
      const { valid, nonce } = await googleAuthService.validateOAuthState(
        String(state),
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_REDIRECT_URI!
      );

      if (!valid) {
        throw new ApiError(400, 'Invalid OAuth state');
      }

      // Exchange authorization code for tokens
      // Note: This would require implementing the OAuth2 code exchange flow
      // For now, we'll redirect to the frontend with the code
      const redirectUrl = new URL(`${process.env.SITE_URL}/auth/google/success`);
      redirectUrl.searchParams.set('code', String(code));
      redirectUrl.searchParams.set('state', String(state));
      if (nonce) {
        redirectUrl.searchParams.set('nonce', nonce);
      }

      res.redirect(redirectUrl.toString());
    } catch (error) {
      logger.error('Google OAuth callback error:', error);

      const errorMessage = error instanceof ApiError ? error.message : 'Authentication failed';
      res.redirect(`${process.env.SITE_URL}/auth/error?message=${encodeURIComponent(errorMessage)}`);
    }
  })
);

/**
 * Generate OAuth URL endpoint
 * GET /auth/google/url
 */
router.get(
  '/url',
  asyncHandler(async (req: Request, res: Response) => {
    const { redirect_uri } = req.query;

    try {
      // Generate OAuth state for CSRF protection
      const oauthState = await googleAuthService.generateOAuthState(
        process.env.GOOGLE_CLIENT_ID!,
        redirect_uri as string || process.env.GOOGLE_REDIRECT_URI!
      );

      // Generate PKCE parameters for enhanced security
      const pkce = googleAuthService.generatePKCE();

      // Store PKCE verifier in Redis with state
      await redis.setEx(
        `pkce:${oauthState.state}`,
        600, // 10 minutes
        JSON.stringify({
          codeVerifier: pkce.codeVerifier,
          redirectUri: redirect_uri || process.env.GOOGLE_REDIRECT_URI,
        })
      );

      // Build OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
      authUrl.searchParams.set('redirect_uri', redirect_uri as string || process.env.GOOGLE_REDIRECT_URI!);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', oauthState.state);
      authUrl.searchParams.set('nonce', oauthState.nonce);
      authUrl.searchParams.set('code_challenge', pkce.codeChallenge);
      authUrl.searchParams.set('code_challenge_method', pkce.codeChallengeMethod);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      res.json({
        success: true,
        data: {
          authUrl: authUrl.toString(),
          state: oauthState.state,
        },
      });
    } catch (error) {
      logger.error('Failed to generate OAuth URL:', error);
      throw new ApiError(500, 'Failed to generate authentication URL');
    }
  })
);

/**
 * Refresh token endpoint
 * POST /auth/google/refresh
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    try {
      // Refresh the access token
      const newTokens = await googleAuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: newTokens,
        },
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(401, 'Failed to refresh token');
    }
  })
);

/**
 * Validate session endpoint
 * GET /auth/google/validate
 */
router.get(
  '/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No authentication token provided');
    }

    const token = authHeader.substring(7);

    try {
      // Decode the JWT to get user ID
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token) as unknown;

      if (!decoded || !decoded.id) {
        throw new ApiError(401, 'Invalid token');
      }

      // Validate the session
      const sessionInfo = await googleAuthService.validateSession(decoded.id);

      if (!sessionInfo.valid) {
        throw new ApiError(401, 'Session is invalid or expired');
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user: sessionInfo.user,
        },
      });
    } catch (error) {
      logger.error('Session validation failed:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(401, 'Invalid session');
    }
  })
);

/**
 * Revoke tokens endpoint
 * POST /auth/google/revoke
 */
router.post(
  '/revoke',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No authentication token provided');
    }

    const token = authHeader.substring(7);

    try {
      // Decode the JWT to get user ID
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token) as unknown;

      if (!decoded || !decoded.id) {
        throw new ApiError(401, 'Invalid token');
      }

      // Revoke all tokens for the user
      await googleAuthService.revokeAllTokens(decoded.id);

      res.json({
        success: true,
        message: 'All tokens have been revoked',
      });
    } catch (error) {
      logger.error('Token revocation failed:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(500, 'Failed to revoke tokens');
    }
  })
);

export default router;