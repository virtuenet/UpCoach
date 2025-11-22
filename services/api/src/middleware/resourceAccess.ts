import { Request, Response, NextFunction } from 'express';

import { Content } from '../models/cms/Content';
import { CoachProfile } from '../models/CoachProfile';
import { CoachSession } from '../models/CoachSession';
import { FinancialSnapshot } from '../models/financial/FinancialSnapshot';
import { Subscription } from '../models/financial/Subscription';
import { Goal } from '../models/Goal';
import { Organization } from '../models/Organization';
import { OrganizationMember } from '../models/OrganizationMember';
import { User } from '../models/User';
import { UserProfile } from '../models/UserProfile';
import { logger } from '../utils/logger';
import {
  securityMonitoringService,
  SecurityEventType,
  SecurityEventSeverity,
} from '../services/security/SecurityMonitoringService';

// Define resource types and their ownership rules
enum ResourceType {
  USER = 'user',
  GOAL = 'goal',
  SESSION = 'session',
  SUBSCRIPTION = 'subscription',
  ORGANIZATION = 'organization',
  PROFILE = 'profile',
  COACH_PROFILE = 'coach_profile',
  CONTENT = 'content',
  FINANCIAL = 'financial',
  TRANSACTION = 'transaction',
  REPORT = 'report',
}

interface ResourceOwnershipRule {
  model: unknown;
  ownerField: string | string[];
  additionalChecks?: (resource: unknown, _userId: string, userRole?: string) => Promise<boolean>;
}

