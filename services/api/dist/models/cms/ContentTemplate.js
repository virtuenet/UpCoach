"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../config/database");
class ContentTemplate extends sequelize_1.Model {
    name;
    description;
    category;
    structure;
    thumbnail;
    isActive;
    usageCount;
    createdBy;
}
ContentTemplate.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    category: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    structure: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    thumbnail: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    usageCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    modelName: 'ContentTemplate',
    tableName: 'content_templates',
    timestamps: true,
    indexes: [
        {
            fields: ['category', 'isActive'],
        },
    ],
});
exports.default = ContentTemplate;
//# sourceMappingURL=ContentTemplate.js.map