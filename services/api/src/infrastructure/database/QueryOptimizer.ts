/**
 * Query Optimizer
 * Phase 12 Week 1
 *
 * Analyzes and optimizes database queries for performance
 * Provides N+1 detection, index recommendations, and query result caching
 */

import { QueryResult } from 'pg';

export interface QueryAnalysis {
  queryId: string;
  sql: string;
  executionTime: number;
  rowsReturned: number;
  indexesUsed: string[];
  recommendations: QueryRecommendation[];
  cacheability: {
    cacheable: boolean;
    ttl?: number;
    reason: string;
  };
}

export interface QueryRecommendation {
  type: 'missing_index' | 'n_plus_one' | 'full_table_scan' | 'inefficient_join' | 'subquery_optimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedFix: string;
  estimatedImprovement: string;
}

export interface QueryPlan {
  planRows: number;
  actualRows: number;
  loops: number;
  totalCost: number;
  startupCost: number;
  nodeType: string;
  scanType?: string;
  indexName?: string;
  children?: QueryPlan[];
}

export class QueryOptimizer {
  private queryHistory: Map<string, QueryAnalysis[]> = new Map();
  private readonly SLOW_QUERY_THRESHOLD = 100; // ms
  private readonly N_PLUS_ONE_THRESHOLD = 10; // queries in short time window
  private readonly MAX_HISTORY_SIZE = 1000;

  /**
   * Analyze query execution and provide optimization recommendations
   */
  async analyzeQuery(
    sql: string,
    executionTime: number,
    rowsReturned: number,
    queryPlan?: any
  ): Promise<QueryAnalysis> {
    const queryId = this.generateQueryId(sql);
    const recommendations: QueryRecommendation[] = [];

    // Check for slow queries
    if (executionTime > this.SLOW_QUERY_THRESHOLD) {
      recommendations.push({
        type: 'inefficient_join',
        severity: 'high',
        description: `Query execution time (${executionTime}ms) exceeds threshold (${this.SLOW_QUERY_THRESHOLD}ms)`,
        suggestedFix: 'Review query plan and consider adding indexes or optimizing joins',
        estimatedImprovement: '50-80% reduction in execution time'
      });
    }

    // Parse query plan if available
    if (queryPlan) {
      const planRecommendations = this.analyzeQueryPlan(queryPlan);
      recommendations.push(...planRecommendations);
    }

    // Check for N+1 queries
    const nPlusOneDetection = this.detectNPlusOne(queryId, sql);
    if (nPlusOneDetection) {
      recommendations.push(nPlusOneDetection);
    }

    // Determine cacheability
    const cacheability = this.determineCacheability(sql, executionTime);

    const analysis: QueryAnalysis = {
      queryId,
      sql: this.sanitizeSql(sql),
      executionTime,
      rowsReturned,
      indexesUsed: this.extractIndexesUsed(queryPlan),
      recommendations,
      cacheability
    };

    // Store in history
    this.addToHistory(queryId, analysis);

    return analysis;
  }

  /**
   * Analyze query execution plan for optimization opportunities
   */
  private analyzeQueryPlan(plan: any): QueryRecommendation[] {
    const recommendations: QueryRecommendation[] = [];

    // Recursive function to traverse query plan
    const traversePlan = (node: any) => {
      // Check for sequential scans on large tables
      if (node['Node Type'] === 'Seq Scan') {
        const rowsScanned = node['Plan Rows'] || 0;
        if (rowsScanned > 1000) {
          recommendations.push({
            type: 'full_table_scan',
            severity: 'high',
            description: `Sequential scan on ${node['Relation Name']} scanning ${rowsScanned} rows`,
            suggestedFix: `CREATE INDEX idx_${node['Relation Name']}_${node['Filter'] || 'common_columns'} ON ${node['Relation Name']}`,
            estimatedImprovement: '70-90% reduction in scan time'
          });
        }
      }

      // Check for missing indexes
      if (node['Node Type'] === 'Index Scan' && !node['Index Name']) {
        recommendations.push({
          type: 'missing_index',
          severity: 'medium',
          description: `Index scan without utilizing any index`,
          suggestedFix: 'Review filter conditions and create appropriate index',
          estimatedImprovement: '40-60% reduction in query time'
        });
      }

      // Check for inefficient joins
      if (node['Node Type'] === 'Nested Loop' && node['Plan Rows'] > 10000) {
        recommendations.push({
          type: 'inefficient_join',
          severity: 'critical',
          description: `Nested loop join processing ${node['Plan Rows']} rows`,
          suggestedFix: 'Consider hash join or merge join by ensuring proper indexes on join columns',
          estimatedImprovement: '80-95% reduction in join time'
        });
      }

      // Recurse into child plans
      if (node['Plans']) {
        node['Plans'].forEach(traversePlan);
      }
    };

    traversePlan(plan);
    return recommendations;
  }

