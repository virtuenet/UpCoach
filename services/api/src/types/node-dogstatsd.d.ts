declare module 'node-dogstatsd' {
    interface StatsDOptions {
        host?: string;
        port?: number;
        prefix?: string;
        global_tags?: string[];
    }

    export class StatsD {
        constructor(options?: StatsDOptions);
        increment(metric: string, value?: number, tags?: string[]): void;
        decrement(metric: string, value?: number, tags?: string[]): void;
        gauge(metric: string, value: number, tags?: string[]): void;
        histogram(metric: string, value: number, tags?: string[]): void;
        timing(metric: string, value: number, tags?: string[]): void;
        close(): void;
    }
}