/**
 * Social Challenge Model
 * Community challenges for engagement and gamification
 */

import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from 'sequelize';

/**
 * Challenge type
 */
export enum ChallengeType {
  INDIVIDUAL = 'individual',
  TEAM = 'team',
  COMMUNITY = 'community',
}

/**
 * Challenge category
 */
export enum ChallengeCategory {
  HABITS = 'habits',
  FITNESS = 'fitness',
  MINDFULNESS = 'mindfulness',
  LEARNING = 'learning',
  PRODUCTIVITY = 'productivity',
  SOCIAL = 'social',
  CUSTOM = 'custom',
}

/**
 * Challenge status
 */
export enum ChallengeStatus {
  DRAFT = 'draft',
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Scoring type
 */
export enum ScoringType {
  POINTS = 'points',
  COMPLETION = 'completion',
  STREAK = 'streak',
  TIME = 'time',
  CUSTOM = 'custom',
}

/**
 * Challenge requirement
 */
export interface ChallengeRequirement {
  id: string;
  type: 'habit_completion' | 'session_count' | 'streak_days' | 'minutes' | 'custom';
  description: string;
  targetValue: number;
  pointsPerCompletion: number;
  maxPoints?: number;
  habitId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Challenge prize
 */
export interface ChallengePrize {
  id: string;
  rank: number; // 1 = first place
  title: string;
  description: string;
  type: 'badge' | 'points' | 'feature' | 'discount' | 'physical';
  value?: string | number;
  imageUrl?: string;
}

/**
 * Challenge milestone
 */
export interface ChallengeMilestone {
  id: string;
  targetValue: number;
  title: string;
  description: string;
  reward?: string;
  badgeUrl?: string;
}

/**
 * Social Challenge attributes
 */
export interface SocialChallengeAttributes {
  id: string;
  creatorId: string;
  coachId?: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  type: ChallengeType;
  category: ChallengeCategory;
  status: ChallengeStatus;

  // Timing
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;

  // Rules
  requirements: ChallengeRequirement[];
  scoringType: ScoringType;
  scoringRules?: Record<string, unknown>;
  minParticipants?: number;
  maxParticipants?: number;

  // Team settings (for team challenges)
  minTeamSize?: number;
  maxTeamSize?: number;
  allowSoloParticipation: boolean;

  // Prizes and rewards
  prizes: ChallengePrize[];
  milestones: ChallengeMilestone[];
  participationReward?: string;
  totalPrizePool?: number;

  // Visibility
  isPublic: boolean;
  isOfficial: boolean;
  isFeatured: boolean;
  inviteOnly: boolean;
  inviteCode?: string;

  // Stats
  totalParticipants: number;
  totalTeams: number;
  totalCompletions: number;
  averageProgress: number;

