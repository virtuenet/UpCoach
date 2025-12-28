import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * Team Member Role
 */
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Team Configuration
 */
export interface Team {
  id: string;
  tenantId: string; // Multi-tenant isolation
  organizationId?: string;
  name: string;
  description?: string;
  avatar?: string;
  settings: {
    visibility: 'public' | 'private';
    joinApprovalRequired: boolean;
    memberCanInvite: boolean;
  };
  statistics: {
    memberCount: number;
    activeGoals: number;
    completedGoals: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Team Member
 */
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  invitedBy?: string;
  metadata?: Record<string, any>;
}

/**
 * Team Goal
 */
export interface TeamGoal {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  status: 'active' | 'completed' | 'cancelled';
  progress: number; // 0-100
  assignments: Array<{
    userId: string;
    role: 'lead' | 'contributor';
    contribution: number; // 0-100
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TeamManagementService
 *
 * Manages team creation, membership, permissions, and team-based goals.
 */
export class TeamManagementService extends EventEmitter {
  private static instance: TeamManagementService;
  private teams: Map<string, Team> = new Map();
  private members: Map<string, TeamMember> = new Map(); // memberId -> TeamMember
  private teamGoals: Map<string, TeamGoal> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): TeamManagementService {
    if (!TeamManagementService.instance) {
      TeamManagementService.instance = new TeamManagementService();
    }
    return TeamManagementService.instance;
  }

  /**
   * Create Team
   */
  async createTeam(
    tenantId: string,
    creatorId: string,
    config: {
      name: string;
      description?: string;
      organizationId?: string;
      visibility?: 'public' | 'private';
    }
  ): Promise<Team> {
    const team: Team = {
      id: crypto.randomUUID(),
      tenantId,
      organizationId: config.organizationId,
      name: config.name,
      description: config.description,
      settings: {
        visibility: config.visibility || 'private',
        joinApprovalRequired: true,
        memberCanInvite: false,
      },
      statistics: {
        memberCount: 1,
        activeGoals: 0,
        completedGoals: 0,
      },
      createdBy: creatorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.teams.set(team.id, team);

    // Add creator as owner
    await this.addMember(team.id, creatorId, 'owner', creatorId);

    this.emit('team:created', { teamId: team.id, creatorId });

    return team;
  }

  /**
   * Add Team Member
   */
  async addMember(
    teamId: string,
    userId: string,
    role: TeamRole = 'member',
    invitedBy?: string
  ): Promise<TeamMember> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const member: TeamMember = {
      id: crypto.randomUUID(),
      teamId,
      userId,
      role,
      joinedAt: new Date(),
      invitedBy,
    };

    this.members.set(member.id, member);
    team.statistics.memberCount++;

    this.emit('team:member_added', { teamId, userId, role });

    return member;
  }

  /**
   * Remove Team Member
   */
  async removeMember(teamId: string, userId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const member = Array.from(this.members.values()).find(
      m => m.teamId === teamId && m.userId === userId
    );

    if (!member) {
      throw new Error('Member not found');
    }

    this.members.delete(member.id);
    team.statistics.memberCount--;

    this.emit('team:member_removed', { teamId, userId });
  }

  /**
   * Update Member Role
   */
  async updateMemberRole(teamId: string, userId: string, role: TeamRole): Promise<TeamMember> {
    const member = Array.from(this.members.values()).find(
      m => m.teamId === teamId && m.userId === userId
    );

    if (!member) {
      throw new Error('Member not found');
    }

    member.role = role;

    this.emit('team:member_role_updated', { teamId, userId, role });

    return member;
  }

  /**
   * Create Team Goal
   */
  async createTeamGoal(
    teamId: string,
    creatorId: string,
    config: {
      title: string;
      description?: string;
      targetDate?: Date;
      assignments?: Array<{ userId: string; role: 'lead' | 'contributor' }>;
    }
  ): Promise<TeamGoal> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const goal: TeamGoal = {
      id: crypto.randomUUID(),
      teamId,
      title: config.title,
      description: config.description,
      targetDate: config.targetDate,
      status: 'active',
      progress: 0,
      assignments: (config.assignments || []).map(a => ({
        ...a,
        contribution: 0,
      })),
      createdBy: creatorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.teamGoals.set(goal.id, goal);
    team.statistics.activeGoals++;

    this.emit('team:goal_created', { teamId, goalId: goal.id });

    return goal;
  }

  /**
   * Update Team Goal Progress
   */
  async updateGoalProgress(goalId: string, progress: number): Promise<TeamGoal> {
    const goal = this.teamGoals.get(goalId);
    if (!goal) {
      throw new Error('Team goal not found');
    }

    goal.progress = Math.min(100, Math.max(0, progress));
    goal.updatedAt = new Date();

    if (goal.progress === 100 && goal.status === 'active') {
      goal.status = 'completed';

      const team = this.teams.get(goal.teamId);
      if (team) {
        team.statistics.activeGoals--;
        team.statistics.completedGoals++;
      }

      this.emit('team:goal_completed', { teamId: goal.teamId, goalId });
    }

    this.emit('team:goal_progress_updated', { goalId, progress });

    return goal;
  }

  /**
   * Get Team Members
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return Array.from(this.members.values()).filter(m => m.teamId === teamId);
  }

  /**
   * Get User Teams
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    const userTeamIds = Array.from(this.members.values())
      .filter(m => m.userId === userId)
      .map(m => m.teamId);

    return Array.from(this.teams.values()).filter(t => userTeamIds.includes(t.id));
  }

  /**
   * Get Team Goals
   */
  async getTeamGoals(teamId: string): Promise<TeamGoal[]> {
    return Array.from(this.teamGoals.values()).filter(g => g.teamId === teamId);
  }

  /**
   * Check User Permission
   */
  async hasPermission(
    teamId: string,
    userId: string,
    action: 'view' | 'edit' | 'admin' | 'owner'
  ): Promise<boolean> {
    const member = Array.from(this.members.values()).find(
      m => m.teamId === teamId && m.userId === userId
    );

    if (!member) {
      return false;
    }

    const permissions = {
      owner: ['view', 'edit', 'admin', 'owner'],
      admin: ['view', 'edit', 'admin'],
      member: ['view', 'edit'],
      viewer: ['view'],
    };

    return permissions[member.role].includes(action);
  }

  /**
   * Get Team Statistics
   */
  async getTeamStatistics(teamId: string): Promise<Team['statistics'] & {
    memberActivity: Array<{ userId: string; goalsCompleted: number; lastActive: Date }>;
  }> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // This would normally query actual activity data
    return {
      ...team.statistics,
      memberActivity: [],
    };
  }

  /**
   * Delete Team
   */
  async deleteTeam(teamId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Remove all members
    const teamMembers = await this.getTeamMembers(teamId);
    teamMembers.forEach(member => {
      this.members.delete(member.id);
    });

    // Remove all team goals
    const goals = await this.getTeamGoals(teamId);
    goals.forEach(goal => {
      this.teamGoals.delete(goal.id);
    });

    this.teams.delete(teamId);

    this.emit('team:deleted', { teamId });
  }
}

export const teamManagementService = TeamManagementService.getInstance();
