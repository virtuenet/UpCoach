import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ForumThreadAttributes {
  id: string;
  categoryId: string;
  userId: string;
  title: string;
  content: string;
  tags?: string[];
  views: number;
  replyCount: number;
  lastReplyAt?: Date;
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumThreadCreationAttributes
  extends Omit<ForumThreadAttributes, 'id' | 'views' | 'replyCount' | 'createdAt' | 'updatedAt'> {}

export class ForumThread
  extends Model<ForumThreadAttributes, ForumThreadCreationAttributes>
  implements ForumThreadAttributes
{
  public id!: string;
  public categoryId!: string;
  public userId!: string;
  public title!: string;
  public content!: string;
  public tags?: string[];
  public views!: number;
  public replyCount!: number;
  public lastReplyAt?: Date;
  public isPinned!: boolean;
  public isLocked!: boolean;
  public isFeatured!: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly category?: unknown;
  public readonly user?: unknown;
  public readonly posts?: unknown[];

  public static associate(models: unknown) {
    ForumThread.belongsTo(models.ForumCategory, {
      foreignKey: 'categoryId',
      as: 'category',
    });

    ForumThread.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    ForumThread.hasMany(models.ForumPost, {
      foreignKey: 'threadId',
      as: 'posts',
    });
  }

  // Instance methods
  public async incrementViews(): Promise<void> {
    this.views += 1;
    await this.save();
  }
}

export default (sequelize: Sequelize) => {
  ForumThread.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'category_id',
        references: {
          model: 'forum_categories',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      replyCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'reply_count',
      },
      lastReplyAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_reply_at',
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_pinned',
      },
      isLocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_locked',
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_featured',
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      modelName: 'ForumThread',
      tableName: 'forum_threads',
      timestamps: true,
      underscored: true,
    }
  );

  return ForumThread;
};
