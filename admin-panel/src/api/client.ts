import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

// Add CSRF token to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await csrfManager.getToken();
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }
  } catch (error) {
    console.error('Critical: Failed to get CSRF token:', error);
    throw new Error('CSRF token unavailable - request blocked for security');
  }
  
  // Mark request start time for performance monitoring
  (config as any).metadata = {
    startTime: performance.now(),
  };
  
  return config;
});

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Track successful API calls
    const config = response.config as any;
    if (config.metadata?.startTime) {
      const duration = performance.now() - config.metadata.startTime;
      performanceMonitor.trackApiCall(
        config.url || '',
        duration,
        response.status
      );
    }
    return response;
  },
  (error) => {
    // Handle unauthorized
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    
    // Enhanced error logging
    if (error.response?.status === 403) {
      console.error('CSRF validation failed - possible attack attempt');
    }
    
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || (error as any).message,
      url: error.config?.url,
    });
    
    // Track failed API calls
    const config = error.config as any;
    if (config?.metadata?.startTime) {
      const duration = performance.now() - config.metadata.startTime;
      performanceMonitor.trackApiCall(
        config.url || '',
        duration,
        error.response?.status || 0
      );
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
