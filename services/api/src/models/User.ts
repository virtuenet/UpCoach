import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin' | 'coach';
  avatar?: string;
  bio?: string;
  googleId?: string;
  organizationId?: string;
  isActive: boolean;
  emailVerified: boolean;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: Date;
  onboardingSkipped?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | 'id'
    | 'avatar'
    | 'bio'
    | 'googleId'
    | 'organizationId'
    | 'isActive'
    | 'emailVerified'
    | 'onboardingCompleted'
    | 'onboardingCompletedAt'
    | 'onboardingSkipped'
    | 'createdAt'
    | 'updatedAt'
    | 'lastLoginAt'
  > {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: 'user' | 'admin' | 'coach';
  public avatar?: string;
  public bio?: string;
  public googleId?: string;
  public organizationId?: string;
  public isActive!: boolean;
  public emailVerified!: boolean;
  public onboardingCompleted?: boolean;
  public onboardingCompletedAt?: Date;
  public onboardingSkipped?: boolean;
  public lastLoginAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Association properties
  public readonly profile?: any;
  public readonly goals?: any[];
  public readonly tasks?: any[];
  public readonly moods?: any[];
  public readonly chats?: any[];

  // Instance methods
  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Associations
  public static associate(models: any) {
    // User has one profile
    User.hasOne(models.UserProfile, { foreignKey: 'userId', as: 'profile' });
    // User has many goals
    User.hasMany(models.Goal, { foreignKey: 'userId', as: 'goals' });
    // User has many tasks
    User.hasMany(models.Task, { foreignKey: 'userId', as: 'tasks' });
    // User has many moods
    User.hasMany(models.Mood, { foreignKey: 'userId', as: 'moods' });
    // User has many chats
    User.hasMany(models.Chat, { foreignKey: 'userId', as: 'chats' });
    // User has many content (as author)
    User.hasMany(models.Content, { foreignKey: 'authorId', as: 'content' });
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'coach'),
      defaultValue: 'user',
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    onboardingCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    onboardingCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    onboardingSkipped: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          // Use bcrypt rounds from config or default to 14 for security
          const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
          user.password = await bcrypt.hash(user.password, rounds);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          // Use bcrypt rounds from config or default to 14 for security
          const rounds = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);
          user.password = await bcrypt.hash(user.password, rounds);
        }
      },
    },
  }
);
