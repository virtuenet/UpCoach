/**
 * Natural Language Query Service
 * Translates natural language questions into structured queries
 * Supports coaching platform analytics and data exploration
 * @version 1.0.0
 */

import { logger } from '../../utils/logger';
import { AIService } from './AIService';

// ==================== Type Definitions ====================

export interface NLQuery {
  text: string;
  language?: 'en' | 'id'; // English or Indonesian
  context?: QueryContext;
}

export interface QueryContext {
  userId?: string;
  timeframe?: string;
  previousQueries?: string[];
  availableMetrics?: string[];
}

export interface StructuredQuery {
  intent: QueryIntent;
  entities: QueryEntity[];
  timeRange: TimeRange;
  aggregations: Aggregation[];
  filters: QueryFilter[];
  orderBy?: OrderBy;
  limit?: number;
  confidence: number;
}

export type QueryIntent =
  | 'count'
  | 'sum'
  | 'average'
  | 'trend'
  | 'comparison'
  | 'top_n'
  | 'distribution'
  | 'filter'
  | 'detail'
  | 'list';

export interface QueryEntity {
  type: EntityType;
  value: string;
  originalText: string;
  confidence: number;
}

export type EntityType =
  | 'metric'
  | 'dimension'
  | 'time_period'
  | 'coach'
  | 'client'
  | 'goal'
  | 'session'
  | 'subscription'
  | 'number'
  | 'comparison_operator';

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  relative?: string;
}

export interface Aggregation {
  type: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';
  field: string;
  alias?: string;
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
  value: unknown;
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryResult {
  success: boolean;
  query: StructuredQuery;
  data?: unknown[];
  explanation: string;
  suggestedFollowups?: string[];
  executionTime?: number;
}

// ==================== Query Templates ====================

interface QueryTemplate {
  patterns: RegExp[];
  intent: QueryIntent;
  extractor: (match: RegExpMatchArray, query: string) => Partial<StructuredQuery>;
}

// ==================== Natural Language Query Service ====================

export class NLQueryService {
  private aiService: AIService | null = null;
  private templates: QueryTemplate[] = [];
  private metricMappings: Map<string, string> = new Map();
  private entityMappings: Map<string, EntityType> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeMetricMappings();
    this.initializeEntityMappings();
  }

  /**
   * Initialize query pattern templates
   */
  private initializeTemplates(): void {
    this.templates = [
      // Count queries
      {
        patterns: [
          /how many (\w+)/i,
          /count( of)? (\w+)/i,
          /total( number of)? (\w+)/i,
          /berapa (banyak )?(\w+)/i, // Indonesian
        ],
        intent: 'count',
        extractor: (match, query) => this.extractCountQuery(match, query),
      },
      // Average queries
      {
        patterns: [
          /average (\w+)/i,
          /avg (\w+)/i,
          /mean (\w+)/i,
          /rata-rata (\w+)/i, // Indonesian
        ],
        intent: 'average',
        extractor: (match, query) => this.extractAggregateQuery(match, query, 'avg'),
      },
      // Sum queries
      {
        patterns: [
          /total (\w+) (amount|value|revenue)/i,
          /sum of (\w+)/i,
          /jumlah (\w+)/i, // Indonesian
        ],
        intent: 'sum',
        extractor: (match, query) => this.extractAggregateQuery(match, query, 'sum'),
      },
      // Trend queries
      {
        patterns: [
          /trend (of |in )?(\w+)/i,
          /(\w+) over time/i,
          /how (has |is )?(\w+) (changed|trending)/i,
          /tren (\w+)/i, // Indonesian
        ],
        intent: 'trend',
        extractor: (match, query) => this.extractTrendQuery(match, query),
      },
      // Top N queries
      {
        patterns: [
          /top (\d+) (\w+)/i,
          /best (\d+) (\w+)/i,
          /highest (\d+) (\w+)/i,
          /(\d+) (\w+) terbaik/i, // Indonesian
        ],
        intent: 'top_n',
        extractor: (match, query) => this.extractTopNQuery(match, query),
      },
      // Comparison queries
      {
        patterns: [
          /compare (\w+) (with|to|vs) (\w+)/i,
          /(\w+) vs (\w+)/i,
          /difference between (\w+) and (\w+)/i,
          /bandingkan (\w+) dengan (\w+)/i, // Indonesian
        ],
        intent: 'comparison',
        extractor: (match, query) => this.extractComparisonQuery(match, query),
      },
      // Distribution queries
      {
        patterns: [
          /distribution of (\w+)/i,
          /breakdown( of)? (\w+)/i,
          /(\w+) by (\w+)/i,
          /distribusi (\w+)/i, // Indonesian
        ],
        intent: 'distribution',
        extractor: (match, query) => this.extractDistributionQuery(match, query),
      },
      // List/detail queries
      {
        patterns: [
          /show( me)?( all)? (\w+)/i,
          /list( all)? (\w+)/i,
          /get (\w+)/i,
          /tampilkan (\w+)/i, // Indonesian
        ],
        intent: 'list',
        extractor: (match, query) => this.extractListQuery(match, query),
      },
    ];
  }

