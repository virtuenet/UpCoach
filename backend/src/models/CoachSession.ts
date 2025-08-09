import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  BeforeCreate,
  AfterUpdate,
} from 'sequelize-typescript';
import { makeCompatible, UserModel } from './ModelCompatibility';
const User = makeCompatible(UserModel);
import { CoachProfile } from './CoachProfile';
import { Op, literal } from 'sequelize';

export enum SessionType {
  VIDEO = 'video',
  AUDIO = 'audio',
  CHAT = 'chat',
  IN_PERSON = 'in-person',
}

export enum SessionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

interface SharedResource {
  name: string;
  url: string;
  type: 'document' | 'video' | 'link' | 'other';
  uploadedAt: Date;
}

@Table({
  tableName: 'coach_sessions',
  timestamps: true,
})
export class CoachSession extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => CoachProfile)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  coachId!: number;

  @BelongsTo(() => CoachProfile)
  coach!: CoachProfile;

  @ForeignKey(() => User as any)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  clientId!: number;

  @BelongsTo(() => User as any)
  client!: User;

  // Session Details
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
  })
  description?: string;

  @Column({
    type: DataType.ENUM(...Object.values(SessionType)),
    allowNull: false,
  })
  sessionType!: SessionType;

  @Column({
    type: DataType.ENUM(...Object.values(SessionStatus)),
    allowNull: false,
    defaultValue: SessionStatus.PENDING,
  })
  status!: SessionStatus;

  // Timing
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  scheduledAt!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  durationMinutes!: number;

  @Column({
    type: DataType.DATE,
  })
  actualStartTime?: Date;

  @Column({
    type: DataType.DATE,
  })
  actualEndTime?: Date;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  timezone!: string;

  // Meeting Details
  @Column({
    type: DataType.TEXT,
  })
  meetingUrl?: string;

  @Column({
    type: DataType.STRING(100),
  })
  meetingPassword?: string;

  @Column({
    type: DataType.TEXT,
  })
  locationAddress?: string;

  // Pricing
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  hourlyRate!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  totalAmount!: number;

  @Column({
    type: DataType.STRING(3),
    defaultValue: 'USD',
  })
  currency!: string;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    defaultValue: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  @Column({
    type: DataType.STRING(255),
  })
  paymentId?: string;

  // Notes & Resources
  @Column({
    type: DataType.TEXT,
  })
  coachNotes?: string;

  @Column({
    type: DataType.TEXT,
  })
  clientNotes?: string;

  @Column({
    type: DataType.JSONB,
    defaultValue: [],
  })
  sharedResources!: SharedResource[];

  // Feedback
  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
  })
  clientRating?: number;

  @Column({
    type: DataType.TEXT,
  })
  clientFeedback?: string;

  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
  })
  coachRating?: number;

  @Column({
    type: DataType.TEXT,
  })
  coachFeedback?: string;

  // Metadata
  @Column({
    type: DataType.TEXT,
  })
  cancellationReason?: string;

  @Column({
    type: DataType.STRING(50),
  })
  cancelledBy?: 'coach' | 'client' | 'system';

  @Column({
    type: DataType.DATE,
  })
  cancelledAt?: Date;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  metadata!: any;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Hooks
  @BeforeCreate
  static calculateTotalAmount(instance: CoachSession) {
    const hours = instance.durationMinutes / 60;
    instance.totalAmount = Number((instance.hourlyRate * hours).toFixed(2));
  }

  @AfterUpdate
  static async updateCoachStats(instance: CoachSession) {
    if (instance.changed('status') && instance.status === SessionStatus.COMPLETED) {
      // This would trigger the database trigger, but we can also handle it here
      await CoachProfile.increment('totalSessions', {
        where: { id: instance.coachId },
      });
    }
  }

  // Helper methods
  canBeCancelled(): boolean {
    if (this.status === SessionStatus.COMPLETED || 
        this.status === SessionStatus.CANCELLED) {
      return false;
    }

    // Can cancel up to 24 hours before session
    const hoursUntilSession = (this.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilSession >= 24;
  }

  canBeRescheduled(): boolean {
    if (this.status !== SessionStatus.PENDING && 
        this.status !== SessionStatus.CONFIRMED) {
      return false;
    }

    // Can reschedule up to 48 hours before session
    const hoursUntilSession = (this.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilSession >= 48;
  }

  async cancel(cancelledBy: 'coach' | 'client' | 'system', reason?: string): Promise<void> {
    if (!this.canBeCancelled()) {
      throw new Error('Session cannot be cancelled');
    }

    this.status = SessionStatus.CANCELLED;
    this.cancelledBy = cancelledBy;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;

    // Handle refund if payment was made
    if (this.paymentStatus === PaymentStatus.PAID) {
      // In production, process refund through payment gateway
      this.paymentStatus = PaymentStatus.REFUNDED;
    }

    await this.save();
  }

  async startSession(): Promise<void> {
    if (this.status !== SessionStatus.CONFIRMED) {
      throw new Error('Only confirmed sessions can be started');
    }

    this.status = SessionStatus.IN_PROGRESS;
    this.actualStartTime = new Date();
    await this.save();
  }

  async endSession(): Promise<void> {
    if (this.status !== SessionStatus.IN_PROGRESS) {
      throw new Error('Only in-progress sessions can be ended');
    }

    this.status = SessionStatus.COMPLETED;
    this.actualEndTime = new Date();
    await this.save();
  }

  // Static methods
  static async getUpcomingSessions(
    userId: number,
    role: 'coach' | 'client'
  ): Promise<CoachSession[]> {
    const where: any = {
      status: {
        [Op.in]: [SessionStatus.PENDING, SessionStatus.CONFIRMED],
      },
      scheduledAt: {
        [Op.gte]: new Date(),
      },
    };

    if (role === 'coach') {
      where.coachId = userId;
    } else {
      where.clientId = userId;
    }

    return this.findAll({
      where,
      include: [
        {
          model: CoachProfile,
          include: [{ model: User, attributes: ['id', 'name', 'email'] }],
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['scheduledAt', 'ASC']],
    });
  }

  static async checkConflicts(
    coachId: number,
    scheduledAt: Date,
    durationMinutes: number
  ): Promise<boolean> {
    const sessionEnd = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);
    
    const conflicts = await this.count({
      where: {
        coachId,
        status: {
          [Op.in]: [SessionStatus.PENDING, SessionStatus.CONFIRMED, SessionStatus.IN_PROGRESS],
        },
        [Op.and]: [
          {
            [Op.or]: [
              // Session overlaps start
              {
                scheduledAt: { [Op.lte]: scheduledAt },
                endTime: { [Op.gt]: scheduledAt },
              },
              // Session overlaps end
              {
                scheduledAt: { [Op.lt]: sessionEnd },
                endTime: { [Op.gte]: sessionEnd },
              },
              // Session is contained within
              {
                scheduledAt: { [Op.gte]: scheduledAt },
                endTime: { [Op.lte]: sessionEnd },
              },
            ],
          },
        ],
      },
    });

    return conflicts > 0;
  }
}