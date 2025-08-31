import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: User;
  message?: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    // Credentials will be sent as httpOnly cookies
    const response = await apiClient.post(
      '/auth/login',
      { email, password },
      {
        withCredentials: true, // Include cookies in request
      }
    );
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    // Cookie will be sent automatically with credentials
    const response = await apiClient.get('/auth/profile', {
      withCredentials: true,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    // This will clear the httpOnly cookie on the server
    await apiClient.post(
      '/auth/logout',
      {},
      {
        withCredentials: true,
      }
    );
  },

  refreshToken: async (): Promise<void> => {
    // Refresh the auth token using the refresh token cookie
    await apiClient.post(
      '/auth/refresh',
      {},
      {
        withCredentials: true,
      }
    );
  },

  validateSession: async (): Promise<boolean> => {
    try {
      await apiClient.get('/auth/validate', {
        withCredentials: true,
      });
      return true;
    } catch {
      return false;
    }
  },
};
