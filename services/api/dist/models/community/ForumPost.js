"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumPost = void 0;
const sequelize_1 = require("sequelize");
class ForumPost extends sequelize_1.Model {
    id;
    threadId;
    userId;
    parentId;
    content;
    isSolution;
    isDeleted;
    deletedAt;
    deletedBy;
    editCount;
    lastEditedAt;
    // Virtual properties
    voteScore;
    userVote;
    // Associations
    thread;
    user;
    parent;
    replies;
    votes;
    static associate(models) {
        ForumPost.belongsTo(models.ForumThread, {
            foreignKey: 'threadId',
            as: 'thread',
        });
        ForumPost.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
        });
        ForumPost.belongsTo(models.ForumPost, {
            foreignKey: 'parentId',
            as: 'parent',
        });
        ForumPost.hasMany(models.ForumPost, {
            foreignKey: 'parentId',
            as: 'replies',
        });
        ForumPost.hasMany(models.ForumVote, {
            foreignKey: 'postId',
            as: 'votes',
        });
    }
}
exports.ForumPost = ForumPost;
exports.default = (sequelize) => {
    ForumPost.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        threadId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            field: 'thread_id',
            references: {
                model: 'forum_threads',
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
        parentId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            field: 'parent_id',
            references: {
                model: 'forum_posts',
                key: 'id',
            },
        },
        content: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        isSolution: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_solution',
        },
        isDeleted: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_deleted',
        },
        deletedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            field: 'deleted_at',
        },
        deletedBy: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            field: 'deleted_by',
            references: {
                model: 'users',
                key: 'id',
            },
        },
        editCount: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 0,
            field: 'edit_count',
        },
        lastEditedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
            field: 'last_edited_at',
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
        modelName: 'ForumPost',
        tableName: 'forum_posts',
        timestamps: true,
        underscored: true,
    });
    return ForumPost;
};
//# sourceMappingURL=ForumPost.js.map