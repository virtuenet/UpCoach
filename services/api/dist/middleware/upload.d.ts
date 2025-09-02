import multer from 'multer';
import { Request } from 'express';
export declare const uploadMiddleware: multer.Multer;
export declare const uploadSingle: (fieldName?: string) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadMultiple: (fieldName?: string, maxCount?: number) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadFields: (fields: {
    name: string;
    maxCount?: number;
}[]) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const handleUploadError: (error: any, req: Request, res: any, next: any) => any;
export declare const validateFileSizes: (req: Request, res: any, next: any) => any;
export declare const getFileTypeCategory: (mimetype: string) => string;
export default uploadMiddleware;
//# sourceMappingURL=upload.d.ts.map