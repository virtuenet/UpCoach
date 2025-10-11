"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = exports.requireCoach = exports.requireAdmin = exports.requireRole = void 0;
const requireRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireCoach = (0, exports.requireRole)(['coach', 'admin']);
exports.requireUser = (0, exports.requireRole)(['user', 'coach', 'admin']);
exports.default = { requireRole: exports.requireRole, requireAdmin: exports.requireAdmin, requireCoach: exports.requireCoach, requireUser: exports.requireUser };
//# sourceMappingURL=role.js.map