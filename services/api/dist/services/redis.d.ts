import { RedisClientType } from 'redis';
declare class RedisService {
    private client;
    private isConnected;
    constructor();
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    setEx(key: string, ttl: number, value: string): Promise<void>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    ping(): Promise<string>;
    quit(): Promise<string>;
    hget(key: string, field: string): Promise<string | undefined>;
    hset(key: string, field: string, value: string): Promise<number>;
    hdel(key: string, field: string): Promise<number>;
    lpush(key: string, value: string): Promise<number>;
    rpop(key: string): Promise<string | null>;
    getSession(sessionId: string): Promise<any>;
    setSession(sessionId: string, data: any, ttl?: number): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    private ensureConnected;
    sadd(key: string, member: string): Promise<number>;
    srem(key: string, member: string): Promise<number>;
    smembers(key: string): Promise<string[]>;
    expire(key: string, seconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    get rawClient(): RedisClientType;
}
declare const redisService: RedisService;
export { redisService as redis };
export default redisService;
//# sourceMappingURL=redis.d.ts.map