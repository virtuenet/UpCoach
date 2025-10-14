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
const errorHandler_1 = require("../../../middleware/errorHandler");
const rateLimiter_1 = require("../../../middleware/rateLimiter");
const auth_1 = require("../../../middleware/auth");
const GoogleAuthService_1 = require("../../../services/auth/GoogleAuthService");
const apiError_1 = require("../../../utils/apiError");
const logger_1 = require("../../../utils/logger");
const router = (0, express_1.Router)();
const googleSignInSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1, 'Google ID token is required'),
    platform: zod_1.z.enum(['mobile', 'web']).default('web'),
    deviceInfo: zod_1.z
        .object({
        deviceId: zod_1.z.string().optional(),
        deviceName: zod_1.z.string().optional(),
        platform: zod_1.z.string().optional(),
        appVersion: zod_1.z.string().optional(),
        ipAddress: zod_1.z.string().optional(),
    })
        .optional(),
});
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
router.post('/signin', rateLimiter_1.authLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const validatedData = googleSignInSchema.parse(req.body);
        const ipAddress = req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress ||
            'unknown';
        const deviceInfo = {
            ...validatedData.deviceInfo,
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        };
        const result = await GoogleAuthService_1.googleAuthService.signIn(validatedData.idToken, validatedData.platform, deviceInfo);
        logger_1.logger.info('Google sign-in successful:', {
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
    }
    catch (error) {
        logger_1.logger.error('Google sign-in failed:', {
            error: error.message,
            platform: req.body.platform,
        });
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        if (error.message?.includes('Invalid Google')) {
            throw new apiError_1.ApiError(401, 'Invalid Google authentication');
        }
        if (error.message?.includes('User already exists')) {
            throw new apiError_1.ApiError(409, 'An account with this email already exists');
        }
        throw new apiError_1.ApiError(500, 'Authentication failed. Please try again.');
    }
}));
router.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { refreshToken } = refreshTokenSchema.parse(req.body);
        const newTokens = await GoogleAuthService_1.googleAuthService.refreshToken(refreshToken);
        logger_1.logger.info('Tokens refreshed successfully');
        res.json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: {
                tokens: newTokens,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Token refresh failed:', {
            error: error.message,
        });
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(401, 'Failed to refresh tokens');
    }
}));
router.get('/session', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.id;
        const sessionInfo = await GoogleAuthService_1.googleAuthService.validateSession(userId);
        if (!sessionInfo.valid) {
            throw new apiError_1.ApiError(401, 'Invalid session');
        }
        res.json({
            success: true,
            message: 'Session is valid',
            data: {
                user: sessionInfo.user,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Session validation failed:', {
            error: error.message,
            userId: req.user?.id,
        });
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(401, 'Session validation failed');
    }
}));
router.post('/revoke', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.id;
        await GoogleAuthService_1.googleAuthService.revokeAllTokens(userId);
        logger_1.logger.info('All tokens revoked for user:', { userId });
        res.json({
            success: true,
            message: 'All tokens have been revoked successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Token revocation failed:', {
            error: error.message,
            userId: req.user?.id,
        });
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, 'Failed to revoke tokens');
    }
}));
router.post('/link', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.id;
        const { idToken } = zod_1.z
            .object({
            idToken: zod_1.z.string().min(1, 'Google ID token is required'),
        })
            .parse(req.body);
        const googleUser = await GoogleAuthService_1.googleAuthService.verifyIdToken(idToken);
        const existingUser = await GoogleAuthService_1.googleAuthService['findUserByGoogleId'](googleUser.sub);
        if (existingUser && existingUser.id !== userId) {
            throw new apiError_1.ApiError(409, 'This Google account is already linked to another user');
        }
        await GoogleAuthService_1.googleAuthService['linkGoogleAccount'](userId, googleUser);
        logger_1.logger.info('Google account linked successfully:', {
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
    }
    catch (error) {
        logger_1.logger.error('Google account linking failed:', {
            error: error.message,
            userId: req.user?.id,
        });
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, 'Failed to link Google account');
    }
}));
router.delete('/unlink', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.id;
        const { db } = await Promise.resolve().then(() => __importStar(require('../../../services/database')));
        const result = await db.query('SELECT password_hash, auth_provider FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            throw new apiError_1.ApiError(404, 'User not found');
        }
        const user = result.rows[0];
        if (!user.password_hash && user.auth_provider === 'google') {
            throw new apiError_1.ApiError(400, 'Cannot unlink Google account. Please set a password first.');
        }
        await db.query(`UPDATE users 
         SET google_id = NULL, 
             google_email = NULL,
             auth_provider = CASE 
               WHEN password_hash IS NOT NULL THEN 'email'
               ELSE auth_provider 
             END,
             updated_at = NOW()
         WHERE id = $1`, [userId]);
        logger_1.logger.info('Google account unlinked successfully:', { userId });
        res.json({
            success: true,
            message: 'Google account unlinked successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Google account unlinking failed:', {
            error: error.message,
            userId: req.user?.id,
        });
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, 'Failed to unlink Google account');
    }
}));
router.get('/status', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.id;
        const { db } = await Promise.resolve().then(() => __importStar(require('../../../services/database')));
        const result = await db.query('SELECT google_id, google_email, auth_provider FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            throw new apiError_1.ApiError(404, 'User not found');
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get Google account status:', {
            error: error.message,
            userId: req.user?.id,
        });
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, 'Failed to get Google account status');
    }
}));
exports.default = router;
