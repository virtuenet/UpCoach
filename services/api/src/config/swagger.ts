/**
 * Swagger/OpenAPI Configuration
 *
 * This module configures Swagger UI and OpenAPI 3.0 documentation for the UpCoach API.
 * It provides an interactive API explorer at /api-docs and generates OpenAPI JSON/YAML exports.
 *
 * Features:
 * - Interactive API documentation at /api-docs
 * - OpenAPI 3.0 specification
 * - JWT Bearer authentication
 * - Reusable schemas and components
 * - Auto-discovery of JSDoc annotations in route files
 *
 * Usage:
 * Import and use setupSwagger() in app.ts to configure Swagger middleware
 */

import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from './environment';

/**
 * OpenAPI 3.0 Configuration
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'UpCoach API Documentation',
    version: '1.0.0',
    description: `
# UpCoach Backend API

AI-powered personal coaching and development platform API.

## Features
- 🔐 **Authentication**: JWT-based auth with refresh tokens, OAuth (Google, Apple, Facebook), WebAuthn
- 🎯 **Goal Management**: Create, track, and manage personal goals
- 📝 **Habit Tracking**: Build and maintain healthy habits
- 🎙️ **Voice Journaling**: AI-powered voice journal with emotion analysis
- 💬 **Chat & Messaging**: Real-time chat with coaches and community
- 📊 **Analytics**: Personal insights and progress tracking
- 💳 **Payments**: Stripe integration for subscriptions and payments
- 🔔 **Notifications**: Push notifications via Firebase Cloud Messaging
- 🤖 **AI Services**: OpenAI GPT-4, Anthropic Claude, Hugging Face models
- 🏢 **Enterprise**: Multi-tenant, SSO, team management

## Getting Started

### Authentication
Most endpoints require authentication via JWT Bearer token:
1. Register: \`POST /api/auth/register\`
2. Login: \`POST /api/auth/login\` - Returns \`accessToken\` and \`refreshToken\`
3. Use \`accessToken\` in Authorization header: \`Bearer <token>\`
4. Refresh: \`POST /api/auth/refresh\` when access token expires

### Rate Limiting
- API routes: 100 requests per 15 minutes per IP
- Webhook routes: 1000 requests per 15 minutes per IP

### Base URL
- Development: \`http://localhost:${config.port}\`
- Production: \`https://api.upcoach.com\`
    `,
    contact: {
      name: 'UpCoach API Support',
      email: 'api@upcoach.com',
      url: 'https://upcoach.com/support',
    },
    license: {
      name: 'Proprietary',
      url: 'https://upcoach.com/license',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Development server',
    },
    {
      url: 'https://api-staging.upcoach.com',
      description: 'Staging server',
    },
    {
      url: 'https://api.upcoach.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token obtained from /api/auth/login or /api/auth/refresh',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service authentication',
      },
    },
    schemas: {
      // Standard response schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response payload varies by endpoint',
          },
          message: {
            type: 'string',
            description: 'Optional success message',
          },
        },
        required: ['success'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error description',
          },
          error: {
            type: 'string',
            description: 'Error code or type',
            example: 'UNAUTHORIZED',
          },
        },
        required: ['success', 'message'],
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 100 },
              totalPages: { type: 'integer', example: 5 },
            },
          },
        },
      },

      // User schemas
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          name: { type: 'string', example: 'John Doe' },
          username: { type: 'string', example: 'johndoe' },
          role: {
            type: 'string',
            enum: ['user', 'coach', 'admin'],
            example: 'user',
          },
          emailVerified: { type: 'boolean', example: true },
          twoFactorEnabled: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UserRegistration: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', format: 'password', minLength: 8, example: 'SecurePass123!' },
          name: { type: 'string', example: 'John Doe' },
          username: { type: 'string', example: 'johndoe' },
        },
      },
      UserLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', format: 'password', example: 'SecurePass123!' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              expiresIn: { type: 'integer', example: 3600, description: 'Token expiry in seconds' },
            },
          },
        },
      },

      // Goal schemas
      Goal: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Learn TypeScript' },
          description: { type: 'string', example: 'Master TypeScript in 30 days' },
          category: {
            type: 'string',
            enum: ['career', 'health', 'personal', 'financial', 'relationships', 'education'],
            example: 'education',
          },
          status: {
            type: 'string',
            enum: ['active', 'completed', 'paused', 'abandoned'],
            example: 'active',
          },
          progress: { type: 'integer', minimum: 0, maximum: 100, example: 45 },
          targetDate: { type: 'string', format: 'date', example: '2025-12-31' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateGoal: {
        type: 'object',
        required: ['title', 'description'],
        properties: {
          title: { type: 'string', example: 'Learn TypeScript' },
          description: { type: 'string', example: 'Master TypeScript in 30 days' },
          category: { type: 'string', example: 'education' },
          targetDate: { type: 'string', format: 'date', example: '2025-12-31' },
        },
      },

      // Habit schemas
      Habit: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Morning Meditation' },
          description: { type: 'string', example: '10 minutes of mindfulness' },
          frequency: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly'],
            example: 'daily',
          },
          streak: { type: 'integer', example: 15, description: 'Current streak count' },
          bestStreak: { type: 'integer', example: 30, description: 'Best streak achieved' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // Notification schemas
      NotificationPayload: {
        type: 'object',
        required: ['userId', 'type', 'data'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          type: {
            type: 'string',
            enum: [
              'habit_reminder',
              'habit_streak',
              'goal_milestone',
              'coach_message',
              'achievement_unlocked',
              'task_due',
              'mood_check_in',
              'voice_journal_prompt',
              'community_reply',
              'subscription_expiring',
              'welcome',
              'daily_summary',
            ],
            example: 'habit_reminder',
          },
          data: {
            type: 'object',
            description: 'Template data varies by notification type',
            example: {
              habitName: 'Morning Meditation',
              habitId: '550e8400-e29b-41d4-a716-446655440000',
              streakCount: 15,
            },
          },
        },
      },

      // Payment schemas
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          stripeSubscriptionId: { type: 'string', example: 'sub_1234567890' },
          status: {
            type: 'string',
            enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'],
            example: 'active',
          },
          plan: {
            type: 'string',
            enum: ['free', 'basic', 'pro', 'enterprise'],
            example: 'pro',
          },
          amount: { type: 'integer', example: 2999, description: 'Amount in cents' },
          currency: { type: 'string', example: 'usd' },
          currentPeriodStart: { type: 'string', format: 'date-time' },
          currentPeriodEnd: { type: 'string', format: 'date-time' },
          cancelAtPeriodEnd: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized - Invalid or missing authentication token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Authentication required',
              error: 'UNAUTHORIZED',
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Insufficient permissions',
              error: 'FORBIDDEN',
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Resource not found',
              error: 'NOT_FOUND',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error - Invalid request parameters',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Validation failed',
              error: 'VALIDATION_ERROR',
            },
          },
        },
      },
      RateLimitExceeded: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Too many requests. Please try again later.',
              error: 'RATE_LIMIT_EXCEEDED',
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Users', description: 'User management' },
    { name: 'Goals', description: 'Goal creation and tracking' },
    { name: 'Habits', description: 'Habit tracking and management' },
    { name: 'Tasks', description: 'Task management' },
    { name: 'Mood', description: 'Mood tracking and analysis' },
    { name: 'Voice Journal', description: 'Voice journaling with AI analysis' },
    { name: 'Chat', description: 'Real-time messaging' },
    { name: 'Coaches', description: 'Coach profiles and services' },
    { name: 'Notifications', description: 'Push notifications' },
    { name: 'Payments', description: 'Stripe payments and subscriptions' },
    { name: 'Analytics', description: 'User analytics and insights' },
    { name: 'AI Services', description: 'AI-powered features' },
    { name: 'Enterprise', description: 'Enterprise features (SSO, teams, organizations)' },
    { name: 'Health', description: 'System health and monitoring' },
  ],
};

/**
 * Swagger JSDoc Options
 * Automatically discovers JSDoc annotations in route files
 */
const swaggerOptions: swaggerJSDoc.Options = {
  definition: swaggerDefinition,
  apis: [
    // Route files
    path.join(__dirname, '../routes/**/*.ts'),
    path.join(__dirname, '../routes/*.ts'),
    // Model files (if needed)
    path.join(__dirname, '../models/**/*.ts'),
    // Controller files (if needed)
    path.join(__dirname, '../controllers/**/*.ts'),
  ],
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * Swagger UI Options
 */
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .scheme-container { background: #fafafa; padding: 20px; }
  `,
  customSiteTitle: 'UpCoach API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

/**
 * Setup Swagger middleware on Express app
 *
 * @param app - Express application instance
 */
export function setupSwagger(app: Express): void {
  // Serve Swagger UI at /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Serve OpenAPI JSON at /api-docs.json
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 Swagger UI available at: http://localhost:${config.port}/api-docs`);
  console.log(`📄 OpenAPI JSON available at: http://localhost:${config.port}/api-docs.json`);
}

/**
 * Export OpenAPI spec as JSON for external tools
 */
export function exportOpenApiSpec(): string {
  return JSON.stringify(swaggerSpec, null, 2);
}
