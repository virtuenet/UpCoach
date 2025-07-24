import { Model, DataTypes, Sequelize, Association, Optional } from 'sequelize';
import { Content } from './Content';
import { User } from '../User';

export interface ContentMediaAttributes {
  id: string;
  contentId?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  url: string;
  thumbnailUrl?: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  metadata?: {
    alt?: string;
    caption?: string;
    credit?: string;
    tags?: string[];
    [key: string]: any;
  };
  uploadedBy: string;
  isPublic: boolean;
  usageCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentMediaCreationAttributes extends Optional<ContentMediaAttributes, 'id' | 'contentId' | 'thumbnailUrl' | 'width' | 'height' | 'duration' | 'metadata' | 'usageCount' | 'createdAt' | 'updatedAt'> {}

export class ContentMedia extends Model<ContentMediaAttributes, ContentMediaCreationAttributes> implements ContentMediaAttributes {
  public id!: string;
  public contentId?: string;
  public type!: 'image' | 'video' | 'audio' | 'document' | 'other';
  public url!: string;
  public thumbnailUrl?: string;
  public filename!: string;
  public originalFilename!: string;
  public mimeType!: string;
  public size!: number;
  public width?: number;
  public height?: number;
  public duration?: number;
  public metadata?: {
    alt?: string;
    caption?: string;
    credit?: string;
    tags?: string[];
    [key: string]: any;
  };
  public uploadedBy!: string;
  public isPublic!: boolean;
  public usageCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly content?: Content;
  public readonly uploader?: User;

  public static associations: {
    content: Association<ContentMedia, Content>;
    uploader: Association<ContentMedia, User>;
  };

  public static initialize(sequelize: Sequelize): void {
    ContentMedia.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        contentId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'contents',
            key: 'id',
          },
        },
        type: {
          type: DataTypes.ENUM('image', 'video', 'audio', 'document', 'other'),
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
        filename: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        originalFilename: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        mimeType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        size: {
          type: DataTypes.INTEGER,
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
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        uploadedBy: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        isPublic: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        usageCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        modelName: 'ContentMedia',
        tableName: 'content_media',
        timestamps: true,
        indexes: [
          { fields: ['contentId'] },
          { fields: ['type'] },
          { fields: ['uploadedBy'] },
          { fields: ['isPublic'] },
          { fields: ['filename'] },
        ],
      }
    );
  }

  public static associate(): void {
    ContentMedia.belongsTo(Content, {
      foreignKey: 'contentId',
      as: 'content',
    });

    ContentMedia.belongsTo(User, {
      foreignKey: 'uploadedBy',
      as: 'uploader',
    });
  }
}