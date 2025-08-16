/**
 * Unified Content Model
 * Consolidates Article, Content, ContentArticle, Course, Template, and other CMS models
 * into a single flexible content system with discriminated types
 */

import { Model, DataTypes, Sequelize, Association, Optional, Op } from 'sequelize';
import { User } from '../User';

// ==================== Type Definitions ====================

export type ContentType = 
  | 'article' 
  | 'guide' 
  | 'exercise' 
  | 'lesson' 
  | 'tip'
  | 'course'
  | 'template'
  | 'page'
  | 'faq'
  | 'announcement';

export type ContentStatus = 
  | 'draft' 
  | 'published' 
  | 'scheduled' 
  | 'archived'
  | 'review'
  | 'expired';

export type ContentFormat = 
  | 'markdown'
  | 'html'
  | 'rich-text'
  | 'video'
  | 'audio'
  | 'interactive';

// ==================== Interfaces ====================

export interface UnifiedContentAttributes {
  id: string;
  
  // Core Fields (common across all content types)
  type: ContentType;
  format: ContentFormat;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: ContentStatus;
  
  // Authorship & Categorization
  authorId: string;
  categoryId?: string;
  parentId?: string; // For hierarchical content (lessons in courses)
  order?: number; // For sequential content
  
  // Media & Visuals
  featuredImageUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  attachments?: Array<{
    id: string;
    url: string;
    type: string;
    name: string;
    size: number;
  }>;
  
  // SEO & Metadata
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  
  // Publishing & Scheduling
  publishedAt?: Date;
  scheduledAt?: Date;
  expiresAt?: Date;
  
  // Analytics & Engagement
  viewCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  readingTime?: number; // in minutes
  completionRate?: number; // percentage
  avgRating?: number;
  ratingCount?: number;
  
  // Access Control
  isPremium: boolean;
  isPrivate: boolean;
  requiredRoles?: string[];
  requiredTags?: string[];
  
  // Type-specific Fields (stored in JSONB)
  courseData?: {
    duration?: number; // in hours
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    prerequisites?: string[];
    objectives?: string[];
    certificateEnabled?: boolean;
    maxEnrollments?: number;
    currentEnrollments?: number;
    modules?: Array<{
      id: string;
      title: string;
      description: string;
      lessonsCount: number;
      duration: number;
    }>;
  };
  
  templateData?: {
    category?: string;
    variables?: Record<string, any>;
    previewData?: any;
    usageCount?: number;
    lastUsedAt?: Date;
  };
  
  faqData?: {
    question?: string;
    answer?: string;
    category?: string;
    helpful?: number;
    notHelpful?: number;
  };
  
  // Settings & Configuration
  settings?: {
    allowComments?: boolean;
    allowSharing?: boolean;
    showAuthor?: boolean;
    showDate?: boolean;
    showReadingTime?: boolean;
    enableNotifications?: boolean;
    autoTranslate?: boolean;
    customCss?: string;
    customJs?: string;
  };
  
