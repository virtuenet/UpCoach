import { apiClient } from '../api/client';

export interface DashboardMetrics {
  revenue: {
    mrr: number;
    mrrGrowth: number;
    arr: number;
    totalRevenue: number;
  };
  subscriptions: {
    active: number;
    new: number;
    churned: number;
    churnRate: number;
    netNew: number;
  };
  unitEconomics: {
    ltv: number;
    cac: number;
    ltvToCacRatio: number;
    arpu: number;
  };
  costs: {
    total: number;
    burnRate: number;
    runway: number;
  };
  profitLoss: {
    revenue: number;
    costs: number;
    grossProfit: number;
    margin: number;
  };
}

export interface ProfitLossStatement {
  revenue: {
    gross: number;
    refunds: number;
    net: number;
  };
  costs: {
    directCosts: number;
    operatingExpenses: number;
    byCategory: Record<string, number>;
    total: number;
  };
  profit: {
    gross: number;
    grossMargin: number;
    operating: number;
    operatingMargin: number;
    net: number;
    netMargin: number;
  };
}

export interface CostTracking {
  id: string;
  category: string;
  type: string;
  provider?: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  isRecurring: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSnapshot {
  id: string;
  date: string;
  period: string;
  revenue: number;
  recurringRevenue: number;
  mrr: number;
  arr: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  activeCustomers: number;
  churnRate: number;
  avgRevenuePerUser: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  ltvToCacRatio: number;
}

export const financialApi = {
  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get('/financial/dashboard');
    return response.data;
  },

  async getRevenueMetrics(startDate?: string, endDate?: string) {
    const response = await apiClient.get('/financial/dashboard/revenue', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getSubscriptionMetrics() {
    const response = await apiClient.get('/financial/dashboard/subscriptions');
    return response.data;
  },

  async getCostMetrics(startDate?: string, endDate?: string) {
    const response = await apiClient.get('/financial/dashboard/costs', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // P&L Statement
  async getProfitLossStatement(startDate?: string, endDate?: string): Promise<ProfitLossStatement> {
    const response = await apiClient.get('/financial/pnl', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Revenue Analytics
  async getMRRMetrics() {
    const response = await apiClient.get('/financial/revenue/mrr');
    return response.data;
  },

  async getARRMetrics() {
    const response = await apiClient.get('/financial/revenue/arr');
    return response.data;
  },

  async getRevenueByPlan(startDate?: string, endDate?: string) {
    const response = await apiClient.get('/financial/revenue/by-plan', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getRevenueForecast(months: number = 6) {
    const response = await apiClient.get('/financial/revenue/forecast', {
      params: { months },
    });
    return response.data;
  },

  // Subscription Analytics
  async getSubscriptions(params?: {
    status?: string;
    plan?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/financial/subscriptions', { params });
    return response.data;
  },

  async getActiveSubscriptions() {
    const response = await apiClient.get('/financial/subscriptions/active');
    return response.data;
  },

  async getChurnAnalytics(months: number = 12) {
    const response = await apiClient.get('/financial/subscriptions/churn', {
      params: { months },
    });
    return response.data;
  },

  async getLTVAnalytics() {
    const response = await apiClient.get('/financial/subscriptions/ltv');
    return response.data;
  },

  // Cost Tracking
  async getCosts(params?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/financial/costs', { params });
    return response.data;
  },

  async createCost(data: Partial<CostTracking>) {
    const response = await apiClient.post('/financial/costs', data);
    return response.data;
  },

  async updateCost(id: string, data: Partial<CostTracking>) {
    const response = await apiClient.put(`/financial/costs/${id}`, data);
    return response.data;
  },

  async deleteCost(id: string) {
    await apiClient.delete(`/financial/costs/${id}`);
  },

  async getCostsByCategory(startDate?: string, endDate?: string) {
    const response = await apiClient.get('/financial/costs/by-category', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getCostOptimizationSuggestions() {
    const response = await apiClient.get('/financial/costs/optimization');
    return response.data;
  },

  // Financial Snapshots
  async getSnapshots(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await apiClient.get('/financial/snapshots', { params });
    return response.data;
  },

  async generateSnapshot(date?: string) {
    const response = await apiClient.post('/financial/snapshots/generate', { date });
    return response.data;
  },

  async getLatestSnapshot(period: string = 'daily') {
    const response = await apiClient.get('/financial/snapshots/latest', {
      params: { period },
    });
    return response.data;
  },

  // Reports
  async getReports(params?: { type?: string; status?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/financial/reports?${queryParams}`);
    return response.data;
  },

  async createReport(data: any) {
    const response = await apiClient.post('/financial/reports', data);
    return response.data;
  },

  async getReport(reportId: string) {
    const response = await apiClient.get(`/financial/reports/${reportId}`);
    return response.data;
  },

  async downloadReport(reportId: string) {
    const response = await apiClient.get(`/financial/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async sendReport(id: string, recipients: { email?: string[]; slack?: string[] }) {
    const response = await apiClient.post(`/api/financial/reports/${id}/send`, {
      recipients
    });
    return response.data;
  }
};