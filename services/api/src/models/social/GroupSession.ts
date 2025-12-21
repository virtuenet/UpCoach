/**
 * Group Session Model
 * Represents group coaching sessions with multiple participants
 */

import {
  Model,
  DataTypes,
  Sequelize,
  Optional,
  Association,
} from 'sequelize';

// ==================== Types ====================

export type SessionType = 'workshop' | 'masterclass' | 'q_and_a' | 'support_group' | 'training';
export type SessionStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface GroupSessionAttributes {
  id: string;
  coachId: string;
  title: string;
  description: string;
  sessionType: SessionType;
  category: string;
  tags: string[];

  // Scheduling
  scheduledAt: Date;
  durationMinutes: number;
  timezone: string;
  recurrencePattern: RecurrencePattern;
  recurrenceEndDate?: Date;

  // Capacity
  maxParticipants: number;
  minParticipants: number;
  currentParticipants: number;
  waitlistEnabled: boolean;
  waitlistCount: number;

  // Pricing
  isFree: boolean;
  price?: number;
  currency: string;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: Date;

  // Session Details
  status: SessionStatus;
  coverImageUrl?: string;
  prerequisites?: string;
  learningObjectives: string[];
  materialsUrl?: string;

  // Video/Meeting
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  recordingEnabled: boolean;
  recordingUrl?: string;

  // Engagement
  chatEnabled: boolean;
  pollsEnabled: boolean;
  qnaEnabled: boolean;
  reactionsEnabled: boolean;

  // Metadata
  viewCount: number;
  averageRating?: number;
  ratingCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface GroupSessionCreationAttributes
  extends Optional<
    GroupSessionAttributes,
    | 'id'
    | 'currentParticipants'
    | 'waitlistCount'
    | 'status'
    | 'viewCount'
    | 'ratingCount'
    | 'createdAt'
    | 'updatedAt'
  > {}

// ==================== Model ====================

export class GroupSession
  extends Model<GroupSessionAttributes, GroupSessionCreationAttributes>
  implements GroupSessionAttributes
{
  public id!: string;
  public coachId!: string;
  public title!: string;
  public description!: string;
  public sessionType!: SessionType;
  public category!: string;
  public tags!: string[];

  public scheduledAt!: Date;
  public durationMinutes!: number;
  public timezone!: string;
  public recurrencePattern!: RecurrencePattern;
  public recurrenceEndDate?: Date;

  public maxParticipants!: number;
  public minParticipants!: number;
  public currentParticipants!: number;
  public waitlistEnabled!: boolean;
  public waitlistCount!: number;

  public isFree!: boolean;
  public price?: number;
  public currency!: string;
  public earlyBirdPrice?: number;
  public earlyBirdDeadline?: Date;

  public status!: SessionStatus;
  public coverImageUrl?: string;
  public prerequisites?: string;
  public learningObjectives!: string[];
  public materialsUrl?: string;

  public meetingUrl?: string;
  public meetingId?: string;
  public meetingPassword?: string;
  public recordingEnabled!: boolean;
  public recordingUrl?: string;

  public chatEnabled!: boolean;
  public pollsEnabled!: boolean;
  public qnaEnabled!: boolean;
  public reactionsEnabled!: boolean;

  public viewCount!: number;
  public averageRating?: number;
  public ratingCount!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    participants: Association<GroupSession, any>;
    chatMessages: Association<GroupSession, any>;
    coach: Association<GroupSession, any>;
  };

  // Instance methods
  public get isUpcoming(): boolean {
    return this.status === 'scheduled' && this.scheduledAt > new Date();
  }

  public get isLive(): boolean {
    return this.status === 'live';
  }

  public get isFull(): boolean {
    return this.currentParticipants >= this.maxParticipants;
  }

  public get hasWaitlist(): boolean {
    return this.waitlistEnabled && this.waitlistCount > 0;
  }

  public get endTime(): Date {
    return new Date(this.scheduledAt.getTime() + this.durationMinutes * 60000);
  }

  public get currentPrice(): number {
    if (this.isFree) return 0;

    if (
      this.earlyBirdPrice &&
      this.earlyBirdDeadline &&
      new Date() < this.earlyBirdDeadline
    ) {
      return this.earlyBirdPrice;
    }

    return this.price ?? 0;
  }

  public toPublicJSON(): Partial<GroupSessionAttributes> {
    return {
      id: this.id,
      coachId: this.coachId,
      title: this.title,
      description: this.description,
      sessionType: this.sessionType,
      category: this.category,
      tags: this.tags,
      scheduledAt: this.scheduledAt,
      durationMinutes: this.durationMinutes,
      timezone: this.timezone,
      maxParticipants: this.maxParticipants,
      currentParticipants: this.currentParticipants,
      isFree: this.isFree,
      price: this.currentPrice,
      currency: this.currency,
      status: this.status,
      coverImageUrl: this.coverImageUrl,
      learningObjectives: this.learningObjectives,
      averageRating: this.averageRating,
      ratingCount: this.ratingCount,
    };
  }
}

// ==================== Initialization ====================

export function initGroupSession(sequelize: Sequelize): typeof GroupSession {
  GroupSession.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      coachId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sessionType: {
        type: DataTypes.ENUM('workshop', 'masterclass', 'q_and_a', 'support_group', 'training'),
        allowNull: false,
        defaultValue: 'workshop',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
      },
      timezone: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'UTC',
      },
      recurrencePattern: {
        type: DataTypes.ENUM('none', 'daily', 'weekly', 'biweekly', 'monthly'),
        allowNull: false,
        defaultValue: 'none',
      },
      recurrenceEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      maxParticipants: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
      },
      minParticipants: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      currentParticipants: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      waitlistEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      waitlistCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isFree: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      earlyBirdPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      earlyBirdDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'scheduled', 'live', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      coverImageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      prerequisites: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      learningObjectives: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      materialsUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      meetingUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      meetingId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      meetingPassword: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      recordingEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      recordingUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      chatEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      pollsEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      qnaEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      reactionsEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      viewCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      averageRating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
      },
      ratingCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'group_sessions',
      timestamps: true,
      indexes: [
        { fields: ['coachId'] },
        { fields: ['status'] },
        { fields: ['scheduledAt'] },
        { fields: ['category'] },
        { fields: ['sessionType'] },
        { fields: ['status', 'scheduledAt'] },
      ],
    }
  );

  return GroupSession;
}

export default GroupSession;
