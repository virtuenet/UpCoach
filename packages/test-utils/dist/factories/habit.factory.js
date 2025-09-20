const { Factory } = require('fishery');
import { faker } from '../faker-fix';
export const HabitFactory = Factory.define(() => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title: faker.lorem.words(3),
    frequency: 'daily',
    completionRate: faker.number.int({ min: 0, max: 100 })
}));
//# sourceMappingURL=habit.factory.js.map