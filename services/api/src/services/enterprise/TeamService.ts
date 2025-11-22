import { Transaction } from 'sequelize';

import { sequelize } from '../../models';
import { Team, TeamAttributes } from '../../models/Team';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

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
  settings?: unknown;
  isActive?: boolean;
}

export interface CreatePolicyData {
  organizationId: number;
  name: string;
  type: 'security' | 'data_retention' | 'access_control' | 'compliance';
  rules: unknown;
  enforcementLevel: 'soft' | 'hard';
  appliesTo?: unknown;
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

      // Check team limits based on subscription
      const currentTeamCount = (teamCount[0] as unknown).count;
      await this.checkTeamLimits(data.organizationId, currentTeamCount);

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
      // Get team's organization ID for limit checking
      const [teams] = await sequelize.query(
        `SELECT organization_id FROM teams WHERE id = :teamId`,
        {
          replacements: { teamId },
          transaction,
        }
      );

      if (teams.length === 0) {
        throw new AppError('Team not found', 404);
      }

      const organizationId = (teams[0] as unknown).organization_id;

      // Check if user is already a member
      const [existing] = await sequelize.query(
        `SELECT * FROM team_members WHERE team_id = :teamId AND user_id = :userId`,
        {
          replacements: { teamId, userId },
          transaction,
        }
      );

