/**
 * Test data factories
 */

import { faker } from './faker-fix';

// User factory
export const createUser = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: 'user',
  status: 'active',
  emailVerified: true,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Admin factory
export const createAdmin = (overrides: any = {}) => createUser({ role: 'admin', ...overrides });

// Coach factory
export const createCoach = (overrides: any = {}) =>
  createUser({
    role: 'coach',
    profile: {
      specializations: ['fitness', 'nutrition'],
      hourlyRate: faker.number.int({ min: 50, max: 200 }),
      rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
      ...(overrides.profile || {}),
    },
    ...overrides,
  });

// Content factory
export const createContent = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  type: faker.helpers.arrayElement(['article', 'guide', 'course', 'template']),
  title: faker.lorem.sentence(),
  slug: faker.lorem.slug(),
  content: faker.lorem.paragraphs(5),
  excerpt: faker.lorem.paragraph(),
  status: 'published',
  authorId: faker.string.uuid(),
  categoryId: faker.string.uuid(),
  viewCount: faker.number.int({ min: 0, max: 10000 }),
  likeCount: faker.number.int({ min: 0, max: 1000 }),
  publishedAt: faker.date.past(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Subscription factory
export const createSubscription = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  planId: faker.helpers.arrayElement(['basic', 'pro', 'enterprise']),
  status: 'active',
  stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
  currentPeriodStart: faker.date.recent(),
  currentPeriodEnd: faker.date.future(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Transaction factory
export const createTransaction = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  subscriptionId: faker.string.uuid(),
  amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
  currency: 'USD',
  status: 'succeeded',
  type: faker.helpers.arrayElement(['payment', 'refund', 'adjustment']),
  stripePaymentIntentId: `pi_${faker.string.alphanumeric(14)}`,
  createdAt: faker.date.past(),
  ...overrides,
});

// Goal factory
export const createGoal = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  targetDate: faker.date.future(),
  category: faker.helpers.arrayElement(['health', 'career', 'personal', 'financial']),
  status: faker.helpers.arrayElement(['active', 'completed', 'paused']),
  progress: faker.number.int({ min: 0, max: 100 }),
  milestones: [],
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Task factory
export const createTask = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  goalId: faker.string.uuid(),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  dueDate: faker.date.future(),
  priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
  status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed']),
  completedAt: null,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Chat message factory
export const createChatMessage = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  conversationId: faker.string.uuid(),
  userId: faker.string.uuid(),
  content: faker.lorem.paragraph(),
  role: faker.helpers.arrayElement(['user', 'assistant']),
  metadata: {},
  createdAt: faker.date.recent(),
  ...overrides,
});

// Analytics event factory
export const createAnalyticsEvent = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  eventName: faker.helpers.arrayElement(['page_view', 'button_click', 'form_submit']),
  eventProperties: {},
  timestamp: faker.date.recent(),
  ...overrides,
});

// Factory collections
export const factories = {
  user: createUser,
  admin: createAdmin,
  coach: createCoach,
  content: createContent,
  subscription: createSubscription,
  transaction: createTransaction,
  goal: createGoal,
  task: createTask,
  chatMessage: createChatMessage,
  analyticsEvent: createAnalyticsEvent,
};

// Batch creators
export const createUsers = (count = 10, overrides = {}) =>
  Array.from({ length: count }, () => createUser(overrides));

export const createContents = (count = 10, overrides = {}) =>
  Array.from({ length: count }, () => createContent(overrides));

export const createGoals = (count = 5, overrides = {}) =>
  Array.from({ length: count }, () => createGoal(overrides));

export const createTasks = (count = 10, overrides = {}) =>
  Array.from({ length: count }, () => createTask(overrides));
