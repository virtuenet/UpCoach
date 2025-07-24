import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../index';

// Media interface
export interface MediaAttributes {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl: string | null;
  alt: string | null;
  caption: string | null;
  uploadedById: string;
  folder: string | null;
  tags: string[];
  metadata: {
    width?: number;
    height?: number;
    duration?: number; // for videos/audio
    quality?: string;
    format?: string;
    exifData?: any;
    processedVersions?: {
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
    };
  };
  usage: {
    usedInArticles: string[];
    usedInCourses: string[];
    totalUsageCount: number;
    lastUsedAt: Date | null;
  };
  status: 'processing' | 'ready' | 'failed';
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Optional fields for creation
export interface MediaCreationAttributes extends Optional<MediaAttributes, 
  'id' | 'thumbnailUrl' | 'alt' | 'caption' | 'folder' | 'tags' | 'metadata' | 
  'usage' | 'status' | 'isPublic' | 'createdAt' | 'updatedAt' | 'deletedAt'
> {}

// Media model class
export class Media extends Model<MediaAttributes, MediaCreationAttributes> implements MediaAttributes {
  public id!: string;
  public filename!: string;
  public originalName!: string;
  public mimeType!: string;
  public fileSize!: number;
  public url!: string;
  public thumbnailUrl!: string | null;
  public alt!: string | null;
  public caption!: string | null;
  public uploadedById!: string;
  public folder!: string | null;
  public tags!: string[];
  public metadata!: MediaAttributes['metadata'];
  public usage!: MediaAttributes['usage'];
  public status!: 'processing' | 'ready' | 'failed';
  public isPublic!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  // Instance methods
  public getFileType(): string {
    if (this.mimeType.startsWith('image/')) return 'image';
    if (this.mimeType.startsWith('video/')) return 'video';
    if (this.mimeType.startsWith('audio/')) return 'audio';
    if (this.mimeType.includes('pdf')) return 'pdf';
    if (this.mimeType.includes('document') || this.mimeType.includes('text')) return 'document';
    return 'file';
  }

  public getFileExtension(): string {
    return this.filename.split('.').pop()?.toLowerCase() || '';
  }

  public isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  public isVideo(): boolean {
    return this.mimeType.startsWith('video/');
  }

  public isAudio(): boolean {
    return this.mimeType.startsWith('audio/');
  }

  public formatFileSize(): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (this.fileSize === 0) return '0 B';
    
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  public async addUsage(contentType: 'article' | 'course', contentId: string): Promise<void> {
    if (contentType === 'article' && !this.usage.usedInArticles.includes(contentId)) {
      this.usage.usedInArticles.push(contentId);
    } else if (contentType === 'course' && !this.usage.usedInCourses.includes(contentId)) {
      this.usage.usedInCourses.push(contentId);
    }
    
    this.usage.totalUsageCount = this.usage.usedInArticles.length + this.usage.usedInCourses.length;
    this.usage.lastUsedAt = new Date();
    await this.save();
  }

  public async removeUsage(contentType: 'article' | 'course', contentId: string): Promise<void> {
    if (contentType === 'article') {
      this.usage.usedInArticles = this.usage.usedInArticles.filter(id => id !== contentId);
    } else if (contentType === 'course') {
      this.usage.usedInCourses = this.usage.usedInCourses.filter(id => id !== contentId);
    }
    
    this.usage.totalUsageCount = this.usage.usedInArticles.length + this.usage.usedInCourses.length;
    await this.save();
  }

  public async updateProcessingStatus(status: 'processing' | 'ready' | 'failed', metadata?: any): Promise<void> {
    this.status = status;
    if (metadata) {
      this.metadata = { ...this.metadata, ...metadata };
    }
    await this.save();
  }

  // Static methods
  static async getByFolder(folder: string | null): Promise<Media[]> {
    return Media.findAll({
      where: { folder },
      order: [['createdAt', 'DESC']],
    });
  }

