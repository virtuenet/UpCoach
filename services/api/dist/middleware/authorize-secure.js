"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceType = exports.Role = void 0;
exports.authorize = authorize;
exports.loadUserContext = loadUserContext;
exports.clearAuthCache = clearAuthCache;
exports.hasPermission = hasPermission;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const redis_1 = require("../services/redis");
var Role;
(function (Role) {
    Role["MEMBER"] = "member";
    Role["LEAD"] = "lead";
    Role["MANAGER"] = "manager";
    Role["ADMIN"] = "admin";
    Role["OWNER"] = "owner";
})(Role || (exports.Role = Role = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType["ORGANIZATION"] = "organization";
    ResourceType["TEAM"] = "team";
    ResourceType["PROJECT"] = "project";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
const PERMISSION_MATRIX = {
    [Role.MEMBER]: new Set([
        'read:self',
        'update:self',
        'read:team',
    ]),
    [Role.LEAD]: new Set([
        'read:self',
        'update:self',
        'read:team',
        'update:team',
        'create:team_task',
        'assign:team_member',
    ]),
    [Role.MANAGER]: new Set([
        'read:self',
        'update:self',
        'read:team',
        'update:team',
        'create:team_task',
        'assign:team_member',
        'create:team',
        'delete:team',
        'manage:team_members',
        'read:organization',
    ]),
    [Role.ADMIN]: new Set([
        'read:self',
        'update:self',
        'read:team',
        'update:team',
        'create:team_task',
        'assign:team_member',
        'create:team',
        'delete:team',
        'manage:team_members',
        'read:organization',
        'update:organization',
        'manage:organization_members',
        'create:project',
        'delete:project',
    ]),
    [Role.OWNER]: new Set([
        '*',
    ]),
};
const ROLE_INHERITANCE = {
    [Role.MEMBER]: [Role.MEMBER],
    [Role.LEAD]: [Role.MEMBER, Role.LEAD],
    [Role.MANAGER]: [Role.MEMBER, Role.LEAD, Role.MANAGER],
    [Role.ADMIN]: [Role.MEMBER, Role.LEAD, Role.MANAGER, Role.ADMIN],
    [Role.OWNER]: [Role.MEMBER, Role.LEAD, Role.MANAGER, Role.ADMIN, Role.OWNER],
};
function authorize(options) {
    return async (req, _res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new errors_1.AppError('Unauthorized', 401);
            }
            if (!Number.isInteger(userId) || userId <= 0) {
                throw new errors_1.AppError('Invalid user ID', 400);
            }
            const resourceId = extractResourceId(req, options.resourceType);
            if (!resourceId) {
                throw new errors_1.AppError(`${options.resourceType} ID is required`, 400);
            }
            if (!Number.isInteger(resourceId) || resourceId <= 0) {
                throw new errors_1.AppError('Invalid resource ID', 400);
            }
            if (options.cacheResults) {
                const cacheKey = `auth:${userId}:${options.resourceType}:${resourceId}`;
                const cached = await redis_1.redis.get(cacheKey);
                if (cached) {
                    const cachedData = JSON.parse(cached);
                    if (cachedData.authorized) {
                        req.userRole = cachedData.role;
                        req.userPermissions = cachedData.permissions;
                        return next();
                    }
                }
            }
            const userRole = await getUserRole(userId, options.resourceType, resourceId);
            if (!userRole) {
                logger_1.logger.warn('Authorization failed: No role found', {
                    userId,
                    resourceType: options.resourceType,
                    resourceId,
                    path: req.path,
                });
                throw new errors_1.AppError('Insufficient permissions', 403);
            }
            if (options.requiredRoles && options.requiredRoles.length > 0) {
                const hasRequiredRole = checkRoleAccess(userRole, options.requiredRoles);
                if (!hasRequiredRole) {
                    logger_1.logger.warn('Authorization failed: Insufficient role', {
                        userId,
                        userRole,
                        requiredRoles: options.requiredRoles,
                        path: req.path,
                    });
                    throw new errors_1.AppError('Insufficient permissions', 403);
                }
            }
            if (options.requiredPermissions && options.requiredPermissions.length > 0) {
                const hasRequiredPermissions = checkPermissions(userRole, options.requiredPermissions);
                if (!hasRequiredPermissions) {
                    logger_1.logger.warn('Authorization failed: Missing permissions', {
                        userId,
                        userRole,
                        requiredPermissions: options.requiredPermissions,
                        path: req.path,
                    });
                    throw new errors_1.AppError('Insufficient permissions', 403);
                }
            }
            if (options.checkOwnership) {
                const isOwner = await checkResourceOwnership(userId, options.resourceType, resourceId);
                if (!isOwner && userRole !== Role.OWNER && userRole !== Role.ADMIN) {
                    logger_1.logger.warn('Authorization failed: Not resource owner', {
                        userId,
                        resourceType: options.resourceType,
                        resourceId,
                        path: req.path,
                    });
                    throw new errors_1.AppError('Resource access denied', 403);
                }
            }
            if (options.cacheResults) {
                const cacheKey = `auth:${userId}:${options.resourceType}:${resourceId}`;
                const cacheData = {
                    authorized: true,
                    role: userRole,
                    permissions: Array.from(getPermissionsForRole(userRole)),
                    timestamp: Date.now(),
                };
                await redis_1.redis.setEx(cacheKey, 300, JSON.stringify(cacheData));
            }
            req.userRole = userRole;
            req.userPermissions = getPermissionsForRole(userRole);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
function extractResourceId(req, resourceType) {
    const paramKey = `${resourceType}Id`;
    const idFromParams = req.params[paramKey];
    const idFromBody = req.body?.[paramKey];
    const idFromQuery = req.query?.[paramKey];
    const rawId = idFromParams || idFromBody || idFromQuery;
    if (!rawId) {
        return null;
    }
    const id = parseInt(String(rawId), 10);
    return isNaN(id) ? null : id;
}
async function getUserRole(userId, resourceType, resourceId) {
    try {
        switch (resourceType) {
            case ResourceType.ORGANIZATION: {
                const result = await models_1.sequelize.query(`SELECT role FROM organization_members
           WHERE organization_id = :resourceId
           AND user_id = :userId
           AND is_active = true
           LIMIT 1`, {
                    replacements: { resourceId, userId },
                    type: sequelize_1.QueryTypes.SELECT,
                });
                if (result.length > 0) {
                    return result[0].role;
                }
                break;
            }
            case ResourceType.TEAM: {
                const result = await models_1.sequelize.query(`SELECT
            tm.role as team_role,
            om.role as org_role
           FROM team_members tm
           JOIN teams t ON tm.team_id = t.id
           LEFT JOIN organization_members om
             ON t.organization_id = om.organization_id
             AND om.user_id = tm.user_id
           WHERE tm.team_id = :resourceId
           AND tm.user_id = :userId
           AND tm.is_active = true
           LIMIT 1`, {
                    replacements: { resourceId, userId },
                    type: sequelize_1.QueryTypes.SELECT,
                });
                if (result.length > 0) {
                    const { team_role, org_role } = result[0];
                    if (org_role && isHigherRole(org_role, team_role)) {
                        return org_role;
                    }
                    return team_role;
                }
                break;
            }
            case ResourceType.PROJECT: {
                const result = await models_1.sequelize.query(`SELECT role FROM project_members
           WHERE project_id = :resourceId
           AND user_id = :userId
           AND is_active = true
           LIMIT 1`, {
                    replacements: { resourceId, userId },
                    type: sequelize_1.QueryTypes.SELECT,
                });
                if (result.length > 0) {
                    return result[0].role;
                }
                break;
            }
        }
        return null;
    }
    catch (error) {
        logger_1.logger.error('Error fetching user role:', error);
        return null;
    }
}
function checkRoleAccess(userRole, requiredRoles) {
    if (userRole === Role.OWNER) {
        return true;
    }
    const inheritedRoles = ROLE_INHERITANCE[userRole] || [userRole];
    return requiredRoles.some(required => inheritedRoles.includes(required));
}
function checkPermissions(userRole, requiredPermissions) {
    const userPermissions = getPermissionsForRole(userRole);
    if (userPermissions.has('*')) {
        return true;
    }
    return requiredPermissions.every(permission => userPermissions.has(permission));
}
function getPermissionsForRole(role) {
    const permissions = new Set();
    const inheritedRoles = ROLE_INHERITANCE[role] || [role];
    for (const inheritedRole of inheritedRoles) {
        const rolePermissions = PERMISSION_MATRIX[inheritedRole];
        if (rolePermissions) {
            rolePermissions.forEach(p => permissions.add(p));
        }
    }
    return permissions;
}
function isHigherRole(role1, role2) {
    const order = [Role.MEMBER, Role.LEAD, Role.MANAGER, Role.ADMIN, Role.OWNER];
    return order.indexOf(role1) > order.indexOf(role2);
}
async function checkResourceOwnership(userId, resourceType, resourceId) {
    try {
        switch (resourceType) {
            case ResourceType.ORGANIZATION: {
                const result = await models_1.sequelize.query(`SELECT owner_id FROM organizations
           WHERE id = :resourceId`, {
                    replacements: { resourceId },
                    type: sequelize_1.QueryTypes.SELECT,
                });
                return result.length > 0 && result[0].owner_id === userId;
            }
            case ResourceType.TEAM: {
                const result = await models_1.sequelize.query(`SELECT created_by FROM teams
           WHERE id = :resourceId`, {
                    replacements: { resourceId },
                    type: sequelize_1.QueryTypes.SELECT,
                });
                return result.length > 0 && result[0].created_by === userId;
            }
            case ResourceType.PROJECT: {
                const result = await models_1.sequelize.query(`SELECT owner_id FROM projects
           WHERE id = :resourceId`, {
                    replacements: { resourceId },
                    type: sequelize_1.QueryTypes.SELECT,
                });
                return result.length > 0 && result[0].owner_id === userId;
            }
            default:
                return false;
        }
    }
    catch (error) {
        logger_1.logger.error('Error checking resource ownership:', error);
        return false;
    }
}
async function loadUserContext(req, _res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next();
        }
        const cacheKey = `context:${userId}`;
        const cached = await redis_1.redis.get(cacheKey);
        if (cached) {
            const context = JSON.parse(cached);
            req.userContext = context;
            return next();
        }
        const organizations = await models_1.sequelize.query(`SELECT o.id, o.name, om.role
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = :userId AND om.is_active = true`, {
            replacements: { userId },
            type: sequelize_1.QueryTypes.SELECT,
        });
        const teams = await models_1.sequelize.query(`SELECT t.id, t.name, tm.role, t.organization_id
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = :userId AND tm.is_active = true`, {
            replacements: { userId },
            type: sequelize_1.QueryTypes.SELECT,
        });
        const context = {
            organizations,
            teams,
            timestamp: Date.now(),
        };
        await redis_1.redis.setEx(cacheKey, 600, JSON.stringify(context));
        req.userContext = context;
        next();
    }
    catch (error) {
        logger_1.logger.error('Error loading user context:', error);
        next();
    }
}
async function clearAuthCache(userId) {
    try {
        const pattern = `auth:${userId}:*`;
        const keys = await redis_1.redis.keys(pattern);
        if (keys.length > 0) {
            await redis_1.redis.del(...keys);
        }
        await redis_1.redis.del(`context:${userId}`);
        logger_1.logger.info(`Cleared auth cache for user ${userId}`);
    }
    catch (error) {
        logger_1.logger.error('Error clearing auth cache:', error);
    }
}
async function hasPermission(userId, resourceType, resourceId, permission) {
    const role = await getUserRole(userId, resourceType, resourceId);
    if (!role) {
        return false;
    }
    const permissions = getPermissionsForRole(role);
    return permissions.has(permission) || permissions.has('*');
}
