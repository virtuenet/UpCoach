/**
 * Webhook Security Service
 * Implements signature verification and domain validation for webhooks
 */
export interface WebhookConfig {
    secret: string;
    algorithm?: string;
    allowedDomains?: string[];
    maxPayloadSize?: number;
    timeout?: number;
    replayProtection?: boolean;
    replayWindow?: number;
}
export interface WebhookPayload {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
    timestamp?: number;
}
export interface WebhookValidationResult {
    isValid: boolean;
    error?: string;
    details?: {
        signatureValid?: boolean;
        domainValid?: boolean;
        timestampValid?: boolean;
        sizeValid?: boolean;
    };
}
declare class WebhookSecurityService {
    private static instance;
    private configs;
    private processedRequests;
    private readonly DEFAULT_ALGORITHM;
    private readonly DEFAULT_MAX_SIZE;
    private readonly DEFAULT_REPLAY_WINDOW;
    private constructor();
    static getInstance(): WebhookSecurityService;
    /**
     * Register webhook configuration
     */
    registerWebhook(name: string, config: WebhookConfig): void;
    /**
     * Validate incoming webhook request
     */
    validateWebhook(name: string, payload: WebhookPayload): Promise<WebhookValidationResult>;
    /**
     * Generate signature for outgoing webhook
     */
    generateWebhookSignature(name: string, payload: any, timestamp?: number): string;
    /**
     * Generate webhook headers for outgoing request
     */
    generateWebhookHeaders(name: string, payload: any): Record<string, string>;
    /**
     * Generate signature using HMAC
     */
    private generateSignature;
    /**
     * Extract signature from headers
     */
    private extractSignature;
    /**
     * Extract timestamp from headers
     */
    private extractTimestamp;
    /**
     * Secure string comparison to prevent timing attacks
     */
    private secureCompare;
    /**
     * Generate unique request ID for replay protection
     */
    private generateRequestId;
    /**
     * Clean up old processed requests
     */
    private cleanupProcessedRequests;
    /**
     * Validate webhook URL
     */
    validateWebhookUrl(url: string): boolean;
    /**
     * Test webhook configuration
     */
    testWebhook(name: string, testUrl: string): Promise<{
        success: boolean;
        error?: string;
        response?: any;
    }>;
}
export declare const webhookSecurity: WebhookSecurityService;
export declare function webhookSecurityMiddleware(webhookName: string): (req: any, res: any, next: any) => Promise<any>;
export {};
//# sourceMappingURL=webhookSecurity.d.ts.map