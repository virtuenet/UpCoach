import { Team } from '../../models/Team';
export interface CreateTeamData {
    organizationId: number;
    name: string;
    description?: string;
    department?: string;
    managerId?: number;
}
export interface UpdateTeamData {
    name?: string;
    description?: string;
    department?: string;
    managerId?: number;
    settings?: any;
    isActive?: boolean;
}
export interface CreatePolicyData {
    organizationId: number;
    name: string;
    type: 'security' | 'data_retention' | 'access_control' | 'compliance';
    rules: any;
    enforcementLevel: 'soft' | 'hard';
    appliesTo?: any;
    createdBy: number;
}
export interface AuditLogFilter {
    page: number;
    limit: number;
    action?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
}
export declare class TeamService {
    createTeam(data: CreateTeamData): Promise<Team>;
    updateTeam(teamId: number, data: UpdateTeamData): Promise<Team>;
    getOrganizationTeams(organizationId: number): Promise<any[]>;
    addTeamMember(teamId: number, userId: number, role: string, addedBy: number): Promise<void>;
    removeTeamMember(teamId: number, userId: number): Promise<void>;
    getTeamMembers(teamId: number): Promise<any[]>;
    createPolicy(data: CreatePolicyData): Promise<any>;
    getOrganizationPolicies(organizationId: number): Promise<any[]>;
    logAuditEvent(organizationId: number, userId: number | null, action: string, resourceType?: string, resourceId?: string, details?: any, ipAddress?: string, userAgent?: string): Promise<void>;
    getAuditLogs(organizationId: number, filter: AuditLogFilter): Promise<{
        logs: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    checkTeamPermission(teamId: number, userId: number, requiredRole: string[]): Promise<boolean>;
    getUserById(userId: number): Promise<any>;
}
//# sourceMappingURL=TeamService.d.ts.map