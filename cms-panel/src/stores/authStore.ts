import { create } from 'zustand'
import { authApi } from '../api/auth'
import { secureAuth } from '../services/secureAuth'
import { logger } from '../utils/logger'
import toast from 'react-hot-toast'

export interface User {
  id: string
  email: string
  fullName: string
  name?: string // Added for compatibility
  role: 'coach' | 'content_creator' | 'admin'
  avatarUrl?: string
  bio?: string
  expertise?: string[]
  createdAt: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateProfile: (data: Partial<User>) => void
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  initializeAuth: async () => {
    try {
      // Initialize secure auth service
      await secureAuth.initialize();
      secureAuth.setupInterceptor();
      
      // Check if user has valid session
      const hasSession = await secureAuth.checkSession();
      if (hasSession) {
        await get().checkAuth();
      }
    } catch (error) {
      logger.error('Failed to initialize auth', error as Error);
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await authApi.login(email, password);
      
      if (response.user.role !== 'coach' && response.user.role !== 'content_creator' && response.user.role !== 'admin') {
        throw new Error('Access denied. Coach or content creator privileges required.');
      }

      // Note: Token is now stored in httpOnly cookie by the server
      // We only store user info in memory
      set({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
      });
      
      toast.success('Welcome back!');
    } catch (error) {
      set({ isLoading: false, isAuthenticated: false });
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  },

  logout: async () => {
    try {
      await secureAuth.clearSession();
      set({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully');
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      logger.error('Logout error', error as Error);
      // Still clear local state even if server logout fails
      set({ user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      
      // Check if we have a valid session
      const hasSession = await secureAuth.checkSession();
      if (!hasSession) {
        set({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      // Get user profile using cookie-based auth
      const user = await authApi.getProfile();
      
      if (user.role !== 'coach' && user.role !== 'content_creator' && user.role !== 'admin') {
        set({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      set({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      set({ user: null, isLoading: false, isAuthenticated: false });
    }
  },

  updateProfile: (data: Partial<User>) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...data } });
    }
  },
})) 