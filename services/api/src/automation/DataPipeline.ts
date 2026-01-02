import { Pool, PoolClient } from 'pg';
import { MongoClient, Db } from 'mongodb';
import { parse as parseCsv } from 'csv-parse';
import JSONStream from 'JSONStream';
import { createReadStream, createWriteStream } from 'fs';
import { Logger } from 'winston';
import { EventEmitter } from 'events';
import axios from 'axios';

// ===========================
// Interfaces and Types
// ===========================

interface DataSource {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'rest-api' | 'csv' | 'json' | 's3' | 'bigquery';
  config: Record<string, any>;
  schema?: Schema;
}

interface Schema {
  fields: SchemaField[];
  primaryKey?: string[];
  partitionKey?: string;
}

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
  nullable: boolean;
  unique?: boolean;
  description?: string;
}

interface Transformation {
  id: string;
  name: string;
  type: 'filter' | 'map' | 'reduce' | 'join' | 'aggregate' | 'window' | 'pivot' | 'sort' | 'deduplicate';
  config: Record<string, any>;
}

interface Pipeline {
  id: string;
  name: string;
  source: DataSource;
  transformations: Transformation[];
  destination: DataSource;
  schedule?: string;
  watermark?: Watermark;
  enabled: boolean;
  metadata: Record<string, any>;
}

interface Watermark {
  field: string;
  value: any;
  type: 'timestamp' | 'sequence';
}

interface DataQualityRule {
  id: string;
  name: string;
  type: 'type-check' | 'range-check' | 'uniqueness' | 'referential-integrity' | 'pattern' | 'custom';
  field: string;
  config: Record<string, any>;
  severity: 'error' | 'warning' | 'info';
}

interface DataProfile {
  field: string;
  count: number;
  nullCount: number;
  uniqueCount: number;
  min?: any;
  max?: any;
  mean?: number;
  median?: number;
  stdDev?: number;
  distribution: Map<any, number>;
  outliers: any[];
}

interface WindowConfig {
  type: 'tumbling' | 'sliding' | 'session';
  size: number; // milliseconds
  slide?: number; // for sliding windows
  gap?: number; // for session windows
  field: string; // timestamp field
}

interface JoinConfig {
  type: 'inner' | 'left' | 'right' | 'full' | 'cross';
  leftKey: string;
  rightKey: string;
  timeWindow?: number; // for stream joins
}

interface AggregationConfig {
  groupBy: string[];
  aggregates: {
    field: string;
    function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'percentile';
    percentile?: number;
  }[];
}

interface DataLineage {
  datasetId: string;
  upstream: LineageNode[];
  downstream: LineageNode[];
  transformations: string[];
}

interface LineageNode {
  datasetId: string;
  type: 'source' | 'transformation' | 'destination';
  timestamp: Date;
}

interface DataCatalogEntry {
  id: string;
  name: string;
  description: string;
  schema: Schema;
  tags: string[];
  owner: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
  statistics?: DataStatistics;
  lineage?: DataLineage;
  accessPolicy?: AccessPolicy;
}

interface DataStatistics {
  rowCount: number;
  sizeBytes: number;
  lastUpdated: Date;
  profiles: Map<string, DataProfile>;
}

interface AccessPolicy {
  rowLevelSecurity?: {
    condition: string;
    roles: string[];
  }[];
  columnMasking?: {
    column: string;
    maskType: 'hash' | 'redact' | 'encrypt';
    roles: string[];
  }[];
}

interface QueryPlan {
  steps: QueryStep[];
  estimatedCost: number;
  parallelism: number;
}

interface QueryStep {
  id: string;
  operation: string;
  estimatedRows: number;
  estimatedCost: number;
  optimizations: string[];
}

// ===========================
// Data Pipeline Engine
// ===========================

export class DataPipeline extends EventEmitter {
  private logger: Logger;
  private pgPool?: Pool;
  private mongoClient?: MongoClient;
  private pipelines: Map<string, Pipeline> = new Map();
  private catalog: Map<string, DataCatalogEntry> = new Map();
  private lineageGraph: Map<string, DataLineage> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 300000; // 5 minutes

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  // ===========================
  // ETL Automation
  // ===========================

