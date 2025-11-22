const { Factory } = require('fishery') as any;
import { faker } from '../faker-fix';
import type { Goal } from '@upcoach/types';

export const GoalFactory = Factory.define(() => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  title: faker.lorem.words(4),
  description: faker.lorem.paragraph(),
  targetDate: faker.date.future(),
  category: 'personal',
  status: 'active',
  progress: faker.number.int({ min: 0, max: 100 }),
  milestones: [],
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent()
}));