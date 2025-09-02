import { Model, Optional } from 'sequelize';
export interface UserAttributes {
    id: string;
    email: string;
    password: string;
    name: string;
    role: 'user' | 'admin' | 'coach';
    avatar?: string;
    bio?: string;
    googleId?: string;
    organizationId?: string;
    isActive: boolean;
    emailVerified: boolean;
    onboardingCompleted?: boolean;
    onboardingCompletedAt?: Date;
    onboardingSkipped?: boolean;
    lastLoginAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'avatar' | 'bio' | 'googleId' | 'organizationId' | 'isActive' | 'emailVerified' | 'onboardingCompleted' | 'onboardingCompletedAt' | 'onboardingSkipped' | 'createdAt' | 'updatedAt' | 'lastLoginAt'> {
}
export declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    email: string;
    password: string;
    name: string;
    role: 'user' | 'admin' | 'coach';
    avatar?: string;
    bio?: string;
    googleId?: string;
    organizationId?: string;
    isActive: boolean;
    emailVerified: boolean;
    onboardingCompleted?: boolean;
    onboardingCompletedAt?: Date;
    onboardingSkipped?: boolean;
    lastLoginAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly profile?: any;
    readonly goals?: any[];
    readonly tasks?: any[];
    readonly moods?: any[];
    readonly chats?: any[];
    comparePassword(password: string): Promise<boolean>;
    static associate(models: any): void;
}
//# sourceMappingURL=User.d.ts.map