  async extract(source: DataSource, options: { limit?: number; offset?: number; watermark?: Watermark } = {}): Promise<any[]> {
    this.logger.info('Extracting data', { sourceId: source.id, type: source.type });

    switch (source.type) {
      case 'postgresql':
        return this.extractFromPostgreSQL(source, options);

      case 'mongodb':
        return this.extractFromMongoDB(source, options);

      case 'rest-api':
        return this.extractFromAPI(source, options);

      case 'csv':
        return this.extractFromCSV(source, options);

      case 'json':
        return this.extractFromJSON(source, options);

      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  private async extractFromPostgreSQL(source: DataSource, options: any): Promise<any[]> {
    if (!this.pgPool) {
      this.pgPool = new Pool({
        host: source.config.host,
        port: source.config.port,
        database: source.config.database,
        user: source.config.user,
        password: source.config.password,
        max: 20,
      });
    }

    let query = `SELECT * FROM ${source.config.table}`;
    const params: any[] = [];

    // Incremental loading with watermark
    if (options.watermark) {
      query += ` WHERE ${options.watermark.field} > $1`;
      params.push(options.watermark.value);
    }

    // Pagination
    if (options.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    const result = await this.pgPool.query(query, params);
    this.logger.info('PostgreSQL extraction completed', { rowCount: result.rows.length });

    return result.rows;
  }

  private async extractFromMongoDB(source: DataSource, options: any): Promise<any[]> {
    if (!this.mongoClient) {
      this.mongoClient = new MongoClient(source.config.connectionString);
      await this.mongoClient.connect();
    }

    const db = this.mongoClient.db(source.config.database);
    const collection = db.collection(source.config.collection);

    const filter: any = {};

    // Incremental loading with watermark
    if (options.watermark) {
      filter[options.watermark.field] = { $gt: options.watermark.value };
    }

    const cursor = collection.find(filter);

    if (options.limit) {
      cursor.limit(options.limit);
    }

    if (options.offset) {
      cursor.skip(options.offset);
    }

    const results = await cursor.toArray();
    this.logger.info('MongoDB extraction completed', { rowCount: results.length });

    return results;
  }

  private async extractFromAPI(source: DataSource, options: any): Promise<any[]> {
    const results: any[] = [];
    let page = options.offset || 0;
    const limit = options.limit || 1000;

    while (true) {
      const url = source.config.endpoint.replace('{page}', page).replace('{limit}', limit);

      try {
        const response = await axios.get(url, {
          headers: source.config.headers || {},
          timeout: 30000,
        });

        const data = source.config.dataPath
          ? this.getNestedValue(response.data, source.config.dataPath)
          : response.data;

        if (!Array.isArray(data) || data.length === 0) {
          break;
        }

        results.push(...data);

        // Check if there are more pages
        if (data.length < limit || !source.config.pagination) {
          break;
        }

        page++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, source.config.rateLimitMs || 100));
      } catch (error) {
        this.logger.error('API extraction failed', {
          url,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }

    this.logger.info('API extraction completed', { rowCount: results.length });
    return results;
  }

  private async extractFromCSV(source: DataSource, options: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const parser = parseCsv({
        columns: true,
        skip_empty_lines: true,
        delimiter: source.config.delimiter || ',',
      });

      createReadStream(source.config.filePath)
        .pipe(parser)
        .on('data', (row) => {
          if (options.limit && results.length >= options.limit) {
            parser.end();
            return;
          }
          results.push(row);
        })
        .on('end', () => {
          this.logger.info('CSV extraction completed', { rowCount: results.length });
          resolve(results);
        })
        .on('error', (error) => {
          this.logger.error('CSV extraction failed', { error: error.message });
          reject(error);
        });
    });
  }

  private async extractFromJSON(source: DataSource, options: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const parser = JSONStream.parse(source.config.jsonPath || '*');

      createReadStream(source.config.filePath)
        .pipe(parser)
        .on('data', (data) => {
          if (options.limit && results.length >= options.limit) {
            parser.end();
            return;
          }
          results.push(data);
        })
        .on('end', () => {
          this.logger.info('JSON extraction completed', { rowCount: results.length });
          resolve(results);
        })
        .on('error', (error) => {
          this.logger.error('JSON extraction failed', { error: error.message });
          reject(error);
        });
    });
  }

