import { QueryTypes } from 'sequelize';

import { sequelize } from '../config/database';

import { logger } from './logger';

// Whitelist of allowed table names to prevent SQL injection
const ALLOWED_TABLES = new Set([
  'users',
  'subscriptions',
  'transactions',
  'goals',
  'coach_sessions',
  'organizations',
  'organization_members',
  'financial_snapshots',
  'billing_events',
  'coach_profiles',
  'user_profiles',
  'ai_interactions',
  'security_logs',
  'audit_logs',
]);

// Whitelist of allowed column names for common operations
const ALLOWED_COLUMNS = new Set([
  'id',
  'user_id',
  'organization_id',
  'coach_id',
  'client_id',
  'email',
  'status',
  'created_at',
  'updated_at',
  'deleted_at',
  'name',
  'type',
  'amount',
  'currency',
  'description',
]);

export class SecureDB {
  /**
   * Validates and sanitizes table names
   */
  private static validateTableName(table: string): string {
    const sanitized = table.toLowerCase().trim();
    if (!ALLOWED_TABLES.has(sanitized)) {
      logger.error('Attempted access to unauthorized table', { table, sanitized });
      throw new Error(`Unauthorized table access attempt`);
    }
    return sanitized;
  }

  /**
   * Validates column names to prevent injection
   */
  private static validateColumnNames(columns: string[]): void {
    for (const column of columns) {
      const sanitized = column.toLowerCase().trim();
      if (!ALLOWED_COLUMNS.has(sanitized) && !sanitized.match(/^[a-z_][a-z0-9_]*$/)) {
        logger.error('Invalid column name detected', { column, sanitized });
        throw new Error(`Invalid column name`);
      }
    }
  }

  /**
   * Safely find one record with parameterized queries
   */
  static async findOne<T>(table: string, conditions: Record<string, any>): Promise<T | null> {
    try {
      const safeTable = this.validateTableName(table);
      const keys = Object.keys(conditions);

      if (keys.length === 0) {
        throw new Error('No conditions provided');
      }

      this.validateColumnNames(keys);

      // Build parameterized query
      const whereClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(' AND ');
      const query = `SELECT * FROM "${safeTable}" WHERE ${whereClause} LIMIT 1`;

      const [result] = await sequelize.query(query, {
        bind: Object.values(conditions),
        type: QueryTypes.SELECT,
        logging: sql => logger.debug('SecureDB query', { sql }),
      });

      return (result as T) || null;
    } catch (error) {
      logger.error('SecureDB.findOne error', { table, conditions, error });
      throw error;
    }
  }

