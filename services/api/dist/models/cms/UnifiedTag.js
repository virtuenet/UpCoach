"use strict";
/**
 * Unified Tag Model
 * Consolidates ContentTag and other tag models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedTag = void 0;
const sequelize_1 = require("sequelize");
class UnifiedTag extends sequelize_1.Model {
    id;
    name;
    slug;
    type;
    color;
    icon;
    description;
    usageCount;
    isActive;
    metadata;
    static initialize(sequelize) {
        UnifiedTag.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
            },
            slug: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                unique: true,
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('content', 'skill', 'topic', 'general'),
                allowNull: false,
                defaultValue: 'general',
            },
            color: {
                type: sequelize_1.DataTypes.STRING(7),
                allowNull: true,
            },
            icon: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            usageCount: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            isActive: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            metadata: {
                type: sequelize_1.DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
            },
        }, {
            sequelize,
            modelName: 'UnifiedTag',
            tableName: 'unified_tags',
            timestamps: true,
            indexes: [
                { fields: ['slug'], unique: true },
                { fields: ['type'] },
                { fields: ['usageCount'] },
                { fields: ['isActive'] },
            ],
        });
    }
}
exports.UnifiedTag = UnifiedTag;
exports.default = UnifiedTag;
//# sourceMappingURL=UnifiedTag.js.map