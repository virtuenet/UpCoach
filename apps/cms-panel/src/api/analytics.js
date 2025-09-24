import { apiClient } from './client';
export const analyticsApi = {
    getAnalytics: async () => {
        const response = await apiClient.get('/cms/analytics');
        return response.data;
    },
};
//# sourceMappingURL=analytics.js.map