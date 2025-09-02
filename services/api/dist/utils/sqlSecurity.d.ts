import { QueryTypes, Sequelize } from 'sequelize';
/**
 * SQL Query Security Utilities
 * Provides safe query building and execution methods
 */
/**
 * Validates and sanitizes table/column names to prevent SQL injection
 * @param identifier Table or column name
 * @returns Sanitized identifier
 */
export declare function sanitizeIdentifier(identifier: string): string;
/**
 * Safely builds a WHERE clause with parameterized conditions
 * @param conditions Array of condition objects
 * @returns Object with WHERE clause and replacements
 */
export declare function buildWhereClause(conditions: Array<{
    column: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';
    value: any;
    paramName?: string;
}>): {
    clause: string;
    replacements: Record<string, any>;
};
/**
 * Safely builds an INSERT query with parameterized values
 * @param table Table name
 * @param data Object with column-value pairs
 * @returns Object with query and replacements
 */
export declare function buildInsertQuery(table: string, data: Record<string, any>, returning?: string): {
    query: string;
    replacements: Record<string, any>;
};
/**
 * Safely builds an UPDATE query with parameterized values
 * @param table Table name
 * @param data Object with column-value pairs to update
 * @param conditions WHERE conditions
 * @returns Object with query and replacements
 */
export declare function buildUpdateQuery(table: string, data: Record<string, any>, conditions: Array<{
    column: string;
    operator: string;
    value: any;
}>): {
    query: string;
    replacements: Record<string, any>;
};
/**
 * Validates query parameters to prevent injection
 * @param params Query parameters
 * @returns Validated parameters
 */
export declare function validateQueryParams(params: Record<string, any>): Record<string, any>;
/**
 * Executes a parameterized query safely
 * @param sequelize Sequelize instance
 * @param query SQL query with parameters
 * @param replacements Parameter values
 * @param type Query type
 * @returns Query result
 */
export declare function executeSecureQuery(sequelize: Sequelize, query: string, replacements: Record<string, any>, type: QueryTypes): Promise<any>;
/**
 * Creates a safe subquery for use in larger queries
 * @param query Subquery SQL
 * @param alias Table alias
 * @returns Sanitized subquery
 */
export declare function createSafeSubquery(query: string, alias: string): string;
/**
 * Builds a safe JOIN clause
 * @param type JOIN type
 * @param table Table to join
 * @param alias Table alias
 * @param conditions ON conditions
 * @returns JOIN clause
 */
export declare function buildJoinClause(type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL', table: string, alias: string, conditions: Array<{
    left: string;
    right: string;
}>): string;
/**
 * Escapes string for use in LIKE patterns
 * @param pattern LIKE pattern
 * @returns Escaped pattern
 */
export declare function escapeLikePattern(pattern: string): string;
//# sourceMappingURL=sqlSecurity.d.ts.map