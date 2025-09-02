"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceType = exports.checkBulkResourceAccess = exports.checkResourceAction = exports.checkResourceAccess = void 0;
const logger_1 = require("../utils/logger");
const User_1 = require("../models/User");
const Goal_1 = require("../models/Goal");
const CoachSession_1 = require("../models/CoachSession");
const Subscription_1 = require("../models/financial/Subscription");
const Organization_1 = require("../models/Organization");
const UserProfile_1 = require("../models/UserProfile");
const CoachProfile_1 = require("../models/CoachProfile");
const Content_1 = require("../models/cms/Content");
const FinancialSnapshot_1 = require("../models/financial/FinancialSnapshot");
// Define resource types and their ownership rules
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
// Define ownership rules for each resource type
const OWNERSHIP_RULES = {
    [ResourceType.USER]: {
        model: User_1.User,
        ownerField: 'id',
        additionalChecks: async (resource, userId, userRole) => {
            // Admins can access all user resources
            if (userRole === 'admin')
                return true;
            // Users can only access their own data
            return resource.id === userId;
        },
    },
    [ResourceType.GOAL]: {
        model: Goal_1.Goal,
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            // Check if user is the goal owner or their coach
            if (resource.userId === userId)
                return true;
            // Check if the requesting user is the goal owner's coach
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
            // Both coach and client can access the session
            return resource.coachId === userId || resource.clientId === userId;
        },
    },
    [ResourceType.SUBSCRIPTION]: {
        model: Subscription_1.Subscription,
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            // Admins can view all subscriptions
            if (userRole === 'admin')
                return true;
            // Users can only view their own subscriptions
            return resource.userId === userId;
        },
    },
    [ResourceType.ORGANIZATION]: {
        model: Organization_1.Organization,
        ownerField: 'ownerId',
        additionalChecks: async (resource, userId, userRole) => {
            // Check if user is owner or member
            if (resource.ownerId === userId)
                return true;
            // TODO: Implement OrganizationMember model and membership check
            // const membership = await OrganizationMember.findOne({
            //   where: {
            //     organizationId: resource.id,
            //     userId: userId,
            //     status: 'active'
            //   }
            // });
            // return !!membership;
            return false; // Temporarily deny access until OrganizationMember is implemented
        },
    },
    [ResourceType.PROFILE]: {
        model: UserProfile_1.UserProfile,
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            // Public profiles can be viewed by anyone
            if (resource.isPublic)
                return true;
            // Otherwise only the owner can view
            return resource.userId === userId;
        },
    },
    [ResourceType.COACH_PROFILE]: {
        model: CoachProfile_1.CoachProfile,
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            // Coach profiles are generally public for discovery
            return true;
        },
    },
    [ResourceType.CONTENT]: {
        model: Content_1.Content,
        ownerField: 'authorId',
        additionalChecks: async (resource, userId, userRole) => {
            // Published content can be viewed by anyone
            if (resource.status === 'published')
                return true;
            // Draft content only by author or admins
            if (userRole === 'admin')
                return true;
            return resource.authorId === userId;
        },
    },
    [ResourceType.FINANCIAL]: {
        model: FinancialSnapshot_1.FinancialSnapshot,
        ownerField: 'organizationId',
        additionalChecks: async (resource, userId, userRole) => {
            // Only admins and organization owners can view financial data
            if (userRole === 'admin')
                return true;
            const org = await Organization_1.Organization.findByPk(resource.organizationId);
            if (!org)
                return false;
            if (org.ownerId === Number(userId))
                return true;
            // TODO: Implement OrganizationMember model and membership check
            // const membership = await OrganizationMember.findOne({
            //   where: {
            //     organizationId: resource.organizationId,
            //     userId: userId,
            //     role: ['owner', 'manager'],
            //     status: 'active'
            //   }
            // });
            // return !!membership;
            return false; // Temporarily deny access until OrganizationMember is implemented
        },
    },
    [ResourceType.TRANSACTION]: {
        model: null, // Assuming transactions are handled differently
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            // Admins can view all transactions
            if (userRole === 'admin')
                return true;
            // Users can only view their own transactions
            return resource.userId === userId;
        },
    },
    [ResourceType.REPORT]: {
        model: null, // Reports might be generated dynamically
        ownerField: 'userId',
        additionalChecks: async (resource, userId, userRole) => {
            // Reports access depends on the report type
            if (userRole === 'admin')
                return true;
            // Check if user has access to the data being reported
            return resource.userId === userId || resource.createdBy === userId;
        },
    },
};
/**
 * Extract resource type from request path
 */
