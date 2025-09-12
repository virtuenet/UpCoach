/**
 * Test fixtures
 */
export declare const fixtures: {
    validUser: {
        id: string;
        email: string;
        name: string;
        role: "user";
    };
    adminUser: {
        id: string;
        email: string;
        name: string;
        role: "admin";
    };
    successResponse: {
        success: boolean;
        data: {};
        message: string;
    };
    errorResponse: {
        success: boolean;
        error: string;
    };
    validToken: string;
    expiredToken: string;
    pastDate: Date;
    futureDate: Date;
    recentDate: Date;
};
//# sourceMappingURL=fixtures.d.ts.map