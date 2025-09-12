export declare function generateSecret(bytes?: number): string;
export declare function validateSecret(secret: string, minLength?: number): boolean;
export declare function generateApiKey(prefix?: string): string;
export declare function hashSecret(secret: string): string;
export declare function compareSecrets(plain: string, hashed: string): boolean;
export declare function encrypt(text: string, key: string): string;
export declare function decrypt(encryptedText: string, key: string): string;
export declare function rotateSecret(currentSecret?: string): {
    current: string;
    previous: string;
    rotatedAt: Date;
};
export declare function validateEnvironmentSecrets(): void;
//# sourceMappingURL=secrets.d.ts.map