  /**
   * Detect N+1 query patterns
   */
  private detectNPlusOne(queryId: string, sql: string): QueryRecommendation | null {
    const history = this.queryHistory.get(queryId) || [];
    const recentQueries = history.slice(-this.N_PLUS_ONE_THRESHOLD);

    // Check if same query executed multiple times in short window
    const now = Date.now();
    const recentWindow = recentQueries.filter(q =>
      (now - new Date(q.queryId).getTime()) < 5000 // 5 second window
    );

    if (recentWindow.length >= this.N_PLUS_ONE_THRESHOLD) {
      return {
        type: 'n_plus_one',
        severity: 'critical',
        description: `N+1 query detected: Same query executed ${recentWindow.length} times in 5 seconds`,
        suggestedFix: 'Use eager loading (JOIN) or batch fetching to retrieve related data in single query',
        estimatedImprovement: `Reduce ${recentWindow.length} queries to 1-2 queries`
      };
    }

    return null;
  }

  /**
   * Determine if query results are cacheable
   */
  private determineCacheability(
    sql: string,
    executionTime: number
  ): QueryAnalysis['cacheability'] {
    const lowerSql = sql.toLowerCase();

    // Don't cache write operations
    if (lowerSql.includes('insert') || lowerSql.includes('update') ||
        lowerSql.includes('delete') || lowerSql.includes('create')) {
      return {
        cacheable: false,
        reason: 'Write operation - not cacheable'
      };
    }

    // Don't cache user-specific real-time data
    if (lowerSql.includes('current_timestamp') || lowerSql.includes('now()')) {
      return {
        cacheable: false,
        reason: 'Time-dependent query - not cacheable'
      };
    }

    // Cache slow queries with longer TTL
    if (executionTime > this.SLOW_QUERY_THRESHOLD) {
      return {
        cacheable: true,
        ttl: 300, // 5 minutes for slow queries
        reason: 'Slow query - cache to improve performance'
      };
    }

    // Cache reference/lookup data
    if (lowerSql.includes('categories') || lowerSql.includes('templates') ||
        lowerSql.includes('settings')) {
      return {
        cacheable: true,
        ttl: 3600, // 1 hour for reference data
        reason: 'Reference data - infrequently changing'
      };
    }

    // Default: cache with short TTL
    return {
      cacheable: true,
      ttl: 60, // 1 minute default
      reason: 'General SELECT query - cacheable with short TTL'
    };
  }

  /**
   * Extract indexes used from query plan
   */
  private extractIndexesUsed(plan: any): string[] {
    const indexes: string[] = [];

    const traverse = (node: any) => {
      if (node && node['Index Name']) {
        indexes.push(node['Index Name']);
      }
      if (node && node['Plans']) {
        node['Plans'].forEach(traverse);
      }
    };

    if (plan) {
      traverse(plan);
    }

    return [...new Set(indexes)]; // Remove duplicates
  }

  /**
   * Generate unique query ID (normalized query fingerprint)
   */
  private generateQueryId(sql: string): string {
    // Normalize SQL by removing literals and whitespace
    const normalized = sql
      .replace(/\s+/g, ' ')
      .replace(/'\w+'/g, '?')
      .replace(/\d+/g, '?')
      .trim();

    return this.hashString(normalized);
  }

  /**
   * Sanitize SQL for logging (remove sensitive data)
   */
  private sanitizeSql(sql: string): string {
    return sql
      .replace(/password\s*=\s*'[^']+'/gi, "password='***'")
      .replace(/token\s*=\s*'[^']+'/gi, "token='***'")
      .replace(/email\s*=\s*'[^']+'/gi, "email='***@***'");
  }

  /**
   * Add query analysis to history
   */
  private addToHistory(queryId: string, analysis: QueryAnalysis): void {
    if (!this.queryHistory.has(queryId)) {
      this.queryHistory.set(queryId, []);
    }

    const history = this.queryHistory.get(queryId)!;
    history.push(analysis);

    // Limit history size
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift();
    }
  }

  /**
   * Get optimization report for all queries
   */
  getOptimizationReport(): {
    totalQueries: number;
    slowQueries: number;
    nPlusOneDetected: number;
    missingIndexes: string[];
    topRecommendations: QueryRecommendation[];
  } {
    let totalQueries = 0;
    let slowQueries = 0;
    let nPlusOneDetected = 0;
    const missingIndexes: Set<string> = new Set();
    const allRecommendations: QueryRecommendation[] = [];

    this.queryHistory.forEach(analyses => {
      totalQueries += analyses.length;

      analyses.forEach(analysis => {
        if (analysis.executionTime > this.SLOW_QUERY_THRESHOLD) {
          slowQueries++;
        }

        analysis.recommendations.forEach(rec => {
          allRecommendations.push(rec);

          if (rec.type === 'n_plus_one') {
            nPlusOneDetected++;
          }

          if (rec.type === 'missing_index') {
            missingIndexes.add(rec.suggestedFix);
          }
        });
      });
    });

    // Sort recommendations by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const topRecommendations = allRecommendations
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      .slice(0, 10);

    return {
      totalQueries,
      slowQueries,
      nPlusOneDetected,
      missingIndexes: Array.from(missingIndexes),
      topRecommendations
    };
  }

  /**
   * Simple hash function for query fingerprinting
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Clear query history (for testing or reset)
   */
  clearHistory(): void {
    this.queryHistory.clear();
  }
}
