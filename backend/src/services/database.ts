import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public static async initialize(): Promise<void> {
    const instance = DatabaseService.getInstance();
    await instance.connect();
  }

  public static async disconnect(): Promise<void> {
    const instance = DatabaseService.getInstance();
    await instance.close();
  }

  public static getPool(): Pool {
    const instance = DatabaseService.getInstance();
    if (!instance.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return instance.pool;
  }

  private async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.env === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
        connectionTimeoutMillis: 2000, // How long to wait for a connection
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  private async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database connection closed');
    }
  }

  public async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', {
        text: text.replace(/\s+/g, ' ').trim(),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
      
      return result;
    } catch (error) {
      logger.error('Database query error:', {
        text: text.replace(/\s+/g, ' ').trim(),
        params,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    return this.pool.connect();
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Helper methods for common database operations
  public async findOne<T extends QueryResultRow = any>(
    table: string,
    conditions: Record<string, any>,
    columns: string[] = ['*']
  ): Promise<T | null> {
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
    const result = await this.query<T>(query, values);
    
    return result.rows[0] || null;
  }

  public async findMany<T extends QueryResultRow = any>(
    table: string,
    conditions: Record<string, any> = {},
    options: {
      columns?: string[];
      orderBy?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<T[]> {
    const { columns = ['*'], orderBy, limit, offset } = options;
    
    let query = `SELECT ${columns.join(', ')} FROM ${table}`;
    const values: any[] = [];
    
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
    
    const result = await this.query<T>(query, values);
    return result.rows;
  }

  public async insert<T extends QueryResultRow = any>(
    table: string,
    data: Record<string, any>,
    returning: string[] = ['*']
  ): Promise<T> {
    const columns = Object.keys(data);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const values = Object.values(data);
    
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING ${returning.join(', ')}
    `;
    
    const result = await this.query<T>(query, values);
    return result.rows[0];
  }

  public async update<T extends QueryResultRow = any>(
    table: string,
    data: Record<string, any>,
    conditions: Record<string, any>,
    returning: string[] = ['*']
  ): Promise<T | null> {
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
    const result = await this.query<T>(query, values);
    
    return result.rows[0] || null;
  }

  public async delete(
    table: string,
    conditions: Record<string, any>
  ): Promise<number> {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const query = `DELETE FROM ${table} WHERE ${whereClause}`;
    const values = Object.values(conditions);
    
    const result = await this.query(query, values);
    return result.rowCount || 0;
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance(); 