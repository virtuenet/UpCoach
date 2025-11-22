import { apiClient } from './client';
export const dashboardApi = {
    getStats: async () => {
        const response = await apiClient.get('/cms/dashboard/stats');
        return response.data;
    },
    getRecentContent: async () => {
        const response = await apiClient.get('/cms/dashboard/recent-content');
        return response.data;
    },
};
//# sourceMappingURL=dashboard.js.map