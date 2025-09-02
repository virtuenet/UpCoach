"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentCategory = void 0;
const sequelize_1 = require("sequelize");
const Content_1 = require("./Content");
class ContentCategory extends sequelize_1.Model {
    id;
    name;
    slug;
    description;
    parentId;
    icon;
    color;
    order;
    isActive;
    metadata;
    // Associations
    contents;
    parent;
    children;
    static associations;
    static initialize(sequelize) {
        ContentCategory.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            slug: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            description: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
            },
            parentId: {
                type: sequelize_1.DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'content_categories',
                    key: 'id',
                },
            },
            icon: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            color: {
                type: sequelize_1.DataTypes.STRING,
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
            },
        }, {
            sequelize,
            modelName: 'ContentCategory',
            tableName: 'content_categories',
            timestamps: true,
            indexes: [
                { fields: ['slug'], unique: true },
                { fields: ['parentId'] },
                { fields: ['isActive'] },
            ],
        });
    }
    static associate() {
        ContentCategory.hasMany(Content_1.Content, {
            foreignKey: 'categoryId',
            as: 'contents',
        });
        ContentCategory.belongsTo(ContentCategory, {
            foreignKey: 'parentId',
            as: 'parent',
        });
        ContentCategory.hasMany(ContentCategory, {
            foreignKey: 'parentId',
            as: 'children',
        });
    }
}
exports.ContentCategory = ContentCategory;
//# sourceMappingURL=ContentCategory.js.map