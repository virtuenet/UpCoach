import { Model, DataTypes, Optional, BelongsToGetAssociationMixin, Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../User';
import { ContentCategory } from './ContentCategory';
import ContentVersion from './ContentVersion';
import ContentComment from './ContentComment';
import ContentInteraction from './ContentInteraction';
import slugify from 'slugify';

export interface ArticleContent {
  format: 'markdown' | 'html' | 'structured';
  body: string;
  sections?: Array<{
    id: string;
    type: string;
    title?: string;
    content: any;
  }>;
}

export interface ContentArticleAttributes {
  id: number;
  slug: string;
  title: string;
  summary?: string;
  content: string | ArticleContent;
  authorId: number;
  categoryId: number;
  featuredImage?: string;
  tags: string[];
  status: 'draft' | 'review' | 'published' | 'archived';
  visibility: 'public' | 'members' | 'premium';
  publishDate?: Date;
  readTime?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  allowComments: boolean;
  isPinned: boolean;
  lastModifiedBy?: number;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentArticleCreationAttributes
  extends Optional<
    ContentArticleAttributes,
    | 'id'
    | 'summary'
    | 'featuredImage'
    | 'tags'
    | 'status'
    | 'visibility'
    | 'publishDate'
    | 'readTime'
    | 'viewCount'
    | 'likeCount'
    | 'commentCount'
    | 'shareCount'
    | 'seoTitle'
    | 'seoDescription'
    | 'seoKeywords'
    | 'allowComments'
    | 'isPinned'
    | 'lastModifiedBy'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class ContentArticle
  extends Model<ContentArticleAttributes, ContentArticleCreationAttributes>
  implements ContentArticleAttributes
{
  declare id: number;
  public slug!: string;
  public title!: string;
  public summary?: string;
  public content!: string | ArticleContent;
  public authorId!: number;
  public categoryId!: number;
  public featuredImage?: string;
  public tags!: string[];
  public status!: 'draft' | 'review' | 'published' | 'archived';
  public visibility!: 'public' | 'members' | 'premium';
  public publishDate?: Date;
  public readTime?: number;
  public viewCount!: number;
  public likeCount!: number;
  public commentCount!: number;
  public shareCount!: number;
  public seoTitle?: string;
  public seoDescription?: string;
  public seoKeywords?: string[];
  public allowComments!: boolean;
  public isPinned!: boolean;
  public lastModifiedBy?: number;
  public metadata?: any;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly author?: User;
  public readonly category?: ContentCategory;
  public readonly versions?: ContentVersion[];
  public readonly comments?: ContentComment[];
  public readonly interactions?: ContentInteraction[];

  // Association methods
  public getAuthor!: BelongsToGetAssociationMixin<User>;

  // Instance methods
  public async createVersion(userId: number, changeSummary?: string): Promise<ContentVersion> {
    const versionCount = await ContentVersion.count({
      where: { contentId: this.id },
    });

    return ContentVersion.create({
      contentId: this.id,
      version: versionCount + 1,
      title: this.title,
      content: typeof this.content === 'string' ? this.content : JSON.stringify(this.content),
      excerpt: this.summary,
      featuredImage: this.featuredImage,
      metadata: this.metadata,
      changes: changeSummary,
      createdBy: userId,
    });
  }

  public canEdit(userId: number, userRole?: string): boolean {
    return this.authorId === userId || userRole === 'admin' || userRole === 'editor';
  }

  public async calculateReadTime(): Promise<number> {
    const content = typeof this.content === 'string' ? this.content : this.content.body;
    const words = content.split(/\s+/).length;
    const readTime = Math.ceil(words / 200); // Average reading speed: 200 words per minute
    return readTime;
  }

  public isPublished(): boolean {
    return this.status === 'published' && (!this.publishDate || this.publishDate <= new Date());
  }

  public async incrementViewCount(): Promise<void> {
    this.viewCount += 1;
    await this.save();
  }

  public canPublish(userRole?: string): boolean {
    return userRole === 'admin' || userRole === 'editor';
  }

  public async publish(): Promise<void> {
    this.status = 'published';
    this.publishDate = new Date();
    await this.save();
  }

  public async unpublish(): Promise<void> {
    this.status = 'draft';
    await this.save();
  }

  // Static methods
  public static associate(models: any) {
    ContentArticle.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author',
    });

    ContentArticle.belongsTo(models.ContentCategory, {
      foreignKey: 'categoryId',
      as: 'category',
    });

    ContentArticle.hasMany(models.ContentVersion, {
      foreignKey: 'contentId',
      as: 'versions',
    });

    ContentArticle.hasMany(models.ContentComment, {
      foreignKey: 'contentId',
      as: 'comments',
    });

    ContentArticle.hasMany(models.ContentInteraction, {
      foreignKey: 'contentId',
      as: 'interactions',
    });
  }
}