  // Version Control
  version: number;
  versionHistory?: Array<{
    version: number;
    changedBy: string;
    changedAt: Date;
    changes: string;
  }>;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface UnifiedContentCreationAttributes extends Optional<
  UnifiedContentAttributes,
  | 'id'
  | 'format'
  | 'excerpt'
  | 'categoryId'
  | 'parentId'
  | 'order'
  | 'featuredImageUrl'
  | 'thumbnailUrl'
  | 'videoUrl'
  | 'audioUrl'
  | 'attachments'
  | 'metaTitle'
  | 'metaDescription'
  | 'metaKeywords'
  | 'canonicalUrl'
  | 'publishedAt'
  | 'scheduledAt'
  | 'expiresAt'
  | 'viewCount'
  | 'likeCount'
  | 'shareCount'
  | 'commentCount'
  | 'readingTime'
  | 'completionRate'
  | 'avgRating'
  | 'ratingCount'
  | 'isPremium'
  | 'isPrivate'
  | 'requiredRoles'
  | 'requiredTags'
  | 'courseData'
  | 'templateData'
  | 'faqData'
  | 'settings'
  | 'version'
  | 'versionHistory'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
> {}

// ==================== Model Class ====================

export class UnifiedContent extends Model<UnifiedContentAttributes, UnifiedContentCreationAttributes> 
  implements UnifiedContentAttributes {
  
  // Required fields
  public id!: string;
  public type!: ContentType;
  public format!: ContentFormat;
  public title!: string;
  public slug!: string;
  public content!: string;
  public status!: ContentStatus;
  public authorId!: string;
  public viewCount!: number;
  public likeCount!: number;
  public shareCount!: number;
  public commentCount!: number;
  public isPremium!: boolean;
  public isPrivate!: boolean;
  public version!: number;
  
  // Optional fields
  public excerpt?: string;
  public categoryId?: string;
  public parentId?: string;
  public order?: number;
  public featuredImageUrl?: string;
  public thumbnailUrl?: string;
  public videoUrl?: string;
  public audioUrl?: string;
  public attachments?: UnifiedContentAttributes['attachments'];
  public metaTitle?: string;
  public metaDescription?: string;
  public metaKeywords?: string[];
  public canonicalUrl?: string;
  public publishedAt?: Date;
  public scheduledAt?: Date;
  public expiresAt?: Date;
  public readingTime?: number;
  public completionRate?: number;
  public avgRating?: number;
  public ratingCount?: number;
  public requiredRoles?: string[];
  public requiredTags?: string[];
  public courseData?: UnifiedContentAttributes['courseData'];
  public templateData?: UnifiedContentAttributes['templateData'];
  public faqData?: UnifiedContentAttributes['faqData'];
  public settings?: UnifiedContentAttributes['settings'];
  public versionHistory?: UnifiedContentAttributes['versionHistory'];
  
  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  public readonly deletedAt!: Date | null;
  
  // Associations
  public readonly author?: User;
  public readonly category?: any; // ContentCategory
  public readonly parent?: UnifiedContent;
  public readonly children?: UnifiedContent[];
  public readonly tags?: any[]; // ContentTag[]
  public readonly media?: any[]; // ContentMedia[]
  public readonly comments?: any[]; // ContentComment[]
  public readonly interactions?: any[]; // ContentInteraction[]
  
  // Association methods
  public setTags!: (tags: any[]) => Promise<void>;
  public getTags!: () => Promise<any[]>;
  public addTag!: (tag: any) => Promise<void>;
  public removeTag!: (tag: any) => Promise<void>;
  
  public static associations: {
    author: Association<UnifiedContent, User>;
    parent: Association<UnifiedContent, UnifiedContent>;
    children: Association<UnifiedContent, UnifiedContent>;
  };
  
  // ==================== Instance Methods ====================
  
  /**
   * Generate unique slug
   */
  public async generateSlug(): Promise<string> {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await UnifiedContent.findOne({ 
      where: { 
        slug, 
        id: { [Op.ne]: this.id } 
      } 
    })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }
  
  /**
   * Calculate reading time
   */
  public calculateReadingTime(): number {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
  
  /**
   * Publish content
   */
  public async publish(): Promise<void> {
    this.status = 'published';
    this.publishedAt = new Date();
    await this.save();
  }
  
  /**
   * Archive content
   */
  public async archive(): Promise<void> {
    this.status = 'archived';
    await this.save();
  }
  
  /**
   * Increment view count
   */
  public async incrementViewCount(): Promise<void> {
    this.viewCount += 1;
    await this.save();
  }
  
  /**
   * Create new version
   */
  public async createVersion(changedBy: string, changes: string): Promise<void> {
    this.version += 1;
    this.versionHistory = this.versionHistory || [];
    this.versionHistory.push({
      version: this.version,
      changedBy,
      changedAt: new Date(),
      changes
    });
    await this.save();
  }
  
  // ==================== Static Methods ====================
  
  /**
   * Get published content
   */
  static async getPublished(type?: ContentType): Promise<UnifiedContent[]> {
    const where: any = { status: 'published' };
    if (type) where.type = type;
    
    return UnifiedContent.findAll({
      where,
      order: [['publishedAt', 'DESC']],
    });
  }
  
  /**
   * Get featured content
   */
  static async getFeatured(limit = 10): Promise<UnifiedContent[]> {
    return UnifiedContent.findAll({
      where: { 
        status: 'published',
        featuredImageUrl: { [Op.ne]: null }
      },
      order: [['publishedAt', 'DESC']],
      limit,
    });
  }
  
  /**
   * Search content
   */
  static async search(query: string, filters: {
    type?: ContentType;
    status?: ContentStatus;
    category?: string;
    author?: string;
    tags?: string[];
    isPremium?: boolean;
  } = {}): Promise<UnifiedContent[]> {
    const where: any = {};
    
    if (query) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { content: { [Op.iLike]: `%${query}%` } },
        { excerpt: { [Op.iLike]: `%${query}%` } },
      ];
    }
    
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.category) where.categoryId = filters.category;
    if (filters.author) where.authorId = filters.author;
    if (filters.isPremium !== undefined) where.isPremium = filters.isPremium;
    
