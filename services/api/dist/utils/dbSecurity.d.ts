import { QueryTypes } from 'sequelize';
export declare class SecureDB {
    private static validateTableName;
    private static validateColumnNames;
    static findOne<T>(table: string, conditions: Record<string, any>): Promise<T | null>;
    static findAll<T>(table: string, conditions: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        orderBy?: string;
    }): Promise<T[]>;
    static insert<T>(table: string, data: Record<string, any>): Promise<T>;
    static update(table: string, data: Record<string, any>, conditions: Record<string, any>): Promise<number>;
    static delete(table: string, conditions: Record<string, any>): Promise<number>;
    static rawQuery<T>(sql: string, bindings?: any[], type?: QueryTypes): Promise<T>;
}
export declare const db: typeof SecureDB;
//# sourceMappingURL=dbSecurity.d.ts.map