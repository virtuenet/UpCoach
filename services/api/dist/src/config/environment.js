"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv = __importStar(require("dotenv"));
const zod_1 = require("zod");
const secrets_1 = require("../utils/secrets");
dotenv.config();
const secureString = (minLength = 64) => zod_1.z
    .string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .refine(val => {
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
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3001'),
    DATABASE_URL: zod_1.z
        .string()
        .min(20, 'Database URL must be properly configured')
        .refine(val => process.env.NODE_ENV !== 'production' || !val.includes('password'), 'Database URL contains weak password'),
    REDIS_URL: zod_1.z.string().optional().default('redis://localhost:6379'),
    JWT_SECRET: process.env.NODE_ENV === 'production'
        ? secureString(64)
        : zod_1.z.string().min(32, 'JWT secret must be at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_SECRET: process.env.NODE_ENV === 'production'
        ? secureString(64)
        : zod_1.z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    OPENAI_API_KEY: zod_1.z
        .string()
        .min(1, 'OpenAI API key is required')
        .refine(val => !val || process.env.NODE_ENV === 'test' || val.startsWith('sk-'), 'Invalid OpenAI API key format'),
    OPENAI_MODEL: zod_1.z.string().default('gpt-3.5-turbo'),
    CLAUDE_API_KEY: zod_1.z.string().optional(),
    CLAUDE_MODEL: zod_1.z.string().default('claude-3-sonnet-20240229'),
    SUPABASE_URL: zod_1.z.string().optional(),
    SUPABASE_ANON_KEY: zod_1.z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().optional(),
    CORS_ORIGINS: zod_1.z.string().default('http://localhost:1005,http://localhost:1006,http://localhost:1007'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
    MAX_FILE_SIZE: zod_1.z.string().transform(Number).default('10485760'),
    UPLOAD_DIR: zod_1.z.string().optional().default('./uploads'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FILE: zod_1.z.string().optional(),
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
    STRIPE_SECRET_KEY: zod_1.z
        .string()
        .optional()
        .refine(val => !val || val.startsWith('sk_'), 'Invalid Stripe secret key format'),
    STRIPE_WEBHOOK_SECRET: zod_1.z
        .string()
        .optional()
        .refine(val => !val || val.startsWith('whsec_'), 'Invalid Stripe webhook secret format'),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().transform(Number).optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().email().optional(),
    SMS_PROVIDER: zod_1.z.enum(['mock', 'twilio', 'aws-sns']).optional().default('mock'),
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional(),
    TWILIO_FROM_NUMBER: zod_1.z.string().optional(),
    AWS_SNS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SNS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_SNS_REGION: zod_1.z.string().optional().default('us-east-1'),
    SMS_SIMULATE_FAILURE: zod_1.z.string().transform(val => val === 'true').optional().default('false'),
    FCM_SERVER_KEY: zod_1.z.string().optional(),
    ANALYTICS_API_KEY: zod_1.z.string().optional(),
    CDN_URL: zod_1.z.string().optional(),
    CDN_ENABLED: zod_1.z
        .string()
        .transform(val => val === 'true')
        .optional()
        .default('false'),
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
    DATADOG_AGENT_PORT: zod_1.z.preprocess(val => val ? Number(val) : 8126, zod_1.z.number()).optional(),
    DATADOG_STATSD_HOST: zod_1.z.string().optional().default('localhost'),
    DATADOG_STATSD_PORT: zod_1.z.preprocess(val => val ? Number(val) : 8125, zod_1.z.number()).optional(),
    DATADOG_SERVICE: zod_1.z.string().optional().default('upcoach-backend'),
    DATADOG_VERSION: zod_1.z.string().optional().default('1.0.0'),
});
const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
    console.error('❌ Environment validation failed:');
    envResult.error.issues.forEach(issue => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    if (process.env.NODE_ENV === 'test') {
        console.warn('⚠️  Running in test mode - continuing with environment validation warnings');
    }
    else {
        console.error('🚨 CRITICAL: Environment validation failed in non-test environment');
        process.exit(1);
    }
}
const env = envResult.success ? envResult.data : {
    NODE_ENV: process.env.NODE_ENV || 'test',
    PORT: parseInt(process.env.PORT || '3001', 10),
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/upcoach_test',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-for-testing-only',
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
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
if (env.NODE_ENV === 'production') {
    const secretValidation = [
        { name: 'JWT_SECRET', value: env.JWT_SECRET },
        { name: 'JWT_REFRESH_SECRET', value: env.JWT_REFRESH_SECRET },
    ];
    secretValidation.forEach(({ name, value }) => {
        if (!(0, secrets_1.validateSecret)(value, 64)) {
            console.error(`❌ Security validation failed for ${name}: Secret is weak or contains placeholder values`);
            if (process.env.NODE_ENV === 'test') {
                console.warn(`⚠️  Test mode: continuing with weak ${name} - this should only be used for testing`);
            }
            else {
                console.error(`🚨 CRITICAL: Weak secret detected in production environment: ${name}`);
                process.exit(1);
            }
        }
    });
}
exports.config = {
    env: env.NODE_ENV,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        refreshSecret: env.JWT_REFRESH_SECRET,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    openai: {
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
    },
    claude: {
        apiKey: env.CLAUDE_API_KEY,
        model: env.CLAUDE_MODEL,
    },
    supabase: {
        url: env.SUPABASE_URL,
        anonKey: env.SUPABASE_ANON_KEY,
        serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    corsOrigins: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    upload: {
        maxFileSize: env.MAX_FILE_SIZE,
        uploadDir: env.UPLOAD_DIR,
    },
    logging: {
        level: env.LOG_LEVEL,
        file: env.LOG_FILE,
    },
    security: {
        bcryptRounds: env.BCRYPT_ROUNDS,
        sessionSecret: env.SESSION_SECRET,
        cookieSecure: env.COOKIE_SECURE,
        cookieHttpOnly: env.COOKIE_HTTPONLY,
        cookieSameSite: env.COOKIE_SAMESITE,
    },
    stripe: {
        secretKey: env.STRIPE_SECRET_KEY || '',
        webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
    },
    email: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        from: env.EMAIL_FROM,
    },
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
    fcm: {
        serverKey: env.FCM_SERVER_KEY || '',
    },
    analytics: {
        apiKey: env.ANALYTICS_API_KEY || '',
    },
    cdn: {
        url: env.CDN_URL || '',
        enabled: env.CDN_ENABLED,
    },
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
    features: {
        enablePushNotifications: !!env.FCM_SERVER_KEY,
        enableEmail: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
        enableAnalytics: !!env.ANALYTICS_API_KEY,
        enableSupabase: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
        enableClaude: !!env.CLAUDE_API_KEY,
    },
};
//# sourceMappingURL=environment.js.map