"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
// Category model class
class Category extends sequelize_1.Model {
    id;
    name;
    slug;
    description;
    parentId;
    level;
    path;
    iconUrl;
    colorCode;
    isActive;
    sortOrder;
    metadata;
    seo;
    deletedAt;
    // Instance methods
    async generateSlug() {
        const baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        let slug = baseSlug;
        let counter = 1;
        while (await Category.findOne({ where: { slug, id: { [sequelize_1.Op.ne]: this.id } } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }
    async generatePath() {
        if (!this.parentId) {
            return this.slug;
        }
        const parent = await Category.findByPk(this.parentId);
        if (!parent) {
            return this.slug;
        }
        return `${parent.path}/${this.slug}`;
    }
    async updateMetadata() {
        // In production, these would be calculated from actual data
        this.metadata = {
            ...this.metadata,
            articlesCount: 0, // await Article.count({ where: { categoryId: this.id } }),
            coursesCount: 0, // await Course.count({ where: { categoryId: this.id } }),
            totalViews: 0, // calculated from articles and courses
            isPopular: this.metadata.totalViews > 1000,
            isFeatured: this.metadata.articlesCount > 5 || this.metadata.coursesCount > 2,
        };
        await this.save();
    }
    async getChildren() {
        return Category.findAll({
            where: { parentId: this.id, isActive: true },
            order: [
                ['sortOrder', 'ASC'],
                ['name', 'ASC'],
            ],
        });
    }
    async getParent() {
        if (!this.parentId)
            return null;
        return Category.findByPk(this.parentId);
    }
    async getAllDescendants() {
        const children = await this.getChildren();
        let descendants = [...children];
        for (const child of children) {
            const childDescendants = await child.getAllDescendants();
            descendants = [...descendants, ...childDescendants];
        }
        return descendants;
    }
    async getAncestors() {
        const ancestors = [];
        let current = await this.getParent();
        while (current) {
            ancestors.unshift(current);
            current = await current.getParent();
        }
        return ancestors;
    }
    async getBreadcrumb() {
        const ancestors = await this.getAncestors();
        const breadcrumb = ancestors.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
        }));
        breadcrumb.push({
            id: this.id,
            name: this.name,
            slug: this.slug,
        });
        return breadcrumb;
    }
    // Static methods
    static async getRootCategories() {
        return Category.findAll({
            where: {
                parentId: null,
                isActive: true,
            },
            order: [
                ['sortOrder', 'ASC'],
                ['name', 'ASC'],
            ],
        });
    }
    static async getTreeStructure() {
        const roots = await Category.getRootCategories();
        const buildTree = async (categories) => {
            const tree = [];
            for (const category of categories) {
                const children = await category.getChildren();
                const node = {
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    path: category.path,
                    level: category.level,
                    metadata: category.metadata,
                    children: children.length > 0 ? await buildTree(children) : [],
                };
                tree.push(node);
            }
            return tree;
        };
        return buildTree(roots);
    }
    static async getPopular(limit = 10) {
        return Category.findAll({
            where: {
                isActive: true,
                'metadata.isPopular': true,
            },
            order: [['metadata.totalViews', 'DESC']],
            limit,
        });
    }
    static async getFeatured() {
        return Category.findAll({
            where: {
                isActive: true,
                'metadata.isFeatured': true,
            },
            order: [
                ['sortOrder', 'ASC'],
                ['name', 'ASC'],
            ],
        });
    }
    static async searchCategories(query) {
        return Category.findAll({
            where: {
                isActive: true,
                [sequelize_1.Op.or]: [
                    { name: { [sequelize_1.Op.iLike]: `%${query}%` } },
                    { description: { [sequelize_1.Op.iLike]: `%${query}%` } },
                ],
            },
            order: [['name', 'ASC']],
        });
    }
    static async findBySlug(slug) {
        return Category.findOne({
            where: { slug, isActive: true },
        });
    }
    static async getByLevel(level) {
        return Category.findAll({
            where: {
                level,
                isActive: true,
            },
            order: [
                ['sortOrder', 'ASC'],
                ['name', 'ASC'],
            ],
        });
    }
    static async reorderCategories(categoryIds) {
        const transaction = await sequelize_2.sequelize.transaction();
        try {
            for (let i = 0; i < categoryIds.length; i++) {
                await Category.update({ sortOrder: i + 1 }, {
                    where: { id: categoryIds[i] },
                    transaction,
                });
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}
exports.Category = Category;
// Initialize the model
Category.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 100],
        },
    },
    slug: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            is: /^[a-z0-9-]+$/,
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 500],
        },
    },
    parentId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'categories',
            key: 'id',
        },
    },
    level: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 5, // Maximum 5 levels deep
        },
    },
    path: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    iconUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true,
        },
    },
    colorCode: {
        type: sequelize_1.DataTypes.STRING(7),
        allowNull: true,
        validate: {
            is: /^#[0-9A-F]{6}$/i,
        },
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    sortOrder: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            articlesCount: 0,
            coursesCount: 0,
            totalViews: 0,
            isPopular: false,
            isFeatured: false,
        },
    },
    seo: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
            title: null,
            description: null,
            keywords: [],
        },
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            fields: ['slug'],
            unique: true,
        },
        {
            fields: ['parentId'],
        },
        {
            fields: ['level'],
        },
        {
            fields: ['path'],
        },
        {
            fields: ['isActive'],
        },
        {
            fields: ['sortOrder'],
        },
        {
            using: 'gin',
            fields: ['metadata'],
        },
    ],
    hooks: {
        beforeCreate: async (category) => {
            if (!category.slug) {
                category.slug = await category.generateSlug();
            }
            // Set level based on parent
            if (category.parentId) {
                const parent = await Category.findByPk(category.parentId);
                category.level = parent ? parent.level + 1 : 0;
            }
            else {
                category.level = 0;
            }
            category.path = await category.generatePath();
        },
        beforeUpdate: async (category) => {
            if (category.changed('name') && !category.changed('slug')) {
                category.slug = await category.generateSlug();
            }
            if (category.changed('parentId') || category.changed('slug')) {
                category.path = await category.generatePath();
                if (category.changed('parentId')) {
                    if (category.parentId) {
                        const parent = await Category.findByPk(category.parentId);
                        category.level = parent ? parent.level + 1 : 0;
                    }
                    else {
                        category.level = 0;
                    }
                }
            }
        },
        afterCreate: async (category) => {
            // Update parent metadata if this is a child category
            if (category.parentId) {
                const parent = await Category.findByPk(category.parentId);
                if (parent) {
                    await parent.updateMetadata();
                }
            }
        },
        afterDestroy: async (category) => {
            // Update parent metadata when category is deleted
            if (category.parentId) {
                const parent = await Category.findByPk(category.parentId);
                if (parent) {
                    await parent.updateMetadata();
                }
            }
        },
    },
});
exports.default = Category;
//# sourceMappingURL=Category.js.map