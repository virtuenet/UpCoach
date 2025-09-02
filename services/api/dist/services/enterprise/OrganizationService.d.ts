import { Organization } from '../../models/Organization';
export interface CreateOrganizationData {
    name: string;
    website?: string;
    industry?: string;
    size?: 'small' | 'medium' | 'large' | 'enterprise';
    billingEmail: string;
    ownerId: number;
}
export interface UpdateOrganizationData {
    name?: string;
    website?: string;
    industry?: string;
    size?: 'small' | 'medium' | 'large' | 'enterprise';
    billingEmail?: string;
    logoUrl?: string;
    settings?: any;
}
export interface InviteMemberData {
    email: string;
    role: 'member' | 'manager' | 'admin';
    teamIds?: number[];
    invitedBy: number;
}
export interface OrganizationStats {
    totalMembers: number;
    activeMembers: number;
    totalTeams: number;
    activeTeams: number;
    storageUsed: number;
    apiCallsThisMonth: number;
}
export declare class OrganizationService {
    createOrganization(data: CreateOrganizationData): Promise<Organization>;
    updateOrganization(organizationId: number, data: UpdateOrganizationData): Promise<Organization>;
    inviteMember(organizationId: number, data: InviteMemberData): Promise<{
        invitationId: number;
        token: string;
    }>;
    acceptInvitation(token: string, userId: number): Promise<void>;
    removeMember(organizationId: number, userId: number, removedBy: number): Promise<void>;
    getOrganizationStats(organizationId: number): Promise<OrganizationStats>;
    getOrganizationMembers(organizationId: number, options?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        teamId?: number;
    }): Promise<{
        members: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getOrganizationById(organizationId: number): Promise<Organization | null>;
}
//# sourceMappingURL=OrganizationService.d.ts.map