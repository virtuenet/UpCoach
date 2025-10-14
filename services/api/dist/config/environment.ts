import * as dotenv from 'dotenv';
import { z } from 'zod';

import { validateSecret } from '../utils/secrets';

// Load environment variables
dotenv.config();

// Custom Zod refinements for security validation
const secureString = (minLength: number = 64) =>
  z
    .string()
    .min(minLength, `Must be at least ${minLength} characters`);

// Environment validation schema with enhanced security
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),

  // Database Configuration
  DATABASE_URL: z
    .string()
    .min(20, 'Database URL must be properly configured'),

  // Redis Configuration
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),

  // Authentication - Enhanced security requirements
  JWT_SECRET:
    process.env.NODE_ENV === 'production'
      ? secureString(64)
      : z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'), // Reduced from 7d for security
  JWT_REFRESH_SECRET:
    process.env.NODE_ENV === 'production'
      ? secureString(64)
      : z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'), // Reduced from 30d

  // OpenAI Configuration
  OPENAI_API_KEY: z
    .string()
    .min(1, 'OpenAI API key is required'),
  OPENAI_MODEL: z.string().default('gpt-3.5-turbo'),

  // Claude Configuration
  CLAUDE_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-3-sonnet-20240229'),

  // Supabase Configuration (if using Supabase for auth/storage)
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // CORS Origins
  CORS_ORIGINS: z.string().default('http://localhost:1005,http://localhost:1006,http://localhost:1007'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  // File Upload
  MAX_FILE_SIZE: z.string().default('10485760'), // 10MB
  UPLOAD_DIR: z.string().optional().default('./uploads'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().optional(),

  // Security Settings
  BCRYPT_ROUNDS: z.string().default('14'),
  SESSION_SECRET: z.string().optional(),
  COOKIE_SECURE: z
    .string()
    .default('true'),
  COOKIE_HTTPONLY: z
    .string()
    .default('true'),
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).optional().default('strict'),

  // Stripe Configuration
  STRIPE_SECRET_KEY: z
    .string()
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .optional(),

  // Email Configuration (for notifications)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // SMS Configuration
  SMS_PROVIDER: z.enum(['mock', 'twilio', 'aws-sns']).optional().default('mock'),

  // Twilio SMS Configuration
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  // AWS SNS SMS Configuration
  AWS_SNS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SNS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SNS_REGION: z.string().optional().default('us-east-1'),

  // SMS Testing
  SMS_SIMULATE_FAILURE: z.string().optional().default('false'),

  // Push Notifications
  FCM_SERVER_KEY: z.string().optional(),

  // Analytics
  ANALYTICS_API_KEY: z.string().optional(),

  // CDN Configuration
  CDN_URL: z.string().optional(),
  CDN_ENABLED: z
    .string()
    .optional()
    .default('false'),

  // Monitoring Configuration
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional().default('0.1'),
  SENTRY_PROFILES_SAMPLE_RATE: z.string().optional().default('0.1'),

  DATADOG_ENABLED: z
    .string()
    .optional()
    .default('false'),
  DATADOG_AGENT_HOST: z.string().optional().default('localhost'),
  DATADOG_AGENT_PORT: z.string().optional(),
  DATADOG_STATSD_HOST: z.string().optional().default('localhost'),
  DATADOG_STATSD_PORT: z.string().optional(),
  DATADOG_SERVICE: z.string().optional().default('upcoach-backend'),
  DATADOG_VERSION: z.string().optional().default('1.0.0'),
});

// Validate environment variables
const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('❌ Environment validation failed:');
  (envResult as any).error.issues.forEach((issue: any) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  
  // Only allow bypassing validation in actual test environment, never in production
  if (process.env.NODE_ENV === 'test') {
    console.warn('⚠️  Running in test mode - continuing with environment validation warnings');
  } else {
    console.error('🚨 CRITICAL: Environment validation failed in non-test environment');
    process.exit(1);
  }
}

