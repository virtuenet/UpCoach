"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Content = void 0;
const sequelize_1 = require("sequelize");
class Content extends sequelize_1.Model {
    id;
    title;
    slug;
    content;
    excerpt;
    type;
    status;
    categoryId;
    authorId;
    featuredImageUrl;
    metaTitle;
    metaDescription;
    metaKeywords;
    publishedAt;
    scheduledAt;
    readingTime;
    viewCount;
    likeCount;
    shareCount;
    isPremium;
    order;
    settings;
    author;
    category;
    tags;
    media;
    setTags;
    getTags;
    addTag;
    removeTag;
    static associations;
    static initialize(sequelize) {
        Content.init({
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
            content: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
            },
            excerpt: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('article', 'guide', 'exercise', 'lesson', 'tip'),
                allowNull: false,
                defaultValue: 'article',
            },
            status: {
                type: sequelize_1.DataTypes.ENUM('draft', 'published', 'scheduled', 'archived'),
                allowNull: false,
                defaultValue: 'draft',
            },
            categoryId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'content_categories',
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
            featuredImageUrl: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            metaTitle: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            metaDescription: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            metaKeywords: {
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
            readingTime: {
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
            shareCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            isPremium: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            order: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
            },
            settings: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: {
                    allowComments: true,
                    showAuthor: true,
                    showDate: true,
                    showReadingTime: true,
                },
            },
        }, {
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
        });
    }
    static associate(models) {
        Content.belongsTo(models.User, {
            foreignKey: 'authorId',
            as: 'author',
        });
        Content.belongsTo(models.ContentCategory, {
            foreignKey: 'categoryId',
            as: 'category',
        });
        Content.belongsToMany(models.ContentTag, {
            through: 'content_tag_relations',
            foreignKey: 'contentId',
            otherKey: 'tagId',
            as: 'tags',
        });
        Content.hasMany(models.ContentMedia, {
            foreignKey: 'contentId',
            as: 'media',
        });
    }
}
exports.Content = Content;
//# sourceMappingURL=Content.js.map