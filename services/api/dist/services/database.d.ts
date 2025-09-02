import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
export declare class DatabaseService {
    private static instance;
    private pool;
    private constructor();
    static getInstance(): DatabaseService;
    static initialize(): Promise<void>;
    static disconnect(): Promise<void>;
    static getPool(): Pool;
    private connect;
    private close;
    query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    getClient(): Promise<PoolClient>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    findOne<T extends QueryResultRow = any>(table: string, conditions: Record<string, any>, columns?: string[]): Promise<T | null>;
    findMany<T extends QueryResultRow = any>(table: string, conditions?: Record<string, any>, options?: {
        columns?: string[];
        orderBy?: string;
        limit?: number;
        offset?: number;
    }): Promise<T[]>;
    insert<T extends QueryResultRow = any>(table: string, data: Record<string, any>, returning?: string[]): Promise<T>;
    update<T extends QueryResultRow = any>(table: string, data: Record<string, any>, conditions: Record<string, any>, returning?: string[]): Promise<T | null>;
    delete(table: string, conditions: Record<string, any>): Promise<number>;
}
export declare const db: DatabaseService;
//# sourceMappingURL=database.d.ts.map