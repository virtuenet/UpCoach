/**
 * Security Configuration
 * Phase 13 Week 1
 *
 * Centralized security configuration for WAF, DDoS, IDS,
 * threat intelligence, and all security services
 */

export interface SecurityConfig {
  waf: {
    enabled: boolean;
    mode: 'block' | 'log' | 'off';
    rulesets: string[];
    customRules: any[];
    logViolations: boolean;
  };
  ddos: {
    enabled: boolean;
    thresholds: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    banDuration: number; // milliseconds
    whitelistedIPs: string[];
    challengeThreshold: number;
  };
  ids: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    ml Models: string[];
    bruteForce: {
      maxFailedAttempts: number;
      timeWindow: number;
    };
    dataExfiltration: {
      maxDownloadMB: number;
      timeWindow: number;
    };
    anomalyDetection: {
      zScoreThreshold: number;
      minBaselineData: number;
    };
  };
  threatIntel: {
    enabled: boolean;
    sources: string[];
    apiKeys: {
      abuseIPDB?: string;
      virusTotal?: string;
      haveIBeenPwned?: string;
    };
    updateInterval: number; // milliseconds
    cacheTTL: number; // milliseconds
  };
  headers: {
    hsts: {
      enabled: boolean;
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
    csp: {
      enabled: boolean;
      directives: Record<string, string[]>;
    };
    frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    referrerPolicy: string;
  };
  encryption: {
    algorithm: string;
    keyDerivation: {
      iterations: number;
      keyLength: number;
      digest: string;
    };
    passwordHashing: {
      algorithm: 'bcrypt' | 'argon2';
      rounds: number; // bcrypt rounds or argon2 time cost
      memoryCost?: number; // argon2 only
      parallelism?: number; // argon2 only
    };
  };
  session: {
    secret: string;
    maxAge: number; // milliseconds
    secure: boolean; // HTTPS only
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    rolling: boolean; // Refresh session on activity
  };
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
    maxAge: number; // preflight cache duration
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
    standardHeaders: boolean; // RateLimit-* headers
    legacyHeaders: boolean; // X-RateLimit-* headers
  };
}

/**
 * Production security configuration
 */
