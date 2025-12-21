/**
 * Structured Logger Service
 *
 * Production-ready structured logging with context enrichment,
 * log levels, formatters, and transport support.
 */

import { EventEmitter } from 'events';

// Log levels
export enum LogLevel {
  TRACE = 0,
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
  FATAL = 50,
}

// Log entry
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  context: LogContext;
  meta?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Log context
export interface LogContext {
  service: string;
  environment: string;
  version: string;
  requestId?: string;
  traceId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

// Logger config
export interface LoggerConfig {
  level: LogLevel;
  service: string;
  environment: string;
  version: string;
  format: 'json' | 'pretty' | 'simple';
  timestamp: boolean;
  colorize: boolean;
  maxMessageLength: number;
  redactPatterns: RegExp[];
  transports: LogTransport[];
}

// Log transport interface
export interface LogTransport {
  name: string;
  level: LogLevel;
  log(entry: LogEntry): void | Promise<void>;
}

// Console transport
class ConsoleTransport implements LogTransport {
  name = 'console';
  level: LogLevel;
  private format: 'json' | 'pretty' | 'simple';
  private colorize: boolean;

  constructor(config: { level?: LogLevel; format?: 'json' | 'pretty' | 'simple'; colorize?: boolean }) {
    this.level = config.level ?? LogLevel.DEBUG;
    this.format = config.format ?? 'pretty';
    this.colorize = config.colorize ?? true;
  }

  log(entry: LogEntry): void {
    if (entry.level < this.level) return;

    switch (this.format) {
      case 'json':
        console.log(JSON.stringify(entry));
        break;
      case 'simple':
        console.log(`[${entry.levelName}] ${entry.message}`);
        break;
      case 'pretty':
      default:
        this.logPretty(entry);
    }
  }

  private logPretty(entry: LogEntry): void {
    const colors = {
      [LogLevel.TRACE]: '\x1b[90m',
      [LogLevel.DEBUG]: '\x1b[36m',
      [LogLevel.INFO]: '\x1b[32m',
      [LogLevel.WARN]: '\x1b[33m',
      [LogLevel.ERROR]: '\x1b[31m',
      [LogLevel.FATAL]: '\x1b[35m',
    };
    const reset = '\x1b[0m';
    const color = this.colorize ? colors[entry.level] || '' : '';

    const prefix = `${color}[${entry.timestamp}] [${entry.levelName}]${reset}`;
    const context = entry.context.requestId ? ` [${entry.context.requestId}]` : '';

    console.log(`${prefix}${context} ${entry.message}`);

    if (entry.meta && Object.keys(entry.meta).length > 0) {
      console.log(`  ${JSON.stringify(entry.meta)}`);
    }

    if (entry.error?.stack) {
      console.log(`  ${entry.error.stack}`);
    }
  }
}

// Memory transport (for testing/debugging)
class MemoryTransport implements LogTransport {
  name = 'memory';
  level: LogLevel;
  entries: LogEntry[] = [];
  maxEntries: number;

  constructor(config: { level?: LogLevel; maxEntries?: number }) {
    this.level = config.level ?? LogLevel.DEBUG;
    this.maxEntries = config.maxEntries ?? 1000;
  }

