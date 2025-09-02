/**
 * Generates a cryptographically secure random secret
 * @param bytes Number of random bytes (default 64)
 * @returns Hex-encoded secret string
 */
export declare function generateSecret(bytes?: number): string;
/**
 * Validates that a secret meets security requirements
 * @param secret The secret to validate
 * @param minLength Minimum length requirement
 * @returns Boolean indicating if secret is valid
 */
export declare function validateSecret(secret: string, minLength?: number): boolean;
/**
 * Generates a secure API key with prefix
 * @param prefix Key prefix (e.g., 'sk_live_', 'pk_test_')
 * @returns Formatted API key
 */
export declare function generateApiKey(prefix?: string): string;
/**
 * Hashes a secret for storage (one-way)
 * @param secret The secret to hash
 * @returns Hashed secret
 */
export declare function hashSecret(secret: string): string;
/**
 * Compares a plain secret with a hashed secret
 * @param plain Plain text secret
 * @param hashed Hashed secret
 * @returns Boolean indicating if they match
 */
export declare function compareSecrets(plain: string, hashed: string): boolean;
/**
 * Encrypts sensitive data
 * @param text Text to encrypt
 * @param key Encryption key
 * @returns Encrypted text with IV
 */
export declare function encrypt(text: string, key: string): string;
/**
 * Decrypts sensitive data
 * @param encryptedText Encrypted text with IV
 * @param key Decryption key
 * @returns Decrypted text
 */
export declare function decrypt(encryptedText: string, key: string): string;
/**
 * Rotates a secret by generating a new one
 * @returns Object with new and old secrets for gradual migration
 */
export declare function rotateSecret(currentSecret?: string): {
    current: string;
    previous: string;
    rotatedAt: Date;
};
/**
 * Validates environment secrets on startup
 */
export declare function validateEnvironmentSecrets(): void;
//# sourceMappingURL=secrets.d.ts.map