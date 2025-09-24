/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * Production-ready Logger Service
 * Replaces console.log with proper logging levels and monitoring integration
 */
class Logger {
    constructor(config = {}) {
        this.localLogs = [];
        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            fatal: 4,
        };
        this.config = {
            minLevel: typeof import.meta !== 'undefined' && import.meta.env?.DEV ? 'debug' : 'info',
            enableConsole: typeof import.meta !== 'undefined' && import.meta.env?.DEV,
            enableRemote: !(typeof import.meta !== 'undefined' && import.meta.env?.DEV),
            maxLocalLogs: 100,
            ...config,
        };
    }
    shouldLog(level) {
        return this.logLevels[level] >= this.logLevels[this.config.minLevel];
    }
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        if (data !== undefined) {
            return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
        }
        return `${prefix} ${message}`;
    }
    createLogEntry(level, message, data, error) {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            data,
            error: error
                ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                }
                : undefined,
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
            },
        };
    }
    storeLocal(entry) {
        this.localLogs.push(entry);
        // Maintain max log size
        if (this.localLogs.length > this.config.maxLocalLogs) {
            this.localLogs.shift();
        }
        // Also store critical errors in sessionStorage
        if (entry.level === 'error' || entry.level === 'fatal') {
            try {
                const storedErrors = JSON.parse(sessionStorage.getItem('app_logs') || '[]');
                storedErrors.push(entry);
                // Keep only last 50 errors
                if (storedErrors.length > 50) {
                    storedErrors.shift();
                }
                sessionStorage.setItem('app_logs', JSON.stringify(storedErrors));
            }
            catch (e) {
                // Ignore storage errors
            }
        }
    }
    async sendRemote(entry) {
        if (!this.config.enableRemote || !this.config.remoteEndpoint) {
            return;
        }
        try {
            // Send to monitoring service
            await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entry),
            });
        }
        catch (error) {
            // Fallback to console if remote logging fails
            if (this.config.enableConsole) {
                console.error('Failed to send log to remote:', error);
            }
        }
    }
    log(level, message, data, error) {
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = this.createLogEntry(level, message, data, error);
        // Store locally
        this.storeLocal(entry);
        // Log to console in development
        if (this.config.enableConsole) {
            const formattedMessage = this.formatMessage(level, message, data);
            switch (level) {
                case 'debug':
                    console.debug(formattedMessage);
                    break;
                case 'info':
                    console.info(formattedMessage);
                    break;
                case 'warn':
                    console.warn(formattedMessage);
                    break;
                case 'error':
                case 'fatal':
                    if (error) {
                        console.error(formattedMessage, error);
                    }
                    else {
                        console.error(formattedMessage);
                    }
                    break;
            }
        }
        // Send to remote in production
        if (this.config.enableRemote && (level === 'error' || level === 'fatal')) {
            this.sendRemote(entry);
        }
    }
    debug(message, data) {
        this.log('debug', message, data);
    }
    info(message, data) {
        this.log('info', message, data);
    }
    warn(message, data) {
        this.log('warn', message, data);
    }
    error(message, errorOrData, data) {
        if (errorOrData instanceof Error) {
            this.log('error', message, data, errorOrData);
        }
        else {
            this.log('error', message, errorOrData);
        }
    }
    fatal(message, error, data) {
        this.log('fatal', message, data, error);
        // Fatal errors might warrant additional actions
        // For example, showing a modal or redirecting to an error page
    }
    // Get all stored logs
    getLogs(level) {
        if (!level) {
            return [...this.localLogs];
        }
        const minLevel = this.logLevels[level];
        return this.localLogs.filter(log => this.logLevels[log.level] >= minLevel);
    }
    // Clear stored logs
    clearLogs() {
        this.localLogs = [];
        try {
            sessionStorage.removeItem('app_logs');
        }
        catch (e) {
            // Ignore storage errors
        }
    }
    // Export logs for debugging
    exportLogs() {
        return JSON.stringify(this.localLogs, null, 2);
    }
    // Download logs as file
    downloadLogs() {
        const logs = this.exportLogs();
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cms-logs-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    // Performance logging
    time(label) {
        if (this.shouldLog('debug')) {
            performance.mark(`logger-${label}-start`);
        }
    }
    timeEnd(label) {
        if (this.shouldLog('debug')) {
            performance.mark(`logger-${label}-end`);
            try {
                performance.measure(`logger-${label}`, `logger-${label}-start`, `logger-${label}-end`);
                const measure = performance.getEntriesByName(`logger-${label}`)[0];
                this.debug(`Performance: ${label}`, {
                    duration: measure.duration,
                    startTime: measure.startTime,
                });
            }
            catch (e) {
                // Ignore performance measurement errors
            }
        }
    }
    // Group logging (for related logs)
    group(label) {
        if (this.config.enableConsole) {
            console.group(label);
        }
        this.info(`--- ${label} ---`);
    }
    groupEnd() {
        if (this.config.enableConsole) {
            console.groupEnd();
        }
    }
    // Table logging for structured data
    table(data) {
        if (this.config.enableConsole) {
            console.table(data);
        }
        this.debug('Table data', data);
    }
    // Assert logging
    assert(condition, message, data) {
        if (!condition) {
            this.error(`Assertion failed: ${message}`, data);
            if (this.config.enableConsole) {
                console.assert(condition, message, data);
            }
        }
    }
}
// Create singleton instance
export const logger = new Logger();
// Export for testing or custom instances
export { Logger };
// Convenience methods for common patterns
export const logPerformance = (operation, fn) => {
    logger.time(operation);
    try {
        const result = fn();
        logger.timeEnd(operation);
        return result;
    }
    catch (error) {
        logger.timeEnd(operation);
        logger.error(`${operation} failed`, error);
        throw error;
    }
};
export const logAsync = async (operation, fn) => {
    logger.time(operation);
    try {
        const result = await fn();
        logger.timeEnd(operation);
        return result;
    }
    catch (error) {
        logger.timeEnd(operation);
        logger.error(`${operation} failed`, error);
        throw error;
    }
};
// Replace console in production
if (typeof import.meta !== 'undefined' && !import.meta.env?.DEV && typeof window !== 'undefined') {
    window.console.log = (...args) => logger.info(args.join(' '));
    window.console.debug = (...args) => logger.debug(args.join(' '));
    window.console.info = (...args) => logger.info(args.join(' '));
    window.console.warn = (...args) => logger.warn(args.join(' '));
    window.console.error = (...args) => logger.error(args.join(' '));
}
//# sourceMappingURL=logger.js.map