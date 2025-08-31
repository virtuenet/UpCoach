import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface ExperimentAssignmentAttributes {
  id: string;
  experimentId: string;
  userId: string;
  variantId: string;
  assignedAt: Date;
  context?: Record<string, any>;
  isExcluded: boolean;
  exclusionReason?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
}

interface ExperimentAssignmentCreationAttributes
  extends Optional<ExperimentAssignmentAttributes, 'id' | 'assignedAt' | 'isExcluded'> {}

class ExperimentAssignment
  extends Model<ExperimentAssignmentAttributes, ExperimentAssignmentCreationAttributes>
  implements ExperimentAssignmentAttributes
{
  public id!: string;
  public experimentId!: string;
  public userId!: string;
  public variantId!: string;
  public assignedAt!: Date;
  public context?: Record<string, any>;
  public isExcluded!: boolean;
  public exclusionReason?: string;
  public userAgent?: string;
  public ipAddress?: string;
  public sessionId?: string;

  // Static methods
  static async getAssignment(
    experimentId: string,
    userId: string
  ): Promise<ExperimentAssignment | null> {
    return this.findOne({
      where: {
        experimentId,
        userId,
      },
    });
  }

  static async createAssignment(
    experimentId: string,
    userId: string,
    variantId: string,
    context?: Record<string, any>
  ): Promise<ExperimentAssignment> {
    return this.create({
      experimentId,
      userId,
      variantId,
      context,
      isExcluded: false,
    });
  }

  static async excludeUser(
    experimentId: string,
    userId: string,
    reason: string
  ): Promise<ExperimentAssignment> {
    return this.create({
      experimentId,
      userId,
      variantId: 'excluded',
      isExcluded: true,
      exclusionReason: reason,
    });
  }

  static async getExperimentAssignments(experimentId: string): Promise<ExperimentAssignment[]> {
    return this.findAll({
      where: {
        experimentId,
        isExcluded: false,
      },
    });
  }

  static async getUserExperiments(userId: string): Promise<ExperimentAssignment[]> {
    return this.findAll({
      where: {
        userId,
        isExcluded: false,
      },
      include: ['experiment'],
    });
  }
}

ExperimentAssignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    experimentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'experiments',
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
    variantId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    context: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isExcluded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    exclusionReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ExperimentAssignment',
    tableName: 'experiment_assignments',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['experimentId', 'userId'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['variantId'],
      },
      {
        fields: ['assignedAt'],
      },
      {
        fields: ['isExcluded'],
      },
    ],
  }
);

export { ExperimentAssignment };
