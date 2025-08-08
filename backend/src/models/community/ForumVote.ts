import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ForumVoteAttributes {
  id: string;
  userId: string;
  postId: string;
  voteType: number;
  createdAt: Date;
}

export interface ForumVoteCreationAttributes extends Omit<ForumVoteAttributes, 'id' | 'createdAt'> {}

export class ForumVote extends Model<ForumVoteAttributes, ForumVoteCreationAttributes> implements ForumVoteAttributes {
  public id!: string;
  public userId!: string;
  public postId!: string;
  public voteType!: number;
  declare readonly createdAt: Date;

  // Associations
  public readonly user?: any;
  public readonly post?: any;

  public static associate(models: any) {
    ForumVote.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    ForumVote.belongsTo(models.ForumPost, {
      foreignKey: 'postId',
      as: 'post'
    });
  }
}

export default (sequelize: Sequelize) => {
  ForumVote.init(
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
      sequelize,
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

  return ForumVote;
};