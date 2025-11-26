import { Op, Sequelize } from 'sequelize';
import * as sequelize from 'sequelize';
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from 'sequelize';

import type { CoachProfile } from './CoachProfile';
import type { CoachSession } from './CoachSession';
import { User } from './User';

export class CoachReview extends Model<
  InferAttributes<CoachReview>,
  InferCreationAttributes<CoachReview>
> {
  declare id: CreationOptional<number>;
  declare coachId: ForeignKey<number>;
  declare clientId: ForeignKey<number>;
  declare sessionId: ForeignKey<number> | null;

  // Ratings
  declare rating: number;
  declare title: string | null;
  declare comment: string;

  // Detailed Ratings
  declare communicationRating: number | null;
  declare knowledgeRating: number | null;
  declare helpfulnessRating: number | null;

  // Status Flags
  declare isVerified: boolean;
  declare isFeatured: boolean;
  declare isVisible: boolean;

  // Coach Response
  declare coachResponse: string | null;
  declare coachResponseAt: Date | null;

  // Engagement Metrics
  declare helpfulCount: number;
  declare unhelpfulCount: number;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare coach?: NonAttribute<CoachProfile>;
  declare client?: NonAttribute<User>;
  declare session?: NonAttribute<CoachSession>;

  // Helper methods
  async updateCoachStats(): Promise<void> {
    const stats: any = await CoachReview.findAll({
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
      const { avgRating, count } = stats[0];
      const { CoachProfile: CoachProfileModel } = require('./CoachProfile');
      await CoachProfileModel.update(
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
          model: require('./CoachSession').CoachSession,
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
      communication: this.calculateAverage(reviews.map(r => r.communicationRating).filter(Boolean) as number[]),
      knowledge: this.calculateAverage(reviews.map(r => r.knowledgeRating).filter(Boolean) as number[]),
      helpfulness: this.calculateAverage(reviews.map(r => r.helpfulnessRating).filter(Boolean) as number[]),
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

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof CoachReview;
}

// Static method for deferred initialization
CoachReview.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for CoachReview initialization');
  }

  return CoachReview.init(
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
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'coach_sessions',
          key: 'id',
        },
      },
      // Ratings
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // Detailed Ratings
      communicationRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      knowledgeRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      helpfulnessRating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      // Status Flags
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isVisible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // Coach Response
      coachResponse: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      coachResponseAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // Engagement Metrics
      helpfulCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      unhelpfulCount: {
        type: DataTypes.INTEGER,
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
      sequelize: sequelizeInstance,
      modelName: 'CoachReview',
      tableName: 'coach_reviews',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['coach_id', 'client_id', 'session_id'],
        },
      ],
      hooks: {
        afterCreate: async (instance: CoachReview) => {
          await instance.updateCoachStats();
        },
        afterUpdate: async (instance: CoachReview) => {
          if (instance.changed('rating') || instance.changed('isVisible')) {
            await instance.updateCoachStats();
          }
        },
      },
    }
  );
};

// Comment out immediate initialization to prevent premature execution
// CoachReview.init(...) will be called via CoachReview.initializeModel() after database is ready

export default CoachReview;
