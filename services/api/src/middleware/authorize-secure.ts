import { Request, Response, NextFunction } from 'express';
import { Op, QueryTypes } from 'sequelize';

import { sequelize } from '../models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { redis } from '../services/redis';

// Use enums instead of mathematical comparison for roles
export enum Role {
  MEMBER = 'member',
  LEAD = 'lead',
  MANAGER = 'manager',
  ADMIN = 'admin',
  OWNER = 'owner',
}

export enum ResourceType {
  ORGANIZATION = 'organization',
  TEAM = 'team',
  PROJECT = 'project',
}

// Explicit permission matrix - no mathematical comparisons
const PERMISSION_MATRIX: Record<Role, Set<string>> = {
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
    '*', // All permissions
  ]),
};

// Role inheritance - explicit mapping
const ROLE_INHERITANCE: Record<Role, Role[]> = {
  [Role.MEMBER]: [Role.MEMBER],
  [Role.LEAD]: [Role.MEMBER, Role.LEAD],
  [Role.MANAGER]: [Role.MEMBER, Role.LEAD, Role.MANAGER],
  [Role.ADMIN]: [Role.MEMBER, Role.LEAD, Role.MANAGER, Role.ADMIN],
  [Role.OWNER]: [Role.MEMBER, Role.LEAD, Role.MANAGER, Role.ADMIN, Role.OWNER],
};

interface AuthorizeOptions {
  resourceType: ResourceType;
  requiredRoles?: Role[];
  requiredPermissions?: string[];
  checkOwnership?: boolean;
  cacheResults?: boolean;
}

/**
 * Secure authorization middleware with parameterized queries
 */
