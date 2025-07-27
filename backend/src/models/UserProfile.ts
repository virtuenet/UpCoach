import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserProfileAttributes {
  id: string;
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'balanced';
  communicationPreference: 'supportive' | 'direct' | 'analytical' | 'motivational' | 'empathetic';
  personalityType?: string;
  coachingPreferences: {
    preferredMethods: string[];
    sessionFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    sessionDuration: number; // minutes
    preferredTimes: string[]; // ['morning', 'afternoon', 'evening']
    focusAreas: string[];
  };
  behaviorPatterns: {
    avgSessionDuration: number;
    completionRate: number;
    engagementLevel: number;
    preferredTopics: string[];
    responseTime: number; // avg minutes to respond
    consistencyScore: number;
  };
  progressMetrics: {
    totalGoalsSet: number;
    goalsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    totalSessions: number;
    accountAge: number; // days
    lastActiveDate: Date;
  };
  strengths: string[];
  growthAreas: string[];
  motivators: string[];
  obstacles: string[];
  preferences: any;
  metadata: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfileCreationAttributes 
  extends Optional<UserProfileAttributes, 'id' | 'personalityType' | 'createdAt' | 'updatedAt'> {}

export class UserProfile extends Model<UserProfileAttributes, UserProfileCreationAttributes> 
  implements UserProfileAttributes {
  public id!: string;
  public userId!: string;
  public learningStyle!: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'balanced';
  public communicationPreference!: 'supportive' | 'direct' | 'analytical' | 'motivational' | 'empathetic';
  public personalityType?: string;
  public coachingPreferences!: {
    preferredMethods: string[];
    sessionFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    sessionDuration: number;
    preferredTimes: string[];
    focusAreas: string[];
  };
  public behaviorPatterns!: {
    avgSessionDuration: number;
    completionRate: number;
    engagementLevel: number;
    preferredTopics: string[];
    responseTime: number;
    consistencyScore: number;
  };
  public progressMetrics!: {
    totalGoalsSet: number;
    goalsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    totalSessions: number;
    accountAge: number;
    lastActiveDate: Date;
  };
  public strengths!: string[];
  public growthAreas!: string[];
  public motivators!: string[];
  public obstacles!: string[];
  public preferences!: any;
  public metadata!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserProfile.init(
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
    sequelize,
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

export default UserProfile;