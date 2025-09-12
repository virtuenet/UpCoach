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
    generateTOTPSecret(userId: string, email: string): Promise<{
        secret: TOTPSecret;
        qrCode: string;
        backupCodes: string[];
    }>;
    verifyAndEnableTOTP(userId: string, token: string): Promise<{
        success: boolean;
        backupCodes?: string[];
    }>;
    verifyTOTP(userId: string, token: string): Promise<boolean>;
    disable2FA(userId: string): Promise<void>;
    generateBackupCodes(count?: number): string[];
    regenerateBackupCodes(userId: string): Promise<string[]>;
    private useBackupCode;
    addTrustedDevice(userId: string, deviceInfo: {
        name: string;
        fingerprint: string;
        userAgent: string;
        ipAddress: string;
    }): Promise<TrustedDevice>;
    isDeviceTrusted(userId: string, fingerprint: string): Promise<boolean>;
    removeTrustedDevice(userId: string, deviceId: string): Promise<void>;
    getTrustedDevices(userId: string): Promise<TrustedDevice[]>;
    get2FAConfig(userId: string): Promise<TwoFactorConfig | null>;
    private update2FAConfig;
    is2FAEnabled(userId: string): Promise<boolean>;
    get2FAMethod(userId: string): Promise<string | null>;
    generateDeviceFingerprint(userAgent: string, ipAddress: string, additionalData?: string): string;
    check2FARateLimit(userId: string): Promise<boolean>;
    clear2FARateLimit(userId: string): Promise<void>;
}
export declare const twoFactorAuthService: TwoFactorAuthService;
export {};
//# sourceMappingURL=TwoFactorAuthService.d.ts.map