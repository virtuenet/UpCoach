import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { Subscription } from '@upcoach/types';

export const SubscriptionFactory = Factory<Subscription>({
  define() {
    const now = new Date();
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      planId: faker.datatype.uuid(),
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent()
    };
  }
});