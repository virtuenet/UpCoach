import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { Goal } from '@upcoach/types';

export const GoalFactory = Factory<Goal>({
  define() {
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      title: faker.person.firstName(),
      description: faker.person.lastName(),
      targetDate: new Date(),
      category: 'personal',
      status: 'active',
      progress: 50,
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
});