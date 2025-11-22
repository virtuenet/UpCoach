import { apiClient } from './client';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessonsCount: number;
  enrolledCount: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface GetCoursesParams {
  search?: string;
  difficulty?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const coursesApi = {
  getCourses: async (params: GetCoursesParams = {}): Promise<Course[]> => {
    const response = await apiClient.get('/cms/courses', { params });
    return response.data;
  },

  getCourse: async (id: string): Promise<Course> => {
    const response = await apiClient.get(`/cms/courses/${id}`);
    return response.data;
  },
};
