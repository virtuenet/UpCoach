import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sequelize } from '../models';
import { logger } from '../utils/logger';

export type ResourceType = 'organization' | 'team' | 'project';
export type Role = 'member' | 'lead' | 'manager' | 'admin' | 'owner';

const roleHierarchy: Record<Role, number> = {
  member: 1,
  lead: 2,
  manager: 3,
  admin: 4,
  owner: 5,
};

export function authorize(resourceType: ResourceType, requiredRole: Role | Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const minRoleLevel = Math.min(...requiredRoles.map(role => roleHierarchy[role]));

      let hasPermission = false;

      switch (resourceType) {
        case 'organization': {
          const organizationId = req.params.organizationId || req.body.organizationId;
          if (!organizationId) {
            throw new AppError('Organization ID is required', 400);
          }

          const [membership] = await sequelize.query(
            `SELECT role FROM organization_members
             WHERE organization_id = :organizationId 
             AND user_id = :userId 
             AND is_active = true`,
            {
              replacements: { organizationId, userId },
            }
          );

          if (membership.length > 0) {
            const membershipRow = membership[0] as any;
            const userRole = membershipRow.role as Role;
            const userRoleLevel = roleHierarchy[userRole];
            hasPermission = userRoleLevel >= minRoleLevel;
          }
          break;
        }

        case 'team': {
          const teamId = req.params.teamId || req.body.teamId;
          if (!teamId) {
            throw new AppError('Team ID is required', 400);
          }

          // Check team membership
          const [teamMembership] = await sequelize.query(
            `SELECT tm.role as team_role, om.role as org_role
             FROM team_members tm
             JOIN teams t ON tm.team_id = t.id
             JOIN organization_members om ON t.organization_id = om.organization_id AND om.user_id = tm.user_id
             WHERE tm.team_id = :teamId 
             AND tm.user_id = :userId 
             AND tm.is_active = true`,
            {
              replacements: { teamId, userId },
            }
          );

          if (teamMembership.length > 0) {
            const membershipRow = teamMembership[0] as any;
            const teamRole = membershipRow.team_role as Role;
            const orgRole = membershipRow.org_role as Role;
            
            // Check if user has sufficient team role or organization role
            const teamRoleLevel = roleHierarchy[teamRole];
            const orgRoleLevel = roleHierarchy[orgRole];
            
            hasPermission = teamRoleLevel >= minRoleLevel || orgRoleLevel >= minRoleLevel;
          }
          break;
        }

        default:
          throw new AppError(`Unknown resource type: ${resourceType}`, 500);
      }

      if (!hasPermission) {
        logger.warn('Authorization failed', {
          userId,
          resourceType,
          requiredRole,
          path: req.path,
        });
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Utility function to check permissions programmatically
export async function checkPermission(
  userId: number,
  resourceType: ResourceType,
  resourceId: number,
  requiredRole: Role
): Promise<boolean> {
  const minRoleLevel = roleHierarchy[requiredRole];

  switch (resourceType) {
    case 'organization': {
      const [membership] = await sequelize.query(
        `SELECT role FROM organization_members
         WHERE organization_id = :resourceId 
         AND user_id = :userId 
         AND is_active = true`,
        {
          replacements: { resourceId, userId },
        }
      );

      if (membership.length > 0) {
        const membershipRow = membership[0] as any;
        const userRole = membershipRow.role as Role;
        return roleHierarchy[userRole] >= minRoleLevel;
      }
      break;
    }

    case 'team': {
      const [membership] = await sequelize.query(
        `SELECT role FROM team_members
         WHERE team_id = :resourceId 
         AND user_id = :userId 
         AND is_active = true`,
        {
          replacements: { resourceId, userId },
        }
      );

      if (membership.length > 0) {
        const membershipRow = membership[0] as any;
        const userRole = membershipRow.role as Role;
        return roleHierarchy[userRole] >= minRoleLevel;
      }
      break;
    }
  }

  return false;
}

// Middleware to load user's organization context
export async function loadOrganizationContext(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return next();
    }

    const [organizations] = await sequelize.query(
      `SELECT o.*, om.role
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = :userId AND om.is_active = true`,
      {
        replacements: { userId },
      }
    );

    if (organizations.length > 0) {
      const org = organizations[0] as any;
      req.organization = org;
      req.organizationRole = org.role;
    }

    next();
  } catch (error) {
    next(error);
  }
}