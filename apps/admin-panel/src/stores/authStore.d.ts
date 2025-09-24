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
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthStore>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AuthStore, {
            user: User | null;
            token: string | null;
            refreshToken: string | null;
            isAuthenticated: boolean;
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AuthStore) => void) => () => void;
        onFinishHydration: (fn: (state: AuthStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AuthStore, {
            user: User | null;
            token: string | null;
            refreshToken: string | null;
            isAuthenticated: boolean;
        }>>;
    };
}>;
export {};
//# sourceMappingURL=authStore.d.ts.map