// Use validated environment or fallback to process.env for tests
const env: Record<string, any> = envResult.success ? envResult.data : {
  NODE_ENV: process.env.NODE_ENV || 'test',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/upcoach_test',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-for-testing-only',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10), // Lower rounds for tests
  SESSION_SECRET: process.env.SESSION_SECRET || 'test-session-secret',
  COOKIE_SECURE: process.env.COOKIE_SECURE || 'false',
  COOKIE_HTTPONLY: process.env.COOKIE_HTTPONLY || 'true', 
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || 'lax',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '',
  CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '',
  CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:1005,http://localhost:1006,http://localhost:1007',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  EMAIL_HOST: process.env.EMAIL_HOST || 'localhost',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587', 10),
  EMAIL_USER: process.env.EMAIL_USER || 'test@upcoach.ai',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@upcoach.ai',
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '52428800', 10),
  UPLOAD_ALLOWED_TYPES: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  DATADOG_API_KEY: process.env.DATADOG_API_KEY || '',
  DATADOG_APP_KEY: process.env.DATADOG_APP_KEY || '',
  DATADOG_SITE: process.env.DATADOG_SITE || 'datadoghq.com',
  DATADOG_ENV: process.env.DATADOG_ENV || 'test',
  DATADOG_SERVICE: process.env.DATADOG_SERVICE || 'upcoach-backend',
  DATADOG_VERSION: process.env.DATADOG_VERSION || '1.0.0'
};

// Validate secrets in production
if (env.NODE_ENV === 'production') {
  const secretValidation = [
    { name: 'JWT_SECRET', value: env.JWT_SECRET },
    { name: 'JWT_REFRESH_SECRET', value: env.JWT_REFRESH_SECRET },
  ];

  secretValidation.forEach(({ name, value }) => {
    if (!validateSecret(value, 64)) {
      console.error(
        `❌ Security validation failed for ${name}: Secret is weak or contains placeholder values`
      );
      
      // Never allow weak secrets in production, even in test runners
      if (process.env.NODE_ENV === 'test') {
        console.warn(`⚠️  Test mode: continuing with weak ${name} - this should only be used for testing`);
      } else {
        console.error(`🚨 CRITICAL: Weak secret detected in production environment: ${name}`);
        process.exit(1);
      }
    }
  });
}

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

  // Claude
  claude: {
    apiKey: env.CLAUDE_API_KEY,
    model: env.CLAUDE_MODEL,
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

  // Security
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    sessionSecret: env.SESSION_SECRET,
    cookieSecure: env.COOKIE_SECURE,
    cookieHttpOnly: env.COOKIE_HTTPONLY,
    cookieSameSite: env.COOKIE_SAMESITE,
  },

  // Stripe
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY || '',
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
  },

  // Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.EMAIL_FROM,
  },

  // SMS
  sms: {
    provider: env.SMS_PROVIDER,
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID || '',
      authToken: env.TWILIO_AUTH_TOKEN || '',
      fromNumber: env.TWILIO_FROM_NUMBER || '',
    },
    awsSns: {
      accessKeyId: env.AWS_SNS_ACCESS_KEY_ID || '',
      secretAccessKey: env.AWS_SNS_SECRET_ACCESS_KEY || '',
      region: env.AWS_SNS_REGION,
    },
    mock: {
      enabled: env.NODE_ENV !== 'production',
      simulateFailure: env.SMS_SIMULATE_FAILURE,
    },
  },

  // Push Notifications
  fcm: {
    serverKey: env.FCM_SERVER_KEY || '',
  },

  // Analytics
  analytics: {
    apiKey: env.ANALYTICS_API_KEY || '',
  },

  // CDN
  cdn: {
    url: env.CDN_URL || '',
    enabled: env.CDN_ENABLED,
  },

  // Monitoring
  monitoring: {
    sentry: {
      enabled: !!env.SENTRY_DSN,
      dsn: env.SENTRY_DSN || '',
      environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
      release: env.SENTRY_RELEASE,
      tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
      profilesSampleRate: env.SENTRY_PROFILES_SAMPLE_RATE,
    },
    datadog: {
      enabled: env.DATADOG_ENABLED,
      agentHost: env.DATADOG_AGENT_HOST,
      agentPort: env.DATADOG_AGENT_PORT,
      statsdHost: env.DATADOG_STATSD_HOST,
      statsdPort: env.DATADOG_STATSD_PORT,
      service: env.DATADOG_SERVICE,
      version: env.DATADOG_VERSION,
    },
  },

  // Feature flags
  features: {
    enablePushNotifications: !!env.FCM_SERVER_KEY,
    enableEmail: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
    enableAnalytics: !!env.ANALYTICS_API_KEY,
    enableSupabase: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
    enableClaude: !!env.CLAUDE_API_KEY,
  },
} as const;

// Type exports
export type Config = typeof config;
export type Environment = typeof env.NODE_ENV;
