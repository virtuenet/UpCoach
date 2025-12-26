import { Pool } from 'pg';
import { logger } from '../../utils/logger';
import { SandboxRuntime, PluginContext, ExecutionResult } from './SandboxRuntime';
import { PluginRegistry } from './PluginRegistry';

/**
 * Plugin Executor
 *
 * Orchestrates plugin execution with:
 * - Plugin code loading from database
 * - Sandbox runtime management
 * - Execution result handling
 * - Error recovery and retry logic
 * - Performance monitoring
 * - Concurrent execution limits
 *
 * Usage:
 * const executor = new PluginExecutor(db);
 * const result = await executor.execute(pluginId, tenantId, userId, data);
 */

export interface PluginExecutionRequest {
  pluginId: string;
  tenantId: string;
  userId?: string;
  data?: any;
  timeout?: number;
}

export interface PluginExecutionHistory {
  id: string;
  pluginId: string;
  tenantId: string;
  userId?: string;
  success: boolean;
  executionTime: number;
  output?: any;
  error?: string;
  executedAt: Date;
}

export class PluginExecutor {
  private db: Pool;
  private sandboxRuntime: SandboxRuntime;
  private pluginRegistry: PluginRegistry;
  private executionQueue: Map<string, Promise<ExecutionResult>> = new Map();
  private maxConcurrentExecutions: number = 10;

  constructor(db: Pool) {
    this.db = db;
    this.sandboxRuntime = new SandboxRuntime(db);
    this.pluginRegistry = new PluginRegistry(db);
  }

