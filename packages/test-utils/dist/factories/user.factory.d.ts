export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'coach' | 'admin';
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    avatar?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserFactory: any;
export declare const AdminUserFactory: any;
export declare const CoachUserFactory: any;
export declare const RegularUserFactory: any;
export declare const SuspendedUserFactory: any;
export declare function createTestUsers(count?: number): User[];
export declare function createTestUsersWithRoles(): {
    admin: User;
    coach: User;
    user: User;
};
//# sourceMappingURL=user.factory.d.ts.map