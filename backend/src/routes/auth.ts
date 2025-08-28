import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/apiError';
import { UserService } from '../services/userService';
import { 
  generateTokens, 
  verifyRefreshToken, 
  blacklistToken,
  authMiddleware 
} from '../middleware/auth';
import { redis } from '../services/redis';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { emailService } from '../services/email/UnifiedEmailService';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
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

// Register endpoint
router.post('/register', authLimiter, asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);

  // Validate password strength
  const passwordValidation = UserService.validatePasswordStrength(validatedData.password);
  if (!passwordValidation.isValid) {
    throw new ApiError(400, 'Password does not meet security requirements', {
      errors: passwordValidation.errors,
    });
  }

  // Create user
  const user = await UserService.create({
    email: validatedData.email,
    password: validatedData.password,
    name: validatedData.name,
    bio: validatedData.bio,
  });

  // Generate tokens
  const tokens = generateTokens(user.id);

  // Store refresh token in Redis
  await redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);

  // Update last login
  await UserService.updateLastLogin(user.id);

  logger.info('User registered successfully:', { userId: user.id, email: user.email });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: UserService.toResponseDto(user),
      tokens,
    },
  });
}));

// Login endpoint
router.post('/login', authLimiter, asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);

  // Verify user credentials
  const user = await UserService.verifyPassword(validatedData.email, validatedData.password);
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(401, 'Account is deactivated');
  }

  // Generate tokens
  const tokens = generateTokens(user.id);

  // Store refresh token in Redis with 30-day expiry
  await redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);

  // Update last login
  await UserService.updateLastLogin(user.id);

  logger.info('User logged in successfully:', { userId: user.id, email: user.email });

  (res as any).json({
    success: true,
    message: 'Login successful',
    data: {
      user: UserService.toResponseDto(user),
      tokens,
    },
  });
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);

  // Verify refresh token
  const { userId } = verifyRefreshToken(refreshToken);

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
  const newTokens = generateTokens(userId);

  // Update refresh token in Redis
  await redis.setEx(`refresh_token:${userId}`, 30 * 24 * 60 * 60, newTokens.refreshToken);

  // Blacklist old refresh token (if it's a JWT, which it is in our case)
  await blacklistToken(refreshToken);

  logger.info('Tokens refreshed successfully:', { userId });

  (res as any).json({
    success: true,
    message: 'Tokens refreshed successfully',
    data: {
      tokens: newTokens,
    },
  });
}));

// Logout endpoint
router.post('/logout', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = (req as any).user!.id;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const accessToken = authHeader.substring(7);
    
    // Blacklist the access token
    await blacklistToken(accessToken);
  }

  // Remove refresh token from Redis
  await redis.del(`refresh_token:${userId}`);

  logger.info('User logged out successfully:', { userId });

  (res as any).json({
    success: true,
    message: 'Logout successful',
  });
}));

// Change password endpoint
router.post('/change-password', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = (req as any).user!.id;
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

  (res as any).json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
  });
}));

// Verify token endpoint (for client-side token validation)
router.get('/verify', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await UserService.findById((req as any).user!.id);
  
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  (res as any).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: UserService.toResponseDto(user),
    },
  });
}));

// Get current user profile (alternative to /users/profile)
router.get('/profile', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = (req as any).user!.id;
  const userProfile = await UserService.getProfile(userId);
  
  if (!userProfile) {
    throw new ApiError(404, 'User profile not found');
  }

  (res as any).json({
    success: true,
    data: {
      user: userProfile,
    },
  });
}));

// Logout from all devices
router.post('/logout-all', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = (req as any).user!.id;

  // Remove all refresh tokens for this user
  await redis.del(`refresh_token:${userId}`);

  // Note: In a more sophisticated system, you might want to blacklist all active access tokens
  // For now, we'll just remove the refresh token which will prevent new access tokens

  logger.info('User logged out from all devices:', { userId });

  (res as any).json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
}));

// Forgot password endpoint
router.post('/forgot-password', passwordResetLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  // Check if user exists
  const user = await UserService.findByEmail(email);
  
  // Always return success to prevent email enumeration
  if (user) {
    // Generate reset token
    const resetToken = await UserService.generatePasswordResetToken(Number(user.id));
    
    // Send reset email
    await emailService.sendPasswordResetEmail(user as any, resetToken);
    
    logger.info('Password reset requested:', { userId: user.id, email: user.email });
  }

  (res as any).json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
}));

// Reset password endpoint
router.post('/reset-password', passwordResetLimiter, asyncHandler(async (req: Request, res: Response) => {
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

  (res as any).json({
    success: true,
    message: 'Password reset successfully. Please log in with your new password.',
  });
}));

// Google OAuth endpoint
router.post('/google', asyncHandler(async (req: Request, res: Response) => {
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
    if (!(user as any).googleId) {
      await UserService.updateGoogleId(parseInt(user.id as string), googleUser.sub);
    }
  }

  // Generate tokens
  const tokens = generateTokens(user.id);

  // Store refresh token in Redis
  await redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);

  // Update last login
  await UserService.updateLastLogin(user.id);

  logger.info('User logged in with Google:', { userId: user.id, email: user.email });

  (res as any).json({
    success: true,
    message: 'Login successful',
    data: {
      user: UserService.toResponseDto(user),
      tokens,
    },
  });
}));

export default router; 