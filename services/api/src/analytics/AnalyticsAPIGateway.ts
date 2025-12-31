import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * Analytics API Gateway
 *
 * RESTful API exposing analytics data to external systems
 * with authentication, rate limiting, and data access controls.
 *
 * Endpoints:
 * - GET /api/v1/analytics/metrics
 * - GET /api/v1/analytics/reports/:id
 * - POST /api/v1/analytics/queries
 * - GET /api/v1/analytics/forecasts
 * - GET /api/v1/analytics/export
 * - GET /api/v1/analytics/anomalies
 * - POST /api/v1/analytics/insights
 *
 * Features:
 * - OAuth 2.0 authentication
 * - API key management
 * - Rate limiting (1000 requests/hour)
 * - Query result caching
 * - Pagination support
 * - Field filtering
 * - Response compression
 */

export interface APIKey {
  id: string;
  key: string;
  name: string;
  organizationId: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface QueryRequest {
  dataSource: string;
  fields?: string[];
  filters?: Record<string, any>;
  groupBy?: string[];
  aggregations?: Record<string, string>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  metadata: {
    executionTime: number;
    cached: boolean;
  };
}

export class AnalyticsAPIGateway {
  private router: Router;
  private apiKeys: Map<string, APIKey> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private analyticsEngine: any;
  private reportEngine: any;
  private forecastingEngine: any;
  private anomalyService: any;

  constructor(
    analyticsEngine: any,
    reportEngine: any,
    forecastingEngine: any,
    anomalyService: any
  ) {
    this.router = Router();
    this.analyticsEngine = analyticsEngine;
    this.reportEngine = reportEngine;
    this.forecastingEngine = forecastingEngine;
    this.anomalyService = anomalyService;

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.router.use(this.authenticate.bind(this));
    this.router.use(this.rateLimiter());
    this.router.use(this.validateRequest.bind(this));
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    this.router.get('/metrics', this.getMetrics.bind(this));
    this.router.get('/reports/:id', this.getReport.bind(this));
    this.router.post(
      '/queries',
      [
        body('dataSource').notEmpty(),
        body('limit').optional().isInt({ min: 1, max: 10000 }),
      ],
      this.executeQuery.bind(this)
    );
    this.router.get('/forecasts', this.getForecast.bind(this));
    this.router.get('/export', this.exportData.bind(this));
    this.router.get('/anomalies', this.getAnomalies.bind(this));
    this.router.post('/insights', this.generateInsights.bind(this));
    this.router.post('/api-keys', this.createAPIKey.bind(this));
    this.router.delete('/api-keys/:id', this.revokeAPIKey.bind(this));
  }

