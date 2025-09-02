"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const logger_1 = require("../utils/logger");
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    // Create categories table
    await queryInterface.createTable('categories', {
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        parentId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'categories',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        level: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        path: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        iconUrl: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        colorCode: {
            type: sequelize_1.DataTypes.STRING(7),
            allowNull: true,
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        sortOrder: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        metadata: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        seo: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
    });
    // Create articles table
    await queryInterface.createTable('articles', {
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        excerpt: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        content: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        categoryId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        authorId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('draft', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
        },
        publishedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        featuredImage: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        seoTitle: {
            type: sequelize_1.DataTypes.STRING(60),
            allowNull: true,
        },
        seoDescription: {
            type: sequelize_1.DataTypes.STRING(160),
            allowNull: true,
        },
        seoKeywords: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
        readTime: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        viewCount: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        shareCount: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        likeCount: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        metadata: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        settings: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        publishingSchedule: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        analytics: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
    });
    // Create courses table
    await queryInterface.createTable('courses', {
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        longDescription: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        categoryId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        instructorId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        difficulty: {
            type: sequelize_1.DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
            allowNull: false,
        },
        duration: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        price: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        currency: {
            type: sequelize_1.DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'USD',
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('draft', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
        },
        publishedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        thumbnailImage: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        previewVideo: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        objectives: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
            allowNull: false,
            defaultValue: [],
        },
        prerequisites: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
            allowNull: false,
            defaultValue: [],
        },
        targetAudience: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
            allowNull: false,
            defaultValue: [],
        },
        tags: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
            allowNull: false,
            defaultValue: [],
        },
        seoTitle: {
            type: sequelize_1.DataTypes.STRING(60),
            allowNull: true,
        },
        seoDescription: {
            type: sequelize_1.DataTypes.STRING(160),
            allowNull: true,
        },
        metadata: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        enrollment: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        settings: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        pricing: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        analytics: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
    });
    // Create media table
    await queryInterface.createTable('media', {
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        filename: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        originalName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        mimeType: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        fileSize: {
            type: sequelize_1.DataTypes.BIGINT,
            allowNull: false,
        },
        url: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        thumbnailUrl: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        alt: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        caption: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        uploadedById: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        folder: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        tags: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
            allowNull: false,
            defaultValue: [],
        },
        metadata: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        usage: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('processing', 'ready', 'failed'),
            allowNull: false,
            defaultValue: 'processing',
        },
        isPublic: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
    });
    // Create content_analytics table
    await queryInterface.createTable('content_analytics', {
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        contentType: {
            type: sequelize_1.DataTypes.ENUM('article', 'course'),
            allowNull: false,
        },
        contentId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        sessionId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        event: {
            type: sequelize_1.DataTypes.ENUM('view', 'read', 'share', 'like', 'comment', 'download', 'complete'),
            allowNull: false,
        },
        metadata: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
        ipAddress: {
            type: sequelize_1.DataTypes.INET,
            allowNull: true,
        },
        timestamp: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
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
    logger_1.logger.info('✅ CMS models created successfully');
}
async function down(queryInterface) {
    // Drop tables in reverse order to handle foreign key constraints
    await queryInterface.dropTable('content_analytics');
    await queryInterface.dropTable('media');
    await queryInterface.dropTable('courses');
    await queryInterface.dropTable('articles');
    await queryInterface.dropTable('categories');
    logger_1.logger.info('✅ CMS models dropped successfully');
}
//# sourceMappingURL=20240102000000-create-cms-models.js.map