// Performance Monitoring Service
import { performance } from 'perf_hooks'
import { EventEmitter } from 'events'
import { logger } from '../utils/logger'
import * as os from 'os'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, any>
}

interface RequestMetrics {
  url: string
  method: string
  statusCode: number
  duration: number
  timestamp: Date
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: NodeJS.CpuUsage
}

interface AlertRule {
  name: string
  metric: string
  threshold: number
  operator: '>' | '<' | '>=' | '<=' | '=='
  action: (metric: PerformanceMetric) => void
}

class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private requestMetrics: RequestMetrics[] = []
  private alertRules: AlertRule[] = []
  private samplingRate = 1 // 100% sampling by default
  private maxMetricsAge = 3600000 // 1 hour
  private cleanupInterval!: NodeJS.Timeout
  private metricsBuffer: PerformanceMetric[] = []
  private bufferFlushInterval = 5000 // 5 seconds

  constructor() {
    super()
    this.setupCleanup()
    this.setupMetricsFlush()
    this.setupDefaultAlerts()
  }

  // Measure function execution time
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, any>
  ): Promise<T> {
    const start = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        tags,
      })

      return result
    } catch (error) {
      const duration = performance.now() - start
      
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        tags: { ...tags, error: 'true' },
      })

      throw error
    }
  }

  // Decorator for measuring method performance
  measureMethod(name?: string, tags?: Record<string, any>) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value
      const metricName = name || `${target.constructor.name}.${propertyName}`

      descriptor.value = async function (...args: any[]) {
        return await performanceMonitor.measure(
          metricName,
          () => originalMethod.apply(this, args),
          tags
        )
      }

      return descriptor
    }
  }

  // Record a custom metric
  recordMetric(metric: PerformanceMetric): void {
    // Apply sampling
    if (Math.random() > this.samplingRate) {
      return
    }

    // Add to buffer for batch processing
    this.metricsBuffer.push(metric)

    // Check alert rules
    this.checkAlerts(metric)

    // Emit metric event
    this.emit('metric', metric)
  }

  // Record request metrics
  recordRequest(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics)

    // Keep only recent requests
    const cutoff = Date.now() - this.maxMetricsAge
    this.requestMetrics = this.requestMetrics.filter(
      m => m.timestamp.getTime() > cutoff
    )

    // Record as metric
    this.recordMetric({
      name: 'request_duration',
      value: metrics.duration,
      unit: 'ms',
      timestamp: metrics.timestamp,
      tags: {
        url: metrics.url,
        method: metrics.method,
        statusCode: metrics.statusCode.toString(),
      },
    })

    // Check for slow requests
    if (metrics.duration > 1000) {
      logger.warn('Slow request detected:', {
        url: metrics.url,
        duration: metrics.duration,
      })
    }
  }

  // Get aggregated metrics
  getAggregatedMetrics(name: string, period: number = 60000): any {
    const metrics = this.metrics.get(name) || []
    const cutoff = Date.now() - period
    const recentMetrics = metrics.filter(
      m => m.timestamp.getTime() > cutoff
    )

    if (recentMetrics.length === 0) {
      return null
    }

    const values = recentMetrics.map(m => m.value)
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
    }
  }

  // Get system metrics
  getSystemMetrics(): any {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    
    return {
      memory: {
        rss: memUsage.rss / 1024 / 1024, // MB
        heapTotal: memUsage.heapTotal / 1024 / 1024,
        heapUsed: memUsage.heapUsed / 1024 / 1024,
        external: memUsage.external / 1024 / 1024,
      },
      cpu: {
        user: cpuUsage.user / 1000000, // seconds
        system: cpuUsage.system / 1000000,
      },
      system: {
        loadAvg: os.loadavg(),
        uptime: os.uptime(),
        freeMem: os.freemem() / 1024 / 1024,
        totalMem: os.totalmem() / 1024 / 1024,
      },
    }
  }

  // Get request statistics
  getRequestStats(period: number = 60000): any {
    const cutoff = Date.now() - period
    const recentRequests = this.requestMetrics.filter(
      m => m.timestamp.getTime() > cutoff
    )

    if (recentRequests.length === 0) {
      return null
    }

    const durations = recentRequests.map(r => r.duration)
    const statusCodes = recentRequests.reduce((acc, r) => {
      const key = `${Math.floor(r.statusCode / 100)}xx`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: recentRequests.length,
      rps: recentRequests.length / (period / 1000),
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50Duration: this.percentile(durations, 50),
      p95Duration: this.percentile(durations, 95),
      p99Duration: this.percentile(durations, 99),
      statusCodes,
    }
  }

  // Add alert rule
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule)
  }

  // Set sampling rate (0-1)
  setSamplingRate(rate: number): void {
    this.samplingRate = Math.max(0, Math.min(1, rate))
  }

  // Express middleware
  middleware() {
    return (req: any, res: any, next: any) => {
      const start = performance.now()
      const startCpu = process.cpuUsage()

      // Override res.end to capture metrics
      const originalEnd = res.end
      res.end = (...args: any[]) => {
        const duration = performance.now() - start
        const endCpu = process.cpuUsage(startCpu)

        this.recordRequest({
          url: req.path || req.url,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: endCpu,
        })

        originalEnd.apply(res, args)
      }

      next()
    }
  }

  // Generate performance report
  generateReport(): any {
    const report = {
      timestamp: new Date(),
      system: this.getSystemMetrics(),
      requests: this.getRequestStats(),
      metrics: {} as Record<string, any>,
    }

    // Add aggregated metrics
    for (const [name, _metrics] of this.metrics.entries()) {
      report.metrics[name] = this.getAggregatedMetrics(name)
    }

    return report
  }

  // Export metrics in Prometheus format
  getPrometheusMetrics(): string {
    const lines: string[] = []
    const timestamp = Date.now()

    // System metrics
    const system = this.getSystemMetrics()
    lines.push(`# HELP node_memory_heap_used_bytes Process heap memory used`)
    lines.push(`# TYPE node_memory_heap_used_bytes gauge`)
    lines.push(`node_memory_heap_used_bytes ${system.memory.heapUsed * 1024 * 1024} ${timestamp}`)

    // Request metrics
    const requests = this.getRequestStats()
    if (requests) {
      lines.push(`# HELP http_request_duration_seconds Request duration`)
      lines.push(`# TYPE http_request_duration_seconds histogram`)
      lines.push(`http_request_duration_seconds_sum ${requests.avgDuration * requests.total / 1000}`)
      lines.push(`http_request_duration_seconds_count ${requests.total}`)
    }

    // Custom metrics
    for (const [name, _metrics] of this.metrics.entries()) {
      const agg = this.getAggregatedMetrics(name)
      if (agg) {
        const metricName = name.replace(/[^a-zA-Z0-9_]/g, '_')
        lines.push(`# HELP ${metricName} Custom metric`)
        lines.push(`# TYPE ${metricName} summary`)
        lines.push(`${metricName}_sum ${agg.avg * agg.count}`)
        lines.push(`${metricName}_count ${agg.count}`)
        lines.push(`${metricName}{quantile="0.5"} ${agg.p50}`)
        lines.push(`${metricName}{quantile="0.95"} ${agg.p95}`)
        lines.push(`${metricName}{quantile="0.99"} ${agg.p99}`)
      }
    }

    return lines.join('\n')
  }

  // Private helper methods
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0
    
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  private checkAlerts(metric: PerformanceMetric): void {
    for (const rule of this.alertRules) {
      if (rule.metric !== metric.name) continue

      let triggered = false
      switch (rule.operator) {
        case '>':
          triggered = metric.value > rule.threshold
          break
        case '<':
          triggered = metric.value < rule.threshold
          break
        case '>=':
          triggered = metric.value >= rule.threshold
          break
        case '<=':
          triggered = metric.value <= rule.threshold
          break
        case '==':
          triggered = metric.value === rule.threshold
          break
      }

      if (triggered) {
        rule.action(metric)
        this.emit('alert', { rule, metric })
      }
    }
  }

  private setupCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const cutoff = Date.now() - this.maxMetricsAge

      // Clean up old metrics
      for (const [name, metrics] of this.metrics.entries()) {
        const filtered = metrics.filter(
          m => m.timestamp.getTime() > cutoff
        )
        if (filtered.length > 0) {
          this.metrics.set(name, filtered)
        } else {
          this.metrics.delete(name)
        }
      }

      // Clean up old request metrics
      this.requestMetrics = this.requestMetrics.filter(
        m => m.timestamp.getTime() > cutoff
      )
    }, 60000) // Run every minute
  }

  private setupMetricsFlush(): void {
    setInterval(() => {
      if (this.metricsBuffer.length === 0) return

      // Process buffered metrics
      for (const metric of this.metricsBuffer) {
        const existing = this.metrics.get(metric.name) || []
        existing.push(metric)
        this.metrics.set(metric.name, existing)
      }

      // Clear buffer
      this.metricsBuffer = []
    }, this.bufferFlushInterval)
  }

  private setupDefaultAlerts(): void {
    // High memory usage alert
    this.addAlertRule({
      name: 'high_memory',
      metric: 'memory_usage',
      threshold: 500, // 500 MB
      operator: '>',
      action: (metric) => {
        logger.error('High memory usage detected:', metric)
      },
    })

    // Slow request alert
    this.addAlertRule({
      name: 'slow_request',
      metric: 'request_duration',
      threshold: 5000, // 5 seconds
      operator: '>',
      action: (metric) => {
        logger.warn('Slow request detected:', metric)
      },
    })
  }

  // Cleanup
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.removeAllListeners()
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Export decorators
export const measure = (name?: string, tags?: Record<string, any>) => {
  return performanceMonitor.measureMethod(name, tags)
}

// Export middleware
export const performanceMiddleware = () => performanceMonitor.middleware()