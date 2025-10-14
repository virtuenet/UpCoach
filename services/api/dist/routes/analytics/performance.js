"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const performanceReports = [];
const metricsAggregates = new Map();
router.post('/performance', [
    (0, express_validator_1.body)('timestamp').isNumeric(),
    (0, express_validator_1.body)('url').isURL(),
    (0, express_validator_1.body)('userAgent').isString(),
    (0, express_validator_1.body)('metrics').isArray(),
    (0, express_validator_1.body)('pageLoadTime').isNumeric()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const report = req.body;
        performanceReports.push(report);
        const pageMetrics = {
            fcp: null,
            lcp: null,
            cls: null,
            fid: null,
            ttfb: null
        };
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
        const page = new URL(report.url).pathname;
        if (!metricsAggregates.has(page)) {
            metricsAggregates.set(page, []);
        }
        metricsAggregates.get(page).push(pageMetrics);
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
        if (performanceReports.length > 1000) {
            performanceReports.splice(0, performanceReports.length - 1000);
        }
        res.status(200).json({
            message: 'Performance data recorded',
            reportId: `${report.timestamp}-${Math.random().toString(36).substr(2, 9)}`
        });
    }
    catch (error) {
        console.error('Error processing performance report:', error);
        res.status(500).json({ error: 'Failed to process performance report' });
    }
});
router.get('/performance/summary', async (req, res) => {
    try {
        const { page, timeRange = '1h' } = req.query;
        const now = Date.now();
        const timeThresholds = {
            '1h': now - (60 * 60 * 1000),
            '24h': now - (24 * 60 * 60 * 1000),
            '7d': now - (7 * 24 * 60 * 60 * 1000)
        };
        const threshold = timeThresholds[timeRange] || timeThresholds['1h'];
        const filteredReports = performanceReports.filter(report => report.timestamp >= threshold &&
            (!page || new URL(report.url).pathname === page));
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
        const metricsSum = filteredReports.reduce((acc, report) => {
            report.metrics.forEach(metric => {
                if (!acc[metric.name])
                    acc[metric.name] = { sum: 0, count: 0 };
                acc[metric.name].sum += metric.value;
                acc[metric.name].count += 1;
            });
            return acc;
        }, {});
        const averageMetrics = Object.entries(metricsSum).reduce((acc, [name, data]) => {
            acc[name] = Math.round(data.sum / data.count);
            return acc;
        }, {});
        const performanceScore = calculatePerformanceScore(averageMetrics);
        const issuesCount = filteredReports.reduce((count, report) => {
            return count + report.metrics.filter(m => m.rating === 'poor').length;
        }, 0);
        const pageBreakdown = Array.from(metricsAggregates.entries()).map(([pagePath, metrics]) => {
            const recentMetrics = metrics.slice(-10);
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
    }
    catch (error) {
        console.error('Error generating performance summary:', error);
        res.status(500).json({ error: 'Failed to generate performance summary' });
    }
});
router.get('/performance/alerts', async (req, res) => {
    try {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        const recentReports = performanceReports.filter(report => report.timestamp >= oneHourAgo);
        const budgets = {
            FCP: 1800,
            LCP: 2500,
            CLS: 0.1,
            FID: 100,
            TTFB: 800
        };
        const alerts = [];
        recentReports.forEach(report => {
            report.metrics.forEach(metric => {
                const budget = budgets[metric.name];
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
        const pagesWithDegradation = Array.from(metricsAggregates.entries())
            .map(([page, metrics]) => {
            const recent = metrics.slice(-5);
            const older = metrics.slice(-10, -5);
            if (recent.length < 3 || older.length < 3)
                return null;
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
    }
    catch (error) {
        console.error('Error generating performance alerts:', error);
        res.status(500).json({ error: 'Failed to generate performance alerts' });
    }
});
function calculatePerformanceScore(metrics) {
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
        const weight = weights[name];
        const threshold = thresholds[name];
        if (weight && threshold) {
            let score = 100;
            if (value > threshold.poor) {
                score = 0;
            }
            else if (value > threshold.good) {
                score = 50;
            }
            totalScore += score * weight;
            totalWeight += weight;
        }
    });
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}
function calculateAverage(values) {
    if (values.length === 0)
        return null;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}
exports.default = router;
