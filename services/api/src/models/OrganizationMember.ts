import { Model, DataTypes, Sequelize, Association } from 'sequelize';

import type { Organization } from './Organization';
import type { User } from './User';

export interface OrganizationMemberAttributes {
  id?: number;
  organizationId: number;
  userId: number;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  permissions?: string[];
  joinedAt?: Date;
  invitedBy?: number;
  metadata?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OrganizationMember extends Model<OrganizationMemberAttributes> implements OrganizationMemberAttributes {
  declare id: number;
  public organizationId!: number;
  public userId!: number;
  public role!: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  public status!: 'active' | 'inactive' | 'pending' | 'suspended';
  public permissions?: string[];
  public joinedAt?: Date;
  public invitedBy?: number;
  public metadata?: unknown;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly organization?: Organization;
  public readonly user?: User;
  public readonly inviter?: User;

  public static associations: {
    organization: Association<OrganizationMember, Organization>;
    user: Association<OrganizationMember, User>;
    inviter: Association<OrganizationMember, User>;
  };

  public static initModel(sequelize: Sequelize): typeof OrganizationMember {
    OrganizationMember.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        organizationId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'organization_id',
          references: {
            model: 'organizations',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'user_id',
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        role: {
          type: DataTypes.ENUM('owner', 'admin', 'manager', 'member', 'viewer'),
          allowNull: false,
          defaultValue: 'member',
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive', 'pending', 'suspended'),
          allowNull: false,
          defaultValue: 'pending',
        },
        permissions: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          defaultValue: [],
        },
        joinedAt: {
          type: DataTypes.DATE,
          field: 'joined_at',
        },
        invitedBy: {
          type: DataTypes.INTEGER,
          field: 'invited_by',
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        metadata: {
          type: DataTypes.JSONB,
          defaultValue: {},
        },
      },
      {
        sequelize,
        modelName: 'OrganizationMember',
        tableName: 'organization_members',
        underscored: true,
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ['organization_id', 'user_id'],
            name: 'unique_organization_user',
          },
          {
            fields: ['organization_id', 'status'],
            name: 'org_status_idx',
          },
          {
            fields: ['user_id', 'status'],
            name: 'user_status_idx',
          },
          {
            fields: ['role'],
            name: 'role_idx',
          },
        ],
      }
    );

    return OrganizationMember;
  }

  // Instance methods
  public hasPermission(permission: string): boolean {
    // Role-based permissions
    const rolePermissions: Record<string, string[]> = {
      owner: [
        'manage_organization',
        'manage_members',
        'manage_billing',
        'manage_settings',
        'view_all_data',
        'delete_organization',
        'manage_integrations',
        'view_audit_logs',
      ],
      admin: [
        'manage_members',
        'manage_settings',
        'view_all_data',
        'manage_integrations',
        'view_audit_logs',
      ],
      manager: [
        'view_all_data',
        'manage_content',
        'view_reports',
        'manage_teams',
      ],
      member: [
        'view_own_data',
        'create_content',
        'participate_discussions',
      ],
      viewer: [
        'view_own_data',
        'view_public_content',
      ],
    };

    const rolePerms = rolePermissions[this.role] || [];
    const customPerms = this.permissions || [];

    return rolePerms.includes(permission) || customPerms.includes(permission);
  }

  public isActive(): boolean {
    return this.status === 'active';
  }

  public canManageMembers(): boolean {
    return this.hasPermission('manage_members') && this.isActive();
  }

  public canViewFinancialData(): boolean {
    return (
      (this.hasPermission('manage_billing') || this.hasPermission('view_all_data')) &&
      this.isActive()
    );
  }

  public canManageOrganization(): boolean {
    return this.hasPermission('manage_organization') && this.isActive();
  }

  // Static methods
  public static async findActiveMembership(
    userId: number,
    organizationId: number
  ): Promise<OrganizationMember | null> {
    return OrganizationMember.findOne({
      where: {
        userId,
        organizationId,
        status: 'active',
      },
    });
  }

  public static async findOrganizationMembers(
    organizationId: number,
    status?: string
  ): Promise<OrganizationMember[]> {
    const where: unknown = { organizationId };
    if (status) {
      where.status = status;
    }

    return OrganizationMember.findAll({
      where,
      include: ['user'],
      order: [['createdAt', 'DESC']],
    });
  }

  public static async getUserOrganizations(
    userId: number,
    status?: string
  ): Promise<OrganizationMember[]> {
    const where: unknown = { userId };
    if (status) {
      where.status = status;
    }

    return OrganizationMember.findAll({
      where,
      include: ['organization'],
      order: [['createdAt', 'DESC']],
    });
  }

  public static async checkMembershipExists(
    userId: number,
    organizationId: number
  ): Promise<boolean> {
    const membership = await OrganizationMember.findOne({
      where: {
        userId,
        organizationId,
      },
    });
    return !!membership;
  }

  public static async getMemberCount(organizationId: number, status = 'active'): Promise<number> {
    return OrganizationMember.count({
      where: {
        organizationId,
        status,
      },
    });
  }

  public static async promoteToRole(
    userId: number,
    organizationId: number,
    newRole: 'admin' | 'manager' | 'member' | 'viewer',
    promotedBy: number
  ): Promise<OrganizationMember | null> {
    const membership = await OrganizationMember.findOne({
      where: {
        userId,
        organizationId,
        status: 'active',
      },
    });

    if (!membership) {
      return null;
    }

    // Update role and metadata
    await membership.update({
      role: newRole,
      metadata: {
        ...membership.metadata,
        lastPromotedBy: promotedBy,
        lastPromotedAt: new Date(),
        previousRole: membership.role,
      },
    });

    return membership.reload();
  }

  public static async activateMembership(
    userId: number,
    organizationId: number
  ): Promise<OrganizationMember | null> {
    const membership = await OrganizationMember.findOne({
      where: {
        userId,
        organizationId,
        status: 'pending',
      },
    });

    if (!membership) {
      return null;
    }

    await membership.update({
      status: 'active',
      joinedAt: new Date(),
    });

    return membership.reload();
  }

  public static async suspendMembership(
    userId: number,
    organizationId: number,
    suspendedBy: number,
    reason?: string
  ): Promise<OrganizationMember | null> {
    const membership = await OrganizationMember.findOne({
      where: {
        userId,
        organizationId,
        status: 'active',
      },
    });

    if (!membership) {
      return null;
    }

    await membership.update({
      status: 'suspended',
      metadata: {
        ...membership.metadata,
        suspendedBy,
        suspendedAt: new Date(),
        suspensionReason: reason,
      },
    });

    return membership.reload();
  }
}