  static async getByType(mimeType: string): Promise<Media[]> {
    return Media.findAll({
      where: { 
        mimeType: { [Op.like]: `${mimeType}%` }
      },
      order: [['createdAt', 'DESC']],
    });
  }

  static async searchMedia(query: string, filters: {
    type?: string;
    folder?: string;
    uploadedBy?: string;
    tags?: string[];
  } = {}): Promise<Media[]> {
    const whereClause: any = {};

    if (query) {
      whereClause[Op.or] = [
        { originalName: { [Op.iLike]: `%${query}%` } },
        { alt: { [Op.iLike]: `%${query}%` } },
        { caption: { [Op.iLike]: `%${query}%` } },
        { tags: { [Op.contains]: [query] } },
      ];
    }

    if (filters.type) {
      whereClause.mimeType = { [Op.like]: `${filters.type}%` };
    }

    if (filters.folder !== undefined) {
      whereClause.folder = filters.folder;
    }

    if (filters.uploadedBy) {
      whereClause.uploadedById = filters.uploadedBy;
    }

    if (filters.tags && filters.tags.length > 0) {
      whereClause.tags = { [Op.overlap]: filters.tags };
    }

    return Media.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
  }

  static async getUnused(): Promise<Media[]> {
    return Media.findAll({
      where: { 
        'usage.totalUsageCount': 0
      },
      order: [['createdAt', 'DESC']],
    });
  }

  static async getRecentUploads(limit: number = 20): Promise<Media[]> {
    return Media.findAll({
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  static async getFolders(): Promise<string[]> {
    const result = await Media.findAll({
      attributes: ['folder'],
      where: {
        folder: { [Op.ne]: null }
      },
      group: ['folder'],
      raw: true,
    });

    return result.map((item: any) => item.folder).filter(Boolean);
  }

  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: { [key: string]: { count: number; size: number } };
  }> {
    const media = await Media.findAll({
      attributes: ['mimeType', 'fileSize'],
      raw: true,
    });

    const stats = {
      totalFiles: media.length,
      totalSize: media.reduce((sum, item) => sum + item.fileSize, 0),
      byType: {} as { [key: string]: { count: number; size: number } },
    };

    media.forEach((item: any) => {
      const type = item.mimeType.split('/')[0];
      if (!stats.byType[type]) {
        stats.byType[type] = { count: 0, size: 0 };
      }
      stats.byType[type].count++;
      stats.byType[type].size += item.fileSize;
    });

    return stats;
  }

  static async cleanupUnused(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const unusedMedia = await Media.findAll({
      where: {
        'usage.totalUsageCount': 0,
        createdAt: { [Op.lt]: cutoffDate }
      }
    });

    // In production, you would delete the actual files from storage here
    const deletedCount = unusedMedia.length;
    
    for (const media of unusedMedia) {
      await media.destroy();
    }

    return deletedCount;
  }
}

// Initialize the model
Media.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    alt: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255],
      },
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
      },
    },
    uploadedById: {
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
      validate: {
        len: [0, 255],
      },
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    usage: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        usedInArticles: [],
        usedInCourses: [],
        totalUsageCount: 0,
        lastUsedAt: null,
      },
    },
    status: {
      type: DataTypes.ENUM('processing', 'ready', 'failed'),
      allowNull: false,
      defaultValue: 'processing',
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Media',
    tableName: 'media',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['filename'],
      },
      {
        fields: ['mimeType'],
      },
      {
        fields: ['uploadedById'],
      },
      {
        fields: ['folder'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['isPublic'],
      },
      {
        fields: ['fileSize'],
      },
      {
        using: 'gin',
        fields: ['tags'],
      },
      {
        using: 'gin',
        fields: ['metadata'],
      },
      {
        using: 'gin',
        fields: ['usage'],
      },
    ],
  }
);

export default Media; 