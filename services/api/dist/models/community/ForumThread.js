"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumThread = void 0;
const sequelize_1 = require("sequelize");
class ForumThread extends sequelize_1.Model {
    id;
    categoryId;
    userId;
    title;
    content;
    tags;
    views;
    replyCount;
    lastReplyAt;
    isPinned;
    isLocked;
    isFeatured;
    // Associations
    category;
    user;
    posts;
    static associate(models) {
        ForumThread.belongsTo(models.ForumCategory, {
            foreignKey: 'categoryId',
            as: 'category',
        });
        ForumThread.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
        });
        ForumThread.hasMany(models.ForumPost, {
            foreignKey: 'threadId',
            as: 'posts',
        });
    }
    // Instance methods
    async incrementViews() {
        this.views += 1;
        await this.save();
    }
}
exports.ForumThread = ForumThread;
exports.default = (sequelize) => {
    ForumThread.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        categoryId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            field: 'category_id',
            references: {
                model: 'forum_categories',
                key: 'id',
            },
        },
        userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id',
            },
        },
        title: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: false,
        },
        content: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        tags: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
            defaultValue: [],
        },
        views: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 0,
        },
        replyCount: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 0,
            field: 'reply_count',
        },
        lastReplyAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            field: 'last_reply_at',
        },
        isPinned: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_pinned',
        },
        isLocked: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_locked',
        },
        isFeatured: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_featured',
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            field: 'updated_at',
        },
    }, {
        sequelize,
        modelName: 'ForumThread',
        tableName: 'forum_threads',
        timestamps: true,
        underscored: true,
    });
    return ForumThread;
};
//# sourceMappingURL=ForumThread.js.map