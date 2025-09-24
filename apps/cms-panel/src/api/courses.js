import { apiClient } from './client';
export const coursesApi = {
    getCourses: async (params = {}) => {
        const response = await apiClient.get('/cms/courses', { params });
        return response.data;
    },
    getCourse: async (id) => {
        const response = await apiClient.get(`/cms/courses/${id}`);
        return response.data;
    },
};
//# sourceMappingURL=courses.js.map