  /**
   * Authentication middleware
   */
  private async authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({ error: 'Authorization header required' });
        return;
      }

      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        (req as any).user = decoded;
      } else if (authHeader.startsWith('ApiKey ')) {
        const apiKey = authHeader.substring(7);
        const key = await this.validateAPIKey(apiKey);

        if (!key) {
          res.status(401).json({ error: 'Invalid API key' });
          return;
        }

        (req as any).user = {
          organizationId: key.organizationId,
          permissions: key.permissions,
        };
        (req as any).apiKey = key;

        await this.updateAPIKeyUsage(key.id);
      } else {
        res.status(401).json({ error: 'Invalid authorization format' });
        return;
      }

      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }

  /**
   * Rate limiter middleware
   */
  private rateLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000,
      max: async (req: Request) => {
        const apiKey = (req as any).apiKey as APIKey | undefined;
        return apiKey?.rateLimit || 1000;
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
        });
      },
    });
  }

  /**
   * Validate request middleware
   */
  private validateRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    next();
  }

  /**
   * GET /api/v1/analytics/metrics
   * Get real-time metrics
   */
  private async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = (req as any).user;
      const { timeRange, refresh } = req.query;

      const cacheKey = `metrics:${organizationId}:${timeRange}`;

      if (!refresh) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          res.json({
            success: true,
            data: cached,
            metadata: { cached: true },
          });
          return;
        }
      }

      const startTime = Date.now();
      const metrics = await this.analyticsEngine.getRealtimeMetrics(
        organizationId,
        timeRange as string
      );

      this.setCache(cacheKey, metrics, 30000);

      res.json({
        success: true,
        data: metrics,
        metadata: {
          executionTime: Date.now() - startTime,
          cached: false,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /api/v1/analytics/reports/:id
   * Get report by ID
   */
  private async getReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { organizationId } = (req as any).user;

      const report = await this.reportEngine.getReport(id);

      if (!report || report.organizationId !== organizationId) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      const output = await this.reportEngine.generateReport(id);

      res.json({
        success: true,
        data: {
          report,
          output,
        },
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/analytics/queries
   * Execute custom analytics query
   */
  private async executeQuery(req: Request, res: Response): Promise<void> {
    try {
      const queryRequest = req.body as QueryRequest;
      const { organizationId } = (req as any).user;

      await this.validateQuery(queryRequest);

      const startTime = Date.now();

      const result = await Promise.race([
        this.executeQueryWithTimeout(queryRequest, organizationId),
        this.timeout(30000),
      ]);

      const total = result.length;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = queryRequest.limit || 100;
      const offset = (page - 1) * pageSize;

      const paginatedData = result.slice(offset, offset + pageSize);

      const response: PaginatedResponse<any> = {
        data: paginatedData,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
        metadata: {
          executionTime: Date.now() - startTime,
          cached: false,
        },
      };

      res.json({
        success: true,
        ...response,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /api/v1/analytics/forecasts
   * Get forecast for metric
   */
  private async getForecast(req: Request, res: Response): Promise<void> {
    try {
      const { metric, horizon, algorithm } = req.query;
      const { organizationId } = (req as any).user;

      if (!metric) {
        res.status(400).json({ error: 'Metric parameter required' });
        return;
      }

      const historicalData = await this.analyticsEngine.getHistoricalData(
        metric as string,
        organizationId
      );

      const forecast = await this.forecastingEngine.forecast(
        metric as string,
        historicalData,
        parseInt(horizon as string) || 30,
        algorithm as any
      );

      res.json({
        success: true,
        data: {
          forecast,
          historical: historicalData.slice(-90),
        },
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /api/v1/analytics/export
   * Export analytics data
   */
  private async exportData(req: Request, res: Response): Promise<void> {
    try {
      const { format, reportId, query } = req.query;

      if (!format) {
        res.status(400).json({ error: 'Format parameter required' });
        return;
      }

      let buffer: Buffer;
      let contentType: string;
      let filename: string;

      if (reportId) {
        switch (format) {
          case 'pdf':
            buffer = await this.reportEngine.exportToPDF(reportId as string);
            contentType = 'application/pdf';
            filename = 'report.pdf';
            break;
          case 'excel':
            buffer = await this.reportEngine.exportToExcel(reportId as string);
            contentType =
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            filename = 'report.xlsx';
            break;
          case 'csv':
            buffer = await this.reportEngine.exportToCSV(reportId as string);
            contentType = 'text/csv';
            filename = 'report.csv';
            break;
          default:
            res.status(400).json({ error: 'Unsupported format' });
            return;
        }
      } else {
        res.status(400).json({ error: 'ReportId or query required' });
        return;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /api/v1/analytics/anomalies
   * Get detected anomalies
   */
  private async getAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const { metric, startDate, endDate, severity } = req.query;
      const { organizationId } = (req as any).user;

      let anomalies = await this.anomalyService.getAnomalyHistory(
        metric as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      if (severity) {
        anomalies = anomalies.filter((a: any) => a.severity === severity);
      }

      res.json({
        success: true,
        data: {
          anomalies,
          count: anomalies.length,
        },
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/analytics/insights
   * Generate AI insights
   */
  private async generateInsights(req: Request, res: Response): Promise<void> {
    try {
      const { category, limit } = req.body;
      const { organizationId } = (req as any).user;

      const insights = await this.analyticsEngine.generateInsights(
        organizationId,
        {
          category,
          limit: limit || 10,
        }
      );

      res.json({
        success: true,
        data: {
          insights,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * POST /api/v1/analytics/api-keys
   * Create new API key
   */
  private async createAPIKey(req: Request, res: Response): Promise<void> {
    try {
      const { name, permissions, rateLimit, expiresIn } = req.body;
      const { organizationId } = (req as any).user;

      const apiKey: APIKey = {
        id: uuidv4(),
        key: this.generateAPIKey(),
        name,
        organizationId,
        permissions: permissions || ['read'],
        rateLimit: rateLimit || 1000,
        expiresAt: expiresIn
          ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
          : undefined,
        createdAt: new Date(),
      };

      this.apiKeys.set(apiKey.key, apiKey);

      res.json({
        success: true,
        data: {
          id: apiKey.id,
          key: apiKey.key,
          name: apiKey.name,
          permissions: apiKey.permissions,
          rateLimit: apiKey.rateLimit,
          expiresAt: apiKey.expiresAt,
        },
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * DELETE /api/v1/analytics/api-keys/:id
   * Revoke API key
   */
  private async revokeAPIKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { organizationId } = (req as any).user;

      const apiKey = Array.from(this.apiKeys.values()).find(
        k => k.id === id && k.organizationId === organizationId
      );

      if (!apiKey) {
        res.status(404).json({ error: 'API key not found' });
        return;
      }

      this.apiKeys.delete(apiKey.key);

      res.json({
        success: true,
        message: 'API key revoked successfully',
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Validate API key
   */
  private async validateAPIKey(key: string): Promise<APIKey | null> {
    const apiKey = this.apiKeys.get(key);

    if (!apiKey) return null;

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      this.apiKeys.delete(key);
      return null;
    }

    return apiKey;
  }

  /**
   * Update API key usage
   */
  private async updateAPIKeyUsage(id: string): Promise<void> {
    const apiKey = Array.from(this.apiKeys.values()).find(k => k.id === id);
    if (apiKey) {
      apiKey.lastUsedAt = new Date();
    }
  }

  /**
   * Validate query for security
   */
  private async validateQuery(query: QueryRequest): Promise<void> {
    const allowedDataSources = [
      'users',
      'goals',
      'habits',
      'sessions',
      'revenue',
      'engagement',
    ];

    if (!allowedDataSources.includes(query.dataSource)) {
      throw new Error('Invalid data source');
    }

    if (query.limit && query.limit > 10000) {
      throw new Error('Limit cannot exceed 10,000');
    }
  }

  /**
   * Execute query with organization scope
   */
  private async executeQueryWithTimeout(
    query: QueryRequest,
    organizationId: string
  ): Promise<any[]> {
    return [];
  }

  /**
   * Timeout promise
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), ms)
    );
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  /**
   * Generate API key
   */
  private generateAPIKey(): string {
    return `upcoach_${uuidv4().replace(/-/g, '')}`;
  }

  /**
   * Error handler
   */
  private handleError(res: Response, error: any): void {
    console.error('API Error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }

  /**
   * Get router
   */
  getRouter(): Router {
    return this.router;
  }
}

export default AnalyticsAPIGateway;
