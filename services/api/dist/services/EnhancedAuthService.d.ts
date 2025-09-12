interface TokenPayload {
    userId: string;
    type: 'access' | 'refresh';
    deviceId: string;
    jti: string;
    family?: string;
}
interface TokenPair {
    accessToken: string;
    refreshToken: string;
    family: string;
}
interface DeviceFingerprint {
    userAgent: string;
    ip: string;
    acceptLanguage?: string;
    acceptEncoding?: string;
}
export declare class EnhancedAuthService {
    private static readonly ACCESS_TOKEN_TTL;
    private static readonly REFRESH_TOKEN_TTL;
    private static readonly TOKEN_FAMILY_PREFIX;
    private static readonly REVOKED_TOKENS_PREFIX;
    private static readonly MAX_REFRESH_CHAIN_LENGTH;
    private static hashDeviceFingerprint;
    static generateTokenPair(userId: string, deviceFingerprint: DeviceFingerprint): Promise<TokenPair>;
    static rotateRefreshToken(oldRefreshToken: string, deviceFingerprint: DeviceFingerprint): Promise<TokenPair | null>;
    static validateAccessToken(token: string): Promise<TokenPayload | null>;
    static logout(userId: string, refreshToken?: string, logoutAllDevices?: boolean): Promise<void>;
    private static storeTokenFamily;
    private static updateTokenFamily;
    private static validateTokenFamily;
    private static invalidateTokenFamily;
    private static invalidateAllUserTokens;
    private static revokeToken;
    private static isTokenRevoked;
    static cleanupExpiredTokens(): Promise<void>;
}
export default EnhancedAuthService;
//# sourceMappingURL=EnhancedAuthService.d.ts.map