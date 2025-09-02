"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeIdentifier = sanitizeIdentifier;
exports.buildWhereClause = buildWhereClause;
exports.buildInsertQuery = buildInsertQuery;
exports.buildUpdateQuery = buildUpdateQuery;
exports.validateQueryParams = validateQueryParams;
exports.executeSecureQuery = executeSecureQuery;
exports.createSafeSubquery = createSafeSubquery;
exports.buildJoinClause = buildJoinClause;
exports.escapeLikePattern = escapeLikePattern;
const logger_1 = require("./logger");
/**
 * SQL Query Security Utilities
 * Provides safe query building and execution methods
 */
/**
 * Validates and sanitizes table/column names to prevent SQL injection
 * @param identifier Table or column name
 * @returns Sanitized identifier
 */
function sanitizeIdentifier(identifier) {
    // Only allow alphanumeric characters and underscores
    const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '');
    if (sanitized !== identifier) {
        logger_1.logger.warn('Identifier sanitized', {
            original: identifier,
            sanitized,
        });
    }
    return sanitized;
}
/**
 * Safely builds a WHERE clause with parameterized conditions
 * @param conditions Array of condition objects
 * @returns Object with WHERE clause and replacements
 */
function buildWhereClause(conditions) {
    const clauses = [];
    const replacements = {};
    conditions.forEach((condition, index) => {
        const column = sanitizeIdentifier(condition.column);
        const paramName = condition.paramName || `param${index}`;
        switch (condition.operator) {
            case 'IN':
                if (Array.isArray(condition.value)) {
                    const paramNames = condition.value.map((_, i) => `${paramName}_${i}`);
                    paramNames.forEach((name, i) => {
                        replacements[name] = condition.value[i];
                    });
                    clauses.push(`${column} IN (${paramNames.map(n => `:${n}`).join(', ')})`);
                }
                break;
            case 'BETWEEN':
                if (Array.isArray(condition.value) && condition.value.length === 2) {
                    replacements[`${paramName}_start`] = condition.value[0];
                    replacements[`${paramName}_end`] = condition.value[1];
                    clauses.push(`${column} BETWEEN :${paramName}_start AND :${paramName}_end`);
                }
                break;
            default:
                replacements[paramName] = condition.value;
                clauses.push(`${column} ${condition.operator} :${paramName}`);
        }
    });
    return {
        clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
        replacements,
    };
}
/**
 * Safely builds an INSERT query with parameterized values
 * @param table Table name
 * @param data Object with column-value pairs
 * @returns Object with query and replacements
 */
function buildInsertQuery(table, data, returning) {
    const tableName = sanitizeIdentifier(table);
    const columns = [];
    const values = [];
    const replacements = {};
    Object.entries(data).forEach(([column, value]) => {
        const sanitizedColumn = sanitizeIdentifier(column);
        columns.push(sanitizedColumn);
        values.push(`:${sanitizedColumn}`);
        replacements[sanitizedColumn] = value;
    });
    let query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
    if (returning) {
        query += ` RETURNING ${sanitizeIdentifier(returning)}`;
    }
    return { query, replacements };
}
/**
 * Safely builds an UPDATE query with parameterized values
 * @param table Table name
 * @param data Object with column-value pairs to update
 * @param conditions WHERE conditions
 * @returns Object with query and replacements
 */
function buildUpdateQuery(table, data, conditions) {
    const tableName = sanitizeIdentifier(table);
    const updates = [];
    const replacements = {};
    // Build SET clause
    Object.entries(data).forEach(([column, value]) => {
        const sanitizedColumn = sanitizeIdentifier(column);
        const paramName = `update_${sanitizedColumn}`;
        updates.push(`${sanitizedColumn} = :${paramName}`);
        replacements[paramName] = value;
    });
    // Build WHERE clause
    const whereClause = buildWhereClause(conditions.map((c, i) => ({ ...c, paramName: `where_${i}` })));
    Object.assign(replacements, whereClause.replacements);
    const query = `UPDATE ${tableName} SET ${updates.join(', ')} ${whereClause.clause}`;
    return { query, replacements };
}
/**
 * Validates query parameters to prevent injection
 * @param params Query parameters
 * @returns Validated parameters
 */
