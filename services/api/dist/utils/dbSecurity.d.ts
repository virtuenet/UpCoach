import { QueryTypes } from 'sequelize';
export declare class SecureDB {
    /**
     * Validates and sanitizes table names
     */
    private static validateTableName;
    /**
     * Validates column names to prevent injection
     */
    private static validateColumnNames;
    /**
     * Safely find one record with parameterized queries
     */
    static findOne<T>(table: string, conditions: Record<string, any>): Promise<T | null>;
    /**
     * Safely find multiple records with parameterized queries
     */
    static findAll<T>(table: string, conditions: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        orderBy?: string;
    }): Promise<T[]>;
    /**
     * Safely insert a record with parameterized queries
     */
    static insert<T>(table: string, data: Record<string, any>): Promise<T>;
    /**
     * Safely update records with parameterized queries
     */
    static update(table: string, data: Record<string, any>, conditions: Record<string, any>): Promise<number>;
    /**
     * Safely delete records with parameterized queries
     */
    static delete(table: string, conditions: Record<string, any>): Promise<number>;
    /**
     * Execute raw query with parameter binding (use with caution)
     */
    static rawQuery<T>(sql: string, bindings?: any[], type?: QueryTypes): Promise<T>;
}
export declare const db: typeof SecureDB;
//# sourceMappingURL=dbSecurity.d.ts.map