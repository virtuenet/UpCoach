import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';

/**
 * Team Coaching Engine
 *
 * Manages team-based coaching programs, group dynamics, and collaborative
 * coaching sessions for enterprise clients.
 *
 * Features:
 * - Team formation and management
 * - Group coaching sessions
 * - Team goal tracking
 * - Collaborative exercises
 * - Team performance analytics
 * - Inter-team collaboration
 */

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: 'functional' | 'cross-functional' | 'project' | 'leadership';
  members: TeamMember[];
  coaches: string[]; // Coach IDs
  goals: TeamGoal[];
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  role: 'member' | 'lead' | 'manager';
  joinedAt: Date;
  status: 'active' | 'inactive';
}

export interface TeamGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: Date;
  progress: number; // 0-100
  metrics: TeamMetric[];
  assignedMembers: string[];
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
}

export interface TeamMetric {
  name: string;
  current: number;
  target: number;
  unit: string;
}

export interface TeamSession {
  id: string;
  teamId: string;
  coachId: string;
  title: string;
  agenda: string[];
  type: 'workshop' | 'retrospective' | 'planning' | 'review' | 'coaching';
  scheduledAt: Date;
  duration: number; // minutes
  participants: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  outcomes?: string[];
  recordings?: string[];
}

export interface TeamDynamics {
  teamId: string;
  collaboration: number; // 0-100
  communication: number;
  trust: number;
  productivity: number;
  engagement: number;
  conflictResolution: number;
  calculatedAt: Date;
}

export class TeamCoachingEngine extends EventEmitter {
  private logger: Logger;
  private teams: Map<string, Team>;
  private sessions: Map<string, TeamSession>;
  private dynamics: Map<string, TeamDynamics>;

  constructor() {
    super();
    this.logger = new Logger('TeamCoachingEngine');
    this.teams = new Map();
    this.sessions = new Map();
    this.dynamics = new Map();
  }

  /**
   * Initialize the team coaching engine
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing team coaching engine...');

      await this.loadTeams();
      await this.loadSessions();

      this.setupEventListeners();

      this.logger.info('Team coaching engine initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize team coaching engine', error);
      throw error;
    }
  }

  /**
   * Create a new team
   */
  async createTeam(config: Partial<Team>): Promise<Team> {
    try {
      const team: Team = {
        id: this.generateTeamId(),
        organizationId: config.organizationId || '',
        name: config.name || '',
        description: config.description || '',
        type: config.type || 'functional',
        members: config.members || [],
        coaches: config.coaches || [],
        goals: config.goals || [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.saveTeam(team);
      this.teams.set(team.id, team);

      // Initialize team dynamics
      await this.initializeTeamDynamics(team.id);

      this.emit('team:created', team);
      this.logger.info('Team created', { teamId: team.id, name: team.name });

      return team;
    } catch (error) {
      this.logger.error('Failed to create team', error);
      throw error;
    }
  }

  /**
   * Add member to team
   */
  async addTeamMember(
    teamId: string,
    userId: string,
    role: TeamMember['role'] = 'member'
  ): Promise<void> {
    try {
      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error('Team not found');
      }

      // Check if member already exists
      if (team.members.some(m => m.userId === userId)) {
        throw new Error('User is already a team member');
      }

      const member: TeamMember = {
        userId,
        role,
        joinedAt: new Date(),
        status: 'active',
      };

      team.members.push(member);
      team.updatedAt = new Date();

      await this.saveTeam(team);

      this.emit('team:member:added', { teamId, userId, role });
      this.logger.info('Team member added', { teamId, userId, role });
    } catch (error) {
      this.logger.error('Failed to add team member', { teamId, userId, error });
      throw error;
    }
  }

  /**
   * Remove member from team
   */
  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error('Team not found');
      }

      team.members = team.members.filter(m => m.userId !== userId);
      team.updatedAt = new Date();

      await this.saveTeam(team);

