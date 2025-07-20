import { Pool, Client, PoolClient } from 'pg';
import { config } from './environment';
import { logger } from '../utils/logger';

// Database connection pool
let pool: Pool;

// Database configuration
const dbConfig = {
  connectionString: config.databaseUrl,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  statement_timeout: 30000, // Close queries after 30 seconds
  query_timeout: 30000,
  // SSL configuration for production
  ssl: config.env === 'production' ? { rejectUnauthorized: false } : false,
};

/**
 * Initialize database connection pool
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database connection...');
    
    pool = new Pool(dbConfig);

    // Set up event handlers
    pool.on('connect', (client) => {
      logger.debug('New database client connected');
    });

    pool.on('error', (err, client) => {
      logger.error('Unexpected database client error:', err);
    });

    pool.on('remove', (client) => {
      logger.debug('Database client removed from pool');
    });

    // Test the connection
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      logger.info('Database connected successfully:', {
        time: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
      });
    } finally {
      client.release();
    }

    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw new Error(`Database connection failed: ${error}`);
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  try {
    if (pool) {
      await pool.end();
      logger.info('Database connection pool closed');
    }
  } catch (error) {
    logger.error('Error closing database pool:', error);
    throw error;
  }
}

/**
 * Execute a query with the database pool
 */
export async function query(text: string, params?: any[]): Promise<any> {
  try {
    const client = await pool.connect();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
      
      return result;
    } finally {
      client.release();
    }
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
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    logger.debug('Transaction committed');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.debug('Transaction rolled back');
    
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get a database client from the pool (for advanced usage)
 */
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
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
  if (!pool) {
    return null;
  }
  
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Database utility functions
export const db = {
  query,
  transaction,
  getClient,
  healthCheck,
  getPoolStats,
  
  // Helper methods for common operations
  async findOne<T>(table: string, conditions: Record<string, any>): Promise<T | null> {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const values = Object.values(conditions);
    const text = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
    
    const result = await query(text, values);
    return result.rows[0] || null;
  },
  
  async findMany<T>(
    table: string, 
    conditions: Record<string, any> = {},
    options: { 
      limit?: number; 
      offset?: number; 
      orderBy?: string; 
      orderDirection?: 'ASC' | 'DESC' 
    } = {}
  ): Promise<T[]> {
    let text = `SELECT * FROM ${table}`;
    const values: any[] = [];
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      text += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }
    
    if (options.orderBy) {
      text += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    }
    
    if (options.limit) {
      text += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }
    
    if (options.offset) {
      text += ` OFFSET $${values.length + 1}`;
      values.push(options.offset);
    }
    
    const result = await query(text, values);
    return result.rows;
  },
  
  async insert<T>(table: string, data: Record<string, any>): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const text = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(text, values);
    return result.rows[0];
  },
  
  async update<T>(
    table: string, 
    data: Record<string, any>, 
    conditions: Record<string, any>
  ): Promise<T | null> {
    const dataColumns = Object.keys(data);
    const dataValues = Object.values(data);
    const conditionColumns = Object.keys(conditions);
    const conditionValues = Object.values(conditions);
    
    const setClause = dataColumns
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const whereClause = conditionColumns
      .map((key, index) => `${key} = $${dataValues.length + index + 1}`)
      .join(' AND ');
    
    const text = `
      UPDATE ${table}
      SET ${setClause}, updated_at = NOW()
      WHERE ${whereClause}
      RETURNING *
    `;
    
    const allValues = [...dataValues, ...conditionValues];
    const result = await query(text, allValues);
    return result.rows[0] || null;
  },
  
  async delete(table: string, conditions: Record<string, any>): Promise<number> {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const values = Object.values(conditions);
    const text = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    const result = await query(text, values);
    return result.rowCount || 0;
  },
  
  async count(table: string, conditions: Record<string, any> = {}): Promise<number> {
    let text = `SELECT COUNT(*) as count FROM ${table}`;
    const values: any[] = [];
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      text += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }
    
    const result = await query(text, values);
    return parseInt(result.rows[0].count);
  }
};

// Export the pool for advanced usage
export { pool };

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closeDatabase();
});

process.on('SIGTERM', async () => {
  await closeDatabase();
}); 