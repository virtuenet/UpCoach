import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Database Configuration
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Redis Configuration
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  OPENAI_MODEL: z.string().default('gpt-3.5-turbo'),
  
  // Supabase Configuration (if using Supabase for auth/storage)
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // CORS Origins
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3002'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().optional(),
  
  // Email Configuration (for notifications)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Push Notifications
  FCM_SERVER_KEY: z.string().optional(),
  
  // Analytics
  ANALYTICS_API_KEY: z.string().optional(),
});

// Validate environment variables
const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('❌ Environment validation failed:');
  envResult.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

const env = envResult.data;

// Export typed configuration
export const config = {
  // Server
  env: env.NODE_ENV,
  port: env.PORT,
  
  // Database
  databaseUrl: env.DATABASE_URL,
  
  // Redis
  redisUrl: env.REDIS_URL,
  
  // Authentication
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  // OpenAI
  openai: {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  },
  
  // Supabase
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // CORS
  corsOrigins: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  
  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  // File Upload
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    uploadDir: env.UPLOAD_DIR,
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
  },
  
  // Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  
  // Push Notifications
  fcm: {
    serverKey: env.FCM_SERVER_KEY,
  },
  
  // Analytics
  analytics: {
    apiKey: env.ANALYTICS_API_KEY,
  },
  
  // Feature flags
  features: {
    enablePushNotifications: !!env.FCM_SERVER_KEY,
    enableEmail: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
    enableAnalytics: !!env.ANALYTICS_API_KEY,
    enableSupabase: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
  },
} as const;

// Type exports
export type Config = typeof config;
export type Environment = typeof env.NODE_ENV; 