ContentArticle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      get() {
        const value = this.getDataValue('content');
        return typeof value === 'string' ? JSON.parse(value) : value;
      },
      set(value: string | ArticleContent) {
        this.setDataValue('content', typeof value === 'string' ? value : JSON.stringify(value));
      },
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'content_categories',
        key: 'id',
      },
    },
    featuredImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('draft', 'review', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    visibility: {
      type: DataTypes.ENUM('public', 'members', 'premium'),
      allowNull: false,
      defaultValue: 'public',
    },
    publishDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    readTime: {
      type: DataTypes.INTEGER,
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
    commentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    shareCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    seoTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    seoKeywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    allowComments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastModifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'ContentArticle',
    tableName: 'content_articles',
    timestamps: true,
    hooks: {
      beforeCreate: async (article: ContentArticle) => {
        // Generate slug if not provided
        if (!article.slug) {
          article.slug = slugify(article.title, { lower: true, strict: true });
        }

        // Calculate read time
        article.readTime = await article.calculateReadTime();

        // Set SEO fields if not provided
        if (!article.seoTitle) {
          article.seoTitle = article.title;
        }
        if (!article.seoDescription) {
          article.seoDescription = article.summary || article.title;
        }
      },
      beforeUpdate: async (article: ContentArticle) => {
        // Recalculate read time if content changed
        if (article.changed('content')) {
          article.readTime = await article.calculateReadTime();
        }

        // Update slug if title changed
        if (article.changed('title') && !article.changed('slug')) {
          article.slug = slugify(article.title, { lower: true, strict: true });
        }
      },
    },
    defaultScope: {
      attributes: {
        exclude: ['content'], // Exclude content from default queries for performance
      },
    },
    scopes: {
      published: {
        where: {
          status: 'published',
          publishDate: {
            [Op.lte]: new Date(),
          },
        },
      },
      withContent: {
        attributes: {
          include: ['content'],
        },
      },
      byAuthor: (authorId: number) => ({
        where: { authorId },
      }),
      byCategory: (categoryId: number) => ({
        where: { categoryId },
      }),
      withStats: {
        attributes: {
          include: [
            [
              sequelize.literal(
                '(SELECT COUNT(*) FROM content_interactions WHERE content_id = "ContentArticle"."id" AND interaction_type = \'view\')'
              ),
              'actualViewCount',
            ],
            [
              sequelize.literal(
                '(SELECT COUNT(*) FROM content_interactions WHERE content_id = "ContentArticle"."id" AND interaction_type = \'like\')'
              ),
              'actualLikeCount',
            ],
          ],
        },
      },
    },
    indexes: [
      {
        fields: ['slug'],
        unique: true,
      },
      {
        fields: ['authorId'],
      },
      {
        fields: ['categoryId'],
      },
      {
        fields: ['status', 'publishDate'],
      },
      {
        fields: ['tags'],
        using: 'gin',
      },
    ],
  }
);

export default ContentArticle;
