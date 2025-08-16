/**
 * Unified Media Model
 * Consolidates Media, ContentMedia, and attachment models
 */

import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface UnifiedMediaAttributes {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'file';
  name: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number; // in bytes
  width?: number;
  height?: number;
  duration?: number; // in seconds for video/audio
  contentId?: string;
  uploadedBy: string;
  folder?: string;
  alt?: string;
  caption?: string;
  metadata?: {
    originalName?: string;
    encoding?: string;
    bitrate?: number;
    framerate?: number;
    codec?: string;
    pages?: number; // for documents
    exif?: any;
    tags?: string[];
    description?: string;
  };
  processing?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    versions?: Array<{
      name: string;
      url: string;
      width?: number;
      height?: number;
      size: number;
    }>;
  };
  usage?: {
    viewCount: number;
    downloadCount: number;
    lastAccessedAt?: Date;
  };
  isPublic: boolean;
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnifiedMediaCreationAttributes extends Optional<
  UnifiedMediaAttributes,
  | 'id'
  | 'thumbnailUrl'
  | 'width'
  | 'height'
  | 'duration'
  | 'contentId'
  | 'folder'
  | 'alt'
  | 'caption'
  | 'metadata'
  | 'processing'
  | 'usage'
  | 'isPublic'
  | 'isArchived'
  | 'createdAt'
  | 'updatedAt'
> {}

export class UnifiedMedia extends Model<UnifiedMediaAttributes, UnifiedMediaCreationAttributes> 
  implements UnifiedMediaAttributes {
  
  public id!: string;
  public type!: 'image' | 'video' | 'audio' | 'document' | 'file';
  public name!: string;
  public url!: string;
  public thumbnailUrl?: string;
  public mimeType!: string;
  public size!: number;
  public width?: number;
  public height?: number;
  public duration?: number;
  public contentId?: string;
  public uploadedBy!: string;
  public folder?: string;
  public alt?: string;
  public caption?: string;
  public metadata?: UnifiedMediaAttributes['metadata'];
  public processing?: UnifiedMediaAttributes['processing'];
  public usage?: UnifiedMediaAttributes['usage'];
  public isPublic!: boolean;
  public isArchived!: boolean;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  
  public static initialize(sequelize: Sequelize): void {
    UnifiedMedia.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        type: {
          type: DataTypes.ENUM('image', 'video', 'audio', 'document', 'file'),
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        url: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        thumbnailUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        mimeType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        size: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        width: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        height: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        contentId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'unified_contents',
            key: 'id',
          },
        },
        uploadedBy: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        folder: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        alt: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        caption: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {},
        },
        processing: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {
            status: 'pending',
          },
        },
        usage: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {
            viewCount: 0,
            downloadCount: 0,
          },
        },
        isPublic: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        isArchived: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        modelName: 'UnifiedMedia',
        tableName: 'unified_media',
        timestamps: true,
        indexes: [
          { fields: ['type'] },
          { fields: ['contentId'] },
          { fields: ['uploadedBy'] },
          { fields: ['folder'] },
          { fields: ['isPublic'] },
          { fields: ['isArchived'] },
        ],
      }
    );
  }
}

export default UnifiedMedia;