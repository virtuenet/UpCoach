import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { Op, Sequelize } from 'sequelize';
import { User } from './User';
import { AIInteraction } from './AIInteraction';

@Table({
  tableName: 'ai_feedback',
  timestamps: false,
})
export class AIFeedback extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => AIInteraction)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  interactionId!: number;

  @BelongsTo(() => AIInteraction)
  interaction!: AIInteraction;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  sentiment?: 'positive' | 'neutral' | 'negative';

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
  })
  rating?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  feedbackText?: string;

  @CreatedAt
  declare createdAt: Date;

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

  static async getAverageSentiment(startDate?: Date, endDate?: Date): Promise<{
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

    const result = await this.findOne({
      where,
      attributes: [[Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating']],
      raw: true,
    }) as any;

    return result?.avgRating || 0;
  }
}