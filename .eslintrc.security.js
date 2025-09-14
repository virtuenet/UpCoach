// ESLint Security Configuration for UpCoach Platform
// Focused on security-specific rules and vulnerability detection

module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:security/recommended',
    'plugin:node/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  
  plugins: [
    'security',
    'node',
    'import',
    '@typescript-eslint'
  ],
  
  parser: '@typescript-eslint/parser',
  
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './services/api/tsconfig.json']
  },
  
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json', './services/api/tsconfig.json']
      }
    }
  },
  
  rules: {
    // Security-specific rules
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-object-injection': 'warn',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error',
    
    // Authentication & Authorization
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Input validation
    'no-useless-escape': 'off', // Can interfere with security regex
    
    // SQL Injection prevention
    'security/detect-sql-injection': 'error',
    
    // XSS prevention  
    'no-innerHTML': 'error',
    
    // File system security
    'node/no-path-concat': 'error',
    
    // Network security
    'node/no-deprecated-api': 'error',
    
    // Custom security rules for UpCoach
    'upcoach/no-hardcoded-secrets': 'error',
    'upcoach/require-auth-middleware': 'warn',
    'upcoach/validate-jwt-secret': 'error',
    'upcoach/secure-cors-config': 'warn',
    'upcoach/validate-input-sanitization': 'warn'
  },
  
  overrides: [
    {
      // API-specific security rules
      files: ['services/api/src/**/*.ts'],
      rules: {
        'security/detect-child-process': 'error', // Stricter for API
        'security/detect-non-literal-fs-filename': 'error',
        'node/no-unpublished-require': 'off' // Allow dev dependencies in API
      }
    },
    
    {
      // Frontend-specific security rules
      files: ['apps/*/src/**/*.ts', 'apps/*/src/**/*.tsx'],
      rules: {
        'security/detect-object-injection': 'off', // Less relevant for frontend
        'node/no-unsupported-features/es-syntax': 'off' // Modern browser support
      }
    },
    
    {
      // Test files - relaxed security rules
      files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
      rules: {
        'security/detect-child-process': 'off',
        'security/detect-non-literal-fs-filename': 'off',
        'security/detect-non-literal-require': 'off',
        'security/detect-object-injection': 'off'
      }
    },
    
    {
      // Migration files - allow dynamic SQL
      files: ['**/migrations/**/*.ts', '**/seeds/**/*.ts'],
      rules: {
        'security/detect-sql-injection': 'off',
        'security/detect-non-literal-fs-filename': 'off'
      }
    }
  ],
  
  // Custom rule definitions for UpCoach-specific patterns
  globals: {
    process: 'readonly',
    Buffer: 'readonly',
    console: 'readonly'
  }
};

// Custom ESLint rules for UpCoach security patterns
// These would be implemented as a separate plugin

const customSecurityRules = {
  'upcoach/no-hardcoded-secrets': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow hardcoded secrets and API keys',
        category: 'Security'
      },
      schema: []
    },
    create(context) {
      const secretPatterns = [
        /sk_live_[a-zA-Z0-9]+/, // Stripe live keys
        /pk_live_[a-zA-Z0-9]+/, // Stripe public keys  
        /AIza[a-zA-Z0-9_-]{35}/, // Google API keys
        /ya29\.[a-zA-Z0-9_-]+/, // Google OAuth tokens
        /[a-zA-Z0-9]{32,}/, // Generic long strings that might be secrets
      ];
      
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            secretPatterns.forEach(pattern => {
              if (pattern.test(node.value)) {
                context.report({
                  node,
                  message: 'Hardcoded secret detected. Use environment variables.'
                });
              }
            });
          }
        }
      };
    }
  },
  
  'upcoach/require-auth-middleware': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Require authentication middleware for protected routes',
        category: 'Security'
      }
    },
    create(context) {
      return {
        CallExpression(node) {
          // Check for Express route definitions
          if (
            node.callee.type === 'MemberExpression' &&
            ['get', 'post', 'put', 'delete', 'patch'].includes(node.callee.property.name) &&
            node.arguments.length >= 2
          ) {
            const routePath = node.arguments[0];
            if (
              routePath.type === 'Literal' &&
              typeof routePath.value === 'string' &&
              routePath.value.startsWith('/api/') &&
              !routePath.value.includes('/auth/') &&
              !routePath.value.includes('/health') &&
              !routePath.value.includes('/csrf')
            ) {
              // Check if auth middleware is present
              const hasAuthMiddleware = node.arguments.some(arg => 
                arg.type === 'Identifier' && 
                ['authMiddleware', 'authenticate', 'requireAuth'].includes(arg.name)
              );
              
              if (!hasAuthMiddleware) {
                context.report({
                  node,
                  message: 'Protected API route missing authentication middleware'
                });
              }
            }
          }
        }
      };
    }
  },
  
  'upcoach/validate-jwt-secret': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Validate JWT secret strength',
        category: 'Security'
      }
    },
    create(context) {
      return {
        CallExpression(node) {
          if (
            node.callee.type === 'MemberExpression' &&
            node.callee.object.name === 'jwt' &&
            ['sign', 'verify'].includes(node.callee.property.name) &&
            node.arguments.length >= 2
          ) {
            const secretArg = node.arguments[1];
            if (secretArg.type === 'Literal' && typeof secretArg.value === 'string') {
              if (secretArg.value.length < 32) {
                context.report({
                  node: secretArg,
                  message: 'JWT secret must be at least 32 characters long'
                });
              }
              
              const weakPatterns = ['secret', 'password', 'key', 'test'];
              if (weakPatterns.some(pattern => secretArg.value.toLowerCase().includes(pattern))) {
                context.report({
                  node: secretArg,
                  message: 'JWT secret contains weak patterns'
                });
              }
            }
          }
        }
      };
    }
  },
  
  'upcoach/secure-cors-config': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Ensure CORS configuration is secure',
        category: 'Security'
      }
    },
    create(context) {
      return {
        CallExpression(node) {
          if (
            node.callee.name === 'cors' &&
            node.arguments.length >= 1 &&
            node.arguments[0].type === 'ObjectExpression'
          ) {
            const config = node.arguments[0];
            const originProperty = config.properties.find(prop => 
              prop.key.name === 'origin'
            );
            
            if (
              originProperty &&
              ((originProperty.value.type === 'Literal' && originProperty.value.value === '*') ||
               (originProperty.value.type === 'Literal' && originProperty.value.value === true))
            ) {
              context.report({
                node: originProperty,
                message: 'CORS origin should not be wildcard (*) in production'
              });
            }
          }
        }
      };
    }
  }
};

// Export custom rules if this were a plugin
// module.exports.rules = customSecurityRules;