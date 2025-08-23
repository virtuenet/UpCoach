import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../index';

// Course interface
export interface CourseAttributes {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string | null;
  categoryId: string;
  instructorId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  price: number;
  currency: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Date | null;
  thumbnailImage: string | null;
  previewVideo: string | null;
  objectives: string[];
  prerequisites: string[];
  targetAudience: string[];
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  metadata: {
    lessonsCount: number;
    totalDuration: number;
    estimatedCompletionTime: number;
    lastContentUpdate: Date;
    version: number;
    language: string;
    level: string;
    certification: boolean;
  };
  enrollment: {
    maxStudents: number | null;
    currentEnrolled: number;
    waitlistCount: number;
    enrollmentStartDate: Date | null;
    enrollmentEndDate: Date | null;
    autoEnrollment: boolean;
  };
  settings: {
    allowComments: boolean;
    enableDiscussions: boolean;
    requireCompletion: boolean;
    certificateEnabled: boolean;
    drippedContent: boolean;
    allowDownloads: boolean;
  };
  pricing: {
    type: 'free' | 'paid' | 'subscription';
    amount: number;
    currency: string;
    discountPercentage: number | null;
    discountValidUntil: Date | null;
    installmentPlan: boolean;
  };
  analytics: {
    totalEnrollments: number;
    activeStudents: number;
    completionRate: number;
    averageRating: number;
    totalRatings: number;
    dropoffRate: number;
    engagementScore: number;
    revenueGenerated: number;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Optional fields for creation
export interface CourseCreationAttributes extends Optional<CourseAttributes, 
  'id' | 'slug' | 'longDescription' | 'duration' | 'price' | 'currency' | 'publishedAt' | 
  'thumbnailImage' | 'previewVideo' | 'objectives' | 'prerequisites' | 'targetAudience' | 
  'tags' | 'seoTitle' | 'seoDescription' | 'metadata' | 'enrollment' | 'settings' | 'pricing' | 
  'analytics' | 'createdAt' | 'updatedAt' | 'deletedAt'
> {}

// Course model class
export class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public id!: string;
  public title!: string;
  public slug!: string;
  public description!: string;
  public longDescription!: string | null;
  public categoryId!: string;
  public instructorId!: string;
  public difficulty!: 'beginner' | 'intermediate' | 'advanced';
  public duration!: number;
  public price!: number;
  public currency!: string;
  public status!: 'draft' | 'published' | 'archived';
  public publishedAt!: Date | null;
  public thumbnailImage!: string | null;
  public previewVideo!: string | null;
  public objectives!: string[];
  public prerequisites!: string[];
  public targetAudience!: string[];
  public tags!: string[];
  public seoTitle!: string | null;
  public seoDescription!: string | null;
  public metadata!: CourseAttributes['metadata'];
  public enrollment!: CourseAttributes['enrollment'];
  public settings!: CourseAttributes['settings'];
  public pricing!: CourseAttributes['pricing'];
  public analytics!: CourseAttributes['analytics'];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  public readonly deletedAt!: Date | null;

  // Instance methods
  public async generateSlug(): Promise<string> {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;
    
    while (await Course.findOne({ where: { slug, id: { [Op.ne as any]: this.id } } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  public async updateMetadata(): Promise<void> {
    // Would typically fetch lessons and calculate these values
    // For now, using mock calculations
    const lessons: { duration?: number }[] = []; // await this.getLessons();
    
    this.metadata = {
      ...this.metadata,
      lessonsCount: lessons.length,
      totalDuration: lessons.reduce((sum: number, lesson) => sum + (lesson.duration || 0), 0),
      lastContentUpdate: new Date(),
    };
    
    await this.save();
  }

  public async enroll(studentId: string): Promise<boolean> {
    if (this.enrollment.maxStudents && this.enrollment.currentEnrolled >= this.enrollment.maxStudents) {
      return false; // Course is full
    }

    this.enrollment.currentEnrolled += 1;
    this.analytics.totalEnrollments += 1;
    await this.save();
    
    return true;
  }

  public async unenroll(studentId: string): Promise<void> {
    this.enrollment.currentEnrolled = Math.max(0, this.enrollment.currentEnrolled - 1);
    await this.save();
  }

  public async updateAnalytics(analytics: Partial<CourseAttributes['analytics']>): Promise<void> {
    this.analytics = { ...this.analytics, ...analytics };
    await this.save();
  }

  public async publish(): Promise<void> {
    this.status = 'published';
    this.publishedAt = new Date();
    await this.save();
  }

  public async archive(): Promise<void> {
    this.status = 'archived';
    await this.save();
  }

  public calculateCompletionRate(): number {
    if (this.analytics.totalEnrollments === 0) return 0;
    return (this.analytics.totalEnrollments - (this.analytics.dropoffRate * this.analytics.totalEnrollments)) / this.analytics.totalEnrollments * 100;
  }

  // Static methods
  static async getPublished(): Promise<Course[]> {
    return Course.findAll({
      where: { status: 'published' },
      order: [['publishedAt', 'DESC']],
    });
  }

  static async getByDifficulty(difficulty: string): Promise<Course[]> {
    return Course.findAll({
      where: { 
        difficulty,
        status: 'published' 
      },
      order: [['publishedAt', 'DESC']],
    });
  }

  static async getPopular(limit: number = 10): Promise<Course[]> {
    return Course.findAll({
      where: { status: 'published' },
      order: [
        ['analytics.totalEnrollments', 'DESC'],
        ['analytics.averageRating', 'DESC']
      ],
      limit,
    });
  }

  static async getFeatured(): Promise<Course[]> {
    return Course.findAll({
      where: { 
        status: 'published',
        'analytics.averageRating': { [Op.gte]: 4.0 }
      },
      order: [['analytics.averageRating', 'DESC']],
      limit: 10,
    });
  }

  static async getByCategory(categoryId: string): Promise<Course[]> {
    return Course.findAll({
      where: { 
        categoryId,
        status: 'published' 
      },
      order: [['publishedAt', 'DESC']],
    });
  }

  static async getByInstructor(instructorId: string): Promise<Course[]> {
    return Course.findAll({
      where: { instructorId },
      order: [['updatedAt', 'DESC']],
    });
  }

  static async searchCourses(query: string, filters: {
    category?: string;
    difficulty?: string;
    priceRange?: { min: number; max: number };
    rating?: number;
  } = {}): Promise<Course[]> {
    const whereClause: any = { status: 'published' };

    if (query) {
      whereClause[Op.or as any] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        { tags: { [Op.contains]: [query] } },
      ];
    }

    if (filters.category) {
      whereClause.categoryId = filters.category;
    }

    if (filters.difficulty) {
      whereClause.difficulty = filters.difficulty;
    }

    if (filters.priceRange) {
      whereClause.price = {
        [Op.between]: [filters.priceRange.min, filters.priceRange.max]
      };
    }

    if (filters.rating) {
      whereClause['analytics.averageRating'] = {
        [Op.gte]: filters.rating
      };
    }

    return Course.findAll({
      where: whereClause,
      order: [['analytics.averageRating', 'DESC'], ['publishedAt', 'DESC']],
    });
  }

  static async getRecommendations(userId: string, limit: number = 5): Promise<Course[]> {
    // Basic recommendation logic - in production would use ML algorithms
    return Course.findAll({
      where: { 
        status: 'published',
        'analytics.averageRating': { [Op.gte]: 4.0 }
      },
      order: [
        ['analytics.totalEnrollments', 'DESC'],
        ['analytics.averageRating', 'DESC']
      ],
      limit,
    });
  }
}

// Initialize the model
Course.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 200],
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
      allowNull: false,
      validate: {
        len: [20, 1000],
      },
    },
    longDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 5000],
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    instructorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    thumbnailImage: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    previewVideo: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    objectives: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    prerequisites: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    targetAudience: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    seoTitle: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    seoDescription: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        lessonsCount: 0,
        totalDuration: 0,
        estimatedCompletionTime: 0,
        lastContentUpdate: new Date(),
        version: 1,
        language: 'en',
        level: 'beginner',
        certification: false,
      },
    },
    enrollment: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        maxStudents: null,
        currentEnrolled: 0,
        waitlistCount: 0,
        enrollmentStartDate: null,
        enrollmentEndDate: null,
        autoEnrollment: false,
      },
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        allowComments: true,
        enableDiscussions: true,
        requireCompletion: false,
        certificateEnabled: false,
        drippedContent: false,
        allowDownloads: false,
      },
    },
    pricing: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        type: 'free',
        amount: 0,
        currency: 'USD',
        discountPercentage: null,
        discountValidUntil: null,
        installmentPlan: false,
      },
    },
    analytics: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        totalEnrollments: 0,
        activeStudents: 0,
        completionRate: 0,
        averageRating: 0,
        totalRatings: 0,
        dropoffRate: 0,
        engagementScore: 0,
        revenueGenerated: 0,
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
    modelName: 'Course',
    tableName: 'courses',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['slug'],
        unique: true,
      },
      {
        fields: ['status'],
      },
      {
        fields: ['categoryId'],
      },
      {
        fields: ['instructorId'],
      },
      {
        fields: ['difficulty'],
      },
      {
        fields: ['price'],
      },
      {
        fields: ['publishedAt'],
      },
      {
        using: 'gin',
        fields: ['tags'],
      },
      {
        using: 'gin',
        fields: ['objectives'],
      },
      {
        using: 'gin',
        fields: ['metadata'],
      },
    ],
    hooks: {
      beforeCreate: async (course: Course) => {
        if (!course.slug) {
          course.slug = await course.generateSlug();
        }
      },
      beforeUpdate: async (course: Course) => {
        if (course.changed('title') && !course.changed('slug')) {
          course.slug = await course.generateSlug();
        }
        if (course.changed('description') || course.changed('objectives')) {
          course.metadata.version += 1;
          course.metadata.lastContentUpdate = new Date();
        }
      },
    },
  }
);

export default Course; 