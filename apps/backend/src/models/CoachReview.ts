import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  AfterCreate,
  AfterUpdate,
} from 'sequelize-typescript';
import { User } from './User';
import { CoachProfile } from './CoachProfile';
import { CoachSession } from './CoachSession';
import { Op } from 'sequelize';
import * as sequelize from 'sequelize';

@Table({
  tableName: 'coach_reviews',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['coach_id', 'client_id', 'session_id'],
    },
  ],
})
export class CoachReview extends Model {
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
  client!: any;

  @ForeignKey(() => CoachSession)
  @Column({
    type: DataType.INTEGER,
  })
  sessionId?: number;

  @BelongsTo(() => CoachSession)
  session?: CoachSession;

  // Ratings
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  })
  rating!: number;

  @Column({
    type: DataType.STRING(255),
  })
  title?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  comment!: string;

  // Detailed Ratings
  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
  })
  communicationRating?: number;

  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
  })
  knowledgeRating?: number;

  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
  })
  helpfulnessRating?: number;

  // Status Flags
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isVerified!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isFeatured!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isVisible!: boolean;

  // Coach Response
  @Column({
    type: DataType.TEXT,
  })
  coachResponse?: string;

  @Column({
    type: DataType.DATE,
  })
  coachResponseAt?: Date;

  // Engagement Metrics
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  helpfulCount!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  unhelpfulCount!: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Hooks to update coach stats
  @AfterCreate
  @AfterUpdate
  static async updateCoachRating(instance: CoachReview) {
    if (instance.changed('rating') || instance.changed('isVisible')) {
      await instance.updateCoachStats();
    }
  }

  // Helper methods
  async updateCoachStats(): Promise<void> {
    const stats = await CoachReview.findAll({
      where: {
        coachId: this.coachId,
        isVisible: true,
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      raw: true,
    });

    if (stats.length > 0) {
      const { avgRating, count } = stats[0] as any;
      await CoachProfile.update(
        {
          averageRating: Number(avgRating).toFixed(2),
          ratingCount: count,
        },
        {
          where: { id: this.coachId },
        }
      );
    }
  }

  async markAsHelpful(userId: number): Promise<void> {
    // In production, track user votes to prevent duplicates
    this.helpfulCount += 1;
    await this.save();
  }

  async markAsUnhelpful(userId: number): Promise<void> {
    // In production, track user votes to prevent duplicates
    this.unhelpfulCount += 1;
    await this.save();
  }

  async addCoachResponse(response: string): Promise<void> {
    this.coachResponse = response;
    this.coachResponseAt = new Date();
    await this.save();
  }

  canBeEditedBy(userId: number): boolean {
    // Review can be edited by the client within 7 days
    if (this.clientId === userId) {
      const daysSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 7;
    }
    return false;
  }

  // Static methods
  static async getCoachReviews(
    coachId: number,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: 'recent' | 'rating' | 'helpful';
      minRating?: number;
    } = {}
  ): Promise<{ reviews: CoachReview[]; total: number }> {
    const where: any = {
      coachId,
      isVisible: true,
    };

    if (options.minRating) {
      where.rating = { [Op.gte]: options.minRating };
    }

    let order: any[] = [];
    switch (options.sortBy) {
      case 'rating':
        order = [
          ['rating', 'DESC'],
          ['createdAt', 'DESC'],
        ];
        break;
      case 'helpful':
        order = [
          ['helpfulCount', 'DESC'],
          ['createdAt', 'DESC'],
        ];
        break;
      default:
        order = [['createdAt', 'DESC']];
    }

    const { count, rows } = await this.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'profileImageUrl'],
        },
        {
          model: CoachSession,
          attributes: ['id', 'title', 'scheduledAt'],
        },
      ],
      order,
      limit: options.limit || 10,
      offset: options.offset || 0,
    });

    return {
      reviews: rows,
      total: count,
    };
  }

  static async getReviewStats(coachId: number): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    detailedRatings: {
      communication: number;
      knowledge: number;
      helpfulness: number;
    };
  }> {
    const reviews = await this.findAll({
      where: {
        coachId,
        isVisible: true,
      },
      attributes: ['rating', 'communicationRating', 'knowledgeRating', 'helpfulnessRating'],
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        detailedRatings: {
          communication: 0,
          knowledge: 0,
          helpfulness: 0,
        },
      };
    }

    // Calculate average rating
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    // Calculate detailed ratings
    const detailedRatings = {
      communication: this.calculateAverage(reviews.map(r => r.communicationRating).filter(Boolean)),
      knowledge: this.calculateAverage(reviews.map(r => r.knowledgeRating).filter(Boolean)),
      helpfulness: this.calculateAverage(reviews.map(r => r.helpfulnessRating).filter(Boolean)),
    };

    return {
      totalReviews,
      averageRating: Number(averageRating.toFixed(2)),
      ratingDistribution,
      detailedRatings,
    };
  }

  private static calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Number((numbers.reduce((sum, n) => sum + n, 0) / numbers.length).toFixed(2));
  }

  static async hasUserReviewedCoach(clientId: number, coachId: number): Promise<boolean> {
    const count = await this.count({
      where: {
        clientId,
        coachId,
      },
    });
    return count > 0;
  }
}
