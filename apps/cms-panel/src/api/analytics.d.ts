export interface ContentAnalytics {
    totalViews: number;
    viewsChange: number;
    uniqueLearners: number;
    learnersChange: number;
    avgReadTime: number;
    readTimeChange: number;
    contentCreated: number;
    contentChange: number;
    viewsOverTime: Array<{
        date: string;
        views: number;
    }>;
    topContent: Array<{
        id: string;
        title: string;
        views: number;
    }>;
    contentEngagement: Array<{
        id: string;
        title: string;
        type: 'article' | 'course';
        views: number;
        completionRate: number;
        engagementScore: number;
    }>;
}
export declare const analyticsApi: {
    getAnalytics: () => Promise<ContentAnalytics>;
};
//# sourceMappingURL=analytics.d.ts.map