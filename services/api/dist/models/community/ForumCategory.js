"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumCategory = void 0;
const sequelize_1 = require("sequelize");
class ForumCategory extends sequelize_1.Model {
    id;
    name;
    description;
    slug;
    icon;
    color;
    orderIndex;
    isActive;
    // Associations
    threads;
    static associate(models) {
        ForumCategory.hasMany(models.ForumThread, {
            foreignKey: 'categoryId',
            as: 'threads',
        });
    }
}
exports.ForumCategory = ForumCategory;
exports.default = (sequelize) => {
    ForumCategory.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        slug: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        icon: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
        },
        color: {
            type: sequelize_1.DataTypes.STRING(7),
            allowNull: true,
        },
        orderIndex: {
            type: sequelize_1.DataTypes.INTEGER,
            defaultValue: 0,
            field: 'order_index',
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active',
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
        modelName: 'ForumCategory',
        tableName: 'forum_categories',
        timestamps: true,
        underscored: true,
    });
    return ForumCategory;
};
//# sourceMappingURL=ForumCategory.js.map