import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and extract data
apiClient.interceptors.response.use(
  (response) => {
    // Extract data from the standardized API response format
    if (response.data && response.data.success && response.data.data !== undefined) {
      return { ...response, data: response.data.data }
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    
    // Extract error message from standardized error response
    if (error.response?.data?.message) {
      error.message = error.response.data.message
    }
    
    return Promise.reject(error)
  }
) 