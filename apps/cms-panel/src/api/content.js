import { apiClient } from './client';
export const contentApi = {
    getArticles: async (params = {}) => {
        const response = await apiClient.get('/cms/articles', { params });
        return {
            data: response.data.data || response.data,
            pagination: response.data.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalItems: response.data?.length || 0,
                itemsPerPage: params.limit || 10,
            },
        };
    },
    getArticle: async (id, trackView = false) => {
        const response = await apiClient.get(`/cms/articles/${id}`, {
            params: { trackView },
        });
        return response.data;
    },
    createArticle: async (data) => {
        const response = await apiClient.post('/cms/articles', data);
        return response.data;
    },
    updateArticle: async (id, data) => {
        const response = await apiClient.put(`/cms/articles/${id}`, data);
        return response.data;
    },
    deleteArticle: async (id) => {
        await apiClient.delete(`/cms/articles/${id}`);
    },
    publishArticle: async (id) => {
        const response = await apiClient.patch(`/cms/articles/${id}/publish`);
        return response.data;
    },
    archiveArticle: async (id) => {
        const response = await apiClient.patch(`/cms/articles/${id}/archive`);
        return response.data;
    },
    searchArticles: async (query, filters = {}) => {
        const params = { q: query, ...filters };
        if (filters.tags) {
            params.tags = filters.tags.join(',');
        }
        const response = await apiClient.get('/cms/articles/search', { params });
        return response.data;
    },
    getPopularArticles: async (limit = 10, timeframe = 'month') => {
        const response = await apiClient.get('/cms/articles/popular', {
            params: { limit, timeframe },
        });
        return response.data;
    },
    getArticleAnalytics: async (id) => {
        const response = await apiClient.get(`/cms/articles/${id}/analytics`);
        return response.data;
    },
    // Categories API
    getCategories: async () => {
        const response = await apiClient.get('/cms/categories');
        return response.data;
    },
    createCategory: async (data) => {
        const response = await apiClient.post('/cms/categories', data);
        return response.data;
    },
};
//# sourceMappingURL=content.js.map