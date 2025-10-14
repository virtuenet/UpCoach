"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.loggerStream = void 0;
const tslib_1 = require("tslib");
const dotenv = tslib_1.__importStar(require("dotenv"));
const winston = tslib_1.__importStar(require("winston"));
dotenv.config();
const env = process.env.NODE_ENV || 'development';
const MAX_LOG_SIZE = 10000;
const MAX_META_SIZE = 5000;
const MAX_ARRAY_LENGTH = 100;
const MAX_STRING_LENGTH = 1000;
function truncateLogData(data, maxDepth = 3, currentDepth = 0) {
    if (currentDepth > maxDepth) {
        return '[Max depth exceeded]';
    }
    if (data === null || data === undefined) {
        return data;
    }
    if (typeof data === 'string') {
        if (data.length > MAX_STRING_LENGTH) {
            const originalLength = data.length;
            return data.substring(0, MAX_STRING_LENGTH) + `... [truncated from ${originalLength} chars]`;
        }
        return data;
    }
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
    if (typeof data === 'object') {
        const truncated = {};
        const keys = Object.keys(data);
        const maxKeys = 50;
        for (let i = 0; i < Math.min(keys.length, maxKeys); i++) {
            const key = keys[i];
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
    return data;
}
const logFormat = winston.format.combine(winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
}), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    if (message && typeof message === 'string' && message.length > MAX_LOG_SIZE) {
        const originalLength = message.length;
        message = message.substring(0, MAX_LOG_SIZE) + `... [truncated from ${originalLength} chars]`;
    }
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
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
        const stackLines = stack.split('\n').slice(0, 20);
        log += `\n${stackLines.join('\n')}`;
        if (stack.split('\n').length > 20) {
            log += '\n... [stack truncated]';
        }
    }
    return log;
}));
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({
    format: 'HH:mm:ss',
}), winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    return log;
}));
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'upcoach-api' },
    transports: [
        new winston.transports.Console({
            format: env === 'production' ? logFormat : consoleFormat,
        }),
    ],
});
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
exports.loggerStream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
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
const safeLogger = new SafeLogger(logger);
exports.logger = safeLogger;