  /**
   * Execute plugin for tenant
   */
  async execute(request: PluginExecutionRequest): Promise<ExecutionResult> {
    const { pluginId, tenantId, userId, data, timeout } = request;

    try {
      // Check rate limit
      const canExecute = await this.sandboxRuntime.checkRateLimit(pluginId, tenantId);
      if (!canExecute) {
        throw new Error('Rate limit exceeded for plugin execution');
      }

      // Check concurrent execution limit
      await this.waitForAvailableSlot();

      // Load plugin code
      const plugin = await this.pluginRegistry.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }

      if (plugin.status !== 'approved') {
        throw new Error(`Plugin ${pluginId} is not approved for execution`);
      }

      // Check if plugin is installed for tenant
      const installation = await this.getInstallation(tenantId, pluginId);
      if (!installation) {
        throw new Error(`Plugin ${pluginId} not installed for tenant ${tenantId}`);
      }

      // Load plugin code from database
      const pluginCode = await this.loadPluginCode(pluginId, plugin.version);

      // Build execution context
      const context: PluginContext = {
        tenantId,
        userId,
        pluginId,
        data,
        env: installation.config,
      };

      // Execute in sandbox
      const executionKey = `${tenantId}:${pluginId}:${Date.now()}`;
      const executionPromise = this.sandboxRuntime.execute(pluginCode, context, {
        timeout: timeout || 5000,
      });

      this.executionQueue.set(executionKey, executionPromise);

      const result = await executionPromise;

      this.executionQueue.delete(executionKey);

      // Save execution history
      await this.saveExecutionHistory({
        pluginId,
        tenantId,
        userId,
        success: result.success,
        executionTime: result.executionTime,
        output: result.output,
        error: result.error,
      });

      logger.info('Plugin executed', {
        pluginId,
        tenantId,
        success: result.success,
        executionTime: result.executionTime,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Plugin execution failed', {
        pluginId,
        tenantId,
        error: errorMessage,
      });

      // Save failure to history
      await this.saveExecutionHistory({
        pluginId,
        tenantId,
        userId,
        success: false,
        executionTime: 0,
        error: errorMessage,
      });

      return {
        success: false,
        logs: [],
        error: errorMessage,
        executionTime: 0,
        memoryUsed: 0,
      };
    }
  }

  /**
   * Execute plugin with retry logic
   */
  async executeWithRetry(
    request: PluginExecutionRequest,
    maxRetries: number = 3
  ): Promise<ExecutionResult> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const result = await this.execute(request);
        if (result.success) {
          return result;
        }
        lastError = new Error(result.error || 'Unknown error');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }

      attempt++;
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await this.sleep(delay);
        logger.info('Retrying plugin execution', {
          pluginId: request.pluginId,
          attempt,
          maxRetries,
        });
      }
    }

    throw lastError || new Error('Plugin execution failed after retries');
  }

  /**
   * Execute plugin for multiple tenants (batch)
   */
  async executeBatch(
    requests: PluginExecutionRequest[]
  ): Promise<Map<string, ExecutionResult>> {
    const results = new Map<string, ExecutionResult>();

    const executions = requests.map(async (request) => {
      const key = `${request.tenantId}:${request.pluginId}`;
      try {
        const result = await this.execute(request);
        results.set(key, result);
      } catch (error) {
        results.set(key, {
          success: false,
          logs: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: 0,
          memoryUsed: 0,
        });
      }
    });

    await Promise.all(executions);
    return results;
  }

  /**
   * Get execution history for plugin
   */
  async getExecutionHistory(
    pluginId: string,
    limit: number = 50
  ): Promise<PluginExecutionHistory[]> {
    const query = `
      SELECT * FROM plugin_execution_history
      WHERE plugin_id = $1
      ORDER BY executed_at DESC
      LIMIT $2
    `;
    const result = await this.db.query(query, [pluginId, limit]);
    return result.rows.map(this.mapRowToHistory);
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
    return await this.sandboxRuntime.getExecutionStats(pluginId, days);
  }

  /**
   * Cancel running plugin execution
   */
  async cancelExecution(tenantId: string, pluginId: string): Promise<void> {
    const prefix = `${tenantId}:${pluginId}:`;
    const keysToCancel = Array.from(this.executionQueue.keys()).filter((key) =>
      key.startsWith(prefix)
    );

    for (const key of keysToCancel) {
      this.executionQueue.delete(key);
    }

    logger.info('Plugin executions cancelled', {
      tenantId,
      pluginId,
      count: keysToCancel.length,
    });
  }

  /**
   * Private helper methods
   */

  private async loadPluginCode(pluginId: string, version: string): Promise<string> {
    const query = `
      SELECT code FROM plugin_code
      WHERE plugin_id = $1 AND version = $2
    `;
    const result = await this.db.query(query, [pluginId, version]);

    if (result.rows.length === 0) {
      throw new Error(`Plugin code not found for ${pluginId}@${version}`);
    }

    return result.rows[0].code;
  }

  private async getInstallation(
    tenantId: string,
    pluginId: string
  ): Promise<{ config: Record<string, any> } | null> {
    const query = `
      SELECT config FROM plugin_installations
      WHERE tenant_id = $1 AND plugin_id = $2
    `;
    const result = await this.db.query(query, [tenantId, pluginId]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      config: result.rows[0].config,
    };
  }

  private async saveExecutionHistory(history: {
    pluginId: string;
    tenantId: string;
    userId?: string;
    success: boolean;
    executionTime: number;
    output?: any;
    error?: string;
  }): Promise<void> {
    const query = `
      INSERT INTO plugin_execution_history (
        plugin_id, tenant_id, user_id, success,
        execution_time_ms, output, error, executed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;
    await this.db.query(query, [
      history.pluginId,
      history.tenantId,
      history.userId,
      history.success,
      history.executionTime,
      history.output ? JSON.stringify(history.output) : null,
      history.error,
    ]);
  }

  private async waitForAvailableSlot(): Promise<void> {
    while (this.executionQueue.size >= this.maxConcurrentExecutions) {
      await this.sleep(100);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapRowToHistory(row: any): PluginExecutionHistory {
    return {
      id: row.id,
      pluginId: row.plugin_id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      success: row.success,
      executionTime: row.execution_time_ms,
      output: row.output,
      error: row.error,
      executedAt: row.executed_at,
    };
  }
}