// Define ownership rules for each resource type
const OWNERSHIP_RULES: Record<ResourceType, ResourceOwnershipRule> = {
  [ResourceType.USER]: {
    model: User,
    ownerField: 'id',
    additionalChecks: async (resource, userId, userRole) => {
      // Admins can access all user resources
      if (userRole === 'admin') return true;
      // Users can only access their own data
      return resource.id === userId;
    },
  },
  [ResourceType.GOAL]: {
    model: Goal,
    ownerField: 'userId',
    additionalChecks: async (resource, userId, userRole) => {
      // Check if user is the goal owner or their coach
      if (resource.userId === userId) return true;

      // Check if the requesting user is the goal owner's coach
      const session = await CoachSession.findOne({
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
    model: CoachSession,
    ownerField: ['coachId', 'clientId'],
    additionalChecks: async (resource, userId, userRole) => {
      // Both coach and client can access the session
      return resource.coachId === userId || resource.clientId === userId;
    },
  },
  [ResourceType.SUBSCRIPTION]: {
    model: Subscription,
    ownerField: 'userId',
    additionalChecks: async (resource, userId, userRole) => {
      // Admins can view all subscriptions
      if (userRole === 'admin') return true;
      // Users can only view their own subscriptions
      return resource.userId === userId;
    },
  },
  [ResourceType.ORGANIZATION]: {
    model: Organization,
    ownerField: 'ownerId',
    additionalChecks: async (resource, userId, userRole) => {
      // Check if user is owner or member
      if (resource.ownerId === Number(userId)) return true;

      // Check organization membership
      const membership = await OrganizationMember.findActiveMembership(
        Number(userId),
        resource.id
      );

      return !!membership;
    },
  },
  [ResourceType.PROFILE]: {
    model: UserProfile,
    ownerField: 'userId',
    additionalChecks: async (resource, userId, userRole) => {
      // Public profiles can be viewed by anyone
      if (resource.isPublic) return true;
      // Otherwise only the owner can view
      return resource.userId === userId;
    },
  },
  [ResourceType.COACH_PROFILE]: {
    model: CoachProfile,
    ownerField: 'userId',
    additionalChecks: async (resource, userId, userRole) => {
      // Coach profiles are generally public for discovery
      return true;
    },
  },
  [ResourceType.CONTENT]: {
    model: Content,
    ownerField: 'authorId',
    additionalChecks: async (resource, userId, userRole) => {
      // Published content can be viewed by anyone
      if (resource.status === 'published') return true;
      // Draft content only by author or admins
      if (userRole === 'admin') return true;
      return resource.authorId === userId;
    },
  },
  [ResourceType.FINANCIAL]: {
    model: FinancialSnapshot,
    ownerField: 'organizationId',
    additionalChecks: async (resource, userId, userRole) => {
      // Only admins and organization owners can view financial data
      if (userRole === 'admin') return true;

      const org = await Organization.findByPk(resource.organizationId);
      if (!org) return false;

      if (org.ownerId === Number(userId)) return true;

      // Check organization membership with financial access permissions
      const membership = await OrganizationMember.findActiveMembership(
        Number(userId),
        resource.organizationId
      );

      if (membership && membership.canViewFinancialData()) {
        return true;
      }

      return false;
    },
  },
  [ResourceType.TRANSACTION]: {
    model: null, // Assuming transactions are handled differently
    ownerField: 'userId',
    additionalChecks: async (resource, userId, userRole) => {
      // Admins can view all transactions
      if (userRole === 'admin') return true;
      // Users can only view their own transactions
      return resource.userId === userId;
    },
  },
  [ResourceType.REPORT]: {
    model: null, // Reports might be generated dynamically
    ownerField: 'userId',
    additionalChecks: async (resource, userId, userRole) => {
      // Reports access depends on the report type
      if (userRole === 'admin') return true;
      // Check if user has access to the data being reported
      return resource.userId === userId || resource.createdBy === userId;
    },
  },
};

/**
 * Extract resource type from request path
 */
function extractResourceType(path: string): ResourceType | null {
  const pathSegments = path
    .toLowerCase()
    .split('/')
    .filter(s => s);

  // Map path segments to resource types
  const pathToResourceMap: Record<string, ResourceType> = {
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
export const checkResourceAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
      logger.warn('No ownership rule defined for resource type', { resourceType });
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
      } else {
        hasAccess = resource[rule.ownerField] === userId;
      }

      // Run additional checks if defined
      if (!hasAccess && rule.additionalChecks) {
        hasAccess = await rule.additionalChecks(resource, userId, userRole);
      }
    } else if (rule.additionalChecks) {
      // For resources without models, rely on additional checks
      hasAccess = await rule.additionalChecks({ id: resourceId }, userId, userRole);
    }

    if (!hasAccess) {
      logger.warn('IDOR attempt detected', {
        userId,
        resourceType,
        resourceId,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      // Record security event for monitoring and alerting
      await securityMonitoringService.recordEvent({
        type: SecurityEventType.IDOR_ATTEMPT,
        severity: SecurityEventSeverity.HIGH,
        source: 'resource_access_middleware',
        description: `IDOR attempt: User ${userId} tried to access ${resourceType} resource ${resourceId}`,
        metadata: {
          resourceType,
          resourceId,
          path: req.path,
          method: req.method,
          userAgent: req.get('user-agent'),
          referer: req.get('referer'),
        },
        userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
        method: req.method,
        resourceId,
      });

      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Attach resource to request for use in controller
    req.resource = resource;

    next();
  } catch (error) {
    logger.error('Resource access check error', { error, path: req.path });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can perform specific action on resource
 */
export const checkResourceAction = (allowedActions: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const action = req.method.toLowerCase();
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Map HTTP methods to actions
    const methodToAction: Record<string, string> = {
      get: 'read',
      post: 'create',
      put: 'update',
      patch: 'update',
      delete: 'delete',
    };

    const mappedAction = methodToAction[action] || action;

    // Check if action is allowed
    if (!allowedActions.includes(mappedAction)) {
      logger.warn('Unauthorized action attempt', {
        userId,
        action: mappedAction,
        allowedActions,
        path: req.path,
      });

      // Record security event for unauthorized action
      await securityMonitoringService.recordEvent({
        type: SecurityEventType.AUTHORIZATION_FAILURE,
        severity: SecurityEventSeverity.MEDIUM,
        source: 'resource_action_middleware',
        description: `Unauthorized action attempt: User ${userId} tried ${mappedAction} on ${req.path}`,
        metadata: {
          action: mappedAction,
          allowedActions,
          path: req.path,
          userAgent: req.get('user-agent'),
        },
        userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
        method: req.method,
      });

      _res.status(403).json({ error: 'Action not allowed' });
      return;
    }

    // Additional role-based checks
    if (mappedAction === 'delete' && userRole !== 'admin') {
      // Only admins can delete most resources
      const resourceType = extractResourceType(req.path);
      if (resourceType && ![ResourceType.GOAL, ResourceType.SESSION].includes(resourceType)) {
        // Record privilege escalation attempt
        await securityMonitoringService.recordEvent({
          type: SecurityEventType.PRIVILEGE_ESCALATION,
          severity: SecurityEventSeverity.HIGH,
          source: 'resource_action_middleware',
          description: `Privilege escalation attempt: Non-admin user ${userId} tried to delete ${resourceType}`,
          metadata: {
            action: mappedAction,
            resourceType,
            userRole,
            path: req.path,
          },
          userId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          endpoint: req.path,
          method: req.method,
        });

        _res.status(403).json({ error: 'Only administrators can delete this resource' });
        return;
      }
    }

    next();
  };
};

/**
 * Batch check for multiple resources
 */
export const checkBulkResourceAccess = async (
  userId: string,
  resourceIds: string[],
  resourceType: ResourceType
): Promise<Map<string, boolean>> => {
  const accessMap = new Map<string, boolean>();
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
      } else {
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
  } catch (error) {
    logger.error('Bulk resource access check error', { error, resourceType });
    resourceIds.forEach(id => accessMap.set(id, false));
    return accessMap;
  }
};

// Export for use in other parts of the application
export { ResourceType };
