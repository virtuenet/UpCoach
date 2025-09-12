const { Factory } = require('fishery') as any;
import { faker } from '../faker-fix';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'coach' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const UserFactory = Factory.define(({ sequence, params }: { sequence: number; params: Partial<User> }) => ({
  id: params.id || faker.string.uuid(),
  email: params.email || faker.internet.email(),
  firstName: params.firstName || faker.person.firstName(),
  lastName: params.lastName || faker.person.lastName(),
  role: params.role || faker.helpers.arrayElement(['user', 'coach', 'admin']),
  status: params.status || 'active',
  avatar: params.avatar || faker.image.avatar(),
  bio: params.bio || faker.lorem.paragraph(),
  createdAt: params.createdAt || faker.date.past(),
  updatedAt: params.updatedAt || faker.date.recent(),
}));

// Specialized factories
export const AdminUserFactory = UserFactory.params({ role: 'admin' });
export const CoachUserFactory = UserFactory.params({ role: 'coach' });
export const RegularUserFactory = UserFactory.params({ role: 'user' });
export const SuspendedUserFactory = UserFactory.params({ status: 'suspended' });

// Helper functions
export function createTestUsers(count: number = 10): User[] {
  return UserFactory.buildList(count);
}

export function createTestUsersWithRoles(): {
  admin: User;
  coach: User;
  user: User;
} {
  return {
    admin: AdminUserFactory.build(),
    coach: CoachUserFactory.build(),
    user: RegularUserFactory.build(),
  };
}
