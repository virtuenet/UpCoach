import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'coach' | 'admin' | 'moderator';
  subscriptionPlan: 'free' | 'pro' | 'team' | 'enterprise';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  avatarUrl?: string;
}

export interface GetUsersParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const usersApi = {
  getUsers: async (params: GetUsersParams = {}): Promise<User[]> => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  toggleUserStatus: async (id: string): Promise<User> => {
    const response = await apiClient.patch(`/admin/users/${id}/toggle-status`);
    return response.data;
  },
};
