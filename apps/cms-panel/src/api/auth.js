import { apiClient } from './client';
import { withRateLimit, RATE_LIMITS } from '../utils/rateLimiter';
export const authApi = {
    login: async (email, password) => {
        return withRateLimit(async () => {
            const response = await apiClient.post('/auth/login', {
                email,
                password,
                // Request secure cookie-based auth
                secureCookies: true,
            });
            return response.data;
        }, RATE_LIMITS.LOGIN);
    },
    getProfile: async () => {
        // No need to pass token - it's in the httpOnly cookie
        const response = await apiClient.get('/auth/profile');
        return response.data;
    },
    updateProfile: async (data) => {
        const response = await apiClient.put('/users/profile', data);
        return response.data;
    },
    logout: async () => {
        await apiClient.post('/auth/logout');
    },
};
//# sourceMappingURL=auth.js.map