export declare function sanitizeString(input: string, logSuspicious?: boolean): string;
export declare function sanitizeRichText(input: string): string;
export declare function sanitizeObject<T>(obj: T, strict?: boolean): T;
export declare function sanitizeSqlPattern(input: string): string;
export declare function sanitizeFilename(filename: string): string;
export declare function sanitizeUrl(url: string): string | null;
export declare function detectMaliciousPatterns(input: string): {
    isSuspicious: boolean;
    patterns: string[];
};
export declare function createSanitizationReport(original: any, sanitized: any): {
    modified: boolean;
    fieldsModified: string[];
    suspiciousPatterns: string[];
    processingTime: number;
    originalSize: number;
    sanitizedSize: number;
};
declare const _default: {
    sanitizeString: typeof sanitizeString;
    sanitizeRichText: typeof sanitizeRichText;
    sanitizeObject: typeof sanitizeObject;
    sanitizeSqlPattern: typeof sanitizeSqlPattern;
    sanitizeFilename: typeof sanitizeFilename;
    sanitizeUrl: typeof sanitizeUrl;
    detectMaliciousPatterns: typeof detectMaliciousPatterns;
    createSanitizationReport: typeof createSanitizationReport;
};
export default _default;
//# sourceMappingURL=sanitization.d.ts.map