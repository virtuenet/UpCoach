"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationMember = void 0;
const sequelize_1 = require("sequelize");
class OrganizationMember extends sequelize_1.Model {
    organizationId;
    userId;
    role;
    status;
    permissions;
    joinedAt;
    invitedBy;
    metadata;
    organization;
    user;
    inviter;
    static associations;
    static initModel(sequelize) {
        OrganizationMember.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            organizationId: {
                type: sequelize_1.DataTypes.INTEGER,
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
                type: sequelize_1.DataTypes.INTEGER,
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
                type: sequelize_1.DataTypes.ENUM('owner', 'admin', 'manager', 'member', 'viewer'),
                allowNull: false,
                defaultValue: 'member',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('active', 'inactive', 'pending', 'suspended'),
                allowNull: false,
                defaultValue: 'pending',
            },
            permissions: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                defaultValue: [],
            },
            joinedAt: {
                type: sequelize_1.DataTypes.DATE,
                field: 'joined_at',
            },
            invitedBy: {
                type: sequelize_1.DataTypes.INTEGER,
                field: 'invited_by',
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            metadata: {
                type: sequelize_1.DataTypes.JSONB,
                defaultValue: {},
            },
        }, {
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
        });
        return OrganizationMember;
    }
    hasPermission(permission) {
        const rolePermissions = {
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
    isActive() {
        return this.status === 'active';
    }
    canManageMembers() {
        return this.hasPermission('manage_members') && this.isActive();
    }
    canViewFinancialData() {
        return ((this.hasPermission('manage_billing') || this.hasPermission('view_all_data')) &&
            this.isActive());
    }
    canManageOrganization() {
        return this.hasPermission('manage_organization') && this.isActive();
    }
    static async findActiveMembership(userId, organizationId) {
        return OrganizationMember.findOne({
            where: {
                userId,
                organizationId,
                status: 'active',
            },
        });
    }
    static async findOrganizationMembers(organizationId, status) {
        const where = { organizationId };
        if (status) {
            where.status = status;
        }
        return OrganizationMember.findAll({
            where,
            include: ['user'],
            order: [['createdAt', 'DESC']],
        });
    }
    static async getUserOrganizations(userId, status) {
        const where = { userId };
        if (status) {
            where.status = status;
        }
        return OrganizationMember.findAll({
            where,
            include: ['organization'],
            order: [['createdAt', 'DESC']],
        });
    }
    static async checkMembershipExists(userId, organizationId) {
        const membership = await OrganizationMember.findOne({
            where: {
                userId,
                organizationId,
            },
        });
        return !!membership;
    }
    static async getMemberCount(organizationId, status = 'active') {
        return OrganizationMember.count({
            where: {
                organizationId,
                status,
            },
        });
    }
    static async promoteToRole(userId, organizationId, newRole, promotedBy) {
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
    static async activateMembership(userId, organizationId) {
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
    static async suspendMembership(userId, organizationId, suspendedBy, reason) {
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
exports.OrganizationMember = OrganizationMember;
