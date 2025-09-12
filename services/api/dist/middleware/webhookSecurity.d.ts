import { Request, Response, NextFunction } from 'express';
interface WebhookConfig {
    secret: string;
    algorithm?: string;
    headerName?: string;
    maxAge?: number;
    replayProtection?: boolean;
}
export declare function verifyWebhookSignature(config: WebhookConfig): (req: Request, _res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function webhookRateLimit(maxRequests?: number, windowMs?: number): (req: Request, _res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function webhookIPWhitelist(allowedIPs: string[]): (req: Request, _res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function deduplicateWebhook(eventId: string, ttl?: number): Promise<boolean>;
export {};
//# sourceMappingURL=webhookSecurity.d.ts.map