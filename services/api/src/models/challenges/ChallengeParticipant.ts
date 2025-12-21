/**
 * Challenge Participant Model
 * Tracks user participation in challenges
 */

import {
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from 'sequelize';

/**
 * Participant status
 */
export enum ParticipantStatus {
  REGISTERED = 'registered',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  WITHDRAWN = 'withdrawn',
  DISQUALIFIED = 'disqualified',
}

/**
 * Progress entry
 */
export interface ProgressEntry {
  requirementId: string;
  currentValue: number;
  targetValue: number;
  pointsEarned: number;
  lastUpdated: Date;
  history?: Array<{
    value: number;
    timestamp: Date;
    source?: string;
  }>;
}

/**
 * Milestone achievement
 */
export interface MilestoneAchievement {
  milestoneId: string;
  achievedAt: Date;
  notified: boolean;
}

/**
 * Challenge Participant attributes
 */
export interface ChallengeParticipantAttributes {
  id: string;
  challengeId: string;
  userId: string;
  teamId?: string;
  status: ParticipantStatus;

  // Progress
  progress: ProgressEntry[];
  totalScore: number;
  completionPercentage: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;

  // Achievements
  milestonesAchieved: MilestoneAchievement[];
  badgesEarned: string[];

  // Ranking
  rank?: number;
  previousRank?: number;
  rankChange: number;

  // Engagement
  cheersGiven: number;
  cheersReceived: number;
  commentsCount: number;

  // Timestamps
  joinedAt: Date;
  completedAt?: Date;
  withdrawnAt?: Date;

  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeParticipantCreationAttributes
  extends Optional<
    ChallengeParticipantAttributes,
    | 'id'
    | 'status'
    | 'progress'
    | 'totalScore'
    | 'completionPercentage'
    | 'currentStreak'
    | 'longestStreak'
    | 'milestonesAchieved'
    | 'badgesEarned'
    | 'rankChange'
    | 'cheersGiven'
    | 'cheersReceived'
    | 'commentsCount'
    | 'joinedAt'
    | 'createdAt'
    | 'updatedAt'
  > {}

/**
 * Challenge Participant Model
 */
export class ChallengeParticipant extends Model<
  ChallengeParticipantAttributes,
  ChallengeParticipantCreationAttributes
> {
  public id!: string;
  public challengeId!: string;
  public userId!: string;
  public teamId?: string;
  public status!: ParticipantStatus;

  public progress!: ProgressEntry[];
  public totalScore!: number;
  public completionPercentage!: number;

  public currentStreak!: number;
  public longestStreak!: number;
  public lastActivityDate?: Date;

  public milestonesAchieved!: MilestoneAchievement[];
  public badgesEarned!: string[];

  public rank?: number;
  public previousRank?: number;
  public rankChange!: number;

  public cheersGiven!: number;
  public cheersReceived!: number;
  public commentsCount!: number;

  public joinedAt!: Date;
  public completedAt?: Date;
  public withdrawnAt?: Date;

  public metadata?: Record<string, unknown>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Update progress for a requirement
   */
  public updateProgress(
    requirementId: string,
    value: number,
    targetValue: number,
    pointsPerCompletion: number,
    maxPoints?: number
  ): void {
    const existing = this.progress.find(p => p.requirementId === requirementId);
    const now = new Date();

    // Calculate points
    const previousValue = existing?.currentValue || 0;
    const increment = Math.max(0, value - previousValue);
    let newPoints = existing?.pointsEarned || 0;

    if (increment > 0) {
      const pointsToAdd = Math.min(
        increment * pointsPerCompletion,
        maxPoints ? maxPoints - newPoints : Infinity
      );
      newPoints += pointsToAdd;
    }

    if (existing) {
      existing.currentValue = value;
      existing.pointsEarned = newPoints;
      existing.lastUpdated = now;
      existing.history?.push({ value, timestamp: now });
    } else {
      this.progress.push({
        requirementId,
        currentValue: value,
        targetValue,
        pointsEarned: newPoints,
        lastUpdated: now,
        history: [{ value, timestamp: now }],
      });
    }

    // Update totals
    this.recalculateTotals();

    // Update streak
    this.updateStreak();
  }

  /**
   * Recalculate total score and completion
   */
  public recalculateTotals(): void {
    // Calculate total score
    this.totalScore = this.progress.reduce((sum, p) => sum + p.pointsEarned, 0);

    // Calculate completion percentage
    if (this.progress.length === 0) {
      this.completionPercentage = 0;
    } else {
      let totalProgress = 0;
      for (const p of this.progress) {
        totalProgress += Math.min(p.currentValue / p.targetValue, 1);
      }
      this.completionPercentage = Math.round((totalProgress / this.progress.length) * 100);
    }

    // Check if completed
    if (this.completionPercentage >= 100 && this.status === ParticipantStatus.ACTIVE) {
      this.status = ParticipantStatus.COMPLETED;
      this.completedAt = new Date();
    }
  }

  /**
   * Update streak
   */
  public updateStreak(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!this.lastActivityDate) {
      this.currentStreak = 1;
      this.longestStreak = Math.max(this.longestStreak, 1);
      this.lastActivityDate = now;
      return;
    }

    const lastDate = new Date(
      this.lastActivityDate.getFullYear(),
      this.lastActivityDate.getMonth(),
      this.lastActivityDate.getDate()
    );

    const dayDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) {
      // Same day, no change
    } else if (dayDiff === 1) {
      // Consecutive day
      this.currentStreak++;
      this.longestStreak = Math.max(this.longestStreak, this.currentStreak);
    } else {
      // Streak broken
      this.currentStreak = 1;
    }

    this.lastActivityDate = now;
  }

  /**
   * Record milestone achievement
   */
  public achieveMilestone(milestoneId: string): void {
    const existing = this.milestonesAchieved.find(m => m.milestoneId === milestoneId);
    if (!existing) {
      this.milestonesAchieved.push({
        milestoneId,
        achievedAt: new Date(),
        notified: false,
      });
    }
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
   * Check if participant is improving
   */
  public get isImproving(): boolean {
    return this.rankChange > 0;
  }

  /**
   * Get progress summary
   */
  public getProgressSummary(): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const completed = this.progress.filter(
      p => p.currentValue >= p.targetValue
    ).length;
    return {
      completed,
      total: this.progress.length,
      percentage: this.completionPercentage,
    };
  }

  /**
   * Initialize model
   */
  public static initModel(sequelize: Sequelize): typeof ChallengeParticipant {
    ChallengeParticipant.init(
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
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'user_id',
        },
        teamId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'team_id',
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ParticipantStatus)),
          allowNull: false,
          defaultValue: ParticipantStatus.REGISTERED,
        },
        progress: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        totalScore: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'total_score',
        },
        completionPercentage: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'completion_percentage',
        },
        currentStreak: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'current_streak',
        },
        longestStreak: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'longest_streak',
        },
        lastActivityDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_activity_date',
        },
        milestonesAchieved: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
          field: 'milestones_achieved',
        },
        badgesEarned: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
          field: 'badges_earned',
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
        cheersGiven: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'cheers_given',
        },
        cheersReceived: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'cheers_received',
        },
        commentsCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'comments_count',
        },
        joinedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'joined_at',
        },
        completedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'completed_at',
        },
        withdrawnAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'withdrawn_at',
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
        tableName: 'challenge_participants',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['challenge_id'] },
          { fields: ['user_id'] },
          { fields: ['team_id'] },
          { fields: ['status'] },
          { fields: ['challenge_id', 'user_id'], unique: true },
          { fields: ['total_score'] },
          { fields: ['rank'] },
          { fields: ['current_streak'] },
        ],
      }
    );

    return ChallengeParticipant;
  }
}

export default ChallengeParticipant;
