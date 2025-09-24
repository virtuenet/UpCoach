import type { User } from '../stores/authStore';
export interface LoginResponse {
    user: User;
    token: string;
    refreshToken: string;
}
export declare const authApi: {
    login: (email: string, password: string) => Promise<LoginResponse>;
    getProfile: () => Promise<User>;
    updateProfile: (data: Partial<User>) => Promise<User>;
    logout: () => Promise<void>;
};
//# sourceMappingURL=auth.d.ts.map