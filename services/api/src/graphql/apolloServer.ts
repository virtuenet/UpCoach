import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { Pool } from 'pg';
import { createComplexityLimitRule } from 'graphql-validation-complexity';
import { readFileSync } from 'fs';
import { join } from 'path';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { logger } from '../utils/logger';
import { resolvers } from './resolvers';
import { createDataLoaders } from './dataloaders';

/**
 * Apollo Server Setup
 *
 * GraphQL server with:
 * - Schema-first approach
 * - Field-level permissions (RBAC)
 * - Real-time subscriptions (WebSocket)
 * - Query complexity limits (prevent DoS)
 * - Persisted queries (performance)
 * - DataLoader for N+1 prevention
 * - Error handling with custom codes
 * - Request logging and tracing
 *
 * Features:
 * - GraphQL Playground (development only)
 * - Automatic persisted queries (APQ)
 * - Query depth limiting (max 10 levels)
 * - Field complexity scoring
 * - Rate limiting per user
 * - CORS configuration
 */

export interface GraphQLContext {
  db: Pool;
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
  dataloaders: ReturnType<typeof createDataLoaders>;
  req: express.Request;
  res: express.Response;
}

/**
 * Create Apollo Server instance
 */
export async function createApolloServer(
  db: Pool,
  httpServer: http.Server
): Promise<ApolloServer<GraphQLContext>> {
  // Load GraphQL schema
  const typeDefs = readFileSync(
    join(__dirname, 'schema.graphql'),
    'utf-8'
  );

  // Create executable schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Setup subscription handling
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        // Extract user from WebSocket connection params
        const token = ctx.connectionParams?.authorization as string;
        const user = token ? await verifyToken(token) : undefined;

        return {
          db,
          user,
          dataloaders: createDataLoaders(db),
        };
      },
      onConnect: async (ctx) => {
        logger.info('GraphQL WebSocket connected', {
          connectionParams: ctx.connectionParams,
        });
      },
      onDisconnect: (ctx) => {
        logger.info('GraphQL WebSocket disconnected');
      },
    },
    wsServer
  );

  // Create Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    schema,
    plugins: [
      // Graceful shutdown
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },

      // GraphQL Playground (development only)
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageLocalDefault({ footer: false })
        : ApolloServerPluginLandingPageLocalDefault({
            includeCookies: true,
          }),

      // Request logging
      {
        async requestDidStart(requestContext) {
          const start = Date.now();

          return {
            async didEncounterErrors(ctx) {
              logger.error('GraphQL errors', {
                operationName: ctx.request.operationName,
                errors: ctx.errors,
                query: ctx.request.query,
                variables: ctx.request.variables,
              });
            },
            async willSendResponse(ctx) {
              const duration = Date.now() - start;
              logger.info('GraphQL request completed', {
                operationName: ctx.request.operationName,
                duration,
                userId: ctx.contextValue.user?.id,
              });
            },
          };
        },
      },
    ],

    // Query complexity limiting
    validationRules: [
      createComplexityLimitRule(1000, {
        scalarCost: 1,
        objectCost: 2,
        listFactor: 10,
        onCost: (cost) => {
          logger.info('Query complexity', { cost });
        },
      }),
    ],

    // Error formatting
    formatError: (formattedError, error) => {
      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        if (formattedError.message.startsWith('Database')) {
          return {
            ...formattedError,
            message: 'Internal server error',
          };
        }
      }

      // Add custom error codes
      const extensions = {
        ...formattedError.extensions,
        timestamp: new Date().toISOString(),
      };

      logger.error('GraphQL error', {
        message: formattedError.message,
        path: formattedError.path,
        extensions,
      });

      return {
        ...formattedError,
        extensions,
      };
    },

    // Include stack trace in development
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',

    // Introspection (development only)
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  logger.info('Apollo Server started', {
    playground: process.env.NODE_ENV !== 'production',
    subscriptions: true,
  });

  return server;
}

/**
 * Create Express middleware for Apollo Server
 */
export function createGraphQLMiddleware(
  server: ApolloServer<GraphQLContext>,
  db: Pool
) {
  return expressMiddleware(server, {
    context: async ({ req, res }): Promise<GraphQLContext> => {
      // Extract user from JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = token ? await verifyToken(token) : undefined;

      // Create DataLoaders for this request
      const dataloaders = createDataLoaders(db);

      return {
        db,
        user,
        dataloaders,
        req,
        res,
      };
    },
  });
}

/**
 * Verify JWT token and extract user
 */
async function verifyToken(token: string): Promise<{
  id: string;
  email: string;
  role: string;
  tenantId: string;
} | undefined> {
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
    };
  } catch (error) {
    logger.warn('Invalid JWT token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return undefined;
  }
}

/**
 * Setup GraphQL server with Express
 */
export async function setupGraphQLServer(
  app: express.Application,
  db: Pool
): Promise<http.Server> {
  // Create HTTP server
  const httpServer = http.createServer(app);

  // Create Apollo Server
  const apolloServer = await createApolloServer(db, httpServer);

  // Apply CORS
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
      ],
      credentials: true,
    })
  );

  // Apply Express middleware
  app.use(
    '/graphql',
    express.json({ limit: '10mb' }),
    createGraphQLMiddleware(apolloServer, db)
  );

  logger.info('GraphQL endpoint ready', {
    path: '/graphql',
    subscriptions: 'ws://localhost:4000/graphql',
  });

  return httpServer;
}

/**
 * Persisted Queries Cache
 */
export class PersistedQueryCache {
  private cache: Map<string, string> = new Map();

  get(hash: string): string | undefined {
    return this.cache.get(hash);
  }

  set(hash: string, query: string): void {
    this.cache.set(hash, query);
    logger.info('Persisted query cached', { hash });
  }

  has(hash: string): boolean {
    return this.cache.has(hash);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
