/**
 * Role-Based Access Control (RBAC) Service
 *
 * Fine-grained permission management with roles, permissions,
 * resource policies, and hierarchical access control.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// Permission Action
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'manage' | '*';

// Resource Type
export type ResourceType =
  | 'user'
  | 'habit'
  | 'goal'
  | 'task'
  | 'mood'
  | 'journal'
  | 'chat'
  | 'coaching_session'
  | 'payment'
  | 'subscription'
  | 'analytics'
  | 'admin'
  | 'system'
  | 'ai'
  | 'content'
  | 'forum'
  | 'challenge'
  | '*';

// Permission
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: ResourceType;
  actions: PermissionAction[];
  conditions?: PermissionCondition[];
  createdAt: number;
  updatedAt: number;
}

// Permission Condition
export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
  value: unknown;
}

// Role
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  inherits?: string[]; // Role IDs to inherit from
  priority: number;
  isSystem: boolean;
  isDefault: boolean;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

// User Role Assignment
export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  grantedBy: string;
  grantedAt: number;
  expiresAt?: number;
  scope?: string; // Organization/team scope
  conditions?: PermissionCondition[];
}

// Resource Policy
export interface ResourcePolicy {
  id: string;
  name: string;
  description: string;
  resource: ResourceType;
  resourceId?: string; // Specific resource ID
  effect: 'allow' | 'deny';
  principals: string[]; // User IDs or role IDs
  actions: PermissionAction[];
  conditions?: PermissionCondition[];
  priority: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// Access Request
export interface AccessRequest {
  userId: string;
  resource: ResourceType;
  resourceId?: string;
  action: PermissionAction;
  context: Record<string, unknown>;
}

// Access Decision
export interface AccessDecision {
  allowed: boolean;
  reason: string;
  matchedPolicy?: string;
  matchedRole?: string;
  matchedPermission?: string;
  evaluatedAt: number;
}

// RBAC Stats
export interface RBACStats {
  totalRoles: number;
  totalPermissions: number;
  totalPolicies: number;
  totalAssignments: number;
  accessChecksToday: number;
  deniedAccessToday: number;
}

export class RBACService extends EventEmitter {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private policies: Map<string, ResourcePolicy> = new Map();
  private userAssignments: Map<string, UserRoleAssignment[]> = new Map();
  private accessLogs: { timestamp: number; allowed: boolean }[] = [];

  constructor() {
    super();
    this.initializeDefaultRolesAndPermissions();
  }

  /**
   * Initialize default roles and permissions
   */
  private initializeDefaultRolesAndPermissions(): void {
    // Create default permissions
    const defaultPermissions: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // User permissions
      { name: 'user:read:own', description: 'Read own user profile', resource: 'user', actions: ['read'] },
      { name: 'user:update:own', description: 'Update own user profile', resource: 'user', actions: ['update'] },
      { name: 'user:read:any', description: 'Read any user profile', resource: 'user', actions: ['read'] },
      { name: 'user:manage', description: 'Full user management', resource: 'user', actions: ['*'] },

      // Habit permissions
      { name: 'habit:manage:own', description: 'Manage own habits', resource: 'habit', actions: ['*'] },
      { name: 'habit:read:any', description: 'Read any habits', resource: 'habit', actions: ['read'] },

      // Goal permissions
      { name: 'goal:manage:own', description: 'Manage own goals', resource: 'goal', actions: ['*'] },
      { name: 'goal:read:any', description: 'Read any goals', resource: 'goal', actions: ['read'] },

      // Task permissions
      { name: 'task:manage:own', description: 'Manage own tasks', resource: 'task', actions: ['*'] },

      // Coaching permissions
      { name: 'coaching:conduct', description: 'Conduct coaching sessions', resource: 'coaching_session', actions: ['create', 'read', 'update'] },
      { name: 'coaching:receive', description: 'Receive coaching', resource: 'coaching_session', actions: ['read', 'create'] },

      // AI permissions
      { name: 'ai:chat', description: 'Use AI chat', resource: 'ai', actions: ['execute'] },
      { name: 'ai:advanced', description: 'Advanced AI features', resource: 'ai', actions: ['*'] },

      // Analytics permissions
      { name: 'analytics:view:own', description: 'View own analytics', resource: 'analytics', actions: ['read'] },
      { name: 'analytics:view:any', description: 'View any analytics', resource: 'analytics', actions: ['read'] },
      { name: 'analytics:export', description: 'Export analytics', resource: 'analytics', actions: ['read', 'execute'] },

      // Admin permissions
      { name: 'admin:dashboard', description: 'Access admin dashboard', resource: 'admin', actions: ['read'] },
      { name: 'admin:users', description: 'Manage users', resource: 'admin', actions: ['*'] },
      { name: 'admin:content', description: 'Manage content', resource: 'admin', actions: ['*'] },
      { name: 'admin:system', description: 'System administration', resource: 'admin', actions: ['*'] },

      // Payment permissions
      { name: 'payment:manage:own', description: 'Manage own payments', resource: 'payment', actions: ['read', 'create'] },
      { name: 'payment:manage:any', description: 'Manage any payments', resource: 'payment', actions: ['*'] },

      // Content permissions
      { name: 'content:create', description: 'Create content', resource: 'content', actions: ['create'] },
      { name: 'content:moderate', description: 'Moderate content', resource: 'content', actions: ['read', 'update', 'delete'] },

      // Forum permissions
      { name: 'forum:post', description: 'Post in forums', resource: 'forum', actions: ['create', 'read'] },
      { name: 'forum:moderate', description: 'Moderate forums', resource: 'forum', actions: ['*'] },

      // Challenge permissions
      { name: 'challenge:participate', description: 'Participate in challenges', resource: 'challenge', actions: ['read', 'update'] },
      { name: 'challenge:create', description: 'Create challenges', resource: 'challenge', actions: ['create', 'read', 'update'] },
      { name: 'challenge:manage', description: 'Manage challenges', resource: 'challenge', actions: ['*'] },

      // System permissions
      { name: 'system:configure', description: 'System configuration', resource: 'system', actions: ['*'] },
      { name: 'system:monitor', description: 'System monitoring', resource: 'system', actions: ['read'] },
    ];

    for (const perm of defaultPermissions) {
      const permission = this.createPermission(perm.name, perm.description, perm.resource, perm.actions);
      permission.conditions = perm.conditions;
    }

    // Create default roles
    const defaultRoles: Array<{
      name: string;
      description: string;
      permissions: string[];
      priority: number;
      isDefault?: boolean;
    }> = [
      {
        name: 'user',
        description: 'Standard user',
        permissions: [
          'user:read:own',
          'user:update:own',
          'habit:manage:own',
          'goal:manage:own',
          'task:manage:own',
          'coaching:receive',
          'ai:chat',
          'analytics:view:own',
          'payment:manage:own',
          'forum:post',
          'challenge:participate',
        ],
        priority: 10,
        isDefault: true,
      },
      {
        name: 'premium_user',
        description: 'Premium subscriber',
        permissions: [
          'ai:advanced',
          'analytics:export',
        ],
        priority: 20,
      },
      {
        name: 'coach',
        description: 'Certified coach',
        permissions: [
          'coaching:conduct',
          'content:create',
          'user:read:any',
          'habit:read:any',
          'goal:read:any',
          'analytics:view:any',
          'challenge:create',
        ],
        priority: 30,
      },
      {
        name: 'moderator',
        description: 'Content moderator',
        permissions: [
          'content:moderate',
          'forum:moderate',
          'user:read:any',
        ],
        priority: 40,
      },
      {
        name: 'admin',
        description: 'Administrator',
        permissions: [
          'admin:dashboard',
          'admin:users',
          'admin:content',
          'payment:manage:any',
          'challenge:manage',
          'system:monitor',
        ],
        priority: 50,
      },
      {
        name: 'super_admin',
        description: 'Super administrator',
        permissions: [
          'admin:system',
          'system:configure',
        ],
        priority: 100,
      },
    ];

    // Create roles with inheritance
    const userRole = this.createRole('user', defaultRoles[0].description, defaultRoles[0].permissions, defaultRoles[0].priority);
    userRole.isDefault = true;

    const premiumRole = this.createRole('premium_user', defaultRoles[1].description, defaultRoles[1].permissions, defaultRoles[1].priority);
    premiumRole.inherits = ['user'];

    const coachRole = this.createRole('coach', defaultRoles[2].description, defaultRoles[2].permissions, defaultRoles[2].priority);
    coachRole.inherits = ['premium_user'];

    const moderatorRole = this.createRole('moderator', defaultRoles[3].description, defaultRoles[3].permissions, defaultRoles[3].priority);
    moderatorRole.inherits = ['user'];

    const adminRole = this.createRole('admin', defaultRoles[4].description, defaultRoles[4].permissions, defaultRoles[4].priority);
    adminRole.inherits = ['moderator', 'coach'];

    const superAdminRole = this.createRole('super_admin', defaultRoles[5].description, defaultRoles[5].permissions, defaultRoles[5].priority);
    superAdminRole.inherits = ['admin'];
  }

  /**
   * Create permission
   */
  createPermission(
    name: string,
    description: string,
    resource: ResourceType,
    actions: PermissionAction[]
  ): Permission {
    const now = Date.now();
    const permission: Permission = {
      id: `perm_${crypto.randomBytes(8).toString('hex')}`,
      name,
      description,
      resource,
      actions,
      createdAt: now,
      updatedAt: now,
    };

    this.permissions.set(permission.id, permission);
    this.permissions.set(permission.name, permission); // Also index by name

    this.emit('permission-created', permission);

    return permission;
  }

  /**
   * Get permission by ID or name
   */
  getPermission(idOrName: string): Permission | null {
    return this.permissions.get(idOrName) || null;
  }

  /**
   * Create role
   */
  createRole(
    name: string,
    description: string,
    permissionIds: string[],
    priority: number = 10
  ): Role {
    const now = Date.now();

    // Resolve permission names to IDs
    const resolvedPermissionIds = permissionIds.map((p) => {
      const perm = this.permissions.get(p);
      return perm ? perm.id : p;
    });

    const role: Role = {
      id: `role_${crypto.randomBytes(8).toString('hex')}`,
      name,
      description,
      permissions: resolvedPermissionIds,
      priority,
      isSystem: false,
      isDefault: false,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    this.roles.set(role.id, role);
    this.roles.set(role.name, role); // Also index by name

    this.emit('role-created', role);

    return role;
  }

  /**
   * Get role by ID or name
   */
  getRole(idOrName: string): Role | null {
    return this.roles.get(idOrName) || null;
  }

  /**
   * Get all roles
   */
  getAllRoles(): Role[] {
    const seen = new Set<string>();
    const roles: Role[] = [];

    for (const role of this.roles.values()) {
      if (!seen.has(role.id)) {
        seen.add(role.id);
        roles.push(role);
      }
    }

    return roles.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Update role
   */
  updateRole(roleId: string, updates: Partial<Omit<Role, 'id' | 'createdAt'>>): Role | null {
    const role = this.roles.get(roleId);
    if (!role) return null;

    Object.assign(role, updates, { updatedAt: Date.now() });

    this.emit('role-updated', role);

    return role;
  }

  /**
   * Delete role
   */
  deleteRole(roleId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role || role.isSystem) return false;

    this.roles.delete(roleId);
    this.roles.delete(role.name);

    // Remove assignments
    for (const [userId, assignments] of this.userAssignments) {
      const filtered = assignments.filter((a) => a.roleId !== roleId);
      this.userAssignments.set(userId, filtered);
    }

    this.emit('role-deleted', { roleId, name: role.name });

    return true;
  }

  /**
   * Assign role to user
   */
  assignRole(
    userId: string,
    roleId: string,
    grantedBy: string,
    expiresAt?: number,
    scope?: string,
    conditions?: PermissionCondition[]
  ): UserRoleAssignment {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    const assignment: UserRoleAssignment = {
      userId,
      roleId: role.id,
      grantedBy,
      grantedAt: Date.now(),
      expiresAt,
      scope,
      conditions,
    };

    let assignments = this.userAssignments.get(userId);
    if (!assignments) {
      assignments = [];
      this.userAssignments.set(userId, assignments);
    }

    // Remove existing assignment for same role if exists
    const existingIndex = assignments.findIndex((a) => a.roleId === role.id);
    if (existingIndex !== -1) {
      assignments.splice(existingIndex, 1);
    }

    assignments.push(assignment);

    this.emit('role-assigned', { userId, roleId: role.id, roleName: role.name });

    return assignment;
  }

  /**
   * Revoke role from user
   */
  revokeRole(userId: string, roleId: string): boolean {
    const assignments = this.userAssignments.get(userId);
    if (!assignments) return false;

    const role = this.roles.get(roleId);
    const roleIdToRevoke = role?.id || roleId;

    const index = assignments.findIndex((a) => a.roleId === roleIdToRevoke);
    if (index === -1) return false;

    assignments.splice(index, 1);

    this.emit('role-revoked', { userId, roleId: roleIdToRevoke });

    return true;
  }

  /**
   * Get user roles
   */
  getUserRoles(userId: string): Role[] {
    const assignments = this.userAssignments.get(userId) || [];
    const now = Date.now();

    // Filter out expired assignments
    const validAssignments = assignments.filter((a) => !a.expiresAt || a.expiresAt > now);

    const roles: Role[] = [];
    for (const assignment of validAssignments) {
      const role = this.roles.get(assignment.roleId);
      if (role) {
        roles.push(role);
      }
    }

    // Add default role if user has no roles
    if (roles.length === 0) {
      const defaultRole = Array.from(this.roles.values()).find((r) => r.isDefault);
      if (defaultRole) {
        roles.push(defaultRole);
      }
    }

    return roles;
  }

  /**
   * Get all permissions for a user (including inherited)
   */
  getUserPermissions(userId: string): Permission[] {
    const roles = this.getUserRoles(userId);
    const permissionIds = new Set<string>();

    const collectPermissions = (role: Role): void => {
      for (const permId of role.permissions) {
        permissionIds.add(permId);
      }

      // Collect inherited permissions
      if (role.inherits) {
        for (const inheritedRoleId of role.inherits) {
          const inheritedRole = this.roles.get(inheritedRoleId);
          if (inheritedRole) {
            collectPermissions(inheritedRole);
          }
        }
      }
    };

    for (const role of roles) {
      collectPermissions(role);
    }

    const permissions: Permission[] = [];
    for (const permId of permissionIds) {
      const perm = this.permissions.get(permId);
      if (perm) {
        permissions.push(perm);
      }
    }

    return permissions;
  }

  /**
   * Create resource policy
   */
  createPolicy(
    name: string,
    description: string,
    resource: ResourceType,
    effect: 'allow' | 'deny',
    principals: string[],
    actions: PermissionAction[],
    options?: {
      resourceId?: string;
      conditions?: PermissionCondition[];
      priority?: number;
    }
  ): ResourcePolicy {
    const now = Date.now();
    const policy: ResourcePolicy = {
      id: `policy_${crypto.randomBytes(8).toString('hex')}`,
      name,
      description,
      resource,
      resourceId: options?.resourceId,
      effect,
      principals,
      actions,
      conditions: options?.conditions,
      priority: options?.priority || 50,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(policy.id, policy);

    this.emit('policy-created', policy);

    return policy;
  }

  /**
   * Get policy
   */
  getPolicy(policyId: string): ResourcePolicy | null {
    return this.policies.get(policyId) || null;
  }

  /**
   * Get all policies
   */
  getAllPolicies(): ResourcePolicy[] {
    return Array.from(this.policies.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Update policy
   */
  updatePolicy(policyId: string, updates: Partial<Omit<ResourcePolicy, 'id' | 'createdAt'>>): ResourcePolicy | null {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    Object.assign(policy, updates, { updatedAt: Date.now() });

    this.emit('policy-updated', policy);

    return policy;
  }

  /**
   * Delete policy
   */
  deletePolicy(policyId: string): boolean {
    const policy = this.policies.get(policyId);
    if (!policy) return false;

    this.policies.delete(policyId);

    this.emit('policy-deleted', { policyId, name: policy.name });

    return true;
  }

  /**
   * Check access
   */
  checkAccess(request: AccessRequest): AccessDecision {
    const startTime = Date.now();

    // First check explicit policies (deny takes precedence)
    const policyDecision = this.evaluatePolicies(request);
    if (policyDecision) {
      this.logAccessCheck(policyDecision.allowed);
      return policyDecision;
    }

    // Then check role-based permissions
    const permissions = this.getUserPermissions(request.userId);

    for (const permission of permissions) {
      if (this.permissionMatches(permission, request)) {
        const decision: AccessDecision = {
          allowed: true,
          reason: `Permission granted via ${permission.name}`,
          matchedPermission: permission.id,
          evaluatedAt: startTime,
        };

        this.logAccessCheck(true);
        return decision;
      }
    }

    // Default deny
    const decision: AccessDecision = {
      allowed: false,
      reason: 'No matching permission found',
      evaluatedAt: startTime,
    };

    this.logAccessCheck(false);
    return decision;
  }

  /**
   * Evaluate policies
   */
  private evaluatePolicies(request: AccessRequest): AccessDecision | null {
    const applicablePolicies = Array.from(this.policies.values())
      .filter((p) => p.enabled)
      .filter((p) => p.resource === request.resource || p.resource === '*')
      .filter((p) => !p.resourceId || p.resourceId === request.resourceId)
      .filter((p) => p.actions.includes(request.action) || p.actions.includes('*'))
      .sort((a, b) => b.priority - a.priority);

    for (const policy of applicablePolicies) {
      // Check if user is a principal
      const isPrincipal =
        policy.principals.includes(request.userId) ||
        policy.principals.includes('*') ||
        this.getUserRoles(request.userId).some((r) => policy.principals.includes(r.id));

      if (!isPrincipal) continue;

      // Evaluate conditions
      if (policy.conditions && !this.evaluateConditions(policy.conditions, request.context)) {
        continue;
      }

      return {
        allowed: policy.effect === 'allow',
        reason: `${policy.effect === 'allow' ? 'Allowed' : 'Denied'} by policy: ${policy.name}`,
        matchedPolicy: policy.id,
        evaluatedAt: Date.now(),
      };
    }

    return null;
  }

  /**
   * Check if permission matches request
   */
  private permissionMatches(permission: Permission, request: AccessRequest): boolean {
    // Check resource
    if (permission.resource !== request.resource && permission.resource !== '*') {
      return false;
    }

    // Check action
    if (!permission.actions.includes(request.action) && !permission.actions.includes('*')) {
      return false;
    }

    // Check conditions
    if (permission.conditions && !this.evaluateConditions(permission.conditions, request.context)) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(conditions: PermissionCondition[], context: Record<string, unknown>): boolean {
    for (const condition of conditions) {
      const value = context[condition.field];

      switch (condition.operator) {
        case 'eq':
          if (value !== condition.value) return false;
          break;
        case 'ne':
          if (value === condition.value) return false;
          break;
        case 'gt':
          if (typeof value !== 'number' || value <= (condition.value as number)) return false;
          break;
        case 'gte':
          if (typeof value !== 'number' || value < (condition.value as number)) return false;
          break;
        case 'lt':
          if (typeof value !== 'number' || value >= (condition.value as number)) return false;
          break;
        case 'lte':
          if (typeof value !== 'number' || value > (condition.value as number)) return false;
          break;
        case 'in':
          if (!Array.isArray(condition.value) || !condition.value.includes(value)) return false;
          break;
        case 'nin':
          if (!Array.isArray(condition.value) || condition.value.includes(value)) return false;
          break;
        case 'contains':
          if (typeof value !== 'string' || !value.includes(condition.value as string)) return false;
          break;
        case 'regex':
          if (typeof value !== 'string' || !new RegExp(condition.value as string).test(value)) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Log access check
   */
  private logAccessCheck(allowed: boolean): void {
    this.accessLogs.push({ timestamp: Date.now(), allowed });

    // Keep last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.accessLogs = this.accessLogs.filter((l) => l.timestamp > oneDayAgo);
  }

  /**
   * Check if user has role
   */
  hasRole(userId: string, roleName: string): boolean {
    const roles = this.getUserRoles(userId);
    return roles.some((r) => r.name === roleName || r.id === roleName);
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId: string, permissionName: string): boolean {
    const permissions = this.getUserPermissions(userId);
    return permissions.some((p) => p.name === permissionName || p.id === permissionName);
  }

  /**
   * Can user perform action on resource
   */
  can(userId: string, action: PermissionAction, resource: ResourceType, context?: Record<string, unknown>): boolean {
    const decision = this.checkAccess({
      userId,
      resource,
      action,
      context: context || {},
    });

    return decision.allowed;
  }

  /**
   * Get statistics
   */
  getStats(): RBACStats {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayLogs = this.accessLogs.filter((l) => l.timestamp >= todayStart);

    // Count unique roles and permissions
    const uniqueRoles = new Set<string>();
    const uniquePermissions = new Set<string>();

    for (const role of this.roles.values()) {
      uniqueRoles.add(role.id);
    }

    for (const perm of this.permissions.values()) {
      uniquePermissions.add(perm.id);
    }

    let totalAssignments = 0;
    for (const assignments of this.userAssignments.values()) {
      totalAssignments += assignments.length;
    }

    return {
      totalRoles: uniqueRoles.size,
      totalPermissions: uniquePermissions.size,
      totalPolicies: this.policies.size,
      totalAssignments,
      accessChecksToday: todayLogs.length,
      deniedAccessToday: todayLogs.filter((l) => !l.allowed).length,
    };
  }
}

// Singleton instance
let rbacService: RBACService | null = null;

export function getRBACService(): RBACService {
  if (!rbacService) {
    rbacService = new RBACService();
  }
  return rbacService;
}

export default RBACService;
