import { apiClient } from './client'

export interface DashboardStats {
  totalArticles: number
  totalCourses: number
  totalViews: number
  activeLearners: number
  articlesGrowth: number
  coursesGrowth: number
  viewsGrowth: number
  learnersGrowth: number
}

export interface RecentContent {
  id: string
  title: string
  type: 'article' | 'course'
  status: 'draft' | 'published'
  views: number
  date: string
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/cms/dashboard/stats')
    return response.data
  },

  getRecentContent: async (): Promise<RecentContent[]> => {
    const response = await apiClient.get('/cms/dashboard/recent-content')
    return response.data
  },
} 