/**
 * MSW mock handlers
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const handlers = [
  // Auth endpoints
  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        token: 'mock-token',
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
        },
      })
    );
  }),

  rest.post(`${API_URL}/auth/register`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        message: 'Registration successful',
      })
    );
  }),

  rest.post(`${API_URL}/auth/logout`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Logged out successfully',
      })
    );
  }),

  // User endpoints
  rest.get(`${API_URL}/users/me`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
      })
    );
  }),

  rest.get(`${API_URL}/users`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
        },
      })
    );
  }),

  // Content endpoints
  rest.get(`${API_URL}/content`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
        },
      })
    );
  }),

  rest.post(`${API_URL}/content`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          id: '789',
          title: 'New Content',
          status: 'draft',
        },
      })
    );
  }),

  // Goals endpoints
  rest.get(`${API_URL}/goals`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [],
      })
    );
  }),

  // Tasks endpoints
  rest.get(`${API_URL}/tasks`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [],
      })
    );
  }),

  // Chat endpoints
  rest.post(`${API_URL}/chat/messages`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          id: 'msg-123',
          content: 'AI response',
          role: 'assistant',
        },
      })
    );
  }),

  // Financial endpoints
  rest.get(`${API_URL}/financial/dashboard`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          revenue: 0,
          mrr: 0,
          activeUsers: 0,
        },
      })
    );
  }),
];

// Setup mock server
export const server = setupServer(...handlers);

// Helper to add custom handlers
export const addHandler = (handler: any) => {
  server.use(handler);
};

// Helper to reset handlers
export const resetHandlers = () => {
  server.resetHandlers();
};
