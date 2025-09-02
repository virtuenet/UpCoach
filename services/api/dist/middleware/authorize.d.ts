import { Request, Response, NextFunction } from 'express';
export type ResourceType = 'organization' | 'team' | 'project';
export type Role = 'member' | 'lead' | 'manager' | 'admin' | 'owner';
export declare function authorize(resourceType: ResourceType, requiredRole: Role | Role[]): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare function checkPermission(userId: number, resourceType: ResourceType, resourceId: number, requiredRole: Role): Promise<boolean>;
export declare function loadOrganizationContext(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=authorize.d.ts.map