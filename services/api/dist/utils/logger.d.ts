import winston from 'winston';
export declare const loggerStream: {
    write: (message: string) => void;
};
/**
 * Safe logger wrapper that enforces size limits
 */
declare class SafeLogger {
    private logger;
    constructor(logger: winston.Logger);
    private sanitizeArgs;
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    verbose(message: string, ...args: any[]): void;
    silly(message: string, ...args: any[]): void;
}
declare const safeLogger: SafeLogger;
export { safeLogger as logger };
//# sourceMappingURL=logger.d.ts.map