  // Display
  colorHex?: string;
  iconName?: string;
  tags: string[];

  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialChallengeCreationAttributes
  extends Optional<
    SocialChallengeAttributes,
    | 'id'
    | 'status'
    | 'requirements'
    | 'scoringType'
    | 'allowSoloParticipation'
    | 'prizes'
    | 'milestones'
    | 'isPublic'
    | 'isOfficial'
    | 'isFeatured'
    | 'inviteOnly'
    | 'totalParticipants'
    | 'totalTeams'
    | 'totalCompletions'
    | 'averageProgress'
    | 'tags'
    | 'createdAt'
    | 'updatedAt'
  > {}

/**
 * Social Challenge Model
 */
export class SocialChallenge extends Model<
  SocialChallengeAttributes,
  SocialChallengeCreationAttributes
> {
  public id!: string;
  public creatorId!: string;
  public coachId?: string;
  public title!: string;
  public description!: string;
  public coverImageUrl?: string;
  public type!: ChallengeType;
  public category!: ChallengeCategory;
  public status!: ChallengeStatus;

  public startDate!: Date;
  public endDate!: Date;
  public registrationDeadline?: Date;

  public requirements!: ChallengeRequirement[];
  public scoringType!: ScoringType;
  public scoringRules?: Record<string, unknown>;
  public minParticipants?: number;
  public maxParticipants?: number;

  public minTeamSize?: number;
  public maxTeamSize?: number;
  public allowSoloParticipation!: boolean;

  public prizes!: ChallengePrize[];
  public milestones!: ChallengeMilestone[];
  public participationReward?: string;
  public totalPrizePool?: number;

  public isPublic!: boolean;
  public isOfficial!: boolean;
  public isFeatured!: boolean;
  public inviteOnly!: boolean;
  public inviteCode?: string;

  public totalParticipants!: number;
  public totalTeams!: number;
  public totalCompletions!: number;
  public averageProgress!: number;

  public colorHex?: string;
  public iconName?: string;
  public tags!: string[];

  public metadata?: Record<string, unknown>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Check if challenge is active
   */
  public get isActive(): boolean {
    const now = new Date();
    return this.status === ChallengeStatus.ACTIVE &&
      now >= this.startDate &&
      now <= this.endDate;
  }

  /**
   * Check if registration is open
   */
  public get isRegistrationOpen(): boolean {
    if (this.status !== ChallengeStatus.UPCOMING && this.status !== ChallengeStatus.ACTIVE) {
      return false;
    }

    const now = new Date();
    if (this.registrationDeadline && now > this.registrationDeadline) {
      return false;
    }

    if (this.maxParticipants && this.totalParticipants >= this.maxParticipants) {
      return false;
    }

    return true;
  }

  /**
   * Get duration in days
   */
  public get durationDays(): number {
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get days remaining
   */
  public get daysRemaining(): number {
    const now = new Date();
    if (now < this.startDate) {
      return this.durationDays;
    }
    if (now > this.endDate) {
      return 0;
    }
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate max possible points
   */
  public get maxPossiblePoints(): number {
    return this.requirements.reduce((sum, req) => {
      return sum + (req.maxPoints || req.pointsPerCompletion * req.targetValue);
    }, 0);
  }

  /**
   * Generate invite code
   */
  public generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.inviteCode = code;
    return code;
  }

  /**
   * Initialize model
   */
  public static initModel(sequelize: Sequelize): typeof SocialChallenge {
    SocialChallenge.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        creatorId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'creator_id',
        },
        coachId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'coach_id',
        },
        title: {
          type: DataTypes.STRING(200),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        coverImageUrl: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'cover_image_url',
        },
        type: {
          type: DataTypes.ENUM(...Object.values(ChallengeType)),
          allowNull: false,
        },
        category: {
          type: DataTypes.ENUM(...Object.values(ChallengeCategory)),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ChallengeStatus)),
          allowNull: false,
          defaultValue: ChallengeStatus.DRAFT,
        },
        startDate: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'start_date',
        },
        endDate: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'end_date',
        },
        registrationDeadline: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'registration_deadline',
        },
        requirements: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        scoringType: {
          type: DataTypes.ENUM(...Object.values(ScoringType)),
          allowNull: false,
          defaultValue: ScoringType.POINTS,
          field: 'scoring_type',
        },
        scoringRules: {
          type: DataTypes.JSONB,
          allowNull: true,
          field: 'scoring_rules',
        },
        minParticipants: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'min_participants',
        },
        maxParticipants: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'max_participants',
        },
        minTeamSize: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'min_team_size',
        },
        maxTeamSize: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'max_team_size',
        },
        allowSoloParticipation: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'allow_solo_participation',
        },
        prizes: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        milestones: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        participationReward: {
          type: DataTypes.STRING(200),
          allowNull: true,
          field: 'participation_reward',
        },
        totalPrizePool: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          field: 'total_prize_pool',
        },
        isPublic: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_public',
        },
        isOfficial: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_official',
        },
        isFeatured: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_featured',
        },
        inviteOnly: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'invite_only',
        },
        inviteCode: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
          field: 'invite_code',
        },
        totalParticipants: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'total_participants',
        },
        totalTeams: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'total_teams',
        },
        totalCompletions: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'total_completions',
        },
        averageProgress: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
          field: 'average_progress',
        },
        colorHex: {
          type: DataTypes.STRING(7),
          allowNull: true,
          field: 'color_hex',
        },
        iconName: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: 'icon_name',
        },
        tags: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
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
        tableName: 'social_challenges',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['creator_id'] },
          { fields: ['coach_id'] },
          { fields: ['type'] },
          { fields: ['category'] },
          { fields: ['status'] },
          { fields: ['start_date'] },
          { fields: ['end_date'] },
          { fields: ['is_public'] },
          { fields: ['is_featured'] },
          { fields: ['invite_code'], unique: true },
        ],
      }
    );

    return SocialChallenge;
  }
}

export default SocialChallenge;
