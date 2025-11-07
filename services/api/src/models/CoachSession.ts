import { Op } from 'sequelize';
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';

import type { CoachProfile } from './CoachProfile';
import { User } from './User';

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

export class CoachSession extends Model<
  InferAttributes<CoachSession>,
  InferCreationAttributes<CoachSession>
> {
  declare id: CreationOptional<number>;
  declare coachId: ForeignKey<number>;
  declare clientId: ForeignKey<number>;

  // Session Details
  declare title: string;
  declare description: string | null;
  declare sessionType: SessionType;
  declare status: SessionStatus;

  // Timing
  declare scheduledAt: Date;
  declare durationMinutes: number;
  declare actualStartTime: Date | null;
  declare actualEndTime: Date | null;
  declare timezone: string;

  // Meeting Details
  declare meetingUrl: string | null;
  declare meetingPassword: string | null;
  declare locationAddress: string | null;

  // Pricing
  declare hourlyRate: number;
  declare totalAmount: number;
  declare currency: string;
  declare paymentStatus: PaymentStatus;
  declare paymentId: string | null;

  // Notes & Resources
  declare coachNotes: string | null;
  declare clientNotes: string | null;
  declare sharedResources: SharedResource[];

  // Feedback
  declare clientRating: number | null;
  declare clientFeedback: string | null;
  declare coachRating: number | null;
  declare coachFeedback: string | null;

  // Metadata
  declare cancellationReason: string | null;
  declare cancelledBy: 'coach' | 'client' | 'system' | null;
  declare cancelledAt: Date | null;
  declare metadata: unknown;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare coach?: NonAttribute<CoachProfile>;
  declare client?: NonAttribute<User>;

  // Helper methods
  canBeCancelled(): boolean {
    if (this.status === SessionStatus.COMPLETED || this.status === SessionStatus.CANCELLED) {
      return false;
    }

    // Can cancel up to 24 hours before session
    const hoursUntilSession = (this.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilSession >= 24;
  }

  canBeRescheduled(): boolean {
    if (this.status !== SessionStatus.PENDING && this.status !== SessionStatus.CONFIRMED) {
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
    this.cancellationReason = reason || null;

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
          model: require('./CoachProfile').CoachProfile,
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
          [Op.in]: [
            SessionStatus.PENDING,
            SessionStatus.CONFIRMED,
            SessionStatus.IN_PROGRESS,
          ],
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

// Initialize model
// Initialize model - skip in test environment to prevent "No Sequelize instance passed" errors
// Jest mocks will handle model initialization in tests
if (process.env.NODE_ENV !== 'test') {
CoachSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    coachId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'coach_profiles',
        key: 'id',
      },
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    // Session Details
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sessionType: {
      type: DataTypes.ENUM(...Object.values(SessionType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SessionStatus)),
      allowNull: false,
      defaultValue: SessionStatus.PENDING,
    },
    // Timing
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    actualStartTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    // Meeting Details
    meetingUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meetingPassword: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    locationAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Pricing
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      defaultValue: PaymentStatus.PENDING,
    },
    paymentId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Notes & Resources
    coachNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    clientNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sharedResources: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    // Feedback
    clientRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    clientFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coachRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    coachFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Metadata
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancelledBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
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
    modelName: 'CoachSession',
    tableName: 'coach_sessions',
    timestamps: true,
    hooks: {
      beforeCreate: (instance: CoachSession) => {
        const hours = instance.durationMinutes / 60;
        instance.totalAmount = Number((instance.hourlyRate * hours).toFixed(2));
      },
      afterUpdate: async (instance: CoachSession) => {
        if (instance.changed('status') && instance.status === SessionStatus.COMPLETED) {
          // This would trigger the database trigger, but we can also handle it here
          const { CoachProfile } = require('./CoachProfile');
          await CoachProfile.increment('totalSessions', {
            where: { id: instance.coachId },
          });
        }
      },
    },
  }
);
}

// Define associations - skip in test environment
if (process.env.NODE_ENV !== 'test') {
CoachSession.belongsTo(require('./CoachProfile').CoachProfile, {
  foreignKey: 'coachId',
  as: 'coach',
});

CoachSession.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'client',
});
}

export default CoachSession;
