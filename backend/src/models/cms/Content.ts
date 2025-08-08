import { Model, DataTypes, Sequelize, Association, Optional } from 'sequelize';
import { User } from '../User';
import { ContentCategory } from './ContentCategory';
import { ContentTag } from './ContentTag';
import { ContentMedia } from './ContentMedia';

export interface ContentAttributes {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  type: 'article' | 'guide' | 'exercise' | 'lesson' | 'tip';
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  categoryId?: string;
  authorId: string;
  featuredImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  publishedAt?: Date;
  scheduledAt?: Date;
  readingTime?: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  isPremium: boolean;
  order?: number;
  settings?: {
    allowComments?: boolean;
    showAuthor?: boolean;
    showDate?: boolean;
    showReadingTime?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentCreationAttributes extends Optional<ContentAttributes, 'id' | 'excerpt' | 'categoryId' | 'featuredImageUrl' | 'metaTitle' | 'metaDescription' | 'metaKeywords' | 'publishedAt' | 'scheduledAt' | 'readingTime' | 'viewCount' | 'likeCount' | 'shareCount' | 'order' | 'settings' | 'createdAt' | 'updatedAt'> {}

export class Content extends Model<ContentAttributes, ContentCreationAttributes> implements ContentAttributes {
  public id!: string;
  public title!: string;
  public slug!: string;
  public content!: string;
  public excerpt?: string;
  public type!: 'article' | 'guide' | 'exercise' | 'lesson' | 'tip';
  public status!: 'draft' | 'published' | 'scheduled' | 'archived';
  public categoryId?: string;
  public authorId!: string;
  public featuredImageUrl?: string;
  public metaTitle?: string;
  public metaDescription?: string;
  public metaKeywords?: string;
  public publishedAt?: Date;
  public scheduledAt?: Date;
  public readingTime?: number;
  public viewCount!: number;
  public likeCount!: number;
  public shareCount!: number;
  public isPremium!: boolean;
  public order?: number;
  public settings?: {
    allowComments?: boolean;
    showAuthor?: boolean;
    showDate?: boolean;
    showReadingTime?: boolean;
  };
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  public readonly author?: User;
  public readonly category?: ContentCategory;
  public readonly tags?: ContentTag[];
  public readonly media?: ContentMedia[];
  
  // Association methods
  public setTags!: (tags: ContentTag[]) => Promise<void>;
  public getTags!: () => Promise<ContentTag[]>;
  public addTag!: (tag: ContentTag) => Promise<void>;
  public removeTag!: (tag: ContentTag) => Promise<void>;

  public static associations: {
    author: Association<Content, User>;
    category: Association<Content, ContentCategory>;
    tags: Association<Content, ContentTag>;
    media: Association<Content, ContentMedia>;
  };

  public static initialize(sequelize: Sequelize): void {
    Content.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        excerpt: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        type: {
          type: DataTypes.ENUM('article', 'guide', 'exercise', 'lesson', 'tip'),
          allowNull: false,
          defaultValue: 'article',
        },
        status: {
          type: DataTypes.ENUM('draft', 'published', 'scheduled', 'archived'),
          allowNull: false,
          defaultValue: 'draft',
        },
        categoryId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'content_categories',
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
        featuredImageUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        metaTitle: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        metaDescription: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        metaKeywords: {
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
        readingTime: {
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
        shareCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        isPremium: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        order: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        settings: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {
            allowComments: true,
            showAuthor: true,
            showDate: true,
            showReadingTime: true,
          },
        },
      },
      {
        sequelize,
        modelName: 'Content',
        tableName: 'contents',
        timestamps: true,
        indexes: [
          { fields: ['slug'], unique: true },
          { fields: ['status'] },
          { fields: ['type'] },
          { fields: ['authorId'] },
          { fields: ['categoryId'] },
          { fields: ['publishedAt'] },
          { fields: ['isPremium'] },
        ],
      }
    );
  }

  public static associate(): void {
    Content.belongsTo(User, {
      foreignKey: 'authorId',
      as: 'author',
    });

    Content.belongsTo(ContentCategory, {
      foreignKey: 'categoryId',
      as: 'category',
    });

    Content.belongsToMany(ContentTag, {
      through: 'content_tag_relations',
      foreignKey: 'contentId',
      otherKey: 'tagId',
      as: 'tags',
    });

    Content.hasMany(ContentMedia, {
      foreignKey: 'contentId',
      as: 'media',
    });
  }
}