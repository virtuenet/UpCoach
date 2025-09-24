export interface User {
    id: string;
    email: string;
    fullName: string;
    name?: string;
    role: 'coach' | 'content_creator' | 'admin';
    avatarUrl?: string;
    bio?: string;
    expertise?: string[];
    createdAt: string;
}
interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    updateProfile: (data: Partial<User>) => void;
    initializeAuth: () => Promise<void>;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
export {};
//# sourceMappingURL=authStore.d.ts.map