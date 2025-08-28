import winston from 'winston';
import dotenv from 'dotenv';

// Load environment variables directly to avoid circular dependency
dotenv.config();

const env = process.env.NODE_ENV || 'development';

// Constants for log size limits
const MAX_LOG_SIZE = 10000; // Maximum characters per log entry
const MAX_META_SIZE = 5000; // Maximum size for metadata
const MAX_ARRAY_LENGTH = 100; // Maximum array items to log
const MAX_STRING_LENGTH = 1000; // Maximum string length in metadata

/**
 * Truncate and sanitize log data to prevent memory exhaustion
 */
function truncateLogData(data: any, maxDepth = 3, currentDepth = 0): any {
  // Prevent infinite recursion
  if (currentDepth > maxDepth) {
    return '[Max depth exceeded]';
  }

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle strings
  if (typeof data === 'string') {
    if (data.length > MAX_STRING_LENGTH) {
      const originalLength = data.length;
      return data.substring(0, MAX_STRING_LENGTH) + `... [truncated from ${originalLength} chars]`;
    }
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    if (data.length > MAX_ARRAY_LENGTH) {
      return [
        ...data.slice(0, MAX_ARRAY_LENGTH).map(item => 
          truncateLogData(item, maxDepth, currentDepth + 1)
        ),
        `... [${data.length - MAX_ARRAY_LENGTH} more items]`
      ];
    }
    return data.map(item => truncateLogData(item, maxDepth, currentDepth + 1));
  }

  // Handle objects
  if (typeof data === 'object') {
    const truncated: any = {};
    const keys = Object.keys(data);
    const maxKeys = 50; // Limit number of object keys
    
    for (let i = 0; i < Math.min(keys.length, maxKeys); i++) {
      const key = keys[i];
      // Skip sensitive fields
      if (['password', 'token', 'secret', 'apiKey', 'authorization'].includes(key.toLowerCase())) {
        truncated[key] = '[REDACTED]';
      } else {
        truncated[key] = truncateLogData(data[key], maxDepth, currentDepth + 1);
      }
    }
    
    if (keys.length > maxKeys) {
      truncated['...'] = `[${keys.length - maxKeys} more properties]`;
    }
    
    return truncated;
  }

  // Return primitives as-is
  return data;
}

// Custom log format with size limits
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Truncate message if too long
    if (message && typeof message === 'string' && message.length > MAX_LOG_SIZE) {
      const originalLength = message.length;
      message = message.substring(0, MAX_LOG_SIZE) + `... [truncated from ${originalLength} chars]`;
    }
    
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      // Truncate metadata
      const truncatedMeta = truncateLogData(meta);
      const metaString = JSON.stringify(truncatedMeta);
      
      if (metaString.length > MAX_META_SIZE) {
        log += ` ${metaString.substring(0, MAX_META_SIZE)}... [meta truncated]`;
      } else {
        log += ` ${metaString}`;
      }
    }
    
    if (stack && typeof stack === 'string') {
      // Limit stack trace to first 20 lines
      const stackLines = stack.split('\n').slice(0, 20);
      log += `\n${stackLines.join('\n')}`;
      if (stack.split('\n').length > 20) {
        log += '\n... [stack truncated]';
      }
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'upcoach-api' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: env === 'production' ? logFormat : consoleFormat,
    }),
  ],
});

// Add file transport for production
if (env === 'production' && process.env.LOG_FILE) {
  logger.add(new winston.transports.File({
    filename: process.env.LOG_FILE || 'app.log',
    format: logFormat,
  }));
  
  logger.add(new winston.transports.File({
    filename: 'error.log',
    level: 'error',
    format: logFormat,
  }));
}

// Stream interface for Morgan
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

/**
 * Safe logger wrapper that enforces size limits
 */
class SafeLogger {
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  private sanitizeArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'string' && arg.length > MAX_LOG_SIZE) {
        const originalLength = arg.length;
        return arg.substring(0, MAX_LOG_SIZE) + `... [truncated from ${originalLength} chars]`;
      }
      if (typeof arg === 'object') {
        return truncateLogData(arg);
      }
      return arg;
    });
  }

  info(message: string, ...args: any[]) {
    this.logger.info(message, ...this.sanitizeArgs(args));
  }

  error(message: string, ...args: any[]) {
    this.logger.error(message, ...this.sanitizeArgs(args));
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn(message, ...this.sanitizeArgs(args));
  }

  debug(message: string, ...args: any[]) {
    this.logger.debug(message, ...this.sanitizeArgs(args));
  }

  verbose(message: string, ...args: any[]) {
    this.logger.verbose(message, ...this.sanitizeArgs(args));
  }

  silly(message: string, ...args: any[]) {
    this.logger.silly(message, ...this.sanitizeArgs(args));
  }
}

// Export safe logger instance
const safeLogger = new SafeLogger(logger);

export { safeLogger as logger }; 