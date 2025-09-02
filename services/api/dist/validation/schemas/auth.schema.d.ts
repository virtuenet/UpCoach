import { z } from 'zod';
export declare const registerSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>, string, string>, string, string>, string, string>, string, string>, string, string>;
    confirmPassword: z.ZodString;
    username: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    marketingConsent: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    password?: string;
    username?: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    marketingConsent?: boolean;
}, {
    password?: string;
    username?: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    marketingConsent?: boolean;
}>, {
    password?: string;
    username?: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    marketingConsent?: boolean;
}, {
    password?: string;
    username?: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    marketingConsent?: boolean;
}>, {
    password?: string;
    username?: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    marketingConsent?: boolean;
}, {
    password?: string;
    username?: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    marketingConsent?: boolean;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
    captchaToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password?: string;
    email?: string;
    rememberMe?: boolean;
    captchaToken?: string;
}, {
    password?: string;
    email?: string;
    rememberMe?: boolean;
    captchaToken?: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    email?: string;
}, {
    email?: string;
}>;
export declare const resetPasswordSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    password: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>, string, string>, string, string>, string, string>, string, string>, string, string>;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password?: string;
    token?: string;
    confirmPassword?: string;
}, {
    password?: string;
    token?: string;
    confirmPassword?: string;
}>, {
    password?: string;
    token?: string;
    confirmPassword?: string;
}, {
    password?: string;
    token?: string;
    confirmPassword?: string;
}>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>, string, string>, string, string>, string, string>, string, string>, string, string>;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}, {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}>, {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}, {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}>, {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}, {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    bio: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodEnum<["en", "es", "fr", "de", "pt", "zh", "ja", "ko"]>>;
    notifications: z.ZodOptional<z.ZodObject<{
        email: z.ZodOptional<z.ZodBoolean>;
        push: z.ZodOptional<z.ZodBoolean>;
        sms: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        push?: boolean;
        email?: boolean;
        sms?: boolean;
    }, {
        push?: boolean;
        email?: boolean;
        sms?: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    username?: string;
    bio?: string;
    avatar?: string;
    language?: "en" | "es" | "fr" | "de" | "pt" | "zh" | "ja" | "ko";
    timezone?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    notifications?: {
        push?: boolean;
        email?: boolean;
        sms?: boolean;
    };
}, {
    username?: string;
    bio?: string;
    avatar?: string;
    language?: "en" | "es" | "fr" | "de" | "pt" | "zh" | "ja" | "ko";
    timezone?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    notifications?: {
        push?: boolean;
        email?: boolean;
        sms?: boolean;
    };
}>;
export declare const enable2FASchema: z.ZodObject<{
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password?: string;
}, {
    password?: string;
}>;
export declare const verify2FASchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code?: string;
}, {
    code?: string;
}>;
export declare const sessionSchema: z.ZodObject<{
    userId: z.ZodNumber;
    email: z.ZodEffects<z.ZodString, string, string>;
    role: z.ZodEnum<["user", "coach", "admin"]>;
    sessionId: z.ZodString;
    expiresAt: z.ZodDate;
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    role?: "admin" | "coach" | "user";
    email?: string;
    userId?: number;
    expiresAt?: Date;
    isActive?: boolean;
    sessionId?: string;
}, {
    role?: "admin" | "coach" | "user";
    email?: string;
    userId?: number;
    expiresAt?: Date;
    isActive?: boolean;
    sessionId?: string;
}>;
export declare const oauthCallbackSchema: z.ZodObject<{
    code: z.ZodString;
    state: z.ZodString;
    provider: z.ZodEnum<["google", "facebook", "apple", "github"]>;
}, "strip", z.ZodTypeAny, {
    code?: string;
    provider?: "google" | "facebook" | "apple" | "github";
    state?: string;
}, {
    code?: string;
    provider?: "google" | "facebook" | "apple" | "github";
    state?: string;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
    email: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    token?: string;
    email?: string;
}, {
    token?: string;
    email?: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type Enable2FAInput = z.infer<typeof enable2FASchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type SessionData = z.infer<typeof sessionSchema>;
export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
//# sourceMappingURL=auth.schema.d.ts.map