import { apiClient } from './client'

export interface DashboardStats {
  totalUsers: number
  activeTasks: number
  totalGoals: number
  totalMessages: number
  userGrowth: number
  taskGrowth: number
  goalGrowth: number
  messageGrowth: number
  recentActivity: Array<{
    id: string
    description: string
    userInitials: string
    timestamp: string
  }>
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/admin/dashboard/stats')
    return response.data
  },
} 