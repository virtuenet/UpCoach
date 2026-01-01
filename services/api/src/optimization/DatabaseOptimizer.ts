import { Pool, PoolClient, QueryResult } from 'pg';
import { Sequelize, QueryTypes, Model } from 'sequelize';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import * as crypto from 'crypto';

export interface DatabaseConfig {
  primary: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  replicas: Array<{
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    priority: number;
  }>;
  pooling: {
    min: number;
    max: number;
    idleTimeout: number;
    connectionTimeout: number;
    maxLifetime: number;
    healthCheckInterval: number;
  };
  sharding: {
    enabled: boolean;
    shardCount: number;
    shardKey: string;
    strategy: 'hash' | 'range' | 'geographic';
  };
  optimization: {
    enableQueryCache: boolean;
    enablePreparedStatements: boolean;
    slowQueryThreshold: number;
    explainThreshold: number;
    autoVacuum: boolean;
    autoAnalyze: boolean;
  };
  monitoring: {
    trackActiveQueries: boolean;
    trackLocks: boolean;
    trackTableBloat: boolean;
    trackIndexUsage: boolean;
  };
}

export interface QueryAnalysis {
  query: string;
  executionTime: number;
  planningTime: number;
  totalTime: number;
  rows: number;
  plan: any;
  recommendations: string[];
  indexSuggestions: IndexSuggestion[];
  cost: {
    startup: number;
    total: number;
  };
}

export interface IndexSuggestion {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist' | 'brin';
  reason: string;
  estimatedImprovement: number;
}

export interface SlowQuery {
  query: string;
  executionTime: number;
  calls: number;
  totalTime: number;
  meanTime: number;
  minTime: number;
  maxTime: number;
  stddevTime: number;
  rows: number;
  timestamp: number;
}

export interface ConnectionPoolMetrics {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  maxWaitTime: number;
  avgWaitTime: number;
}

export interface ReplicaHealth {
  host: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down';
  lag: number;
  lastCheck: number;
  errorCount: number;
}

export interface TableBloat {
  schema: string;
  table: string;
  realSize: number;
  extraSize: number;
  bloatRatio: number;
  wastedBytes: number;
  recommendation: string;
}

export interface LockInfo {
  pid: number;
  lockType: string;
  relation: string;
  mode: string;
  granted: boolean;
  query: string;
  duration: number;
}

export interface ShardInfo {
  shardId: number;
  nodeId: string;
  keyRange: { start: string; end: string };
  recordCount: number;
  size: number;
  status: 'active' | 'migrating' | 'readonly';
}

export class DatabaseOptimizer extends EventEmitter {
  private config: DatabaseConfig;
  private logger: Logger;
  private metrics: MetricsCollector;
  private primaryPool: Pool;
  private replicaPools: Pool[] = [];
  private currentReplicaIndex = 0;
  private replicaHealth: Map<string, ReplicaHealth> = new Map();
  private queryCache: Map<string, { result: any; timestamp: number; ttl: number }> = new Map();
  private preparedStatements: Map<string, string> = new Map();
  private slowQueries: Map<string, SlowQuery> = new Map();
  private shards: Map<number, Pool> = new Map();
  private readonly QUERY_CACHE_TTL = 300000;
  private readonly MAX_CACHE_SIZE = 10000;
  private readonly N_PLUS_ONE_THRESHOLD = 10;
  private readonly REPLICA_LAG_THRESHOLD = 1000;
  private requestQueryCount: Map<string, number> = new Map();

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    this.logger = new Logger('DatabaseOptimizer');
    this.metrics = new MetricsCollector('database');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.initializePrimaryPool();
      await this.initializeReplicaPools();

      if (this.config.sharding.enabled) {
        await this.initializeShards();
      }

      this.startHealthChecks();
      this.startMetricsCollection();
      this.startMaintenanceTasks();

      if (this.config.optimization.enableQueryCache) {
        this.startCacheCleanup();
      }

