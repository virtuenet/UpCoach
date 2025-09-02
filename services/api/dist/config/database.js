"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.sequelize = void 0;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
exports.query = query;
exports.transaction = transaction;
exports.getClient = getClient;
exports.healthCheck = healthCheck;
exports.getPoolStats = getPoolStats;
const logger_1 = require("../utils/logger");
const sequelize_1 = require("./sequelize");
Object.defineProperty(exports, "sequelize", { enumerable: true, get: function () { return sequelize_1.sequelize; } });
// Initialize database connection
async function initializeDatabase() {
    try {
        await sequelize_1.sequelize.authenticate();
        logger_1.logger.info('Database connection established successfully.');
        // Sync models with database - temporarily disabled for debugging
        // if (env === 'development') {
        //   await sequelize.sync({ alter: true });
        //   logger.info('Database models synchronized.');
        // }
        logger_1.logger.info('Database sync disabled for debugging.');
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to the database:', error);
        throw error;
    }
}
// Close database connection
async function closeDatabase() {
    try {
        await sequelize_1.sequelize.close();
        logger_1.logger.info('Database connection closed.');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connection:', error);
        throw error;
    }
}
/**
 * Execute a query with the database pool
 */
async function query(text, params) {
    try {
        const start = Date.now();
        const [results] = await sequelize_1.sequelize.query(text, {
            replacements: params,
            raw: true,
        });
        const duration = Date.now() - start;
        logger_1.logger.info('Executed query', {
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            duration: `${duration}ms`,
            rows: Array.isArray(results) ? results.length : 0,
        });
        return { rows: results, rowCount: Array.isArray(results) ? results.length : 0 };
    }
    catch (error) {
        logger_1.logger.error('Database query error:', {
            query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            error: error instanceof Error ? error.message : String(error),
            params: params ? params.length : 0,
        });
        throw error;
    }
}
/**
 * Execute queries within a transaction
 */
async function transaction(callback) {
    const t = await sequelize_1.sequelize.transaction();
    try {
        logger_1.logger.info('Transaction started');
        const result = await callback(t);
        await t.commit();
        logger_1.logger.info('Transaction committed');
        return result;
    }
    catch (error) {
        await t.rollback();
        logger_1.logger.info('Transaction rolled back');
        logger_1.logger.error('Transaction error:', error);
        throw error;
    }
}
/**
 * Get a database client from the pool (for advanced usage)
 */
async function getClient() {
    // In Sequelize, we return the sequelize instance itself
    return sequelize_1.sequelize;
}
/**
 * Check database health
 */
async function healthCheck() {
    try {
        const result = await query('SELECT 1 as health');
        return result.rows[0]?.health === 1;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return false;
    }
}
/**
 * Get database pool stats
 */
function getPoolStats() {
    // Sequelize doesn't expose pool stats directly in the same way
    // Return basic connection info
    return {
        dialect: sequelize_1.sequelize.getDialect(),
        database: sequelize_1.sequelize.getDatabaseName(),
        connected: sequelize_1.sequelize
            .authenticate()
            .then(() => true)
            .catch(() => false),
    };
}
// Database utility functions
exports.db = {
    query,
    transaction,
    getClient,
    healthCheck,
    getPoolStats,
    // Helper methods now use secure parameterized queries from dbSecurity
    // Import at the top of the file: import { SecureDB } from '../utils/dbSecurity';
    async findOne(table, conditions) {
        // Use SecureDB for safe parameterized queries
        const { SecureDB } = require('../utils/dbSecurity');
        return SecureDB.findOne(table, conditions);
    },
    async findMany(table, conditions = {}, options = {}) {
        // Use SecureDB for safe parameterized queries
        const { SecureDB } = require('../utils/dbSecurity');
        const orderBy = options.orderBy
            ? `${options.orderBy} ${options.orderDirection || 'ASC'}`
            : undefined;
        return SecureDB.findAll(table, conditions, {
            limit: options.limit,
            offset: options.offset,
            orderBy,
        });
    },
    async insert(table, data) {
        // Use SecureDB for safe parameterized queries
        const { SecureDB } = require('../utils/dbSecurity');
        return SecureDB.insert(table, data);
    },
    async update(table, data, conditions) {
        // Use SecureDB for safe parameterized queries
        const { SecureDB } = require('../utils/dbSecurity');
        const affectedRows = await SecureDB.update(table, data, conditions);
        if (affectedRows > 0) {
            // Fetch and return the updated record
            return SecureDB.findOne(table, conditions);
        }
        return null;
    },
    async delete(table, conditions) {
        // Use SecureDB for safe parameterized queries
        const { SecureDB } = require('../utils/dbSecurity');
        return SecureDB.delete(table, conditions);
    },
    async count(table, conditions = {}) {
        // Use SecureDB for safe parameterized queries
        const { SecureDB } = require('../utils/dbSecurity');
        const results = await SecureDB.findAll(table, conditions);
        return results.length;
    },
    async exists(table, conditions) {
        const { SecureDB } = require('../utils/dbSecurity');
        const result = await SecureDB.findOne(table, conditions);
        return result !== null;
    },
};
// Handle graceful shutdown
process.on('SIGINT', async () => {
    await closeDatabase();
});
process.on('SIGTERM', async () => {
    await closeDatabase();
});
//# sourceMappingURL=database.js.map