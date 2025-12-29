import { EventEmitter } from 'events';

export interface Organization {
  id: string;
  name: string;
  domain: string;
  plan: EnterprisePlan;
  settings: OrganizationSettings;
  branding: BrandingConfig;
  ssoConfig?: any;
  createdAt: Date;
  licenseCount: number;
  activeUsers: number;
}

export enum EnterprisePlan {
  TEAM = 'team',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export interface OrganizationSettings {
  allowSelfSignup: boolean;
  requireEmailVerification: boolean;
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface BrandingConfig {
  primaryColor: string;
  logo?: string;
  favicon?: string;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  parentTeamId?: string;
  managerId: string;
  members: TeamMember[];
  settings: TeamSettings;
}

export interface TeamMember {
  userId: string;
  role: string;
  joinedAt: Date;
}

export interface TeamSettings {
  coachingEnabled: boolean;
  analyticsEnabled: boolean;
}

/**
 * Organization Manager
 *
 * Multi-tenant organization management with hierarchical teams.
 */
export class OrganizationManager extends EventEmitter {
  private organizations: Map<string, Organization> = new Map();
  private teams: Map<string, Team> = new Map();

  async createOrganization(data: any): Promise<Organization> {
    const org: Organization = {
      id: `org-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      activeUsers: 0,
    };
    this.organizations.set(org.id, org);
    this.emit('organization:created', org);
    return org;
  }

  async createTeam(data: any): Promise<Team> {
    const team: Team = {
      id: `team-${Date.now()}`,
      ...data,
      members: [],
    };
    this.teams.set(team.id, team);
    this.emit('team:created', team);
    return team;
  }

  async addUserToOrganization(userId: string, orgId: string): Promise<void> {
    this.emit('user:added', { userId, orgId });
  }

  async allocateLicense(userId: string, orgId: string): Promise<void> {
    this.emit('license:allocated', { userId, orgId });
  }

  async getOrganizationHierarchy(orgId: string): Promise<any> {
    return { organizationId: orgId, teams: [] };
  }
}

export default OrganizationManager;
