/**
 * Unified Interaction Model
 * Consolidates ContentInteraction, Comment, ContentComment, and analytics models
 */

import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface UnifiedInteractionAttributes {
  id: string;
  type: 'view' | 'like' | 'share' | 'comment' | 'rating' | 'bookmark' | 'report' | 'download';
  contentId: string;
  userId: string;
  
  // Comment-specific fields
  commentData?: {
    text: string;
    parentId?: string;
    isEdited?: boolean;
    editedAt?: Date;
    isApproved?: boolean;
    isPinned?: boolean;
  };
  
  // Rating-specific fields
  ratingData?: {
    score: number; // 1-5
    review?: string;
    isVerified?: boolean;
  };
  
  // Share-specific fields
  shareData?: {
    platform?: 'facebook' | 'twitter' | 'linkedin' | 'email' | 'whatsapp' | 'other';
    url?: string;
  };
  
  // Report-specific fields
  reportData?: {
    reason: string;
    description?: string;
    status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    reviewedBy?: string;
    reviewedAt?: Date;
  };
  
  // Analytics data
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    sessionId?: string;
    deviceType?: string;
    location?: {
      country?: string;
      city?: string;
    };
    duration?: number; // for views, in seconds
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnifiedInteractionCreationAttributes extends Optional<
  UnifiedInteractionAttributes,
  | 'id'
  | 'commentData'
  | 'ratingData'
  | 'shareData'
  | 'reportData'
  | 'metadata'
  | 'createdAt'
  | 'updatedAt'
> {}

export class UnifiedInteraction extends Model<UnifiedInteractionAttributes, UnifiedInteractionCreationAttributes> 
  implements UnifiedInteractionAttributes {
  
  public id!: string;
  public type!: 'view' | 'like' | 'share' | 'comment' | 'rating' | 'bookmark' | 'report' | 'download';
  public contentId!: string;
  public userId!: string;
  public commentData?: UnifiedInteractionAttributes['commentData'];
  public ratingData?: UnifiedInteractionAttributes['ratingData'];
  public shareData?: UnifiedInteractionAttributes['shareData'];
  public reportData?: UnifiedInteractionAttributes['reportData'];
  public metadata?: UnifiedInteractionAttributes['metadata'];
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  
  public static initialize(sequelize: Sequelize): void {
    UnifiedInteraction.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        type: {
          type: DataTypes.ENUM(
            'view', 'like', 'share', 'comment', 
            'rating', 'bookmark', 'report', 'download'
          ),
          allowNull: false,
        },
        contentId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'unified_contents',
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
        commentData: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        ratingData: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        shareData: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        reportData: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {},
        },
      },
      {
        sequelize,
        modelName: 'UnifiedInteraction',
        tableName: 'unified_interactions',
        timestamps: true,
        indexes: [
          { fields: ['type'] },
          { fields: ['contentId'] },
          { fields: ['userId'] },
          { fields: ['type', 'contentId'] },
          { fields: ['type', 'userId'] },
          { fields: ['createdAt'] },
        ],
      }
    );
  }
}

export default UnifiedInteraction;