function validateQueryParams(params) {
    const validated = {};
    for (const [key, value] of Object.entries(params)) {
        // Skip null/undefined values
        if (value === null || value === undefined) {
            validated[key] = value;
            continue;
        }
        // Validate based on type
        switch (typeof value) {
            case 'string':
                // Remove any SQL keywords or dangerous patterns
                const cleaned = value
                    .replace(/;/g, '') // Remove semicolons
                    .replace(/--/g, '') // Remove SQL comments
                    .replace(/\/\*/g, '') // Remove block comments
                    .replace(/\*\//g, '');
                validated[key] = cleaned;
                break;
            case 'number':
            case 'boolean':
                validated[key] = value;
                break;
            case 'object':
                if (value instanceof Date) {
                    validated[key] = value;
                }
                else if (Array.isArray(value)) {
                    validated[key] = value.map(v => (typeof v === 'string' ? v.replace(/[;'"]/g, '') : v));
                }
                else {
                    validated[key] = JSON.stringify(value);
                }
                break;
            default:
                logger_1.logger.warn('Unexpected parameter type', { key, type: typeof value });
                validated[key] = String(value);
        }
    }
    return validated;
}
/**
 * Executes a parameterized query safely
 * @param sequelize Sequelize instance
 * @param query SQL query with parameters
 * @param replacements Parameter values
 * @param type Query type
 * @returns Query result
 */
async function executeSecureQuery(sequelize, query, replacements, type) {
    try {
        // Validate all parameters
        const validatedReplacements = validateQueryParams(replacements);
        // Log query for audit (without sensitive data)
        logger_1.logger.debug('Executing secure query', {
            queryType: type,
            paramCount: Object.keys(validatedReplacements).length,
        });
        // Execute query with parameterized replacements
        const result = await sequelize.query(query, {
            replacements: validatedReplacements,
            type,
            raw: false, // Never use raw mode for security
            logging: sql => {
                // Custom logging to avoid exposing sensitive data
                logger_1.logger.debug('SQL executed', {
                    sql: sql.substring(0, 100) + '...',
                });
            },
        });
        return result;
    }
    catch (error) {
        logger_1.logger.error('Secure query execution failed', {
            error: error.message,
            queryType: type,
        });
        throw new Error('Database query failed');
    }
}
/**
 * Creates a safe subquery for use in larger queries
 * @param query Subquery SQL
 * @param alias Table alias
 * @returns Sanitized subquery
 */
function createSafeSubquery(query, alias) {
    const sanitizedAlias = sanitizeIdentifier(alias);
    // Wrap subquery in parentheses and add alias
    return `(${query}) AS ${sanitizedAlias}`;
}
/**
 * Builds a safe JOIN clause
 * @param type JOIN type
 * @param table Table to join
 * @param alias Table alias
 * @param conditions ON conditions
 * @returns JOIN clause
 */
function buildJoinClause(type, table, alias, conditions) {
    const sanitizedTable = sanitizeIdentifier(table);
    const sanitizedAlias = sanitizeIdentifier(alias);
    const onConditions = conditions
        .map(c => `${sanitizeIdentifier(c.left)} = ${sanitizeIdentifier(c.right)}`)
        .join(' AND ');
    return `${type} JOIN ${sanitizedTable} ${sanitizedAlias} ON ${onConditions}`;
}
/**
 * Escapes string for use in LIKE patterns
 * @param pattern LIKE pattern
 * @returns Escaped pattern
 */
function escapeLikePattern(pattern) {
    return pattern.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
//# sourceMappingURL=sqlSecurity.js.map