  async transform(data: any[], transformations: Transformation[]): Promise<any[]> {
    this.logger.info('Applying transformations', { transformationCount: transformations.length });

    let result = data;

    for (const transformation of transformations) {
      result = await this.applyTransformation(result, transformation);
    }

    return result;
  }

  private async applyTransformation(data: any[], transformation: Transformation): Promise<any[]> {
    this.logger.info('Applying transformation', { type: transformation.type });

    switch (transformation.type) {
      case 'filter':
        return this.filterTransform(data, transformation.config);

      case 'map':
        return this.mapTransform(data, transformation.config);

      case 'reduce':
        return this.reduceTransform(data, transformation.config);

      case 'join':
        return this.joinTransform(data, transformation.config);

      case 'aggregate':
        return this.aggregateTransform(data, transformation.config);

      case 'window':
        return this.windowTransform(data, transformation.config);

      case 'pivot':
        return this.pivotTransform(data, transformation.config);

      case 'sort':
        return this.sortTransform(data, transformation.config);

      case 'deduplicate':
        return this.deduplicateTransform(data, transformation.config);

      default:
        this.logger.warn('Unknown transformation type', { type: transformation.type });
        return data;
    }
  }

  private filterTransform(data: any[], config: any): any[] {
    const condition = config.condition;
    return data.filter(row => this.evaluateCondition(condition, row));
  }

  private mapTransform(data: any[], config: any): any[] {
    const mappings = config.mappings || {};
    return data.map(row => {
      const mapped: any = {};
      for (const [target, source] of Object.entries(mappings)) {
        if (typeof source === 'function') {
          mapped[target] = source(row);
        } else {
          mapped[target] = this.getNestedValue(row, source as string);
        }
      }
      return { ...row, ...mapped };
    });
  }

  private reduceTransform(data: any[], config: any): any[] {
    const groupBy = config.groupBy as string;
    const reducer = config.reducer;

    const groups = new Map<any, any[]>();
    for (const row of data) {
      const key = this.getNestedValue(row, groupBy);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    }

    const results: any[] = [];
    for (const [key, groupData] of groups) {
      results.push(reducer(groupData, key));
    }

    return results;
  }

  private joinTransform(data: any[], config: JoinConfig): any[] {
    const rightData = config.rightKey as any; // In practice, this would be another dataset
    const leftKey = config.leftKey;
    const rightKey = config.rightKey;
    const joinType = config.type;

    // Build index for right dataset
    const rightIndex = new Map<any, any[]>();
    if (Array.isArray(rightData)) {
      for (const row of rightData) {
        const key = this.getNestedValue(row, rightKey);
        if (!rightIndex.has(key)) {
          rightIndex.set(key, []);
        }
        rightIndex.get(key)!.push(row);
      }
    }

    const results: any[] = [];

    for (const leftRow of data) {
      const key = this.getNestedValue(leftRow, leftKey);
      const rightRows = rightIndex.get(key) || [];

      if (rightRows.length > 0) {
        for (const rightRow of rightRows) {
          results.push({ ...leftRow, ...rightRow });
        }
      } else if (joinType === 'left' || joinType === 'full') {
        results.push(leftRow);
      }
    }

    return results;
  }

  private aggregateTransform(data: any[], config: AggregationConfig): any[] {
    const groupBy = config.groupBy;
    const aggregates = config.aggregates;

    // Group data
    const groups = new Map<string, any[]>();
    for (const row of data) {
      const key = groupBy.map(field => this.getNestedValue(row, field)).join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    }

    // Calculate aggregates
    const results: any[] = [];
    for (const [key, groupData] of groups) {
      const result: any = {};

      // Add group by fields
      const keyParts = key.split('|');
      groupBy.forEach((field, index) => {
        result[field] = keyParts[index];
      });

      // Calculate aggregates
      for (const agg of aggregates) {
        const values = groupData.map(row => this.getNestedValue(row, agg.field)).filter(v => v != null);

        switch (agg.function) {
          case 'count':
            result[`${agg.field}_count`] = values.length;
            break;
          case 'sum':
            result[`${agg.field}_sum`] = values.reduce((sum, v) => sum + Number(v), 0);
            break;
          case 'avg':
            result[`${agg.field}_avg`] = values.reduce((sum, v) => sum + Number(v), 0) / values.length;
            break;
          case 'min':
            result[`${agg.field}_min`] = Math.min(...values.map(Number));
            break;
          case 'max':
            result[`${agg.field}_max`] = Math.max(...values.map(Number));
            break;
          case 'percentile':
            const sorted = [...values].sort((a, b) => Number(a) - Number(b));
            const index = Math.ceil((agg.percentile! / 100) * sorted.length) - 1;
            result[`${agg.field}_p${agg.percentile}`] = sorted[index];
            break;
        }
      }

      results.push(result);
    }

    return results;
  }

