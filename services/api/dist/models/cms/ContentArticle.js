"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentArticle = void 0;
const tslib_1 = require("tslib");
const sequelize_1 = require("sequelize");
const slugify_1 = tslib_1.__importDefault(require("slugify"));
const database_1 = require("../../config/database");
const ContentVersion_1 = tslib_1.__importDefault(require("./ContentVersion"));
class ContentArticle extends sequelize_1.Model {
    slug;
    title;
    summary;
    content;
    authorId;
    categoryId;
    featuredImage;
    tags;
    status;
    visibility;
    publishDate;
    readTime;
    viewCount;
    likeCount;
    commentCount;
    shareCount;
    seoTitle;
    seoDescription;
    seoKeywords;
    allowComments;
    isPinned;
    lastModifiedBy;
    metadata;
    author;
    category;
    versions;
    comments;
    interactions;
    getAuthor;
    async createVersion(userId, changeSummary) {
        const versionCount = await ContentVersion_1.default.count({
            where: { contentId: this.id },
        });
        return ContentVersion_1.default.create({
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
    canEdit(userId, userRole) {
        return this.authorId === userId || userRole === 'admin' || userRole === 'editor';
    }
    async calculateReadTime() {
        const content = typeof this.content === 'string' ? this.content : this.content.body;
        const words = content.split(/\s+/).length;
        const readTime = Math.ceil(words / 200);
        return readTime;
    }
    isPublished() {
        return this.status === 'published' && (!this.publishDate || this.publishDate <= new Date());
    }
    async incrementViewCount() {
        this.viewCount += 1;
        await this.save();
    }
    canPublish(userRole) {
        return userRole === 'admin' || userRole === 'editor';
    }
    async publish() {
        this.status = 'published';
        this.publishDate = new Date();
        await this.save();
    }
    async unpublish() {
        this.status = 'draft';
        await this.save();
    }
    static associate(models) {
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
exports.ContentArticle = ContentArticle;
ContentArticle.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    slug: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    summary: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    content: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        get() {
            const value = this.getDataValue('content');
            return typeof value === 'string' ? JSON.parse(value) : value;
        },
        set(value) {
            this.setDataValue('content', typeof value === 'string' ? value : JSON.stringify(value));
        },
    },
    authorId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    categoryId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'content_categories',
            key: 'id',
        },
    },
    featuredImage: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('draft', 'review', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
    },
    visibility: {
        type: sequelize_1.DataTypes.ENUM('public', 'members', 'premium'),
        allowNull: false,
        defaultValue: 'public',
    },
    publishDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    readTime: {
        type: sequelize_1.DataTypes.INTEGER,
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
    commentCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    shareCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    seoTitle: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    seoDescription: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    seoKeywords: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: true,
    },
    allowComments: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    isPinned: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    lastModifiedBy: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ContentArticle',
    tableName: 'content_articles',
    timestamps: true,
    hooks: {
        beforeCreate: async (article) => {
            if (!article.slug) {
                article.slug = (0, slugify_1.default)(article.title, { lower: true, strict: true });
            }
            article.readTime = await article.calculateReadTime();
            if (!article.seoTitle) {
                article.seoTitle = article.title;
            }
            if (!article.seoDescription) {
                article.seoDescription = article.summary || article.title;
            }
        },
        beforeUpdate: async (article) => {
            if (article.changed('content')) {
                article.readTime = await article.calculateReadTime();
            }
            if (article.changed('title') && !article.changed('slug')) {
                article.slug = (0, slugify_1.default)(article.title, { lower: true, strict: true });
            }
        },
    },
    defaultScope: {
        attributes: {
            exclude: ['content'],
        },
    },
    scopes: {
        published: {
            where: {
                status: 'published',
                publishDate: {
                    [sequelize_1.Op.lte]: new Date(),
                },
            },
        },
        withContent: {
            attributes: {
                include: ['content'],
            },
        },
        byAuthor: (authorId) => ({
            where: { authorId },
        }),
        byCategory: (categoryId) => ({
            where: { categoryId },
        }),
        withStats: {
            attributes: {
                include: [
                    [
                        database_1.sequelize.literal('(SELECT COUNT(*) FROM content_interactions WHERE content_id = "ContentArticle"."id" AND interaction_type = \'view\')'),
                        'actualViewCount',
                    ],
                    [
                        database_1.sequelize.literal('(SELECT COUNT(*) FROM content_interactions WHERE content_id = "ContentArticle"."id" AND interaction_type = \'like\')'),
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
});
exports.default = ContentArticle;
