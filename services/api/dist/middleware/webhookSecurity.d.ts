import { Request, Response, NextFunction } from 'express';
interface WebhookConfig {
    secret: string;
    algorithm?: string;
    headerName?: string;
    maxAge?: number;
    replayProtection?: boolean;
}
/**
 * Generic webhook signature verification middleware
 */
export declare function verifyWebhookSignature(config: WebhookConfig): (req: Request, _res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
/**
 * Rate limiting for webhooks
 */
export declare function webhookRateLimit(maxRequests?: number, windowMs?: number): (req: Request, _res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * IP whitelist for webhooks
 */
export declare function webhookIPWhitelist(allowedIPs: string[]): (req: Request, _res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Webhook event deduplication
 */
export declare function deduplicateWebhook(eventId: string, ttl?: number): Promise<boolean>;
export {};
//# sourceMappingURL=webhookSecurity.d.ts.map