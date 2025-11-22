import { LucideIcon } from 'lucide-react';

// Financial Metrics Types
export interface FinancialMetrics {
  mrr: number;
  mrrChange: number;
  arr: number;
  arrChange: number;
  totalCustomers: number;
  customerChange: number;
  newCustomers: number;
  arpu: number;
  arpuChange: number;
  todayTransactions: number;
  alerts: AlertItem[];
  recentTransactions: Transaction[];
  ltvAnalysis: LTVAnalysis[];
}

export interface AlertItem {
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export interface Transaction {
  id: string;
  customer: string;
  type: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

export interface LTVAnalysis {
  segment: string;
  current: number;
  target: number;
}

// Revenue Analytics Types
export interface RevenueData {
  trend: RevenueDataPoint[];
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  subscriptions: number;
  transactions: number;
}

// Subscription Analytics Types
export interface SubscriptionData {
  distribution: SubscriptionDistribution[];
}

export interface SubscriptionDistribution {
  name: string;
  value: number;
}

// Retention Data Types
export interface RetentionData {
  monthly: RetentionDataPoint[];
}

export interface RetentionDataPoint {
  month: string;
  retention: number;
  churn: number;
}

// Metric Card Props
export interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  color: string;
  trend?: TrendDataPoint[];
  subtitle?: string;
  loading?: boolean;
}

export interface TrendDataPoint {
  day: number;
  value: number;
}