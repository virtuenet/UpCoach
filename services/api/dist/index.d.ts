declare global {
    namespace Express {
        interface Request {
            id?: string;
            rawBody?: Buffer;
        }
    }
}
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=index.d.ts.map