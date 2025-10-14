"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const auth_1 = tslib_1.__importDefault(require("./auth"));
const router = (0, express_1.Router)();
router.use('/auth', auth_1.default);
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API v2 is healthy',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        modules: {
            auth: {
                status: 'active',
                providers: ['google', 'email'],
            },
        },
    });
});
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'UpCoach API v2',
        version: '2.0.0',
        documentation: 'https://docs.upcoach.ai/api/v2',
        endpoints: {
            auth: {
                base: '/api/v2/auth',
                google: {
                    signin: 'POST /api/v2/auth/google/signin',
                    refresh: 'POST /api/v2/auth/google/refresh',
                    session: 'GET /api/v2/auth/google/session',
                    link: 'POST /api/v2/auth/google/link',
                    unlink: 'DELETE /api/v2/auth/google/unlink',
                    status: 'GET /api/v2/auth/google/status',
                    revoke: 'POST /api/v2/auth/google/revoke',
                },
            },
        },
        features: {
            googleOAuth: true,
            jwtTokens: true,
            sessionManagement: true,
            deviceTracking: true,
            auditLogging: true,
            supabaseSync: true,
        },
    });
});
exports.default = router;
