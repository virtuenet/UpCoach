/**
 * Two-Factor Authentication Service
 * Implements TOTP (Time-based One-Time Password) and WebAuthn support
 */
export interface TOTPSecret {
    ascii: string;
    hex: string;
    base32: string;
    qr_code_ascii?: string;
    qr_code_hex?: string;
    qr_code_base32?: string;
    google_auth_qr?: string;
    otpauth_url?: string;
}
export interface BackupCodes {
    codes: string[];
    generatedAt: Date;
    usedCodes: string[];
}
export interface TwoFactorConfig {
    userId: string;
    method: 'totp' | 'webauthn' | 'sms' | 'email';
    enabled: boolean;
    secret?: string;
    backupCodes?: string[];
    verifiedAt?: Date;
    lastUsedAt?: Date;
    trustedDevices?: TrustedDevice[];
}
export interface TrustedDevice {
    id: string;
    name: string;
    fingerprint: string;
    addedAt: Date;
    lastUsedAt: Date;
    userAgent: string;
    ipAddress: string;
}
export interface WebAuthnCredential {
    id: string;
    userId: string;
    credentialId: string;
    credentialPublicKey: string;
    counter: number;
    deviceType: string;
    backedUp: boolean;
    transports?: string[];
    createdAt: Date;
    lastUsedAt?: Date;
    name?: string;
}
declare class TwoFactorAuthService {
    private static instance;
    private readonly issuer;
    private readonly backupCodeCount;
    private readonly backupCodeLength;
    private readonly totpWindow;
    private constructor();
    static getInstance(): TwoFactorAuthService;
    /**
     * Generate TOTP secret for user
     */
    generateTOTPSecret(userId: string, email: string): Promise<{
        secret: TOTPSecret;
        qrCode: string;
        backupCodes: string[];
    }>;
    /**
     * Verify TOTP token and enable 2FA
     */
    verifyAndEnableTOTP(userId: string, token: string): Promise<{
        success: boolean;
        backupCodes?: string[];
    }>;
    /**
     * Verify TOTP token for authentication
     */
    verifyTOTP(userId: string, token: string): Promise<boolean>;
    /**
     * Disable 2FA for user
     */
    disable2FA(userId: string): Promise<void>;
    /**
     * Generate backup codes
     */
    generateBackupCodes(count?: number): string[];
    /**
     * Regenerate backup codes
     */
    regenerateBackupCodes(userId: string): Promise<string[]>;
    /**
     * Use a backup code
     */
    private useBackupCode;
    /**
     * Add trusted device
     */
    addTrustedDevice(userId: string, deviceInfo: {
        name: string;
        fingerprint: string;
        userAgent: string;
        ipAddress: string;
    }): Promise<TrustedDevice>;
    /**
     * Check if device is trusted
     */
    isDeviceTrusted(userId: string, fingerprint: string): Promise<boolean>;
    /**
     * Remove trusted device
     */
    removeTrustedDevice(userId: string, deviceId: string): Promise<void>;
    /**
     * Get trusted devices
     */
    getTrustedDevices(userId: string): Promise<TrustedDevice[]>;
    /**
     * Get 2FA configuration
     */
    get2FAConfig(userId: string): Promise<TwoFactorConfig | null>;
    /**
     * Update 2FA configuration
     */
    private update2FAConfig;
    /**
     * Check if user has 2FA enabled
     */
    is2FAEnabled(userId: string): Promise<boolean>;
    /**
     * Get 2FA method for user
     */
    get2FAMethod(userId: string): Promise<string | null>;
    /**
     * Generate device fingerprint
     */
    generateDeviceFingerprint(userAgent: string, ipAddress: string, additionalData?: string): string;
    /**
     * Rate limit 2FA attempts
     */
    check2FARateLimit(userId: string): Promise<boolean>;
    /**
     * Clear 2FA rate limit
     */
    clear2FARateLimit(userId: string): Promise<void>;
}
export declare const twoFactorAuthService: TwoFactorAuthService;
export {};
//# sourceMappingURL=TwoFactorAuthService.d.ts.map