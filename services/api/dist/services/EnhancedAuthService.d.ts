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
    /**
     * Generate a hash of the device fingerprint for consistent device identification
     */
    private static hashDeviceFingerprint;
    /**
     * Generate a new token pair with rotation tracking
     */
    static generateTokenPair(userId: string, deviceFingerprint: DeviceFingerprint): Promise<TokenPair>;
    /**
     * Rotate refresh token with security checks
     */
    static rotateRefreshToken(oldRefreshToken: string, deviceFingerprint: DeviceFingerprint): Promise<TokenPair | null>;
    /**
     * Validate access token
     */
    static validateAccessToken(token: string): Promise<TokenPayload | null>;
    /**
     * Logout user by invalidating tokens
     */
    static logout(userId: string, refreshToken?: string, logoutAllDevices?: boolean): Promise<void>;
    /**
     * Store token family in Redis
     */
    private static storeTokenFamily;
    /**
     * Update token family chain
     */
    private static updateTokenFamily;
    /**
     * Validate token family
     */
    private static validateTokenFamily;
    /**
     * Invalidate token family
     */
    private static invalidateTokenFamily;
    /**
     * Invalidate all tokens for a user
     */
    private static invalidateAllUserTokens;
    /**
     * Revoke a specific token
     */
    private static revokeToken;
    /**
     * Check if token is revoked
     */
    private static isTokenRevoked;
    /**
     * Clean up expired token data (maintenance task)
     */
    static cleanupExpiredTokens(): Promise<void>;
}
export default EnhancedAuthService;
//# sourceMappingURL=EnhancedAuthService.d.ts.map