  private windowTransform(data: any[], config: WindowConfig): any[] {
    const timeField = config.field;
    const windowSize = config.size;
    const windowType = config.type;

    // Sort by time
    const sorted = [...data].sort((a, b) => {
      const timeA = new Date(this.getNestedValue(a, timeField)).getTime();
      const timeB = new Date(this.getNestedValue(b, timeField)).getTime();
      return timeA - timeB;
    });

    const windows: any[][] = [];

    if (windowType === 'tumbling') {
      // Fixed non-overlapping windows
      let currentWindow: any[] = [];
      let windowStart = 0;

      for (const row of sorted) {
        const rowTime = new Date(this.getNestedValue(row, timeField)).getTime();

        if (windowStart === 0) {
          windowStart = rowTime;
        }

        if (rowTime < windowStart + windowSize) {
          currentWindow.push(row);
        } else {
          if (currentWindow.length > 0) {
            windows.push(currentWindow);
          }
          currentWindow = [row];
          windowStart = rowTime;
        }
      }

      if (currentWindow.length > 0) {
        windows.push(currentWindow);
      }
    } else if (windowType === 'sliding') {
      // Overlapping windows
      const slide = config.slide || windowSize / 2;

      for (let i = 0; i < sorted.length; i++) {
        const windowStart = new Date(this.getNestedValue(sorted[i], timeField)).getTime();
        const windowEnd = windowStart + windowSize;
        const window: any[] = [];

        for (let j = i; j < sorted.length; j++) {
          const rowTime = new Date(this.getNestedValue(sorted[j], timeField)).getTime();
          if (rowTime < windowEnd) {
            window.push(sorted[j]);
          } else {
            break;
          }
        }

        if (window.length > 0) {
          windows.push(window);
        }

        // Move to next slide position
        while (i + 1 < sorted.length) {
          const nextTime = new Date(this.getNestedValue(sorted[i + 1], timeField)).getTime();
          if (nextTime >= windowStart + slide) {
            break;
          }
          i++;
        }
      }
    } else if (windowType === 'session') {
      // Activity-based windows
      const gap = config.gap || 300000; // 5 minutes default
      let currentWindow: any[] = [];
      let lastTime = 0;

      for (const row of sorted) {
        const rowTime = new Date(this.getNestedValue(row, timeField)).getTime();

        if (lastTime === 0 || rowTime - lastTime <= gap) {
          currentWindow.push(row);
        } else {
          if (currentWindow.length > 0) {
            windows.push(currentWindow);
          }
          currentWindow = [row];
        }

        lastTime = rowTime;
      }

      if (currentWindow.length > 0) {
        windows.push(currentWindow);
      }
    }

    // Flatten windows back to rows with window metadata
    const results: any[] = [];
    windows.forEach((window, index) => {
      window.forEach(row => {
        results.push({ ...row, _window: index });
      });
    });

    return results;
  }

  private pivotTransform(data: any[], config: any): any[] {
    const rowKey = config.rowKey;
    const columnKey = config.columnKey;
    const valueKey = config.valueKey;

    const pivoted = new Map<any, any>();

    for (const row of data) {
      const rKey = this.getNestedValue(row, rowKey);
      const cKey = this.getNestedValue(row, columnKey);
      const value = this.getNestedValue(row, valueKey);

      if (!pivoted.has(rKey)) {
        pivoted.set(rKey, { [rowKey]: rKey });
      }

      pivoted.get(rKey)![cKey] = value;
    }

    return Array.from(pivoted.values());
  }

