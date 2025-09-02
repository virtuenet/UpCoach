/**
 * Graceful Shutdown Handler
 * Ensures all services properly clean up resources before exit
 */
import { Server } from 'http';
declare class GracefulShutdown {
    private handlers;
    private isShuttingDown;
    private server?;
    /**
     * Register a shutdown handler
     */
    register(name: string, handler: () => Promise<void> | void, priority?: number): void;
    /**
     * Set the HTTP server for graceful shutdown
     */
    setServer(server: Server): void;
    /**
     * Initialize shutdown handlers
     */
    initialize(): void;
    /**
     * Perform graceful shutdown
     */
    shutdown(signal: string, exitCode?: number): Promise<void>;
    /**
     * Register a cleanup function that runs on shutdown
     */
    onShutdown(name: string, handler: () => Promise<void> | void, priority?: number): void;
}
export declare const gracefulShutdown: GracefulShutdown;
export declare function onShutdown(name: string, handler: () => Promise<void> | void, priority?: number): void;
export {};
//# sourceMappingURL=shutdown.d.ts.map