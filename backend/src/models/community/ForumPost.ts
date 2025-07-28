import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ForumPostAttributes {
  id: string;
  threadId: string;
  userId: string;
  parentId?: string;
  content: string;
  isSolution: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  editCount: number;
  lastEditedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumPostCreationAttributes extends Omit<ForumPostAttributes, 'id' | 'isSolution' | 'isDeleted' | 'editCount' | 'createdAt' | 'updatedAt'> {}

export class ForumPost extends Model<ForumPostAttributes, ForumPostCreationAttributes> implements ForumPostAttributes {
  public id!: string;
  public threadId!: string;
  public userId!: string;
  public parentId?: string;
  public content!: string;
  public isSolution!: boolean;
  public isDeleted!: boolean;
  public deletedAt?: Date;
  public deletedBy?: string;
  public editCount!: number;
  public lastEditedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Virtual properties
  public voteScore?: number;
  public userVote?: number;

  // Associations
  public readonly thread?: any;
  public readonly user?: any;
  public readonly parent?: any;
  public readonly replies?: any[];
  public readonly votes?: any[];

  public static associate(models: any) {
    ForumPost.belongsTo(models.ForumThread, {
      foreignKey: 'threadId',
      as: 'thread'
    });
    
    ForumPost.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    ForumPost.belongsTo(models.ForumPost, {
      foreignKey: 'parentId',
      as: 'parent'
    });
    
    ForumPost.hasMany(models.ForumPost, {
      foreignKey: 'parentId',
      as: 'replies'
    });
    
    ForumPost.hasMany(models.ForumVote, {
      foreignKey: 'postId',
      as: 'votes'
    });
  }
}

export default (sequelize: Sequelize) => {
  ForumPost.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      threadId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'thread_id',
        references: {
          model: 'forum_threads',
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
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'parent_id',
        references: {
          model: 'forum_posts',
          key: 'id',
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isSolution: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_solution',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_deleted',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
      deletedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'deleted_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      editCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'edit_count',
      },
      lastEditedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_edited_at',
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
      modelName: 'ForumPost',
      tableName: 'forum_posts',
      timestamps: true,
      underscored: true,
    }
  );

  return ForumPost;
};