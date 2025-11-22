export interface Course {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    lessonsCount: number;
    enrolledCount: number;
    status: 'draft' | 'published' | 'archived';
    createdAt: string;
    updatedAt: string;
}
export interface GetCoursesParams {
    search?: string;
    difficulty?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export declare const coursesApi: {
    getCourses: (params?: GetCoursesParams) => Promise<Course[]>;
    getCourse: (id: string) => Promise<Course>;
};
//# sourceMappingURL=courses.d.ts.map