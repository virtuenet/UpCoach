import { User } from '../../models/User';
export interface SSOConfiguration {
    id: number;
    organizationId: number;
    provider: 'saml' | 'oidc' | 'google' | 'microsoft' | 'okta';
    enabled: boolean;
    samlIdpUrl?: string;
    samlIdpCert?: string;
    samlSpCert?: string;
    samlSpKey?: string;
    samlMetadataUrl?: string;
    oidcIssuerUrl?: string;
    oidcClientId?: string;
    oidcClientSecret?: string;
    oidcRedirectUri?: string;
    oidcScopes?: string[];
    attributeMapping?: any;
    autoProvisionUsers?: boolean;
    defaultRole?: string;
    allowedDomains?: string[];
}
export interface SSOUserAttributes {
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    employeeId?: string;
    department?: string;
    groups?: string[];
}
export declare class SSOService {
    private samlProviders;
    private oidcClients;
    createSSOConfiguration(organizationId: number, config: Partial<SSOConfiguration>): Promise<number>;
    initiateSAMLLogin(configId: number): Promise<string>;
    handleSAMLCallback(configId: number, samlResponse: string): Promise<{
        user: User;
        sessionId: string;
    }>;
    initiateOIDCLogin(configId: number): Promise<string>;
    handleOIDCCallback(configId: number, code: string, codeVerifier: string): Promise<{
        user: User;
        sessionId: string;
    }>;
    initiateSSOLogout(sessionId: string): Promise<string | null>;
    private provisionUser;
    private getSAMLProvider;
    private getOIDCClient;
    private initializeProvider;
    private validateSSOConfig;
    private extractSAMLAttributes;
    private encrypt;
    private decrypt;
    getOrganizationSSOProviders(organizationId: number): Promise<any[]>;
    updateSSOConfiguration(configId: number, updates: Partial<SSOConfiguration>): Promise<void>;
    private camelToSnake;
}
//# sourceMappingURL=SSOService.d.ts.map