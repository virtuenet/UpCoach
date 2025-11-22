/**
import { format, formatDistanceToNow, parseISO } from "date-fns";
 * Request Limits Service
 * Configures size limits, timeouts, and request constraints
 */
export interface RequestLimitsConfig {
    maxBodySize?: string | number;
    maxUrlLength?: number;
    maxHeaderSize?: number;
    maxParameterCount?: number;
    maxFileSize?: string | number;
    maxFiles?: number;
    requestTimeout?: number;
    uploadTimeout?: number;
    allowedMethods?: string[];
    allowedContentTypes?: string[];
    maxJsonDepth?: number;
    maxArrayLength?: number;
}
declare class RequestLimitsService {
    private static instance;
    private config;
    private readonly DEFAULT_CONFIG;
    private constructor();
    static getInstance(): RequestLimitsService;
    /**
     * Configure request limits
     */
    configure(config: RequestLimitsConfig): void;
    /**
     * Parse size string to bytes
     */
    private parseSize;
    /**
     * Check if request body size is within limits
     */
    checkBodySize(size: number): {
        valid: boolean;
        maxSize: number;
        error?: string;
    };
    /**
     * Check if URL length is within limits
     */
    checkUrlLength(url: string): {
        valid: boolean;
        maxLength: number;
        error?: string;
    };
    /**
     * Check if file size is within limits
     */
    checkFileSize(size: number): {
        valid: boolean;
        maxSize: number;
        error?: string;
    };
    /**
     * Check if HTTP method is allowed
     */
    checkMethod(method: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Check if content type is allowed
     */
    checkContentType(contentType: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Check JSON depth
     */
    checkJsonDepth(obj: any, maxDepth?: number): boolean;
    /**
     * Check array length in JSON
     */
    checkArrayLength(obj: any, maxLength?: number): boolean;
    /**
     * Validate complete request
     */
    validateRequest(request: {
        method: string;
        url: string;
        headers?: Record<string, string>;
        body?: any;
        bodySize?: number;
    }): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Express middleware
     */
    middleware(options?: Partial<RequestLimitsConfig>): (req: any, res: any, next: any) => any;
    /**
     * File upload middleware
     */
    uploadMiddleware(): (req: any, res: any, next: any) => void;
    /**
     * Get current configuration
     */
    getConfig(): Required<RequestLimitsConfig>;
    /**
     * Create size limit string for display
     */
    formatSize(bytes: number): string;
}
export declare const requestLimits: RequestLimitsService;
export declare const requestLimitsMiddleware: (options?: Partial<RequestLimitsConfig>) => (req: any, res: any, next: any) => any;
export declare const uploadLimitsMiddleware: () => (req: any, res: any, next: any) => void;
export {};
//# sourceMappingURL=requestLimits.d.ts.map