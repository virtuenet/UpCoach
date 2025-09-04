import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

export const HabitFactory = Factory<any>({
  define() {
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      title: faker.lorem.words(3),
      frequency: 'daily',
      completionRate: faker.datatype.number({ min: 0, max: 100 })
    };
  }
});