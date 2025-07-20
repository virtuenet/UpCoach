import { apiClient } from './client'

export interface SystemSettings {
  siteName: string
  supportEmail: string
  maxUsersPerPlan: {
    free: number
    pro: number
    team: number
    enterprise: number
  }
  aiModel: string
  aiTemperature: number
  aiMaxTokens: number
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailNotificationsEnabled: boolean
}

export const settingsApi = {
  getSettings: async (): Promise<SystemSettings> => {
    const response = await apiClient.get('/admin/settings')
    return response.data
  },

  updateSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
    const response = await apiClient.put('/admin/settings', settings)
    return response.data
  },
} 