      this.logger.info('Database optimizer initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize database optimizer', error);
      throw error;
    }
  }

  private async initializePrimaryPool(): Promise<void> {
    this.primaryPool = new Pool({
      host: this.config.primary.host,
      port: this.config.primary.port,
      database: this.config.primary.database,
      user: this.config.primary.username,
      password: this.config.primary.password,
      min: this.config.pooling.min,
      max: this.config.pooling.max,
      idleTimeoutMillis: this.config.pooling.idleTimeout,
      connectionTimeoutMillis: this.config.pooling.connectionTimeout,
      statement_timeout: 30000,
      query_timeout: 30000,
    });

    this.primaryPool.on('error', (err) => {
      this.logger.error('Primary pool error', err);
      this.metrics.increment('db.primary.errors');
      this.emit('primary-error', err);
    });

    this.primaryPool.on('connect', (client) => {
      this.logger.debug('New client connected to primary pool');
      this.metrics.increment('db.primary.connections');
    });

    this.primaryPool.on('remove', (client) => {
      this.logger.debug('Client removed from primary pool');
      this.metrics.decrement('db.primary.connections');
    });

    await this.configurePrimaryDatabase();

    this.logger.info('Primary database pool initialized', {
      host: this.config.primary.host,
      database: this.config.primary.database,
    });
  }

  private async configurePrimaryDatabase(): Promise<void> {
    const client = await this.primaryPool.connect();

    try {
      if (this.config.monitoring.trackActiveQueries) {
        await client.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements');
      }

      await client.query('SET work_mem = "64MB"');
      await client.query('SET maintenance_work_mem = "256MB"');
      await client.query('SET effective_cache_size = "4GB"');
      await client.query('SET random_page_cost = 1.1');
      await client.query('SET effective_io_concurrency = 200');

      if (this.config.optimization.autoVacuum) {
        await client.query('ALTER SYSTEM SET autovacuum = on');
        await client.query('ALTER SYSTEM SET autovacuum_naptime = "1min"');
        await client.query('ALTER SYSTEM SET autovacuum_vacuum_threshold = 50');
        await client.query('ALTER SYSTEM SET autovacuum_analyze_threshold = 50');
      }

      this.logger.info('Primary database configured');
    } finally {
      client.release();
    }
  }

  private async initializeReplicaPools(): Promise<void> {
    const sortedReplicas = [...this.config.replicas].sort((a, b) => b.priority - a.priority);

    for (const replica of sortedReplicas) {
      try {
        const pool = new Pool({
          host: replica.host,
          port: replica.port,
          database: replica.database,
          user: replica.username,
          password: replica.password,
          min: this.config.pooling.min,
          max: this.config.pooling.max,
          idleTimeoutMillis: this.config.pooling.idleTimeout,
          connectionTimeoutMillis: this.config.pooling.connectionTimeout,
        });

        pool.on('error', (err) => {
          this.logger.error(`Replica pool error: ${replica.host}`, err);
          this.metrics.increment('db.replica.errors');
          this.updateReplicaHealth(replica.host, replica.port, 'down', 0);
        });

        this.replicaPools.push(pool);

        this.replicaHealth.set(`${replica.host}:${replica.port}`, {
          host: replica.host,
          port: replica.port,
          status: 'healthy',
          lag: 0,
          lastCheck: Date.now(),
          errorCount: 0,
        });

        this.logger.info('Replica pool initialized', {
          host: replica.host,
          priority: replica.priority,
        });
      } catch (error) {
        this.logger.error(`Failed to initialize replica pool: ${replica.host}`, error);
      }
    }
  }

  private async initializeShards(): Promise<void> {
    for (let i = 0; i < this.config.sharding.shardCount; i++) {
      const shardPool = new Pool({
        host: this.config.primary.host,
        port: this.config.primary.port,
        database: `${this.config.primary.database}_shard_${i}`,
        user: this.config.primary.username,
        password: this.config.primary.password,
        min: Math.floor(this.config.pooling.min / this.config.sharding.shardCount),
        max: Math.floor(this.config.pooling.max / this.config.sharding.shardCount),
        idleTimeoutMillis: this.config.pooling.idleTimeout,
      });

      this.shards.set(i, shardPool);

      this.logger.debug(`Shard ${i} initialized`);
    }

    this.logger.info('Database sharding initialized', {
      shardCount: this.config.sharding.shardCount,
      strategy: this.config.sharding.strategy,
    });
  }

  public async query<T = any>(
    sql: string,
    params: any[] = [],
    options: {
      useReplica?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      shardKey?: string;
      requestId?: string;
    } = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const queryHash = this.hashQuery(sql, params);

    try {
      if (options.requestId) {
        this.trackQueryForRequest(options.requestId);
      }

      if (options.useCache && this.config.optimization.enableQueryCache) {
        const cached = this.queryCache.get(queryHash);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          this.metrics.increment('db.cache.hits');
          this.logger.debug('Query cache hit', { queryHash });
          return cached.result;
        }
        this.metrics.increment('db.cache.misses');
      }

      let pool: Pool;

      if (options.shardKey && this.config.sharding.enabled) {
        const shardId = this.getShardId(options.shardKey);
        pool = this.shards.get(shardId) || this.primaryPool;
      } else if (options.useReplica && this.isReadQuery(sql)) {
        pool = this.getHealthyReplica() || this.primaryPool;
      } else {
        pool = this.primaryPool;
      }

      const result = await pool.query<T>(sql, params);

      const executionTime = Date.now() - startTime;

      if (executionTime > this.config.optimization.slowQueryThreshold) {
        await this.recordSlowQuery(sql, executionTime, result.rowCount || 0);
      }

      if (executionTime > this.config.optimization.explainThreshold) {
        await this.analyzeQuery(sql, params);
      }

      if (options.useCache && this.config.optimization.enableQueryCache) {
        const ttl = options.cacheTTL || this.QUERY_CACHE_TTL;
        this.queryCache.set(queryHash, {
          result,
          timestamp: Date.now(),
          ttl,
        });

        if (this.queryCache.size > this.MAX_CACHE_SIZE) {
          this.evictOldestCacheEntries();
        }
      }

      this.metrics.histogram('db.query.duration', executionTime);
      this.metrics.increment('db.queries.total');

      return result;
    } catch (error) {
      this.logger.error('Query execution failed', { sql, error });
      this.metrics.increment('db.queries.errors');
      throw error;
    }
  }

  private trackQueryForRequest(requestId: string): void {
    const count = this.requestQueryCount.get(requestId) || 0;
    this.requestQueryCount.set(requestId, count + 1);

    if (count >= this.N_PLUS_ONE_THRESHOLD) {
      this.logger.warn('Potential N+1 query detected', {
        requestId,
        queryCount: count + 1,
      });
      this.metrics.increment('db.n_plus_one.detected');
      this.emit('n-plus-one-detected', { requestId, queryCount: count + 1 });
    }

    setTimeout(() => {
      this.requestQueryCount.delete(requestId);
    }, 60000);
  }

  private isReadQuery(sql: string): boolean {
    const upperSQL = sql.trim().toUpperCase();
    return (
      upperSQL.startsWith('SELECT') ||
      upperSQL.startsWith('WITH') ||
      upperSQL.startsWith('SHOW')
    );
  }

  private getHealthyReplica(): Pool | null {
    const healthyReplicas = this.replicaPools.filter((pool, index) => {
      const replica = this.config.replicas[index];
      const health = this.replicaHealth.get(`${replica.host}:${replica.port}`);
      return health && health.status === 'healthy' && health.lag < this.REPLICA_LAG_THRESHOLD;
    });

    if (healthyReplicas.length === 0) {
      this.logger.warn('No healthy replicas available, using primary');
      return null;
    }

    this.currentReplicaIndex = (this.currentReplicaIndex + 1) % healthyReplicas.length;
    return healthyReplicas[this.currentReplicaIndex];
  }

  private getShardId(shardKey: string): number {
    if (this.config.sharding.strategy === 'hash') {
      return this.hashShardKey(shardKey) % this.config.sharding.shardCount;
    }

    return 0;
  }

  private hashShardKey(key: string): number {
    const hash = crypto.createHash('md5').update(key).digest();
    return hash.readUInt32BE(0);
  }

  private hashQuery(sql: string, params: any[]): string {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    const data = `${normalized}:${JSON.stringify(params)}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  public async analyzeQuery(sql: string, params: any[] = []): Promise<QueryAnalysis> {
    const client = await this.primaryPool.connect();

    try {
      const explainResult = await client.query(
        `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`,
        params
      );

      const plan = explainResult.rows[0]['QUERY PLAN'][0];
      const executionTime = plan['Execution Time'];
      const planningTime = plan['Planning Time'];
      const totalTime = executionTime + planningTime;

      const recommendations: string[] = [];
      const indexSuggestions: IndexSuggestion[] = [];

      this.analyzePlan(plan.Plan, recommendations, indexSuggestions);

      const analysis: QueryAnalysis = {
        query: sql,
        executionTime,
        planningTime,
        totalTime,
        rows: plan.Plan['Actual Rows'],
        plan: plan.Plan,
        recommendations,
        indexSuggestions,
        cost: {
          startup: plan.Plan['Startup Cost'],
          total: plan.Plan['Total Cost'],
        },
      };

      this.logger.debug('Query analyzed', {
        executionTime: totalTime,
        recommendations: recommendations.length,
      });

      return analysis;
    } catch (error) {
      this.logger.error('Query analysis failed', { sql, error });
      throw error;
    } finally {
      client.release();
    }
  }

  private analyzePlan(
    plan: any,
    recommendations: string[],
    indexSuggestions: IndexSuggestion[]
  ): void {
    if (plan['Node Type'] === 'Seq Scan') {
      recommendations.push(
        `Sequential scan detected on table "${plan['Relation Name']}". Consider adding an index.`
      );

      if (plan['Filter']) {
        const columns = this.extractColumnsFromFilter(plan['Filter']);
        indexSuggestions.push({
          table: plan['Relation Name'],
          columns,
          type: 'btree',
          reason: 'Sequential scan with filter condition',
          estimatedImprovement: plan['Total Cost'] * 0.7,
        });
      }
    }

    if (plan['Node Type'] === 'Hash Join' && plan['Hash Cond']) {
      const columns = this.extractColumnsFromCondition(plan['Hash Cond']);
      if (columns.length > 0) {
        recommendations.push(
          `Hash join detected. Ensure indexes exist on join columns: ${columns.join(', ')}`
        );
      }
    }

    if (plan['Rows Removed by Filter']) {
      const removalRatio = plan['Rows Removed by Filter'] / plan['Actual Rows'];
      if (removalRatio > 0.9) {
        recommendations.push(
          `High filter removal ratio (${(removalRatio * 100).toFixed(1)}%). Consider adding a more selective index.`
        );
      }
    }

    if (plan['Actual Loops'] > 1000) {
      recommendations.push(
        `High number of loops (${plan['Actual Loops']}). This might indicate a nested loop join that could be optimized.`
      );
    }

    if (plan.Plans) {
      for (const subPlan of plan.Plans) {
        this.analyzePlan(subPlan, recommendations, indexSuggestions);
      }
    }
  }

  private extractColumnsFromFilter(filter: string): string[] {
    const matches = filter.match(/\(([^)]+)\)/g);
    if (!matches) return [];

    return matches
      .map((match) => match.replace(/[()]/g, '').split('.').pop() || '')
      .filter((col) => col && !col.includes('::'));
  }

  private extractColumnsFromCondition(condition: string): string[] {
    const matches = condition.match(/\w+\.\w+/g);
    if (!matches) return [];

    return matches.map((match) => match.split('.').pop() || '').filter((col) => col);
  }

  private async recordSlowQuery(sql: string, executionTime: number, rows: number): Promise<void> {
    const queryHash = this.hashQuery(sql, []);
    const existing = this.slowQueries.get(queryHash);

    if (existing) {
      existing.calls++;
      existing.totalTime += executionTime;
      existing.meanTime = existing.totalTime / existing.calls;
      existing.minTime = Math.min(existing.minTime, executionTime);
      existing.maxTime = Math.max(existing.maxTime, executionTime);

      const variance =
        Math.pow(executionTime - existing.meanTime, 2) / existing.calls;
      existing.stddevTime = Math.sqrt(variance);
    } else {
      this.slowQueries.set(queryHash, {
        query: sql,
        executionTime,
        calls: 1,
        totalTime: executionTime,
        meanTime: executionTime,
        minTime: executionTime,
        maxTime: executionTime,
        stddevTime: 0,
        rows,
        timestamp: Date.now(),
      });
    }

    this.logger.warn('Slow query detected', {
      executionTime,
      query: sql.substring(0, 100),
    });

    this.metrics.increment('db.queries.slow');
    this.emit('slow-query', { sql, executionTime, rows });
  }

  public getSlowQueries(limit: number = 50): SlowQuery[] {
    return Array.from(this.slowQueries.values())
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
  }

  public async getActiveQueries(): Promise<any[]> {
    if (!this.config.monitoring.trackActiveQueries) {
      return [];
    }

    try {
      const result = await this.primaryPool.query(`
        SELECT
          pid,
          usename,
          application_name,
          client_addr,
          state,
          query,
          query_start,
          state_change,
          EXTRACT(EPOCH FROM (NOW() - query_start)) * 1000 as duration_ms
        FROM pg_stat_activity
        WHERE state != 'idle'
          AND query NOT LIKE '%pg_stat_activity%'
        ORDER BY query_start DESC
      `);

      return result.rows;
    } catch (error) {
      this.logger.error('Failed to get active queries', error);
      return [];
    }
  }

  public async getLockInfo(): Promise<LockInfo[]> {
    if (!this.config.monitoring.trackLocks) {
      return [];
    }

    try {
      const result = await this.primaryPool.query(`
        SELECT
          l.pid,
          l.locktype,
          l.relation::regclass::text as relation,
          l.mode,
          l.granted,
          a.query,
          EXTRACT(EPOCH FROM (NOW() - a.query_start)) * 1000 as duration
        FROM pg_locks l
        JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.relation IS NOT NULL
        ORDER BY a.query_start
      `);

      return result.rows.map((row) => ({
        pid: row.pid,
        lockType: row.locktype,
        relation: row.relation,
        mode: row.mode,
        granted: row.granted,
        query: row.query,
        duration: row.duration,
      }));
    } catch (error) {
      this.logger.error('Failed to get lock info', error);
      return [];
    }
  }

  public async getTableBloat(): Promise<TableBloat[]> {
    if (!this.config.monitoring.trackTableBloat) {
      return [];
    }

    try {
      const result = await this.primaryPool.query(`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS real_size,
          (pgstattuple(schemaname||'.'||tablename)).dead_tuple_percent AS bloat_ratio
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY real_size DESC
        LIMIT 50
      `);

      return result.rows.map((row) => {
        const bloatRatio = row.bloat_ratio || 0;
        const realSize = row.real_size || 0;
        const wastedBytes = Math.floor((realSize * bloatRatio) / 100);

        let recommendation = '';
        if (bloatRatio > 20) {
          recommendation = `VACUUM FULL ${row.schemaname}.${row.tablename}`;
        } else if (bloatRatio > 10) {
          recommendation = `VACUUM ${row.schemaname}.${row.tablename}`;
        }

        return {
          schema: row.schemaname,
          table: row.tablename,
          realSize,
          extraSize: wastedBytes,
          bloatRatio,
          wastedBytes,
          recommendation,
        };
      });
    } catch (error) {
      this.logger.error('Failed to get table bloat', error);
      return [];
    }
  }

  public async getIndexUsage(): Promise<any[]> {
    if (!this.config.monitoring.trackIndexUsage) {
      return [];
    }

    try {
      const result = await this.primaryPool.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
          pg_relation_size(indexrelid) AS index_bytes
        FROM pg_stat_user_indexes
        ORDER BY idx_scan ASC, index_bytes DESC
        LIMIT 100
      `);

      return result.rows.map((row) => ({
        schema: row.schemaname,
        table: row.tablename,
        index: row.indexname,
        scans: row.idx_scan,
        tuplesRead: row.idx_tup_read,
        tuplesFetched: row.idx_tup_fetch,
        size: row.index_size,
        bytes: row.index_bytes,
        unused: row.idx_scan === 0,
      }));
    } catch (error) {
      this.logger.error('Failed to get index usage', error);
      return [];
    }
  }

  public async vacuumTable(schema: string, table: string, full: boolean = false): Promise<void> {
    try {
      const sql = full
        ? `VACUUM FULL ANALYZE ${schema}.${table}`
        : `VACUUM ANALYZE ${schema}.${table}`;

      await this.primaryPool.query(sql);

      this.logger.info('Table vacuumed', { schema, table, full });
      this.metrics.increment('db.vacuum.executed');
    } catch (error) {
      this.logger.error('Vacuum failed', { schema, table, error });
      throw error;
    }
  }

  public async reindexTable(schema: string, table: string): Promise<void> {
    try {
      await this.primaryPool.query(`REINDEX TABLE ${schema}.${table}`);

      this.logger.info('Table reindexed', { schema, table });
      this.metrics.increment('db.reindex.executed');
    } catch (error) {
      this.logger.error('Reindex failed', { schema, table, error });
      throw error;
    }
  }

  public async createIndex(
    table: string,
    columns: string[],
    options: {
      type?: 'btree' | 'hash' | 'gin' | 'gist' | 'brin';
      unique?: boolean;
      concurrent?: boolean;
      where?: string;
    } = {}
  ): Promise<void> {
    try {
      const indexName = `idx_${table}_${columns.join('_')}`;
      const indexType = options.type || 'btree';
      const unique = options.unique ? 'UNIQUE' : '';
      const concurrent = options.concurrent ? 'CONCURRENTLY' : '';
      const where = options.where ? `WHERE ${options.where}` : '';

      const sql = `
        CREATE ${unique} INDEX ${concurrent} ${indexName}
        ON ${table} USING ${indexType} (${columns.join(', ')})
        ${where}
      `.trim();

      await this.primaryPool.query(sql);

      this.logger.info('Index created', { table, columns, type: indexType });
      this.metrics.increment('db.index.created');
    } catch (error) {
      this.logger.error('Index creation failed', { table, columns, error });
      throw error;
    }
  }

  private async updateReplicaHealth(
    host: string,
    port: number,
    status: 'healthy' | 'degraded' | 'down',
    lag: number
  ): Promise<void> {
    const key = `${host}:${port}`;
    const health = this.replicaHealth.get(key);

    if (health) {
      health.status = status;
      health.lag = lag;
      health.lastCheck = Date.now();
      health.errorCount = status === 'down' ? health.errorCount + 1 : 0;

      this.replicaHealth.set(key, health);

      if (status === 'down' || status === 'degraded') {
        this.logger.warn('Replica health degraded', { host, port, status, lag });
        this.emit('replica-degraded', { host, port, status, lag });
      }
    }
  }

  public async getPoolMetrics(): Promise<ConnectionPoolMetrics> {
    return {
      total: this.primaryPool.totalCount,
      active: this.primaryPool.totalCount - this.primaryPool.idleCount,
      idle: this.primaryPool.idleCount,
      waiting: this.primaryPool.waitingCount,
      maxWaitTime: 0,
      avgWaitTime: 0,
    };
  }

  public async getReplicaHealth(): Promise<ReplicaHealth[]> {
    return Array.from(this.replicaHealth.values());
  }

  public async getShardInfo(): Promise<ShardInfo[]> {
    if (!this.config.sharding.enabled) {
      return [];
    }

    const shardInfo: ShardInfo[] = [];

    for (const [shardId, pool] of this.shards.entries()) {
      try {
        const result = await pool.query(`
          SELECT
            COUNT(*) as record_count,
            pg_database_size(current_database()) as size
          FROM information_schema.tables
          WHERE table_schema = 'public'
        `);

        shardInfo.push({
          shardId,
          nodeId: `${this.config.primary.host}:${this.config.primary.port}`,
          keyRange: { start: '', end: '' },
          recordCount: parseInt(result.rows[0].record_count),
          size: parseInt(result.rows[0].size),
          status: 'active',
        });
      } catch (error) {
        this.logger.error(`Failed to get shard info for shard ${shardId}`, error);
      }
    }

    return shardInfo;
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      await this.checkReplicaHealth();
    }, this.config.pooling.healthCheckInterval);
  }

  private async checkReplicaHealth(): Promise<void> {
    for (let i = 0; i < this.replicaPools.length; i++) {
      const pool = this.replicaPools[i];
      const replica = this.config.replicas[i];

      try {
        const result = await pool.query(`
          SELECT
            CASE
              WHEN pg_is_in_recovery() THEN
                EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000
              ELSE 0
            END AS lag_ms
        `);

        const lag = parseInt(result.rows[0].lag_ms) || 0;

        if (lag > this.REPLICA_LAG_THRESHOLD) {
          await this.updateReplicaHealth(replica.host, replica.port, 'degraded', lag);
        } else {
          await this.updateReplicaHealth(replica.host, replica.port, 'healthy', lag);
        }
      } catch (error) {
        await this.updateReplicaHealth(replica.host, replica.port, 'down', 0);
      }
    }
  }

  private startMetricsCollection(): void {
    setInterval(async () => {
      try {
        const poolMetrics = await this.getPoolMetrics();
        this.metrics.gauge('db.pool.total', poolMetrics.total);
        this.metrics.gauge('db.pool.active', poolMetrics.active);
        this.metrics.gauge('db.pool.idle', poolMetrics.idle);
        this.metrics.gauge('db.pool.waiting', poolMetrics.waiting);

        const activeQueries = await this.getActiveQueries();
        this.metrics.gauge('db.queries.active', activeQueries.length);

        const locks = await this.getLockInfo();
        this.metrics.gauge('db.locks.count', locks.length);

        const healthyReplicas = Array.from(this.replicaHealth.values()).filter(
          (h) => h.status === 'healthy'
        ).length;
        this.metrics.gauge('db.replicas.healthy', healthyReplicas);
      } catch (error) {
        this.logger.error('Metrics collection failed', error);
      }
    }, 10000);
  }

  private startMaintenanceTasks(): void {
    if (this.config.optimization.autoVacuum) {
      setInterval(async () => {
        try {
          const bloatedTables = await this.getTableBloat();
          const criticalTables = bloatedTables.filter((t) => t.bloatRatio > 20);

          for (const table of criticalTables) {
            await this.vacuumTable(table.schema, table.table, false);
          }
        } catch (error) {
          this.logger.error('Auto-vacuum failed', error);
        }
      }, 3600000);
    }

    if (this.config.optimization.autoAnalyze) {
      setInterval(async () => {
        try {
          await this.primaryPool.query('ANALYZE');
          this.logger.info('Database statistics updated');
        } catch (error) {
          this.logger.error('Auto-analyze failed', error);
        }
      }, 1800000);
    }
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.queryCache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.queryCache.delete(key);
        }
      }

      this.metrics.gauge('db.cache.size', this.queryCache.size);
    }, 60000);
  }

  private evictOldestCacheEntries(): void {
    const entries = Array.from(this.queryCache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    const toRemove = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.2));
    for (const [key] of toRemove) {
      this.queryCache.delete(key);
    }

    this.logger.debug('Evicted old cache entries', { count: toRemove.length });
  }

  public clearCache(): void {
    this.queryCache.clear();
    this.logger.info('Query cache cleared');
  }

  public async close(): Promise<void> {
    try {
      await this.primaryPool.end();

      for (const pool of this.replicaPools) {
        await pool.end();
      }

      for (const pool of this.shards.values()) {
        await pool.end();
      }

      this.queryCache.clear();
      this.slowQueries.clear();
      this.replicaHealth.clear();

      this.logger.info('Database optimizer closed');
      this.emit('closed');
    } catch (error) {
      this.logger.error('Failed to close database optimizer', error);
      throw error;
    }
  }
}

export default DatabaseOptimizer;
