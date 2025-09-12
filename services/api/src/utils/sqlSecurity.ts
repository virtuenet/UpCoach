import { QueryTypes, Sequelize } from 'sequelize';

import { logger } from './logger';

/**
 * SQL Query Security Utilities
 * Provides safe query building and execution methods
 */

/**
 * Validates and sanitizes table/column names to prevent SQL injection
 * @param identifier Table or column name
 * @returns Sanitized identifier
 */
export function sanitizeIdentifier(identifier: string): string {
  // Only allow alphanumeric characters and underscores
  const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '');

  if (sanitized !== identifier) {
    logger.warn('Identifier sanitized', {
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
export function buildWhereClause(
  conditions: Array<{
    column: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';
    value: any;
    paramName?: string;
  }>
): { clause: string; replacements: Record<string, any> } {
  const clauses: string[] = [];
  const replacements: Record<string, any> = {};

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
export function buildInsertQuery(
  table: string,
  data: Record<string, any>,
  returning?: string
): { query: string; replacements: Record<string, any> } {
  const tableName = sanitizeIdentifier(table);
  const columns: string[] = [];
  const values: string[] = [];
  const replacements: Record<string, any> = {};

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
export function buildUpdateQuery(
  table: string,
  data: Record<string, any>,
  conditions: Array<{ column: string; operator: string; value: any }>
): { query: string; replacements: Record<string, any> } {
  const tableName = sanitizeIdentifier(table);
  const updates: string[] = [];
  const replacements: Record<string, any> = {};

  // Build SET clause
  Object.entries(data).forEach(([column, value]) => {
    const sanitizedColumn = sanitizeIdentifier(column);
    const paramName = `update_${sanitizedColumn}`;
    updates.push(`${sanitizedColumn} = :${paramName}`);
    replacements[paramName] = value;
  });

  // Build WHERE clause
  const whereClause = buildWhereClause(
    conditions.map((c, i) => ({ ...c, paramName: `where_${i}` }) as any)
  );

  Object.assign(replacements, whereClause.replacements);

  const query = `UPDATE ${tableName} SET ${updates.join(', ')} ${whereClause.clause}`;

  return { query, replacements };
}

/**
 * Validates query parameters to prevent injection
 * @param params Query parameters
 * @returns Validated parameters
 */
export function validateQueryParams(params: Record<string, any>): Record<string, any> {
  const validated: Record<string, any> = {};

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
        } else if (Array.isArray(value)) {
          validated[key] = value.map(v => (typeof v === 'string' ? v.replace(/[;'"]/g, '') : v));
        } else {
          validated[key] = JSON.stringify(value);
        }
        break;

      default:
        logger.warn('Unexpected parameter type', { key, type: typeof value });
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
export async function executeSecureQuery(
  sequelize: Sequelize,
  query: string,
  replacements: Record<string, any>,
  type: QueryTypes
): Promise<any> {
  try {
    // Validate all parameters
    const validatedReplacements = validateQueryParams(replacements);

    // Log query for audit (without sensitive data)
    logger.debug('Executing secure query', {
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
        logger.debug('SQL executed', {
          sql: sql.substring(0, 100) + '...',
        });
      },
    });

    return result;
  } catch (error) {
    logger.error('Secure query execution failed', {
      error: (error as Error).message,
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
export function createSafeSubquery(query: string, alias: string): string {
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
export function buildJoinClause(
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL',
  table: string,
  alias: string,
  conditions: Array<{ left: string; right: string }>
): string {
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
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}
