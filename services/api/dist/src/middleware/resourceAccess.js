"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceType = exports.checkBulkResourceAccess = exports.checkResourceAction = exports.checkResourceAccess = void 0;
const Content_1 = require("../models/cms/Content");
const CoachProfile_1 = require("../models/CoachProfile");
const CoachSession_1 = require("../models/CoachSession");
const FinancialSnapshot_1 = require("../models/financial/FinancialSnapshot");
const Subscription_1 = require("../models/financial/Subscription");
const Goal_1 = require("../models/Goal");
const Organization_1 = require("../models/Organization");
const User_1 = require("../models/User");
const UserProfile_1 = require("../models/UserProfile");
const logger_1 = require("../utils/logger");
var ResourceType;
(function (ResourceType) {
    ResourceType["USER"] = "user";
    ResourceType["GOAL"] = "goal";
    ResourceType["SESSION"] = "session";
    ResourceType["SUBSCRIPTION"] = "subscription";
    ResourceType["ORGANIZATION"] = "organization";
    ResourceType["PROFILE"] = "profile";
    ResourceType["COACH_PROFILE"] = "coach_profile";
    ResourceType["CONTENT"] = "content";
    ResourceType["FINANCIAL"] = "financial";
    ResourceType["TRANSACTION"] = "transaction";
    ResourceType["REPORT"] = "report";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
const OWNERSHIP_RULES = {
    [ResourceType.USER]: {
        model: User_1.User,
        ownerField: 'id',
        additionalChecks: async (resource, userId, userRole) => {
            if (userRole === 'admin')
                return true;
            return resource.id === userId;
        },
    },
    [ResourceType.GOAL]: {
        model: Goal_1.Goal,
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            if (resource.userId === userId)
                return true;
            const session = await CoachSession_1.CoachSession.findOne({
                where: {
                    clientId: resource.userId,
                    coachId: userId,
                    status: 'active',
                },
            });
            return !!session;
        },
    },
    [ResourceType.SESSION]: {
        model: CoachSession_1.CoachSession,
        ownerField: ['coachId', 'clientId'],
        additionalChecks: async (resource, userId, userRole) => {
            return resource.coachId === userId || resource.clientId === userId;
        },
    },
    [ResourceType.SUBSCRIPTION]: {
        model: Subscription_1.Subscription,
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            if (userRole === 'admin')
                return true;
            return resource.userId === userId;
        },
    },
    [ResourceType.ORGANIZATION]: {
        model: Organization_1.Organization,
        ownerField: 'ownerId',
        additionalChecks: async (resource, userId, userRole) => {
            if (resource.ownerId === userId)
                return true;
            return false;
        },
    },
    [ResourceType.PROFILE]: {
        model: UserProfile_1.UserProfile,
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            if (resource.isPublic)
                return true;
            return resource.userId === userId;
        },
    },
    [ResourceType.COACH_PROFILE]: {
        model: CoachProfile_1.CoachProfile,
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            return true;
        },
    },
    [ResourceType.CONTENT]: {
        model: Content_1.Content,
        ownerField: 'authorId',
        additionalChecks: async (resource, userId, userRole) => {
            if (resource.status === 'published')
                return true;
            if (userRole === 'admin')
                return true;
            return resource.authorId === userId;
        },
    },
    [ResourceType.FINANCIAL]: {
        model: FinancialSnapshot_1.FinancialSnapshot,
        ownerField: 'organizationId',
        additionalChecks: async (resource, userId, userRole) => {
            if (userRole === 'admin')
                return true;
            const org = await Organization_1.Organization.findByPk(resource.organizationId);
            if (!org)
                return false;
            if (org.ownerId === Number(userId))
                return true;
            return false;
        },
    },
    [ResourceType.TRANSACTION]: {
        model: null,
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            if (userRole === 'admin')
                return true;
            return resource.userId === userId;
        },
    },
    [ResourceType.REPORT]: {
        model: null,
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            if (userRole === 'admin')
                return true;
            return resource.userId === userId || resource.createdBy === userId;
        },
    },
};
function extractResourceType(path) {
    const pathSegments = path
        .toLowerCase()
        .split('/')
        .filter(s => s);
    const pathToResourceMap = {
        users: ResourceType.USER,
        goals: ResourceType.GOAL,
        sessions: ResourceType.SESSION,
        'coach-sessions': ResourceType.SESSION,
        subscriptions: ResourceType.SUBSCRIPTION,
        organizations: ResourceType.ORGANIZATION,
        profiles: ResourceType.PROFILE,
        'coach-profiles': ResourceType.COACH_PROFILE,
        content: ResourceType.CONTENT,
        financial: ResourceType.FINANCIAL,
        transactions: ResourceType.TRANSACTION,
        reports: ResourceType.REPORT,
    };
    for (const segment of pathSegments) {
        if (pathToResourceMap[segment]) {
            return pathToResourceMap[segment];
        }
    }
    return null;
}
const checkResourceAccess = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const resourceId = req.params.id || req.params.resourceId;
        const resourceType = extractResourceType(req.path);
        if (!resourceId || !resourceType) {
            next();
            return;
        }
        const rule = OWNERSHIP_RULES[resourceType];
        if (!rule) {
            logger_1.logger.warn('No ownership rule defined for resource type', { resourceType });
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        if (userRole === 'admin' && resourceType !== ResourceType.USER) {
            next();
            return;
        }
        let resource = null;
        if (rule.model) {
            resource = await rule.model.findByPk(resourceId);
            if (!resource) {
                res.status(404).json({ error: 'Resource not found' });
                return;
            }
        }
        let hasAccess = false;
        if (resource) {
            if (Array.isArray(rule.ownerField)) {
                hasAccess = rule.ownerField.some(field => resource[field] === userId);
            }
            else {
                hasAccess = resource[rule.ownerField] === userId;
            }
            if (!hasAccess && rule.additionalChecks) {
                hasAccess = await rule.additionalChecks(resource, userId, userRole);
            }
        }
        else if (rule.additionalChecks) {
            hasAccess = await rule.additionalChecks({ id: resourceId }, userId, userRole);
        }
        if (!hasAccess) {
            logger_1.logger.warn('IDOR attempt detected', {
                userId,
                resourceType,
                resourceId,
                path: req.path,
                method: req.method,
                ip: req.ip,
            });
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        req.resource = resource;
        next();
    }
    catch (error) {
        logger_1.logger.error('Resource access check error', { error, path: req.path });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.checkResourceAccess = checkResourceAccess;
const checkResourceAction = (allowedActions) => {
    return async (req, _res, next) => {
        const action = req.method.toLowerCase();
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const methodToAction = {
            get: 'read',
            post: 'create',
            put: 'update',
            patch: 'update',
            delete: 'delete',
        };
        const mappedAction = methodToAction[action] || action;
        if (!allowedActions.includes(mappedAction)) {
            logger_1.logger.warn('Unauthorized action attempt', {
                userId,
                action: mappedAction,
                allowedActions,
                path: req.path,
            });
            _res.status(403).json({ error: 'Action not allowed' });
            return;
        }
        if (mappedAction === 'delete' && userRole !== 'admin') {
            const resourceType = extractResourceType(req.path);
            if (resourceType && ![ResourceType.GOAL, ResourceType.SESSION].includes(resourceType)) {
                _res.status(403).json({ error: 'Only administrators can delete this resource' });
                return;
            }
        }
        next();
    };
};
exports.checkResourceAction = checkResourceAction;
const checkBulkResourceAccess = async (userId, resourceIds, resourceType) => {
    const accessMap = new Map();
    const rule = OWNERSHIP_RULES[resourceType];
    if (!rule || !rule.model) {
        resourceIds.forEach(id => accessMap.set(id, false));
        return accessMap;
    }
    try {
        const resources = await rule.model.findAll({
            where: { id: resourceIds },
        });
        for (const resource of resources) {
            let hasAccess = false;
            if (Array.isArray(rule.ownerField)) {
                hasAccess = rule.ownerField.some(field => resource[field] === userId);
            }
            else {
                hasAccess = resource[rule.ownerField] === userId;
            }
            if (!hasAccess && rule.additionalChecks) {
                hasAccess = await rule.additionalChecks(resource, userId);
            }
            accessMap.set(resource.id, hasAccess);
        }
        resourceIds.forEach(id => {
            if (!accessMap.has(id)) {
                accessMap.set(id, false);
            }
        });
        return accessMap;
    }
    catch (error) {
        logger_1.logger.error('Bulk resource access check error', { error, resourceType });
        resourceIds.forEach(id => accessMap.set(id, false));
        return accessMap;
    }
};
exports.checkBulkResourceAccess = checkBulkResourceAccess;
//# sourceMappingURL=resourceAccess.js.map