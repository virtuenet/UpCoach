"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const apiError_1 = require("../utils/apiError");
const userService_1 = require("../services/userService");
const auth_1 = require("../middleware/auth");
const redis_1 = require("../services/redis");
const logger_1 = require("../utils/logger");
const UnifiedEmailService_1 = require("../services/email/UnifiedEmailService");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Validation schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    bio: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
// Register endpoint
router.post('/register', rateLimiter_1.authLimiter, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const validatedData = registerSchema.parse(req.body);
    // Validate password strength
    const passwordValidation = userService_1.UserService.validatePasswordStrength(validatedData.password);
    if (!passwordValidation.isValid) {
        throw new apiError_1.ApiError(400, 'Password does not meet security requirements', {
            errors: passwordValidation.errors,
        });
    }
    // Create user
    const user = await userService_1.UserService.create({
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name,
        bio: validatedData.bio,
    });
    // Generate tokens
    const tokens = (0, auth_1.generateTokens)(user.id);
    // Store refresh token in Redis
    await redis_1.redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);
    // Update last login
    await userService_1.UserService.updateLastLogin(user.id);
    logger_1.logger.info('User registered successfully:', { userId: user.id, email: user.email });
    _res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: userService_1.UserService.toResponseDto(user),
            tokens,
        },
    });
}));
// Login endpoint
router.post('/login', rateLimiter_1.authLimiter, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const validatedData = loginSchema.parse(req.body);
    // Verify user credentials
    const user = await userService_1.UserService.verifyPassword(validatedData.email, validatedData.password);
    if (!user) {
        throw new apiError_1.ApiError(401, 'Invalid email or password');
    }
    if (!user.isActive) {
        throw new apiError_1.ApiError(401, 'Account is deactivated');
    }
    // Generate tokens
    const tokens = (0, auth_1.generateTokens)(user.id);
    // Store refresh token in Redis with 30-day expiry
    await redis_1.redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);
    // Update last login
    await userService_1.UserService.updateLastLogin(user.id);
    logger_1.logger.info('User logged in successfully:', { userId: user.id, email: user.email });
    _res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: userService_1.UserService.toResponseDto(user),
            tokens,
        },
    });
}));
// Refresh token endpoint
router.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    // Verify refresh token
    const { userId } = (0, auth_1.verifyRefreshToken)(refreshToken);
    // Check if refresh token exists in Redis
    const storedToken = await redis_1.redis.get(`refresh_token:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
        throw new apiError_1.ApiError(401, 'Invalid refresh token');
    }
    // Check if user still exists and is active
    const user = await userService_1.UserService.findById(userId);
    if (!user || !user.isActive) {
        throw new apiError_1.ApiError(401, 'User not found or deactivated');
    }
    // Generate new tokens
    const newTokens = (0, auth_1.generateTokens)(userId);
    // Update refresh token in Redis
    await redis_1.redis.setEx(`refresh_token:${userId}`, 30 * 24 * 60 * 60, newTokens.refreshToken);
    // Blacklist old refresh token (if it's a JWT, which it is in our case)
    await (0, auth_1.blacklistToken)(refreshToken);
    logger_1.logger.info('Tokens refreshed successfully:', { userId });
    _res.json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
            tokens: newTokens,
        },
    });
}));
// Logout endpoint
router.post('/logout', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.substring(7);
        // Blacklist the access token
        await (0, auth_1.blacklistToken)(accessToken);
    }
    // Remove refresh token from Redis
    await redis_1.redis.del(`refresh_token:${userId}`);
    logger_1.logger.info('User logged out successfully:', { userId });
    _res.json({
        success: true,
        message: 'Logout successful',
    });
}));
// Change password endpoint
router.post('/change-password', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const validatedData = changePasswordSchema.parse(req.body);
    // Validate new password strength
    const passwordValidation = userService_1.UserService.validatePasswordStrength(validatedData.newPassword);
    if (!passwordValidation.isValid) {
        throw new apiError_1.ApiError(400, 'New password does not meet security requirements', {
            errors: passwordValidation.errors,
        });
    }
    // Update password
    await userService_1.UserService.updatePassword(userId, validatedData.currentPassword, validatedData.newPassword);
    // Invalidate all existing sessions for security
    await redis_1.redis.del(`refresh_token:${userId}`);
    logger_1.logger.info('Password changed successfully:', { userId });
    _res.json({
        success: true,
        message: 'Password changed successfully. Please log in again.',
    });
}));
// Verify token endpoint (for client-side token validation)
router.get('/verify', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const user = await userService_1.UserService.findById(req.user.id);
    if (!user) {
        throw new apiError_1.ApiError(401, 'User not found');
    }
    _res.json({
        success: true,
        message: 'Token is valid',
        data: {
            user: userService_1.UserService.toResponseDto(user),
        },
    });
}));
// Get current user profile (alternative to /users/profile)
router.get('/profile', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const userProfile = await userService_1.UserService.getProfile(userId);
    if (!userProfile) {
        throw new apiError_1.ApiError(404, 'User profile not found');
    }
    _res.json({
        success: true,
        data: {
            user: userProfile,
        },
    });
}));
// Logout from all devices
router.post('/logout-all', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    // Remove all refresh tokens for this user
    await redis_1.redis.del(`refresh_token:${userId}`);
    // Note: In a more sophisticated system, you might want to blacklist all active access tokens
    // For now, we'll just remove the refresh token which will prevent new access tokens
    logger_1.logger.info('User logged out from all devices:', { userId });
    _res.json({
        success: true,
        message: 'Logged out from all devices successfully',
    });
}));
// Forgot password endpoint
router.post('/forgot-password', rateLimiter_1.passwordResetLimiter, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    // Check if user exists
    const user = await userService_1.UserService.findByEmail(email);
    // Always return success to prevent email enumeration
    if (user) {
        // Generate reset token
        const resetToken = await userService_1.UserService.generatePasswordResetToken(Number(user.id));
        // Send reset email
        await UnifiedEmailService_1.emailService.sendPasswordResetEmail(user, resetToken);
        logger_1.logger.info('Password reset requested:', { userId: user.id, email: user.email });
    }
    _res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
    });
}));
// Reset password endpoint
router.post('/reset-password', rateLimiter_1.passwordResetLimiter, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    // Validate password strength
    const passwordValidation = userService_1.UserService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
        throw new apiError_1.ApiError(400, 'Password does not meet security requirements', {
            errors: passwordValidation.errors,
        });
    }
    // Reset password
    const userId = await userService_1.UserService.resetPasswordWithToken(token, newPassword);
    // Invalidate all existing sessions
    await redis_1.redis.del(`refresh_token:${userId}`);
    logger_1.logger.info('Password reset successfully:', { userId });
    _res.json({
        success: true,
        message: 'Password reset successfully. Please log in with your new password.',
    });
}));
// Google OAuth endpoint
router.post('/google', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const { idToken } = req.body;
    if (!idToken) {
        throw new apiError_1.ApiError(400, 'Google ID token is required');
    }
    // Verify Google token and get user info
    const googleUser = await userService_1.UserService.verifyGoogleToken(idToken);
    // Find or create user
    let user = await userService_1.UserService.findByEmail(googleUser.email);
    if (!user) {
        // Create new user from Google data
        user = await userService_1.UserService.createFromGoogle({
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.sub,
            avatarUrl: googleUser.picture,
            isEmailVerified: googleUser.email_verified,
        });
    }
    else {
        // Update Google ID if not set
        if (!user.googleId) {
            await userService_1.UserService.updateGoogleId(parseInt(user.id), googleUser.sub);
        }
    }
    // Generate tokens
    const tokens = (0, auth_1.generateTokens)(user.id);
    // Store refresh token in Redis
    await redis_1.redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);
    // Update last login
    await userService_1.UserService.updateLastLogin(user.id);
    logger_1.logger.info('User logged in with Google:', { userId: user.id, email: user.email });
    _res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: userService_1.UserService.toResponseDto(user),
            tokens,
        },
    });
}));
exports.default = router;
//# sourceMappingURL=auth.js.map