  /**
   * Safely find multiple records with parameterized queries
   */
  static async findAll<T>(
    table: string,
    conditions: Record<string, any>,
    options?: { limit?: number; offset?: number; orderBy?: string }
  ): Promise<T[]> {
    try {
      const safeTable = this.validateTableName(table);
      const keys = Object.keys(conditions);

      this.validateColumnNames(keys);

      let query = `SELECT * FROM "${safeTable}"`;
      const bindings: unknown[] = [];

      if (keys.length > 0) {
        const whereClause = keys
          .map((key, _index) => {
            bindings.push(conditions[key]);
            return `"${key}" = $${bindings.length}`;
          })
          .join(' AND ');
        query += ` WHERE ${whereClause}`;
      }

      if (options?.orderBy) {
        const [column, direction = 'ASC'] = options.orderBy.split(' ');
        this.validateColumnNames([column]);
        query += ` ORDER BY "${column}" ${direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
      }

      if (options?.limit) {
        query += ` LIMIT ${parseInt(options.limit.toString(), 10)}`;
      }

      if (options?.offset) {
        query += ` OFFSET ${parseInt(options.offset.toString(), 10)}`;
      }

      const results = await sequelize.query(query, {
        bind: bindings,
        type: QueryTypes.SELECT,
        logging: sql => logger.debug('SecureDB query', { sql }),
      });

      return results as T[];
    } catch (error) {
      logger.error('SecureDB.findAll error', { table, conditions, options, error });
      throw error;
    }
  }

  /**
   * Safely insert a record with parameterized queries
   */
  static async insert<T>(table: string, data: Record<string, any>): Promise<T> {
    try {
      const safeTable = this.validateTableName(table);
      const keys = Object.keys(data);

      if (keys.length === 0) {
        throw new Error('No data provided for insert');
      }

      this.validateColumnNames(keys);

      const columns = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
      const query = `INSERT INTO "${safeTable}" (${columns}) VALUES (${placeholders}) RETURNING *`;

      const [result] = await sequelize.query(query, {
        bind: Object.values(data),
        type: QueryTypes.SELECT,
        logging: sql => logger.debug('SecureDB insert', { sql }),
      });

      return result[0] as T;
    } catch (error) {
      logger.error('SecureDB.insert error', { table, data, error });
      throw error;
    }
  }

  /**
   * Safely update records with parameterized queries
   */
  static async update(
    table: string,
    data: Record<string, any>,
    conditions: Record<string, any>
  ): Promise<number> {
    try {
      const safeTable = this.validateTableName(table);
      const dataKeys = Object.keys(data);
      const conditionKeys = Object.keys(conditions);

      if (dataKeys.length === 0) {
        throw new Error('No data provided for update');
      }

      if (conditionKeys.length === 0) {
        throw new Error('No conditions provided for update - this would update all records');
      }

      this.validateColumnNames([...dataKeys, ...conditionKeys]);

      const bindings: unknown[] = [];

      // Build SET clause
      const setClause = dataKeys
        .map(key => {
          bindings.push(data[key]);
          return `"${key}" = $${bindings.length}`;
        })
        .join(', ');

      // Build WHERE clause
      const whereClause = conditionKeys
        .map(key => {
          bindings.push(conditions[key]);
          return `"${key}" = $${bindings.length}`;
        })
        .join(' AND ');

      const query = `UPDATE "${safeTable}" SET ${setClause} WHERE ${whereClause}`;

      const [, affectedRows] = await sequelize.query(query, {
        bind: bindings,
        type: QueryTypes.UPDATE,
        logging: sql => logger.debug('SecureDB update', { sql }),
      });

      return affectedRows;
    } catch (error) {
      logger.error('SecureDB.update error', { table, data, conditions, error });
      throw error;
    }
  }

  /**
   * Safely delete records with parameterized queries
   */
  static async delete(table: string, conditions: Record<string, any>): Promise<number> {
    try {
      const safeTable = this.validateTableName(table);
      const keys = Object.keys(conditions);

      if (keys.length === 0) {
        throw new Error('No conditions provided for delete - this would delete all records');
      }

      this.validateColumnNames(keys);

      const whereClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(' AND ');
      const query = `DELETE FROM "${safeTable}" WHERE ${whereClause}`;

      const result = await sequelize.query(query, {
        bind: Object.values(conditions),
        type: QueryTypes.DELETE,
        logging: sql => logger.debug('SecureDB delete', { sql }),
      });
      const affectedRows = Array.isArray(result) && result.length > 1 ? result[1] : 0;

      return affectedRows;
    } catch (error) {
      logger.error('SecureDB.delete error', { table, conditions, error });
      throw error;
    }
  }

  /**
   * Execute raw query with parameter binding (use with caution)
   */
  static async rawQuery<T>(sql: string, bindings?: unknown[], type?: QueryTypes): Promise<T> {
    try {
      // Log raw queries for security audit
      logger.warn('Raw query execution', { sql, bindingsCount: bindings?.length });

      const result = await sequelize.query(sql, {
        bind: bindings,
        type: type || QueryTypes.SELECT,
        logging: sql => logger.debug('SecureDB raw query', { sql }),
      });

      return result as T;
    } catch (error) {
      logger.error('SecureDB.rawQuery error', { sql, error });
      throw error;
    }
  }
}

// Export for backward compatibility
export const db = SecureDB;
