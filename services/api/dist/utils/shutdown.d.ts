import { Server } from 'http';
declare class GracefulShutdown {
    private handlers;
    private isShuttingDown;
    private server?;
    register(name: string, handler: () => Promise<void> | void, priority?: number): void;
    setServer(server: Server): void;
    initialize(): void;
    shutdown(signal: string, exitCode?: number): Promise<void>;
    onShutdown(name: string, handler: () => Promise<void> | void, priority?: number): void;
}
export declare const gracefulShutdown: GracefulShutdown;
export declare function onShutdown(name: string, handler: () => Promise<void> | void, priority?: number): void;
export {};
//# sourceMappingURL=shutdown.d.ts.map