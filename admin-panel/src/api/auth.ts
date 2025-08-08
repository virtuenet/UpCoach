import { apiClient } from "./client";
import type { User } from "../stores/authStore";

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  },

  getProfile: async (token: string): Promise<User> => {
    const response = await apiClient.get("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  logout: async (token: string): Promise<void> => {
    await apiClient.post(
      "/auth/logout",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
};
