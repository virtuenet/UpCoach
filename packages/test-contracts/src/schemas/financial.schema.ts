import { z } from 'zod';

// Financial schemas for contract testing
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  type: z.enum(['payment', 'refund', 'subscription', 'payout']),
  status: z.enum(['pending', 'completed', 'failed', 'canceled']),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
  stripePaymentIntentId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  stripeSubscriptionId: z.string(),
  stripePriceId: z.string(),
  status: z.enum(['active', 'canceled', 'past_due', 'trialing', 'incomplete']),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  cancelAtPeriodEnd: z.boolean(),
  trialEnd: z.string().datetime().nullable(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const FinancialDashboardSchema = z.object({
  revenue: z.object({
    total: z.number().nonnegative(),
    monthly: z.number().nonnegative(),
    daily: z.number().nonnegative(),
    growth: z.number(),
  }),
  mrr: z.object({
    current: z.number().nonnegative(),
    previous: z.number().nonnegative(),
    growth: z.number(),
    churn: z.number(),
  }),
  subscriptions: z.object({
    active: z.number().int().nonnegative(),
    new: z.number().int().nonnegative(),
    canceled: z.number().int().nonnegative(),
    trial: z.number().int().nonnegative(),
  }),
  customers: z.object({
    total: z.number().int().nonnegative(),
    paying: z.number().int().nonnegative(),
    ltv: z.number().nonnegative(),
    cac: z.number().nonnegative(),
  }),
  transactions: z.array(TransactionSchema).max(10),
});

export const CreateSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  priceId: z.string(),
  paymentMethodId: z.string(),
  trialDays: z.number().int().nonnegative().optional(),
});

export const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  cancelAtPeriodEnd: z.boolean().default(true),
  reason: z.string().optional(),
});

export const RefundSchema = z.object({
  transactionId: z.string().uuid(),
  amount: z.number().positive().optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']),
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type FinancialDashboard = z.infer<typeof FinancialDashboardSchema>;
export type CreateSubscription = z.infer<typeof CreateSubscriptionSchema>;
export type CancelSubscription = z.infer<typeof CancelSubscriptionSchema>;
export type Refund = z.infer<typeof RefundSchema>;
