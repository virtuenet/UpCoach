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
import { User } from './User';

export type AIInteractionType = 'conversation' | 'recommendation' | 'voice' | 'prediction' | 'insight';

export class AIInteraction extends Model<
  InferAttributes<AIInteraction>,
  InferCreationAttributes<AIInteraction>
> {
  declare id: CreationOptional<number>;
  declare userId: ForeignKey<User['id']> | null;
  declare type: AIInteractionType;
  declare model: string;
  declare tokensUsed: number;
  declare responseTime: number | null;
  declare sessionId: string | null;
  declare requestData: unknown;
  declare responseData: unknown;
  declare metadata: unknown;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare feedback?: NonAttribute<any[]>;

  // Helper methods
  async recordInteraction(data: {
    userId?: number;
    type: AIInteractionType;
    model: string;
    tokensUsed?: number;
    responseTime?: number;
    sessionId?: string;
    requestData?: unknown;
    responseData?: unknown;
    metadata?: unknown;
  }): Promise<AIInteraction> {
    return AIInteraction.create({
      userId: data.userId,
      type: data.type,
      model: data.model,
      tokensUsed: data.tokensUsed || 0,
      responseTime: data.responseTime,
      sessionId: data.sessionId,
      requestData: data.requestData,
      responseData: data.responseData,
      metadata: data.metadata,
    });
  }

  static async getSessionHistory(sessionId: string): Promise<AIInteraction[]> {
    return AIInteraction.findAll({
      where: { sessionId },
      order: [['createdAt', 'ASC']],
    });
  }

  static async getUserStats(userId: number): Promise<{
    totalInteractions: number;
    totalTokens: number;
    averageResponseTime: number;
    interactionsByType: Record<AIInteractionType, number>;
  }> {
    const interactions = await AIInteraction.findAll({
      where: { userId },
      attributes: ['type', 'tokensUsed', 'responseTime'],
    });

    const interactionsByType: Record<string, number> = {};
    let totalTokens = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    interactions.forEach((interaction) => {
      interactionsByType[interaction.type] = (interactionsByType[interaction.type] || 0) + 1;
      totalTokens += interaction.tokensUsed;
      if (interaction.responseTime) {
        totalResponseTime += interaction.responseTime;
        responseTimeCount++;
      }
    });

    return {
      totalInteractions: interactions.length,
      totalTokens,
      averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
      interactionsByType: interactionsByType as Record<AIInteractionType, number>,
    };
  }

  static async getRecentActivity(
    userId: number,
    limit: number = 10
  ): Promise<AIInteraction[]> {
    return AIInteraction.findAll({
      where: { userId },
      limit,
      order: [['createdAt', 'DESC']],
    });
  }
}

// Initialize model - skip in test environment to prevent "No Sequelize instance passed" errors
// Jest mocks will handle model initialization in tests
if (process.env.NODE_ENV !== 'test') {
  AIInteraction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['conversation', 'recommendation', 'voice', 'prediction', 'insight']],
      },
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    tokensUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    responseTime: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    requestData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    responseData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
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
    modelName: 'AIInteraction',
    tableName: 'ai_interactions',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['session_id'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);
}

// Define associations - skip in test environment
if (process.env.NODE_ENV !== 'test') {
  AIInteraction.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });
}

export default AIInteraction;
