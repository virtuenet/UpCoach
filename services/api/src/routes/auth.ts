import * as crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';

import {
  generateTokens,
  verifyRefreshToken,
  blacklistToken,
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { emailService } from '../services/email/UnifiedEmailService';
import { redis } from '../services/redis';
import { UserService } from '../services/userService';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { UserAttributes } from '../models/User';

const router = Router();

// Validation schemas
const registerSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters').optional(),
    firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    acceptTerms: z.boolean().optional(),
    bio: z.string().optional(),
  })
  .refine(data => !data.confirmPassword || data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 */
// Register endpoint
router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req: Request, _res: Response) => {
    console.error('[AUTH ROUTE] Register endpoint called');
    const validatedData = registerSchema.parse(req.body);
    console.error('[AUTH ROUTE] Data validated:', { email: validatedData.email });

    // Validate password strength
    const passwordValidation = UserService.validatePasswordStrength(validatedData.password);
    console.error('[AUTH ROUTE] Password validation:', passwordValidation);
    if (!passwordValidation.isValid) {
      throw new ApiError(400, 'Password does not meet security requirements', {
        errors: passwordValidation.errors,
      });
    }

    // Create user with combined name (handle both formats)
    const fullName =
      validatedData.name ||
      (validatedData.firstName && validatedData.lastName
        ? `${validatedData.firstName} ${validatedData.lastName}`
        : validatedData.firstName || validatedData.lastName || 'User');
    console.error('[AUTH ROUTE] About to create user:', { fullName, email: validatedData.email });
    const user = await UserService.create({
      email: validatedData.email,
      password: validatedData.password,
      name: fullName,
      bio: validatedData.bio,
    });
    console.error('[AUTH ROUTE] User created:', { id: user.id });

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role, req);

    // Store refresh token in Redis
    await redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);

    // Update last login
    await UserService.updateLastLogin(user.id);

    logger.info('User registered successfully:', { userId: user.id, email: user.email });

    // Return response matching test expectations
    _res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password, returns access and refresh tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCredentials:
 *                 value:
 *                   success: false
 *                   message: "Invalid email or password"
 *               accountDeactivated:
 *                 value:
 *                   success: false
 *                   message: "Account is deactivated"
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       423:
 *         description: Account locked due to too many failed attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 */
