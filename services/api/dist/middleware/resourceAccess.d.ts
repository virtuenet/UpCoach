import { Request, Response, NextFunction } from 'express';
declare enum ResourceType {
    USER = "user",
    GOAL = "goal",
    SESSION = "session",
    SUBSCRIPTION = "subscription",
    ORGANIZATION = "organization",
    PROFILE = "profile",
    COACH_PROFILE = "coach_profile",
    CONTENT = "content",
    FINANCIAL = "financial",
    TRANSACTION = "transaction",
    REPORT = "report"
}
/**
 * Main IDOR protection middleware
 */
export declare const checkResourceAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user can perform specific action on resource
 */
export declare const checkResourceAction: (allowedActions: string[]) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Batch check for multiple resources
 */
export declare const checkBulkResourceAccess: (userId: string, resourceIds: string[], resourceType: ResourceType) => Promise<Map<string, boolean>>;
export { ResourceType };
//# sourceMappingURL=resourceAccess.d.ts.map