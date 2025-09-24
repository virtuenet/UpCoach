/**
 * Query Protection Service
 * SQL injection prevention and query sanitization
 */
import { logger } from '../../utils/logger';
class QueryProtectionService {
    constructor() {
        this.SQL_INJECTION_PATTERNS = [
            // Classic SQL injection
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/gi,
            // Comment injection
            /(--|\#|\/\*|\*\/)/g,
            // String concatenation
            /(\|\||&&)/g,
            // Dangerous functions
            /(\b(SLEEP|BENCHMARK|LOAD_FILE|INTO OUTFILE|INTO DUMPFILE)\b)/gi,
            // System functions
            /(\b(VERSION|DATABASE|USER|SYSTEM_USER|SESSION_USER|CURRENT_USER)\b)/gi,
            // Stacked queries
            /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
            // Hex encoding attempts
            /(0x[0-9a-fA-F]+)/g,
            // Time-based blind injection
            /(\b(WAITFOR|DELAY|PG_SLEEP)\b)/gi,
            // Boolean-based blind injection
            /(\b(AND|OR)\b\s+[\d\w]+\s*=\s*[\d\w]+)/gi,
            // UNION-based injection
            /UNION\s+ALL\s+SELECT/gi,
            // Subquery injection
            /\((SELECT|INSERT|UPDATE|DELETE).+\)/gi,
        ];
        this.NOSQL_INJECTION_PATTERNS = [
            // MongoDB injection patterns
            /(\$where|\$regex|\$ne|\$gt|\$lt|\$gte|\$lte|\$exists|\$type|\$mod|\$text)/gi,
            // JavaScript injection
            /(\bfunction\b|\beval\b|\bnew Function\b)/gi,
            // Object injection
            /(\{[^}]*\$[^}]*\})/g,
        ];
        this.DEFAULT_CONFIG = {
            allowedTables: [],
            allowedColumns: new Map(),
            maxQueryLength: 10000,
            maxParameterCount: 100,
            blockRawQueries: true,
            logSuspiciousQueries: true,
            enableParameterValidation: true,
        };
        this.config = { ...this.DEFAULT_CONFIG };
    }
    static getInstance() {
        if (!QueryProtectionService.instance) {
            QueryProtectionService.instance = new QueryProtectionService();
        }
        return QueryProtectionService.instance;
    }
    /**
     * Configure query protection
     */
    configure(config) {
        this.config = {
            ...this.config,
            ...config,
        };
        logger.info('Query protection configured', {
            allowedTables: this.config.allowedTables?.length,
            blockRawQueries: this.config.blockRawQueries,
        });
    }
    /**
     * Validate SQL query
     */
    validateSQLQuery(query, parameters) {
        const threats = [];
        const warnings = [];
        // Check query length
        if (query.length > (this.config.maxQueryLength || 10000)) {
            threats.push(`Query exceeds maximum length of ${this.config.maxQueryLength} characters`);
        }
        // Check parameter count
        if (parameters && parameters.length > (this.config.maxParameterCount || 100)) {
            threats.push(`Too many parameters: ${parameters.length}`);
        }
        // Check for SQL injection patterns
        for (const pattern of this.SQL_INJECTION_PATTERNS) {
            const matches = query.match(pattern);
            if (matches) {
                threats.push(`Potential SQL injection pattern detected: ${matches.join(', ')}`);
            }
        }
        // Check for table access
        if (this.config.allowedTables && this.config.allowedTables.length > 0) {
            const tablePattern = /\b(FROM|INTO|UPDATE|TABLE)\s+([`'"]?)(\w+)\2/gi;
            let match;
            while ((match = tablePattern.exec(query)) !== null) {
                const table = match[3];
                if (!this.config.allowedTables.includes(table)) {
                    threats.push(`Access to table '${table}' is not allowed`);
                }
            }
        }
        // Check for column access
        if (this.config.allowedColumns && this.config.allowedColumns.size > 0) {
            const selectPattern = /SELECT\s+(.*?)\s+FROM\s+([`'"]?)(\w+)\2/gi;
            let match;
            while ((match = selectPattern.exec(query)) !== null) {
                const columns = match[1];
                const table = match[3];
                const allowedCols = this.config.allowedColumns.get(table);
                if (allowedCols && columns !== '*') {
                    const selectedCols = columns.split(',').map(c => c.trim().replace(/[`'"]/g, ''));
                    for (const col of selectedCols) {
                        if (!allowedCols.includes(col)) {
                            warnings.push(`Access to column '${col}' in table '${table}' may be restricted`);
                        }
                    }
                }
            }
        }
        // Validate parameters
        if (this.config.enableParameterValidation && parameters) {
            const paramValidation = this.validateParameters(parameters);
            if (paramValidation.threats.length > 0) {
                threats.push(...paramValidation.threats);
            }
        }
        // Log suspicious queries
        if (this.config.logSuspiciousQueries && threats.length > 0) {
            logger.warn('Suspicious SQL query detected', {
                query: query.substring(0, 200),
                threats,
            });
        }
        return {
            safe: threats.length === 0,
            threats,
            warnings,
        };
    }
    /**
     * Validate NoSQL query
     */
    validateNoSQLQuery(query) {
        const threats = [];
        const warnings = [];
        const queryStr = JSON.stringify(query);
        // Check for NoSQL injection patterns
        for (const pattern of this.NOSQL_INJECTION_PATTERNS) {
            const matches = queryStr.match(pattern);
            if (matches) {
                threats.push(`Potential NoSQL injection pattern detected: ${matches.join(', ')}`);
            }
        }
        // Check for JavaScript code injection
        if (typeof query === 'object') {
            this.checkObjectForInjection(query, threats, warnings);
        }
        // Log suspicious queries
        if (this.config.logSuspiciousQueries && threats.length > 0) {
            logger.warn('Suspicious NoSQL query detected', {
                query: queryStr.substring(0, 200),
                threats,
            });
        }
        return {
            safe: threats.length === 0,
            threats,
            warnings,
        };
    }
    /**
     * Check object for injection patterns
     */
    checkObjectForInjection(obj, threats, warnings, depth = 0) {
        if (depth > 10) {
            warnings.push('Query object too deeply nested');
            return;
        }
        for (const [key, value] of Object.entries(obj)) {
            // Check for dangerous operators
            if (key.startsWith('$')) {
                const dangerousOps = ['$where', '$function', '$accumulator', '$exec'];
                if (dangerousOps.includes(key)) {
                    threats.push(`Dangerous NoSQL operator detected: ${key}`);
                }
            }
            // Check string values for code
            if (typeof value === 'string') {
                if (/function\s*\(/.test(value) || /\beval\s*\(/.test(value)) {
                    threats.push('JavaScript code detected in query value');
                }
            }
            // Recurse for nested objects
            if (typeof value === 'object' && value !== null) {
                this.checkObjectForInjection(value, threats, warnings, depth + 1);
            }
        }
    }
    /**
     * Validate query parameters
     */
    validateParameters(parameters) {
        const threats = [];
        for (const param of parameters) {
            if (typeof param === 'string') {
                // Check for SQL keywords in parameters
                const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|EXEC|UNION)\b/gi;
                if (sqlKeywords.test(param)) {
                    threats.push('SQL keywords detected in parameter value');
                }
                // Check for special characters that might break out of quotes
                if (param.includes("'") || param.includes('"') || param.includes('\\')) {
                    // This is often legitimate, so just log as info
                    logger.debug('Special characters in parameter', { param: param.substring(0, 50) });
                }
            }
            // Check for buffer overflow attempts
            if (typeof param === 'string' && param.length > 10000) {
                threats.push('Parameter value exceeds safe length');
            }
        }
        return { threats };
    }
    /**
     * Create safe parameterized query
     */
    createParameterizedQuery(template, params) {
        const parameters = [];
        let paramIndex = 1;
        // Replace named parameters with positional ones
        const query = template.replace(/:(\w+)/g, (match, name) => {
            if (params.hasOwnProperty(name)) {
                parameters.push(params[name]);
                return '$' + paramIndex++;
            }
            return match;
        });
        // Validate the resulting query
        const validation = this.validateSQLQuery(query, parameters);
        if (!validation.safe) {
            throw new Error(`Unsafe query: ${validation.threats?.join(', ')}`);
        }
        return { query, parameters };
    }
    /**
     * Sanitize identifier (table/column name)
     */
    sanitizeIdentifier(identifier) {
        // Remove everything except alphanumeric and underscore
        const sanitized = identifier.replace(/[^\w]/g, '');
        // Check against allowed lists if configured
        if (this.config.allowedTables?.length && !this.config.allowedTables.includes(sanitized)) {
            throw new Error(`Identifier '${sanitized}' is not in the allowed list`);
        }
        return sanitized;
    }
    /**
     * Escape string value
     */
    escapeString(value) {
        return value
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/\x00/g, '\\x00')
            .replace(/\x1a/g, '\\x1a');
    }
    /**
     * Build safe WHERE clause
     */
    buildWhereClause(conditions) {
        const clauses = [];
        const parameters = [];
        let paramIndex = 1;
        for (const [field, value] of Object.entries(conditions)) {
            const sanitizedField = this.sanitizeIdentifier(field);
            if (value === null) {
                clauses.push(`${sanitizedField} IS NULL`);
            }
            else if (Array.isArray(value)) {
                const placeholders = value.map(() => '$' + paramIndex++).join(', ');
                clauses.push(`${sanitizedField} IN (${placeholders})`);
                parameters.push(...value);
            }
            else if (typeof value === 'object' && value.operator) {
                // Support operators like {operator: '>', value: 10}
                const allowedOps = ['=', '!=', '<>', '>', '<', '>=', '<=', 'LIKE', 'ILIKE'];
                if (!allowedOps.includes(value.operator)) {
                    throw new Error(`Invalid operator: ${value.operator}`);
                }
                clauses.push(`${sanitizedField} ${value.operator} $${paramIndex++}`);
                parameters.push(value.value);
            }
            else {
                clauses.push(`${sanitizedField} = $${paramIndex++}`);
                parameters.push(value);
            }
        }
        return {
            clause: clauses.join(' AND '),
            parameters,
        };
    }
    /**
     * Build safe INSERT query
     */
    buildInsertQuery(table, data) {
        const sanitizedTable = this.sanitizeIdentifier(table);
        const fields = [];
        const placeholders = [];
        const parameters = [];
        let paramIndex = 1;
        for (const [field, value] of Object.entries(data)) {
            fields.push(this.sanitizeIdentifier(field));
            placeholders.push('$' + paramIndex++);
            parameters.push(value);
        }
        const query = `INSERT INTO ${sanitizedTable} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
        return { query, parameters };
    }
    /**
     * Build safe UPDATE query
     */
    buildUpdateQuery(table, data, conditions) {
        const sanitizedTable = this.sanitizeIdentifier(table);
        const setClauses = [];
        const parameters = [];
        let paramIndex = 1;
        // Build SET clause
        for (const [field, value] of Object.entries(data)) {
            setClauses.push(`${this.sanitizeIdentifier(field)} = $${paramIndex++}`);
            parameters.push(value);
        }
        // Build WHERE clause
        const whereClause = this.buildWhereClause(conditions);
        parameters.push(...whereClause.parameters);
        const query = `UPDATE ${sanitizedTable} SET ${setClauses.join(', ')} WHERE ${whereClause.clause}`;
        return { query, parameters };
    }
    /**
     * Middleware for query protection
     */
    middleware() {
        return (req, res, next) => {
            // Override query methods with protected versions
            if (req.db) {
                const originalQuery = req.db.query.bind(req.db);
                req.db.query = async (query, params) => {
                    const validation = this.validateSQLQuery(query, params);
                    if (!validation.safe && this.config.blockRawQueries) {
                        logger.error('Blocked unsafe query', {
                            query: query.substring(0, 200),
                            threats: validation.threats,
                        });
                        throw new Error('Query blocked for security reasons');
                    }
                    return originalQuery(query, params);
                };
            }
            next();
        };
    }
}
// Export singleton instance
export const queryProtection = QueryProtectionService.getInstance();
// Export convenience functions
export const sanitizeIdentifier = (id) => queryProtection.sanitizeIdentifier(id);
export const escapeString = (str) => queryProtection.escapeString(str);
export const buildWhereClause = (conditions) => queryProtection.buildWhereClause(conditions);
export const buildInsertQuery = (table, data) => queryProtection.buildInsertQuery(table, data);
export const buildUpdateQuery = (table, data, conditions) => queryProtection.buildUpdateQuery(table, data, conditions);
//# sourceMappingURL=queryProtection.js.map