/**
 * Database Index Manager
 * Phase 12 Week 1
 *
 * Manages database indexes, analyzes query patterns, and provides
 * index recommendations for performance optimization
 */

import { Pool } from 'pg';

export interface IndexInfo {
  schemaName: string;
  tableName: string;
  indexName: string;
  indexType: string;
  columns: string[];
  isUnique: boolean;
  isPrimary: boolean;
  sizeBytes: number;
  scans: number;
  tuplesRead: number;
  tuplesFetched: number;
}

export interface IndexRecommendation {
  tableName: string;
  recommendedColumns: string[];
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  createStatement: string;
  priority: number; // 1-10
}

export interface UnusedIndex {
  indexName: string;
  tableName: string;
  sizeBytes: number;
  scans: number;
  reason: string;
  dropStatement: string;
}

export interface TableStats {
  tableName: string;
  rowCount: number;
  sizeBytes: number;
  indexes: IndexInfo[];
  seqScans: number;
  seqTuplesRead: number;
  indexScans: number;
  indexTuplesRead: number;
  indexRatio: number; // Percentage of index vs sequential scans
}

export class IndexManager {
  constructor(private pool: Pool) {}

  /**
   * Get all indexes in database
   */
  async getAllIndexes(): Promise<IndexInfo[]> {
    const query = `
      SELECT
        n.nspname as schema_name,
        t.relname as table_name,
        i.relname as index_name,
        am.amname as index_type,
        array_agg(a.attname ORDER BY a.attnum) as columns,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary,
        pg_relation_size(i.oid) as size_bytes,
        COALESCE(s.idx_scan, 0) as scans,
        COALESCE(s.idx_tup_read, 0) as tuples_read,
        COALESCE(s.idx_tup_fetch, 0) as tuples_fetched
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_am am ON am.oid = i.relam
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.oid
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND t.relkind = 'r'
      GROUP BY
        n.nspname, t.relname, i.relname, am.amname,
        ix.indisunique, ix.indisprimary, i.oid, s.idx_scan,
        s.idx_tup_read, s.idx_tup_fetch
      ORDER BY t.relname, i.relname
    `;

    const result = await this.pool.query(query);

    return result.rows.map(row => ({
      schemaName: row.schema_name,
      tableName: row.table_name,
      indexName: row.index_name,
      indexType: row.index_type,
      columns: row.columns,
      isUnique: row.is_unique,
      isPrimary: row.is_primary,
      sizeBytes: parseInt(row.size_bytes, 10),
      scans: parseInt(row.scans, 10),
      tuplesRead: parseInt(row.tuples_read, 10),
      tuplesFetched: parseInt(row.tuples_fetched, 10)
    }));
  }

  /**
   * Find unused indexes
   */
  async findUnusedIndexes(minSizeBytes: number = 1048576): Promise<UnusedIndex[]> {
    const query = `
      SELECT
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
        pg_relation_size(i.indexrelid) as size_bytes,
        idx_scan as scans
      FROM pg_stat_user_indexes i
      JOIN pg_index ix ON i.indexrelid = ix.indexrelid
      WHERE
        idx_scan = 0
        AND NOT ix.indisunique
        AND NOT ix.indisprimary
        AND pg_relation_size(i.indexrelid) > $1
      ORDER BY pg_relation_size(i.indexrelid) DESC
    `;

    const result = await this.pool.query(query, [minSizeBytes]);

    return result.rows.map(row => ({
      indexName: row.indexname,
      tableName: row.tablename,
      sizeBytes: parseInt(row.size_bytes, 10),
      scans: parseInt(row.scans, 10),
      reason: 'Zero scans - index never used',
      dropStatement: `DROP INDEX CONCURRENTLY IF EXISTS ${row.schemaname}.${row.indexname};`
    }));
  }

