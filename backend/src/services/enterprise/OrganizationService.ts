import { Transaction } from 'sequelize';
import { Organization, OrganizationAttributes } from '../../models/Organization';
import { Team } from '../../models/Team';
import { User } from '../../models/User';
import { sequelize } from '../../models';
import { Op } from 'sequelize';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';
import { generateSlug } from '../../utils/slug';
import crypto from 'crypto';

export interface CreateOrganizationData {
  name: string;
  website?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  billingEmail: string;
  ownerId: number;
}

export interface UpdateOrganizationData {
  name?: string;
  website?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  billingEmail?: string;
  logoUrl?: string;
  settings?: any;
}

export interface InviteMemberData {
  email: string;
  role: 'member' | 'manager' | 'admin';
  teamIds?: number[];
  invitedBy: number;
}

export interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  totalTeams: number;
  activeTeams: number;
  storageUsed: number;
  apiCallsThisMonth: number;
}

export class OrganizationService {
  async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    const transaction = await sequelize.transaction();

    try {
      // Generate unique slug
      let slug = generateSlug(data.name);
      let slugExists = await Organization.findOne({ where: { slug } });
      let counter = 1;
      
      while (slugExists) {
        slug = `${generateSlug(data.name)}-${counter}`;
        slugExists = await Organization.findOne({ where: { slug } });
        counter++;
      }

      // Create organization
      const organization = await Organization.create({
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
            storage: 10737418240, // 10GB
          },
        },
      }, { transaction });

      // Add owner as organization member
      await sequelize.query(
        `INSERT INTO organization_members (organization_id, user_id, role, is_active)
         VALUES (:organizationId, :userId, 'owner', true)`,
        {
          replacements: {
            organizationId: organization.id,
            userId: data.ownerId,
          },
          transaction,
        }
      );

      // Update user's organization
      await User.update(
        { organizationId: organization.id },
        { where: { id: data.ownerId }, transaction }
      );

      // Create default team
      await Team.create({
        organizationId: organization.id,
        name: 'General',
        description: 'Default team for all members',
        managerId: data.ownerId,
        settings: {
          isDefault: true,
        },
      }, { transaction });

      await transaction.commit();

      logger.info('Organization created', {
        organizationId: organization.id,
        name: organization.name,
        ownerId: data.ownerId,
      });

      return organization;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create organization', error);
      throw error;
    }
  }

  async updateOrganization(
    organizationId: number,
    data: UpdateOrganizationData
  ): Promise<Organization> {
    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    // If name is being updated, check slug
    if (data.name && data.name !== organization.name) {
      const newSlug = generateSlug(data.name);
      const slugExists = await Organization.findOne({
        where: { slug: newSlug, id: { [Op.ne]: organizationId } },
      });

      if (!slugExists) {
        await organization.update({ ...data, slug: newSlug });
      } else {
        await organization.update(data);
      }
    } else {
      await organization.update(data);
    }

    logger.info('Organization updated', {
      organizationId,
      updates: Object.keys(data),
    });

    return organization;
  }

  async inviteMember(
    organizationId: number,
    data: InviteMemberData
  ): Promise<{ invitationId: number; token: string }> {
    const transaction = await sequelize.transaction();

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: data.email } });
      
      if (existingUser) {
        // Check if already a member
        const [existingMember] = await sequelize.query(
          `SELECT * FROM organization_members 
           WHERE organization_id = :organizationId AND user_id = :userId`,
          {
            replacements: {
              organizationId,
              userId: existingUser.id,
            },
            transaction,
          }
        );

        if (existingMember.length > 0) {
          throw new AppError('User is already a member of this organization', 400);
        }
      }

      // Create invitation
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const [result] = await sequelize.query(
        `INSERT INTO organization_invitations 
         (organization_id, email, role, team_ids, invited_by, invitation_token, expires_at)
         VALUES (:organizationId, :email, :role, :teamIds, :invitedBy, :token, :expiresAt)
         RETURNING id`,
        {
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
        }
      );

      await transaction.commit();

      const invitationId = (result[0] as any).id;

      logger.info('Organization invitation created', {
        organizationId,
        invitationId,
        email: data.email,
        role: data.role,
      });

      return { invitationId, token };
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create invitation', error);
      throw error;
    }
  }

  async acceptInvitation(token: string, userId: number): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      // Get invitation
      const [invitations] = await sequelize.query(
        `SELECT * FROM organization_invitations
         WHERE invitation_token = :token
         AND expires_at > NOW()
         AND accepted_at IS NULL
         AND rejected_at IS NULL`,
        {
          replacements: { token },
          transaction,
        }
      );

      if (invitations.length === 0) {
        throw new AppError('Invalid or expired invitation', 400);
      }

      const invitation = invitations[0];

      // Add user to organization
      await sequelize.query(
        `INSERT INTO organization_members 
         (organization_id, user_id, role, is_active)
         VALUES (:organizationId, :userId, :role, true)`,
        {
          replacements: {
            organizationId: (invitation as any).organization_id,
            userId,
            role: (invitation as any).role,
          },
          transaction,
        }
      );

      // Update user's organization
      await sequelize.query(
        `UPDATE users SET organization_id = :organizationId WHERE id = :userId`,
        {
          replacements: {
            organizationId: (invitation as any).organization_id,
            userId
          },
          transaction
        }
      );

      // Add to teams if specified
      const inv = invitation as any;
      if (inv.team_ids && inv.team_ids.length > 0) {
        for (const teamId of inv.team_ids) {
          await sequelize.query(
            `INSERT INTO team_members (team_id, user_id, role, invited_by)
             VALUES (:teamId, :userId, 'member', :invitedBy)`,
            {
              replacements: {
                teamId,
                userId,
                invitedBy: (invitation as any).invited_by,
              },
              transaction,
            }
          );
        }
      }

      // Mark invitation as accepted
      await sequelize.query(
        `UPDATE organization_invitations
         SET accepted_at = NOW()
         WHERE id = :invitationId`,
        {
          replacements: { invitationId: (invitation as any).id },
          transaction,
        }
      );

      await transaction.commit();

      logger.info('Organization invitation accepted', {
        invitationId: (invitation as any).id,
        organizationId: (invitation as any).organization_id,
        userId,
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to accept invitation', error);
      throw error;
    }
  }

  async removeMember(
    organizationId: number,
    userId: number,
    removedBy: number
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      // Check permissions
      const [removerRole] = await sequelize.query(
        `SELECT role FROM organization_members
         WHERE organization_id = :organizationId AND user_id = :removedBy`,
        {
          replacements: { organizationId, removedBy },
          transaction,
        }
      );

      if (removerRole.length === 0 || !['admin', 'owner'].includes((removerRole[0] as any).role)) {
        throw new AppError('Insufficient permissions to remove members', 403);
      }

      // Remove from organization
      await sequelize.query(
        `UPDATE organization_members
         SET is_active = false
         WHERE organization_id = :organizationId AND user_id = :userId`,
        {
          replacements: { organizationId, userId },
          transaction,
        }
      );

      // Remove from all teams
      await sequelize.query(
        `UPDATE team_members
         SET is_active = false
         WHERE user_id = :userId
         AND team_id IN (SELECT id FROM teams WHERE organization_id = :organizationId)`,
        {
          replacements: { userId, organizationId },
          transaction,
        }
      );

      // Clear user's organization
      await sequelize.query(
        `UPDATE users SET organization_id = NULL WHERE id = :userId`,
        {
          replacements: { userId },
          transaction
        }
      );

      await transaction.commit();

      logger.info('Member removed from organization', {
        organizationId,
        userId,
        removedBy,
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to remove member', error);
      throw error;
    }
  }

  async getOrganizationStats(organizationId: number): Promise<OrganizationStats> {
    const [stats] = await sequelize.query(
      `SELECT 
        COUNT(DISTINCT om.user_id) as total_members,
        COUNT(DISTINCT CASE WHEN om.is_active = true THEN om.user_id END) as active_members,
        COUNT(DISTINCT t.id) as total_teams,
        COUNT(DISTINCT CASE WHEN t.is_active = true THEN t.id END) as active_teams
       FROM organizations o
       LEFT JOIN organization_members om ON o.id = om.organization_id
       LEFT JOIN teams t ON o.id = t.organization_id
       WHERE o.id = :organizationId
       GROUP BY o.id`,
      {
        replacements: { organizationId },
      }
    );

    // Get additional stats (storage, API calls, etc.)
    // These would come from other services/tables
    const storageUsed = 0; // TODO: Implement storage tracking
    const apiCallsThisMonth = 0; // TODO: Implement API usage tracking

    return {
      totalMembers: parseInt((stats[0] as any)?.total_members || '0'),
      activeMembers: parseInt((stats[0] as any)?.active_members || '0'),
      totalTeams: parseInt((stats[0] as any)?.total_teams || '0'),
      activeTeams: parseInt((stats[0] as any)?.active_teams || '0'),
      storageUsed,
      apiCallsThisMonth,
    };
  }

  async getOrganizationMembers(
    organizationId: number,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      teamId?: number;
    } = {}
  ): Promise<{
    members: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE om.organization_id = :organizationId AND om.is_active = true';
    const replacements: any = { organizationId, limit, offset };

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

    // Get total count
    const [countResult] = await sequelize.query(
      `SELECT COUNT(DISTINCT u.id) as total
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       ${whereClause}`,
      { replacements }
    );

    const total = parseInt((countResult[0] as any).total);

    // Get members
    const [members] = await sequelize.query(
      `SELECT 
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
       LIMIT :limit OFFSET :offset`,
      { replacements }
    );

    return {
      members,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrganizationById(organizationId: number): Promise<Organization | null> {
    const organization = await Organization.findByPk(organizationId, {
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
      },
    });

    return organization;
  }
}