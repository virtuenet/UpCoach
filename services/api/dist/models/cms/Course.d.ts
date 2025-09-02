import { Model, Optional } from 'sequelize';
export interface CourseAttributes {
    id: string;
    title: string;
    slug: string;
    description: string;
    longDescription: string | null;
    categoryId: string;
    instructorId: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
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
export interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'slug' | 'longDescription' | 'duration' | 'price' | 'currency' | 'publishedAt' | 'thumbnailImage' | 'previewVideo' | 'objectives' | 'prerequisites' | 'targetAudience' | 'tags' | 'seoTitle' | 'seoDescription' | 'metadata' | 'enrollment' | 'settings' | 'pricing' | 'analytics' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
    id: string;
    title: string;
    slug: string;
    description: string;
    longDescription: string | null;
    categoryId: string;
    instructorId: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
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
    metadata: CourseAttributes['metadata'];
    enrollment: CourseAttributes['enrollment'];
    settings: CourseAttributes['settings'];
    pricing: CourseAttributes['pricing'];
    analytics: CourseAttributes['analytics'];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
    generateSlug(): Promise<string>;
    updateMetadata(): Promise<void>;
    enroll(studentId: string): Promise<boolean>;
    unenroll(studentId: string): Promise<void>;
    updateAnalytics(analytics: Partial<CourseAttributes['analytics']>): Promise<void>;
    publish(): Promise<void>;
    archive(): Promise<void>;
    calculateCompletionRate(): number;
    static getPublished(): Promise<Course[]>;
    static getByDifficulty(difficulty: string): Promise<Course[]>;
    static getPopular(limit?: number): Promise<Course[]>;
    static getFeatured(): Promise<Course[]>;
    static getByCategory(categoryId: string): Promise<Course[]>;
    static getByInstructor(instructorId: string): Promise<Course[]>;
    static searchCourses(query: string, filters?: {
        category?: string;
        difficulty?: string;
        priceRange?: {
            min: number;
            max: number;
        };
        rating?: number;
    }): Promise<Course[]>;
    static getRecommendations(userId: string, limit?: number): Promise<Course[]>;
}
export default Course;
//# sourceMappingURL=Course.d.ts.map