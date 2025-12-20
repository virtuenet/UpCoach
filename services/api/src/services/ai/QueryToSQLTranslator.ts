/**
 * Query to SQL Translator
 * Safely translates structured queries to SQL with whitelisting
 * Prevents SQL injection by validating against allowed schemas
 * @version 1.0.0
 */

import { logger } from '../../utils/logger';
import { StructuredQuery, QueryFilter, Aggregation, TimeRange } from './NLQueryService';

// ==================== Type Definitions ====================

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  allowedJoins?: JoinDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'json';
  allowedOperators: QueryFilter['operator'][];
  allowedAggregations: Aggregation['type'][];
  isFilterable: boolean;
  isSelectable: boolean;
  alias?: string;
}

export interface JoinDefinition {
  table: string;
  type: 'INNER' | 'LEFT' | 'RIGHT';
  on: {
    localColumn: string;
    foreignColumn: string;
  };
}

export interface SQLResult {
  sql: string;
  params: unknown[];
  isValid: boolean;
  validationErrors: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface TranslatorConfig {
  maxLimit: number;
  defaultLimit: number;
  allowedTables: string[];
  requireWhereClause: boolean;
  maxJoins: number;
}

// ==================== Schema Definitions ====================

const DEFAULT_SCHEMAS: TableSchema[] = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'string', allowedOperators: ['eq', 'in'], allowedAggregations: ['count', 'distinct'], isFilterable: true, isSelectable: true },
      { name: 'email', type: 'string', allowedOperators: ['eq', 'contains'], allowedAggregations: ['count', 'distinct'], isFilterable: true, isSelectable: true },
      { name: 'status', type: 'string', allowedOperators: ['eq', 'ne', 'in'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'subscription_tier', type: 'string', allowedOperators: ['eq', 'ne', 'in'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'created_at', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
      { name: 'last_active_at', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
    ],
    allowedJoins: [
      { table: 'subscriptions', type: 'LEFT', on: { localColumn: 'id', foreignColumn: 'user_id' } },
    ],
  },
  {
    name: 'sessions',
    columns: [
      { name: 'id', type: 'string', allowedOperators: ['eq'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'coach_id', type: 'string', allowedOperators: ['eq', 'in'], allowedAggregations: ['count', 'distinct'], isFilterable: true, isSelectable: true },
      { name: 'client_id', type: 'string', allowedOperators: ['eq', 'in'], allowedAggregations: ['count', 'distinct'], isFilterable: true, isSelectable: true },
      { name: 'status', type: 'string', allowedOperators: ['eq', 'ne', 'in'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'scheduled_at', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
      { name: 'duration_minutes', type: 'number', allowedOperators: ['gt', 'gte', 'lt', 'lte'], allowedAggregations: ['sum', 'avg', 'min', 'max', 'count'], isFilterable: true, isSelectable: true },
      { name: 'rating', type: 'number', allowedOperators: ['gt', 'gte', 'lt', 'lte'], allowedAggregations: ['avg', 'min', 'max', 'count'], isFilterable: true, isSelectable: true },
      { name: 'created_at', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
    ],
    allowedJoins: [
      { table: 'users', type: 'INNER', on: { localColumn: 'client_id', foreignColumn: 'id' } },
    ],
  },
  {
    name: 'goals',
    columns: [
      { name: 'id', type: 'string', allowedOperators: ['eq'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'user_id', type: 'string', allowedOperators: ['eq', 'in'], allowedAggregations: ['count', 'distinct'], isFilterable: true, isSelectable: true },
      { name: 'status', type: 'string', allowedOperators: ['eq', 'ne', 'in'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'progress', type: 'number', allowedOperators: ['gt', 'gte', 'lt', 'lte'], allowedAggregations: ['avg', 'sum', 'min', 'max'], isFilterable: true, isSelectable: true },
      { name: 'target_date', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
      { name: 'created_at', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
      { name: 'completed_at', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
    ],
  },
  {
    name: 'subscriptions',
    columns: [
      { name: 'id', type: 'string', allowedOperators: ['eq'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'user_id', type: 'string', allowedOperators: ['eq', 'in'], allowedAggregations: ['count', 'distinct'], isFilterable: true, isSelectable: true },
      { name: 'plan', type: 'string', allowedOperators: ['eq', 'ne', 'in'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'status', type: 'string', allowedOperators: ['eq', 'ne', 'in'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'amount', type: 'number', allowedOperators: ['gt', 'gte', 'lt', 'lte'], allowedAggregations: ['sum', 'avg', 'min', 'max', 'count'], isFilterable: true, isSelectable: true },
      { name: 'started_at', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
      { name: 'ended_at', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
      { name: 'created_at', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
    ],
  },
  {
    name: 'analytics',
    columns: [
      { name: 'id', type: 'string', allowedOperators: ['eq'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'user_id', type: 'string', allowedOperators: ['eq', 'in'], allowedAggregations: ['count', 'distinct'], isFilterable: true, isSelectable: true },
      { name: 'metric_name', type: 'string', allowedOperators: ['eq', 'in'], allowedAggregations: ['count'], isFilterable: true, isSelectable: true },
      { name: 'metric_value', type: 'number', allowedOperators: ['gt', 'gte', 'lt', 'lte'], allowedAggregations: ['sum', 'avg', 'min', 'max', 'count'], isFilterable: true, isSelectable: true },
      { name: 'recorded_at', type: 'date', allowedOperators: ['gt', 'gte', 'lt', 'lte', 'between'], allowedAggregations: ['count', 'min', 'max'], isFilterable: true, isSelectable: true },
    ],
  },
];

// ==================== Query to SQL Translator ====================

export class QueryToSQLTranslator {
  private schemas: Map<string, TableSchema> = new Map();
  private config: TranslatorConfig;

  constructor(config: Partial<TranslatorConfig> = {}) {
    this.config = {
      maxLimit: config.maxLimit ?? 1000,
      defaultLimit: config.defaultLimit ?? 100,
      allowedTables: config.allowedTables ?? ['users', 'sessions', 'goals', 'subscriptions', 'analytics'],
      requireWhereClause: config.requireWhereClause ?? true,
      maxJoins: config.maxJoins ?? 2,
    };

    // Load default schemas
    for (const schema of DEFAULT_SCHEMAS) {
      this.schemas.set(schema.name, schema);
    }
  }

  /**
   * Translate a structured query to safe SQL
   */
  public translate(query: StructuredQuery, tableName: string): SQLResult {
    const errors: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Validate table
    if (!this.config.allowedTables.includes(tableName)) {
      errors.push(`Table "${tableName}" is not in the allowed list`);
      return this.errorResult(errors);
    }

    const schema = this.schemas.get(tableName);
    if (!schema) {
      errors.push(`Schema for table "${tableName}" not found`);
      return this.errorResult(errors);
    }

    // Build SELECT clause
    let selectClause: string;
    if (query.aggregations.length > 0) {
      const aggParts: string[] = [];

      for (const agg of query.aggregations) {
        const validation = this.validateAggregation(agg, schema);
        if (!validation.valid) {
          errors.push(validation.error!);
          continue;
        }

        const aggFunc = agg.type.toUpperCase();
        const field = agg.field === '*' ? '*' : `"${agg.field}"`;
        const alias = agg.alias || `${agg.field}_${agg.type}`;
        aggParts.push(`${aggFunc}(${field}) AS "${alias}"`);
      }

      if (aggParts.length === 0) {
        selectClause = 'COUNT(*) AS total';
      } else {
        selectClause = aggParts.join(', ');
      }
    } else {
      // Select all allowed columns
      const selectableColumns = schema.columns
        .filter(c => c.isSelectable)
        .map(c => `"${c.name}"`)
        .join(', ');
      selectClause = selectableColumns || '*';
    }

    // Build WHERE clause
    const whereParts: string[] = [];

    // Add time range filter
    const timeColumn = this.findTimeColumn(schema);
    if (timeColumn) {
      whereParts.push(`"${timeColumn}" >= $${paramIndex++}`);
      params.push(query.timeRange.start.toISOString());

      whereParts.push(`"${timeColumn}" <= $${paramIndex++}`);
      params.push(query.timeRange.end.toISOString());
    }

    // Add query filters
    for (const filter of query.filters) {
      const validation = this.validateFilter(filter, schema);
      if (!validation.valid) {
        errors.push(validation.error!);
        continue;
      }

      const { clause, filterParams } = this.buildFilterClause(filter, paramIndex);
      whereParts.push(clause);
      params.push(...filterParams);
      paramIndex += filterParams.length;
    }

    // Require WHERE clause if configured
    if (this.config.requireWhereClause && whereParts.length === 0) {
      errors.push('Query must have at least one filter condition');
      return this.errorResult(errors);
    }

    // Build GROUP BY clause
    let groupByClause = '';
    if (query.intent === 'trend' || query.intent === 'distribution') {
      const granularityMap: Record<TimeRange['granularity'], string> = {
        hour: 'hour',
        day: 'day',
        week: 'week',
        month: 'month',
        quarter: 'quarter',
        year: 'year',
      };

      if (timeColumn) {
        groupByClause = `GROUP BY DATE_TRUNC('${granularityMap[query.timeRange.granularity]}', "${timeColumn}")`;
        // Add the group by field to select
        selectClause = `DATE_TRUNC('${granularityMap[query.timeRange.granularity]}', "${timeColumn}") AS period, ${selectClause}`;
      }
    }

    // Build ORDER BY clause
    let orderByClause = '';
    if (query.orderBy) {
      const column = schema.columns.find(c => c.name === query.orderBy!.field);
      if (column) {
        const direction = query.orderBy.direction.toUpperCase();
        orderByClause = `ORDER BY "${query.orderBy.field}" ${direction}`;
      } else if (query.orderBy.field === 'period') {
        orderByClause = `ORDER BY period ${query.orderBy.direction.toUpperCase()}`;
      } else if (query.aggregations.some(a => a.alias === query.orderBy!.field)) {
        orderByClause = `ORDER BY "${query.orderBy.field}" ${query.orderBy.direction.toUpperCase()}`;
      }
    }

    // Build LIMIT clause
    const limit = Math.min(query.limit || this.config.defaultLimit, this.config.maxLimit);
    const limitClause = `LIMIT ${limit}`;

    // Assemble final SQL
    const sqlParts = [
      `SELECT ${selectClause}`,
      `FROM "${tableName}"`,
    ];

    if (whereParts.length > 0) {
      sqlParts.push(`WHERE ${whereParts.join(' AND ')}`);
    }

    if (groupByClause) {
      sqlParts.push(groupByClause);
    }

    if (orderByClause) {
      sqlParts.push(orderByClause);
    }

    sqlParts.push(limitClause);

    const sql = sqlParts.join(' ');

    // Estimate complexity
    const complexity = this.estimateComplexity(query, whereParts.length);

    if (errors.length > 0) {
      logger.warn('[QueryToSQLTranslator] Query validation errors:', errors);
    }

    return {
      sql,
      params,
      isValid: errors.length === 0,
      validationErrors: errors,
      estimatedComplexity: complexity,
    };
  }

  /**
   * Validate an aggregation against schema
   */
  private validateAggregation(
    agg: Aggregation,
    schema: TableSchema
  ): { valid: boolean; error?: string } {
    if (agg.field === '*') {
      if (agg.type !== 'count') {
        return { valid: false, error: `Aggregation ${agg.type} not allowed on *` };
      }
      return { valid: true };
    }

    const column = schema.columns.find(c => c.name === agg.field);
    if (!column) {
      return { valid: false, error: `Column "${agg.field}" not found in schema` };
    }

    if (!column.allowedAggregations.includes(agg.type)) {
      return { valid: false, error: `Aggregation ${agg.type} not allowed on column "${agg.field}"` };
    }

    return { valid: true };
  }

  /**
   * Validate a filter against schema
   */
  private validateFilter(
    filter: QueryFilter,
    schema: TableSchema
  ): { valid: boolean; error?: string } {
    const column = schema.columns.find(c => c.name === filter.field);

    if (!column) {
      return { valid: false, error: `Column "${filter.field}" not found in schema` };
    }

    if (!column.isFilterable) {
      return { valid: false, error: `Column "${filter.field}" is not filterable` };
    }

    if (!column.allowedOperators.includes(filter.operator)) {
      return { valid: false, error: `Operator "${filter.operator}" not allowed on column "${filter.field}"` };
    }

    return { valid: true };
  }

  /**
   * Build a parameterized filter clause
   */
  private buildFilterClause(
    filter: QueryFilter,
    startParamIndex: number
  ): { clause: string; filterParams: unknown[] } {
    const filterParams: unknown[] = [];
    let paramIndex = startParamIndex;

    switch (filter.operator) {
      case 'eq':
        filterParams.push(filter.value);
        return { clause: `"${filter.field}" = $${paramIndex}`, filterParams };

      case 'ne':
        filterParams.push(filter.value);
        return { clause: `"${filter.field}" != $${paramIndex}`, filterParams };

      case 'gt':
        filterParams.push(filter.value);
        return { clause: `"${filter.field}" > $${paramIndex}`, filterParams };

      case 'gte':
        filterParams.push(filter.value);
        return { clause: `"${filter.field}" >= $${paramIndex}`, filterParams };

      case 'lt':
        filterParams.push(filter.value);
        return { clause: `"${filter.field}" < $${paramIndex}`, filterParams };

      case 'lte':
        filterParams.push(filter.value);
        return { clause: `"${filter.field}" <= $${paramIndex}`, filterParams };

      case 'in':
        const values = Array.isArray(filter.value) ? filter.value : [filter.value];
        const placeholders = values.map((_, i) => `$${paramIndex + i}`).join(', ');
        filterParams.push(...values);
        return { clause: `"${filter.field}" IN (${placeholders})`, filterParams };

      case 'contains':
        filterParams.push(`%${filter.value}%`);
        return { clause: `"${filter.field}" ILIKE $${paramIndex}`, filterParams };

      case 'between':
        const [min, max] = filter.value as [unknown, unknown];
        filterParams.push(min, max);
        return { clause: `"${filter.field}" BETWEEN $${paramIndex} AND $${paramIndex + 1}`, filterParams };

      default:
        filterParams.push(filter.value);
        return { clause: `"${filter.field}" = $${paramIndex}`, filterParams };
    }
  }

  /**
   * Find the primary time column for a schema
   */
  private findTimeColumn(schema: TableSchema): string | null {
    // Prefer created_at, then recorded_at, then any date column
    const timeColumns = ['created_at', 'recorded_at', 'scheduled_at'];

    for (const name of timeColumns) {
      const column = schema.columns.find(c => c.name === name && c.type === 'date');
      if (column) {
        return column.name;
      }
    }

    // Fallback to any date column
    const dateColumn = schema.columns.find(c => c.type === 'date' && c.isFilterable);
    return dateColumn?.name || null;
  }

  /**
   * Estimate query complexity
   */
  private estimateComplexity(
    query: StructuredQuery,
    filterCount: number
  ): 'low' | 'medium' | 'high' {
    let score = 0;

    // Aggregations add complexity
    score += query.aggregations.length;

    // Filters add complexity
    score += filterCount * 0.5;

    // Trend/distribution queries are more complex
    if (query.intent === 'trend' || query.intent === 'distribution') {
      score += 2;
    }

    // High limits add complexity
    if (query.limit && query.limit > 500) {
      score += 2;
    }

    if (score <= 2) return 'low';
    if (score <= 5) return 'medium';
    return 'high';
  }

  /**
   * Create error result
   */
  private errorResult(errors: string[]): SQLResult {
    return {
      sql: '',
      params: [],
      isValid: false,
      validationErrors: errors,
      estimatedComplexity: 'low',
    };
  }

  /**
   * Register a custom schema
   */
  public registerSchema(schema: TableSchema): void {
    this.schemas.set(schema.name, schema);
    if (!this.config.allowedTables.includes(schema.name)) {
      this.config.allowedTables.push(schema.name);
    }
  }

  /**
   * Get all registered schemas
   */
  public getSchemas(): Map<string, TableSchema> {
    return new Map(this.schemas);
  }

  /**
   * Validate a raw SQL query (for debugging/testing)
   */
  public validateRawSQL(sql: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      /;\s*drop/i,
      /;\s*delete/i,
      /;\s*update/i,
      /;\s*insert/i,
      /;\s*truncate/i,
      /;\s*alter/i,
      /--/,
      /\/\*/,
      /xp_/i,
      /exec\s*\(/i,
      /union\s+select/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql)) {
        errors.push(`Dangerous SQL pattern detected: ${pattern.source}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

// Export singleton instance
export const queryToSQLTranslator = new QueryToSQLTranslator();

// Export factory function
export const createQueryToSQLTranslator = (
  config?: Partial<TranslatorConfig>
): QueryToSQLTranslator => {
  return new QueryToSQLTranslator(config);
};
