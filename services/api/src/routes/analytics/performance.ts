/**
 * Performance Analytics Routes
 * Handles Core Web Vitals and performance monitoring data
 */

import { Router , Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

interface PerformanceReport {
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType: string;
  metrics: Array<{
    id: string;
    name: string;
    value: number;
    delta?: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    entries?: unknown[];
    navigationType?: string;
  }>;
  pageLoadTime: number;
  resourceTimings: Array<{
    name: string;
    duration: number;
    size: number;
    type: string;
  }>;
}

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  ttfb: number | null; // Time to First Byte
}

// In-memory storage for demo (replace with database in production)
const performanceReports: PerformanceReport[] = [];
const metricsAggregates = new Map<string, PerformanceMetrics[]>();

/**
 * POST /api/analytics/performance
 * Collect performance metrics from client applications
 */
router.post(
  '/performance',
  [
    body('timestamp').isNumeric(),
    body('url').isURL(),
    body('userAgent').isString(),
    body('metrics').isArray(),
    body('pageLoadTime').isNumeric()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const report: PerformanceReport = req.body;
      
      // Store raw report
      performanceReports.push(report);
      
      // Process metrics for aggregation
      const pageMetrics: PerformanceMetrics = {
        fcp: null,
        lcp: null,
        cls: null,
        fid: null,
        ttfb: null
      };

      // Extract Core Web Vitals from metrics
      report.metrics.forEach(metric => {
        switch (metric.name) {
          case 'FCP':
            pageMetrics.fcp = metric.value;
            break;
          case 'LCP':
            pageMetrics.lcp = metric.value;
            break;
          case 'CLS':
            pageMetrics.cls = metric.value;
            break;
          case 'FID':
            pageMetrics.fid = metric.value;
            break;
          case 'TTFB':
            pageMetrics.ttfb = metric.value;
            break;
        }
      });

      // Store aggregated metrics by page
      const page = new URL(report.url).pathname;
      if (!metricsAggregates.has(page)) {
        metricsAggregates.set(page, []);
      }
      metricsAggregates.get(page)!.push(pageMetrics);

      // Log performance issues
      const poorMetrics = report.metrics.filter(m => m.rating === 'poor');
      if (poorMetrics.length > 0) {
        console.warn('Performance issues detected:', {
          url: report.url,
          poorMetrics: poorMetrics.map(m => ({
            name: m.name,
            value: m.value,
            rating: m.rating
          }))
        });
      }

      // Clean up old reports (keep last 1000)
      if (performanceReports.length > 1000) {
        performanceReports.splice(0, performanceReports.length - 1000);
      }

      res.status(200).json({ 
        message: 'Performance data recorded',
        reportId: `${report.timestamp}-${Math.random().toString(36).substr(2, 9)}`
      });

    } catch (error) {
      console.error('Error processing performance report:', error);
      res.status(500).json({ error: 'Failed to process performance report' });
    }
  }
);

/**
 * GET /api/analytics/performance/summary
 * Get performance metrics summary for monitoring dashboard
 */
