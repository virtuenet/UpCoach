import { Transaction } from 'sequelize';
import { Team, TeamAttributes } from '../../models/Team';
import { sequelize } from '../../models';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';

export interface CreateTeamData {
  organizationId: number;
  name: string;
  description?: string;
  department?: string;
  managerId?: number;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  department?: string;
  managerId?: number;
  settings?: any;
  isActive?: boolean;
}

export interface CreatePolicyData {
  organizationId: number;
  name: string;
  type: 'security' | 'data_retention' | 'access_control' | 'compliance';
  rules: any;
  enforcementLevel: 'soft' | 'hard';
  appliesTo?: any;
  createdBy: number;
}

export interface AuditLogFilter {
  page: number;
  limit: number;
  action?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export class TeamService {
  async createTeam(data: CreateTeamData): Promise<Team> {
    const transaction = await sequelize.transaction();

    try {
      // Check organization team limit
      const [teamCount] = await sequelize.query(
        `SELECT COUNT(*) as count FROM teams WHERE organization_id = :organizationId`,
        {
          replacements: { organizationId: data.organizationId },
          transaction,
        }
      );

      // TODO: Check team limits based on subscription

      // Create team
      const team = await Team.create(
        {
          organizationId: data.organizationId,
          name: data.name,
          description: data.description,
          department: data.department,
          managerId: data.managerId,
          settings: {},
        },
        { transaction }
      );

      // Add manager as team lead if specified
      if (data.managerId) {
        await sequelize.query(
          `INSERT INTO team_members (team_id, user_id, role, is_active)
           VALUES (:teamId, :userId, 'lead', true)`,
          {
            replacements: {
              teamId: team.id,
              userId: data.managerId,
            },
            transaction,
          }
        );
      }

      await transaction.commit();

      logger.info('Team created', {
        teamId: team.id,
        organizationId: data.organizationId,
        name: data.name,
      });

      return team;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create team', error);
      throw error;
    }
  }

  async updateTeam(teamId: number, data: UpdateTeamData): Promise<Team> {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    await team.update(data);

    logger.info('Team updated', {
      teamId,
      updates: Object.keys(data),
    });

    return team;
  }

  async getOrganizationTeams(organizationId: number): Promise<any[]> {
    const [teams] = await sequelize.query(
      `SELECT 
        t.*,
        u.full_name as manager_name,
        COUNT(DISTINCT tm.user_id) as member_count
       FROM teams t
       LEFT JOIN users u ON t.manager_id = u.id
       LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
       WHERE t.organization_id = :organizationId
       GROUP BY t.id, u.full_name
       ORDER BY t.created_at DESC`,
      {
        replacements: { organizationId },
      }
    );

    return teams;
  }

  async addTeamMember(
    teamId: number,
    userId: number,
    role: string,
    addedBy: number
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      // Check if user is already a member
      const [existing] = await sequelize.query(
        `SELECT * FROM team_members WHERE team_id = :teamId AND user_id = :userId`,
        {
          replacements: { teamId, userId },
          transaction,
        }
      );

      if (existing.length > 0) {
        // Update existing membership
        await sequelize.query(
          `UPDATE team_members 
           SET role = :role, is_active = true, invited_by = :addedBy
           WHERE team_id = :teamId AND user_id = :userId`,
          {
            replacements: { role, addedBy, teamId, userId },
            transaction,
          }
        );
      } else {
        // Create new membership
        await sequelize.query(
          `INSERT INTO team_members (team_id, user_id, role, invited_by, is_active)
           VALUES (:teamId, :userId, :role, :addedBy, true)`,
          {
            replacements: { teamId, userId, role, addedBy },
            transaction,
          }
        );
      }

      await transaction.commit();

      logger.info('Team member added', {
        teamId,
        userId,
        role,
        addedBy,
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to add team member', error);
      throw error;
    }
  }

  async removeTeamMember(teamId: number, userId: number): Promise<void> {
    await sequelize.query(
      `UPDATE team_members 
       SET is_active = false
       WHERE team_id = :teamId AND user_id = :userId`,
      {
        replacements: { teamId, userId },
      }
    );

    logger.info('Team member removed', {
      teamId,
      userId,
    });
  }

  async getTeamMembers(teamId: number): Promise<any[]> {
    const [members] = await sequelize.query(
      `SELECT 
        u.id,
        u.email,
        u.full_name,
        u.avatar_url,
        tm.role,
        tm.joined_at,
        tm.is_active
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = :teamId
       ORDER BY tm.joined_at DESC`,
      {
        replacements: { teamId },
      }
    );

    return members;
  }

  async createPolicy(data: CreatePolicyData): Promise<any> {
    const [result] = await sequelize.query(
      `INSERT INTO enterprise_policies 
       (organization_id, name, type, rules, enforcement_level, applies_to, created_by)
       VALUES (:organizationId, :name, :type, :rules, :enforcementLevel, :appliesTo, :createdBy)
       RETURNING *`,
      {
        replacements: {
          organizationId: data.organizationId,
          name: data.name,
          type: data.type,
          rules: JSON.stringify(data.rules),
          enforcementLevel: data.enforcementLevel,
          appliesTo: JSON.stringify(data.appliesTo || {}),
          createdBy: data.createdBy,
        },
      }
    );

    logger.info('Policy created', {
      policyId: (result[0] as any).id,
      organizationId: data.organizationId,
      type: data.type,
    });

    return result[0];
  }

  async getOrganizationPolicies(organizationId: number): Promise<any[]> {
    const [policies] = await sequelize.query(
      `SELECT 
        p.*,
        u.full_name as created_by_name
       FROM enterprise_policies p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.organization_id = :organizationId
       AND p.is_active = true
       ORDER BY p.created_at DESC`,
      {
        replacements: { organizationId },
      }
    );

    return policies.map((policy: any) => ({
      ...policy,
      rules: JSON.parse(policy.rules as string),
      applies_to: JSON.parse(policy.applies_to as string),
    }));
  }

  async logAuditEvent(
    organizationId: number,
    userId: number | null,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await sequelize.query(
      `INSERT INTO enterprise_audit_logs 
       (organization_id, user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent)
       VALUES (:organizationId, :userId, :action, :resourceType, :resourceId, 
        :details, :ipAddress, :userAgent)`,
      {
        replacements: {
          organizationId,
          userId,
          action,
          resourceType,
          resourceId,
          details: details ? JSON.stringify(details) : null,
          ipAddress,
          userAgent,
        },
      }
    );
  }

  async getAuditLogs(
    organizationId: number,
    filter: AuditLogFilter
  ): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (filter.page - 1) * filter.limit;
    let whereClause = 'WHERE al.organization_id = :organizationId';
    const replacements: any = {
      organizationId,
      limit: filter.limit,
      offset,
    };

    if (filter.action) {
      whereClause += ' AND al.action = :action';
      replacements.action = filter.action;
    }

    if (filter.userId) {
      whereClause += ' AND al.user_id = :userId';
      replacements.userId = filter.userId;
    }

    if (filter.startDate) {
      whereClause += ' AND al.created_at >= :startDate';
      replacements.startDate = filter.startDate;
    }

    if (filter.endDate) {
      whereClause += ' AND al.created_at <= :endDate';
      replacements.endDate = filter.endDate;
    }

    // Get total count
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total
       FROM enterprise_audit_logs al
       ${whereClause}`,
      { replacements }
    );

    const total = parseInt((countResult[0] as any).total);

    // Get logs
    const [logs] = await sequelize.query(
      `SELECT 
        al.*,
        u.full_name as user_name,
        u.email as user_email
       FROM enterprise_audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT :limit OFFSET :offset`,
      { replacements }
    );

    return {
      logs: logs.map((log: any) => ({
        ...log,
        details: log.details ? JSON.parse(log.details as string) : null,
      })),
      total,
      page: filter.page,
      totalPages: Math.ceil(total / filter.limit),
    };
  }

  async checkTeamPermission(
    teamId: number,
    userId: number,
    requiredRole: string[]
  ): Promise<boolean> {
    const [members] = await sequelize.query(
      `SELECT role FROM team_members
       WHERE team_id = :teamId 
       AND user_id = :userId 
       AND is_active = true`,
      {
        replacements: { teamId, userId },
      }
    );

    if (members.length === 0) {
      return false;
    }

    return requiredRole.includes((members[0] as any).role);
  }

  async getUserById(userId: number): Promise<any> {
    const [users] = await sequelize.query(
      `SELECT id, email, full_name, avatar_url FROM users WHERE id = :userId`,
      {
        replacements: { userId },
      }
    );

    if (users.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = users[0] as any;
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
    };
  }
}
