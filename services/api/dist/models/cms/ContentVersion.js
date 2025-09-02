"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class ContentVersion extends sequelize_1.Model {
    contentId;
    version;
    title;
    content;
    excerpt;
    featuredImage;
    metadata;
    changes;
    createdBy;
}
ContentVersion.init({
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
    version: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    excerpt: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    featuredImage: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
    },
    changes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ContentVersion',
    tableName: 'content_versions',
    timestamps: true,
    indexes: [
        {
            fields: ['contentId', 'version'],
            unique: true,
        },
    ],
});
exports.default = ContentVersion;
//# sourceMappingURL=ContentVersion.js.map