    return UnifiedContent.findAll({
      where,
      order: [['updatedAt', 'DESC']],
    });
  }
  
  /**
   * Get popular content
   */
  static async getPopular(limit = 10, type?: ContentType): Promise<UnifiedContent[]> {
    const where: any = { status: 'published' };
    if (type) where.type = type;
    
    return UnifiedContent.findAll({
      where,
      order: [
        ['viewCount', 'DESC'],
        ['likeCount', 'DESC'],
        ['avgRating', 'DESC NULLS LAST']
      ],
      limit,
    });
  }
  
  /**
   * Get scheduled content ready for publishing
   */
  static async getScheduledForPublishing(): Promise<UnifiedContent[]> {
    return UnifiedContent.findAll({
      where: {
        status: 'scheduled',
        scheduledAt: {
          [Op.lte]: new Date()
        }
      }
    });
  }
  
  /**
   * Get expired content
   */
  static async getExpired(): Promise<UnifiedContent[]> {
    return UnifiedContent.findAll({
      where: {
        status: 'published',
        expiresAt: {
          [Op.lte]: new Date()
        }
      }
    });
  }
  
  /**
   * Initialize the model
   */
  public static initialize(sequelize: Sequelize): void {
    UnifiedContent.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        type: {
          type: DataTypes.ENUM(
            'article', 'guide', 'exercise', 'lesson', 'tip',
            'course', 'template', 'page', 'faq', 'announcement'
          ),
          allowNull: false,
        },
        format: {
          type: DataTypes.ENUM(
            'markdown', 'html', 'rich-text', 
            'video', 'audio', 'interactive'
          ),
          allowNull: false,
          defaultValue: 'markdown',
        },
        title: {
          type: DataTypes.STRING(200),
          allowNull: false,
          validate: {
            len: [3, 200],
          },
        },
        slug: {
          type: DataTypes.STRING(250),
          allowNull: false,
          unique: true,
          validate: {
            is: /^[a-z0-9-]+$/,
          },
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        excerpt: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(
            'draft', 'published', 'scheduled', 
            'archived', 'review', 'expired'
          ),
          allowNull: false,
          defaultValue: 'draft',
        },
        authorId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
        },
        categoryId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'content_categories',
            key: 'id',
          },
        },
        parentId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'unified_contents',
            key: 'id',
          },
        },
        order: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        featuredImageUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        thumbnailUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        videoUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        audioUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        attachments: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: [],
        },
        metaTitle: {
          type: DataTypes.STRING(60),
          allowNull: true,
        },
        metaDescription: {
          type: DataTypes.STRING(160),
          allowNull: true,
        },
        metaKeywords: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
        },
        canonicalUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        publishedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        scheduledAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        viewCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        likeCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        shareCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        commentCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        readingTime: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        completionRate: {
          type: DataTypes.FLOAT,
          allowNull: true,
          validate: {
            min: 0,
            max: 100,
          },
        },
        avgRating: {
          type: DataTypes.FLOAT,
          allowNull: true,
          validate: {
            min: 0,
            max: 5,
          },
        },
        ratingCount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        isPremium: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        isPrivate: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        requiredRoles: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
        },
        requiredTags: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
        },
        courseData: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        templateData: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        faqData: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        settings: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {
            allowComments: true,
            allowSharing: true,
            showAuthor: true,
            showDate: true,
            showReadingTime: true,
            enableNotifications: false,
            autoTranslate: false,
          },
        },
        version: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        versionHistory: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: [],
        },
      },
      {
        sequelize,
        modelName: 'UnifiedContent',
        tableName: 'unified_contents',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['slug'], unique: true },
          { fields: ['type'] },
          { fields: ['status'] },
          { fields: ['authorId'] },
          { fields: ['categoryId'] },
          { fields: ['parentId'] },
          { fields: ['publishedAt'] },
          { fields: ['viewCount'] },
          { fields: ['isPremium'] },
          { fields: ['isPrivate'] },
          { using: 'gin', fields: ['metaKeywords'] },
          { using: 'gin', fields: ['requiredRoles'] },
          { using: 'gin', fields: ['requiredTags'] },
        ],
        hooks: {
          beforeCreate: async (content: UnifiedContent) => {
            if (!content.slug) {
              content.slug = await content.generateSlug();
            }
            if (content.content) {
              content.readingTime = content.calculateReadingTime();
            }
          },
          beforeUpdate: async (content: UnifiedContent) => {
            if (content.changed('title') && !content.changed('slug')) {
              content.slug = await content.generateSlug();
            }
            if (content.changed('content')) {
              content.readingTime = content.calculateReadingTime();
            }
          },
        },
      }
    );
  }
  
  /**
   * Set up associations
   */
  public static associate(): void {
    // Author association
    UnifiedContent.belongsTo(User, {
      foreignKey: 'authorId',
      as: 'author',
    });
    
    // Self-referential association for hierarchical content
    UnifiedContent.belongsTo(UnifiedContent, {
      foreignKey: 'parentId',
      as: 'parent',
    });
    
    UnifiedContent.hasMany(UnifiedContent, {
      foreignKey: 'parentId',
      as: 'children',
    });
  }
}

export default UnifiedContent;