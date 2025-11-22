import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAuthStore = create()(persist((set, get) => ({
    // Initial state
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    isLoading: false,
    error: null,
    // Actions
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            // Mock login - replace with actual API call
            if (email === 'admin@upcoach.ai' && password === 'admin123') {
                const mockUser = {
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
            }
            else {
                set({
                    isLoading: false,
                    error: 'Invalid credentials',
                });
            }
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        else {
            set({ isAuthenticated: false });
        }
    },
    clearError: () => {
        set({ error: null });
    },
}), {
    name: 'upcoach-admin-auth',
    partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
    }),
}));
//# sourceMappingURL=authStore.js.map