router.get('/performance/summary', async (req: Request, res: Response) => {
  try {
    const { page, timeRange = '1h' } = req.query;
    
    // Calculate time threshold
    const now = Date.now();
    const timeThresholds = {
      '1h': now - (60 * 60 * 1000),
      '24h': now - (24 * 60 * 60 * 1000),
      '7d': now - (7 * 24 * 60 * 60 * 1000)
    };
    
    const threshold = timeThresholds[timeRange as keyof typeof timeThresholds] || timeThresholds['1h'];
    
    // Filter reports by time range
    const filteredReports = performanceReports.filter(report => 
      report.timestamp >= threshold && 
      (!page || new URL(report.url).pathname === page)
    );

    if (filteredReports.length === 0) {
      return res.json({
        summary: {
          totalReports: 0,
          averageMetrics: null,
          performanceScore: null,
          issuesCount: 0
        }
      });
    }

    // Calculate averages
    const metricsSum = filteredReports.reduce((acc, report) => {
      report.metrics.forEach(metric => {
        if (!acc[metric.name]) acc[metric.name] = { sum: 0, count: 0 };
        acc[metric.name].sum += metric.value;
        acc[metric.name].count += 1;
      });
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    const averageMetrics = Object.entries(metricsSum).reduce((acc, [name, data]) => {
      acc[name] = Math.round(data.sum / data.count);
      return acc;
    }, {} as Record<string, number>);

    // Calculate performance score (0-100)
    const performanceScore = calculatePerformanceScore(averageMetrics);

    // Count issues
    const issuesCount = filteredReports.reduce((count, report) => {
      return count + report.metrics.filter(m => m.rating === 'poor').length;
    }, 0);

    // Get page breakdown
    const pageBreakdown = Array.from(metricsAggregates.entries()).map(([pagePath, metrics]) => {
      const recentMetrics = metrics.slice(-10); // Last 10 reports for this page
      return {
        page: pagePath,
        averageFCP: calculateAverage(recentMetrics.map(m => m.fcp).filter(Boolean)),
        averageLCP: calculateAverage(recentMetrics.map(m => m.lcp).filter(Boolean)),
        averageCLS: calculateAverage(recentMetrics.map(m => m.cls).filter(Boolean)),
        sampleSize: recentMetrics.length
      };
    });

    res.json({
      summary: {
        totalReports: filteredReports.length,
        averageMetrics,
        performanceScore,
        issuesCount,
        timeRange,
        pageBreakdown
      }
    });

  } catch (error) {
    console.error('Error generating performance summary:', error);
    res.status(500).json({ error: 'Failed to generate performance summary' });
  }
});

/**
 * GET /api/analytics/performance/alerts
 * Get performance alerts and budget violations
 */
router.get('/performance/alerts', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Get recent reports
    const recentReports = performanceReports.filter(report => 
      report.timestamp >= oneHourAgo
    );

    // Define performance budgets (same as client-side)
    const budgets = {
      FCP: 1800,
      LCP: 2500,
      CLS: 0.1,
      FID: 100,
      TTFB: 800
    };

    const alerts = [];

    // Check for budget violations
    recentReports.forEach(report => {
      report.metrics.forEach(metric => {
        const budget = budgets[metric.name as keyof typeof budgets];
        if (budget && metric.value > budget) {
          alerts.push({
            type: 'budget_violation',
            severity: metric.rating === 'poor' ? 'high' : 'medium',
            message: `${metric.name} exceeded budget on ${new URL(report.url).pathname}`,
            details: {
              metric: metric.name,
              value: metric.value,
              budget,
              url: report.url,
              timestamp: report.timestamp
            }
          });
        }
      });
    });

    // Check for performance degradation trends
    const pagesWithDegradation = Array.from(metricsAggregates.entries())
      .map(([page, metrics]) => {
        const recent = metrics.slice(-5);
        const older = metrics.slice(-10, -5);
        
        if (recent.length < 3 || older.length < 3) return null;
        
        const recentLCP = calculateAverage(recent.map(m => m.lcp).filter(Boolean));
        const olderLCP = calculateAverage(older.map(m => m.lcp).filter(Boolean));
        
        if (recentLCP && olderLCP && (recentLCP > olderLCP * 1.2)) {
          return {
            page,
            degradation: Math.round(((recentLCP - olderLCP) / olderLCP) * 100)
          };
        }
        
        return null;
      })
      .filter(Boolean);

    pagesWithDegradation.forEach(item => {
      if (item) {
        alerts.push({
          type: 'performance_degradation',
          severity: 'medium',
          message: `LCP performance degraded by ${item.degradation}% on ${item.page}`,
          details: {
            page: item.page,
            degradationPercentage: item.degradation
          }
        });
      }
    });

    res.json({
      alerts,
      summary: {
        totalAlerts: alerts.length,
        highSeverity: alerts.filter(a => a.severity === 'high').length,
        mediumSeverity: alerts.filter(a => a.severity === 'medium').length
      }
    });

  } catch (error) {
    console.error('Error generating performance alerts:', error);
    res.status(500).json({ error: 'Failed to generate performance alerts' });
  }
});

// Helper functions
function calculatePerformanceScore(metrics: Record<string, number>): number {
  const weights = {
    FCP: 0.15,
    LCP: 0.25,
    CLS: 0.15,
    FID: 0.25,
    TTFB: 0.20
  };

  const thresholds = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    TTFB: { good: 800, poor: 1800 }
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(metrics).forEach(([name, value]) => {
    const weight = weights[name as keyof typeof weights];
    const threshold = thresholds[name as keyof typeof thresholds];
    
    if (weight && threshold) {
      let score = 100;
      if (value > threshold.poor) {
        score = 0;
      } else if (value > threshold.good) {
        score = 50;
      }
      
      totalScore += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

function calculateAverage(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export default router;