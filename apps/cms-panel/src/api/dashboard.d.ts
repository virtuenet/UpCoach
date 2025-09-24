export interface DashboardStats {
    totalArticles: number;
    totalCourses: number;
    totalViews: number;
    activeLearners: number;
    articlesGrowth: number;
    coursesGrowth: number;
    viewsGrowth: number;
    learnersGrowth: number;
}
export interface RecentContent {
    id: string;
    title: string;
    type: 'article' | 'course';
    status: 'draft' | 'published';
    views: number;
    date: string;
}
export declare const dashboardApi: {
    getStats: () => Promise<DashboardStats>;
    getRecentContent: () => Promise<RecentContent[]>;
};
//# sourceMappingURL=dashboard.d.ts.map