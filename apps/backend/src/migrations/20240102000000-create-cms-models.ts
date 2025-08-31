import { logger } from '../utils/logger';
import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create categories table
  await queryInterface.createTable('categories', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    iconUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    colorCode: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    seo: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
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
  });

  // Create articles table
  await queryInterface.createTable('articles', {
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
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
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
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    shareCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    publishingSchedule: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    analytics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
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
  });

  // Create courses table
  await queryInterface.createTable('courses', {
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
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    longDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    instructorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
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
    thumbnailImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previewVideo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    objectives: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    prerequisites: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    targetAudience: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    seoTitle: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    seoDescription: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    enrollment: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    pricing: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    analytics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
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
  });

  // Create media table
  await queryInterface.createTable('media', {
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
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thumbnailUrl: {
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
    uploadedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    folder: {
      type: DataTypes.STRING,
      allowNull: true,
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
      defaultValue: {},
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
  });

  // Create content_analytics table
  await queryInterface.createTable('content_analytics', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    contentType: {
      type: DataTypes.ENUM('article', 'course'),
      allowNull: false,
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    event: {
      type: DataTypes.ENUM('view', 'read', 'share', 'like', 'comment', 'download', 'complete'),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  // Add indexes for better performance

  // Categories indexes
  await queryInterface.addIndex('categories', ['slug'], { unique: true });
  await queryInterface.addIndex('categories', ['parentId']);
  await queryInterface.addIndex('categories', ['level']);
  await queryInterface.addIndex('categories', ['path']);
  await queryInterface.addIndex('categories', ['isActive']);
  await queryInterface.addIndex('categories', ['sortOrder']);
  await queryInterface.addIndex('categories', ['metadata'], { using: 'gin' });

  // Articles indexes
  await queryInterface.addIndex('articles', ['slug'], { unique: true });
  await queryInterface.addIndex('articles', ['status']);
  await queryInterface.addIndex('articles', ['categoryId']);
  await queryInterface.addIndex('articles', ['authorId']);
  await queryInterface.addIndex('articles', ['publishedAt']);
  await queryInterface.addIndex('articles', ['viewCount']);
  await queryInterface.addIndex('articles', ['seoKeywords'], { using: 'gin' });
  await queryInterface.addIndex('articles', ['metadata'], { using: 'gin' });

  // Courses indexes
  await queryInterface.addIndex('courses', ['slug'], { unique: true });
  await queryInterface.addIndex('courses', ['status']);
  await queryInterface.addIndex('courses', ['categoryId']);
  await queryInterface.addIndex('courses', ['instructorId']);
  await queryInterface.addIndex('courses', ['difficulty']);
  await queryInterface.addIndex('courses', ['price']);
  await queryInterface.addIndex('courses', ['publishedAt']);
  await queryInterface.addIndex('courses', ['tags'], { using: 'gin' });
  await queryInterface.addIndex('courses', ['objectives'], { using: 'gin' });
  await queryInterface.addIndex('courses', ['metadata'], { using: 'gin' });

  // Media indexes
  await queryInterface.addIndex('media', ['filename']);
  await queryInterface.addIndex('media', ['mimeType']);
  await queryInterface.addIndex('media', ['uploadedById']);
  await queryInterface.addIndex('media', ['folder']);
  await queryInterface.addIndex('media', ['status']);
  await queryInterface.addIndex('media', ['isPublic']);
  await queryInterface.addIndex('media', ['fileSize']);
  await queryInterface.addIndex('media', ['tags'], { using: 'gin' });
  await queryInterface.addIndex('media', ['metadata'], { using: 'gin' });
  await queryInterface.addIndex('media', ['usage'], { using: 'gin' });

  // Content analytics indexes
  await queryInterface.addIndex('content_analytics', ['contentType', 'contentId']);
  await queryInterface.addIndex('content_analytics', ['userId']);
  await queryInterface.addIndex('content_analytics', ['sessionId']);
  await queryInterface.addIndex('content_analytics', ['event']);
  await queryInterface.addIndex('content_analytics', ['timestamp']);
  await queryInterface.addIndex('content_analytics', ['contentType', 'contentId', 'event']);
  await queryInterface.addIndex('content_analytics', ['metadata'], { using: 'gin' });

  logger.info('✅ CMS models created successfully');
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop tables in reverse order to handle foreign key constraints
  await queryInterface.dropTable('content_analytics');
  await queryInterface.dropTable('media');
  await queryInterface.dropTable('courses');
  await queryInterface.dropTable('articles');
  await queryInterface.dropTable('categories');

  logger.info('✅ CMS models dropped successfully');
}
