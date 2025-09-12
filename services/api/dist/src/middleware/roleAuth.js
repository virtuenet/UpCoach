"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.requireAdmin = requireAdmin;
const errors_1 = require("../utils/errors");
function requireRole(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw new errors_1.ForbiddenError('Insufficient permissions');
        }
        next();
    };
}
function requireAdmin(req, _res, next) {
    if (!req.user) {
        throw new errors_1.UnauthorizedError('Authentication required');
    }
    if (req.user.role !== 'admin') {
        throw new errors_1.ForbiddenError('Admin access required');
    }
    next();
}
//# sourceMappingURL=roleAuth.js.map