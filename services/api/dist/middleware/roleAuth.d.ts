import { Request, Response, NextFunction } from 'express';
export declare function requireRole(...allowedRoles: string[]): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireAdmin(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=roleAuth.d.ts.map