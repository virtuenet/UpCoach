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
export declare const checkResourceAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const checkResourceAction: (allowedActions: string[]) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const checkBulkResourceAccess: (userId: string, resourceIds: string[], resourceType: ResourceType) => Promise<Map<string, boolean>>;
export { ResourceType };
//# sourceMappingURL=resourceAccess.d.ts.map