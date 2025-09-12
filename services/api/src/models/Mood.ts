import { Model, DataTypes, Optional } from 'sequelize';

import { sequelize } from '../config/sequelize';

export interface MoodAttributes {
  id: string;
  userId: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  moodScore: number; // 1-5 scale
  notes?: string;
  activities?: string[];
  emotions?: string[];
  physicalSymptoms?: string[];
  sleepQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'terrible';
  stressLevel?: number; // 1-10 scale
  energyLevel?: number; // 1-10 scale
  location?: string;
  weather?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MoodCreationAttributes
  extends Optional<
    MoodAttributes,
    | 'id'
    | 'notes'
    | 'activities'
    | 'emotions'
    | 'physicalSymptoms'
    | 'sleepQuality'
    | 'stressLevel'
    | 'energyLevel'
    | 'location'
    | 'weather'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class Mood extends Model<MoodAttributes, MoodCreationAttributes> implements MoodAttributes {
  public id!: string;
  public userId!: string;
  public mood!: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  public moodScore!: number;
  public notes?: string;
  public activities?: string[];
  public emotions?: string[];
  public physicalSymptoms?: string[];
  public sleepQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'terrible';
  public stressLevel?: number;
  public energyLevel?: number;
  public location?: string;
  public weather?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public static associate(models: any) {
    Mood.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

Mood.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    mood: {
      type: DataTypes.ENUM('great', 'good', 'okay', 'bad', 'terrible'),
      allowNull: false,
    },
    moodScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    emotions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    physicalSymptoms: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    sleepQuality: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'terrible'),
      allowNull: true,
    },
    stressLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    energyLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    weather: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Mood',
    tableName: 'moods',
    timestamps: true,
  }
);
