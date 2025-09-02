"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../../config/sequelize");
// Course model class
class Course extends sequelize_1.Model {
    id;
    title;
    slug;
    description;
    longDescription;
    categoryId;
    instructorId;
    difficulty;
    duration;
    price;
    currency;
    status;
    publishedAt;
    thumbnailImage;
    previewVideo;
    objectives;
    prerequisites;
    targetAudience;
    tags;
    seoTitle;
    seoDescription;
    metadata;
    enrollment;
    settings;
    pricing;
    analytics;
    deletedAt;
    // Instance methods
    async generateSlug() {
        const baseSlug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        let slug = baseSlug;
        let counter = 1;
        while (await Course.findOne({ where: { slug, id: { [sequelize_1.Op.ne]: this.id } } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        return slug;
    }
    async updateMetadata() {
        // Would typically fetch lessons and calculate these values
        // For now, using mock calculations
        const lessons = []; // await this.getLessons();
        this.metadata = {
            ...this.metadata,
            lessonsCount: lessons.length,
            totalDuration: lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
            lastContentUpdate: new Date(),
        };
        await this.save();
    }
    async enroll(studentId) {
        if (this.enrollment.maxStudents &&
            this.enrollment.currentEnrolled >= this.enrollment.maxStudents) {
            return false; // Course is full
        }
        this.enrollment.currentEnrolled += 1;
        this.analytics.totalEnrollments += 1;
        await this.save();
        return true;
    }
    async unenroll(studentId) {
        this.enrollment.currentEnrolled = Math.max(0, this.enrollment.currentEnrolled - 1);
        await this.save();
    }
    async updateAnalytics(analytics) {
        this.analytics = { ...this.analytics, ...analytics };
        await this.save();
    }
    async publish() {
        this.status = 'published';
        this.publishedAt = new Date();
        await this.save();
    }
    async archive() {
        this.status = 'archived';
        await this.save();
    }
    calculateCompletionRate() {
        if (this.analytics.totalEnrollments === 0)
            return 0;
        return (((this.analytics.totalEnrollments -
            this.analytics.dropoffRate * this.analytics.totalEnrollments) /
            this.analytics.totalEnrollments) *
            100);
    }
    // Static methods
    static async getPublished() {
        return Course.findAll({
            where: { status: 'published' },
            order: [['publishedAt', 'DESC']],
        });
    }
    static async getByDifficulty(difficulty) {
        return Course.findAll({
            where: {
                difficulty,
                status: 'published',
            },
            order: [['publishedAt', 'DESC']],
        });
    }
    static async getPopular(limit = 10) {
        return Course.findAll({
            where: { status: 'published' },
            order: [
                ['analytics.totalEnrollments', 'DESC'],
                ['analytics.averageRating', 'DESC'],
            ],
            limit,
        });
    }
    static async getFeatured() {
        return Course.findAll({
            where: {
                status: 'published',
                'analytics.averageRating': { [sequelize_1.Op.gte]: 4.0 },
            },
            order: [['analytics.averageRating', 'DESC']],
            limit: 10,
        });
    }
    static async getByCategory(categoryId) {
        return Course.findAll({
            where: {
                categoryId,
                status: 'published',
            },
            order: [['publishedAt', 'DESC']],
        });
    }
    static async getByInstructor(instructorId) {
        return Course.findAll({
            where: { instructorId },
            order: [['updatedAt', 'DESC']],
        });
    }
    static async searchCourses(query, filters = {}) {
        const whereClause = { status: 'published' };
        if (query) {
            whereClause[sequelize_1.Op.or] = [
                { title: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { description: { [sequelize_1.Op.iLike]: `%${query}%` } },
                { tags: { [sequelize_1.Op.contains]: [query] } },
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
                [sequelize_1.Op.between]: [filters.priceRange.min, filters.priceRange.max],
            };
        }
        if (filters.rating) {
            whereClause['analytics.averageRating'] = {
                [sequelize_1.Op.gte]: filters.rating,
            };
        }
        return Course.findAll({
            where: whereClause,
            order: [
                ['analytics.averageRating', 'DESC'],
                ['publishedAt', 'DESC'],
            ],
        });
    }
    static async getRecommendations(userId, limit = 5) {
        // Basic recommendation logic - in production would use ML algorithms
        return Course.findAll({
            where: {
                status: 'published',
                'analytics.averageRating': { [sequelize_1.Op.gte]: 4.0 },
            },
            order: [
                ['analytics.totalEnrollments', 'DESC'],
                ['analytics.averageRating', 'DESC'],
            ],
            limit,
        });
    }
}
exports.Course = Course;
// Initialize the model
Course.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [5, 200],
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
        allowNull: false,
        validate: {
            len: [20, 1000],
        },
    },
    longDescription: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 5000],
        },
    },
    categoryId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id',
        },
    },
    instructorId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    difficulty: {
        type: sequelize_1.DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false,
    },
    duration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    currency: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
    },
    publishedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    thumbnailImage: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true,
        },
    },
    previewVideo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true,
        },
    },
    objectives: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
        allowNull: false,
        defaultValue: [],
    },
    prerequisites: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
        allowNull: false,
        defaultValue: [],
    },
    targetAudience: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
        allowNull: false,
        defaultValue: [],
    },
    tags: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
    },
    seoTitle: {
        type: sequelize_1.DataTypes.STRING(60),
        allowNull: true,
    },
    seoDescription: {
        type: sequelize_1.DataTypes.STRING(160),
        allowNull: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
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
        type: sequelize_1.DataTypes.JSONB,
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
        type: sequelize_1.DataTypes.JSONB,
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
        type: sequelize_1.DataTypes.JSONB,
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
        type: sequelize_1.DataTypes.JSONB,
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
        beforeCreate: async (course) => {
            if (!course.slug) {
                course.slug = await course.generateSlug();
            }
        },
        beforeUpdate: async (course) => {
            if (course.changed('title') && !course.changed('slug')) {
                course.slug = await course.generateSlug();
            }
            if (course.changed('description') || course.changed('objectives')) {
                course.metadata.version += 1;
                course.metadata.lastContentUpdate = new Date();
            }
        },
    },
});
exports.default = Course;
//# sourceMappingURL=Course.js.map