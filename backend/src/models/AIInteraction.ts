import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { makeCompatible, UserModel } from './ModelCompatibility';
const User = makeCompatible(UserModel);
import { AIFeedback } from './AIFeedback';

@Table({
  tableName: 'ai_interactions',
  timestamps: true,
})
export class AIInteraction extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User as any)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  userId?: number;

  @BelongsTo(() => User as any)
  user?: any;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  type!: 'conversation' | 'recommendation' | 'voice' | 'prediction' | 'insight';

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  model!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  tokensUsed!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  responseTime?: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  sessionId?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  requestData?: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  responseData?: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: any;

  @HasMany(() => AIFeedback)
  feedback?: AIFeedback[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Helper methods
  async recordInteraction(data: {
    userId?: number;
    type: AIInteraction['type'];
    model: string;
    tokensUsed: number;
    responseTime: number;
    sessionId?: string;
    requestData?: any;
    responseData?: any;
    metadata?: any;
  }): Promise<AIInteraction> {
    return AIInteraction.create(data);
  }

  static async getRecentInteractions(limit: number = 20): Promise<AIInteraction[]> {
    return this.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
        {
          model: AIFeedback,
          attributes: ['sentiment', 'rating'],
        },
      ],
    });
  }

  static async getUserInteractions(userId: number, limit?: number): Promise<AIInteraction[]> {
    return this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  static async getInteractionsByType(
    type: AIInteraction['type'],
    startDate?: Date,
    endDate?: Date
  ): Promise<AIInteraction[]> {
    const where: any = { type };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = startDate;
      if (endDate) where.createdAt[Op.lte] = endDate;
    }

    return this.findAll({ where });
  }

  static async getTokenUsage(startDate: Date, endDate?: Date): Promise<number> {
    const where: any = {
      createdAt: { [Op.gte]: startDate },
    };
    
    if (endDate) {
      where.createdAt[Op.lte] = endDate;
    }

    const result = await this.sum('tokensUsed', { where });
    return result || 0;
  }
}