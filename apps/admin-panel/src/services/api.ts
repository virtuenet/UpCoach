import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { getActiveTenantId } from '../stores/tenantStore';

// API Configuration
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:1080';

// Create axios instance with default configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantId = getActiveTenantId();
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth-token');
      sessionStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export default axios instance
export default apiClient;