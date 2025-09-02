import { Request, Response, NextFunction } from 'express';
export declare function i18nMiddleware(req: Request, _res: Response, next: NextFunction): void;
export declare function getLocale(req: Request): string;
export declare function setLocale(req: Request, _res: Response, locale: string): boolean;
export declare function translate(key: string, locale?: string, ...args: any[]): string;
//# sourceMappingURL=i18n.d.ts.map