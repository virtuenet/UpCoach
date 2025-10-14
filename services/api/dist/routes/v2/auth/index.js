"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const google_1 = tslib_1.__importDefault(require("./google"));
const router = (0, express_1.Router)();
router.use('/google', google_1.default);
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth v2 API is healthy',
        version: '2.0.0',
        endpoints: {
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
    });
});
exports.default = router;
