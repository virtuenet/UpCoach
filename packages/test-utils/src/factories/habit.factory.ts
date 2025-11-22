const { Factory } = require('fishery') as any;
import { faker } from '../faker-fix';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: string;
  completionRate: number;
}

export const HabitFactory = Factory.define(() => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  title: faker.lorem.words(3),
  frequency: 'daily',
  completionRate: faker.number.int({ min: 0, max: 100 })
}));