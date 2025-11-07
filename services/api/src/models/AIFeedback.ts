import { Op, Sequelize } from 'sequelize';
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

import { AIInteraction } from './AIInteraction';
import { User } from './User';

export class AIFeedback extends Model<
  InferAttributes<AIFeedback>,
  InferCreationAttributes<AIFeedback>
> {
  declare id: CreationOptional<number>;
  declare interactionId: ForeignKey<number>;
  declare userId: ForeignKey<number>;

  declare sentiment: 'positive' | 'neutral' | 'negative' | null;
  declare rating: number | null;
  declare feedbackText: string | null;

  declare createdAt: CreationOptional<Date>;

  // Associations
  declare interaction?: NonAttribute<AIInteraction>;
  declare user?: NonAttribute<User>;

  // Helper methods
  static async recordFeedback(data: {
    interactionId: number;
    userId: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
    rating?: number;
    feedbackText?: string;
  }): Promise<AIFeedback> {
    return AIFeedback.create(data);
  }

  static async getAverageSentiment(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    positive: number;
    neutral: number;
    negative: number;
  }> {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = startDate;
      if (endDate) where.createdAt[Op.lte] = endDate;
    }

    const feedback = await this.findAll({
      where,
      attributes: ['sentiment'],
    });

    const total = feedback.length;
    const counts = {
      positive: feedback.filter(f => f.sentiment === 'positive').length,
      neutral: feedback.filter(f => f.sentiment === 'neutral').length,
      negative: feedback.filter(f => f.sentiment === 'negative').length,
    };

    return {
      positive: total > 0 ? (counts.positive / total) * 100 : 0,
      neutral: total > 0 ? (counts.neutral / total) * 100 : 0,
      negative: total > 0 ? (counts.negative / total) * 100 : 0,
    };
  }

  static async getAverageRating(startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = { rating: { [Op.ne]: null } };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = startDate;
      if (endDate) where.createdAt[Op.lte] = endDate;
    }

    const result: any = await this.findOne({
      where,
      attributes: [[Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating']],
      raw: true,
    });

    return result?.avgRating || 0;
  }
}

// Initialize model - skip in test environment to prevent "No Sequelize instance passed" errors
// Jest mocks will handle model initialization in tests
if (process.env.NODE_ENV !== 'test') {
  AIFeedback.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    interactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ai_interactions',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    sentiment: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    feedbackText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AIFeedback',
    tableName: 'ai_feedback',
    timestamps: false,
  }
);
}

// Define associations - skip in test environment
if (process.env.NODE_ENV !== 'test') {
AIFeedback.belongsTo(AIInteraction, {
  foreignKey: 'interactionId',
  as: 'interaction',
});

AIFeedback.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});
}

export default AIFeedback;
