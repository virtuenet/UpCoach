import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

export interface VoiceJournalEntryAttributes {
  id: string;
  userId: string;
  title: string;
  audioPath: string;
  duration?: number;
  transcription?: string;
  notes?: string;
  tags: string[];
  mood?: string;
  emotions?: {
    primary?: string;
    secondary?: string;
    confidence?: number;
    valence?: number;
    arousal?: number;
  };
  isProcessing: boolean;
  processedAt?: Date;
  processingError?: string;
  metadata?: {
    fileSize?: number;
    mimeType?: string;
    originalName?: string;
    sampleRate?: number;
    bitrate?: number;
  };
  isFavorite: boolean;
  isArchived: boolean;
  syncedAt?: Date;
  deviceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface VoiceJournalEntryCreationAttributes
  extends Optional<
    VoiceJournalEntryAttributes,
    | 'id'
    | 'duration'
    | 'transcription'
    | 'notes'
    | 'tags'
    | 'mood'
    | 'emotions'
    | 'isProcessing'
    | 'processedAt'
    | 'processingError'
    | 'metadata'
    | 'isFavorite'
    | 'isArchived'
    | 'syncedAt'
    | 'deviceId'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class VoiceJournalEntry extends Model<VoiceJournalEntryAttributes, VoiceJournalEntryCreationAttributes>
  implements VoiceJournalEntryAttributes {
  public id!: string;
  public userId!: string;
  public title!: string;
  public audioPath!: string;
  public duration?: number;
  public transcription?: string;
  public notes?: string;
  public tags!: string[];
  public mood?: string;
  public emotions?: {
    primary?: string;
    secondary?: string;
    confidence?: number;
    valence?: number;
    arousal?: number;
  };
  public isProcessing!: boolean;
  public processedAt?: Date;
  public processingError?: string;
  public metadata?: {
    fileSize?: number;
    mimeType?: string;
    originalName?: string;
    sampleRate?: number;
    bitrate?: number;
  };
  public isFavorite!: boolean;
  public isArchived!: boolean;
  public syncedAt?: Date;
  public deviceId?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Association properties
  public readonly user?: unknown;

  // Associations
  public static associate(models: unknown) {
    // VoiceJournalEntry belongs to User
    VoiceJournalEntry.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

VoiceJournalEntry.init(
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
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    audioPath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    duration: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Duration in seconds',
    },
    transcription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false,
    },
    mood: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    emotions: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Emotion analysis results from voice',
    },
    isProcessing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    processingError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    syncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deviceId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'VoiceJournalEntry',
    tableName: 'VoiceJournalEntries',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['mood'],
      },
      {
        fields: ['isProcessing'],
      },
      {
        fields: ['isFavorite'],
      },
      {
        fields: ['isArchived'],
      },
      {
        fields: ['tags'],
        using: 'GIN',
      },
      {
        name: 'voice_journal_search_idx',
        fields: ['title', 'transcription'],
        type: 'FULLTEXT',
      },
    ],
  }
);

export default VoiceJournalEntry;