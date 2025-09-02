"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
exports.checkPermission = checkPermission;
exports.loadOrganizationContext = loadOrganizationContext;
const errors_1 = require("../utils/errors");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const roleHierarchy = {
    member: 1,
    lead: 2,
    manager: 3,
    admin: 4,
    owner: 5,
};
function authorize(resourceType, requiredRole) {
    return async (req, _res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errors_1.AppError('Unauthorized', 401);
            }
            const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
            const minRoleLevel = Math.min(...requiredRoles.map(role => roleHierarchy[role]));
            let hasPermission = false;
            switch (resourceType) {
                case 'organization': {
                    const organizationId = req.params.organizationId || req.body.organizationId;
                    if (!organizationId) {
                        throw new errors_1.AppError('Organization ID is required', 400);
                    }
                    const [membership] = await models_1.sequelize.query(`SELECT role FROM organization_members
             WHERE organization_id = :organizationId 
             AND user_id = :userId 
             AND is_active = true`, {
                        replacements: { organizationId, userId },
                    });
                    if (membership.length > 0) {
                        const membershipRow = membership[0];
                        const userRole = membershipRow.role;
                        const userRoleLevel = roleHierarchy[userRole];
                        hasPermission = userRoleLevel >= minRoleLevel;
                    }
                    break;
                }
                case 'team': {
                    const teamId = req.params.teamId || req.body.teamId;
                    if (!teamId) {
                        throw new errors_1.AppError('Team ID is required', 400);
                    }
                    // Check team membership
                    const [teamMembership] = await models_1.sequelize.query(`SELECT tm.role as team_role, om.role as org_role
             FROM team_members tm
             JOIN teams t ON tm.team_id = t.id
             JOIN organization_members om ON t.organization_id = om.organization_id AND om.user_id = tm.user_id
             WHERE tm.team_id = :teamId 
             AND tm.user_id = :userId 
             AND tm.is_active = true`, {
                        replacements: { teamId, userId },
                    });
                    if (teamMembership.length > 0) {
                        const membershipRow = teamMembership[0];
                        const teamRole = membershipRow.team_role;
                        const orgRole = membershipRow.org_role;
                        // Check if user has sufficient team role or organization role
                        const teamRoleLevel = roleHierarchy[teamRole];
                        const orgRoleLevel = roleHierarchy[orgRole];
                        hasPermission = teamRoleLevel >= minRoleLevel || orgRoleLevel >= minRoleLevel;
                    }
                    break;
                }
                default:
                    throw new errors_1.AppError(`Unknown resource type: ${resourceType}`, 500);
            }
            if (!hasPermission) {
                logger_1.logger.warn('Authorization failed', {
                    userId,
                    resourceType,
                    requiredRole,
                    path: req.path,
                });
                throw new errors_1.AppError('Insufficient permissions', 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
// Utility function to check permissions programmatically
async function checkPermission(userId, resourceType, resourceId, requiredRole) {
    const minRoleLevel = roleHierarchy[requiredRole];
    switch (resourceType) {
        case 'organization': {
            const [membership] = await models_1.sequelize.query(`SELECT role FROM organization_members
         WHERE organization_id = :resourceId 
         AND user_id = :userId 
         AND is_active = true`, {
                replacements: { resourceId, userId },
            });
            if (membership.length > 0) {
                const membershipRow = membership[0];
                const userRole = membershipRow.role;
                return roleHierarchy[userRole] >= minRoleLevel;
            }
            break;
        }
        case 'team': {
            const [membership] = await models_1.sequelize.query(`SELECT role FROM team_members
         WHERE team_id = :resourceId 
         AND user_id = :userId 
         AND is_active = true`, {
                replacements: { resourceId, userId },
            });
            if (membership.length > 0) {
                const membershipRow = membership[0];
                const userRole = membershipRow.role;
                return roleHierarchy[userRole] >= minRoleLevel;
            }
            break;
        }
    }
    return false;
}
// Middleware to load user's organization context
async function loadOrganizationContext(req, _res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next();
        }
        const [organizations] = await models_1.sequelize.query(`SELECT o.*, om.role
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = :userId AND om.is_active = true`, {
            replacements: { userId },
        });
        if (organizations.length > 0) {
            const org = organizations[0];
            req.organization = org;
            req.organizationRole = org.role;
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=authorize.js.map