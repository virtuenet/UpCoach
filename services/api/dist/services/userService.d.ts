import { User, CreateUserDto, UpdateUserDto, UserResponseDto } from '../types/database';
export declare class UserService {
    static findById(id: string): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static create(userData: CreateUserDto): Promise<User>;
    static update(id: string, updateData: UpdateUserDto): Promise<User | null>;
    static updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void>;
    static updateLastLogin(id: string): Promise<void>;
    static verifyPassword(email: string, password: string): Promise<User | null>;
    static deactivate(id: string): Promise<void>;
    static delete(id: string): Promise<void>;
    static getProfile(id: string): Promise<UserResponseDto | null>;
    static getUserStatistics(id: string): Promise<any>;
    static toResponseDto(user: User): UserResponseDto;
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
    static generatePasswordResetToken(userId: number): Promise<string>;
    static resetPasswordWithToken(token: string, newPassword: string): Promise<number>;
    static verifyGoogleToken(_idToken: string): Promise<any>;
    static createFromGoogle(googleData: {
        email: string;
        name: string;
        googleId: string;
        avatarUrl?: string;
        isEmailVerified: boolean;
    }): Promise<User>;
    static updateGoogleId(userId: number, googleId: string): Promise<void>;
}
//# sourceMappingURL=userService.d.ts.map