  /**
   * Initialize metric name mappings
   */
  private initializeMetricMappings(): void {
    const mappings: Record<string, string> = {
      // Session metrics
      'sessions': 'session_count',
      'session': 'session_count',
      'sesi': 'session_count', // Indonesian
      'no-shows': 'no_show_count',
      'no shows': 'no_show_count',
      'completed sessions': 'completed_session_count',

      // User metrics
      'users': 'user_count',
      'clients': 'client_count',
      'coaches': 'coach_count',
      'pengguna': 'user_count', // Indonesian
      'klien': 'client_count', // Indonesian
      'pelatih': 'coach_count', // Indonesian
      'active users': 'active_user_count',
      'new users': 'new_user_count',

      // Revenue metrics
      'revenue': 'total_revenue',
      'mrr': 'monthly_recurring_revenue',
      'arr': 'annual_recurring_revenue',
      'pendapatan': 'total_revenue', // Indonesian

      // Engagement metrics
      'engagement': 'engagement_score',
      'rating': 'average_rating',
      'ratings': 'average_rating',
      'penilaian': 'average_rating', // Indonesian

      // Goal metrics
      'goals': 'goal_count',
      'completed goals': 'completed_goal_count',
      'goal completion': 'goal_completion_rate',
      'tujuan': 'goal_count', // Indonesian

      // Churn metrics
      'churn': 'churn_rate',
      'churned': 'churned_user_count',
      'retention': 'retention_rate',

      // Subscription metrics
      'subscriptions': 'subscription_count',
      'subscribers': 'subscriber_count',
      'langganan': 'subscription_count', // Indonesian
    };

    for (const [key, value] of Object.entries(mappings)) {
      this.metricMappings.set(key.toLowerCase(), value);
    }
  }

  /**
   * Initialize entity type mappings
   */
  private initializeEntityMappings(): void {
    const mappings: Record<string, EntityType> = {
      'coach': 'coach',
      'pelatih': 'coach',
      'client': 'client',
      'klien': 'client',
      'user': 'client',
      'goal': 'goal',
      'tujuan': 'goal',
      'session': 'session',
      'sesi': 'session',
      'subscription': 'subscription',
      'langganan': 'subscription',
    };

    for (const [key, value] of Object.entries(mappings)) {
      this.entityMappings.set(key.toLowerCase(), value);
    }
  }

  /**
   * Parse natural language query into structured query
   */
  public async parse(nlQuery: NLQuery): Promise<StructuredQuery> {
    const normalizedText = nlQuery.text.toLowerCase().trim();
    logger.info(`[NLQueryService] Parsing query: ${normalizedText}`);

    // Try pattern matching first
    for (const template of this.templates) {
      for (const pattern of template.patterns) {
        const match = normalizedText.match(pattern);
        if (match) {
          const extracted = template.extractor(match, normalizedText);
          const entities = this.extractEntities(normalizedText);
          const timeRange = this.extractTimeRange(normalizedText);

          return {
            intent: template.intent,
            entities,
            timeRange,
            aggregations: extracted.aggregations || [],
            filters: extracted.filters || [],
            orderBy: extracted.orderBy,
            limit: extracted.limit,
            confidence: 0.85,
          };
        }
      }
    }

    // Fallback: Use AI for complex queries
    if (this.aiService) {
      return this.parseWithAI(nlQuery);
    }

    // Default fallback
    return this.createDefaultQuery(nlQuery);
  }

