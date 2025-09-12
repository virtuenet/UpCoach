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
function sanitizeIdentifier(identifier) {
    const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '');
    if (sanitized !== identifier) {
        logger_1.logger.warn('Identifier sanitized', {
            original: identifier,
            sanitized,
        });
    }
    return sanitized;
}
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
function buildUpdateQuery(table, data, conditions) {
    const tableName = sanitizeIdentifier(table);
    const updates = [];
    const replacements = {};
    Object.entries(data).forEach(([column, value]) => {
        const sanitizedColumn = sanitizeIdentifier(column);
        const paramName = `update_${sanitizedColumn}`;
        updates.push(`${sanitizedColumn} = :${paramName}`);
        replacements[paramName] = value;
    });
    const whereClause = buildWhereClause(conditions.map((c, i) => ({ ...c, paramName: `where_${i}` })));
    Object.assign(replacements, whereClause.replacements);
    const query = `UPDATE ${tableName} SET ${updates.join(', ')} ${whereClause.clause}`;
    return { query, replacements };
}
function validateQueryParams(params) {
    const validated = {};
    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) {
            validated[key] = value;
            continue;
        }
        switch (typeof value) {
            case 'string':
                const cleaned = value
                    .replace(/;/g, '')
                    .replace(/--/g, '')
                    .replace(/\/\*/g, '')
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
async function executeSecureQuery(sequelize, query, replacements, type) {
    try {
        const validatedReplacements = validateQueryParams(replacements);
        logger_1.logger.debug('Executing secure query', {
            queryType: type,
            paramCount: Object.keys(validatedReplacements).length,
        });
        const result = await sequelize.query(query, {
            replacements: validatedReplacements,
            type,
            raw: false,
            logging: sql => {
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
function createSafeSubquery(query, alias) {
    const sanitizedAlias = sanitizeIdentifier(alias);
    return `(${query}) AS ${sanitizedAlias}`;
}
function buildJoinClause(type, table, alias, conditions) {
    const sanitizedTable = sanitizeIdentifier(table);
    const sanitizedAlias = sanitizeIdentifier(alias);
    const onConditions = conditions
        .map(c => `${sanitizeIdentifier(c.left)} = ${sanitizeIdentifier(c.right)}`)
        .join(' AND ');
    return `${type} JOIN ${sanitizedTable} ${sanitizedAlias} ON ${onConditions}`;
}
function escapeLikePattern(pattern) {
    return pattern.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
//# sourceMappingURL=sqlSecurity.js.map