"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const errorHandler_1 = require("../../middleware/errorHandler");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const GoogleAuthService_1 = require("../../services/auth/GoogleAuthService");
const redis_1 = require("../../services/redis");
const apiError_1 = require("../../utils/apiError");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
const googleAuthSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1, 'Google ID token is required'),
    platform: zod_1.z.enum(['web', 'mobile']).optional().default('web'),
    deviceInfo: zod_1.z.object({
        deviceId: zod_1.z.string().optional(),
        deviceName: zod_1.z.string().optional(),
        platform: zod_1.z.string().optional(),
        appVersion: zod_1.z.string().optional(),
    }).optional(),
});
const googleCallbackSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Authorization code is required'),
    state: zod_1.z.string().min(1, 'State parameter is required'),
});
router.post('/', rateLimiter_1.authLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validatedData = googleAuthSchema.parse(req.body);
    try {
        const result = await GoogleAuthService_1.googleAuthService.signIn(validatedData.idToken, validatedData.platform, validatedData.deviceInfo);
        logger_1.logger.info('Google authentication successful', {
            userId: result.user.id,
            email: result.user.email,
            isNewUser: result.isNewUser,
            platform: validatedData.platform,
        });
        res.json({
            success: true,
            message: result.isNewUser ? 'Account created successfully' : 'Login successful',
            data: {
                user: result.user,
                tokens: result.tokens,
                isNewUser: result.isNewUser,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Google authentication failed:', error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, 'Google authentication failed');
    }
}));
router.get('/callback', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
        logger_1.logger.error('Google OAuth error:', error);
        return res.redirect(`${process.env.SITE_URL}/auth/error?message=${encodeURIComponent(String(error))}`);
    }
    if (!code || !state) {
        return res.redirect(`${process.env.SITE_URL}/auth/error?message=Missing+required+parameters`);
    }
    try {
        const { valid, nonce } = await GoogleAuthService_1.googleAuthService.validateOAuthState(String(state), process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_REDIRECT_URI);
        if (!valid) {
            throw new apiError_1.ApiError(400, 'Invalid OAuth state');
        }
        const redirectUrl = new URL(`${process.env.SITE_URL}/auth/google/success`);
        redirectUrl.searchParams.set('code', String(code));
        redirectUrl.searchParams.set('state', String(state));
        if (nonce) {
            redirectUrl.searchParams.set('nonce', nonce);
        }
        res.redirect(redirectUrl.toString());
    }
    catch (error) {
        logger_1.logger.error('Google OAuth callback error:', error);
        const errorMessage = error instanceof apiError_1.ApiError ? error.message : 'Authentication failed';
        res.redirect(`${process.env.SITE_URL}/auth/error?message=${encodeURIComponent(errorMessage)}`);
    }
}));
router.get('/url', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { redirect_uri } = req.query;
    try {
        const oauthState = await GoogleAuthService_1.googleAuthService.generateOAuthState(process.env.GOOGLE_CLIENT_ID, redirect_uri || process.env.GOOGLE_REDIRECT_URI);
        const pkce = GoogleAuthService_1.googleAuthService.generatePKCE();
        await redis_1.redis.setEx(`pkce:${oauthState.state}`, 600, JSON.stringify({
            codeVerifier: pkce.codeVerifier,
            redirectUri: redirect_uri || process.env.GOOGLE_REDIRECT_URI,
        }));
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', redirect_uri || process.env.GOOGLE_REDIRECT_URI);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to generate OAuth URL:', error);
        throw new apiError_1.ApiError(500, 'Failed to generate authentication URL');
    }
}));
router.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new apiError_1.ApiError(400, 'Refresh token is required');
    }
    try {
        const newTokens = await GoogleAuthService_1.googleAuthService.refreshToken(refreshToken);
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                tokens: newTokens,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Token refresh failed:', error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(401, 'Failed to refresh token');
    }
}));
router.get('/validate', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new apiError_1.ApiError(401, 'No authentication token provided');
    }
    const token = authHeader.substring(7);
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.id) {
            throw new apiError_1.ApiError(401, 'Invalid token');
        }
        const sessionInfo = await GoogleAuthService_1.googleAuthService.validateSession(decoded.id);
        if (!sessionInfo.valid) {
            throw new apiError_1.ApiError(401, 'Session is invalid or expired');
        }
        res.json({
            success: true,
            data: {
                valid: true,
                user: sessionInfo.user,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Session validation failed:', error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(401, 'Invalid session');
    }
}));
router.post('/revoke', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new apiError_1.ApiError(401, 'No authentication token provided');
    }
    const token = authHeader.substring(7);
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.id) {
            throw new apiError_1.ApiError(401, 'Invalid token');
        }
        await GoogleAuthService_1.googleAuthService.revokeAllTokens(decoded.id);
        res.json({
            success: true,
            message: 'All tokens have been revoked',
        });
    }
    catch (error) {
        logger_1.logger.error('Token revocation failed:', error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, 'Failed to revoke tokens');
    }
}));
exports.default = router;
