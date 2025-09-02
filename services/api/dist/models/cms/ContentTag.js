"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentTag = void 0;
const sequelize_1 = require("sequelize");
const Content_1 = require("./Content");
class ContentTag extends sequelize_1.Model {
    id;
    name;
    slug;
    description;
    color;
    isActive;
    usageCount;
    // Associations
    contents;
    static associations;
    static initialize(sequelize) {
        ContentTag.init({
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
            color: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
                defaultValue: '#6B7280',
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
        }, {
            sequelize,
            modelName: 'ContentTag',
            tableName: 'content_tags',
            timestamps: true,
            indexes: [
                { fields: ['slug'], unique: true },
                { fields: ['isActive'] },
                { fields: ['usageCount'] },
            ],
        });
    }
    static associate() {
        ContentTag.belongsToMany(Content_1.Content, {
            through: 'content_tag_relations',
            foreignKey: 'tagId',
            otherKey: 'contentId',
            as: 'contents',
        });
    }
}
exports.ContentTag = ContentTag;
//# sourceMappingURL=ContentTag.js.map