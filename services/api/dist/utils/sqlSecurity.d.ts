import { QueryTypes, Sequelize } from 'sequelize';
export declare function sanitizeIdentifier(identifier: string): string;
export declare function buildWhereClause(conditions: Array<{
    column: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';
    value: any;
    paramName?: string;
}>): {
    clause: string;
    replacements: Record<string, any>;
};
export declare function buildInsertQuery(table: string, data: Record<string, any>, returning?: string): {
    query: string;
    replacements: Record<string, any>;
};
export declare function buildUpdateQuery(table: string, data: Record<string, any>, conditions: Array<{
    column: string;
    operator: string;
    value: any;
}>): {
    query: string;
    replacements: Record<string, any>;
};
export declare function validateQueryParams(params: Record<string, any>): Record<string, any>;
export declare function executeSecureQuery(sequelize: Sequelize, query: string, replacements: Record<string, any>, type: QueryTypes): Promise<any>;
export declare function createSafeSubquery(query: string, alias: string): string;
export declare function buildJoinClause(type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL', table: string, alias: string, conditions: Array<{
    left: string;
    right: string;
}>): string;
export declare function escapeLikePattern(pattern: string): string;
//# sourceMappingURL=sqlSecurity.d.ts.map