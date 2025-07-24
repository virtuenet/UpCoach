import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../index';

// Article interface
export interface ArticleAttributes {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Date | null;
  featuredImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[] | null;
  readTime: number; // in minutes
  viewCount: number;
  shareCount: number;
  likeCount: number;
  metadata: {
    wordCount: number;
    lastEditedBy?: string;
    version: number;
    sources?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedReadTime?: number;
  };
  settings: {
    allowComments: boolean;
    enableNotifications: boolean;
    isFeatured: boolean;
    isTemplate: boolean;
    templateCategory?: string;
  };
  publishingSchedule: {
    scheduledPublishAt: Date | null;
    timezone: string;
    autoPublish: boolean;
  };
  analytics: {
    avgReadTime: number;
    bounceRate: number;
    completionRate: number;
    engagementScore: number;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Optional fields for creation
export interface ArticleCreationAttributes extends Optional<ArticleAttributes, 
  'id' | 'slug' | 'viewCount' | 'shareCount' | 'likeCount' | 'readTime' | 
  'publishedAt' | 'featuredImage' | 'seoTitle' | 'seoDescription' | 'seoKeywords' |
  'metadata' | 'settings' | 'publishingSchedule' | 'analytics' | 'createdAt' | 'updatedAt' | 'deletedAt'
> {}

// Article model class
export class Article extends Model<ArticleAttributes, ArticleCreationAttributes> implements ArticleAttributes {
  public id!: string;
  public title!: string;
  public slug!: string;
  public excerpt!: string;
  public content!: string;
  public categoryId!: string;
  public authorId!: string;
  public status!: 'draft' | 'published' | 'archived';
  public publishedAt!: Date | null;
  public featuredImage!: string | null;
  public seoTitle!: string | null;
  public seoDescription!: string | null;
  public seoKeywords!: string[] | null;
  public readTime!: number;
  public viewCount!: number;
  public shareCount!: number;
  public likeCount!: number;
  public metadata!: ArticleAttributes['metadata'];
  public settings!: ArticleAttributes['settings'];
  public publishingSchedule!: ArticleAttributes['publishingSchedule'];
  public analytics!: ArticleAttributes['analytics'];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  // Instance methods
  public async generateSlug(): Promise<string> {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check for existing slugs
    let slug = baseSlug;
    let counter = 1;
    
    while (await Article.findOne({ where: { slug, id: { [Op.ne]: this.id } } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  public async calculateReadTime(): Promise<number> {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  public async updateAnalytics(analytics: Partial<ArticleAttributes['analytics']>): Promise<void> {
    this.analytics = { ...this.analytics, ...analytics };
    await this.save();
  }

  public async incrementViewCount(): Promise<void> {
    this.viewCount += 1;
    await this.save();
  }

  public async publish(): Promise<void> {
    this.status = 'published';
    this.publishedAt = new Date();
    await this.save();
  }

  public async archive(): Promise<void> {
    this.status = 'archived';
    await this.save();
  }

  // Static methods
  static async getPublished(): Promise<Article[]> {
    return Article.findAll({
      where: { status: 'published' },
      order: [['publishedAt', 'DESC']],
    });
  }

  static async getFeatured(): Promise<Article[]> {
    return Article.findAll({
      where: { 
        status: 'published',
        'settings.isFeatured': true 
      },
      order: [['publishedAt', 'DESC']],
      limit: 10,
    });
  }

  static async searchArticles(query: string, filters: {
    category?: string;
    status?: string;
    author?: string;
    tags?: string[];
  } = {}): Promise<Article[]> {
    const whereClause: any = {};

    if (query) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { content: { [Op.iLike]: `%${query}%` } },
        { excerpt: { [Op.iLike]: `%${query}%` } },
      ];
    }

    if (filters.category) {
      whereClause.categoryId = filters.category;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.author) {
      whereClause.authorId = filters.author;
    }

    return Article.findAll({
      where: whereClause,
      order: [['updatedAt', 'DESC']],
    });
  }

  static async getPopular(limit: number = 10): Promise<Article[]> {
    return Article.findAll({
      where: { status: 'published' },
      order: [['viewCount', 'DESC'], ['analytics.engagementScore', 'DESC']],
      limit,
    });
  }

  static async getByCategory(categoryId: string): Promise<Article[]> {
    return Article.findAll({
      where: { 
        categoryId,
        status: 'published' 
      },
      order: [['publishedAt', 'DESC']],
    });
  }

  static async getDrafts(authorId?: string): Promise<Article[]> {
    const whereClause: any = { status: 'draft' };
    if (authorId) {
      whereClause.authorId = authorId;
    }

    return Article.findAll({
      where: whereClause,
      order: [['updatedAt', 'DESC']],
    });
  }

  static async getScheduledForPublishing(): Promise<Article[]> {
    return Article.findAll({
      where: {
        status: 'draft',
        'publishingSchedule.scheduledPublishAt': {
          [Op.lte]: new Date()
        },
        'publishingSchedule.autoPublish': true
      }
    });
  }
}

// Initialize the model
Article.init(
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
        len: [5, 200],
      },
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/,
      },
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [20, 500],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [100, 50000],
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    featuredImage: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    seoTitle: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    seoDescription: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    seoKeywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    readTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    shareCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        wordCount: 0,
        version: 1,
        sources: [],
      },
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        allowComments: true,
        enableNotifications: true,
        isFeatured: false,
        isTemplate: false,
      },
    },
    publishingSchedule: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        scheduledPublishAt: null,
        timezone: 'UTC',
        autoPublish: false,
      },
    },
    analytics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        avgReadTime: 0,
        bounceRate: 0,
        completionRate: 0,
        engagementScore: 0,
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Article',
    tableName: 'articles',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['slug'],
        unique: true,
      },
      {
        fields: ['status'],
      },
      {
        fields: ['categoryId'],
      },
      {
        fields: ['authorId'],
      },
      {
        fields: ['publishedAt'],
      },
      {
        fields: ['viewCount'],
      },
      {
        using: 'gin',
        fields: ['seoKeywords'],
      },
      {
        using: 'gin',
        fields: ['metadata'],
      },
    ],
    hooks: {
      beforeCreate: async (article: Article) => {
        if (!article.slug) {
          article.slug = await article.generateSlug();
        }
        article.readTime = await article.calculateReadTime();
        article.metadata.wordCount = article.content.split(/\s+/).length;
      },
      beforeUpdate: async (article: Article) => {
        if (article.changed('title') && !article.changed('slug')) {
          article.slug = await article.generateSlug();
        }
        if (article.changed('content')) {
          article.readTime = await article.calculateReadTime();
          article.metadata.wordCount = article.content.split(/\s+/).length;
          article.metadata.version += 1;
        }
      },
    },
  }
);

export default Article; 