"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const logger_1 = require("../utils/logger");
const notFoundHandler = (req, _res) => {
    logger_1.logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
    });
    _res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'The requested endpoint was not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=notFoundHandler.js.map