export function authorize(options: AuthorizeOptions) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // Validate user ID format to prevent injection
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new AppError('Invalid user ID', 400);
      }

      const resourceId = extractResourceId(req, options.resourceType);
      if (!resourceId) {
        throw new AppError(`${options.resourceType} ID is required`, 400);
      }

      // Validate resource ID format
      if (!Number.isInteger(resourceId) || resourceId <= 0) {
        throw new AppError('Invalid resource ID', 400);
      }

      // Check cache first if enabled
      if (options.cacheResults) {
        const cacheKey = `auth:${userId}:${options.resourceType}:${resourceId}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          if (cachedData.authorized) {
            req.userRole = cachedData.role;
            req.userPermissions = cachedData.permissions;
            return next();
          }
        }
      }

      // Get user's role for the resource
      const userRole = await getUserRole(userId, options.resourceType, resourceId);

      if (!userRole) {
        logger.warn('Authorization failed: No role found', {
          userId,
          resourceType: options.resourceType,
          resourceId,
          path: req.path,
        });
        throw new AppError('Insufficient permissions', 403);
      }

      // Check role-based authorization
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        const hasRequiredRole = checkRoleAccess(userRole, options.requiredRoles);
        if (!hasRequiredRole) {
          logger.warn('Authorization failed: Insufficient role', {
            userId,
            userRole,
            requiredRoles: options.requiredRoles,
            path: req.path,
          });
          throw new AppError('Insufficient permissions', 403);
        }
      }

      // Check permission-based authorization
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasRequiredPermissions = checkPermissions(userRole, options.requiredPermissions);
        if (!hasRequiredPermissions) {
          logger.warn('Authorization failed: Missing permissions', {
            userId,
            userRole,
            requiredPermissions: options.requiredPermissions,
            path: req.path,
          });
          throw new AppError('Insufficient permissions', 403);
        }
      }

      // Check ownership if required
      if (options.checkOwnership) {
        const isOwner = await checkResourceOwnership(userId, options.resourceType, resourceId);
        if (!isOwner && userRole !== Role.OWNER && userRole !== Role.ADMIN) {
          logger.warn('Authorization failed: Not resource owner', {
            userId,
            resourceType: options.resourceType,
            resourceId,
            path: req.path,
          });
          throw new AppError('Resource access denied', 403);
        }
      }

      // Cache successful authorization if enabled
      if (options.cacheResults) {
        const cacheKey = `auth:${userId}:${options.resourceType}:${resourceId}`;
        const cacheData = {
          authorized: true,
          role: userRole,
          permissions: Array.from(getPermissionsForRole(userRole)),
          timestamp: Date.now(),
        };
        await redis.setEx(cacheKey, 300, JSON.stringify(cacheData)); // Cache for 5 minutes
      }

      // Attach role and permissions to request
      req.userRole = userRole;
      req.userPermissions = getPermissionsForRole(userRole);

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Extract resource ID from request with validation
 */
function extractResourceId(req: Request, resourceType: ResourceType): number | null {
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

/**
 * Get user's role for a specific resource using parameterized queries
 */
async function getUserRole(
  userId: number,
  resourceType: ResourceType,
  resourceId: number
): Promise<Role | null> {
  try {
    switch (resourceType) {
      case ResourceType.ORGANIZATION: {
        // Use Sequelize model or parameterized query
        const result = await sequelize.query<{ role: string }>(
          `SELECT role FROM organization_members
           WHERE organization_id = :resourceId
           AND user_id = :userId
           AND is_active = true
           LIMIT 1`,
          {
            replacements: { resourceId, userId },
            type: QueryTypes.SELECT,
          }
        );

        if (result.length > 0) {
          return result[0].role as Role;
        }
        break;
      }

      case ResourceType.TEAM: {
        // Check both team membership and organization membership
        const result = await sequelize.query<{ team_role: string; org_role: string }>(
          `SELECT
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
           LIMIT 1`,
          {
            replacements: { resourceId, userId },
            type: QueryTypes.SELECT,
          }
        );

        if (result.length > 0) {
          const { team_role, org_role } = result[0];

          // Return the higher role (organization role takes precedence)
          if (org_role && isHigherRole(org_role as Role, team_role as Role)) {
            return org_role as Role;
          }
          return team_role as Role;
        }
        break;
      }

      case ResourceType.PROJECT: {
        const result = await sequelize.query<{ role: string }>(
          `SELECT role FROM project_members
           WHERE project_id = :resourceId
           AND user_id = :userId
           AND is_active = true
           LIMIT 1`,
          {
            replacements: { resourceId, userId },
            type: QueryTypes.SELECT,
          }
        );

        if (result.length > 0) {
          return result[0].role as Role;
        }
        break;
      }
    }

    return null;
  } catch (error) {
    logger.error('Error fetching user role:', error);
    return null;
  }
}

/**
 * Check if user has any of the required roles
 */
function checkRoleAccess(userRole: Role, requiredRoles: Role[]): boolean {
  // Owner has all access
  if (userRole === Role.OWNER) {
    return true;
  }

  // Check if user's role or inherited roles match required roles
  const inheritedRoles = ROLE_INHERITANCE[userRole] || [userRole];
  return requiredRoles.some(required => inheritedRoles.includes(required));
}

/**
 * Check if user has required permissions
 */
function checkPermissions(userRole: Role, requiredPermissions: string[]): boolean {
  const userPermissions = getPermissionsForRole(userRole);

  // Check wildcard permission
  if (userPermissions.has('*')) {
    return true;
  }

  // Check if user has all required permissions
  return requiredPermissions.every(permission => userPermissions.has(permission));
}

/**
 * Get all permissions for a role (including inherited)
 */
function getPermissionsForRole(role: Role): Set<string> {
  const permissions = new Set<string>();

  const inheritedRoles = ROLE_INHERITANCE[role] || [role];

  for (const inheritedRole of inheritedRoles) {
    const rolePermissions = PERMISSION_MATRIX[inheritedRole];
    if (rolePermissions) {
      rolePermissions.forEach(p => permissions.add(p));
    }
  }

  return permissions;
}

/**
 * Check if one role is higher than another
 */
function isHigherRole(role1: Role, role2: Role): boolean {
  const order = [Role.MEMBER, Role.LEAD, Role.MANAGER, Role.ADMIN, Role.OWNER];
  return order.indexOf(role1) > order.indexOf(role2);
}

/**
 * Check resource ownership
 */
async function checkResourceOwnership(
  userId: number,
  resourceType: ResourceType,
  resourceId: number
): Promise<boolean> {
  try {
    switch (resourceType) {
      case ResourceType.ORGANIZATION: {
        const result = await sequelize.query<{ owner_id: number }>(
          `SELECT owner_id FROM organizations
           WHERE id = :resourceId`,
          {
            replacements: { resourceId },
            type: QueryTypes.SELECT,
          }
        );
        return result.length > 0 && result[0].owner_id === userId;
      }

      case ResourceType.TEAM: {
        const result = await sequelize.query<{ created_by: number }>(
          `SELECT created_by FROM teams
           WHERE id = :resourceId`,
          {
            replacements: { resourceId },
            type: QueryTypes.SELECT,
          }
        );
        return result.length > 0 && result[0].created_by === userId;
      }

      case ResourceType.PROJECT: {
        const result = await sequelize.query<{ owner_id: number }>(
          `SELECT owner_id FROM projects
           WHERE id = :resourceId`,
          {
            replacements: { resourceId },
            type: QueryTypes.SELECT,
          }
        );
        return result.length > 0 && result[0].owner_id === userId;
      }

      default:
        return false;
    }
  } catch (error) {
    logger.error('Error checking resource ownership:', error);
    return false;
  }
}

/**
 * Middleware to load user's context with caching
 */
export async function loadUserContext(req: Request, _res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next();
    }

    // Check cache first
    const cacheKey = `context:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const context = JSON.parse(cached);
      req.userContext = context;
      return next();
    }

    // Load user's organizations
    const organizations = await sequelize.query<{
      id: number;
      name: string;
      role: string;
    }>(
      `SELECT o.id, o.name, om.role
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = :userId AND om.is_active = true`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );

    // Load user's teams
    const teams = await sequelize.query<{
      id: number;
      name: string;
      role: string;
      organization_id: number;
    }>(
      `SELECT t.id, t.name, tm.role, t.organization_id
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = :userId AND tm.is_active = true`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );

    const context = {
      organizations,
      teams,
      timestamp: Date.now(),
    };

    // Cache for 10 minutes
    await redis.setEx(cacheKey, 600, JSON.stringify(context));

    req.userContext = context;
    next();
  } catch (error) {
    logger.error('Error loading user context:', error);
    next(); // Continue without context
  }
}

/**
 * Clear authorization cache for a user
 */
export async function clearAuthCache(userId: number): Promise<void> {
  try {
    const pattern = `auth:${userId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // Also clear context cache
    await redis.del(`context:${userId}`);

    logger.info(`Cleared auth cache for user ${userId}`);
  } catch (error) {
    logger.error('Error clearing auth cache:', error);
  }
}

// Export utility function for programmatic permission checking
export async function hasPermission(
  userId: number,
  resourceType: ResourceType,
  resourceId: number,
  permission: string
): Promise<boolean> {
  const role = await getUserRole(userId, resourceType, resourceId);

  if (!role) {
    return false;
  }

  const permissions = getPermissionsForRole(role);
  return permissions.has(permission) || permissions.has('*');
}