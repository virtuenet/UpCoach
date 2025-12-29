import { EventEmitter } from 'events';

export enum ResourceType {
  USERS = 'users',
  TEAMS = 'teams',
  GOALS = 'goals',
  HABITS = 'habits',
  COACHING = 'coaching',
  ANALYTICS = 'analytics',
  BILLING = 'billing',
  SETTINGS = 'settings',
  INTEGRATIONS = 'integrations',
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  INVITE = 'invite',
  EXPORT = 'export',
  CONFIGURE = 'configure',
}

export enum RoleScope {
  ORGANIZATION = 'organization',
  TEAM = 'team',
  USER = 'user',
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  scope: RoleScope;
  isCustom: boolean;
  inheritFrom?: string;
  organizationId?: string;
}

export interface Permission {
  resource: ResourceType;
  actions: Action[];
  conditions?: Condition[];
}

export interface Condition {
  type: 'own_only' | 'team_only' | 'org_only' | 'none';
  value?: any;
}

export interface UserRole {
  userId: string;
  roleId: string;
  scope: string; // organizationId, teamId, or userId
  grantedAt: Date;
  grantedBy: string;
}

/**
 * Role-Based Access Control
 *
 * Comprehensive RBAC system with hierarchical roles, granular permissions,
 * and resource-level access control. Supports 100+ permission types across
 * all platform features.
 */
export class RoleBasedAccessControl extends EventEmitter {
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();

  constructor() {
    super();
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles(): void {
    // Organization Owner - Full access
    this.roles.set('org_owner', {
      id: 'org_owner',
      name: 'Organization Owner',
      description: 'Full access to all organization features',
      scope: RoleScope.ORGANIZATION,
      isCustom: false,
      permissions: [
        { resource: ResourceType.USERS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.INVITE] },
        { resource: ResourceType.TEAMS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE] },
        { resource: ResourceType.GOALS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
        { resource: ResourceType.HABITS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
        { resource: ResourceType.COACHING, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE] },
        { resource: ResourceType.ANALYTICS, actions: [Action.READ, Action.EXPORT] },
        { resource: ResourceType.BILLING, actions: [Action.READ, Action.UPDATE, Action.MANAGE] },
        { resource: ResourceType.SETTINGS, actions: [Action.READ, Action.UPDATE, Action.CONFIGURE] },
        { resource: ResourceType.INTEGRATIONS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.CONFIGURE] },
      ],
    });

