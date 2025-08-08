import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../api/auth";
import toast from "react-hot-toast";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "moderator" | "coach" | "user";
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const response = await authApi.login(email, password);

          if (
            response.user.role !== "admin" &&
            response.user.role !== "moderator"
          ) {
            throw new Error("Access denied. Admin privileges required.");
          }

          set({
            user: response.user,
            token: response.token,
            isLoading: false,
          });
          toast.success("Successfully logged in!");
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || "Login failed");
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem("auth-storage");
        toast.success("Logged out successfully");
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          set({ isLoading: true });
          const user = await authApi.getProfile(token);

          if (user.role !== "admin" && user.role !== "moderator") {
            set({ user: null, token: null, isLoading: false });
            return;
          }

          set({ user, isLoading: false });
        } catch (error) {
          set({ user: null, token: null, isLoading: false });
        }
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...data } });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
