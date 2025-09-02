"use strict";
/**
 * Unified Content Model
 * Consolidates Article, Content, ContentArticle, Course, Template, and other CMS models
 * into a single flexible content system with discriminated types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedContent = void 0;
const sequelize_1 = require("sequelize");
const User_1 = require("../User");
// ==================== Model Class ====================
class UnifiedContent extends sequelize_1.Model {
    // Required fields
    id;
    type;
    format;
    title;
    slug;
    content;
    status;
    authorId;
    viewCount;
    likeCount;
    shareCount;
    commentCount;
    isPremium;
    isPrivate;
    version;
    // Optional fields
    excerpt;
    categoryId;
    parentId;
    order;
    featuredImageUrl;
    thumbnailUrl;
    videoUrl;
    audioUrl;
    attachments;
    metaTitle;
    metaDescription;
    metaKeywords;
    canonicalUrl;
    publishedAt;
    scheduledAt;
    expiresAt;
    readingTime;
    completionRate;
    avgRating;
    ratingCount;
    requiredRoles;
    requiredTags;
    courseData;
    templateData;
    faqData;
    settings;
    versionHistory;
    deletedAt;
    // Associations
    author;
    category; // ContentCategory
    parent;
    children;
    tags; // ContentTag[]
    media; // ContentMedia[]
    comments; // ContentComment[]
    interactions; // ContentInteraction[]
    // Association methods
    setTags;
    getTags;
    addTag;
    removeTag;
    static associations;
    // ==================== Instance Methods ====================
    /**
     * Generate unique slug
     */
    async generateSlug() {
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
                id: { [sequelize_1.Op.ne]: this.id },
            },
        })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }
    /**
     * Calculate reading time
     */
    calculateReadingTime() {
        const wordsPerMinute = 200;
        const wordCount = this.content.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }
    /**
     * Publish content
     */
    async publish() {
        this.status = 'published';
        this.publishedAt = new Date();
        await this.save();
    }
    /**
     * Archive content
     */
    async archive() {
        this.status = 'archived';
        await this.save();
    }
    /**
     * Increment view count
     */
    async incrementViewCount() {
        this.viewCount += 1;
        await this.save();
    }
    /**
     * Create new version
     */
    async createVersion(changedBy, changes) {
        this.version += 1;
        this.versionHistory = this.versionHistory || [];
        this.versionHistory.push({
            version: this.version,
            changedBy,
            changedAt: new Date(),
            changes,
        });
        await this.save();
    }
    // ==================== Static Methods ====================
    /**
     * Get published content
     */
    static async getPublished(type) {
        const where = { status: 'published' };
        if (type)
            where.type = type;
        return UnifiedContent.findAll({
            where,
            order: [['publishedAt', 'DESC']],
        });
    }
    /**
     * Get featured content
     */
    static async getFeatured(limit = 10) {
        return UnifiedContent.findAll({
            where: {
                status: 'published',
                featuredImageUrl: { [sequelize_1.Op.ne]: null },
            },
            order: [['publishedAt', 'DESC']],
            limit,
        });
    }
    /**
     * Search content
     */
    static async search(query, filters = {}) {
        const where = {};
        if (query) {
            where[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { content: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { excerpt: { [sequelize_1.Op.iLike]: `%${query}%` } },
            ];
        }
        if (filters.type)
            where.type = filters.type;
        if (filters.status)
            where.status = filters.status;
        if (filters.category)
            where.categoryId = filters.category;
        if (filters.author)
            where.authorId = filters.author;
        if (filters.isPremium !== undefined)
            where.isPremium = filters.isPremium;
        return UnifiedContent.findAll({
            where,
            order: [['updatedAt', 'DESC']],
        });
    }
    /**
     * Get popular content
     */
    static async getPopular(limit = 10, type) {
        const where = { status: 'published' };
        if (type)
            where.type = type;
        return UnifiedContent.findAll({
            where,
            order: [
                ['viewCount', 'DESC'],
                ['likeCount', 'DESC'],
                ['avgRating', 'DESC NULLS LAST'],
            ],
            limit,
        });
    }
    /**
     * Get scheduled content ready for publishing
     */
    static async getScheduledForPublishing() {
        return UnifiedContent.findAll({
            where: {
                status: 'scheduled',
                scheduledAt: {
                    [sequelize_1.Op.lte]: new Date(),
                },
            },
        });
    }
    /**
     * Get expired content
     */
    static async getExpired() {
        return UnifiedContent.findAll({
            where: {
                status: 'published',
                expiresAt: {
                    [sequelize_1.Op.lte]: new Date(),
                },
            },
        });
    }
    /**
     * Initialize the model
     */
    static initialize(sequelize) {
        UnifiedContent.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('article', 'guide', 'exercise', 'lesson', 'tip', 'course', 'template', 'page', 'faq', 'announcement'),
                allowNull: false,
            },
            format: {
                type: sequelize_1.DataTypes.ENUM('markdown', 'html', 'rich-text', 'video', 'audio', 'interactive'),
                allowNull: false,
                defaultValue: 'markdown',
            },
            title: {
                type: sequelize_1.DataTypes.STRING(200),
                allowNull: false,
                validate: {
                    len: [3, 200],
                },
            },
            slug: {
                type: sequelize_1.DataTypes.STRING(250),
                allowNull: false,
                unique: true,
                validate: {
                    is: /^[a-z0-9-]+$/,
                },
            },
            content: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            excerpt: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('draft', 'published', 'scheduled', 'archived', 'review', 'expired'),
                allowNull: false,
                defaultValue: 'draft',
            },
            authorId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            categoryId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'content_categories',
                    key: 'id',
                },
            },
            parentId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'unified_contents',
                    key: 'id',
                },
            },
            order: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            featuredImageUrl: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            thumbnailUrl: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            videoUrl: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            audioUrl: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            attachments: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
            },
            metaTitle: {
                type: sequelize_1.DataTypes.STRING(60),
                allowNull: true,
            },
            metaDescription: {
                type: sequelize_1.DataTypes.STRING(160),
                allowNull: true,
            },
            metaKeywords: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: true,
                defaultValue: [],
            },
            canonicalUrl: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            publishedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            scheduledAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            expiresAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
            viewCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            likeCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            shareCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            commentCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            readingTime: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            completionRate: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: true,
                validate: {
                    min: 0,
                    max: 100,
                },
            },
            avgRating: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: true,
                validate: {
                    min: 0,
                    max: 5,
                },
            },
            ratingCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            isPremium: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            isPrivate: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            requiredRoles: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: true,
                defaultValue: [],
            },
            requiredTags: {
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: true,
                defaultValue: [],
            },
            courseData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            templateData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            faqData: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
            },
            settings: {
                type: sequelize_1.DataTypes.JSONB,
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
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            versionHistory: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
            },
        }, {
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
                beforeCreate: async (content) => {
                    if (!content.slug) {
                        content.slug = await content.generateSlug();
                    }
                    if (content.content) {
                        content.readingTime = content.calculateReadingTime();
                    }
                },
                beforeUpdate: async (content) => {
                    if (content.changed('title') && !content.changed('slug')) {
                        content.slug = await content.generateSlug();
                    }
                    if (content.changed('content')) {
                        content.readingTime = content.calculateReadingTime();
                    }
                },
            },
        });
    }
    /**
     * Set up associations
     */
    static associate() {
        // Author association
        UnifiedContent.belongsTo(User_1.User, {
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
exports.UnifiedContent = UnifiedContent;
exports.default = UnifiedContent;
//# sourceMappingURL=UnifiedContent.js.map