declare const env: {
    NODE_ENV?: "development" | "production" | "test";
    LOG_LEVEL?: "info" | "error" | "warn" | "debug";
    LOG_FILE?: string;
    JWT_SECRET?: string;
    JWT_REFRESH_SECRET?: string;
    DATABASE_URL?: string;
    PORT?: number;
    REDIS_URL?: string;
    JWT_EXPIRES_IN?: string;
    JWT_REFRESH_EXPIRES_IN?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    CLAUDE_API_KEY?: string;
    CLAUDE_MODEL?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    CORS_ORIGINS?: string;
    RATE_LIMIT_WINDOW_MS?: number;
    RATE_LIMIT_MAX_REQUESTS?: number;
    MAX_FILE_SIZE?: number;
    UPLOAD_DIR?: string;
    BCRYPT_ROUNDS?: number;
    SESSION_SECRET?: string;
    COOKIE_SECURE?: boolean;
    COOKIE_HTTPONLY?: boolean;
    COOKIE_SAMESITE?: "strict" | "lax" | "none";
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: number;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    EMAIL_FROM?: string;
    FCM_SERVER_KEY?: string;
    ANALYTICS_API_KEY?: string;
    CDN_URL?: string;
    CDN_ENABLED?: boolean;
    SENTRY_DSN?: string;
    SENTRY_ENVIRONMENT?: string;
    SENTRY_RELEASE?: string;
    SENTRY_TRACES_SAMPLE_RATE?: number;
    SENTRY_PROFILES_SAMPLE_RATE?: number;
    DATADOG_ENABLED?: boolean;
    DATADOG_AGENT_HOST?: string;
    DATADOG_AGENT_PORT?: number;
    DATADOG_STATSD_HOST?: string;
    DATADOG_STATSD_PORT?: number;
    DATADOG_SERVICE?: string;
    DATADOG_VERSION?: string;
};
export declare const config: {
    readonly env: "development" | "production" | "test";
    readonly port: number;
    readonly databaseUrl: string;
    readonly redisUrl: string;
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
        readonly refreshSecret: string;
        readonly refreshExpiresIn: string;
    };
    readonly openai: {
        readonly apiKey: string;
        readonly model: string;
    };
    readonly claude: {
        readonly apiKey: string;
        readonly model: string;
    };
    readonly supabase: {
        readonly url: string;
        readonly anonKey: string;
        readonly serviceRoleKey: string;
    };
    readonly corsOrigins: string[];
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly upload: {
        readonly maxFileSize: number;
        readonly uploadDir: string;
    };
    readonly logging: {
        readonly level: "info" | "error" | "warn" | "debug";
        readonly file: string;
    };
    readonly security: {
        readonly bcryptRounds: number;
        readonly sessionSecret: string;
        readonly cookieSecure: boolean;
        readonly cookieHttpOnly: boolean;
        readonly cookieSameSite: "strict" | "lax" | "none";
    };
    readonly stripe: {
        readonly secretKey: string;
        readonly webhookSecret: string;
    };
    readonly email: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly pass: string;
        readonly from: string;
    };
    readonly fcm: {
        readonly serverKey: string;
    };
    readonly analytics: {
        readonly apiKey: string;
    };
    readonly cdn: {
        readonly url: string;
        readonly enabled: boolean;
    };
    readonly monitoring: {
        readonly sentry: {
            readonly enabled: boolean;
            readonly dsn: string;
            readonly environment: string;
            readonly release: string;
            readonly tracesSampleRate: number;
            readonly profilesSampleRate: number;
        };
        readonly datadog: {
            readonly enabled: boolean;
            readonly agentHost: string;
            readonly agentPort: number;
            readonly statsdHost: string;
            readonly statsdPort: number;
            readonly service: string;
            readonly version: string;
        };
    };
    readonly features: {
        readonly enablePushNotifications: boolean;
        readonly enableEmail: boolean;
        readonly enableAnalytics: boolean;
        readonly enableSupabase: boolean;
        readonly enableClaude: boolean;
    };
};
export type Config = typeof config;
export type Environment = typeof env.NODE_ENV;
export {};
//# sourceMappingURL=environment.d.ts.map