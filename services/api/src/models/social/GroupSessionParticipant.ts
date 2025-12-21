/**
 * Group Session Participant Model
 * Tracks participant registration, payment, and attendance
 */

import {
  Model,
  DataTypes,
  Sequelize,
  Optional,
} from 'sequelize';

// ==================== Types ====================

export type ParticipantStatus = 'registered' | 'waitlisted' | 'confirmed' | 'attended' | 'no_show' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed' | 'not_required';
export type ParticipantRole = 'participant' | 'moderator' | 'presenter' | 'host';

export interface GroupSessionParticipantAttributes {
  id: string;
  sessionId: string;
  userId: string;
  status: ParticipantStatus;
  role: ParticipantRole;

  // Payment
  paymentStatus: PaymentStatus;
  paymentId?: string;
  amountPaid?: number;
  currency: string;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;

  // Registration
  registeredAt: Date;
  confirmedAt?: Date;
  waitlistPosition?: number;
  promotedFromWaitlistAt?: Date;

  // Attendance
  joinedAt?: Date;
  leftAt?: Date;
  attendanceMinutes: number;
  attendancePercentage: number;

  // Engagement
  messageCount: number;
  reactionCount: number;
  pollsAnswered: number;
  questionsAsked: number;
  handRaiseCount: number;

  // Feedback
  rating?: number;
  feedback?: string;
  feedbackSubmittedAt?: Date;

  // Notes
  coachNotes?: string;
  participantNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface GroupSessionParticipantCreationAttributes
  extends Optional<
    GroupSessionParticipantAttributes,
    | 'id'
    | 'status'
    | 'role'
    | 'paymentStatus'
    | 'currency'
    | 'attendanceMinutes'
    | 'attendancePercentage'
    | 'messageCount'
    | 'reactionCount'
    | 'pollsAnswered'
    | 'questionsAsked'
    | 'handRaiseCount'
    | 'createdAt'
    | 'updatedAt'
  > {}

// ==================== Model ====================

export class GroupSessionParticipant
  extends Model<GroupSessionParticipantAttributes, GroupSessionParticipantCreationAttributes>
  implements GroupSessionParticipantAttributes
{
  public id!: string;
  public sessionId!: string;
  public userId!: string;
  public status!: ParticipantStatus;
  public role!: ParticipantRole;

  public paymentStatus!: PaymentStatus;
  public paymentId?: string;
  public amountPaid?: number;
  public currency!: string;
  public paidAt?: Date;
  public refundedAt?: Date;
  public refundAmount?: number;

  public registeredAt!: Date;
  public confirmedAt?: Date;
  public waitlistPosition?: number;
  public promotedFromWaitlistAt?: Date;

  public joinedAt?: Date;
  public leftAt?: Date;
  public attendanceMinutes!: number;
  public attendancePercentage!: number;

  public messageCount!: number;
  public reactionCount!: number;
  public pollsAnswered!: number;
  public questionsAsked!: number;
  public handRaiseCount!: number;

  public rating?: number;
  public feedback?: string;
  public feedbackSubmittedAt?: Date;

  public coachNotes?: string;
  public participantNotes?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public get isActive(): boolean {
    return ['registered', 'confirmed', 'attended'].includes(this.status);
  }

  public get hasAttended(): boolean {
    return this.status === 'attended' || this.attendanceMinutes > 0;
  }

  public get isPaid(): boolean {
    return this.paymentStatus === 'completed' || this.paymentStatus === 'not_required';
  }

  public get engagementScore(): number {
    // Calculate engagement score based on participation
    const weights = {
      messages: 2,
      reactions: 1,
      polls: 3,
      questions: 5,
      handRaises: 2,
    };

    return (
      this.messageCount * weights.messages +
      this.reactionCount * weights.reactions +
      this.pollsAnswered * weights.polls +
      this.questionsAsked * weights.questions +
      this.handRaiseCount * weights.handRaises
    );
  }

  public toPublicJSON(): Partial<GroupSessionParticipantAttributes> {
    return {
      id: this.id,
      sessionId: this.sessionId,
      userId: this.userId,
      status: this.status,
      role: this.role,
      registeredAt: this.registeredAt,
      attendancePercentage: this.attendancePercentage,
      rating: this.rating,
    };
  }
}

// ==================== Initialization ====================

export function initGroupSessionParticipant(sequelize: Sequelize): typeof GroupSessionParticipant {
  GroupSessionParticipant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'group_sessions',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.ENUM('registered', 'waitlisted', 'confirmed', 'attended', 'no_show', 'cancelled'),
        allowNull: false,
        defaultValue: 'registered',
      },
      role: {
        type: DataTypes.ENUM('participant', 'moderator', 'presenter', 'host'),
        allowNull: false,
        defaultValue: 'participant',
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'completed', 'refunded', 'failed', 'not_required'),
        allowNull: false,
        defaultValue: 'pending',
      },
      paymentId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      refundedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      refundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      registeredAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      confirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      waitlistPosition: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      promotedFromWaitlistAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      leftAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      attendanceMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      attendancePercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      messageCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reactionCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      pollsAnswered: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      questionsAsked: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      handRaiseCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      feedbackSubmittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      coachNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      participantNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: 'group_session_participants',
      timestamps: true,
      indexes: [
        { fields: ['sessionId'] },
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['sessionId', 'userId'], unique: true },
        { fields: ['paymentStatus'] },
        { fields: ['waitlistPosition'] },
      ],
    }
  );

  return GroupSessionParticipant;
}

export default GroupSessionParticipant;
