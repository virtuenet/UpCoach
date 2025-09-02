"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.SecureDB = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const logger_1 = require("./logger");
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
class SecureDB {
    /**
     * Validates and sanitizes table names
     */
    static validateTableName(table) {
        const sanitized = table.toLowerCase().trim();
        if (!ALLOWED_TABLES.has(sanitized)) {
            logger_1.logger.error('Attempted access to unauthorized table', { table, sanitized });
            throw new Error(`Unauthorized table access attempt`);
        }
        return sanitized;
    }
    /**
     * Validates column names to prevent injection
     */
    static validateColumnNames(columns) {
        for (const column of columns) {
            const sanitized = column.toLowerCase().trim();
            if (!ALLOWED_COLUMNS.has(sanitized) && !sanitized.match(/^[a-z_][a-z0-9_]*$/)) {
                logger_1.logger.error('Invalid column name detected', { column, sanitized });
                throw new Error(`Invalid column name`);
            }
        }
    }
    /**
     * Safely find one record with parameterized queries
     */
    static async findOne(table, conditions) {
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
            const [result] = await database_1.sequelize.query(query, {
                bind: Object.values(conditions),
                type: sequelize_1.QueryTypes.SELECT,
                logging: sql => logger_1.logger.debug('SecureDB query', { sql }),
            });
            return result || null;
        }
        catch (error) {
            logger_1.logger.error('SecureDB.findOne error', { table, conditions, error });
            throw error;
        }
    }
    /**
     * Safely find multiple records with parameterized queries
     */
    static async findAll(table, conditions, options) {
        try {
            const safeTable = this.validateTableName(table);
            const keys = Object.keys(conditions);
            this.validateColumnNames(keys);
            let query = `SELECT * FROM "${safeTable}"`;
            const bindings = [];
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
            const results = await database_1.sequelize.query(query, {
                bind: bindings,
                type: sequelize_1.QueryTypes.SELECT,
                logging: sql => logger_1.logger.debug('SecureDB query', { sql }),
            });
            return results;
        }
        catch (error) {
            logger_1.logger.error('SecureDB.findAll error', { table, conditions, options, error });
            throw error;
        }
    }
    /**
     * Safely insert a record with parameterized queries
     */
    static async insert(table, data) {
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
            const [result] = await database_1.sequelize.query(query, {
                bind: Object.values(data),
                type: sequelize_1.QueryTypes.SELECT,
                logging: sql => logger_1.logger.debug('SecureDB insert', { sql }),
            });
            return result[0];
        }
        catch (error) {
            logger_1.logger.error('SecureDB.insert error', { table, data, error });
            throw error;
        }
    }
    /**
     * Safely update records with parameterized queries
     */
    static async update(table, data, conditions) {
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
            const bindings = [];
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
            const [, affectedRows] = await database_1.sequelize.query(query, {
                bind: bindings,
                type: sequelize_1.QueryTypes.UPDATE,
                logging: sql => logger_1.logger.debug('SecureDB update', { sql }),
            });
            return affectedRows;
        }
        catch (error) {
            logger_1.logger.error('SecureDB.update error', { table, data, conditions, error });
            throw error;
        }
    }
    /**
     * Safely delete records with parameterized queries
     */
    static async delete(table, conditions) {
        try {
            const safeTable = this.validateTableName(table);
            const keys = Object.keys(conditions);
            if (keys.length === 0) {
                throw new Error('No conditions provided for delete - this would delete all records');
            }
            this.validateColumnNames(keys);
            const whereClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(' AND ');
            const query = `DELETE FROM "${safeTable}" WHERE ${whereClause}`;
            const result = await database_1.sequelize.query(query, {
                bind: Object.values(conditions),
                type: sequelize_1.QueryTypes.DELETE,
                logging: sql => logger_1.logger.debug('SecureDB delete', { sql }),
            });
            const affectedRows = Array.isArray(result) && result.length > 1 ? result[1] : 0;
            return affectedRows;
        }
        catch (error) {
            logger_1.logger.error('SecureDB.delete error', { table, conditions, error });
            throw error;
        }
    }
    /**
     * Execute raw query with parameter binding (use with caution)
     */
    static async rawQuery(sql, bindings, type) {
        try {
            // Log raw queries for security audit
            logger_1.logger.warn('Raw query execution', { sql, bindingsCount: bindings?.length });
            const result = await database_1.sequelize.query(sql, {
                bind: bindings,
                type: type || sequelize_1.QueryTypes.SELECT,
                logging: sql => logger_1.logger.debug('SecureDB raw query', { sql }),
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('SecureDB.rawQuery error', { sql, error });
            throw error;
        }
    }
}
exports.SecureDB = SecureDB;
// Export for backward compatibility
exports.db = SecureDB;
//# sourceMappingURL=dbSecurity.js.map