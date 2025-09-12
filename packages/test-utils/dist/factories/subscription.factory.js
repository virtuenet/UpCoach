const { Factory } = require('fishery');
import { faker } from '../faker-fix';
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
//# sourceMappingURL=subscription.factory.js.map