// Login endpoint
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req: Request, _res: Response) => {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await UserService.findByEmail(validatedData.email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new ApiError(
        423,
        'Account locked due to too many failed login attempts. Please try again later.'
      );
    }

    // Verify password
    const isValidPassword = await UserService.verifyPassword(
      validatedData.email,
      validatedData.password
    );
    if (!isValidPassword) {
      // Increment login attempts
      const attempts = (user.loginAttempts || 0) + 1;
      const updates: Partial<UserAttributes> = { loginAttempts: attempts };

      // Lock account after 5 failed attempts
      if (attempts >= 5) {
        updates.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }

      const { db } = await import('../services/database');
      await db.update('users', updates, { id: user.id });
      throw new ApiError(401, 'Invalid email or password');
    }

    // Reset login attempts on successful login
    if (user.loginAttempts && user.loginAttempts > 0) {
      const { db } = await import('../services/database');
      await db.update('users', { loginAttempts: 0, lockUntil: null }, { id: user.id });
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Account is deactivated');
    }

    // Skip email verification in test environment
    if (process.env.NODE_ENV !== 'test' && !user.emailVerified) {
      throw new ApiError(403, 'Please verify your email before logging in');
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role, req);

    // Store refresh token in Redis with 30-day expiry
    await redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);

    // Update last login
    await UserService.updateLastLogin(user.id);

    logger.info('User logged in successfully:', { userId: user.id, email: user.email });

    _res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Exchanges a valid refresh token for a new access/refresh token pair.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token issued during login.
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Refresh token endpoint
router.post(
  '/refresh',
  asyncHandler(async (req: Request, _res: Response) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    let userId: string;
    try {
      const decoded = verifyRefreshToken(refreshToken);
      userId = decoded.userId;
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Check if refresh token exists in Redis
    const storedToken = await redis.get(`refresh_token:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
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
    await redis.setEx(`refresh_token:${userId}`, 30 * 24 * 60 * 60, newTokens.refreshToken);

    // Blacklist old refresh token (if it's a JWT, which it is in our case)
    await blacklistToken(refreshToken);

    logger.info('Tokens refreshed successfully:', { userId });

    _res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        tokens: newTokens,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current session
 *     description: Invalidates the current access token and removes the refresh token from Redis.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Logout endpoint
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);

      // Blacklist the access token
      await blacklistToken(accessToken);
    }

    // Remove refresh token from Redis
    await redis.del(`refresh_token:${userId}`);

    logger.info('User logged out successfully:', { userId });

    _res.json({
      success: true,
      message: 'Logout successful',
    });
  })
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Allows an authenticated user to change their password after validating the current password.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 description: Must meet password strength requirements.
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Change password endpoint
router.post(
  '/change-password',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const validatedData = changePasswordSchema.parse(req.body);

    // Validate new password strength
    const passwordValidation = UserService.validatePasswordStrength(validatedData.newPassword);
    if (!passwordValidation.isValid) {
      throw new ApiError(400, 'New password does not meet security requirements', {
        errors: passwordValidation.errors,
      });
    }

    // Update password
    await UserService.updatePassword(
      userId,
      validatedData.currentPassword,
      validatedData.newPassword
    );

    // Invalidate all existing sessions for security
    await redis.del(`refresh_token:${userId}`);

    logger.info('Password changed successfully:', { userId });

    _res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  })
);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify current access token
 *     description: Confirms that the provided bearer token is valid and returns the associated user profile.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Verify token endpoint (for client-side token validation)
router.get(
  '/verify',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const user = await UserService.findById(req.user!.id);

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    _res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: UserService.toResponseDto(user),
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile (auth shortcut)
 *     description: Returns the authenticated user's profile using the auth token context.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Get current user profile (alternative to /users/profile)
router.get(
  '/profile',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;
    const userProfile = await UserService.getProfile(userId);

    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }

    _res.json({
      success: true,
      data: {
        user: userProfile,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     description: Removes all refresh tokens for the authenticated user, forcing re-authentication everywhere.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout from all devices successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Logout from all devices
router.post(
  '/logout-all',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, _res: Response) => {
    const userId = req.user!.id;

    // Remove all refresh tokens for this user
    await redis.del(`refresh_token:${userId}`);

    // Note: In a more sophisticated system, you might want to blacklist all active access tokens
    // For now, we'll just remove the refresh token which will prevent new access tokens

    logger.info('User logged out from all devices:', { userId });

    _res.json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  })
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset email if the account exists. Always returns success to prevent enumeration.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email dispatched (or silently ignored)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 */
// Forgot password endpoint
router.post(
  '/forgot-password',
  passwordResetLimiter,
  asyncHandler(async (req: Request, _res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Check if user exists
    const user = await UserService.findByEmail(email);

    // Always return success to prevent email enumeration
    if (user) {
      // Generate reset token
      const resetToken = await UserService.generatePasswordResetToken(Number(user.id));

      // Send reset email
      await emailService.sendPasswordResetEmail(user as unknown, resetToken);

      logger.info('Password reset requested:', { userId: user.id, email: user.email });
    }

    _res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  })
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Resets the password using a valid password reset token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 description: Must satisfy security policy.
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitExceeded'
 */
// Reset password endpoint
router.post(
  '/reset-password',
  passwordResetLimiter,
  asyncHandler(async (req: Request, _res: Response) => {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    // Validate password strength
    const passwordValidation = UserService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new ApiError(400, 'Password does not meet security requirements', {
        errors: passwordValidation.errors,
      });
    }

    // Reset password
    const userId = await UserService.resetPasswordWithToken(token, newPassword);

    // Invalidate all existing sessions
    await redis.del(`refresh_token:${userId}`);

    logger.info('Password reset successfully:', { userId });

    _res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  })
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email address
 *     description: Validates an email verification token and activates the user account.
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token sent to the user.
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// Email verification endpoint
router.get(
  '/verify-email',
  asyncHandler(async (req: Request, _res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new ApiError(400, 'Invalid token');
    }

    // Find user with this verification token
    const { User } = await import('../models/User');
    const user = await User.findOne({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid token');
    }

    // Check if token is expired
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      throw new ApiError(400, 'Verification token has expired');
    }

    // Update user as verified
    await user.update({
      emailVerified: true,
      isActive: true,
      verificationToken: null,
      verificationTokenExpires: null,
    });

    logger.info('Email verified successfully:', { userId: user.id });

    _res.json({
      success: true,
      message: 'Email verified successfully',
    });
  })
);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend email verification link
 *     description: Generates a new verification token and emails it to the user if the account is not yet verified.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent (idempotent)
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// Resend verification email
router.post(
  '/resend-verification',
  asyncHandler(async (req: Request, _res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, 'Email is required');
    }

    const user = await UserService.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists
      _res.json({
        success: true,
        message: 'Verification email sent',
      });
      return;
    }

    if (user.emailVerified) {
      throw new ApiError(400, 'Email already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await user.update({
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email
    await emailService.send(
      user.email,
      'Verify Your Email',
      `Please verify your email by clicking: ${process.env.FRONTEND_URL}/verify?token=${verificationToken}`,
      `<p>Please verify your email by clicking the link below:</p><a href="${process.env.FRONTEND_URL}/verify?token=${verificationToken}">Verify Email</a>`
    );

    logger.info('Verification email resent:', { userId: user.id });

    _res.json({
      success: true,
      message: 'Verification email sent',
    });
  })
);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Sign in with Google
 *     description: Verifies a Google ID token and returns UpCoach auth tokens.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token obtained from the client SDK.
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// Google OAuth endpoint
router.post(
  '/google',
  asyncHandler(async (req: Request, _res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      throw new ApiError(400, 'Google ID token is required');
    }

    // Verify Google token and get user info
    const googleUser = await UserService.verifyGoogleToken(idToken);

    // Find or create user
    let user = await UserService.findByEmail(googleUser.email);

    if (!user) {
      // Create new user from Google data
      user = await UserService.createFromGoogle({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.sub,
        avatarUrl: googleUser.picture,
        isEmailVerified: googleUser.email_verified,
      });
    } else {
      // Update Google ID if not set
      if (!(user as unknown).googleId) {
        await UserService.updateGoogleId(parseInt(user.id as string), googleUser.sub);
      }
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role, req);

    // Store refresh token in Redis
    await redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);

    // Update last login
    await UserService.updateLastLogin(user.id);

    logger.info('User logged in with Google:', { userId: user.id, email: user.email });

    _res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: UserService.toResponseDto(user),
        tokens,
      },
    });
  })
);

export default router;