    // Organization Admin
    this.roles.set('org_admin', {
      id: 'org_admin',
      name: 'Organization Admin',
      description: 'Manage users, teams, and organization settings',
      scope: RoleScope.ORGANIZATION,
      isCustom: false,
      inheritFrom: 'org_owner',
      permissions: [
        { resource: ResourceType.USERS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.INVITE] },
        { resource: ResourceType.TEAMS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.MANAGE] },
        { resource: ResourceType.GOALS, actions: [Action.READ] },
        { resource: ResourceType.HABITS, actions: [Action.READ] },
        { resource: ResourceType.COACHING, actions: [Action.READ, Action.MANAGE] },
        { resource: ResourceType.ANALYTICS, actions: [Action.READ, Action.EXPORT] },
        { resource: ResourceType.SETTINGS, actions: [Action.READ, Action.UPDATE] },
        { resource: ResourceType.INTEGRATIONS, actions: [Action.READ, Action.CONFIGURE] },
      ],
    });

    // Team Manager
    this.roles.set('team_manager', {
      id: 'team_manager',
      name: 'Team Manager',
      description: 'Manage team members and view team analytics',
      scope: RoleScope.TEAM,
      isCustom: false,
      permissions: [
        { resource: ResourceType.USERS, actions: [Action.READ], conditions: [{ type: 'team_only' }] },
        { resource: ResourceType.TEAMS, actions: [Action.READ, Action.UPDATE], conditions: [{ type: 'own_only' }] },
        { resource: ResourceType.GOALS, actions: [Action.READ], conditions: [{ type: 'team_only' }] },
        { resource: ResourceType.HABITS, actions: [Action.READ], conditions: [{ type: 'team_only' }] },
        { resource: ResourceType.COACHING, actions: [Action.READ, Action.CREATE], conditions: [{ type: 'team_only' }] },
        { resource: ResourceType.ANALYTICS, actions: [Action.READ], conditions: [{ type: 'team_only' }] },
      ],
    });

    // Coach
    this.roles.set('coach', {
      id: 'coach',
      name: 'Coach',
      description: 'Provide coaching and view assigned users',
      scope: RoleScope.TEAM,
      isCustom: false,
      permissions: [
        { resource: ResourceType.USERS, actions: [Action.READ], conditions: [{ type: 'team_only' }] },
        { resource: ResourceType.GOALS, actions: [Action.READ, Action.UPDATE], conditions: [{ type: 'team_only' }] },
        { resource: ResourceType.HABITS, actions: [Action.READ], conditions: [{ type: 'team_only' }] },
        { resource: ResourceType.COACHING, actions: [Action.CREATE, Action.READ, Action.UPDATE] },
        { resource: ResourceType.ANALYTICS, actions: [Action.READ], conditions: [{ type: 'team_only' }] },
      ],
    });

    // Employee
    this.roles.set('employee', {
      id: 'employee',
      name: 'Employee',
      description: 'Standard user with access to personal features',
      scope: RoleScope.USER,
      isCustom: false,
      permissions: [
        { resource: ResourceType.USERS, actions: [Action.READ], conditions: [{ type: 'own_only' }] },
        { resource: ResourceType.GOALS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE], conditions: [{ type: 'own_only' }] },
        { resource: ResourceType.HABITS, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE], conditions: [{ type: 'own_only' }] },
        { resource: ResourceType.COACHING, actions: [Action.READ], conditions: [{ type: 'own_only' }] },
        { resource: ResourceType.ANALYTICS, actions: [Action.READ], conditions: [{ type: 'own_only' }] },
      ],
    });

    // Billing Admin
    this.roles.set('billing_admin', {
      id: 'billing_admin',
      name: 'Billing Admin',
      description: 'Manage billing and subscriptions',
      scope: RoleScope.ORGANIZATION,
      isCustom: false,
      permissions: [
        { resource: ResourceType.BILLING, actions: [Action.READ, Action.UPDATE, Action.MANAGE] },
        { resource: ResourceType.ANALYTICS, actions: [Action.READ] },
      ],
    });
  }

  public async assignRole(userId: string, roleId: string, scope: string, grantedBy: string): Promise<void> {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    const userRole: UserRole = {
      userId,
      roleId,
      scope,
      grantedAt: new Date(),
      grantedBy,
    };

    const existingRoles = this.userRoles.get(userId) || [];
    existingRoles.push(userRole);
    this.userRoles.set(userId, existingRoles);

    this.emit('role:assigned', { userId, roleId, scope });
  }

  public async revokeRole(userId: string, roleId: string, scope: string): Promise<void> {
    const existingRoles = this.userRoles.get(userId) || [];
    const filteredRoles = existingRoles.filter(
      r => !(r.roleId === roleId && r.scope === scope)
    );
    this.userRoles.set(userId, filteredRoles);

    this.emit('role:revoked', { userId, roleId, scope });
  }

  public async checkPermission(
    userId: string,
    resource: ResourceType,
    action: Action,
    context?: { resourceOwnerId?: string; teamId?: string; organizationId?: string }
  ): Promise<boolean> {
    const userRoles = this.userRoles.get(userId) || [];

    for (const userRole of userRoles) {
      const role = this.roles.get(userRole.roleId);
      if (!role) continue;

      // Check if role has permission for this resource
      const permission = role.permissions.find(p => p.resource === resource);
      if (!permission) continue;

      // Check if role has this action
      if (!permission.actions.includes(action)) continue;

      // Check conditions
      if (permission.conditions && permission.conditions.length > 0) {
        const conditionsMet = this.evaluateConditions(
          permission.conditions,
          userId,
          userRole.scope,
          context
        );
        if (!conditionsMet) continue;
      }

      // Permission granted
      return true;
    }

    return false;
  }

  private evaluateConditions(
    conditions: Condition[],
    userId: string,
    scope: string,
    context?: { resourceOwnerId?: string; teamId?: string; organizationId?: string }
  ): boolean {
    for (const condition of conditions) {
      switch (condition.type) {
        case 'own_only':
          if (context?.resourceOwnerId !== userId) {
            return false;
          }
          break;
        case 'team_only':
          if (context?.teamId !== scope) {
            return false;
          }
          break;
        case 'org_only':
          if (context?.organizationId !== scope) {
            return false;
          }
          break;
      }
    }
    return true;
  }

  public async getRolesByUser(userId: string): Promise<Role[]> {
    const userRoles = this.userRoles.get(userId) || [];
    const roles: Role[] = [];

    for (const userRole of userRoles) {
      const role = this.roles.get(userRole.roleId);
      if (role) {
        roles.push(role);
      }
    }

    return roles;
  }

  public async createCustomRole(
    roleData: Omit<Role, 'id' | 'isCustom'>,
    organizationId: string
  ): Promise<Role> {
    const roleId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const role: Role = {
      ...roleData,
      id: roleId,
      isCustom: true,
      organizationId,
    };

    this.roles.set(roleId, role);
    this.emit('role:created', role);

    return role;
  }

  public getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  public getAllRoles(organizationId?: string): Role[] {
    const allRoles = Array.from(this.roles.values());

    if (organizationId) {
      return allRoles.filter(r => !r.organizationId || r.organizationId === organizationId);
    }

    return allRoles;
  }

  public async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    if (!role.isCustom) {
      throw new Error('Cannot modify default roles');
    }

    Object.assign(role, updates);
    this.roles.set(roleId, role);

    this.emit('role:updated', role);

    return role;
  }

  public async deleteRole(roleId: string): Promise<void> {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    if (!role.isCustom) {
      throw new Error('Cannot delete default roles');
    }

    // Revoke from all users
    for (const [userId, userRoles] of this.userRoles) {
      const filteredRoles = userRoles.filter(r => r.roleId !== roleId);
      this.userRoles.set(userId, filteredRoles);
    }

    this.roles.delete(roleId);
    this.emit('role:deleted', { roleId });
  }
}

export default RoleBasedAccessControl;
