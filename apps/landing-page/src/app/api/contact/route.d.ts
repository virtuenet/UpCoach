import { NextRequest, NextResponse } from 'next/server';
export declare function POST(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    message: string | undefined;
}>>;
export declare function GET(): Promise<NextResponse<{
    message: string;
}>>;
//# sourceMappingURL=route.d.ts.map