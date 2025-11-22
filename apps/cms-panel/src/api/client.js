import { createApiClient } from '@upcoach/shared/services';
import { useAuthStore } from '../stores/authStore';
import { csrfManager } from '../services/csrfManager';
import { logger } from '../utils/logger';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:1080/api';
export const apiClient = createApiClient({
    baseURL: BASE_URL,
    timeout: 30000,
    withCredentials: true, // Enable cookies for authentication
    // No longer need getAuthToken since we're using httpOnly cookies
    getCSRFToken: async () => {
        try {
            return await csrfManager.getToken();
        }
        catch (error) {
            logger.warn('Failed to get CSRF token', error);
            return null;
        }
    },
    onUnauthorized: () => {
        logger.info('User unauthorized, redirecting to login');
        // Handle logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
    },
    onError: error => {
        // Log errors with proper logger
        logger.error('API Error', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });
    },
});
// Export for backward compatibility
export default apiClient;
//# sourceMappingURL=client.js.map