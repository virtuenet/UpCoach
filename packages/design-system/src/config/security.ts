/**
 * Security Configuration for UpCoach Dashboard Applications
 * Centralized security headers and CSRF protection settings
 */

export interface SecurityConfig {
  csp: {
    directives: Record<string, string[]>;
  };
  headers: Record<string, string>;
  csrf: {
    enabled: boolean;
    tokenName: string;
    headerName: string;
  };
}

// Content Security Policy directives
export const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for MUI and React
    "'unsafe-eval'", // Required for development
    'https://cdn.jsdelivr.net',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for MUI and emotion
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:', // Allow all HTTPS images for user content
  ],
  'connect-src': [
    "'self'",
    'https://api.upcoach.ai', // API endpoint
    'https://sentry.io', // Error reporting
    'wss:', // WebSocket connections
  ],
  'media-src': [
    "'self'",
    'blob:',
    'https:',
  ],
  'worker-src': [
    "'self'",
    'blob:',
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

// Security headers configuration
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; '),
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
  ].join(', '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// CSRF protection configuration
export const csrfConfig = {
  enabled: true,
  tokenName: 'upcoach-csrf-token',
  headerName: 'X-CSRF-Token',
  cookieName: 'csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 3600, // 1 hour
  },
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

// Session configuration
export const sessionConfig = {
  name: 'upcoach-session',
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const,
  },
};

// Development overrides (less strict for development)
export const developmentSecurityConfig = {
  headers: {
    ...securityHeaders,
    'Content-Security-Policy': Object.entries({
      ...cspDirectives,
      'script-src': [
        ...cspDirectives['script-src'],
        "'unsafe-eval'", // Required for development
        'http://localhost:*',
      ],
      'connect-src': [
        ...cspDirectives['connect-src'],
        'http://localhost:*',
        'ws://localhost:*',
        'wss://localhost:*',
      ],
    })
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; '),
  },
};

// Main security configuration export
export const securityConfig: SecurityConfig = {
  csp: {
    directives: cspDirectives,
  },
  headers: process.env.NODE_ENV === 'development' 
    ? developmentSecurityConfig.headers 
    : securityHeaders,
  csrf: csrfConfig,
};

// Utility functions
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  if (!token || !storedToken || token.length !== storedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  return result === 0;
};

// Input sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const sanitizeSQL = (input: string): string => {
  return input
    .replace(/[';\\]/g, '') // Remove SQL injection characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*|\*\//g, '') // Remove SQL block comments
    .trim();
};

export default securityConfig;