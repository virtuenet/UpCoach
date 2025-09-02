"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class ContentInteraction extends sequelize_1.Model {
    contentId;
    userId;
    interactionType;
    metadata;
}
ContentInteraction.init({
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
    interactionType: {
        type: sequelize_1.DataTypes.ENUM('view', 'like', 'share', 'save', 'comment'),
        allowNull: false,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
    },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ContentInteraction',
    tableName: 'content_interactions',
    timestamps: true,
    indexes: [
        {
            fields: ['contentId', 'userId', 'interactionType'],
            unique: true,
        },
        {
            fields: ['userId'],
        },
    ],
});
exports.default = ContentInteraction;
//# sourceMappingURL=ContentInteraction.js.map