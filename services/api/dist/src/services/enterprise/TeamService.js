"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamService = void 0;
const models_1 = require("../../models");
const Team_1 = require("../../models/Team");
const errors_1 = require("../../utils/errors");
const logger_1 = require("../../utils/logger");
class TeamService {
    async createTeam(data) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const [teamCount] = await models_1.sequelize.query(`SELECT COUNT(*) as count FROM teams WHERE organization_id = :organizationId`, {
                replacements: { organizationId: data.organizationId },
                transaction,
            });
            const currentTeamCount = teamCount[0].count;
            await this.checkTeamLimits(data.organizationId, currentTeamCount);
            const team = await Team_1.Team.create({
                organizationId: data.organizationId,
                name: data.name,
                description: data.description,
                department: data.department,
                managerId: data.managerId,
                settings: {},
            }, { transaction });
            if (data.managerId) {
                await models_1.sequelize.query(`INSERT INTO team_members (team_id, user_id, role, is_active)
           VALUES (:teamId, :userId, 'lead', true)`, {
                    replacements: {
                        teamId: team.id,
                        userId: data.managerId,
                    },
                    transaction,
                });
            }
            await transaction.commit();
            logger_1.logger.info('Team created', {
                teamId: team.id,
                organizationId: data.organizationId,
                name: data.name,
            });
            return team;
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to create team', error);
            throw error;
        }
    }
    async updateTeam(teamId, data) {
        const team = await Team_1.Team.findByPk(teamId);
        if (!team) {
            throw new errors_1.AppError('Team not found', 404);
        }
        await team.update(data);
        logger_1.logger.info('Team updated', {
            teamId,
            updates: Object.keys(data),
        });
        return team;
    }
    async getOrganizationTeams(organizationId) {
        const [teams] = await models_1.sequelize.query(`SELECT 
        t.*,
        u.full_name as manager_name,
        COUNT(DISTINCT tm.user_id) as member_count
       FROM teams t
       LEFT JOIN users u ON t.manager_id = u.id
       LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
       WHERE t.organization_id = :organizationId
       GROUP BY t.id, u.full_name
       ORDER BY t.created_at DESC`, {
            replacements: { organizationId },
        });
        return teams;
    }
    async addTeamMember(teamId, userId, role, addedBy) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const [teams] = await models_1.sequelize.query(`SELECT organization_id FROM teams WHERE id = :teamId`, {
                replacements: { teamId },
                transaction,
            });
            if (teams.length === 0) {
                throw new errors_1.AppError('Team not found', 404);
            }
            const organizationId = teams[0].organization_id;
            const [existing] = await models_1.sequelize.query(`SELECT * FROM team_members WHERE team_id = :teamId AND user_id = :userId`, {
                replacements: { teamId, userId },
                transaction,
            });
            if (existing.length > 0) {
                await models_1.sequelize.query(`UPDATE team_members 
           SET role = :role, is_active = true, invited_by = :addedBy
           WHERE team_id = :teamId AND user_id = :userId`, {
                    replacements: { role, addedBy, teamId, userId },
                    transaction,
                });
            }
            else {
                await this.checkTeamMemberLimits(organizationId, teamId);
                await models_1.sequelize.query(`INSERT INTO team_members (team_id, user_id, role, invited_by, is_active)
           VALUES (:teamId, :userId, :role, :addedBy, true)`, {
                    replacements: { teamId, userId, role, addedBy },
                    transaction,
                });
            }
            await transaction.commit();
            logger_1.logger.info('Team member added', {
                teamId,
                userId,
                role,
                addedBy,
            });
        }
        catch (error) {
            await transaction.rollback();
            logger_1.logger.error('Failed to add team member', error);
            throw error;
        }
    }
    async removeTeamMember(teamId, userId) {
        await models_1.sequelize.query(`UPDATE team_members 
       SET is_active = false
       WHERE team_id = :teamId AND user_id = :userId`, {
            replacements: { teamId, userId },
        });
        logger_1.logger.info('Team member removed', {
            teamId,
            userId,
        });
    }
    async getTeamMembers(teamId) {
        const [members] = await models_1.sequelize.query(`SELECT 
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
       ORDER BY tm.joined_at DESC`, {
            replacements: { teamId },
        });
        return members;
    }
    async createPolicy(data) {
        const [result] = await models_1.sequelize.query(`INSERT INTO enterprise_policies 
       (organization_id, name, type, rules, enforcement_level, applies_to, created_by)
       VALUES (:organizationId, :name, :type, :rules, :enforcementLevel, :appliesTo, :createdBy)
       RETURNING *`, {
            replacements: {
                organizationId: data.organizationId,
                name: data.name,
                type: data.type,
                rules: JSON.stringify(data.rules),
                enforcementLevel: data.enforcementLevel,
                appliesTo: JSON.stringify(data.appliesTo || {}),
                createdBy: data.createdBy,
            },
        });
        logger_1.logger.info('Policy created', {
            policyId: result[0].id,
            organizationId: data.organizationId,
            type: data.type,
        });
        return result[0];
    }
    async getOrganizationPolicies(organizationId) {
        const [policies] = await models_1.sequelize.query(`SELECT 
        p.*,
        u.full_name as created_by_name
       FROM enterprise_policies p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.organization_id = :organizationId
       AND p.is_active = true
       ORDER BY p.created_at DESC`, {
            replacements: { organizationId },
        });
        return policies.map((policy) => ({
            ...policy,
            rules: JSON.parse(policy.rules),
            applies_to: JSON.parse(policy.applies_to),
        }));
    }
    async updatePolicy(policyId, data) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const [existingPolicies] = await models_1.sequelize.query(`SELECT * FROM enterprise_policies WHERE id = :policyId AND is_active = true`, {
                replacements: { policyId },
                transaction,
            });
            if (existingPolicies.length === 0) {
                throw new errors_1.AppError('Policy not found', 404);
            }
            const existingPolicy = existingPolicies[0];
            const updateFields = [];
            const replacements = { policyId, updatedBy: data.updatedBy };
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
            if (updateFields.length === 1) {
                throw new errors_1.AppError('No fields to update', 400);
            }
            const [result] = await models_1.sequelize.query(`UPDATE enterprise_policies
         SET ${updateFields.join(', ')}
         WHERE id = :policyId
         RETURNING *`, {
                replacements,
                transaction,
            });
            await this.logAuditEvent(existingPolicy.organization_id, data.updatedBy, 'policy_updated', 'policy', policyId.toString(), {
                previousValues: {
                    name: existingPolicy.name,
                    type: existingPolicy.type,
                    enforcementLevel: existingPolicy.enforcement_level,
                },
                newValues: data,
            });
            await transaction.commit();
            logger_1.logger.info('Policy updated', {
                policyId,
                organizationId: existingPolicy.organization_id,
                updatedBy: data.updatedBy,
            });
            const updatedPolicy = result[0];
            return {
                ...updatedPolicy,
                rules: JSON.parse(updatedPolicy.rules),
                applies_to: JSON.parse(updatedPolicy.applies_to),
            };
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async deletePolicy(policyId, data) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const [existingPolicies] = await models_1.sequelize.query(`SELECT * FROM enterprise_policies WHERE id = :policyId AND is_active = true`, {
                replacements: { policyId },
                transaction,
            });
            if (existingPolicies.length === 0) {
                throw new errors_1.AppError('Policy not found', 404);
            }
            const existingPolicy = existingPolicies[0];
            await models_1.sequelize.query(`UPDATE enterprise_policies
         SET is_active = false,
             deleted_at = NOW(),
             updated_at = NOW()
         WHERE id = :policyId`, {
                replacements: { policyId },
                transaction,
            });
            await this.logAuditEvent(existingPolicy.organization_id, data.deletedBy, 'policy_deleted', 'policy', policyId.toString(), {
                policyName: existingPolicy.name,
                policyType: existingPolicy.type,
            });
            await transaction.commit();
            logger_1.logger.info('Policy deleted', {
                policyId,
                organizationId: existingPolicy.organization_id,
                deletedBy: data.deletedBy,
            });
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async togglePolicy(policyId, data) {
        const transaction = await models_1.sequelize.transaction();
        try {
            const [existingPolicies] = await models_1.sequelize.query(`SELECT * FROM enterprise_policies WHERE id = :policyId AND is_active = true`, {
                replacements: { policyId },
                transaction,
            });
            if (existingPolicies.length === 0) {
                throw new errors_1.AppError('Policy not found', 404);
            }
            const existingPolicy = existingPolicies[0];
            const newEnabledState = data.enabled !== undefined
                ? data.enabled
                : !existingPolicy.is_enabled;
            const [result] = await models_1.sequelize.query(`UPDATE enterprise_policies
         SET is_enabled = :isEnabled,
             updated_at = NOW()
         WHERE id = :policyId
         RETURNING *`, {
                replacements: {
                    policyId,
                    isEnabled: newEnabledState
                },
                transaction,
            });
            await this.logAuditEvent(existingPolicy.organization_id, data.updatedBy, newEnabledState ? 'policy_enabled' : 'policy_disabled', 'policy', policyId.toString(), {
                policyName: existingPolicy.name,
                previousState: existingPolicy.is_enabled,
                newState: newEnabledState,
            });
            await transaction.commit();
            logger_1.logger.info('Policy toggled', {
                policyId,
                organizationId: existingPolicy.organization_id,
                enabled: newEnabledState,
                updatedBy: data.updatedBy,
            });
            const updatedPolicy = result[0];
            return {
                ...updatedPolicy,
                rules: JSON.parse(updatedPolicy.rules),
                applies_to: JSON.parse(updatedPolicy.applies_to),
                isActive: updatedPolicy.is_enabled,
            };
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async logAuditEvent(organizationId, userId, action, resourceType, resourceId, details, ipAddress, userAgent) {
        await models_1.sequelize.query(`INSERT INTO enterprise_audit_logs 
       (organization_id, user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent)
       VALUES (:organizationId, :userId, :action, :resourceType, :resourceId, 
        :details, :ipAddress, :userAgent)`, {
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
        });
    }
    async getAuditLogs(organizationId, filter) {
        const offset = (filter.page - 1) * filter.limit;
        let whereClause = 'WHERE al.organization_id = :organizationId';
        const replacements = {
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
        const [countResult] = await models_1.sequelize.query(`SELECT COUNT(*) as total
       FROM enterprise_audit_logs al
       ${whereClause}`, { replacements });
        const total = parseInt(countResult[0].total);
        const [logs] = await models_1.sequelize.query(`SELECT 
        al.*,
        u.full_name as user_name,
        u.email as user_email
       FROM enterprise_audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT :limit OFFSET :offset`, { replacements });
        return {
            logs: logs.map((log) => ({
                ...log,
                details: log.details ? JSON.parse(log.details) : null,
            })),
            total,
            page: filter.page,
            totalPages: Math.ceil(total / filter.limit),
        };
    }
    async checkTeamPermission(teamId, userId, requiredRole) {
        const [members] = await models_1.sequelize.query(`SELECT role FROM team_members
       WHERE team_id = :teamId 
       AND user_id = :userId 
       AND is_active = true`, {
            replacements: { teamId, userId },
        });
        if (members.length === 0) {
            return false;
        }
        return requiredRole.includes(members[0].role);
    }
    async getUserById(userId) {
        const [users] = await models_1.sequelize.query(`SELECT id, email, full_name, avatar_url FROM users WHERE id = :userId`, {
            replacements: { userId },
        });
        if (users.length === 0) {
            throw new errors_1.AppError('User not found', 404);
        }
        const user = users[0];
        return {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
        };
    }
    async checkTeamLimits(organizationId, currentTeamCount) {
        try {
            const [subscriptions] = await models_1.sequelize.query(`SELECT s.plan, s.status, s.amount
         FROM subscriptions s
         INNER JOIN users u ON s.user_id = u.id
         INNER JOIN organization_members om ON u.id = om.user_id
         WHERE om.organization_id = :organizationId
         AND s.status = 'active'
         ORDER BY s.created_at DESC
         LIMIT 1`, {
                replacements: { organizationId },
            });
            if (subscriptions.length === 0) {
                await this.enforceTeamLimit(currentTeamCount, 'free');
                return;
            }
            const subscription = subscriptions[0];
            await this.enforceTeamLimit(currentTeamCount, subscription.plan);
            logger_1.logger.info('Team limit check performed', {
                organizationId,
                currentTeamCount,
                plan: subscription.plan,
                status: subscription.status,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to check team limits', {
                error,
                organizationId,
                currentTeamCount,
            });
            throw error;
        }
    }
    async enforceTeamLimit(currentCount, plan) {
        const teamLimits = {
            free: 1,
            basic: 3,
            pro: 10,
            team: 25,
            enterprise: 100,
        };
        const limit = teamLimits[plan] || teamLimits.free;
        if (currentCount >= limit) {
            throw new errors_1.AppError(`Team limit exceeded. Your ${plan} plan allows up to ${limit} teams. Please upgrade your subscription to create more teams.`, 403);
        }
    }
    async getTeamLimitsInfo(organizationId) {
        try {
            const [teamCount] = await models_1.sequelize.query(`SELECT COUNT(*) as count FROM teams WHERE organization_id = :organizationId`, {
                replacements: { organizationId },
            });
            const currentCount = teamCount[0].count;
            const [subscriptions] = await models_1.sequelize.query(`SELECT s.plan, s.status
         FROM subscriptions s
         INNER JOIN users u ON s.user_id = u.id
         INNER JOIN organization_members om ON u.id = om.user_id
         WHERE om.organization_id = :organizationId
         AND s.status = 'active'
         ORDER BY s.created_at DESC
         LIMIT 1`, {
                replacements: { organizationId },
            });
            const plan = subscriptions.length > 0 ? subscriptions[0].plan : 'free';
            const teamLimits = {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get team limits info', {
                error,
                organizationId,
            });
            throw error;
        }
    }
    async checkTeamMemberLimits(organizationId, teamId) {
        try {
            const [memberCount] = await models_1.sequelize.query(`SELECT COUNT(*) as count FROM team_members WHERE team_id = :teamId AND is_active = true`, {
                replacements: { teamId },
            });
            const currentMemberCount = memberCount[0].count;
            const [subscriptions] = await models_1.sequelize.query(`SELECT s.plan, s.status
         FROM subscriptions s
         INNER JOIN users u ON s.user_id = u.id
         INNER JOIN organization_members om ON u.id = om.user_id
         WHERE om.organization_id = :organizationId
         AND s.status = 'active'
         ORDER BY s.created_at DESC
         LIMIT 1`, {
                replacements: { organizationId },
            });
            const plan = subscriptions.length > 0 ? subscriptions[0].plan : 'free';
            const memberLimits = {
                free: 5,
                basic: 15,
                pro: 50,
                team: 100,
                enterprise: 500,
            };
            const limit = memberLimits[plan] || memberLimits.free;
            if (currentMemberCount >= limit) {
                throw new errors_1.AppError(`Team member limit exceeded. Your ${plan} plan allows up to ${limit} members per team. Please upgrade your subscription to add more members.`, 403);
            }
            logger_1.logger.info('Team member limit check passed', {
                organizationId,
                teamId,
                currentMemberCount,
                limit,
                plan,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to check team member limits', {
                error,
                organizationId,
                teamId,
            });
            throw error;
        }
    }
}
exports.TeamService = TeamService;
//# sourceMappingURL=TeamService.js.map