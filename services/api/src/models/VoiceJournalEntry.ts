import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface VoiceJournalEntryAttributes {
  id: string;
  title: string;
  transcriptionText?: string;
  audioFilePath?: string;
  duration?: number;
  summary?: string;
  tags?: string[];
  emotionalTone?: string;
  isTranscribed: boolean;
  isAnalyzed: boolean;
  isFavorite: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class VoiceJournalEntry extends Model<VoiceJournalEntryAttributes> implements VoiceJournalEntryAttributes {
  public id!: string;
  public title!: string;
  public transcriptionText?: string;
  public audioFilePath?: string;
  public duration?: number;
  public summary?: string;
  public tags?: string[];
  public emotionalTone?: string;
  public isTranscribed!: boolean;
  public isAnalyzed!: boolean;
  public isFavorite!: boolean;
  public userId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

VoiceJournalEntry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    transcriptionText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    audioFilePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    emotionalTone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['positive', 'negative', 'neutral', 'mixed']],
      },
    },
    isTranscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isAnalyzed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'VoiceJournalEntry',
    tableName: 'voice_journal_entries',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['userId', 'createdAt'],
      },
      {
        fields: ['userId', 'isFavorite'],
      },
      {
        fields: ['userId', 'isTranscribed'],
      },
      {
        fields: ['userId', 'isAnalyzed'],
      },
    ],
  }
);

export default VoiceJournalEntry;