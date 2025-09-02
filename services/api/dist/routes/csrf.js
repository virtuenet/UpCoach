"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const csrf_1 = require("../middleware/csrf");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * GET /api/csrf-token
 * Get a CSRF token for the current session
 */
router.get('/csrf-token', (0, csrf_1.csrfToken)(), async (req, _res) => {
    try {
        // Generate token using the middleware
        const token = await req.csrfToken();
        _res.json({
            success: true,
            token,
            expiresIn: parseInt(process.env.CSRF_TOKEN_EXPIRY || '3600', 10),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate CSRF token:', error);
        _res.status(500).json({
            success: false,
            error: 'Failed to generate security token',
        });
    }
});
exports.default = router;
//# sourceMappingURL=csrf.js.map