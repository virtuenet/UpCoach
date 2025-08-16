import { z } from 'zod';

// User schemas for contract testing
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['user', 'coach', 'admin']),
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  isActive: z.boolean(),
  subscription: z.object({
    id: z.string().uuid(),
    status: z.enum(['active', 'canceled', 'past_due', 'trialing']),
    plan: z.enum(['free', 'basic', 'premium', 'enterprise']),
    expiresAt: z.string().datetime().optional(),
  }).optional(),
});

export const UserListSchema = z.object({
  data: z.array(UserSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['user', 'coach', 'admin']).default('user'),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  avatar: z.string().url().optional(),
  role: z.enum(['user', 'coach', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
  expiresIn: z.number(),
});

export type User = z.infer<typeof UserSchema>;
export type UserList = z.infer<typeof UserListSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;