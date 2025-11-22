import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  avatar?: string;
  permissions: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock login - replace with actual API call
          if (email === 'admin@upcoach.ai' && password === 'admin123') {
            const mockUser: User = {
              id: '1',
              name: 'Admin User',
              email: 'admin@upcoach.ai',
              role: 'admin',
              permissions: ['users:read', 'users:write', 'content:moderate', 'analytics:read', 'system:configure'],
            };
            
            const mockToken = 'mock-jwt-token-12345';
            const mockRefreshToken = 'mock-refresh-token-67890';
            
            set({
              isAuthenticated: true,
              user: mockUser,
              token: mockToken,
              refreshToken: mockRefreshToken,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: 'Invalid credentials',
            });
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Login failed. Please try again.',
          });
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          error: null,
        });
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          // Mock refresh - replace with actual API call
          // For now, just keep the current state
          console.log('Refreshing auth token...');
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
            error: 'Session expired. Please login again.',
          });
        }
      },

      initializeAuth: async () => {
        const { token, refreshToken } = get();
        
        if (token && refreshToken) {
          // Validate existing token - for now just assume it's valid
          set({ isAuthenticated: true });
        } else {
          set({ isAuthenticated: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'upcoach-admin-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);