import { jest } from '@jest/globals';

// Mock AIInteraction model
export const AIInteraction = {
  create: jest.fn().mockResolvedValue({
    id: 'interaction-' + Date.now(),
    userId: 'user-123',
    type: 'conversation',
    model: 'gpt-4',
    tokensUsed: 150,
    responseTime: 1.2,
    requestData: {},
    responseData: {},
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),

  findByPk: jest.fn().mockResolvedValue({
    id: 'interaction-123',
    userId: 'user-123',
    type: 'conversation',
    model: 'gpt-4',
    tokensUsed: 150,
    responseTime: 1.2,
    requestData: {},
    responseData: {},
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),

  findAll: jest.fn().mockResolvedValue([
    {
      id: 'interaction-1',
      userId: 'user-123',
      type: 'conversation',
      model: 'gpt-4',
      tokensUsed: 150,
      responseTime: 1.2,
    },
    {
      id: 'interaction-2',
      userId: 'user-123',
      type: 'recommendation',
      model: 'gpt-3.5',
      tokensUsed: 80,
      responseTime: 0.8,
    },
  ]),

  findOne: jest.fn().mockResolvedValue({
    id: 'interaction-123',
    userId: 'user-123',
    type: 'conversation',
    model: 'gpt-4',
    tokensUsed: 150,
    responseTime: 1.2,
    requestData: {},
    responseData: {},
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),

  update: jest.fn().mockResolvedValue([1, []]), // Returns [affected rows, affected records]

  destroy: jest.fn().mockResolvedValue(1), // Returns number of destroyed rows

  count: jest.fn().mockResolvedValue(42),

  sum: jest.fn().mockResolvedValue(1250), // For summing tokens, etc.

  build: jest.fn().mockImplementation((values) => ({
    ...values,
    id: values.id || 'interaction-new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    save: jest.fn().mockResolvedValue(values),
  })),
};