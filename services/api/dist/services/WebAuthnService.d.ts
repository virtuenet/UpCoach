/**
 * WebAuthn Service
 * Implements WebAuthn/Passkeys for passwordless authentication
 */
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
    /**
     * Configure WebAuthn settings
     */
    configure(config: Partial<WebAuthnConfig>): void;
    /**
     * Generate registration options for new credential
     */
    generateRegistrationOptions(userId: string, userName: string, userDisplayName: string): Promise<PublicKeyCredentialCreationOptionsJSON>;
    /**
     * Verify registration response
     */
    verifyRegistrationResponse(userId: string, response: RegistrationResponseJSON, credentialName?: string): Promise<{
        verified: boolean;
        credentialId?: string;
    }>;
    /**
     * Generate authentication options
     */
    generateAuthenticationOptions(userId?: string): Promise<PublicKeyCredentialRequestOptionsJSON>;
    /**
     * Verify authentication response
     */
    verifyAuthenticationResponse(response: AuthenticationResponseJSON, userId?: string): Promise<{
        verified: boolean;
        userId?: string;
        credentialId?: string;
    }>;
    /**
     * Get user's WebAuthn credentials
     */
    getUserCredentials(userId: string): Promise<WebAuthnCredential[]>;
    /**
     * Get credential by ID
     */
    getCredentialById(credentialId: string): Promise<WebAuthnCredential | null>;
    /**
     * Store credential
     */
    private storeCredential;
    /**
     * Update credential
     */
    private updateCredential;
    /**
     * Delete credential
     */
    deleteCredential(userId: string, credentialId: string): Promise<void>;
    /**
     * Rename credential
     */
    renameCredential(userId: string, credentialId: string, newName: string): Promise<void>;
    /**
     * Store challenge for verification
     */
    private storeChallenge;
    /**
     * Get stored challenge
     */
    private getChallenge;
    /**
     * Clear challenge
     */
    private clearChallenge;
    /**
     * Check if user has WebAuthn credentials
     */
    hasWebAuthnCredentials(userId: string): Promise<boolean>;
    /**
     * Get credential statistics for user
     */
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