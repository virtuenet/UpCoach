export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}
export declare function generateAccessToken(payload: JwtPayload): string;
export declare function generateRefreshToken(payload: JwtPayload): string;
export declare function verifyToken(token: string): JwtPayload;
export declare function verifyRefreshToken(token: string): JwtPayload;
export declare function generateTokenPair(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=jwt.d.ts.map