      this.emit('team:member:removed', { teamId, userId });
      this.logger.info('Team member removed', { teamId, userId });
    } catch (error) {
      this.logger.error('Failed to remove team member', { teamId, userId, error });
      throw error;
    }
  }

  /**
   * Assign coach to team
   */
  async assignCoach(teamId: string, coachId: string): Promise<void> {
    try {
      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error('Team not found');
      }

      if (!team.coaches.includes(coachId)) {
        team.coaches.push(coachId);
        team.updatedAt = new Date();

        await this.saveTeam(team);

        this.emit('team:coach:assigned', { teamId, coachId });
        this.logger.info('Coach assigned to team', { teamId, coachId });
      }
    } catch (error) {
      this.logger.error('Failed to assign coach', { teamId, coachId, error });
      throw error;
    }
  }

  /**
   * Create team goal
   */
  async createTeamGoal(teamId: string, goal: Partial<TeamGoal>): Promise<TeamGoal> {
    try {
      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error('Team not found');
      }

      const teamGoal: TeamGoal = {
        id: this.generateGoalId(),
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || 'general',
        targetDate: goal.targetDate || new Date(),
        progress: 0,
        metrics: goal.metrics || [],
        assignedMembers: goal.assignedMembers || [],
        status: 'not-started',
      };

      team.goals.push(teamGoal);
      team.updatedAt = new Date();

      await this.saveTeam(team);

      this.emit('team:goal:created', { teamId, goal: teamGoal });
      this.logger.info('Team goal created', { teamId, goalId: teamGoal.id });

      return teamGoal;
    } catch (error) {
      this.logger.error('Failed to create team goal', { teamId, error });
      throw error;
    }
  }

  /**
   * Update team goal progress
   */
  async updateGoalProgress(
    teamId: string,
    goalId: string,
    progress: number,
    status?: TeamGoal['status']
  ): Promise<void> {
    try {
      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error('Team not found');
      }

      const goal = team.goals.find(g => g.id === goalId);

      if (!goal) {
        throw new Error('Goal not found');
      }

      goal.progress = Math.min(100, Math.max(0, progress));

      if (status) {
        goal.status = status;
      } else if (goal.progress === 100) {
        goal.status = 'completed';
      } else if (goal.progress > 0) {
        goal.status = 'in-progress';
      }

      team.updatedAt = new Date();

      await this.saveTeam(team);

      this.emit('team:goal:updated', { teamId, goalId, progress, status: goal.status });

      if (goal.status === 'completed') {
        this.emit('team:goal:completed', { teamId, goalId });
      }
    } catch (error) {
      this.logger.error('Failed to update goal progress', { teamId, goalId, error });
      throw error;
    }
  }

  /**
   * Schedule team session
   */
  async scheduleSession(session: Partial<TeamSession>): Promise<TeamSession> {
    try {
      const teamSession: TeamSession = {
        id: this.generateSessionId(),
        teamId: session.teamId || '',
        coachId: session.coachId || '',
        title: session.title || '',
        agenda: session.agenda || [],
        type: session.type || 'coaching',
        scheduledAt: session.scheduledAt || new Date(),
        duration: session.duration || 60,
        participants: session.participants || [],
        status: 'scheduled',
      };

      await this.saveSession(teamSession);
      this.sessions.set(teamSession.id, teamSession);

      this.emit('session:scheduled', teamSession);
      this.logger.info('Team session scheduled', {
        sessionId: teamSession.id,
        teamId: teamSession.teamId,
      });

      return teamSession;
    } catch (error) {
      this.logger.error('Failed to schedule session', error);
      throw error;
    }
  }

  /**
   * Start team session
   */
  async startSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'in-progress';

      await this.saveSession(session);

      this.emit('session:started', session);
      this.logger.info('Team session started', { sessionId });
    } catch (error) {
      this.logger.error('Failed to start session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Complete team session
   */
  async completeSession(
    sessionId: string,
    notes?: string,
    outcomes?: string[]
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'completed';
      session.notes = notes;
      session.outcomes = outcomes;

      await this.saveSession(session);

      // Update team dynamics after session
      await this.updateTeamDynamics(session.teamId);

      this.emit('session:completed', session);
      this.logger.info('Team session completed', { sessionId });
    } catch (error) {
      this.logger.error('Failed to complete session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Calculate team dynamics
   */
  async calculateTeamDynamics(teamId: string): Promise<TeamDynamics> {
    try {
      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error('Team not found');
      }

      // Mock calculation - would use ML/analytics in production
      const dynamics: TeamDynamics = {
        teamId,
        collaboration: this.calculateScore(team, 'collaboration'),
        communication: this.calculateScore(team, 'communication'),
        trust: this.calculateScore(team, 'trust'),
        productivity: this.calculateScore(team, 'productivity'),
        engagement: this.calculateScore(team, 'engagement'),
        conflictResolution: this.calculateScore(team, 'conflictResolution'),
        calculatedAt: new Date(),
      };

      this.dynamics.set(teamId, dynamics);

      return dynamics;
    } catch (error) {
      this.logger.error('Failed to calculate team dynamics', { teamId, error });
      throw error;
    }
  }

  /**
   * Get team analytics
   */
  async getTeamAnalytics(teamId: string): Promise<any> {
    try {
      const team = this.teams.get(teamId);
      const dynamics = this.dynamics.get(teamId);

      if (!team) {
        return null;
      }

      const sessions = Array.from(this.sessions.values()).filter(
        s => s.teamId === teamId
      );

      const completedGoals = team.goals.filter(g => g.status === 'completed').length;
      const totalGoals = team.goals.length;

      return {
        teamId,
        teamName: team.name,
        memberCount: team.members.filter(m => m.status === 'active').length,
        coachCount: team.coaches.length,
        totalGoals,
        completedGoals,
        goalCompletionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        dynamics: dynamics || null,
        averageGoalProgress:
          totalGoals > 0
            ? team.goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals
            : 0,
      };
    } catch (error) {
      this.logger.error('Failed to get team analytics', { teamId, error });
      return null;
    }
  }

  /**
   * Get team by ID
   */
  getTeam(teamId: string): Team | null {
    return this.teams.get(teamId) || null;
  }

  /**
   * Get teams for organization
   */
  getOrganizationTeams(organizationId: string): Team[] {
    return Array.from(this.teams.values()).filter(
      t => t.organizationId === organizationId && t.status === 'active'
    );
  }

  /**
   * Get sessions for team
   */
  getTeamSessions(teamId: string): TeamSession[] {
    return Array.from(this.sessions.values()).filter(s => s.teamId === teamId);
  }

  // Private helper methods

  private async initializeTeamDynamics(teamId: string): Promise<void> {
    await this.calculateTeamDynamics(teamId);
  }

  private async updateTeamDynamics(teamId: string): Promise<void> {
    await this.calculateTeamDynamics(teamId);
  }

  private calculateScore(team: Team, metric: string): number {
    // Mock calculation - would use real data in production
    const baseScore = 60;
    const memberBonus = Math.min(team.members.length * 2, 20);
    const goalBonus = Math.min(
      team.goals.filter(g => g.status === 'completed').length * 5,
      20
    );
    return Math.min(100, baseScore + memberBonus + goalBonus + Math.random() * 10);
  }

  private generateTeamId(): string {
    return `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateGoalId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadTeams(): Promise<void> {
    // Mock implementation - would load from database
    this.logger.info('Loaded teams', { count: this.teams.size });
  }

  private async loadSessions(): Promise<void> {
    // Mock implementation - would load from database
    this.logger.info('Loaded sessions', { count: this.sessions.size });
  }

  private async saveTeam(team: Team): Promise<void> {
    // Mock implementation - would save to database
  }

  private async saveSession(session: TeamSession): Promise<void> {
    // Mock implementation - would save to database
  }

  private setupEventListeners(): void {
    this.on('team:goal:completed', (data) => {
      this.logger.info('Team goal completed', data);
    });

    this.on('session:completed', (session) => {
      this.logger.info('Session completed', { sessionId: session.id });
    });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down team coaching engine...');
    this.teams.clear();
    this.sessions.clear();
    this.dynamics.clear();
    this.removeAllListeners();
  }
}

export default TeamCoachingEngine;
