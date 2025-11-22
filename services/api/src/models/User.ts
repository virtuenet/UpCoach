import * as bcrypt from 'bcryptjs';
import { Model, DataTypes, Optional } from 'sequelize';

import { sequelize } from '../config/sequelize';

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
  verificationToken?: string;
  verificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: Date;
  onboardingSkipped?: boolean;
  lastLoginAt?: Date;
  profile?: Record<string, unknown>;
  timezone?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  preferences?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
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
    | 'deletedAt'
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
  public verificationToken?: string;
  public verificationTokenExpires?: Date;
  public passwordResetToken?: string;
  public passwordResetExpires?: Date;
  public loginAttempts?: number;
  public lockUntil?: Date;
  public onboardingCompleted?: boolean;
  public onboardingCompletedAt?: Date;
  public onboardingSkipped?: boolean;
  public lastLoginAt?: Date;
  public profile?: Record<string, unknown>;
  public timezone?: string;
  public phoneNumber?: string;
  public dateOfBirth?: string;
  public preferences?: Record<string, unknown>;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Association properties
  public readonly profile?: unknown;
  public readonly goals?: unknown[];
  public readonly tasks?: unknown[];
  public readonly moods?: unknown[];
  public readonly chats?: unknown[];
  public readonly subscriptions?: unknown[];
  public readonly activities?: unknown[];

  // Instance methods
  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Associations
  public static associate(models: unknown) {
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
    // User has many subscriptions
    User.hasMany(models.Subscription, { foreignKey: 'userId', as: 'subscriptions' });
    // User has many activities
    User.hasMany(models.UserActivity, { foreignKey: 'userId', as: 'activities' });
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
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verificationTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    profile: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
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
