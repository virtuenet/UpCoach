import { apiClient } from './client'
import type { User } from '../stores/authStore'
import { withRateLimit, RATE_LIMITS } from '../utils/rateLimiter'

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return withRateLimit(async () => {
      const response = await apiClient.post('/auth/login', { 
        email, 
        password,
        // Request secure cookie-based auth
        secureCookies: true 
      })
      return response.data
    }, RATE_LIMITS.LOGIN)
  },

  getProfile: async (): Promise<User> => {
    // No need to pass token - it's in the httpOnly cookie
    const response = await apiClient.get('/auth/profile')
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/users/profile', data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
} 