export const productionConfig: SecurityConfig = {
  waf: {
    enabled: true,
    mode: 'block',
    rulesets: ['sql-injection', 'xss', 'path-traversal', 'command-injection'],
    customRules: [],
    logViolations: true
  },
  ddos: {
    enabled: true,
    thresholds: {
      requestsPerMinute: 1000,
      requestsPerHour: 10000
    },
    banDuration: 900000, // 15 minutes
    whitelistedIPs: [],
    challengeThreshold: 500
  },
  ids: {
    enabled: true,
    sensitivity: 'medium',
    mlModels: ['anomaly-detection', 'user-behavior'],
    bruteForce: {
      maxFailedAttempts: 10,
      timeWindow: 300000 // 5 minutes
    },
    dataExfiltration: {
      maxDownloadMB: 100,
      timeWindow: 3600000 // 1 hour
    },
    anomalyDetection: {
      zScoreThreshold: 3,
      minBaselineData: 100
    }
  },
  threatIntel: {
    enabled: true,
    sources: ['abuseipdb', 'virustotal', 'hibp'],
    apiKeys: {
      abuseIPDB: process.env.ABUSEIPDB_API_KEY,
      virusTotal: process.env.VIRUSTOTAL_API_KEY,
      haveIBeenPwned: process.env.HIBP_API_KEY
    },
    updateInterval: 86400000, // 24 hours
    cacheTTL: 86400000 // 24 hours
  },
  headers: {
    hsts: {
      enabled: true,
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    csp: {
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    frameOptions: 'DENY',
    referrerPolicy: 'strict-origin-when-cross-origin'
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: {
      iterations: 100000,
      keyLength: 32,
      digest: 'sha512'
    },
    passwordHashing: {
      algorithm: 'argon2',
      rounds: 3, // time cost
      memoryCost: 65536, // 64MB
      parallelism: 4
    }
  },
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    maxAge: 86400000, // 24 hours
    secure: true, // HTTPS only in production
    httpOnly: true,
    sameSite: 'strict',
    rolling: true
  },
  cors: {
    enabled: true,
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['https://app.upcoach.com'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 3600 // 1 hour
  },
  rateLimit: {
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    standardHeaders: true,
    legacyHeaders: false
  }
};

/**
 * Development security configuration (less strict for testing)
 */
export const developmentConfig: SecurityConfig = {
  ...productionConfig,
  waf: {
    ...productionConfig.waf,
    mode: 'log' // Log only, don't block in dev
  },
  ddos: {
    ...productionConfig.ddos,
    enabled: false // Disable DDoS protection in dev
  },
  ids: {
    ...productionConfig.ids,
    sensitivity: 'low'
  },
  threatIntel: {
    ...productionConfig.threatIntel,
    enabled: false // Disable in dev to avoid API costs
  },
  session: {
    ...productionConfig.session,
    secure: false, // Allow HTTP in development
    secret: 'dev-secret-key'
  },
  cors: {
    ...productionConfig.cors,
    origins: ['http://localhost:3000', 'http://localhost:3001']
  },
  rateLimit: {
    ...productionConfig.rateLimit,
    maxRequests: 1000 // Higher limit for development
  }
};

/**
 * Test security configuration (minimal security for tests)
 */
export const testConfig: SecurityConfig = {
  ...developmentConfig,
  waf: {
    ...developmentConfig.waf,
    enabled: false
  },
  ddos: {
    ...developmentConfig.ddos,
    enabled: false
  },
  ids: {
    ...developmentConfig.ids,
    enabled: false
  },
  threatIntel: {
    ...developmentConfig.threatIntel,
    enabled: false
  },
  rateLimit: {
    ...developmentConfig.rateLimit,
    maxRequests: 10000 // Very high for testing
  }
};

/**
 * Get security config based on environment
 */
export function getSecurityConfig(): SecurityConfig {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    default:
      return developmentConfig;
  }
}

/**
 * Security configuration validation
 */
export function validateSecurityConfig(config: SecurityConfig): string[] {
  const errors: string[] = [];

  // Validate WAF
  if (config.waf.enabled && !['block', 'log', 'off'].includes(config.waf.mode)) {
    errors.push('Invalid WAF mode. Must be "block", "log", or "off"');
  }

  // Validate DDoS
  if (config.ddos.enabled) {
    if (config.ddos.thresholds.requestsPerMinute <= 0) {
      errors.push('DDoS requestsPerMinute must be positive');
    }
    if (config.ddos.banDuration <= 0) {
      errors.push('DDoS banDuration must be positive');
    }
  }

  // Validate IDS
  if (config.ids.enabled) {
    if (!['low', 'medium', 'high'].includes(config.ids.sensitivity)) {
      errors.push('Invalid IDS sensitivity. Must be "low", "medium", or "high"');
    }
    if (config.ids.anomalyDetection.zScoreThreshold <= 0) {
      errors.push('IDS zScoreThreshold must be positive');
    }
  }

  // Validate encryption
  if (config.encryption.passwordHashing.algorithm === 'argon2') {
    if (!config.encryption.passwordHashing.memoryCost) {
      errors.push('Argon2 requires memoryCost parameter');
    }
    if (!config.encryption.passwordHashing.parallelism) {
      errors.push('Argon2 requires parallelism parameter');
    }
  }

  // Validate session
  if (process.env.NODE_ENV === 'production') {
    if (config.session.secret === 'change-this-in-production') {
      errors.push('Session secret must be changed in production');
    }
    if (!config.session.secure) {
      errors.push('Session must use secure flag in production');
    }
  }

  // Validate CORS
  if (config.cors.enabled && config.cors.origins.length === 0) {
    errors.push('CORS origins cannot be empty when CORS is enabled');
  }

  return errors;
}

/**
 * Security constants
 */
export const SECURITY_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 900000, // 15 minutes
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_MAX_LENGTH: 128,
  MFA_CODE_LENGTH: 6,
  MFA_CODE_EXPIRY: 300000, // 5 minutes
  API_KEY_LENGTH: 32,
  CSRF_TOKEN_LENGTH: 32,
  SESSION_ID_LENGTH: 32,
  MAX_FILE_UPLOAD_SIZE: 10485760, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv'
  ]
};

export default getSecurityConfig;