  /**
   * Get index recommendations based on query patterns
   */
  async getIndexRecommendations(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    // Analyze tables with high sequential scans
    const highSeqScans = await this.findHighSeqScanTables();

    for (const table of highSeqScans) {
      // Analyze WHERE clause patterns
      const whereColumns = await this.analyzeWherePatterns(table.tableName);

      if (whereColumns.length > 0) {
        recommendations.push({
          tableName: table.tableName,
          recommendedColumns: whereColumns,
          reason: `High sequential scans (${table.seqScans}) - frequent WHERE filtering`,
          estimatedImpact: table.seqScans > 10000 ? 'high' : table.seqScans > 1000 ? 'medium' : 'low',
          createStatement: this.generateIndexStatement(table.tableName, whereColumns),
          priority: this.calculatePriority(table.seqScans, table.rowCount)
        });
      }
    }

    // Analyze foreign key columns without indexes
    const missingFkIndexes = await this.findMissingForeignKeyIndexes();
    recommendations.push(...missingFkIndexes);

    // Sort by priority
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get table statistics
   */
  async getTableStats(tableName?: string): Promise<TableStats[]> {
    const whereClause = tableName ? `WHERE schemaname = 'public' AND relname = $1` : `WHERE schemaname = 'public'`;
    const params = tableName ? [tableName] : [];

    const query = `
      SELECT
        schemaname,
        relname as table_name,
        n_live_tup as row_count,
        pg_total_relation_size(relid) as size_bytes,
        seq_scan as seq_scans,
        seq_tup_read as seq_tuples_read,
        idx_scan as index_scans,
        idx_tup_fetch as index_tuples_read
      FROM pg_stat_user_tables
      ${whereClause}
      ORDER BY pg_total_relation_size(relid) DESC
    `;

    const result = await this.pool.query(query, params);
    const stats: TableStats[] = [];

    for (const row of result.rows) {
      const indexes = await this.getTableIndexes(row.table_name);
      const indexScans = parseInt(row.index_scans, 10) || 0;
      const seqScans = parseInt(row.seq_scans, 10) || 0;
      const totalScans = indexScans + seqScans;

      stats.push({
        tableName: row.table_name,
        rowCount: parseInt(row.row_count, 10),
        sizeBytes: parseInt(row.size_bytes, 10),
        indexes,
        seqScans,
        seqTuplesRead: parseInt(row.seq_tuples_read, 10),
        indexScans,
        indexTuplesRead: parseInt(row.index_tuples_read, 10),
        indexRatio: totalScans > 0 ? Math.round((indexScans / totalScans) * 100) : 0
      });
    }

    return stats;
  }

  /**
   * Create index
   */
  async createIndex(
    tableName: string,
    columns: string[],
    indexName?: string,
    options?: {
      unique?: boolean;
      concurrent?: boolean;
      method?: 'btree' | 'hash' | 'gin' | 'gist';
      where?: string;
    }
  ): Promise<void> {
    const defaultIndexName = `idx_${tableName}_${columns.join('_')}`;
    const finalIndexName = indexName || defaultIndexName;
    const method = options?.method || 'btree';
    const unique = options?.unique ? 'UNIQUE' : '';
    const concurrent = options?.concurrent ? 'CONCURRENTLY' : '';
    const where = options?.where ? `WHERE ${options.where}` : '';

    const query = `
      CREATE ${unique} INDEX ${concurrent} ${finalIndexName}
      ON ${tableName} USING ${method} (${columns.join(', ')})
      ${where}
    `.trim();

    await this.pool.query(query);
  }

  /**
   * Drop index
   */
  async dropIndex(indexName: string, concurrent: boolean = true): Promise<void> {
    const concurrentClause = concurrent ? 'CONCURRENTLY' : '';
    const query = `DROP INDEX ${concurrentClause} IF EXISTS ${indexName}`;
    await this.pool.query(query);
  }

  /**
   * Reindex table
   */
  async reindexTable(tableName: string, concurrent: boolean = true): Promise<void> {
    if (concurrent) {
      // Get all indexes for table
      const indexes = await this.getTableIndexes(tableName);

      // Reindex each individually
      for (const index of indexes) {
        if (!index.isPrimary) {
          await this.pool.query(`REINDEX INDEX CONCURRENTLY ${index.indexName}`);
        }
      }
    } else {
      await this.pool.query(`REINDEX TABLE ${tableName}`);
    }
  }

  /**
   * Analyze index bloat
   */
  async analyzeIndexBloat(): Promise<Array<{
    indexName: string;
    tableName: string;
    bloatPercent: number;
    wastedBytes: number;
    recommendation: string;
  }>> {
    const query = `
      SELECT
        schemaname,
        tablename,
        indexname,
        ROUND(100 * (pg_relation_size(indexrelid) -
          (pg_relation_size(indexrelid) *
          (CASE WHEN idx_scan = 0 THEN 0.9 ELSE 0.7 END)))
          / NULLIF(pg_relation_size(indexrelid), 0), 2) as bloat_percent,
        pg_relation_size(indexrelid) -
          (pg_relation_size(indexrelid) *
          (CASE WHEN idx_scan = 0 THEN 0.9 ELSE 0.7 END)) as wasted_bytes
      FROM pg_stat_user_indexes
      WHERE pg_relation_size(indexrelid) > 1048576
      ORDER BY wasted_bytes DESC
      LIMIT 20
    `;

    const result = await this.pool.query(query);

    return result.rows.map(row => ({
      indexName: row.indexname,
      tableName: row.tablename,
      bloatPercent: parseFloat(row.bloat_percent) || 0,
      wastedBytes: parseInt(row.wasted_bytes, 10),
      recommendation: parseFloat(row.bloat_percent) > 50
        ? 'REINDEX recommended - high bloat'
        : parseFloat(row.bloat_percent) > 30
        ? 'Consider REINDEX during maintenance window'
        : 'Bloat within acceptable range'
    }));
  }

  /**
   * Get table indexes
   */
  private async getTableIndexes(tableName: string): Promise<IndexInfo[]> {
    const allIndexes = await this.getAllIndexes();
    return allIndexes.filter(idx => idx.tableName === tableName);
  }

  /**
   * Find tables with high sequential scans
   */
  private async findHighSeqScanTables(): Promise<Array<{
    tableName: string;
    seqScans: number;
    rowCount: number;
  }>> {
    const query = `
      SELECT
        relname as table_name,
        seq_scan as seq_scans,
        n_live_tup as row_count
      FROM pg_stat_user_tables
      WHERE
        seq_scan > 1000
        AND n_live_tup > 1000
      ORDER BY seq_scan DESC
      LIMIT 10
    `;

    const result = await this.pool.query(query);

    return result.rows.map(row => ({
      tableName: row.table_name,
      seqScans: parseInt(row.seq_scans, 10),
      rowCount: parseInt(row.row_count, 10)
    }));
  }

  /**
   * Analyze WHERE clause patterns (simplified - would need pg_stat_statements in production)
   */
  private async analyzeWherePatterns(tableName: string): Promise<string[]> {
    // This is a simplified version - in production, use pg_stat_statements
    // For now, return common filter columns based on table structure
    const commonPatterns: Record<string, string[]> = {
      users: ['email', 'created_at', 'status'],
      habits: ['user_id', 'category', 'status', 'created_at'],
      check_ins: ['habit_id', 'user_id', 'checked_in_at'],
      goals: ['user_id', 'status', 'target_date'],
      subscriptions: ['user_id', 'status', 'current_period_end']
    };

    return commonPatterns[tableName] || [];
  }

  /**
   * Find foreign keys without indexes
   */
  private async findMissingForeignKeyIndexes(): Promise<IndexRecommendation[]> {
    const query = `
      SELECT
        c.conrelid::regclass as table_name,
        a.attname as column_name,
        c.conname as constraint_name
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      LEFT JOIN pg_index i ON i.indrelid = c.conrelid
        AND a.attnum = ANY(i.indkey)
      WHERE
        c.contype = 'f'
        AND i.indexrelid IS NULL
        AND c.connamespace::regnamespace::text = 'public'
    `;

    const result = await this.pool.query(query);

    return result.rows.map(row => ({
      tableName: row.table_name,
      recommendedColumns: [row.column_name],
      reason: `Foreign key ${row.constraint_name} lacks supporting index`,
      estimatedImpact: 'high' as const,
      createStatement: this.generateIndexStatement(row.table_name, [row.column_name]),
      priority: 9
    }));
  }

  /**
   * Generate CREATE INDEX statement
   */
  private generateIndexStatement(tableName: string, columns: string[]): string {
    const indexName = `idx_${tableName}_${columns.join('_')}`;
    return `CREATE INDEX CONCURRENTLY ${indexName} ON ${tableName} (${columns.join(', ')});`;
  }

  /**
   * Calculate priority score for index recommendation
   */
  private calculatePriority(seqScans: number, rowCount: number): number {
    // Priority based on scan frequency and table size
    const scanScore = Math.min(seqScans / 10000, 5); // 0-5
    const sizeScore = Math.min(rowCount / 100000, 5); // 0-5
    return Math.round(scanScore + sizeScore);
  }
}
