"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
const secrets_1 = require("../utils/secrets");
// Load environment variables
dotenv_1.default.config();
// Custom Zod refinements for security validation
const secureString = (minLength = 64) => zod_1.z
    .string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .refine(val => {
    // Check for weak patterns
    const weakPatterns = [
        'secret',
        'key',
        'password',
        'test',
        'placeholder',
        'change',
        'example',
    ];
    const lower = val.toLowerCase();
    return !weakPatterns.some(pattern => lower.includes(pattern));
}, 'Contains weak or placeholder values - please use a secure secret');
// Environment validation schema with enhanced security
const envSchema = zod_1.z.object({
    // Server Configuration
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3001'),
    // Database Configuration
    DATABASE_URL: zod_1.z
        .string()
        .min(20, 'Database URL must be properly configured')
        .refine(val => process.env.NODE_ENV !== 'production' || !val.includes('password'), 'Database URL contains weak password'),
    // Redis Configuration
    REDIS_URL: zod_1.z.string().optional().default('redis://localhost:6379'),
    // Authentication - Enhanced security requirements
    JWT_SECRET: process.env.NODE_ENV === 'production'
        ? secureString(64)
        : zod_1.z.string().min(32, 'JWT secret must be at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'), // Reduced from 7d for security
    JWT_REFRESH_SECRET: process.env.NODE_ENV === 'production'
        ? secureString(64)
        : zod_1.z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'), // Reduced from 30d
    // OpenAI Configuration
    OPENAI_API_KEY: zod_1.z
        .string()
        .min(1, 'OpenAI API key is required')
        .refine(val => !val || val.startsWith('sk-'), 'Invalid OpenAI API key format'),
    OPENAI_MODEL: zod_1.z.string().default('gpt-3.5-turbo'),
    // Claude Configuration
    CLAUDE_API_KEY: zod_1.z.string().optional(),
    CLAUDE_MODEL: zod_1.z.string().default('claude-3-sonnet-20240229'),
    // Supabase Configuration (if using Supabase for auth/storage)
    SUPABASE_URL: zod_1.z.string().optional(),
    SUPABASE_ANON_KEY: zod_1.z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().optional(),
    // CORS Origins
    CORS_ORIGINS: zod_1.z.string().default('http://localhost:3000,http://localhost:3002'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
    // File Upload
    MAX_FILE_SIZE: zod_1.z.string().transform(Number).default('10485760'), // 10MB
    UPLOAD_DIR: zod_1.z.string().default('./uploads'),
    // Logging
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FILE: zod_1.z.string().optional(),
    // Security Settings
    BCRYPT_ROUNDS: zod_1.z.string().transform(Number).default('14'),
    SESSION_SECRET: zod_1.z.string().optional(),
    COOKIE_SECURE: zod_1.z
        .string()
        .transform(val => val === 'true')
        .default('true'),
    COOKIE_HTTPONLY: zod_1.z
        .string()
        .transform(val => val === 'true')
        .default('true'),
    COOKIE_SAMESITE: zod_1.z.enum(['strict', 'lax', 'none']).optional().default('strict'),
    // Stripe Configuration
    STRIPE_SECRET_KEY: zod_1.z
        .string()
        .optional()
        .refine(val => !val || val.startsWith('sk_'), 'Invalid Stripe secret key format'),
    STRIPE_WEBHOOK_SECRET: zod_1.z
        .string()
        .optional()
        .refine(val => !val || val.startsWith('whsec_'), 'Invalid Stripe webhook secret format'),
    // Email Configuration (for notifications)
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().transform(Number).optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().email().optional(),
    // Push Notifications
    FCM_SERVER_KEY: zod_1.z.string().optional(),
    // Analytics
    ANALYTICS_API_KEY: zod_1.z.string().optional(),
    // CDN Configuration
    CDN_URL: zod_1.z.string().optional(),
    CDN_ENABLED: zod_1.z
        .string()
        .transform(val => val === 'true')
        .optional()
        .default('false'),
    // Monitoring Configuration
    SENTRY_DSN: zod_1.z.string().optional(),
    SENTRY_ENVIRONMENT: zod_1.z.string().optional(),
    SENTRY_RELEASE: zod_1.z.string().optional(),
    SENTRY_TRACES_SAMPLE_RATE: zod_1.z.string().transform(Number).optional().default('0.1'),
    SENTRY_PROFILES_SAMPLE_RATE: zod_1.z.string().transform(Number).optional().default('0.1'),
    DATADOG_ENABLED: zod_1.z
        .string()
        .transform(val => val === 'true')
        .optional()
        .default('false'),
    DATADOG_AGENT_HOST: zod_1.z.string().optional().default('localhost'),
    DATADOG_AGENT_PORT: zod_1.z.string().transform(Number).optional().default('8126'),
    DATADOG_STATSD_HOST: zod_1.z.string().optional().default('localhost'),
    DATADOG_STATSD_PORT: zod_1.z.string().transform(Number).optional().default('8125'),
    DATADOG_SERVICE: zod_1.z.string().optional().default('upcoach-backend'),
    DATADOG_VERSION: zod_1.z.string().optional(),
});
// Validate environment variables
const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
    console.error('❌ Environment validation failed:');
    envResult.error.issues.forEach(issue => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
}
const env = envResult.data;
// Validate secrets in production
if (env.NODE_ENV === 'production') {
    const secretValidation = [
        { name: 'JWT_SECRET', value: env.JWT_SECRET },
        { name: 'JWT_REFRESH_SECRET', value: env.JWT_REFRESH_SECRET },
    ];
    secretValidation.forEach(({ name, value }) => {
        if (!(0, secrets_1.validateSecret)(value, 64)) {
            console.error(`❌ Security validation failed for ${name}: Secret is weak or contains placeholder values`);
            process.exit(1);
        }
    });
}
// Export typed configuration
exports.config = {
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
    // Push Notifications
    fcm: {
        serverKey: env.FCM_SERVER_KEY,
    },
    // Analytics
    analytics: {
        apiKey: env.ANALYTICS_API_KEY,
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
};
//# sourceMappingURL=environment.js.map