import { sequelize } from './sequelize';
export { sequelize };
export declare function initializeDatabase(): Promise<void>;
export declare function closeDatabase(): Promise<void>;
/**
 * Execute a query with the database pool
 */
export declare function query(text: string, params?: any[]): Promise<any>;
/**
 * Execute queries within a transaction
 */
export declare function transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T>;
/**
 * Get a database client from the pool (for advanced usage)
 */
export declare function getClient(): Promise<any>;
/**
 * Check database health
 */
export declare function healthCheck(): Promise<boolean>;
/**
 * Get database pool stats
 */
export declare function getPoolStats(): {
    dialect: string;
    database: string;
    connected: Promise<boolean>;
};
export declare const db: {
    query: typeof query;
    transaction: typeof transaction;
    getClient: typeof getClient;
    healthCheck: typeof healthCheck;
    getPoolStats: typeof getPoolStats;
    findOne<T>(table: string, conditions: Record<string, any>): Promise<T | null>;
    findMany<T>(table: string, conditions?: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        orderBy?: string;
        orderDirection?: "ASC" | "DESC";
    }): Promise<T[]>;
    insert<T>(table: string, data: Record<string, any>): Promise<T>;
    update<T>(table: string, data: Record<string, any>, conditions: Record<string, any>): Promise<T | null>;
    delete(table: string, conditions: Record<string, any>): Promise<number>;
    count(table: string, conditions?: Record<string, any>): Promise<number>;
    exists(table: string, conditions: Record<string, any>): Promise<boolean>;
};
//# sourceMappingURL=database.d.ts.map