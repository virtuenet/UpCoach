import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import DashboardPage from './DashboardPage';
import type { DashboardData } from '../services/dashboardService';

const mockDashboardData: DashboardData = vi.hoisted(() => ({
  stats: {
    userStats: {
      totalUsers: 2100,
      activeUsers: 1680,
      growth: 12,
      newUsersToday: 45,
      newUsersThisWeek: 300,
      newUsersThisMonth: 1200,
    },
    contentStats: {
      totalContent: 520,
      pendingModeration: 18,
      moderationRate: 98,
      approvedToday: 14,
      rejectedToday: 2,
      trend: 3,
    },
    financialStats: {
      revenue: 12450,
      growth: 9,
      monthlyRecurringRevenue: 8900,
      averageRevenuePerUser: 5.9,
      churnRate: 3.1,
    },
    securityStats: {
      alerts: 4,
      resolved: 96,
      trend: 2,
      criticalAlerts: 1,
      lastSecurityScan: new Date().toISOString(),
    },
  },
  userGrowth: [
    { month: 'Jan', users: 1200, active: 950, growth: 5 },
    { month: 'Feb', users: 1350, active: 1080, growth: 8 },
  ],
  contentModeration: [
    { name: 'Approved', value: 85, color: '#4caf50' },
    { name: 'Pending', value: 10, color: '#ff9800' },
    { name: 'Rejected', value: 5, color: '#f44336' },
  ],
  recentActivities: [
    {
      id: 1,
      user: 'John Smith',
      action: 'Created new content',
      time: '2 minutes ago',
      severity: 'info',
    },
  ],
  systemHealth: {
    apiResponseTime: { value: 95, status: 'excellent', trend: 2 },
    databasePerformance: { value: 82, status: 'good', trend: -1 },
    serverUptime: { value: 99.9, status: 'excellent', upSince: new Date().toISOString() },
  },
  lastUpdated: new Date().toISOString(),
}));

const dashboardServiceMock = vi.hoisted(() => {
  return {
    getDashboardData: vi.fn().mockResolvedValue(mockDashboardData),
    enableAutoRefresh: vi.fn(),
    disableAutoRefresh: vi.fn(),
  };
});

vi.mock('../services/dashboardService', () => ({
  __esModule: true,
  default: dashboardServiceMock,
  dashboardService: dashboardServiceMock,
}));

vi.mock('../services/reportsService', () => ({
  triggerWeeklyDoc: vi.fn(),
  triggerWeeklySheet: vi.fn(),
}));

const theme = createTheme();
const queryClient = new QueryClient();

const renderDashboard = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <DashboardPage />
      </ThemeProvider>
    </QueryClientProvider>,
  );

describe('DashboardPage accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof ResizeObserver;
  });

  it('renders the primary heading and main landmark', async () => {
    renderDashboard();

    const heading = await screen.findByRole('heading', { level: 1, name: /system overview/i });
    const main = screen.getByRole('main');

    expect(heading).toBeInTheDocument();
    expect(main).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('keeps the refresh control keyboard accessible', async () => {
    const user = userEvent.setup();
    renderDashboard();

    const refreshButton = await screen.findByRole('button', { name: /refresh dashboard data/i });
    refreshButton.focus();

    expect(refreshButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(refreshButton).toHaveFocus();
  });

  it('announces recent activity updates via the log region', async () => {
    renderDashboard();

    const activityLog = await screen.findByRole('log', { name: /recent user activities/i });
    expect(activityLog).toHaveAttribute('aria-live', 'polite');
  });

  it('surfaces descriptive stats labels for screen readers', async () => {
    renderDashboard();

    const totalUsersLabel = await screen.findByText(/total users/i);
    const pendingLabel = screen.getByText(/pending moderation/i);
    const revenueLabel = screen.getByText(/monthly revenue/i);

    expect(totalUsersLabel).toBeVisible();
    expect(pendingLabel).toBeVisible();
    expect(revenueLabel).toBeVisible();
  });
});