  private sortTransform(data: any[], config: any): any[] {
    const sortBy = config.sortBy;
    const order = config.order || 'asc';

    return [...data].sort((a, b) => {
      const aVal = this.getNestedValue(a, sortBy);
      const bVal = this.getNestedValue(b, sortBy);

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private deduplicateTransform(data: any[], config: any): any[] {
    const keyFields = config.keyFields || [];
    const seen = new Set<string>();
    const results: any[] = [];

    for (const row of data) {
      const key = keyFields.map((field: string) => this.getNestedValue(row, field)).join('|');

      if (!seen.has(key)) {
        seen.add(key);
        results.push(row);
      }
    }

    return results;
  }

  async load(data: any[], destination: DataSource): Promise<void> {
    this.logger.info('Loading data', { destinationId: destination.id, type: destination.type, rowCount: data.length });

    switch (destination.type) {
      case 'postgresql':
        await this.loadToPostgreSQL(data, destination);
        break;

      case 'mongodb':
        await this.loadToMongoDB(data, destination);
        break;

      case 'csv':
        await this.loadToCSV(data, destination);
        break;

      case 'json':
        await this.loadToJSON(data, destination);
        break;

      default:
        throw new Error(`Unsupported destination type: ${destination.type}`);
    }

    this.logger.info('Data loading completed', { destinationId: destination.id });
  }

  private async loadToPostgreSQL(data: any[], destination: DataSource): Promise<void> {
    if (!this.pgPool) {
      this.pgPool = new Pool({
        host: destination.config.host,
        port: destination.config.port,
        database: destination.config.database,
        user: destination.config.user,
        password: destination.config.password,
      });
    }

    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');

      // Batch insert
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        if (batch.length === 0) continue;

        const columns = Object.keys(batch[0]);
        const values = batch.map((row, index) => {
          const rowValues = columns.map(col => row[col]);
          const placeholders = columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`);
          return `(${placeholders.join(', ')})`;
        });

        const query = `
          INSERT INTO ${destination.config.table} (${columns.join(', ')})
          VALUES ${values.join(', ')}
          ON CONFLICT DO NOTHING
        `;

        const params = batch.flatMap(row => columns.map(col => row[col]));
        await client.query(query, params);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async loadToMongoDB(data: any[], destination: DataSource): Promise<void> {
    if (!this.mongoClient) {
      this.mongoClient = new MongoClient(destination.config.connectionString);
      await this.mongoClient.connect();
    }

    const db = this.mongoClient.db(destination.config.database);
    const collection = db.collection(destination.config.collection);

    const batchSize = 1000;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await collection.insertMany(batch, { ordered: false });
    }
  }

  private async loadToCSV(data: any[], destination: DataSource): Promise<void> {
    const stream = createWriteStream(destination.config.filePath);

    // Write header
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      stream.write(columns.join(',') + '\n');

      // Write rows
      for (const row of data) {
        const values = columns.map(col => {
          const value = row[col];
          if (value == null) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        });
        stream.write(values.join(',') + '\n');
      }
    }

    stream.end();
  }

  private async loadToJSON(data: any[], destination: DataSource): Promise<void> {
    const stream = createWriteStream(destination.config.filePath);
    stream.write(JSON.stringify(data, null, 2));
    stream.end();
  }

  // ===========================
  // Data Quality
  // ===========================

  async validateData(data: any[], rules: DataQualityRule[]): Promise<{ valid: boolean; errors: any[] }> {
    this.logger.info('Validating data', { ruleCount: rules.length, rowCount: data.length });

    const errors: any[] = [];

    for (const rule of rules) {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const value = this.getNestedValue(row, rule.field);

        const violation = this.checkRule(rule, value, row);
        if (violation) {
          errors.push({
            row: i,
            rule: rule.name,
            field: rule.field,
            severity: rule.severity,
            message: violation,
          });
        }
      }
    }

    const valid = errors.filter(e => e.severity === 'error').length === 0;

    this.logger.info('Data validation completed', { valid, errorCount: errors.length });

    return { valid, errors };
  }

  private checkRule(rule: DataQualityRule, value: any, row: any): string | null {
    switch (rule.type) {
      case 'type-check':
        const expectedType = rule.config.type;
        const actualType = typeof value;
        if (actualType !== expectedType) {
          return `Expected type ${expectedType}, got ${actualType}`;
        }
        break;

      case 'range-check':
        const numValue = Number(value);
        if (rule.config.min != null && numValue < rule.config.min) {
          return `Value ${numValue} is below minimum ${rule.config.min}`;
        }
        if (rule.config.max != null && numValue > rule.config.max) {
          return `Value ${numValue} is above maximum ${rule.config.max}`;
        }
        break;

      case 'pattern':
        const pattern = new RegExp(rule.config.pattern);
        if (!pattern.test(String(value))) {
          return `Value does not match pattern ${rule.config.pattern}`;
        }
        break;

      case 'uniqueness':
        // This would require tracking seen values across all rows
        // Simplified implementation
        break;
    }

    return null;
  }

  async profileData(data: any[], fields: string[]): Promise<Map<string, DataProfile>> {
    this.logger.info('Profiling data', { fieldCount: fields.length, rowCount: data.length });

    const profiles = new Map<string, DataProfile>();

    for (const field of fields) {
      const values = data.map(row => this.getNestedValue(row, field)).filter(v => v != null);
      const nullCount = data.length - values.length;
      const uniqueValues = new Set(values);

      const profile: DataProfile = {
        field,
        count: data.length,
        nullCount,
        uniqueCount: uniqueValues.size,
        distribution: new Map(),
        outliers: [],
      };

      // Calculate distribution
      for (const value of values) {
        profile.distribution.set(value, (profile.distribution.get(value) || 0) + 1);
      }

      // Calculate statistics for numeric fields
      const numericValues = values.filter(v => typeof v === 'number' || !isNaN(Number(v))).map(Number);

      if (numericValues.length > 0) {
        profile.min = Math.min(...numericValues);
        profile.max = Math.max(...numericValues);
        profile.mean = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;

        // Calculate median
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        profile.median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

        // Calculate standard deviation
        const variance = numericValues.reduce((sum, v) => sum + Math.pow(v - profile.mean!, 2), 0) / numericValues.length;
        profile.stdDev = Math.sqrt(variance);

        // Detect outliers using IQR method
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        profile.outliers = numericValues.filter(v => v < lowerBound || v > upperBound);
      }

      profiles.set(field, profile);
    }

    return profiles;
  }

  async detectAnomalies(data: any[], field: string, method: 'z-score' | 'iqr' = 'z-score', threshold: number = 3): Promise<any[]> {
    this.logger.info('Detecting anomalies', { field, method, threshold });

    const values = data.map(row => this.getNestedValue(row, field)).filter(v => v != null).map(Number);
    const anomalies: any[] = [];

    if (method === 'z-score') {
      // Z-score method
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      for (let i = 0; i < data.length; i++) {
        const value = Number(this.getNestedValue(data[i], field));
        if (!isNaN(value)) {
          const zScore = Math.abs((value - mean) / stdDev);
          if (zScore > threshold) {
            anomalies.push({ row: i, value, zScore, data: data[i] });
          }
        }
      }
    } else if (method === 'iqr') {
      // IQR method
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - threshold * iqr;
      const upperBound = q3 + threshold * iqr;

      for (let i = 0; i < data.length; i++) {
        const value = Number(this.getNestedValue(data[i], field));
        if (!isNaN(value) && (value < lowerBound || value > upperBound)) {
          anomalies.push({ row: i, value, lowerBound, upperBound, data: data[i] });
        }
      }
    }

    this.logger.info('Anomaly detection completed', { anomalyCount: anomalies.length });
    return anomalies;
  }

  async deduplicateData(data: any[], keyFields: string[], fuzzyMatch: boolean = false): Promise<any[]> {
    this.logger.info('Deduplicating data', { keyFields, fuzzyMatch });

    const unique: any[] = [];
    const seen = new Set<string>();

    for (const row of data) {
      let key = keyFields.map(field => this.getNestedValue(row, field)).join('|');

      if (fuzzyMatch) {
        // Normalize for fuzzy matching
        key = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      }

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(row);
      }
    }

    this.logger.info('Deduplication completed', { original: data.length, unique: unique.length });
    return unique;
  }

  // ===========================
  // Data Catalog
  // ===========================

  async registerDataset(entry: DataCatalogEntry): Promise<void> {
    this.catalog.set(entry.id, entry);

    // Extract metadata if not provided
    if (!entry.statistics) {
      // Would extract from actual data source
      entry.statistics = {
        rowCount: 0,
        sizeBytes: 0,
        lastUpdated: new Date(),
        profiles: new Map(),
      };
    }

    this.logger.info('Dataset registered in catalog', { datasetId: entry.id });
  }

  async searchCatalog(query: { name?: string; tags?: string[]; owner?: string }): Promise<DataCatalogEntry[]> {
    const results: DataCatalogEntry[] = [];

    for (const entry of this.catalog.values()) {
      let matches = true;

      if (query.name && !entry.name.toLowerCase().includes(query.name.toLowerCase())) {
        matches = false;
      }

      if (query.tags && !query.tags.some(tag => entry.tags.includes(tag))) {
        matches = false;
      }

      if (query.owner && entry.owner !== query.owner) {
        matches = false;
      }

      if (matches) {
        results.push(entry);
      }
    }

    return results;
  }

  trackLineage(datasetId: string, upstream: LineageNode[], transformations: string[]): void {
    const lineage: DataLineage = {
      datasetId,
      upstream,
      downstream: [],
      transformations,
    };

    this.lineageGraph.set(datasetId, lineage);

    // Update downstream for upstream nodes
    for (const node of upstream) {
      const upstreamLineage = this.lineageGraph.get(node.datasetId);
      if (upstreamLineage) {
        upstreamLineage.downstream.push({
          datasetId,
          type: 'destination',
          timestamp: new Date(),
        });
      }
    }
  }

  getLineage(datasetId: string): DataLineage | undefined {
    return this.lineageGraph.get(datasetId);
  }

  // ===========================
  // Query Optimization
  // ===========================

  optimizeQuery(transformations: Transformation[]): QueryPlan {
    this.logger.info('Optimizing query', { transformationCount: transformations.length });

    const steps: QueryStep[] = [];
    let estimatedCost = 0;

    // Apply optimizations
    const optimized = this.applyOptimizations(transformations);

    for (let i = 0; i < optimized.length; i++) {
      const transform = optimized[i];
      const stepCost = this.estimateTransformCost(transform);

      steps.push({
        id: `step-${i}`,
        operation: transform.type,
        estimatedRows: 1000, // Would calculate based on selectivity
        estimatedCost: stepCost,
        optimizations: [],
      });

      estimatedCost += stepCost;
    }

    // Determine parallelism
    const parallelism = Math.min(4, steps.length);

    return {
      steps,
      estimatedCost,
      parallelism,
    };
  }

  private applyOptimizations(transformations: Transformation[]): Transformation[] {
    const optimized = [...transformations];

    // Predicate pushdown: move filters earlier
    const filters = optimized.filter(t => t.type === 'filter');
    const nonFilters = optimized.filter(t => t.type !== 'filter');

    // Projection pruning: only select needed fields
    // Column pruning: remove unused columns early

    // Return optimized order: filters first, then other operations
    return [...filters, ...nonFilters];
  }

  private estimateTransformCost(transform: Transformation): number {
    // Simple cost model
    switch (transform.type) {
      case 'filter':
        return 1;
      case 'map':
        return 2;
      case 'sort':
        return 10;
      case 'join':
        return 20;
      case 'aggregate':
        return 15;
      default:
        return 5;
    }
  }

  // ===========================
  // Caching
  // ===========================

  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Limit cache size
    if (this.cache.size > 1000) {
      const oldest = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      this.cache.delete(oldest[0]);
    }
  }

  // ===========================
  // Helper Methods
  // ===========================

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(condition: string, row: any): boolean {
    // Simple condition evaluator (in production, use a library)
    // Supports: field == value, field > value, field < value, etc.
    try {
      const interpolated = condition.replace(/(\w+)/g, (match) => {
        const value = this.getNestedValue(row, match);
        return typeof value === 'string' ? `"${value}"` : String(value);
      });

      return eval(interpolated);
    } catch (error) {
      return false;
    }
  }

  async inferSchema(data: any[]): Promise<Schema> {
    if (data.length === 0) {
      return { fields: [] };
    }

    const fields: SchemaField[] = [];
    const sample = data[0];

    for (const [key, value] of Object.entries(sample)) {
      let type: SchemaField['type'] = 'string';

      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value instanceof Date) {
        type = 'date';
      } else if (Array.isArray(value)) {
        type = 'array';
      } else if (typeof value === 'object') {
        type = 'json';
      }

      // Check nullability
      const nullable = data.some(row => row[key] == null);

      fields.push({
        name: key,
        type,
        nullable,
      });
    }

    return { fields };
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down data pipeline');

    if (this.pgPool) {
      await this.pgPool.end();
    }

    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }
}
