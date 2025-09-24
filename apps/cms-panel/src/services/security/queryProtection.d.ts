/**
 * Query Protection Service
 * SQL injection prevention and query sanitization
 */
export interface QueryProtectionConfig {
    allowedTables?: string[];
    allowedColumns?: Map<string, string[]>;
    maxQueryLength?: number;
    maxParameterCount?: number;
    blockRawQueries?: boolean;
    logSuspiciousQueries?: boolean;
    enableParameterValidation?: boolean;
}
interface QueryValidationResult {
    safe: boolean;
    sanitized?: string;
    parameters?: any[];
    threats?: string[];
    warnings?: string[];
}
interface PreparedStatement {
    query: string;
    parameters: any[];
}
declare class QueryProtectionService {
    private static instance;
    private config;
    private readonly SQL_INJECTION_PATTERNS;
    private readonly NOSQL_INJECTION_PATTERNS;
    private readonly DEFAULT_CONFIG;
    private constructor();
    static getInstance(): QueryProtectionService;
    /**
     * Configure query protection
     */
    configure(config: QueryProtectionConfig): void;
    /**
     * Validate SQL query
     */
    validateSQLQuery(query: string, parameters?: any[]): QueryValidationResult;
    /**
     * Validate NoSQL query
     */
    validateNoSQLQuery(query: any): QueryValidationResult;
    /**
     * Check object for injection patterns
     */
    private checkObjectForInjection;
    /**
     * Validate query parameters
     */
    private validateParameters;
    /**
     * Create safe parameterized query
     */
    createParameterizedQuery(template: string, params: Record<string, any>): PreparedStatement;
    /**
     * Sanitize identifier (table/column name)
     */
    sanitizeIdentifier(identifier: string): string;
    /**
     * Escape string value
     */
    escapeString(value: string): string;
    /**
     * Build safe WHERE clause
     */
    buildWhereClause(conditions: Record<string, any>): {
        clause: string;
        parameters: any[];
    };
    /**
     * Build safe INSERT query
     */
    buildInsertQuery(table: string, data: Record<string, any>): PreparedStatement;
    /**
     * Build safe UPDATE query
     */
    buildUpdateQuery(table: string, data: Record<string, any>, conditions: Record<string, any>): PreparedStatement;
    /**
     * Middleware for query protection
     */
    middleware(): (req: any, res: any, next: any) => void;
}
export declare const queryProtection: QueryProtectionService;
export declare const sanitizeIdentifier: (id: string) => string;
export declare const escapeString: (str: string) => string;
export declare const buildWhereClause: (conditions: Record<string, any>) => {
    clause: string;
    parameters: any[];
};
export declare const buildInsertQuery: (table: string, data: Record<string, any>) => PreparedStatement;
export declare const buildUpdateQuery: (table: string, data: Record<string, any>, conditions: Record<string, any>) => PreparedStatement;
export {};
//# sourceMappingURL=queryProtection.d.ts.map