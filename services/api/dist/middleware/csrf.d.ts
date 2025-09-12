import { Request, Response, NextFunction } from 'express';
interface CsrfOptions {
    secret?: string;
    tokenExpiry?: number;
    cookieName?: string;
    headerName?: string;
    methods?: string[];
    excludePaths?: string[];
    doubleSubmit?: boolean;
}
export declare function csrfProtection(options?: CsrfOptions): (req: Request, _res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function csrfToken(options?: CsrfOptions): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare function configureCsrf(app: any): void;
export declare function validateCsrfToken(token: string, sessionId: string, secret?: string): Promise<boolean>;
export {};
//# sourceMappingURL=csrf.d.ts.map