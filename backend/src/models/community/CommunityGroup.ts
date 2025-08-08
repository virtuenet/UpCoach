import { DataTypes, Model, Sequelize } from 'sequelize';

export interface CommunityGroupAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  avatarUrl?: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  memberCount: number;
  postCount: number;
  rules?: string;
  welcomeMessage?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityGroupCreationAttributes extends Omit<CommunityGroupAttributes, 'id' | 'memberCount' | 'postCount' | 'createdAt' | 'updatedAt'> {}

export class CommunityGroup extends Model<CommunityGroupAttributes, CommunityGroupCreationAttributes> implements CommunityGroupAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public category?: string;
  public tags?: string[];
  public coverImage?: string;
  public avatarUrl?: string;
  public isPrivate!: boolean;
  public requiresApproval!: boolean;
  public memberCount!: number;
  public postCount!: number;
  public rules?: string;
  public welcomeMessage?: string;
  public createdBy!: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly creator?: any;
  public readonly members?: any[];
  public readonly posts?: any[];

  public static associate(models: any) {
    CommunityGroup.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    CommunityGroup.hasMany(models.GroupMember, {
      foreignKey: 'groupId',
      as: 'members'
    });
    
    CommunityGroup.hasMany(models.GroupPost, {
      foreignKey: 'groupId',
      as: 'posts'
    });
  }
}

export default (sequelize: Sequelize) => {
  CommunityGroup.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      coverImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'cover_image',
      },
      avatarUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'avatar_url',
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_private',
      },
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'requires_approval',
      },
      memberCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'member_count',
      },
      postCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'post_count',
      },
      rules: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      welcomeMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'welcome_message',
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'id',
        },
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
      modelName: 'CommunityGroup',
      tableName: 'community_groups',
      timestamps: true,
      underscored: true,
    }
  );

  return CommunityGroup;
};