import { Pact } from '@pact-foundation/pact';
import axios from 'axios';
import path from 'path';
import { UserSchema, LoginResponseSchema, UserListSchema } from '../schemas/user.schema';

describe('User API Contract Tests', () => {
  const provider = new Pact({
    consumer: 'upcoach-frontend',
    provider: 'upcoach-backend',
    port: 1234,
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'warn',
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('POST /auth/login', () => {
    it('should return a valid login response', async () => {
      const expectedResponse = {
        success: true,
        token: 'jwt.token.here',
        refreshToken: 'refresh.token.here',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          isActive: true,
        },
        expiresIn: 3600,
      };

      await provider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a login request',
        withRequest: {
          method: 'POST',
          path: '/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            email: 'test@example.com',
            password: 'password123',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      });

      const response = await axios.post('http://localhost:1234/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      // Validate response against schema
      const validatedResponse = LoginResponseSchema.parse(response.data);
      expect(validatedResponse).toEqual(expectedResponse);
    });
  });

  describe('GET /users', () => {
    it('should return a paginated list of users', async () => {
      const expectedResponse = {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user1@example.com',
            name: 'User One',
            role: 'user',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            isActive: true,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      await provider.addInteraction({
        state: 'users exist',
        uponReceiving: 'a request for users',
        withRequest: {
          method: 'GET',
          path: '/users',
          query: {
            page: '1',
            limit: '10',
          },
          headers: {
            Authorization: 'Bearer jwt.token.here',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      });

      const response = await axios.get('http://localhost:1234/users', {
        params: { page: 1, limit: 10 },
        headers: { Authorization: 'Bearer jwt.token.here' },
      });

      // Validate response against schema
      const validatedResponse = UserListSchema.parse(response.data);
      expect(validatedResponse).toEqual(expectedResponse);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a single user', async () => {
      const expectedUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isActive: true,
        subscription: {
          id: '456e7890-e89b-12d3-a456-426614174000',
          status: 'active',
          plan: 'premium',
          expiresAt: '2024-12-31T23:59:59Z',
        },
      };

      await provider.addInteraction({
        state: 'user exists with subscription',
        uponReceiving: 'a request for a specific user',
        withRequest: {
          method: 'GET',
          path: '/users/123e4567-e89b-12d3-a456-426614174000',
          headers: {
            Authorization: 'Bearer jwt.token.here',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedUser,
        },
      });

      const response = await axios.get(
        'http://localhost:1234/users/123e4567-e89b-12d3-a456-426614174000',
        {
          headers: { Authorization: 'Bearer jwt.token.here' },
        }
      );

      // Validate response against schema
      const validatedUser = UserSchema.parse(response.data);
      expect(validatedUser).toEqual(expectedUser);
    });
  });
});