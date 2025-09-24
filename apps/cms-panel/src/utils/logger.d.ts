/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * Production-ready Logger Service
 * Replaces console.log with proper logging levels and monitoring integration
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    data?: any;
    error?: Error;
    context?: Record<string, any>;
}
interface LoggerConfig {
    minLevel: LogLevel;
    enableConsole: boolean;
    enableRemote: boolean;
    maxLocalLogs: number;
    remoteEndpoint?: string;
}
declare class Logger {
    private config;
    private localLogs;
    private logLevels;
    constructor(config?: Partial<LoggerConfig>);
    private shouldLog;
    private formatMessage;
    private createLogEntry;
    private storeLocal;
    private sendRemote;
    private log;
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, errorOrData?: Error | any, data?: any): void;
    fatal(message: string, error: Error, data?: any): void;
    getLogs(level?: LogLevel): LogEntry[];
    clearLogs(): void;
    exportLogs(): string;
    downloadLogs(): void;
    time(label: string): void;
    timeEnd(label: string): void;
    group(label: string): void;
    groupEnd(): void;
    table(data: any[]): void;
    assert(condition: boolean, message: string, data?: any): void;
}
export declare const logger: Logger;
export { Logger };
export declare const logPerformance: (operation: string, fn: () => any) => any;
export declare const logAsync: (operation: string, fn: () => Promise<any>) => Promise<any>;
//# sourceMappingURL=logger.d.ts.map