"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const Organization_1 = require("../../models/Organization");
const Team_1 = require("../../models/Team");
const User_1 = require("../../models/User");
const errors_1 = require("../../utils/errors");
const logger_1 = require("../../utils/logger");
const slug_1 = require("../../utils/slug");
class OrganizationService {
    async createOrganization(data) {
        const transaction = await models_1.sequelize.transaction();
        try {
            let slug = (0, slug_1.generateSlug)(data.name);
            let slugExists = await Organization_1.Organization.findOne({ where: { slug } });
            let counter = 1;
            while (slugExists) {
                slug = `${(0, slug_1.generateSlug)(data.name)}-${counter}`;
                slugExists = await Organization_1.Organization.findOne({ where: { slug } });
                counter++;
            }
            const organization = await Organization_1.Organization.create({
                name: data.name,
                slug,
                website: data.website,
                industry: data.industry,
                size: data.size,
                billingEmail: data.billingEmail,
                subscriptionTier: 'team',
                settings: {
                    features: ['basic_teams', 'shared_goals'],
                    limits: {
                        teams: 5,
                        membersPerTeam: 10,
                        storage: 10737418240,
                    },
                },
            }, { transaction });
            await models_1.sequelize.query(`INSERT INTO organization_members (organization_id, user_id, role, is_active)
         VALUES (:organizationId, :userId, 'owner', true)`, {
                replacements: {
                    organizationId: organization.id,
                    userId: data.ownerId,
                },
                transaction,
            });
            await User_1.User.update({ organizationId: organization.id }, { where: { id: data.ownerId }, transaction });
            await Team_1.Team.create({
                organizationId: organization.id,
                name: 'General',
                description: 'Default team for all members',
                managerId: data.ownerId,
                settings: {
                    isDefault: true,
                },
            }, { transaction });
            await transaction.commit();
            logger_1.logger.info('Organization created', {
                organizationId: organization.id,
                name: organization.name,
                ownerId: data.ownerId,
            });
            return organization;
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to create organization', error);
            throw error;
        }
    }
    async updateOrganization(organizationId, data) {
        const organization = await Organization_1.Organization.findByPk(organizationId);
        if (!organization) {
            throw new errors_1.AppError('Organization not found', 404);
        }
        if (data.name && data.name !== organization.name) {
            const newSlug = (0, slug_1.generateSlug)(data.name);
            const slugExists = await Organization_1.Organization.findOne({
                where: { slug: newSlug, id: { [sequelize_1.Op.ne]: organizationId } },
            });
            if (!slugExists) {
                await organization.update({ ...data, slug: newSlug });
            }
            else {
                await organization.update(data);
            }
        }
        else {
            await organization.update(data);
        }
        logger_1.logger.info('Organization updated', {
            organizationId,
            updates: Object.keys(data),
        });
        return organization;
    }
    async inviteMember(organizationId, data) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const existingUser = await User_1.User.findOne({ where: { email: data.email } });
            if (existingUser) {
                const [existingMember] = await models_1.sequelize.query(`SELECT * FROM organization_members 
           WHERE organization_id = :organizationId AND user_id = :userId`, {
                    replacements: {
                        organizationId,
                        userId: existingUser.id,
                    },
                    transaction,
                });
                if (existingMember.length > 0) {
                    throw new errors_1.AppError('User is already a member of this organization', 400);
                }
            }
            const token = crypto_1.default.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            const [result] = await models_1.sequelize.query(`INSERT INTO organization_invitations 
         (organization_id, email, role, team_ids, invited_by, invitation_token, expires_at)
         VALUES (:organizationId, :email, :role, :teamIds, :invitedBy, :token, :expiresAt)
         RETURNING id`, {
                replacements: {
                    organizationId,
                    email: data.email,
                    role: data.role,
                    teamIds: data.teamIds || null,
                    invitedBy: data.invitedBy,
                    token,
                    expiresAt,
                },
                transaction,
            });
            await transaction.commit();
            const invitationId = result[0].id;
            logger_1.logger.info('Organization invitation created', {
                organizationId,
                invitationId,
                email: data.email,
                role: data.role,
            });
            return { invitationId, token };
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to create invitation', error);
            throw error;
        }
    }
    async acceptInvitation(token, userId) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const [invitations] = await models_1.sequelize.query(`SELECT * FROM organization_invitations
         WHERE invitation_token = :token
         AND expires_at > NOW()
         AND accepted_at IS NULL
         AND rejected_at IS NULL`, {
                replacements: { token },
                transaction,
            });
            if (invitations.length === 0) {
                throw new errors_1.AppError('Invalid or expired invitation', 400);
            }
            const invitation = invitations[0];
            await models_1.sequelize.query(`INSERT INTO organization_members 
         (organization_id, user_id, role, is_active)
         VALUES (:organizationId, :userId, :role, true)`, {
                replacements: {
                    organizationId: invitation.organization_id,
                    userId,
                    role: invitation.role,
                },
                transaction,
            });
            await models_1.sequelize.query(`UPDATE users SET organization_id = :organizationId WHERE id = :userId`, {
                replacements: {
                    organizationId: invitation.organization_id,
                    userId,
                },
                transaction,
            });
            const inv = invitation;
            if (inv.team_ids && inv.team_ids.length > 0) {
                for (const teamId of inv.team_ids) {
                    await models_1.sequelize.query(`INSERT INTO team_members (team_id, user_id, role, invited_by)
             VALUES (:teamId, :userId, 'member', :invitedBy)`, {
                        replacements: {
                            teamId,
                            userId,
                            invitedBy: invitation.invited_by,
                        },
                        transaction,
                    });
                }
            }
            await models_1.sequelize.query(`UPDATE organization_invitations
         SET accepted_at = NOW()
         WHERE id = :invitationId`, {
                replacements: { invitationId: invitation.id },
                transaction,
            });
            await transaction.commit();
            logger_1.logger.info('Organization invitation accepted', {
                invitationId: invitation.id,
                organizationId: invitation.organization_id,
                userId,
            });
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to accept invitation', error);
            throw error;
        }
    }
    async removeMember(organizationId, userId, removedBy) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const [removerRole] = await models_1.sequelize.query(`SELECT role FROM organization_members
         WHERE organization_id = :organizationId AND user_id = :removedBy`, {
                replacements: { organizationId, removedBy },
                transaction,
            });
            if (removerRole.length === 0 || !['admin', 'owner'].includes(removerRole[0].role)) {
                throw new errors_1.AppError('Insufficient permissions to remove members', 403);
            }
            await models_1.sequelize.query(`UPDATE organization_members
         SET is_active = false
         WHERE organization_id = :organizationId AND user_id = :userId`, {
                replacements: { organizationId, userId },
                transaction,
            });
            await models_1.sequelize.query(`UPDATE team_members
         SET is_active = false
         WHERE user_id = :userId
         AND team_id IN (SELECT id FROM teams WHERE organization_id = :organizationId)`, {
                replacements: { userId, organizationId },
                transaction,
            });
            await models_1.sequelize.query(`UPDATE users SET organization_id = NULL WHERE id = :userId`, {
                replacements: { userId },
                transaction,
            });
            await transaction.commit();
            logger_1.logger.info('Member removed from organization', {
                organizationId,
                userId,
                removedBy,
            });
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to remove member', error);
            throw error;
        }
    }
    async getOrganizationStats(organizationId) {
        const [stats] = await models_1.sequelize.query(`SELECT 
        COUNT(DISTINCT om.user_id) as total_members,
        COUNT(DISTINCT CASE WHEN om.is_active = true THEN om.user_id END) as active_members,
        COUNT(DISTINCT t.id) as total_teams,
        COUNT(DISTINCT CASE WHEN t.is_active = true THEN t.id END) as active_teams
       FROM organizations o
       LEFT JOIN organization_members om ON o.id = om.organization_id
       LEFT JOIN teams t ON o.id = t.organization_id
       WHERE o.id = :organizationId
       GROUP BY o.id`, {
            replacements: { organizationId },
        });
        let storageUsed = 0;
        let apiCallsThisMonth = 0;
        try {
            const { storageTracker } = await Promise.resolve().then(() => __importStar(require('../storage/StorageTracker')));
            storageUsed = await storageTracker.getCurrentStorageUsed(organizationId);
        }
        catch (error) {
            logger_1.logger.error('Error getting storage usage:', error);
        }
        try {
            const { apiUsageTracker } = await Promise.resolve().then(() => __importStar(require('../analytics/APIUsageTracker')));
            apiCallsThisMonth = await apiUsageTracker.getMonthlyAPIUsage(organizationId);
        }
        catch (error) {
            logger_1.logger.error('Error getting API usage:', error);
        }
        return {
            totalMembers: parseInt(stats[0]?.total_members || '0'),
            activeMembers: parseInt(stats[0]?.active_members || '0'),
            totalTeams: parseInt(stats[0]?.total_teams || '0'),
            activeTeams: parseInt(stats[0]?.active_teams || '0'),
            storageUsed,
            apiCallsThisMonth,
        };
    }
    async getOrganizationMembers(organizationId, options = {}) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE om.organization_id = :organizationId AND om.is_active = true';
        const replacements = { organizationId, limit, offset };
        if (options.search) {
            whereClause += ` AND (u.email ILIKE :search OR u.full_name ILIKE :search)`;
            replacements.search = `%${options.search}%`;
        }
        if (options.role) {
            whereClause += ` AND om.role = :role`;
            replacements.role = options.role;
        }
        if (options.teamId) {
            whereClause += ` AND EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.user_id = u.id 
        AND tm.team_id = :teamId 
        AND tm.is_active = true
      )`;
            replacements.teamId = options.teamId;
        }
        const [countResult] = await models_1.sequelize.query(`SELECT COUNT(DISTINCT u.id) as total
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       ${whereClause}`, { replacements });
        const total = parseInt(countResult[0].total);
        const [members] = await models_1.sequelize.query(`SELECT 
        u.id,
        u.email,
        u.full_name,
        u.avatar_url,
        om.role,
        om.department,
        om.joined_at,
        om.employee_id,
        COALESCE(
          JSON_AGG(
            DISTINCT jsonb_build_object(
              'id', t.id,
              'name', t.name,
              'role', tm.role
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::json
        ) as teams
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       LEFT JOIN team_members tm ON tm.user_id = u.id AND tm.is_active = true
       LEFT JOIN teams t ON tm.team_id = t.id AND t.organization_id = om.organization_id
       ${whereClause}
       GROUP BY u.id, u.email, u.full_name, u.avatar_url, om.role, om.department, om.joined_at, om.employee_id
       ORDER BY om.joined_at DESC
       LIMIT :limit OFFSET :offset`, { replacements });
        return {
            members,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getOrganizationById(organizationId) {
        const organization = await Organization_1.Organization.findByPk(organizationId, {
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
        });
        return organization;
    }
}
exports.OrganizationService = OrganizationService;
//# sourceMappingURL=OrganizationService.js.map