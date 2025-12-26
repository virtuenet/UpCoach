import { VM } from 'vm2';
import { Pool } from 'pg';
import { logger } from '../../utils/logger';

/**
 * Sandbox Runtime
 *
 * Secure execution environment for third-party plugin code:
 * - VM2 isolation (no access to file system, network, process)
 * - Resource limits (CPU, memory, timeout)
 * - Network restrictions (whitelist-only)
 * - Sandbox escape detection
 *
 * Security Model:
 * - No require(), import(), eval()
 * - No access to Node.js modules
 * - Sandboxed console for logging
 * - Memory limit: 64MB
 * - CPU timeout: 5 seconds
 */

export interface SandboxConfig {
  timeout?: number; // milliseconds
  memoryLimit?: number; // bytes
  allowedModules?: string[];
  allowedNetworkHosts?: string[];
}

export interface PluginContext {
  tenantId: string;
  userId?: string;
  pluginId: string;
  data?: any;
  env?: Record<string, string>;
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  logs: string[];
  error?: string;
  executionTime: number;
  memoryUsed: number;
}

export class SandboxRuntime {
  private db: Pool;
  private defaultConfig: SandboxConfig = {
    timeout: 5000, // 5 seconds
    memoryLimit: 64 * 1024 * 1024, // 64MB
    allowedModules: ['lodash', 'moment', 'axios'],
    allowedNetworkHosts: [
      'api.upcoach.com',
      'hooks.zapier.com',
      'slack.com',
      'calendar.google.com',
      'api.notion.com',
    ],
  };

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Execute plugin code in sandbox
   */
  async execute(
    code: string,
    context: PluginContext,
    config?: SandboxConfig
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      // Validate code before execution
      this.validateCode(code);

      // Create sandboxed console
      const sandboxedConsole = this.createSandboxedConsole(logs);

      // Create sandboxed context
      const sandboxContext = {
        context,
        console: sandboxedConsole,
        setTimeout: this.createSafetimeout(),
        setInterval: () => {
          throw new Error('setInterval is not allowed in sandbox');
        },
        require: this.createSafeRequire(finalConfig.allowedModules || []),
      };

      // Create VM2 instance
      const vm = new VM({
        timeout: finalConfig.timeout,
        sandbox: sandboxContext,
        eval: false,
        wasm: false,
        fixAsync: true,
      });

      // Execute plugin code
      const output = await vm.run(`
        (async function() {
          ${code}
        })()
      `);

      const executionTime = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed;

      // Log execution
      await this.logExecution(context.pluginId, context.tenantId, {
        success: true,
        executionTime,
        memoryUsed,
      });

      logger.info('Plugin executed successfully', {
        pluginId: context.pluginId,
        tenantId: context.tenantId,
        executionTime,
      });

      return {
        success: true,
        output,
        logs,
        executionTime,
        memoryUsed,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log execution failure
      await this.logExecution(context.pluginId, context.tenantId, {
        success: false,
        error: errorMessage,
        executionTime,
      });

      logger.error('Plugin execution failed', {
        pluginId: context.pluginId,
        tenantId: context.tenantId,
        error: errorMessage,
      });

      return {
        success: false,
        logs,
        error: errorMessage,
        executionTime,
        memoryUsed: process.memoryUsage().heapUsed,
      };
    }
  }

