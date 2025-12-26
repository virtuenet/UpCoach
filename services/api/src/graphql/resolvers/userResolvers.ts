import { GraphQLContext } from '../apolloServer';
import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../../utils/logger';

export const userResolvers = {
  Query: {
    users: async (
      _: any,
      {
        limit = 20,
        offset = 0,
        role,
        search,
      }: { limit: number; offset: number; role?: string; search?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      let query = `SELECT * FROM users WHERE tenant_id = $1`;
      const params: any[] = [context.user.tenantId];

      if (role) {
        params.push(role.toLowerCase());
        query += ` AND role = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
      }

      // Get total count
      const countResult = await context.db.query(
        query.replace('SELECT *', 'SELECT COUNT(*)'),
        params
      );
      const totalCount = parseInt(countResult.rows[0].count);

      // Get paginated results
      params.push(limit, offset);
      query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await context.db.query(query, params);

      const edges = result.rows.map((row, index) => ({
        node: mapUser(row),
        cursor: Buffer.from(`${offset + index}`).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + limit < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount,
      };
    },
  },

  Mutation: {
    login: async (
      _: any,
      { email, password }: { email: string; password: string },
      context: GraphQLContext
    ) => {
      try {
        // Find user
        const query = `SELECT * FROM users WHERE email = $1`;
        const result = await context.db.query(query, [email.toLowerCase()]);

        if (result.rows.length === 0) {
          throw new GraphQLError('Invalid credentials', {
            extensions: { code: 'INVALID_CREDENTIALS' },
          });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
          throw new GraphQLError('Invalid credentials', {
            extensions: { code: 'INVALID_CREDENTIALS' },
          });
        }

        // Generate tokens
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id,
          },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '7d' }
        );

        const refreshToken = jwt.sign(
          { userId: user.id },
          process.env.JWT_REFRESH_SECRET || 'refresh-secret',
          { expiresIn: '30d' }
        );

        logger.info('User logged in', { userId: user.id, email: user.email });

        return {
          token,
          refreshToken,
          user: mapUser(user),
          expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
        };
      } catch (error) {
        logger.error('Login failed', {
          email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },

    register: async (
      _: any,
      {
        email,
        password,
        firstName,
        lastName,
      }: { email: string; password: string; firstName: string; lastName: string },
      context: GraphQLContext
    ) => {
      try {
        // Check if user exists
        const existingUser = await context.db.query(
          `SELECT id FROM users WHERE email = $1`,
          [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
          throw new GraphQLError('Email already registered', {
            extensions: { code: 'EMAIL_EXISTS' },
          });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const query = `
          INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'member', NOW(), NOW())
          RETURNING *
        `;
        const result = await context.db.query(query, [
          email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
        ]);

        const user = result.rows[0];

        // Generate tokens
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id,
          },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '7d' }
        );

        const refreshToken = jwt.sign(
          { userId: user.id },
          process.env.JWT_REFRESH_SECRET || 'refresh-secret',
          { expiresIn: '30d' }
        );

        logger.info('User registered', { userId: user.id, email: user.email });

        return {
          token,
          refreshToken,
          user: mapUser(user),
          expiresIn: 7 * 24 * 60 * 60,
        };
      } catch (error) {
        logger.error('Registration failed', {
          email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },

    refreshToken: async (
      _: any,
      { refreshToken }: { refreshToken: string },
      context: GraphQLContext
    ) => {
      try {
        // Verify refresh token
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || 'refresh-secret'
        ) as { userId: string };

        // Get user
        const query = `SELECT * FROM users WHERE id = $1`;
        const result = await context.db.query(query, [decoded.userId]);

        if (result.rows.length === 0) {
          throw new GraphQLError('Invalid refresh token', {
            extensions: { code: 'INVALID_TOKEN' },
          });
        }

        const user = result.rows[0];

        // Generate new tokens
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id,
          },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '7d' }
        );

        const newRefreshToken = jwt.sign(
          { userId: user.id },
          process.env.JWT_REFRESH_SECRET || 'refresh-secret',
          { expiresIn: '30d' }
        );

        return {
          token,
          refreshToken: newRefreshToken,
          user: mapUser(user),
          expiresIn: 7 * 24 * 60 * 60,
        };
      } catch (error) {
        logger.error('Token refresh failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw new GraphQLError('Invalid refresh token', {
          extensions: { code: 'INVALID_TOKEN' },
        });
      }
    },

    logout: async (_: any, __: any, context: GraphQLContext) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      logger.info('User logged out', { userId: context.user.id });

      // In production, invalidate token in Redis
      return true;
    },
  },
};

function mapUser(row: any): any {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role?.toUpperCase(),
    avatar: row.avatar,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tenantId: row.tenant_id,
  };
}
