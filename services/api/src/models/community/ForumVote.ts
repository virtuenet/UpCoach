import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ForumVoteAttributes {
  id: string;
  userId: string;
  postId: string;
  voteType: number;
  createdAt: Date;
}

export interface ForumVoteCreationAttributes
  extends Omit<ForumVoteAttributes, 'id' | 'createdAt'> {}

export class ForumVote
  extends Model<ForumVoteAttributes, ForumVoteCreationAttributes>
  implements ForumVoteAttributes
{
  public id!: string;
  public userId!: string;
  public postId!: string;
  public voteType!: number;
  declare readonly createdAt: Date;

  // Associations
  public readonly user?: unknown;
  public readonly post?: unknown;

  public static associate(models: unknown) {
    ForumVote.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    ForumVote.belongsTo(models.ForumPost, {
      foreignKey: 'postId',
      as: 'post',
    });
  }

  // Static method declaration for lazy initialization
  static initializeModel: (sequelize: Sequelize) => typeof ForumVote;
}

// Static method for deferred initialization
ForumVote.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for ForumVote initialization');
  }

  return ForumVote.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      postId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'post_id',
        references: {
          model: 'forum_posts',
          key: 'id',
        },
      },
      voteType: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'vote_type',
        validate: {
          isIn: [[1, -1]],
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
      },
    },
    {
      sequelize: sequelizeInstance,
      modelName: 'ForumVote',
      tableName: 'forum_votes',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'post_id'],
        },
      ],
    }
  );
};

// Comment out immediate initialization to prevent premature execution
// ForumVote.init(...) will be called via ForumVote.initializeModel() after database is ready

export default ForumVote;
