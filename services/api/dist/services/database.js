"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.DatabaseService = void 0;
const pg_1 = require("pg");
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
class DatabaseService {
    static instance;
    pool = null;
    constructor() { }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    static async initialize() {
        const instance = DatabaseService.getInstance();
        await instance.connect();
    }
    static async disconnect() {
        const instance = DatabaseService.getInstance();
        await instance.close();
    }
    static getPool() {
        const instance = DatabaseService.getInstance();
        if (!instance.pool) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return instance.pool;
    }
    async connect() {
        try {
            this.pool = new pg_1.Pool({
                connectionString: environment_1.config.databaseUrl,
                ssl: environment_1.config.env === 'production' ? { rejectUnauthorized: false } : false,
                max: 20, // Maximum number of clients in the pool
                idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
                connectionTimeoutMillis: 2000, // How long to wait for a connection
            });
            // Test the connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            logger_1.logger.info('✅ Database connected successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            logger_1.logger.info('Database connection closed');
        }
    }
    async query(text, params) {
        if (!this.pool) {
            throw new Error('Database not initialized');
        }
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            logger_1.logger.debug('Executed query', {
                text: text.replace(/\s+/g, ' ').trim(),
                duration: `${duration}ms`,
                rows: result.rowCount,
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Database query error:', {
                text: text.replace(/\s+/g, ' ').trim(),
                params,
                error: error instanceof Error ? error.message : error,
            });
            throw error;
        }
    }
    async getClient() {
        if (!this.pool) {
            throw new Error('Database not initialized');
        }
        return this.pool.connect();
    }
    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    // Helper methods for common database operations
    async findOne(table, conditions, columns = ['*']) {
        const whereClause = Object.keys(conditions)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(' AND ');
        const query = `
      SELECT ${columns.join(', ')}
      FROM ${table}
      WHERE ${whereClause}
      LIMIT 1
    `;
        const values = Object.values(conditions);
        const result = await this.query(query, values);
        return result.rows[0] || null;
    }
    async findMany(table, conditions = {}, options = {}) {
        const { columns = ['*'], orderBy, limit, offset } = options;
        let query = `SELECT ${columns.join(', ')} FROM ${table}`;
        const values = [];
        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(' AND ');
            query += ` WHERE ${whereClause}`;
            values.push(...Object.values(conditions));
        }
        if (orderBy) {
            query += ` ORDER BY ${orderBy}`;
        }
        if (limit) {
            query += ` LIMIT ${limit}`;
        }
        if (offset) {
            query += ` OFFSET ${offset}`;
        }
        const result = await this.query(query, values);
        return result.rows;
    }
    async insert(table, data, returning = ['*']) {
        const columns = Object.keys(data);
        const placeholders = columns.map((_, index) => `$${index + 1}`);
        const values = Object.values(data);
        const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING ${returning.join(', ')}
    `;
        const result = await this.query(query, values);
        return result.rows[0];
    }
    async update(table, data, conditions, returning = ['*']) {
        const setClause = Object.keys(data)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(', ');
        const whereClause = Object.keys(conditions)
            .map((key, index) => `${key} = $${Object.keys(data).length + index + 1}`)
            .join(' AND ');
        const query = `
      UPDATE ${table}
      SET ${setClause}, updated_at = NOW()
      WHERE ${whereClause}
      RETURNING ${returning.join(', ')}
    `;
        const values = [...Object.values(data), ...Object.values(conditions)];
        const result = await this.query(query, values);
        return result.rows[0] || null;
    }
    async delete(table, conditions) {
        const whereClause = Object.keys(conditions)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(' AND ');
        const query = `DELETE FROM ${table} WHERE ${whereClause}`;
        const values = Object.values(conditions);
        const result = await this.query(query, values);
        return result.rowCount || 0;
    }
}
exports.DatabaseService = DatabaseService;
// Export singleton instance
exports.db = DatabaseService.getInstance();
//# sourceMappingURL=database.js.map