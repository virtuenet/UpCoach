import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  DefaultScope,
  Scopes,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { User } from '../User';
import { ContentCategory } from './ContentCategory';
import { ContentVersion } from './ContentVersion';
import { ContentComment } from './ContentComment';
import { ContentInteraction } from './ContentInteraction';
import slugify from 'slugify';
import { Op } from 'sequelize';

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

export interface ArticleMetadata {
  featured?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  equipment?: string[];
  targetAudience?: string[];
}

@DefaultScope(() => ({
  attributes: {
    exclude: ['content'], // Exclude heavy content by default
  },
}))
@Scopes(() => ({
  full: {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email', 'avatar'],
      },
      {
        model: ContentCategory,
        as: 'category',
      },
    ],
  },
  published: {
    where: {
      status: 'published',
      publish_date: {
        [Op.lte]: new Date(),
      },
    },
  },
  withContent: {
    attributes: {
      include: ['content'],
    },
  },
}))
@Table({
  tableName: 'content_articles',
  timestamps: true,
  underscored: true,
})
export class ContentArticle extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.STRING(255),
    unique: true,
    allowNull: false,
  })
  slug: string;

  @Column(DataType.TEXT)
  summary: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  content: ArticleContent;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  authorId: number;

  @BelongsTo(() => User, 'authorId')
  author: User;

  @ForeignKey(() => ContentCategory)
  @Column(DataType.INTEGER)
  categoryId: number;

  @BelongsTo(() => ContentCategory)
  category: ContentCategory;

  @Column(DataType.STRING(500))
  featuredImage: string;

  @Column({
    type: DataType.ENUM('draft', 'review', 'published', 'archived'),
    defaultValue: 'draft',
  })
  status: 'draft' | 'review' | 'published' | 'archived';

  @Column({
    type: DataType.ENUM('public', 'members', 'premium'),
    defaultValue: 'public',
  })
  visibility: 'public' | 'members' | 'premium';

  @Column(DataType.DATE)
  publishDate: Date;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
  })
  tags: string[];

  @Column(DataType.STRING(255))
  seoTitle: string;

  @Column(DataType.TEXT)
  seoDescription: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
  })
  seoKeywords: string[];

  @Column(DataType.INTEGER)
  readingTime: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  viewCount: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  likeCount: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  shareCount: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isFeatured: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  allowComments: boolean;

  @Column(DataType.JSONB)
  metadata: ArticleMetadata;

  @Column(DataType.DATE)
  publishedAt: Date;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  lastModifiedBy: number;

  @BelongsTo(() => User, 'lastModifiedBy')
  lastModifier: User;

  @HasMany(() => ContentVersion)
  versions: ContentVersion[];

  @HasMany(() => ContentComment)
  comments: ContentComment[];

  @HasMany(() => ContentInteraction)
  interactions: ContentInteraction[];

  declare createdAt: Date;
  declare updatedAt: Date;

  // Hooks
  @BeforeCreate
  static async generateSlug(instance: ContentArticle) {
    if (!instance.slug && instance.title) {
      instance.slug = slugify(instance.title, { lower: true, strict: true });
      
      // Ensure unique slug
      let counter = 1;
      let slug = instance.slug;
      while (await ContentArticle.findOne({ where: { slug } })) {
        slug = `${instance.slug}-${counter}`;
        counter++;
      }
      instance.slug = slug;
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static calculateReadingTime(instance: ContentArticle) {
    if (instance.content && instance.content.body) {
      const wordsPerMinute = 200;
      const wordCount = instance.content.body.split(/\s+/).length;
      instance.readingTime = Math.ceil(wordCount / wordsPerMinute);
    }
  }

  @BeforeUpdate
  static updatePublishedAt(instance: ContentArticle) {
    if (instance.changed('status') && instance.status === 'published' && !instance.publishedAt) {
      instance.publishedAt = new Date();
    }
  }

  // Instance methods
  async createVersion(userId: number, changeSummary?: string): Promise<ContentVersion> {
    const lastVersion = await ContentVersion.findOne({
      where: { articleId: this.id },
      order: [['versionNumber', 'DESC']],
    });

    const versionNumber = (lastVersion?.versionNumber || 0) + 1;

    return ContentVersion.create({
      articleId: this.id,
      versionNumber,
      title: this.title,
      content: this.content,
      changeSummary,
      authorId: userId,
    });
  }

  async incrementViewCount(): Promise<void> {
    await this.increment('viewCount');
  }

  async incrementLikeCount(): Promise<void> {
    await this.increment('likeCount');
  }

  async incrementShareCount(): Promise<void> {
    await this.increment('shareCount');
  }

  async publish(): Promise<void> {
    this.status = 'published';
    this.publishDate = this.publishDate || new Date();
    this.publishedAt = new Date();
    await this.save();
  }

  async unpublish(): Promise<void> {
    this.status = 'draft';
    await this.save();
  }

  async archive(): Promise<void> {
    this.status = 'archived';
    await this.save();
  }

  isPublished(): boolean {
    return this.status === 'published' && 
           this.publishDate && 
           this.publishDate <= new Date();
  }

  canEdit(userId: number, userRole: string): boolean {
    return userRole === 'admin' || 
           userRole === 'editor' || 
           (this.authorId === userId && this.status === 'draft');
  }

  canPublish(userRole: string): boolean {
    return userRole === 'admin' || userRole === 'editor';
  }
}