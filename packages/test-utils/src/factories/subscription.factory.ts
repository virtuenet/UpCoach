const { Factory } = require('fishery') as any;
import { faker } from '../faker-fix';
import type { Subscription } from '@upcoach/types';

export const SubscriptionFactory = Factory.define(() => {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    planId: faker.string.uuid(),
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
  };
});