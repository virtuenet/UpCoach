import { Pact, Matchers } from '@pact-foundation/pact';
import { UserResponseSchema, UserCreateSchema, LoginResponseSchema } from '../schemas/user.schema';

const { like, term, eachLike, iso8601DateTimeWithMillis } = Matchers;

export const userServicePact = new Pact({
  consumer: 'AdminPanel',
  provider: 'UserService',
  port: 8080,
  dir: './pacts',
  logLevel: 'info',
});

export const userInteractions = {
  getUserById: {
    state: 'user with id 123 exists',
    uponReceiving: 'a request for user details',
    withRequest: {
      method: 'GET',
      path: '/api/users/123',
      headers: {
        Authorization: term({
          matcher: 'Bearer [A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+',
          generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        }),
      },
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        id: '123',
        email: like('user@example.com'),
        firstName: like('John'),
        lastName: like('Doe'),
        role: term({
          matcher: 'user|coach|admin',
          generate: 'user',
        }),
        status: term({
          matcher: 'active|inactive|suspended|pending',
          generate: 'active',
        }),
        createdAt: iso8601DateTimeWithMillis(),
        updatedAt: iso8601DateTimeWithMillis(),
        subscription: like({
          id: like('sub_123'),
          status: term({
            matcher: 'active|trialing|canceled|past_due',
            generate: 'active',
          }),
          plan: like('premium'),
          currentPeriodEnd: iso8601DateTimeWithMillis(),
        }),
      },
    },
  },

  createUser: {
    state: 'provider is ready to create users',
    uponReceiving: 'a request to create a new user',
    withRequest: {
      method: 'POST',
      path: '/api/users',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email: like('newuser@example.com'),
        password: like('SecurePass123!'),
        firstName: like('Jane'),
        lastName: like('Smith'),
        role: term({
          matcher: 'user|coach',
          generate: 'user',
        }),
      },
    },
    willRespondWith: {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        Location: term({
          matcher: '/api/users/[a-f0-9-]+',
          generate: '/api/users/456',
        }),
      },
      body: {
        id: like('456'),
        email: like('newuser@example.com'),
        firstName: like('Jane'),
        lastName: like('Smith'),
        role: like('user'),
        status: like('pending'),
        createdAt: iso8601DateTimeWithMillis(),
        updatedAt: iso8601DateTimeWithMillis(),
      },
    },
  },

  listUsers: {
    state: 'multiple users exist',
    uponReceiving: 'a request to list users',
    withRequest: {
      method: 'GET',
      path: '/api/users',
      query: {
        page: '1',
        limit: '10',
        role: 'user',
      },
      headers: {
        Authorization: term({
          matcher: 'Bearer [A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+',
          generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        }),
      },
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        data: eachLike({
          id: like('123'),
          email: like('user@example.com'),
          firstName: like('John'),
          lastName: like('Doe'),
          role: like('user'),
          status: like('active'),
          createdAt: iso8601DateTimeWithMillis(),
          updatedAt: iso8601DateTimeWithMillis(),
        }),
        pagination: {
          page: like(1),
          limit: like(10),
          total: like(100),
          totalPages: like(10),
        },
      },
    },
  },

  login: {
    state: 'user credentials are valid',
    uponReceiving: 'a login request',
    withRequest: {
      method: 'POST',
      path: '/api/auth/login',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email: like('user@example.com'),
        password: like('password123'),
        rememberMe: like(false),
      },
    },
    willRespondWith: {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        token: term({
          matcher: '[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+',
          generate: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        }),
        refreshToken: like('refresh_token_123'),
        user: {
          id: like('123'),
          email: like('user@example.com'),
          firstName: like('John'),
          lastName: like('Doe'),
          role: like('user'),
          status: like('active'),
          createdAt: iso8601DateTimeWithMillis(),
          updatedAt: iso8601DateTimeWithMillis(),
        },
        expiresIn: like(3600),
      },
    },
  },
};

// Helper function to validate responses against schemas
export function validateUserResponse(response: any): boolean {
  try {
    UserResponseSchema.parse(response);
    return true;
  } catch (error) {
    console.error('User response validation failed:', error);
    return false;
  }
}

export function validateLoginResponse(response: any): boolean {
  try {
    LoginResponseSchema.parse(response);
    return true;
  } catch (error) {
    console.error('Login response validation failed:', error);
    return false;
  }
}