      if (existing.length > 0) {
        // If updating existing member, no need to check limits
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
        // Check team member limits before adding new member
        await this.checkTeamMemberLimits(organizationId, teamId);

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

  async createPolicy(data: CreatePolicyData): Promise<unknown> {
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
      policyId: (result[0] as unknown).id,
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

    return policies.map((policy: unknown) => ({
      ...policy,
      rules: JSON.parse(policy.rules as string),
      applies_to: JSON.parse(policy.applies_to as string),
    }));
  }

  async updatePolicy(policyId: number, data: Partial<CreatePolicyData> & { updatedBy: number }): Promise<unknown> {
    const transaction = await sequelize.transaction();

    try {
      // First, check if policy exists and get current data
      const [existingPolicies] = await sequelize.query(
        `SELECT * FROM enterprise_policies WHERE id = :policyId AND is_active = true`,
        {
          replacements: { policyId },
          transaction,
        }
      );

      if (existingPolicies.length === 0) {
        throw new AppError('Policy not found', 404);
      }

      const existingPolicy = existingPolicies[0] as unknown;

      // Build update query dynamically based on provided data
      const updateFields: string[] = [];
      const replacements: unknown = { policyId, updatedBy: data.updatedBy };

      if (data.name !== undefined) {
        updateFields.push('name = :name');
        replacements.name = data.name;
      }
      if (data.type !== undefined) {
        updateFields.push('type = :type');
        replacements.type = data.type;
      }
      if (data.rules !== undefined) {
        updateFields.push('rules = :rules');
        replacements.rules = JSON.stringify(data.rules);
      }
      if (data.enforcementLevel !== undefined) {
        updateFields.push('enforcement_level = :enforcementLevel');
        replacements.enforcementLevel = data.enforcementLevel;
      }
      if (data.appliesTo !== undefined) {
        updateFields.push('applies_to = :appliesTo');
        replacements.appliesTo = JSON.stringify(data.appliesTo);
      }

      updateFields.push('updated_at = NOW()');

      if (updateFields.length === 1) { // Only timestamp update
        throw new AppError('No fields to update', 400);
      }

      const [result] = await sequelize.query(
        `UPDATE enterprise_policies
         SET ${updateFields.join(', ')}
         WHERE id = :policyId
         RETURNING *`,
        {
          replacements,
          transaction,
        }
      );

      // Log audit event
      await this.logAuditEvent(
        existingPolicy.organization_id,
        data.updatedBy,
        'policy_updated',
        'policy',
        policyId.toString(),
        {
          previousValues: {
            name: existingPolicy.name,
            type: existingPolicy.type,
            enforcementLevel: existingPolicy.enforcement_level,
          },
          newValues: data,
        }
      );

      await transaction.commit();

      logger.info('Policy updated', {
        policyId,
        organizationId: existingPolicy.organization_id,
        updatedBy: data.updatedBy,
      });

      const updatedPolicy = result[0] as unknown;
      return {
        ...updatedPolicy,
        rules: JSON.parse(updatedPolicy.rules as string),
        applies_to: JSON.parse(updatedPolicy.applies_to as string),
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deletePolicy(policyId: number, data: { deletedBy: number }): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      // Check if policy exists
      const [existingPolicies] = await sequelize.query(
        `SELECT * FROM enterprise_policies WHERE id = :policyId AND is_active = true`,
        {
          replacements: { policyId },
          transaction,
        }
      );

      if (existingPolicies.length === 0) {
        throw new AppError('Policy not found', 404);
      }

      const existingPolicy = existingPolicies[0] as unknown;

      // Soft delete the policy
      await sequelize.query(
        `UPDATE enterprise_policies
         SET is_active = false,
             deleted_at = NOW(),
             updated_at = NOW()
         WHERE id = :policyId`,
        {
          replacements: { policyId },
          transaction,
        }
      );

      // Log audit event
      await this.logAuditEvent(
        existingPolicy.organization_id,
        data.deletedBy,
        'policy_deleted',
        'policy',
        policyId.toString(),
        {
          policyName: existingPolicy.name,
          policyType: existingPolicy.type,
        }
      );

      await transaction.commit();

      logger.info('Policy deleted', {
        policyId,
        organizationId: existingPolicy.organization_id,
        deletedBy: data.deletedBy,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async togglePolicy(policyId: number, data: { enabled?: boolean; updatedBy: number }): Promise<unknown> {
    const transaction = await sequelize.transaction();

    try {
      // Check if policy exists
      const [existingPolicies] = await sequelize.query(
        `SELECT * FROM enterprise_policies WHERE id = :policyId AND is_active = true`,
        {
          replacements: { policyId },
          transaction,
        }
      );

      if (existingPolicies.length === 0) {
        throw new AppError('Policy not found', 404);
      }

      const existingPolicy = existingPolicies[0] as unknown;

      // Determine new enabled state - if not provided, toggle current state
      const newEnabledState = data.enabled !== undefined
        ? data.enabled
        : !existingPolicy.is_enabled;

      // Update the policy enabled state
      const [result] = await sequelize.query(
        `UPDATE enterprise_policies
         SET is_enabled = :isEnabled,
             updated_at = NOW()
         WHERE id = :policyId
         RETURNING *`,
        {
          replacements: {
            policyId,
            isEnabled: newEnabledState
          },
          transaction,
        }
      );

      // Log audit event
      await this.logAuditEvent(
        existingPolicy.organization_id,
        data.updatedBy,
        newEnabledState ? 'policy_enabled' : 'policy_disabled',
        'policy',
        policyId.toString(),
        {
          policyName: existingPolicy.name,
          previousState: existingPolicy.is_enabled,
          newState: newEnabledState,
        }
      );

      await transaction.commit();

      logger.info('Policy toggled', {
        policyId,
        organizationId: existingPolicy.organization_id,
        enabled: newEnabledState,
        updatedBy: data.updatedBy,
      });

      const updatedPolicy = result[0] as unknown;
      return {
        ...updatedPolicy,
        rules: JSON.parse(updatedPolicy.rules as string),
        applies_to: JSON.parse(updatedPolicy.applies_to as string),
        isActive: updatedPolicy.is_enabled,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async logAuditEvent(
    organizationId: number,
    userId: number | null,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: unknown,
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
    logs: unknown[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (filter.page - 1) * filter.limit;
    let whereClause = 'WHERE al.organization_id = :organizationId';
    const replacements: unknown = {
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

    const total = parseInt((countResult[0] as unknown).total);

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
      logs: logs.map((log: unknown) => ({
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

    return requiredRole.includes((members[0] as unknown).role);
  }

  async getUserById(userId: number): Promise<unknown> {
    const [users] = await sequelize.query(
      `SELECT id, email, full_name, avatar_url FROM users WHERE id = :userId`,
      {
        replacements: { userId },
      }
    );

    if (users.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = users[0] as unknown;
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
    };
  }

  /**
   * Check if organization can create more teams based on subscription limits
   */
  async checkTeamLimits(organizationId: number, currentTeamCount: number): Promise<void> {
    try {
      // Get organization subscription info
      const [subscriptions] = await sequelize.query(
        `SELECT s.plan, s.status, s.amount
         FROM subscriptions s
         INNER JOIN users u ON s.user_id = u.id
         INNER JOIN organization_members om ON u.id = om.user_id
         WHERE om.organization_id = :organizationId
         AND s.status = 'active'
         ORDER BY s.created_at DESC
         LIMIT 1`,
        {
          replacements: { organizationId },
        }
      );

      if (subscriptions.length === 0) {
        // No active subscription - default to free tier limits
        await this.enforceTeamLimit(currentTeamCount, 'free');
        return;
      }

      const subscription = subscriptions[0] as unknown;
      await this.enforceTeamLimit(currentTeamCount, subscription.plan);

      // Log team limit check for audit
      logger.info('Team limit check performed', {
        organizationId,
        currentTeamCount,
        plan: subscription.plan,
        status: subscription.status,
      });
    } catch (error) {
      logger.error('Failed to check team limits', {
        error,
        organizationId,
        currentTeamCount,
      });
      throw error;
    }
  }

  /**
   * Enforce team limits based on subscription plan
   */
  private async enforceTeamLimit(currentCount: number, plan: string): Promise<void> {
    const teamLimits: Record<string, number> = {
      free: 1, // Free tier: 1 team
      basic: 3, // Basic plan: 3 teams
      pro: 10, // Pro plan: 10 teams
      team: 25, // Team plan: 25 teams
      enterprise: 100, // Enterprise plan: 100 teams
    };

    const limit = teamLimits[plan] || teamLimits.free;

    if (currentCount >= limit) {
      throw new AppError(
        `Team limit exceeded. Your ${plan} plan allows up to ${limit} teams. Please upgrade your subscription to create more teams.`,
        403
      );
    }
  }

  /**
   * Get team limits and usage for an organization
   */
  async getTeamLimitsInfo(organizationId: number): Promise<{
    currentCount: number;
    limit: number;
    plan: string;
    remaining: number;
    canCreateMore: boolean;
  }> {
    try {
      // Get current team count
      const [teamCount] = await sequelize.query(
        `SELECT COUNT(*) as count FROM teams WHERE organization_id = :organizationId`,
        {
          replacements: { organizationId },
        }
      );

      const currentCount = (teamCount[0] as unknown).count;

      // Get subscription info
      const [subscriptions] = await sequelize.query(
        `SELECT s.plan, s.status
         FROM subscriptions s
         INNER JOIN users u ON s.user_id = u.id
         INNER JOIN organization_members om ON u.id = om.user_id
         WHERE om.organization_id = :organizationId
         AND s.status = 'active'
         ORDER BY s.created_at DESC
         LIMIT 1`,
        {
          replacements: { organizationId },
        }
      );

      const plan = subscriptions.length > 0 ? (subscriptions[0] as unknown).plan : 'free';

      // Get limits for the plan
      const teamLimits: Record<string, number> = {
        free: 1,
        basic: 3,
        pro: 10,
        team: 25,
        enterprise: 100,
      };

      const limit = teamLimits[plan] || teamLimits.free;
      const remaining = Math.max(0, limit - currentCount);
      const canCreateMore = currentCount < limit;

      return {
        currentCount,
        limit,
        plan,
        remaining,
        canCreateMore,
      };
    } catch (error) {
      logger.error('Failed to get team limits info', {
        error,
        organizationId,
      });
      throw error;
    }
  }

  /**
   * Check if organization can add members to teams based on subscription limits
   */
  async checkTeamMemberLimits(organizationId: number, teamId: number): Promise<void> {
    try {
      // Get current member count for the team
      const [memberCount] = await sequelize.query(
        `SELECT COUNT(*) as count FROM team_members WHERE team_id = :teamId AND is_active = true`,
        {
          replacements: { teamId },
        }
      );

      const currentMemberCount = (memberCount[0] as unknown).count;

      // Get subscription info
      const [subscriptions] = await sequelize.query(
        `SELECT s.plan, s.status
         FROM subscriptions s
         INNER JOIN users u ON s.user_id = u.id
         INNER JOIN organization_members om ON u.id = om.user_id
         WHERE om.organization_id = :organizationId
         AND s.status = 'active'
         ORDER BY s.created_at DESC
         LIMIT 1`,
        {
          replacements: { organizationId },
        }
      );

      const plan = subscriptions.length > 0 ? (subscriptions[0] as unknown).plan : 'free';

      // Team member limits per plan
      const memberLimits: Record<string, number> = {
        free: 5, // Free tier: 5 members per team
        basic: 15, // Basic plan: 15 members per team
        pro: 50, // Pro plan: 50 members per team
        team: 100, // Team plan: 100 members per team
        enterprise: 500, // Enterprise plan: 500 members per team
      };

      const limit = memberLimits[plan] || memberLimits.free;

      if (currentMemberCount >= limit) {
        throw new AppError(
          `Team member limit exceeded. Your ${plan} plan allows up to ${limit} members per team. Please upgrade your subscription to add more members.`,
          403
        );
      }

      logger.info('Team member limit check passed', {
        organizationId,
        teamId,
        currentMemberCount,
        limit,
        plan,
      });
    } catch (error) {
      logger.error('Failed to check team member limits', {
        error,
        organizationId,
        teamId,
      });
      throw error;
    }
  }
}
