/**
 * MSW mock handlers
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      token: 'mock-token',
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      },
    });
  }),

  http.post(`${API_URL}/auth/register`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Registration successful',
    }, { status: 201 });
  }),

  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  // User endpoints
  http.get(`${API_URL}/users/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
    });
  }),

  http.get(`${API_URL}/users`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
      },
    });
  }),

  // Content endpoints
  http.get(`${API_URL}/content`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
      },
    });
  }),

  http.post(`${API_URL}/content`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '789',
        title: 'New Content',
        status: 'draft',
      },
    }, { status: 201 });
  }),

  // Goals endpoints
  http.get(`${API_URL}/goals`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  // Tasks endpoints
  http.get(`${API_URL}/tasks`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  // Chat endpoints
  http.post(`${API_URL}/chat/messages`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'msg-123',
        content: 'AI response',
        role: 'assistant',
      },
    });
  }),

  // Financial endpoints
  http.get(`${API_URL}/financial/dashboard`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        revenue: 0,
        mrr: 0,
        activeUsers: 0,
      },
    });
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