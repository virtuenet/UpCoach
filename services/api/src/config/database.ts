import { logger } from '../utils/logger';
import { sequelize } from './sequelize';

// Re-export sequelize for compatibility
export { sequelize };

// Get sequelize instance (for services that need it)
export function getSequelize() {
  return sequelize;
}

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Authenticating database connection...');
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Initialize models after database connection is ready
    logger.info('Initializing models...');
    await initializeModels();
    logger.info('Models initialized successfully.');

    logger.info('Database initialization complete.');
  } catch (error) {
    logger.error('Database initialization failed:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
    });
    throw error;
  }
}

// Initialize all models after database connection is established
async function initializeModels(): Promise<void> {
  try {
    // Import and initialize models that have deferred initialization
    const { initializeAllModels } = await import('../models/modelInitializer');
    await initializeAllModels(sequelize);
  } catch (error) {
    logger.error('Failed to initialize models:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack trace',
    });
    throw error;
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  try {
    await sequelize.close();
    logger.info('Database connection closed.');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

/**
 * Execute a query with the database pool
 */
export async function query(text: string, params?: unknown[]): Promise<unknown> {
  try {
    const start = Date.now();
    const [results] = await sequelize.query(text, {
      replacements: params,
      raw: true,
    });
    const duration = Date.now() - start;

    logger.info('Executed query', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: Array.isArray(results) ? results.length : 0,
    });

    return { rows: results, rowCount: Array.isArray(results) ? results.length : 0 };
  } catch (error) {
    logger.error('Database query error:', {
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
export async function transaction<T>(callback: (transaction: unknown) => Promise<T>): Promise<T> {
  const t = await sequelize.transaction();

  try {
    logger.info('Transaction started');

    const result = await callback(t);

    await t.commit();
    logger.info('Transaction committed');

    return result;
  } catch (error) {
    await t.rollback();
    logger.info('Transaction rolled back');

    logger.error('Transaction error:', error);
    throw error;
  }
}

/**
 * Get a database client from the pool (for advanced usage)
 */
export async function getClient(): Promise<unknown> {
  // In Sequelize, we return the sequelize instance itself
  return sequelize;
}

/**
 * Check database health
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0]?.health === 1;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database pool stats
 */
export function getPoolStats() {
  // Sequelize doesn't expose pool stats directly in the same way
  // Return basic connection info
  return {
    dialect: sequelize.getDialect(),
    database: sequelize.getDatabaseName(),
    connected: sequelize
      .authenticate()
      .then(() => true)
      .catch(() => false),
  };
}

// Database utility functions
export const db = {
  query,
  transaction,
  getClient,
  healthCheck,
  getPoolStats,

  // Helper methods now use secure parameterized queries from dbSecurity
  // Import at the top of the file: import { SecureDB } from '../utils/dbSecurity';
  async findOne<T>(table: string, conditions: Record<string, any>): Promise<T | null> {
    // Use SecureDB for safe parameterized queries
    const { SecureDB } = require('../utils/dbSecurity');
    return SecureDB.findOne(table, conditions) as Promise<T | null>;
  },

  async findMany<T>(
    table: string,
    conditions: Record<string, any> = {},
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    } = {}
  ): Promise<T[]> {
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

  async insert<T>(table: string, data: Record<string, any>): Promise<T> {
    // Use SecureDB for safe parameterized queries
    const { SecureDB } = require('../utils/dbSecurity');
    return SecureDB.insert(table, data) as Promise<T>;
  },

  async update<T>(
    table: string,
    data: Record<string, any>,
    conditions: Record<string, any>
  ): Promise<T | null> {
    // Use SecureDB for safe parameterized queries
    const { SecureDB } = require('../utils/dbSecurity');
    const affectedRows = await SecureDB.update(table, data, conditions);

    if (affectedRows > 0) {
      // Fetch and return the updated record
      return SecureDB.findOne(table, conditions) as Promise<T | null>;
    }

    return null;
  },

  async delete(table: string, conditions: Record<string, any>): Promise<number> {
    // Use SecureDB for safe parameterized queries
    const { SecureDB } = require('../utils/dbSecurity');
    return SecureDB.delete(table, conditions);
  },

  async count(table: string, conditions: Record<string, any> = {}): Promise<number> {
    // Use SecureDB for safe parameterized queries
    const { SecureDB } = require('../utils/dbSecurity');
    const results = await SecureDB.findAll(table, conditions);
    return results.length;
  },

  async exists(table: string, conditions: Record<string, any>): Promise<boolean> {
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
