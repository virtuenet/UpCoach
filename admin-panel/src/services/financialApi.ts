import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000/api';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin/finance`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const financialApi = {
  // Dashboard
  getDashboard: async (period: string = 'monthly') => {
    const response = await apiClient.get('/dashboard', { params: { period } });
    return response.data.data;
  },

  // MRR
  getMRRBreakdown: async () => {
    const response = await apiClient.get('/mrr');
    return response.data.data;
  },

  // P&L
  getProfitLoss: async (startDate: string, endDate: string) => {
    const response = await apiClient.get('/profit-loss', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  // Costs
  getCostBreakdown: async (startDate: string, endDate: string) => {
    const response = await apiClient.get('/costs', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  // Subscriptions
  getSubscriptionMetrics: async () => {
    const response = await apiClient.get('/subscriptions');
    return response.data.data;
  },

  // Forecast
  getRevenueForecast: async (months: number = 6) => {
    const response = await apiClient.get('/forecast', { params: { months } });
    return response.data.data;
  },

  // Cohort Analysis
  getCohortAnalysis: async (cohortMonth: string) => {
    const response = await apiClient.get('/cohort', { params: { cohortMonth } });
    return response.data.data;
  },

  // Generate Snapshot
  generateSnapshot: async (type: string = 'daily') => {
    const response = await apiClient.post('/snapshot', { type });
    return response.data.data;
  },
}; 