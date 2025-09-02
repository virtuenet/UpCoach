"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class ContentComment extends sequelize_1.Model {
    contentId;
    userId;
    parentId;
    comment;
    status;
    likes;
}
ContentComment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    contentId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'content_articles',
            key: 'id',
        },
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    parentId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'content_comments',
            key: 'id',
        },
    },
    comment: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
        allowNull: false,
        defaultValue: 'pending',
    },
    likes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ContentComment',
    tableName: 'content_comments',
    timestamps: true,
    indexes: [
        {
            fields: ['contentId', 'status'],
        },
        {
            fields: ['userId'],
        },
        {
            fields: ['parentId'],
        },
    ],
});
exports.default = ContentComment;
//# sourceMappingURL=ContentComment.js.map