function extractResourceType(path) {
    const pathSegments = path
        .toLowerCase()
        .split('/')
        .filter(s => s);
    // Map path segments to resource types
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
    // Find matching resource type from path
    for (const segment of pathSegments) {
        if (pathToResourceMap[segment]) {
            return pathToResourceMap[segment];
        }
    }
    return null;
}
/**
 * Main IDOR protection middleware
 */
const checkResourceAccess = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Extract resource information from request
        const resourceId = req.params.id || req.params.resourceId;
        const resourceType = extractResourceType(req.path);
        // If no resource ID or type, skip check (might be a list endpoint)
        if (!resourceId || !resourceType) {
            next();
            return;
        }
        // Get ownership rule for resource type
        const rule = OWNERSHIP_RULES[resourceType];
        if (!rule) {
            logger_1.logger.warn('No ownership rule defined for resource type', { resourceType });
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        // Skip check for admin users on most resources
        if (userRole === 'admin' && resourceType !== ResourceType.USER) {
            next();
            return;
        }
        // Fetch the resource from database
        let resource = null;
        if (rule.model) {
            resource = await rule.model.findByPk(resourceId);
            if (!resource) {
                res.status(404).json({ error: 'Resource not found' });
                return;
            }
        }
        // Check ownership
        let hasAccess = false;
        if (resource) {
            // Check primary ownership fields
            if (Array.isArray(rule.ownerField)) {
                hasAccess = rule.ownerField.some(field => resource[field] === userId);
            }
            else {
                hasAccess = resource[rule.ownerField] === userId;
            }
            // Run additional checks if defined
            if (!hasAccess && rule.additionalChecks) {
                hasAccess = await rule.additionalChecks(resource, userId, userRole);
            }
        }
        else if (rule.additionalChecks) {
            // For resources without models, rely on additional checks
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
        // Attach resource to request for use in controller
        req.resource = resource;
        next();
    }
    catch (error) {
        logger_1.logger.error('Resource access check error', { error, path: req.path });
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.checkResourceAccess = checkResourceAccess;
/**
 * Middleware to check if user can perform specific action on resource
 */
const checkResourceAction = (allowedActions) => {
    return async (req, _res, next) => {
        const action = req.method.toLowerCase();
        const userId = req.user?.id;
        const userRole = req.user?.role;
        // Map HTTP methods to actions
        const methodToAction = {
            get: 'read',
            post: 'create',
            put: 'update',
            patch: 'update',
            delete: 'delete',
        };
        const mappedAction = methodToAction[action] || action;
        // Check if action is allowed
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
        // Additional role-based checks
        if (mappedAction === 'delete' && userRole !== 'admin') {
            // Only admins can delete most resources
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
/**
 * Batch check for multiple resources
 */
const checkBulkResourceAccess = async (userId, resourceIds, resourceType) => {
    const accessMap = new Map();
    const rule = OWNERSHIP_RULES[resourceType];
    if (!rule || !rule.model) {
        resourceIds.forEach(id => accessMap.set(id, false));
        return accessMap;
    }
    try {
        // Fetch all resources
        const resources = await rule.model.findAll({
            where: { id: resourceIds },
        });
        // Check access for each resource
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
        // Mark missing resources as no access
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