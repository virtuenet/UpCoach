import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON, AuthenticationResponseJSON, AuthenticatorTransportFuture } from '@simplewebauthn/types';
export interface WebAuthnConfig {
    rpName: string;
    rpID: string;
    origin: string | string[];
    timeout?: number;
    userVerification?: 'required' | 'preferred' | 'discouraged';
    attestationType?: 'none' | 'indirect' | 'direct' | 'enterprise';
}
export interface WebAuthnCredential {
    credentialID: string;
    credentialPublicKey: string;
    counter: number;
    transports?: AuthenticatorTransportFuture[];
    userId: string;
    name?: string;
    createdAt: Date;
    lastUsedAt?: Date;
    backedUp: boolean;
    deviceType?: string;
}
export interface WebAuthnChallenge {
    challenge: string;
    userId: string;
    type: 'registration' | 'authentication';
    createdAt: Date;
    expiresAt: Date;
}
declare class WebAuthnService {
    private static instance;
    private config;
    private challengeExpiry;
    private constructor();
    static getInstance(): WebAuthnService;
    configure(config: Partial<WebAuthnConfig>): void;
    generateRegistrationOptions(userId: string, userName: string, userDisplayName: string): Promise<PublicKeyCredentialCreationOptionsJSON>;
    verifyRegistrationResponse(userId: string, response: RegistrationResponseJSON, credentialName?: string): Promise<{
        verified: boolean;
        credentialId?: string;
    }>;
    generateAuthenticationOptions(userId?: string): Promise<PublicKeyCredentialRequestOptionsJSON>;
    verifyAuthenticationResponse(response: AuthenticationResponseJSON, userId?: string): Promise<{
        verified: boolean;
        userId?: string;
        credentialId?: string;
    }>;
    getUserCredentials(userId: string): Promise<WebAuthnCredential[]>;
    getCredentialById(credentialId: string): Promise<WebAuthnCredential | null>;
    private storeCredential;
    private updateCredential;
    deleteCredential(userId: string, credentialId: string): Promise<void>;
    renameCredential(userId: string, credentialId: string, newName: string): Promise<void>;
    private storeChallenge;
    private getChallenge;
    private clearChallenge;
    hasWebAuthnCredentials(userId: string): Promise<boolean>;
    getUserCredentialStats(userId: string): Promise<{
        total: number;
        platformCredentials: number;
        backedUpCredentials: number;
        lastUsed?: Date;
    }>;
}
export declare const webAuthnService: WebAuthnService;
export {};
//# sourceMappingURL=WebAuthnService.d.ts.map