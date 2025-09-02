"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.loggerStream = void 0;
const winston_1 = __importDefault(require("winston"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables directly to avoid circular dependency
dotenv_1.default.config();
const env = process.env.NODE_ENV || 'development';
// Constants for log size limits
const MAX_LOG_SIZE = 10000; // Maximum characters per log entry
const MAX_META_SIZE = 5000; // Maximum size for metadata
const MAX_ARRAY_LENGTH = 100; // Maximum array items to log
const MAX_STRING_LENGTH = 1000; // Maximum string length in metadata
/**
 * Truncate and sanitize log data to prevent memory exhaustion
 */
function truncateLogData(data, maxDepth = 3, currentDepth = 0) {
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
                ...data
                    .slice(0, MAX_ARRAY_LENGTH)
                    .map(item => truncateLogData(item, maxDepth, currentDepth + 1)),
                `... [${data.length - MAX_ARRAY_LENGTH} more items]`,
            ];
        }
        return data.map(item => truncateLogData(item, maxDepth, currentDepth + 1));
    }
    // Handle objects
    if (typeof data === 'object') {
        const truncated = {};
        const keys = Object.keys(data);
        const maxKeys = 50; // Limit number of object keys
        for (let i = 0; i < Math.min(keys.length, maxKeys); i++) {
            const key = keys[i];
            // Skip sensitive fields
            if (['password', 'token', 'secret', 'apiKey', 'authorization'].includes(key.toLowerCase())) {
                truncated[key] = '[REDACTED]';
            }
            else {
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
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
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
        }
        else {
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
}));
// Console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss',
}), winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    return log;
}));
// Create logger instance
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'upcoach-api' },
    transports: [
        // Console transport for all environments
        new winston_1.default.transports.Console({
            format: env === 'production' ? logFormat : consoleFormat,
        }),
    ],
});
// Add file transport for production
if (env === 'production' && process.env.LOG_FILE) {
    logger.add(new winston_1.default.transports.File({
        filename: process.env.LOG_FILE || 'app.log',
        format: logFormat,
    }));
    logger.add(new winston_1.default.transports.File({
        filename: 'error.log',
        level: 'error',
        format: logFormat,
    }));
}
// Stream interface for Morgan
exports.loggerStream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
/**
 * Safe logger wrapper that enforces size limits
 */
class SafeLogger {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    sanitizeArgs(args) {
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
    info(message, ...args) {
        this.logger.info(message, ...this.sanitizeArgs(args));
    }
    error(message, ...args) {
        this.logger.error(message, ...this.sanitizeArgs(args));
    }
    warn(message, ...args) {
        this.logger.warn(message, ...this.sanitizeArgs(args));
    }
    debug(message, ...args) {
        this.logger.debug(message, ...this.sanitizeArgs(args));
    }
    verbose(message, ...args) {
        this.logger.verbose(message, ...this.sanitizeArgs(args));
    }
    silly(message, ...args) {
        this.logger.silly(message, ...this.sanitizeArgs(args));
    }
}
// Export safe logger instance
const safeLogger = new SafeLogger(logger);
exports.logger = safeLogger;
//# sourceMappingURL=logger.js.map