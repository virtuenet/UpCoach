/**
 * Test Data Factories
 *
 * Creates realistic test data for service-level tests.
 * These factories generate consistent, type-safe test data.
 */

import { faker } from '@faker-js/faker';

export class TestFactories {
  /**
   * Create a test user object
   */
  static createUser(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: faker.internet.password({ length: 12 }),
      role: 'user',
      emailVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create a test coach profile
   */
  static createCoachProfile(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      specialization: faker.helpers.arrayElement(['Life Coaching', 'Career Coaching', 'Fitness Coaching']),
      bio: faker.lorem.paragraph(),
      hourlyRate: faker.number.int({ min: 50, max: 300 }),
      rating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
      totalSessions: faker.number.int({ min: 0, max: 1000 }),
      isVerified: true,
      isActive: true,
      certifications: ['ICF Certified'],
      languages: ['English'],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create a test goal
   */
  static createGoal(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      category: faker.helpers.arrayElement(['fitness', 'career', 'learning', 'wellness']),
      status: 'active',
      progress: 0,
      priority: 'medium',
      isArchived: false,
      targetDate: faker.date.future(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create a test subscription
   */
  static createSubscription(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
      stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
      status: 'active',
      tier: 'premium',
      currentPeriodStart: new Date(),
      currentPeriodEnd: faker.date.future(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create a test coaching session
   */
  static createCoachingSession(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      coachId: faker.string.uuid(),
      clientId: faker.string.uuid(),
      scheduledStartTime: faker.date.future(),
      scheduledEndTime: faker.date.future(),
      status: 'scheduled',
      sessionType: 'video',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create a test transaction
   */
  static createTransaction(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
      currency: 'USD',
      type: 'subscription_payment',
      status: 'completed',
      stripePaymentIntentId: `pi_${faker.string.alphanumeric(14)}`,
      description: faker.lorem.sentence(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create user level data for gamification
   */
  static createUserLevel(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      level: 1,
      totalPoints: 0,
      currentLevelPoints: 0,
      pointsToNextLevel: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create achievement
   */
  static createAchievement(overrides?: Partial<any>) {
    return {
      id: faker.number.int({ min: 1, max: 100 }),
      name: faker.lorem.words(2),
      description: faker.lorem.sentence(),
      category: faker.helpers.arrayElement(['goals', 'coaching', 'onboarding', 'subscription']),
      points: faker.number.int({ min: 50, max: 500 }),
      icon: 'trophy',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }
}
