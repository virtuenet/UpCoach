"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const errorHandler_1 = require("../middleware/errorHandler");
const rateLimiter_1 = require("../middleware/rateLimiter");
const auth_1 = require("../middleware/auth");
const GoogleAuthService_1 = require("../services/auth/GoogleAuthService");
const userService_1 = require("../services/userService");
const redis_1 = require("../services/redis");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});
const googleSignInSchema = zod_1.z.object({
    id_token: zod_1.z.string().min(1, 'Google ID token is required'),
    access_token: zod_1.z.string().optional(),
    client_info: zod_1.z.object({
        platform: zod_1.z.enum(['ios', 'android', 'web']).optional(),
        app_version: zod_1.z.string().optional(),
        device_id: zod_1.z.string().optional(),
    }).optional(),
});
const googleRefreshSchema = zod_1.z.object({
    refresh_token: zod_1.z.string().min(1, 'Refresh token is required'),
});
router.post('/signin', rateLimiter_1.authLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validatedData = googleSignInSchema.parse(req.body);
    const { id_token, access_token, client_info } = validatedData;
    logger_1.logger.info('Google Sign-In attempt', {
        platform: client_info?.platform,
        hasAccessToken: !!access_token
    });
    try {
        const googleUserInfo = await GoogleAuthService_1.googleAuthService.getUserInfo({
            idToken: id_token,
            accessToken: access_token,
        });
        if (!googleUserInfo.email || !googleUserInfo.email_verified) {
            throw new apiError_1.ApiError(401, 'Google account email must be verified');
        }
        let user = await userService_1.UserService.findByEmail(googleUserInfo.email);
        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            user = await userService_1.UserService.createFromGoogle({
                email: googleUserInfo.email,
                name: googleUserInfo.name,
                googleId: googleUserInfo.sub,
                avatarUrl: googleUserInfo.picture,
                isEmailVerified: googleUserInfo.email_verified,
            });
            logger_1.logger.info('New user created via Google Sign-In', {
                userId: user.id,
                email: user.email
            });
        }
        else {
            const updates = {};
            let shouldUpdate = false;
            if (!user.googleId && googleUserInfo.sub) {
                updates.google_id = googleUserInfo.sub;
                updates.auth_provider = 'google';
                shouldUpdate = true;
            }
            if (!user.avatarUrl && googleUserInfo.picture) {
                updates.avatar_url = googleUserInfo.picture;
                shouldUpdate = true;
            }
            if (!user.isEmailVerified && googleUserInfo.email_verified) {
                updates.is_email_verified = true;
                shouldUpdate = true;
            }
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
                await userService_1.UserService.update(user.id, updates);
                logger_1.logger.info('User updated with Google data', { userId: user.id });
            }
        }
        if (!user.isActive) {
            throw new apiError_1.ApiError(401, 'Account is deactivated');
        }
        const tokens = (0, auth_1.generateTokens)(user.id, user.email, user.role, req);
        await redis_1.redis.setEx(`refresh_token:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken);
        await redis_1.redis.setEx(`google_session:${user.id}:${googleUserInfo.sub}`, 7 * 24 * 60 * 60, JSON.stringify({
            signInTime: new Date(),
            platform: client_info?.platform,
            deviceId: client_info?.device_id,
            ipAddress: req.ip,
        }));
        await userService_1.UserService.updateLastLogin(user.id);
        logger_1.logger.info('Google Sign-In successful', {
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
                user: userService_1.UserService.toResponseDto(user),
                tokens,
                isNewUser,
                authProvider: 'google',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Google Sign-In error:', error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(401, 'Google Sign-In failed');
    }
}));
router.post('/refresh', rateLimiter_1.authLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refresh_token } = googleRefreshSchema.parse(req.body);
    try {
        const { verifyRefreshToken } = await Promise.resolve().then(() => __importStar(require('../middleware/auth')));
        const { userId } = verifyRefreshToken(refresh_token);
        const storedToken = await redis_1.redis.get(`refresh_token:${userId}`);
        if (!storedToken || storedToken !== refresh_token) {
            throw new apiError_1.ApiError(401, 'Invalid refresh token');
        }
        const user = await userService_1.UserService.findById(userId);
        if (!user || !user.isActive) {
            throw new apiError_1.ApiError(401, 'User not found or deactivated');
        }
        const newTokens = (0, auth_1.generateTokens)(userId, user.email, user.role, req);
        await redis_1.redis.setEx(`refresh_token:${userId}`, 30 * 24 * 60 * 60, newTokens.refreshToken);
        const { blacklistToken } = await Promise.resolve().then(() => __importStar(require('../middleware/auth')));
        await blacklistToken(refresh_token);
        logger_1.logger.info('Google tokens refreshed successfully', { userId });
        res.json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: {
                tokens: newTokens,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Google token refresh error:', error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(401, 'Token refresh failed');
    }
}));
router.post('/link', rateLimiter_1.authLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id_token } = zod_1.z.object({
        id_token: zod_1.z.string().min(1, 'Google ID token is required'),
    }).parse(req.body);
    throw new apiError_1.ApiError(501, 'Account linking not yet implemented');
}));
router.post('/unlink', rateLimiter_1.authLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    throw new apiError_1.ApiError(501, 'Account unlinking not yet implemented');
}));
exports.default = router;
