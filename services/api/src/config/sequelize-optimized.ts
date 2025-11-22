import * as dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';
import { getSecret } from './secrets-manager';

// Load environment variables
dotenv.config();

// Performance-optimized Sequelize configuration
const createOptimizedSequelize = (): Sequelize => {
  const dbUrl = getSecret('DATABASE_URL', true);

  // Production-optimized pool configuration
  const poolConfig = {
    max: parseInt(process.env.DB_POOL_MAX || '20'), // Increased from 5
    min: parseInt(process.env.DB_POOL_MIN || '5'),   // Increased from 0
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'), // Increased timeout
    idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
    evict: parseInt(process.env.DB_POOL_EVICT || '5000'), // Connection eviction
    handleDisconnects: true,
    validate: (client: unknown) => {
      // Custom connection validation
      return !client.connection._ending;
    }
  };

  // Performance-optimized Sequelize options
  const sequelizeOptions = {
    dialect: 'postgres' as const,
    logging: process.env.NODE_ENV === 'development' ?
      (sql: string, timing?: number) => {
        logger.debug('SQL Query', {
          sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
          timing: timing ? `${timing}ms` : 'N/A'
        });
      } : false,

    pool: poolConfig,

    // Performance optimizations
    benchmark: true, // Enable query timing
    omitNull: true,  // Optimize NULL handling
    native: false,   // Use pure JS driver for stability

    // Query optimizations
    query: {
      nest: false,   // Flatten nested results for performance
      raw: false,    // Keep Sequelize features enabled
    },

    // Connection optimizations
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
      // PostgreSQL-specific optimizations
      application_name: 'upcoach-api',
      options: '-c default_transaction_isolation=read_committed'
    },

    // Transaction optimization
    transactionType: 'IMMEDIATE',
    isolationLevel: 'READ_COMMITTED',

    // Retry configuration for resilience
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

    // Hooks for performance monitoring
    hooks: {
      beforeConnect: (config: unknown) => {
        logger.debug('Database connection attempt', {
          host: config.host,
          database: config.database,
          pool: config.pool
        });
      },
      afterConnect: (connection: unknown, config: unknown) => {
        logger.info('Database connection established', {
          host: config.host,
          database: config.database,
          processId: connection.processID
        });
      },
      beforeQuery: (options: unknown) => {
        options.startTime = Date.now();
      },
      afterQuery: (options: unknown) => {
        const duration = Date.now() - (options.startTime || 0);
        if (duration > 1000) {
          logger.warn('Slow query detected', {
            sql: options.sql?.substring(0, 100) + '...',
            duration: `${duration}ms`,
            type: options.type
          });
        }
      }
    },

    // Define associations loading strategy
    define: {
      timestamps: true,
      underscored: true,
      paranoid: false, // Disable soft deletes for performance unless needed
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  };

  return new Sequelize(dbUrl, sequelizeOptions);
};

// Create optimized instance
export const sequelize = createOptimizedSequelize();

// Performance monitoring utilities
export const performanceMonitor = {
  // Monitor connection pool status
  getPoolStatus() {
    const pool = (sequelize as unknown).connectionManager?.pool;
    if (!pool) return null;

    return {
      used: pool.used?.length || 0,
      waiting: pool.pending?.length || 0,
      available: pool.available?.length || 0,
      max: pool.max || 0,
      min: pool.min || 0
    };
  },

  // Monitor active connections
  async getActiveConnections() {
    try {
      const [results] = await sequelize.query(`
        SELECT
          count(*) as active_connections,
          count(*) FILTER (WHERE state = 'active') as active_queries,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);
      return results[0];
    } catch (error) {
      logger.error('Failed to get active connections', error);
      return null;
    }
  },

  // Monitor slow queries
  async getSlowQueries(limitMinutes: number = 5) {
    try {
      const [results] = await sequelize.query(`
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
    } catch (error) {
      logger.error('Failed to get slow queries', error);
      return [];
    }
  },

  // Health check with detailed metrics
  async healthCheck() {
    try {
      const start = Date.now();
      await sequelize.authenticate();
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
    } catch (error) {
      logger.error('Database health check failed', error);
      return {
        healthy: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }
};

// Connection lifecycle management
export const connectionManager = {
  // Graceful shutdown
  async gracefulShutdown(timeoutMs: number = 30000) {
    logger.info('Initiating graceful database shutdown');

    try {
      // Set a timeout for the shutdown process
      const shutdownPromise = sequelize.close();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Shutdown timeout')), timeoutMs);
      });

      await Promise.race([shutdownPromise, timeoutPromise]);
      logger.info('Database connection closed successfully');
    } catch (error) {
      logger.error('Error during database shutdown', error);
      throw error;
    }
  },

  // Connection warmup for better initial performance
  async warmupConnections() {
    logger.info('Warming up database connections');

    try {
      const warmupPromises = [];
      const poolMax = parseInt(process.env.DB_POOL_MAX || '20');

      // Create initial connections up to min pool size
      for (let i = 0; i < Math.min(5, poolMax); i++) {
        warmupPromises.push(
          sequelize.query('SELECT 1 as warmup').catch(err => {
            logger.warn(`Warmup connection ${i} failed`, err);
          })
        );
      }

      await Promise.allSettled(warmupPromises);
      logger.info('Database connection warmup completed');
    } catch (error) {
      logger.error('Database warmup failed', error);
    }
  }
};

// Setup graceful shutdown handlers
process.on('SIGINT', async () => {
  await connectionManager.gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await connectionManager.gracefulShutdown();
  process.exit(0);
});

// Performance monitoring interval
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    try {
      const health = await performanceMonitor.healthCheck();
      if (!health.healthy) {
        logger.error('Database health check failed', health);
      } else if (health.response_time && health.response_time > 1000) {
        logger.warn('Database response time high', health);
      }
    } catch (error) {
      logger.error('Health check monitoring error', error);
    }
  }, 60000); // Check every minute
}

// Export default instance
export default sequelize;