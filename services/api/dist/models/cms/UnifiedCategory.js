"use strict";
/**
 * Unified Category Model
 * Consolidates Category, ContentCategory, and related category models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedCategory = void 0;
const sequelize_1 = require("sequelize");
class UnifiedCategory extends sequelize_1.Model {
    id;
    name;
    slug;
    description;
    type;
    parentId;
    icon;
    image;
    color;
    order;
    isActive;
    metadata;
    // Associations
    parent;
    children;
    static initialize(sequelize) {
        UnifiedCategory.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
            },
            slug: {
                type: sequelize_1.DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            type: {
                type: sequelize_1.DataTypes.ENUM('content', 'course', 'product', 'general'),
                allowNull: false,
                defaultValue: 'general',
            },
            parentId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'unified_categories',
                    key: 'id',
                },
            },
            icon: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            image: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            color: {
                type: sequelize_1.DataTypes.STRING(7),
                allowNull: true,
            },
            order: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
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
            modelName: 'UnifiedCategory',
            tableName: 'unified_categories',
            timestamps: true,
            indexes: [
                { fields: ['slug'], unique: true },
                { fields: ['type'] },
                { fields: ['parentId'] },
                { fields: ['isActive'] },
            ],
        });
    }
    static associate() {
        UnifiedCategory.belongsTo(UnifiedCategory, {
            foreignKey: 'parentId',
            as: 'parent',
        });
        UnifiedCategory.hasMany(UnifiedCategory, {
            foreignKey: 'parentId',
            as: 'children',
        });
    }
}
exports.UnifiedCategory = UnifiedCategory;
exports.default = UnifiedCategory;
//# sourceMappingURL=UnifiedCategory.js.map