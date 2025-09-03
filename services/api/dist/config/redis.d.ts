export declare function initializeRedis(): Promise<void>;
export declare function getRedis(): any;
export declare function cacheGet<T>(key: string): Promise<T | null>;
export declare function cacheSet(key: string, value: any, expirySeconds?: number): Promise<void>;
export declare function cacheDelete(key: string): Promise<void>;
export declare function cacheExists(key: string): Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map