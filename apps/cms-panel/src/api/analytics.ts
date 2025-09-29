import { apiClient } from './client';

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

export const analyticsApi = {
  getAnalytics: async (): Promise<ContentAnalytics> => {
    const response = await (apiClient as any).get('/cms/analytics');
    return response.data;
  },
};