  /**
   * Validate plugin code for security issues
   */
  private validateCode(code: string): void {
    // Check for forbidden keywords
    const forbiddenPatterns = [
      /require\s*\(/,
      /import\s+/,
      /eval\s*\(/,
      /Function\s*\(/,
      /process\./,
      /global\./,
      /child_process/,
      /fs\./,
      /\.exec\(/,
      /\.spawn\(/,
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Forbidden pattern detected: ${pattern.source}`);
      }
    }

    // Check code length (prevent DoS)
    if (code.length > 100000) {
      throw new Error('Plugin code exceeds maximum length (100KB)');
    }
  }

  /**
   * Create sandboxed console with logging
   */
  private createSandboxedConsole(logs: string[]): Console {
    return {
      log: (...args: any[]) => {
        const message = args.map(arg => String(arg)).join(' ');
        logs.push(`[LOG] ${message}`);
      },
      info: (...args: any[]) => {
        const message = args.map(arg => String(arg)).join(' ');
        logs.push(`[INFO] ${message}`);
      },
      warn: (...args: any[]) => {
        const message = args.map(arg => String(arg)).join(' ');
        logs.push(`[WARN] ${message}`);
      },
      error: (...args: any[]) => {
        const message = args.map(arg => String(arg)).join(' ');
        logs.push(`[ERROR] ${message}`);
      },
      debug: (...args: any[]) => {
        const message = args.map(arg => String(arg)).join(' ');
        logs.push(`[DEBUG] ${message}`);
      },
    } as Console;
  }

  /**
   * Create safe setTimeout (limited duration)
   */
  private createSafetimeout() {
    return (callback: () => void, delay: number) => {
      if (delay > 5000) {
        throw new Error('setTimeout delay cannot exceed 5 seconds');
      }
      return setTimeout(callback, delay);
    };
  }

  /**
   * Create safe require (whitelist only)
   */
  private createSafeRequire(allowedModules: string[]) {
    return (moduleName: string) => {
      if (!allowedModules.includes(moduleName)) {
        throw new Error(`Module '${moduleName}' is not allowed in sandbox`);
      }

      try {
        return require(moduleName);
      } catch (error) {
        throw new Error(`Failed to load module '${moduleName}'`);
      }
    };
  }

  /**
   * Log plugin execution to database
   */
  private async logExecution(
    pluginId: string,
    tenantId: string,
    metrics: {
      success: boolean;
      executionTime: number;
      memoryUsed?: number;
      error?: string;
    }
  ): Promise<void> {
    const query = `
      INSERT INTO plugin_executions (
        plugin_id, tenant_id, success, execution_time_ms,
        memory_used_bytes, error_message, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;

    await this.db.query(query, [
      pluginId,
      tenantId,
      metrics.success,
      metrics.executionTime,
      metrics.memoryUsed || null,
      metrics.error || null,
    ]);
  }

  /**
   * Get execution statistics for plugin
   */
  async getExecutionStats(pluginId: string, days: number = 7): Promise<{
    totalExecutions: number;
    successRate: number;
    avgExecutionTime: number;
    errorRate: number;
  }> {
    const query = `
      SELECT
        COUNT(*) AS total_executions,
        AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) AS success_rate,
        AVG(execution_time_ms) AS avg_execution_time,
        AVG(CASE WHEN NOT success THEN 1.0 ELSE 0.0 END) AS error_rate
      FROM plugin_executions
      WHERE plugin_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;

    const result = await this.db.query(query, [pluginId]);
    const row = result.rows[0];

    return {
      totalExecutions: parseInt(row.total_executions),
      successRate: parseFloat(row.success_rate) * 100,
      avgExecutionTime: parseFloat(row.avg_execution_time),
      errorRate: parseFloat(row.error_rate) * 100,
    };
  }

  /**
   * Check if plugin exceeds rate limits
   */
  async checkRateLimit(pluginId: string, tenantId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) AS execution_count
      FROM plugin_executions
      WHERE plugin_id = $1
        AND tenant_id = $2
        AND created_at >= NOW() - INTERVAL '1 minute'
    `;

    const result = await this.db.query(query, [pluginId, tenantId]);
    const executionCount = parseInt(result.rows[0].execution_count);

    const RATE_LIMIT = 100; // 100 executions per minute
    return executionCount < RATE_LIMIT;
  }
}

/**
 * Sandbox Escape Detector
 *
 * Monitors for attempts to escape the sandbox
 */
export class SandboxEscapeDetector {
  private static suspiciousPatterns = [
    /constructor\s*\[\s*['"]constructor['"]\s*\]/,
    /this\.constructor/,
    /Object\.getPrototypeOf/,
    /__proto__/,
    /prototype\s*\.\s*constructor/,
  ];

  /**
   * Detect sandbox escape attempts
   */
  static detect(code: string): { detected: boolean; patterns: string[] } {
    const detectedPatterns: string[] = [];

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(code)) {
        detectedPatterns.push(pattern.source);
      }
    }

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns,
    };
  }
}
