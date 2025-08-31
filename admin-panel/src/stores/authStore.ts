import toast from 'react-hot-toast';
import { create } from 'zustand';
import { authApi } from '../api/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'coach' | 'user';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearAuth: () => void;
}

// Remove persistence - auth will be managed by httpOnly cookies
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await authApi.login(email, password);

      if (response.user.role !== 'admin' && response.user.role !== 'moderator') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // No token storage - it's in httpOnly cookie
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      toast.success('Successfully logged in!');
    } catch (error: any) {
      set({ isLoading: false, isAuthenticated: false });
      toast.error(error.message || 'Login failed');
      throw error;
    }
  },

  logout: async () => {
    try {
      // Call logout endpoint to clear httpOnly cookie
      await authApi.logout();
      set({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if logout fails, clear local state
      set({ user: null, isAuthenticated: false });
      toast.error('Logout failed, but session cleared');
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      // This will use the httpOnly cookie automatically
      const user = await authApi.getProfile();

      if (user.role !== 'admin' && user.role !== 'moderator') {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (data: Partial<User>) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...data } });
    }
  },

  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
