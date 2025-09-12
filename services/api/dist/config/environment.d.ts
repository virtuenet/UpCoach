declare const env: {
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "info" | "error" | "warn" | "debug";
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    DATABASE_URL: string;
    PORT: number;
    REDIS_URL: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    OPENAI_API_KEY: string;
    OPENAI_MODEL: string;
    CLAUDE_MODEL: string;
    CORS_ORIGINS: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    MAX_FILE_SIZE: number;
    UPLOAD_DIR: string;
    BCRYPT_ROUNDS: number;
    COOKIE_SECURE: boolean;
    COOKIE_HTTPONLY: boolean;
    COOKIE_SAMESITE: "strict" | "lax" | "none";
    CDN_ENABLED: boolean;
    SENTRY_TRACES_SAMPLE_RATE: number;
    SENTRY_PROFILES_SAMPLE_RATE: number;
    DATADOG_ENABLED: boolean;
    DATADOG_AGENT_HOST: string;
    DATADOG_AGENT_PORT: number;
    DATADOG_STATSD_HOST: string;
    DATADOG_STATSD_PORT: number;
    DATADOG_SERVICE: string;
    LOG_FILE?: string | undefined;
    CLAUDE_API_KEY?: string | undefined;
    SUPABASE_URL?: string | undefined;
    SUPABASE_ANON_KEY?: string | undefined;
    SUPABASE_SERVICE_ROLE_KEY?: string | undefined;
    SESSION_SECRET?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: number | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    EMAIL_FROM?: string | undefined;
    FCM_SERVER_KEY?: string | undefined;
    ANALYTICS_API_KEY?: string | undefined;
    CDN_URL?: string | undefined;
    SENTRY_DSN?: string | undefined;
    SENTRY_ENVIRONMENT?: string | undefined;
    SENTRY_RELEASE?: string | undefined;
    DATADOG_VERSION?: string | undefined;
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
        readonly apiKey: string | undefined;
        readonly model: string;
    };
    readonly supabase: {
        readonly url: string | undefined;
        readonly anonKey: string | undefined;
        readonly serviceRoleKey: string | undefined;
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
        readonly file: string | undefined;
    };
    readonly security: {
        readonly bcryptRounds: number;
        readonly sessionSecret: string | undefined;
        readonly cookieSecure: boolean;
        readonly cookieHttpOnly: boolean;
        readonly cookieSameSite: "strict" | "lax" | "none";
    };
    readonly stripe: {
        readonly secretKey: string;
        readonly webhookSecret: string;
    };
    readonly email: {
        readonly host: string | undefined;
        readonly port: number | undefined;
        readonly user: string | undefined;
        readonly pass: string | undefined;
        readonly from: string | undefined;
    };
    readonly fcm: {
        readonly serverKey: string | undefined;
    };
    readonly analytics: {
        readonly apiKey: string | undefined;
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
            readonly release: string | undefined;
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
            readonly version: string | undefined;
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