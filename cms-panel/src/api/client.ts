import { createApiClient } from '../../../shared/services/apiClient'
import { useAuthStore } from '../stores/authStore'
import { csrfManager } from '../services/csrfManager'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000/api'

export const apiClient = createApiClient({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true, // Enable cookies for authentication
  // No longer need getAuthToken since we're using httpOnly cookies
  getCSRFToken: async () => {
    try {
      return await csrfManager.getToken()
    } catch (error) {
      console.warn('Failed to get CSRF token:', error)
      return null
    }
  },
  onUnauthorized: () => {
    // Handle logout
    useAuthStore.getState().logout()
    window.location.href = '/login'
  },
  onError: (error) => {
    // Log errors for debugging in development only
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.data || error.message)
    }
  }
})

// Export for backward compatibility
export default apiClient