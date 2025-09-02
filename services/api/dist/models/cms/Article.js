"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Article = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
// Article model class
class Article extends sequelize_1.Model {
    id;
    title;
    slug;
    excerpt;
    content;
    categoryId;
    authorId;
    status;
    publishedAt;
    featuredImage;
    seoTitle;
    seoDescription;
    seoKeywords;
    readTime;
    viewCount;
    shareCount;
    likeCount;
    metadata;
    settings;
    publishingSchedule;
    analytics;
    deletedAt;
    // Instance methods
    async generateSlug() {
        const baseSlug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        // Check for existing slugs
        let slug = baseSlug;
        let counter = 1;
        while (await Article.findOne({ where: { slug, id: { [sequelize_1.Op.ne]: this.id } } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }
    async calculateReadTime() {
        const wordsPerMinute = 200;
        const wordCount = this.content.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }
    async updateAnalytics(analytics) {
        this.analytics = { ...this.analytics, ...analytics };
        await this.save();
    }
    async incrementViewCount() {
        this.viewCount += 1;
        await this.save();
    }
    async publish() {
        this.status = 'published';
        this.publishedAt = new Date();
        await this.save();
    }
    async archive() {
        this.status = 'archived';
        await this.save();
    }
    // Static methods
    static async getPublished() {
        return Article.findAll({
            where: { status: 'published' },
            order: [['publishedAt', 'DESC']],
        });
    }
    static async getFeatured() {
        return Article.findAll({
            where: {
                status: 'published',
                'settings.isFeatured': true,
            },
            order: [['publishedAt', 'DESC']],
            limit: 10,
        });
    }
    static async searchArticles(query, filters = {}) {
        const whereClause = {};
        if (query) {
            whereClause[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { content: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { excerpt: { [sequelize_1.Op.iLike]: `%${query}%` } },
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
    static async getPopular(limit = 10) {
        return Article.findAll({
            where: { status: 'published' },
            order: [
                ['viewCount', 'DESC'],
                ['analytics.engagementScore', 'DESC'],
            ],
            limit,
        });
    }
    static async getByCategory(categoryId) {
        return Article.findAll({
            where: {
                categoryId,
                status: 'published',
            },
            order: [['publishedAt', 'DESC']],
        });
    }
    static async getDrafts(authorId) {
        const whereClause = { status: 'draft' };
        if (authorId) {
            whereClause.authorId = authorId;
        }
        return Article.findAll({
            where: whereClause,
            order: [['updatedAt', 'DESC']],
        });
    }
    static async getScheduledForPublishing() {
        return Article.findAll({
            where: {
                status: 'draft',
                'publishingSchedule.scheduledPublishAt': {
                    [sequelize_1.Op.lte]: new Date(),
                },
                'publishingSchedule.autoPublish': true,
            },
        });
    }
}
exports.Article = Article;
// Initialize the model
Article.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [5, 200],
        },
    },
    slug: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            is: /^[a-z0-9-]+$/,
        },
    },
    excerpt: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [20, 500],
        },
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [100, 50000],
        },
    },
    categoryId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id',
        },
    },
    authorId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
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
        validate: {
            isUrl: true,
        },
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
        validate: {
            min: 1,
        },
    },
    viewCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    shareCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    likeCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            wordCount: 0,
            version: 1,
            sources: [],
        },
    },
    settings: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            allowComments: true,
            enableNotifications: true,
            isFeatured: false,
            isTemplate: false,
        },
    },
    publishingSchedule: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            scheduledPublishAt: null,
            timezone: 'UTC',
            autoPublish: false,
        },
    },
    analytics: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            avgReadTime: 0,
            bounceRate: 0,
            completionRate: 0,
            engagementScore: 0,
        },
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
}, {
    sequelize: sequelize_2.sequelize,
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
        beforeCreate: async (article) => {
            if (!article.slug) {
                article.slug = await article.generateSlug();
            }
            article.readTime = await article.calculateReadTime();
            article.metadata.wordCount = article.content.split(/\s+/).length;
        },
        beforeUpdate: async (article) => {
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
});
exports.default = Article;
//# sourceMappingURL=Article.js.map