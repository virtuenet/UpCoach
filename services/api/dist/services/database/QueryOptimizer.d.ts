import { Sequelize, QueryTypes, Transaction } from 'sequelize';
interface QueryPlan {
    query: string;
    cost: number;
    rows: number;
    width: number;
    actualTime: number;
}
interface QueryStats {
    executionTime: number;
    rowsAffected: number;
    cached: boolean;
    queryPlan?: QueryPlan;
}
export declare class QueryOptimizer {
    private sequelize;
    private slowQueryThreshold;
    private queryCache;
    private cacheTimeout;
    constructor(sequelize: Sequelize);
    private setupQueryLogging;
    executeQuery<T extends object = any>(sql: string, options?: {
        replacements?: any;
        type?: QueryTypes;
        transaction?: Transaction;
        cache?: boolean;
        cacheKey?: string;
        cacheTTL?: number;
    }): Promise<{
        result: T;
        stats: QueryStats;
    }>;
    executeBatch<T extends object = any>(queries: Array<{
        sql: string;
        replacements?: any;
        type?: QueryTypes;
    }>): Promise<T[]>;
    analyzeQuery(sql: string, replacements?: any): Promise<QueryPlan[]>;
    optimizeQuery(sql: string): string;
    optimizeConnectionPool(): Promise<void>;
    maintainDatabase(): Promise<void>;
    getQueryStats(): Promise<any>;
    private generateCacheKey;
    private getFromCache;
    private setCache;
    private extractTableName;
    private parseExplainOutput;
    private preparedStatements;
    prepareCriticalQueries(): void;
    executePrepared(name: string, params: any[]): Promise<any>;
}
export {};
//# sourceMappingURL=QueryOptimizer.d.ts.map