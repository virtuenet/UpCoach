import { z } from 'zod';

// Password validation with security requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .refine((password) => /[A-Z]/.test(password), 'Password must contain at least one uppercase letter')
  .refine((password) => /[a-z]/.test(password), 'Password must contain at least one lowercase letter')
  .refine((password) => /\d/.test(password), 'Password must contain at least one number')
  .refine((password) => {
    // Simple check without complex regex to avoid ReDoS
    const specialChars = "!@#$%^&*()_+-=[]{}|;:'\",.<>/?\\";
    return password.split('').some(char => specialChars.includes(char));
  }, 'Password must contain at least one special character')
  .refine((password) => {
    // Check for repeated characters (3+ in a row)
    return !/(.)\1{2,}/.test(password);
  }, 'Password should not contain 3 or more repeated characters')
  .refine((password) => {
    // Check for common passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123', 'admin', 'letmein'];
    return !commonPasswords.some(common => password.toLowerCase().includes(common));
  }, 'Password is too common. Please choose a more unique password')
  .refine((password) => {
    // Optimized sequential character check using loop instead of massive regex
    const lowerPassword = password.toLowerCase();
    
    // Check for alphabetic sequences (3+ characters)
    for (let i = 0; i < lowerPassword.length - 2; i++) {
      const char1 = lowerPassword.charCodeAt(i);
      const char2 = lowerPassword.charCodeAt(i + 1);
      const char3 = lowerPassword.charCodeAt(i + 2);
      
      // Check if characters are sequential (a-z)
      if (char1 >= 97 && char1 <= 122 && 
          char2 === char1 + 1 && 
          char3 === char2 + 1) {
        return false;
      }
      
      // Check for numeric sequences
      if (char1 >= 48 && char1 <= 57 && 
          char2 === char1 + 1 && 
          char3 === char2 + 1) {
        return false;
      }
    }
    
    return true;
  }, 'Password should not contain sequential characters');

// Email validation
const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .transform(email => email.trim());

// Username validation
const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .transform(username => username.trim());

// Phone validation
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional()
  .nullable();

// Registration schema with enhanced validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  username: usernameSchema.optional(),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: phoneSchema,
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  marketingConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // Check that password doesn't contain personal information
  const lowerPassword = data.password.toLowerCase();
  const emailPrefix = data.email.split('@')[0].toLowerCase();
  
  // Check for email prefix in password
  if (emailPrefix.length > 3 && lowerPassword.includes(emailPrefix)) {
    return false;
  }
  
  // Check for first name in password
  if (data.firstName && data.firstName.length > 2 && 
      lowerPassword.includes(data.firstName.toLowerCase())) {
    return false;
  }
  
  // Check for last name in password
  if (data.lastName && data.lastName.length > 2 && 
      lowerPassword.includes(data.lastName.toLowerCase())) {
    return false;
  }
  
  // Check for username in password
  if (data.username && data.username.length > 2 && 
      lowerPassword.includes(data.username.toLowerCase())) {
    return false;
  }
  
  return true;
}, {
  message: "Password shouldn't contain personal information (email, name, or username)",
  path: ["password"],
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
  captchaToken: z.string().optional(),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Change password schema (for logged-in users)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Update profile schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: usernameSchema.optional(),
  phone: phoneSchema,
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  timezone: z.string().optional(),
  language: z.enum(['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko']).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
});

// Two-factor authentication schemas
export const enable2FASchema = z.object({
  password: z.string().min(1, 'Password is required for security'),
});

export const verify2FASchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
});

// Session validation
export const sessionSchema = z.object({
  userId: z.number().positive(),
  email: emailSchema,
  role: z.enum(['user', 'coach', 'admin']),
  sessionId: z.string().uuid(),
  expiresAt: z.date(),
  isActive: z.boolean(),
});

// OAuth schemas
export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
  provider: z.enum(['google', 'facebook', 'apple', 'github']),
});

// Email verification schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: emailSchema.optional(),
});

// Type exports
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