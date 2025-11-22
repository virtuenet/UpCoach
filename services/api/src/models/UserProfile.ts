import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

// Use dynamic import or passed sequelize instance to avoid circular deps

export interface UserProfileAttributes {
  id: string;
  userId: string;
  age?: number;
  occupation?: string;
  timezone?: string;
  coachingStyle?: string;
  sessionFrequency?: string;
  commitmentLevel?: string;
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'balanced';
  communicationPreference?: 'supportive' | 'direct' | 'analytical' | 'motivational' | 'empathetic';
  personalityType?: string;
  aiPersonalization?: unknown;
  coachingPreferences?: {
    preferredMethods: string[];
    sessionFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    sessionDuration: number; // minutes
    preferredTimes: string[]; // ['morning', 'afternoon', 'evening']
    focusAreas: string[];
  };
  behaviorPatterns?: {
    avgSessionDuration: number;
    completionRate: number;
    engagementLevel: number;
    preferredTopics: string[];
    responseTime: number; // avg minutes to respond
    consistencyScore: number;
  };
  progressMetrics?: {
    totalGoalsSet: number;
    goalsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    totalSessions: number;
    accountAge: number; // days
    lastActiveDate: Date;
  };
  strengths?: string[];
  growthAreas?: string[];
  motivators?: string[];
  obstacles?: string[];
  preferences?: unknown;
  metadata?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfileCreationAttributes
  extends Optional<
    UserProfileAttributes,
    | 'id'
    | 'age'
    | 'occupation'
    | 'timezone'
    | 'coachingStyle'
    | 'sessionFrequency'
    | 'commitmentLevel'
    | 'learningStyle'
    | 'communicationPreference'
    | 'personalityType'
    | 'aiPersonalization'
    | 'coachingPreferences'
    | 'behaviorPatterns'
    | 'progressMetrics'
    | 'strengths'
    | 'growthAreas'
    | 'motivators'
    | 'obstacles'
    | 'preferences'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class UserProfile
  extends Model<UserProfileAttributes, UserProfileCreationAttributes>
  implements UserProfileAttributes
{
  public id!: string;
  public userId!: string;
  public age?: number;
  public occupation?: string;
  public timezone?: string;
  public coachingStyle?: string;
  public sessionFrequency?: string;
  public commitmentLevel?: string;
  public learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'balanced';
  public communicationPreference?:
    | 'supportive'
    | 'direct'
    | 'analytical'
    | 'motivational'
    | 'empathetic';
  public personalityType?: string;
  public aiPersonalization?: unknown;
  public coachingPreferences?: {
    preferredMethods: string[];
    sessionFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    sessionDuration: number;
    preferredTimes: string[];
    focusAreas: string[];
  };
  public behaviorPatterns?: {
    avgSessionDuration: number;
    completionRate: number;
    engagementLevel: number;
    preferredTopics: string[];
    responseTime: number;
    consistencyScore: number;
  };
  public progressMetrics?: {
    totalGoalsSet: number;
    goalsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    totalSessions: number;
    accountAge: number;
    lastActiveDate: Date;
  };
  public strengths?: string[];
  public growthAreas?: string[];
  public motivators?: string[];
  public obstacles?: string[];
  public preferences?: unknown;
  public metadata?: unknown;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Static method declaration
  static initializeModel: (sequelize: unknown) => typeof UserProfile;
}

// Static method for deferred initialization
UserProfile.initializeModel = function(sequelizeInstance: unknown) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for UserProfile initialization');
  }

  return UserProfile.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      occupation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'UTC',
      },
      coachingStyle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sessionFrequency: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      commitmentLevel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      learningStyle: {
        type: DataTypes.ENUM('visual', 'auditory', 'kinesthetic', 'reading', 'balanced'),
        defaultValue: 'balanced',
      },
      communicationPreference: {
        type: DataTypes.ENUM('supportive', 'direct', 'analytical', 'motivational', 'empathetic'),
        defaultValue: 'supportive',
      },
      personalityType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      aiPersonalization: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      coachingPreferences: {
        type: DataTypes.JSONB,
        defaultValue: {
          preferredMethods: ['goal', 'habit', 'reflection'],
          sessionFrequency: 'weekly',
          sessionDuration: 30,
          preferredTimes: ['morning', 'evening'],
          focusAreas: ['productivity', 'wellbeing'],
        },
      },
      behaviorPatterns: {
        type: DataTypes.JSONB,
        defaultValue: {
          avgSessionDuration: 0,
          completionRate: 0,
          engagementLevel: 0,
          preferredTopics: [],
          responseTime: 0,
          consistencyScore: 0,
        },
      },
      progressMetrics: {
        type: DataTypes.JSONB,
        defaultValue: {
          totalGoalsSet: 0,
          goalsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalSessions: 0,
          accountAge: 0,
          lastActiveDate: new Date(),
        },
      },
      strengths: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      growthAreas: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      motivators: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      obstacles: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      preferences: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      sequelize: sequelizeInstance,
      modelName: 'UserProfile',
      tableName: 'user_profiles',
      timestamps: true,
      indexes: [
        {
          fields: ['userId'],
          unique: true,
        },
      {
        fields: ['learningStyle'],
      },
      {
        fields: ['communicationPreference'],
      },
      ],
    }
  );
};

// Comment out immediate initialization to prevent premature execution
// UserProfile.init(...) will be called via UserProfile.initializeModel() after database is ready

export default UserProfile;
