import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    status: string;
    timestamp: string;
    service: string;
    version: string;
    uptime: number;
    environment: "development" | "production" | "test";
}> | NextResponse<{
    status: string;
    timestamp: string;
    error: string;
}>>;
//# sourceMappingURL=route.d.ts.map