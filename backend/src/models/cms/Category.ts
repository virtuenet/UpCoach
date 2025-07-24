import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../index';

// Category interface
export interface CategoryAttributes {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  level: number;
  path: string;
  iconUrl: string | null;
  colorCode: string | null;
  isActive: boolean;
  sortOrder: number;
  metadata: {
    articlesCount: number;
    coursesCount: number;
    totalViews: number;
    isPopular: boolean;
    isFeatured: boolean;
  };
  seo: {
    title: string | null;
    description: string | null;
    keywords: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Optional fields for creation
export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 
  'id' | 'slug' | 'description' | 'parentId' | 'level' | 'path' | 'iconUrl' | 
  'colorCode' | 'isActive' | 'sortOrder' | 'metadata' | 'seo' | 'createdAt' | 'updatedAt' | 'deletedAt'
> {}

// Category model class
export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description!: string | null;
  public parentId!: string | null;
  public level!: number;
  public path!: string;
  public iconUrl!: string | null;
  public colorCode!: string | null;
  public isActive!: boolean;
  public sortOrder!: number;
  public metadata!: CategoryAttributes['metadata'];
  public seo!: CategoryAttributes['seo'];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  // Instance methods
  public async generateSlug(): Promise<string> {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;
    
    while (await Category.findOne({ where: { slug, id: { [Op.ne]: this.id } } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  public async generatePath(): Promise<string> {
    if (!this.parentId) {
      return this.slug;
    }

    const parent = await Category.findByPk(this.parentId);
    if (!parent) {
      return this.slug;
    }

    return `${parent.path}/${this.slug}`;
  }

  public async updateMetadata(): Promise<void> {
    // In production, these would be calculated from actual data
    this.metadata = {
      ...this.metadata,
      articlesCount: 0, // await Article.count({ where: { categoryId: this.id } }),
      coursesCount: 0,  // await Course.count({ where: { categoryId: this.id } }),
      totalViews: 0,    // calculated from articles and courses
      isPopular: this.metadata.totalViews > 1000,
      isFeatured: this.metadata.articlesCount > 5 || this.metadata.coursesCount > 2,
    };
    
    await this.save();
  }

  public async getChildren(): Promise<Category[]> {
    return Category.findAll({
      where: { parentId: this.id, isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
  }

  public async getParent(): Promise<Category | null> {
    if (!this.parentId) return null;
    return Category.findByPk(this.parentId);
  }

  public async getAllDescendants(): Promise<Category[]> {
    const children = await this.getChildren();
    let descendants = [...children];

    for (const child of children) {
      const childDescendants = await child.getAllDescendants();
      descendants = [...descendants, ...childDescendants];
    }

    return descendants;
  }

  public async getAncestors(): Promise<Category[]> {
    const ancestors: Category[] = [];
    let current = await this.getParent();

    while (current) {
      ancestors.unshift(current);
      current = await current.getParent();
    }

    return ancestors;
  }

  public async getBreadcrumb(): Promise<{ id: string; name: string; slug: string }[]> {
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
  static async getRootCategories(): Promise<Category[]> {
    return Category.findAll({
      where: { 
        parentId: null,
        isActive: true 
      },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
  }

  static async getTreeStructure(): Promise<any[]> {
    const roots = await Category.getRootCategories();
    
    const buildTree = async (categories: Category[]): Promise<any[]> => {
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

  static async getPopular(limit: number = 10): Promise<Category[]> {
    return Category.findAll({
      where: { 
        isActive: true,
        'metadata.isPopular': true 
      },
      order: [['metadata.totalViews', 'DESC']],
      limit,
    });
  }

  static async getFeatured(): Promise<Category[]> {
    return Category.findAll({
      where: { 
        isActive: true,
        'metadata.isFeatured': true 
      },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
  }

  static async searchCategories(query: string): Promise<Category[]> {
    return Category.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
        ],
      },
      order: [['name', 'ASC']],
    });
  }

  static async findBySlug(slug: string): Promise<Category | null> {
    return Category.findOne({
      where: { slug, isActive: true },
    });
  }

  static async getByLevel(level: number): Promise<Category[]> {
    return Category.findAll({
      where: { 
        level,
        isActive: true 
      },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });
  }

  static async reorderCategories(categoryIds: string[]): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      for (let i = 0; i < categoryIds.length; i++) {
        await Category.update(
          { sortOrder: i + 1 },
          { 
            where: { id: categoryIds[i] },
            transaction 
          }
        );
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

// Initialize the model
Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500],
      },
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5, // Maximum 5 levels deep
      },
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    iconUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    colorCode: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    metadata: {
      type: DataTypes.JSONB,
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
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        title: null,
        description: null,
        keywords: [],
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
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
      beforeCreate: async (category: Category) => {
        if (!category.slug) {
          category.slug = await category.generateSlug();
        }
        
        // Set level based on parent
        if (category.parentId) {
          const parent = await Category.findByPk(category.parentId);
          category.level = parent ? parent.level + 1 : 0;
        } else {
          category.level = 0;
        }
        
        category.path = await category.generatePath();
      },
      beforeUpdate: async (category: Category) => {
        if (category.changed('name') && !category.changed('slug')) {
          category.slug = await category.generateSlug();
        }
        
        if (category.changed('parentId') || category.changed('slug')) {
          category.path = await category.generatePath();
          
          if (category.changed('parentId')) {
            if (category.parentId) {
              const parent = await Category.findByPk(category.parentId);
              category.level = parent ? parent.level + 1 : 0;
            } else {
              category.level = 0;
            }
          }
        }
      },
      afterCreate: async (category: Category) => {
        // Update parent metadata if this is a child category
        if (category.parentId) {
          const parent = await Category.findByPk(category.parentId);
          if (parent) {
            await parent.updateMetadata();
          }
        }
      },
      afterDestroy: async (category: Category) => {
        // Update parent metadata when category is deleted
        if (category.parentId) {
          const parent = await Category.findByPk(category.parentId);
          if (parent) {
            await parent.updateMetadata();
          }
        }
      },
    },
  }
);

export default Category; 