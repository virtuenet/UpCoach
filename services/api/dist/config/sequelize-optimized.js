"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionManager = exports.performanceMonitor = exports.sequelize = void 0;
const tslib_1 = require("tslib");
const dotenv = tslib_1.__importStar(require("dotenv"));
const sequelize_1 = require("sequelize");
const logger_1 = require("../utils/logger");
const secrets_manager_1 = require("./secrets-manager");
dotenv.config();
const createOptimizedSequelize = () => {
    const dbUrl = (0, secrets_manager_1.getSecret)('DATABASE_URL', true);
    const poolConfig = {
        max: parseInt(process.env.DB_POOL_MAX || '20'),
        min: parseInt(process.env.DB_POOL_MIN || '5'),
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'),
        idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
        evict: parseInt(process.env.DB_POOL_EVICT || '5000'),
        handleDisconnects: true,
        validate: (client) => {
            return !client.connection._ending;
        }
    };
    const sequelizeOptions = {
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ?
            (sql, timing) => {
                logger_1.logger.debug('SQL Query', {
                    sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
                    timing: timing ? `${timing}ms` : 'N/A'
                });
            } : false,
        pool: poolConfig,
        benchmark: true,
        omitNull: true,
        native: false,
        query: {
            nest: false,
            raw: false,
        },
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false,
            keepAlive: true,
            statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
            query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '15000'),
            connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
            application_name: 'upcoach-api',
            options: '-c default_transaction_isolation=read_committed'
        },
        transactionType: 'IMMEDIATE',
        isolationLevel: 'READ_COMMITTED',
        retry: {
            max: 3,
            match: [
                /SQLITE_BUSY/,
                /SQLITE_LOCKED/,
                /connection terminated/,
                /Connection terminated/,
                /Connection terminated unexpectedly/,
                /Connection lost/,
                /ETIMEDOUT/,
                /EHOSTUNREACH/,
                /ECONNREFUSED/,
                /ECONNRESET/,
                /EPIPE/,
                /ENOTFOUND/,
                /EAI_AGAIN/
            ]
        },
        hooks: {
            beforeConnect: (config) => {
                logger_1.logger.debug('Database connection attempt', {
                    host: config.host,
                    database: config.database,
                    pool: config.pool
                });
            },
            afterConnect: (connection, config) => {
                logger_1.logger.info('Database connection established', {
                    host: config.host,
                    database: config.database,
                    processId: connection.processID
                });
            },
            beforeQuery: (options) => {
                options.startTime = Date.now();
            },
            afterQuery: (options) => {
                const duration = Date.now() - (options.startTime || 0);
                if (duration > 1000) {
                    logger_1.logger.warn('Slow query detected', {
                        sql: options.sql?.substring(0, 100) + '...',
                        duration: `${duration}ms`,
                        type: options.type
                    });
                }
            }
        },
        define: {
            timestamps: true,
            underscored: true,
            paranoid: false,
            freezeTableName: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        }
    };
    return new sequelize_1.Sequelize(dbUrl, sequelizeOptions);
};
exports.sequelize = createOptimizedSequelize();
exports.performanceMonitor = {
    getPoolStatus() {
        const pool = exports.sequelize.connectionManager?.pool;
        if (!pool)
            return null;
        return {
            used: pool.used?.length || 0,
            waiting: pool.pending?.length || 0,
            available: pool.available?.length || 0,
            max: pool.max || 0,
            min: pool.min || 0
        };
    },
    async getActiveConnections() {
        try {
            const [results] = await exports.sequelize.query(`
        SELECT
          count(*) as active_connections,
          count(*) FILTER (WHERE state = 'active') as active_queries,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);
            return results[0];
        }
        catch (error) {
            logger_1.logger.error('Failed to get active connections', error);
            return null;
        }
    },
    async getSlowQueries(limitMinutes = 5) {
        try {
            const [results] = await exports.sequelize.query(`
        SELECT
          query,
          mean_exec_time,
          calls,
          total_exec_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements
        WHERE mean_exec_time > 1000
          AND last_exec > now() - interval '${limitMinutes} minutes'
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `);
            return results;
        }
        catch (error) {
            logger_1.logger.error('Failed to get slow queries', error);
            return [];
        }
    },
    async healthCheck() {
        try {
            const start = Date.now();
            await exports.sequelize.authenticate();
            const duration = Date.now() - start;
            const poolStatus = this.getPoolStatus();
            const activeConnections = await this.getActiveConnections();
            return {
                healthy: true,
                response_time: duration,
                pool_status: poolStatus,
                active_connections: activeConnections,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed', error);
            return {
                healthy: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            };
        }
    }
};
exports.connectionManager = {
    async gracefulShutdown(timeoutMs = 30000) {
        logger_1.logger.info('Initiating graceful database shutdown');
        try {
            const shutdownPromise = exports.sequelize.close();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Shutdown timeout')), timeoutMs);
            });
            await Promise.race([shutdownPromise, timeoutPromise]);
            logger_1.logger.info('Database connection closed successfully');
        }
        catch (error) {
            logger_1.logger.error('Error during database shutdown', error);
            throw error;
        }
    },
    async warmupConnections() {
        logger_1.logger.info('Warming up database connections');
        try {
            const warmupPromises = [];
            const poolMax = parseInt(process.env.DB_POOL_MAX || '20');
            for (let i = 0; i < Math.min(5, poolMax); i++) {
                warmupPromises.push(exports.sequelize.query('SELECT 1 as warmup').catch(err => {
                    logger_1.logger.warn(`Warmup connection ${i} failed`, err);
                }));
            }
            await Promise.allSettled(warmupPromises);
            logger_1.logger.info('Database connection warmup completed');
        }
        catch (error) {
            logger_1.logger.error('Database warmup failed', error);
        }
    }
};
process.on('SIGINT', async () => {
    await exports.connectionManager.gracefulShutdown();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await exports.connectionManager.gracefulShutdown();
    process.exit(0);
});
if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
        try {
            const health = await exports.performanceMonitor.healthCheck();
            if (!health.healthy) {
                logger_1.logger.error('Database health check failed', health);
            }
            else if (health.response_time && health.response_time > 1000) {
                logger_1.logger.warn('Database response time high', health);
            }
        }
        catch (error) {
            logger_1.logger.error('Health check monitoring error', error);
        }
    }, 60000);
}
exports.default = exports.sequelize;