  /**
   * Extract entities from query text
   */
  private extractEntities(text: string): QueryEntity[] {
    const entities: QueryEntity[] = [];
    const words = text.split(/\s+/);

    for (const word of words) {
      const cleanWord = word.replace(/[.,?!]/g, '').toLowerCase();

      // Check metric mappings
      if (this.metricMappings.has(cleanWord)) {
        entities.push({
          type: 'metric',
          value: this.metricMappings.get(cleanWord)!,
          originalText: word,
          confidence: 0.9,
        });
      }

      // Check entity mappings
      if (this.entityMappings.has(cleanWord)) {
        entities.push({
          type: this.entityMappings.get(cleanWord)!,
          value: cleanWord,
          originalText: word,
          confidence: 0.9,
        });
      }

      // Check for numbers
      const num = parseInt(cleanWord, 10);
      if (!isNaN(num)) {
        entities.push({
          type: 'number',
          value: String(num),
          originalText: word,
          confidence: 1.0,
        });
      }
    }

    return entities;
  }

  /**
   * Extract time range from query text
   */
  private extractTimeRange(text: string): TimeRange {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);
    let granularity: TimeRange['granularity'] = 'day';
    let relative: string | undefined;

    // Today
    if (/today|hari ini/i.test(text)) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      relative = 'today';
    }
    // Yesterday
    else if (/yesterday|kemarin/i.test(text)) {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      relative = 'yesterday';
    }
    // This week
    else if (/this week|minggu ini/i.test(text)) {
      const dayOfWeek = now.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      relative = 'this_week';
      granularity = 'day';
    }
    // Last week
    else if (/last week|minggu lalu/i.test(text)) {
      const dayOfWeek = now.getDay();
      start.setDate(start.getDate() - dayOfWeek - 7);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - dayOfWeek - 1);
      end.setHours(23, 59, 59, 999);
      relative = 'last_week';
      granularity = 'day';
    }
    // This month
    else if (/this month|bulan ini/i.test(text)) {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      relative = 'this_month';
      granularity = 'day';
    }
    // Last month
    else if (/last month|bulan lalu/i.test(text)) {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setDate(0); // Last day of previous month
      end.setHours(23, 59, 59, 999);
      relative = 'last_month';
      granularity = 'day';
    }
    // Last N days
    else if (/last (\d+) days?|(\d+) hari terakhir/i.test(text)) {
      const match = text.match(/last (\d+) days?|(\d+) hari terakhir/i);
      const days = parseInt(match![1] || match![2], 10);
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);
      relative = `last_${days}_days`;
      granularity = days > 30 ? 'week' : 'day';
    }
    // This year
    else if (/this year|tahun ini/i.test(text)) {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      relative = 'this_year';
      granularity = 'month';
    }
    // Last year
    else if (/last year|tahun lalu/i.test(text)) {
      start.setFullYear(start.getFullYear() - 1);
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(end.getFullYear() - 1);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      relative = 'last_year';
      granularity = 'month';
    }
    // Default: last 30 days
    else {
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      relative = 'last_30_days';
    }

    return { start, end, granularity, relative };
  }

  // ==================== Query Extractors ====================

  private extractCountQuery(match: RegExpMatchArray, query: string): Partial<StructuredQuery> {
    const metricWord = match[1] || match[2];
    const field = this.metricMappings.get(metricWord?.toLowerCase()) || metricWord;

    return {
      aggregations: [{ type: 'count', field, alias: `${field}_count` }],
      filters: this.extractFilters(query),
    };
  }

  private extractAggregateQuery(
    match: RegExpMatchArray,
    query: string,
    aggType: 'avg' | 'sum' | 'min' | 'max'
  ): Partial<StructuredQuery> {
    const metricWord = match[1];
    const field = this.metricMappings.get(metricWord?.toLowerCase()) || metricWord;

    return {
      aggregations: [{ type: aggType, field, alias: `${field}_${aggType}` }],
      filters: this.extractFilters(query),
    };
  }

  private extractTrendQuery(match: RegExpMatchArray, query: string): Partial<StructuredQuery> {
    const metricWord = match[1] || match[2];
    const field = this.metricMappings.get(metricWord?.toLowerCase()) || metricWord;

    return {
      aggregations: [
        { type: 'sum', field, alias: `${field}_total` },
        { type: 'count', field: '*', alias: 'count' },
      ],
      orderBy: { field: 'date', direction: 'asc' },
      filters: this.extractFilters(query),
    };
  }

  private extractTopNQuery(match: RegExpMatchArray, query: string): Partial<StructuredQuery> {
    const n = parseInt(match[1], 10) || 10;
    const metricWord = match[2];
    const field = this.metricMappings.get(metricWord?.toLowerCase()) || metricWord;

    return {
      aggregations: [{ type: 'count', field, alias: `${field}_count` }],
      orderBy: { field: `${field}_count`, direction: 'desc' },
      limit: n,
      filters: this.extractFilters(query),
    };
  }

  private extractComparisonQuery(match: RegExpMatchArray, query: string): Partial<StructuredQuery> {
    const entity1 = match[1];
    const entity2 = match[2] || match[3];

    return {
      aggregations: [
        { type: 'sum', field: entity1, alias: `${entity1}_total` },
        { type: 'sum', field: entity2, alias: `${entity2}_total` },
      ],
      filters: this.extractFilters(query),
    };
  }

  private extractDistributionQuery(match: RegExpMatchArray, query: string): Partial<StructuredQuery> {
    const metricWord = match[1] || match[2];
    const field = this.metricMappings.get(metricWord?.toLowerCase()) || metricWord;

    return {
      aggregations: [
        { type: 'count', field: '*', alias: 'count' },
        { type: 'sum', field, alias: `${field}_total` },
      ],
      filters: this.extractFilters(query),
    };
  }

  private extractListQuery(match: RegExpMatchArray, query: string): Partial<StructuredQuery> {
    const entityWord = match[1] || match[2] || match[3];
    const entity = this.entityMappings.get(entityWord?.toLowerCase()) || entityWord;

    return {
      aggregations: [],
      filters: this.extractFilters(query),
      limit: 50,
    };
  }

  /**
   * Extract filters from query text
   */
  private extractFilters(text: string): QueryFilter[] {
    const filters: QueryFilter[] = [];

    // Status filters
    if (/active|aktif/i.test(text)) {
      filters.push({ field: 'status', operator: 'eq', value: 'active' });
    }
    if (/inactive|tidak aktif/i.test(text)) {
      filters.push({ field: 'status', operator: 'eq', value: 'inactive' });
    }
    if (/completed|selesai/i.test(text)) {
      filters.push({ field: 'status', operator: 'eq', value: 'completed' });
    }
    if (/pending|menunggu/i.test(text)) {
      filters.push({ field: 'status', operator: 'eq', value: 'pending' });
    }

    // Subscription tier filters
    if (/pro\b/i.test(text)) {
      filters.push({ field: 'subscription_tier', operator: 'eq', value: 'pro' });
    }
    if (/basic/i.test(text)) {
      filters.push({ field: 'subscription_tier', operator: 'eq', value: 'basic' });
    }
    if (/enterprise/i.test(text)) {
      filters.push({ field: 'subscription_tier', operator: 'eq', value: 'enterprise' });
    }
    if (/free|gratis/i.test(text)) {
      filters.push({ field: 'subscription_tier', operator: 'eq', value: 'free' });
    }

    // Comparison operators
    const gtMatch = text.match(/(?:greater than|more than|>) (\d+)/i);
    if (gtMatch) {
      filters.push({ field: 'value', operator: 'gt', value: parseInt(gtMatch[1], 10) });
    }

    const ltMatch = text.match(/(?:less than|fewer than|<) (\d+)/i);
    if (ltMatch) {
      filters.push({ field: 'value', operator: 'lt', value: parseInt(ltMatch[1], 10) });
    }

    return filters;
  }

  /**
   * Parse complex queries using AI
   */
  private async parseWithAI(nlQuery: NLQuery): Promise<StructuredQuery> {
    // This would use the AI service for complex parsing
    // For now, return default query
    logger.info('[NLQueryService] AI parsing not available, using default');
    return this.createDefaultQuery(nlQuery);
  }

  /**
   * Create default query for unmatched patterns
   */
  private createDefaultQuery(nlQuery: NLQuery): StructuredQuery {
    return {
      intent: 'list',
      entities: this.extractEntities(nlQuery.text),
      timeRange: this.extractTimeRange(nlQuery.text),
      aggregations: [],
      filters: this.extractFilters(nlQuery.text),
      confidence: 0.5,
    };
  }

  /**
   * Generate SQL-like query from structured query
   */
  public toSQL(query: StructuredQuery, tableName: string = 'analytics'): string {
    const parts: string[] = ['SELECT'];

    // Aggregations or *
    if (query.aggregations.length > 0) {
      const aggClauses = query.aggregations.map(agg => {
        const aggFunc = agg.type.toUpperCase();
        return `${aggFunc}(${agg.field}) AS ${agg.alias || agg.field}`;
      });
      parts.push(aggClauses.join(', '));
    } else {
      parts.push('*');
    }

    parts.push(`FROM ${tableName}`);

    // WHERE clause
    const whereClauses: string[] = [];

    // Time range filter
    whereClauses.push(
      `created_at BETWEEN '${query.timeRange.start.toISOString()}' AND '${query.timeRange.end.toISOString()}'`
    );

    // Other filters
    for (const filter of query.filters) {
      const op = this.sqlOperator(filter.operator);
      if (typeof filter.value === 'string') {
        whereClauses.push(`${filter.field} ${op} '${filter.value}'`);
      } else {
        whereClauses.push(`${filter.field} ${op} ${filter.value}`);
      }
    }

    if (whereClauses.length > 0) {
      parts.push('WHERE ' + whereClauses.join(' AND '));
    }

    // GROUP BY for trends/distributions
    if (query.intent === 'trend' || query.intent === 'distribution') {
      parts.push(`GROUP BY DATE_TRUNC('${query.timeRange.granularity}', created_at)`);
    }

    // ORDER BY
    if (query.orderBy) {
      parts.push(`ORDER BY ${query.orderBy.field} ${query.orderBy.direction.toUpperCase()}`);
    }

    // LIMIT
    if (query.limit) {
      parts.push(`LIMIT ${query.limit}`);
    }

    return parts.join(' ');
  }

  /**
   * Convert operator to SQL
   */
  private sqlOperator(op: QueryFilter['operator']): string {
    const mapping: Record<QueryFilter['operator'], string> = {
      eq: '=',
      ne: '!=',
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      in: 'IN',
      contains: 'LIKE',
      between: 'BETWEEN',
    };
    return mapping[op];
  }

  /**
   * Generate human-readable explanation of query
   */
  public explain(query: StructuredQuery): string {
    const parts: string[] = [];

    // Intent description
    const intentDescriptions: Record<QueryIntent, string> = {
      count: 'counting',
      sum: 'calculating the total',
      average: 'calculating the average',
      trend: 'analyzing the trend of',
      comparison: 'comparing',
      top_n: 'finding the top',
      distribution: 'showing the distribution of',
      filter: 'filtering',
      detail: 'getting details for',
      list: 'listing',
    };

    parts.push(`This query is ${intentDescriptions[query.intent]}`);

    // Entities
    const metricEntities = query.entities.filter(e => e.type === 'metric');
    if (metricEntities.length > 0) {
      parts.push(`the ${metricEntities.map(e => e.value).join(' and ')}`);
    }

    // Time range
    if (query.timeRange.relative) {
      parts.push(`for ${query.timeRange.relative.replace(/_/g, ' ')}`);
    }

    // Filters
    if (query.filters.length > 0) {
      const filterDesc = query.filters.map(f => `${f.field} ${f.operator} ${f.value}`).join(', ');
      parts.push(`where ${filterDesc}`);
    }

    // Limit
    if (query.limit) {
      parts.push(`(limited to ${query.limit} results)`);
    }

    return parts.join(' ') + '.';
  }

  /**
   * Generate suggested follow-up queries
   */
  public suggestFollowups(query: StructuredQuery): string[] {
    const suggestions: string[] = [];

    if (query.intent === 'count') {
      suggestions.push(`Show me the trend of ${query.entities[0]?.value || 'this metric'} over time`);
      suggestions.push(`What is the average ${query.entities[0]?.value || 'value'}?`);
    }

    if (query.intent === 'trend') {
      suggestions.push('Compare this month vs last month');
      suggestions.push('What are the peak periods?');
    }

    if (query.intent === 'top_n') {
      suggestions.push('Show me the bottom performers');
      suggestions.push('What is the distribution across all?');
    }

    // Generic suggestions
    suggestions.push('Break this down by subscription tier');
    suggestions.push('Show me only active users');

    return suggestions.slice(0, 4);
  }

  /**
   * Set AI service for complex parsing
   */
  public setAIService(aiService: AIService): void {
    this.aiService = aiService;
  }
}

// Export singleton instance
export const nlQueryService = new NLQueryService();

// Export factory function
export const createNLQueryService = (): NLQueryService => {
  return new NLQueryService();
};
