/**
 * Challenge Team Model
 * Team management for team-based challenges
 */

import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from 'sequelize';

/**
 * Team status
 */
export enum TeamStatus {
  FORMING = 'forming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISBANDED = 'disbanded',
}

/**
 * Team member
 */
export interface TeamMember {
  userId: string;
  role: 'captain' | 'member';
  joinedAt: Date;
  contributedScore: number;
  contributedStreak: number;
}

/**
 * Challenge Team attributes
 */
export interface ChallengeTeamAttributes {
  id: string;
  challengeId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  captainId: string;
  status: TeamStatus;

  // Members
  members: TeamMember[];
  memberCount: number;

  // Scoring
  totalScore: number;
  averageScore: number;
  completionPercentage: number;

  // Streaks
  combinedStreak: number;
  bestMemberStreak: number;

  // Ranking
  rank?: number;
  previousRank?: number;
  rankChange: number;

  // Visibility
  isPublic: boolean;
  inviteCode?: string;
  maxMembers?: number;

  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeTeamCreationAttributes
  extends Optional<
    ChallengeTeamAttributes,
    | 'id'
    | 'status'
    | 'members'
    | 'memberCount'
    | 'totalScore'
    | 'averageScore'
    | 'completionPercentage'
    | 'combinedStreak'
    | 'bestMemberStreak'
    | 'rankChange'
    | 'isPublic'
    | 'createdAt'
    | 'updatedAt'
  > {}

/**
 * Challenge Team Model
 */
export class ChallengeTeam extends Model<
  ChallengeTeamAttributes,
  ChallengeTeamCreationAttributes
> {
  public id!: string;
  public challengeId!: string;
  public name!: string;
  public description?: string;
  public avatarUrl?: string;
  public captainId!: string;
  public status!: TeamStatus;

  public members!: TeamMember[];
  public memberCount!: number;

  public totalScore!: number;
  public averageScore!: number;
  public completionPercentage!: number;

  public combinedStreak!: number;
  public bestMemberStreak!: number;

  public rank?: number;
  public previousRank?: number;
  public rankChange!: number;

  public isPublic!: boolean;
  public inviteCode?: string;
  public maxMembers?: number;

  public metadata?: Record<string, unknown>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Add member to team
   */
  public addMember(userId: string, role: 'captain' | 'member' = 'member'): boolean {
    if (this.maxMembers && this.memberCount >= this.maxMembers) {
      return false;
    }

    if (this.members.some(m => m.userId === userId)) {
      return false;
    }

    this.members.push({
      userId,
      role,
      joinedAt: new Date(),
      contributedScore: 0,
      contributedStreak: 0,
    });

    this.memberCount = this.members.length;
    return true;
  }

  /**
   * Remove member from team
   */
  public removeMember(userId: string): boolean {
    if (userId === this.captainId) {
      return false; // Can't remove captain
    }

    const index = this.members.findIndex(m => m.userId === userId);
    if (index === -1) {
      return false;
    }

    this.members.splice(index, 1);
    this.memberCount = this.members.length;
    return true;
  }

  /**
   * Transfer captain role
   */
  public transferCaptain(newCaptainId: string): boolean {
    const newCaptain = this.members.find(m => m.userId === newCaptainId);
    if (!newCaptain) {
      return false;
    }

    // Update roles
    const oldCaptain = this.members.find(m => m.userId === this.captainId);
    if (oldCaptain) {
      oldCaptain.role = 'member';
    }
    newCaptain.role = 'captain';
    this.captainId = newCaptainId;

    return true;
  }

  /**
   * Update member contribution
   */
  public updateMemberContribution(
    userId: string,
    score: number,
    streak: number
  ): void {
    const member = this.members.find(m => m.userId === userId);
    if (member) {
      member.contributedScore = score;
      member.contributedStreak = streak;
    }

    this.recalculateTotals();
  }

  /**
   * Recalculate team totals
   */
  public recalculateTotals(): void {
    // Total score
    this.totalScore = this.members.reduce((sum, m) => sum + m.contributedScore, 0);

    // Average score
    this.averageScore = this.memberCount > 0
      ? Math.round(this.totalScore / this.memberCount)
      : 0;

    // Combined and best streak
    this.combinedStreak = this.members.reduce((sum, m) => sum + m.contributedStreak, 0);
    this.bestMemberStreak = Math.max(0, ...this.members.map(m => m.contributedStreak));
  }

  /**
   * Update rank
   */
  public updateRank(newRank: number): void {
    this.previousRank = this.rank;
    this.rank = newRank;
    this.rankChange = this.previousRank ? this.previousRank - newRank : 0;
  }

  /**
   * Generate invite code
   */
  public generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'T-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.inviteCode = code;
    return code;
  }

  /**
   * Check if user is member
   */
  public isMember(userId: string): boolean {
    return this.members.some(m => m.userId === userId);
  }

  /**
   * Check if user is captain
   */
  public isCaptain(userId: string): boolean {
    return this.captainId === userId;
  }

  /**
   * Check if team is full
   */
  public get isFull(): boolean {
    return this.maxMembers ? this.memberCount >= this.maxMembers : false;
  }

  /**
   * Initialize model
   */
  public static initModel(sequelize: Sequelize): typeof ChallengeTeam {
    ChallengeTeam.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        challengeId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'challenge_id',
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        avatarUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'avatar_url',
        },
        captainId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'captain_id',
        },
        status: {
          type: DataTypes.ENUM(...Object.values(TeamStatus)),
          allowNull: false,
          defaultValue: TeamStatus.FORMING,
        },
        members: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        memberCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'member_count',
        },
        totalScore: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'total_score',
        },
        averageScore: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'average_score',
        },
        completionPercentage: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'completion_percentage',
        },
        combinedStreak: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'combined_streak',
        },
        bestMemberStreak: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'best_member_streak',
        },
        rank: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        previousRank: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'previous_rank',
        },
        rankChange: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'rank_change',
        },
        isPublic: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_public',
        },
        inviteCode: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
          field: 'invite_code',
        },
        maxMembers: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'max_members',
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'created_at',
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'updated_at',
        },
      },
      {
        sequelize,
        tableName: 'challenge_teams',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['challenge_id'] },
          { fields: ['captain_id'] },
          { fields: ['status'] },
          { fields: ['invite_code'], unique: true },
          { fields: ['total_score'] },
          { fields: ['rank'] },
        ],
      }
    );

    return ChallengeTeam;
  }
}

export default ChallengeTeam;