  log(entry: LogEntry): void {
    if (entry.level < this.level) return;

    this.entries.push(entry);
    while (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  clear(): void {
    this.entries = [];
  }

  getEntries(filter?: { level?: LogLevel; limit?: number }): LogEntry[] {
    let entries = this.entries;

    if (filter?.level !== undefined) {
      entries = entries.filter((e) => e.level >= filter.level!);
    }

    if (filter?.limit) {
      entries = entries.slice(-filter.limit);
    }

    return entries;
  }
}

export class StructuredLogger extends EventEmitter {
  private config: LoggerConfig;
  private context: LogContext;
  private transports: LogTransport[];

  constructor(config?: Partial<LoggerConfig>) {
    super();

    this.config = {
      level: LogLevel.INFO,
      service: 'upcoach-api',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      format: 'pretty',
      timestamp: true,
      colorize: process.env.NODE_ENV !== 'production',
      maxMessageLength: 10000,
      redactPatterns: [
        /password['"]\s*:\s*['"][^'"]+['"]/gi,
        /token['"]\s*:\s*['"][^'"]+['"]/gi,
        /authorization['"]\s*:\s*['"][^'"]+['"]/gi,
        /apikey['"]\s*:\s*['"][^'"]+['"]/gi,
        /secret['"]\s*:\s*['"][^'"]+['"]/gi,
      ],
      transports: [],
      ...config,
    };

    this.context = {
      service: this.config.service,
      environment: this.config.environment,
      version: this.config.version,
    };

    // Initialize default transports
    this.transports = this.config.transports.length > 0
      ? this.config.transports
      : [
          new ConsoleTransport({
            level: this.config.level,
            format: this.config.format,
            colorize: this.config.colorize,
          }),
        ];
  }

  /**
   * Add transport
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Remove transport
   */
  removeTransport(name: string): void {
    this.transports = this.transports.filter((t) => t.name !== name);
  }

  /**
   * Set context
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Create child logger with additional context
   */
  child(context: Partial<LogContext>): StructuredLogger {
    const child = new StructuredLogger({
      ...this.config,
      transports: this.transports,
    });
    child.setContext({ ...this.context, ...context });
    return child;
  }

  /**
   * Log at trace level
   */
  trace(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.TRACE, message, meta);
  }

  /**
   * Log at debug level
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  /**
   * Log at info level
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  /**
   * Log at warn level
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error | Record<string, unknown>, meta?: Record<string, unknown>): void {
    const errorInfo = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined;

    const combinedMeta = error instanceof Error
      ? meta
      : { ...error, ...meta };

    this.log(LogLevel.ERROR, message, combinedMeta, errorInfo);
  }

  /**
   * Log at fatal level
   */
  fatal(message: string, error?: Error | Record<string, unknown>, meta?: Record<string, unknown>): void {
    const errorInfo = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined;

    const combinedMeta = error instanceof Error
      ? meta
      : { ...error, ...meta };

    this.log(LogLevel.FATAL, message, combinedMeta, errorInfo);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
    errorInfo?: { name: string; message: string; stack?: string }
  ): void {
    if (level < this.config.level) return;

    // Truncate message if too long
    const truncatedMessage = message.length > this.config.maxMessageLength
      ? message.substring(0, this.config.maxMessageLength) + '...'
      : message;

    // Redact sensitive data
    const redactedMessage = this.redact(truncatedMessage);
    const redactedMeta = meta ? this.redactObject(meta) : undefined;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: this.getLevelName(level),
      message: redactedMessage,
      context: this.context,
      meta: redactedMeta,
      error: errorInfo,
    };

    // Send to all transports
    for (const transport of this.transports) {
      try {
        transport.log(entry);
      } catch (err) {
        // Avoid recursive logging
        console.error('Transport error:', err);
      }
    }

    // Emit event
    this.emit('log', entry);

    if (level >= LogLevel.ERROR) {
      this.emit('error', entry);
    }
  }

  /**
   * Redact sensitive data from string
   */
  private redact(str: string): string {
    let result = str;
    for (const pattern of this.config.redactPatterns) {
      result = result.replace(pattern, (match) => {
        const colonIndex = match.indexOf(':');
        if (colonIndex > -1) {
          return match.substring(0, colonIndex + 1) + ' "[REDACTED]"';
        }
        return '[REDACTED]';
      });
    }
    return result;
  }

  /**
   * Redact sensitive data from object
   */
  private redactObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apiKey', 'key', 'cookie'];
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.redactObject(value as Record<string, unknown>);
      } else if (typeof value === 'string') {
        result[key] = this.redact(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get level name
   */
  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.TRACE:
        return 'TRACE';
      case LogLevel.DEBUG:
        return 'DEBUG';
      case LogLevel.INFO:
        return 'INFO';
      case LogLevel.WARN:
        return 'WARN';
      case LogLevel.ERROR:
        return 'ERROR';
      case LogLevel.FATAL:
        return 'FATAL';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }
}

// Export transports
export { ConsoleTransport, MemoryTransport };

// Singleton instance
let logger: StructuredLogger | null = null;

export function getLogger(): StructuredLogger {
  if (!logger) {
    logger = new StructuredLogger();
  }
  return logger;
}

// Create request-scoped logger
export function createRequestLogger(
  requestId: string,
  traceId: string,
  userId?: string
): StructuredLogger {
  return getLogger().child({
    requestId,
    traceId,
    userId,
  });
}

export default StructuredLogger;
