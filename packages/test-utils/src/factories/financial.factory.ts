const { Factory } = require('fishery') as any;
import { faker } from '../faker-fix';

export interface FinancialSnapshot {
  id: string;
  date: Date;
  mrr: number;
  arr: number;
  revenue: number;
  costs: number;
  profit: number;
  activeSubscriptions: number;
  churnRate: number;
  ltv: number;
  cac: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'subscription' | 'one-time';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripeId?: string;
  description: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete';
  plan: 'basic' | 'premium' | 'enterprise';
  amount: number;
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const FinancialSnapshotFactory = Factory.define(({ params }: { params: Partial<FinancialSnapshot> }) => {
  const revenue =
    params.revenue || faker.number.float({ min: 10000, max: 100000, fractionDigits: 2 });
  const costs =
    params.costs || revenue * faker.number.float({ min: 0.3, max: 0.7, fractionDigits: 2 });

  return {
    id: params.id || faker.string.uuid(),
    date: params.date || faker.date.recent({ days: 30 }),
    mrr: params.mrr || faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
    arr: params.arr || (params.mrr || 25000) * 12,
    revenue,
    costs,
    profit: revenue - costs,
    activeSubscriptions: params.activeSubscriptions || faker.number.int({ min: 100, max: 1000 }),
    churnRate: params.churnRate || faker.number.float({ min: 0.01, max: 0.1, fractionDigits: 3 }),
    ltv: params.ltv || faker.number.float({ min: 100, max: 1000, fractionDigits: 2 }),
    cac: params.cac || faker.number.float({ min: 20, max: 200, fractionDigits: 2 }),
    createdAt: params.createdAt || faker.date.recent(),
  };
});

export const TransactionFactory = Factory.define(({ params }: { params: Partial<Transaction> }) => ({
  id: params.id || faker.string.uuid(),
  userId: params.userId || faker.string.uuid(),
  amount: params.amount || faker.number.float({ min: 9.99, max: 299.99, fractionDigits: 2 }),
  currency: params.currency || 'USD',
  type:
    params.type || faker.helpers.arrayElement(['payment', 'refund', 'subscription', 'one-time']),
  status: params.status || 'completed',
  stripeId: params.stripeId || `pi_${faker.string.alphanumeric(24)}`,
  description: params.description || faker.commerce.productDescription(),
  metadata: params.metadata || {
    source: faker.helpers.arrayElement(['web', 'mobile', 'admin']),
    campaign: faker.helpers.arrayElement(['organic', 'referral', 'paid']),
  },
  createdAt: params.createdAt || faker.date.recent(),
}));

export const SubscriptionFactory = Factory.define(({ params }: { params: Partial<Subscription> }) => {
  const createdAt = params.createdAt || faker.date.past();
  const currentPeriodStart = params.currentPeriodStart || faker.date.recent({ days: 30 });
  const currentPeriodEnd =
    params.currentPeriodEnd || new Date(currentPeriodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    id: params.id || faker.string.uuid(),
    userId: params.userId || faker.string.uuid(),
    stripeSubscriptionId: params.stripeSubscriptionId || `sub_${faker.string.alphanumeric(24)}`,
    status:
      params.status || faker.helpers.arrayElement(['active', 'trialing', 'canceled', 'past_due']),
    plan: params.plan || faker.helpers.arrayElement(['basic', 'premium', 'enterprise']),
    amount: params.amount || faker.helpers.arrayElement([9.99, 29.99, 99.99]),
    currency: params.currency || 'USD',
    currentPeriodStart,
    currentPeriodEnd,
    canceledAt: params.status === 'canceled' ? faker.date.recent() : undefined,
    createdAt,
    updatedAt: params.updatedAt || faker.date.recent(),
  };
});

// Specialized factories
export const ActiveSubscriptionFactory = SubscriptionFactory.params({ status: 'active' });
export const TrialingSubscriptionFactory = SubscriptionFactory.params({ status: 'trialing' });
export const CanceledSubscriptionFactory = SubscriptionFactory.params({
  status: 'canceled',
  canceledAt: faker.date.recent(),
});

export const PaymentTransactionFactory = TransactionFactory.params({
  type: 'payment',
  status: 'completed',
});

export const RefundTransactionFactory = TransactionFactory.params({
  type: 'refund',
  status: 'completed',
});

// Helper functions
export function createMonthlySnapshots(months: number = 12): FinancialSnapshot[] {
  const snapshots: FinancialSnapshot[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mrr = 10000 + (months - i) * 1000; // Growing MRR

    snapshots.push(
      FinancialSnapshotFactory.build({
        date,
        mrr,
        arr: mrr * 12,
        activeSubscriptions: Math.floor(mrr / 30),
      })
    );
  }

  return snapshots;
}

export function createSubscriptionHistory(userId: string, months: number = 6): Subscription[] {
  const subscriptions: Subscription[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    subscriptions.push(
      SubscriptionFactory.build({
        userId,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        status: i === 0 ? 'active' : 'active',
      })
    );
  }

  return subscriptions;
}
