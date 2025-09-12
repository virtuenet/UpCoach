"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const rateLimiter_1 = require("../middleware/rateLimiter");
const UnifiedEmailService_1 = require("../services/email/UnifiedEmailService");
const redis_1 = require("../services/redis");
const userService_1 = require("../services/userService");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
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
router.post('/register', rateLimiter_1.authLimiter, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const validatedData = registerSchema.parse(req.body);
    const passwordValidation = userService_1.UserService.validatePasswordStrength(validatedData.password);
    if (!passwordValidation.isValid) {
        throw new apiError_1.ApiError(400, 'Password does not meet security requirements', {
            errors: passwordValidation.errors,
        });
    }
    const user = await userService_1.UserService.create({
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name,
        bio: validatedData.bio,
    });
    const tokens = (0, auth_1.generateTokens)(user.id);
    await redis_1.redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);
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
router.post('/login', rateLimiter_1.authLimiter, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const validatedData = loginSchema.parse(req.body);
    const user = await userService_1.UserService.verifyPassword(validatedData.email, validatedData.password);
    if (!user) {
        throw new apiError_1.ApiError(401, 'Invalid email or password');
    }
    if (!user.isActive) {
        throw new apiError_1.ApiError(401, 'Account is deactivated');
    }
    const tokens = (0, auth_1.generateTokens)(user.id);
    await redis_1.redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);
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
router.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const { userId } = (0, auth_1.verifyRefreshToken)(refreshToken);
    const storedToken = await redis_1.redis.get(`refresh_token:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
        throw new apiError_1.ApiError(401, 'Invalid refresh token');
    }
    const user = await userService_1.UserService.findById(userId);
    if (!user || !user.isActive) {
        throw new apiError_1.ApiError(401, 'User not found or deactivated');
    }
    const newTokens = (0, auth_1.generateTokens)(userId);
    await redis_1.redis.setEx(`refresh_token:${userId}`, 30 * 24 * 60 * 60, newTokens.refreshToken);
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
router.post('/logout', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.substring(7);
        await (0, auth_1.blacklistToken)(accessToken);
    }
    await redis_1.redis.del(`refresh_token:${userId}`);
    logger_1.logger.info('User logged out successfully:', { userId });
    _res.json({
        success: true,
        message: 'Logout successful',
    });
}));
router.post('/change-password', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    const validatedData = changePasswordSchema.parse(req.body);
    const passwordValidation = userService_1.UserService.validatePasswordStrength(validatedData.newPassword);
    if (!passwordValidation.isValid) {
        throw new apiError_1.ApiError(400, 'New password does not meet security requirements', {
            errors: passwordValidation.errors,
        });
    }
    await userService_1.UserService.updatePassword(userId, validatedData.currentPassword, validatedData.newPassword);
    await redis_1.redis.del(`refresh_token:${userId}`);
    logger_1.logger.info('Password changed successfully:', { userId });
    _res.json({
        success: true,
        message: 'Password changed successfully. Please log in again.',
    });
}));
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
router.post('/logout-all', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const userId = req.user.id;
    await redis_1.redis.del(`refresh_token:${userId}`);
    logger_1.logger.info('User logged out from all devices:', { userId });
    _res.json({
        success: true,
        message: 'Logged out from all devices successfully',
    });
}));
router.post('/forgot-password', rateLimiter_1.passwordResetLimiter, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await userService_1.UserService.findByEmail(email);
    if (user) {
        const resetToken = await userService_1.UserService.generatePasswordResetToken(Number(user.id));
        await UnifiedEmailService_1.emailService.sendPasswordResetEmail(user, resetToken);
        logger_1.logger.info('Password reset requested:', { userId: user.id, email: user.email });
    }
    _res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
    });
}));
router.post('/reset-password', rateLimiter_1.passwordResetLimiter, (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const passwordValidation = userService_1.UserService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
        throw new apiError_1.ApiError(400, 'Password does not meet security requirements', {
            errors: passwordValidation.errors,
        });
    }
    const userId = await userService_1.UserService.resetPasswordWithToken(token, newPassword);
    await redis_1.redis.del(`refresh_token:${userId}`);
    logger_1.logger.info('Password reset successfully:', { userId });
    _res.json({
        success: true,
        message: 'Password reset successfully. Please log in with your new password.',
    });
}));
router.post('/google', (0, errorHandler_1.asyncHandler)(async (req, _res) => {
    const { idToken } = req.body;
    if (!idToken) {
        throw new apiError_1.ApiError(400, 'Google ID token is required');
    }
    const googleUser = await userService_1.UserService.verifyGoogleToken(idToken);
    let user = await userService_1.UserService.findByEmail(googleUser.email);
    if (!user) {
        user = await userService_1.UserService.createFromGoogle({
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.sub,
            avatarUrl: googleUser.picture,
            isEmailVerified: googleUser.email_verified,
        });
    }
    else {
        if (!user.googleId) {
            await userService_1.UserService.updateGoogleId(parseInt(user.id), googleUser.sub);
        }
    }
    const tokens = (0, auth_1.generateTokens)(user.id);
    await redis_1.redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);
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