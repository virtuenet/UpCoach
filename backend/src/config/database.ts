import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const env = process.env.NODE_ENV || 'development';

const dbConfig = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'upcoach_dev',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres' as const,
    logging: false,
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_TEST_NAME || 'upcoach_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres' as const,
    logging: false,
  },
  production: {
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres' as const,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};

const config = dbConfig[env as keyof typeof dbConfig];

export const sequelize = new Sequelize({
  ...config
});

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models with database
    if (env === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  try {
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}

/**
 * Execute a query with the database pool
 */
export async function query(text: string, params?: any[]): Promise<any> {
  try {
    const start = Date.now();
    const [results] = await sequelize.query(text, {
      replacements: params,
      raw: true
    });
    const duration = Date.now() - start;
    
    console.log('Executed query', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rows: Array.isArray(results) ? results.length : 0,
    });
    
    return { rows: results, rowCount: Array.isArray(results) ? results.length : 0 };
  } catch (error) {
    console.error('Database query error:', {
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
  callback: (transaction: any) => Promise<T>
): Promise<T> {
  const t = await sequelize.transaction();
  
  try {
    console.log('Transaction started');
    
    const result = await callback(t);
    
    await t.commit();
    console.log('Transaction committed');
    
    return result;
  } catch (error) {
    await t.rollback();
    console.log('Transaction rolled back');
    
    console.error('Transaction error:', error);
    throw error;
  }
}

/**
 * Get a database client from the pool (for advanced usage)
 */
export async function getClient(): Promise<any> {
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
    console.error('Database health check failed:', error);
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
    connected: sequelize.authenticate().then(() => true).catch(() => false)
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

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closeDatabase();
});

process.on('SIGTERM', async () => {
  await closeDatabase();
}); 