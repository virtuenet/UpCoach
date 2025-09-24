import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { usePerformanceMetrics } from '../../hooks/usePerformanceMetrics';
import { useSystemHealth } from '../../hooks/useSystemHealth';

// Mock hooks
jest.mock('../../hooks/usePerformanceMetrics');
jest.mock('../../hooks/useSystemHealth');

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
    defaults: {
      plugins: {
        legend: {
          display: true
        }
      }
    }
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn()
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="performance-chart" data-chart-data={JSON.stringify(data)}>
      Chart Component
    </div>
  )
}));

const mockUsePerformanceMetrics = usePerformanceMetrics as jest.MockedFunction<typeof usePerformanceMetrics>;
const mockUseSystemHealth = useSystemHealth as jest.MockedFunction<typeof useSystemHealth>;

const createWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockPerformanceData = {
  cpu: {
    usage: 65.5,
    cores: 8,
    loadAverage: [2.1, 2.3, 2.0],
    history: [
      { timestamp: '2024-01-01T10:00:00Z', value: 60 },
      { timestamp: '2024-01-01T10:01:00Z', value: 65 },
      { timestamp: '2024-01-01T10:02:00Z', value: 70 }
    ]
  },
  memory: {
    used: 8589934592, // 8GB in bytes
    total: 17179869184, // 16GB in bytes
    percentage: 50,
    history: [
      { timestamp: '2024-01-01T10:00:00Z', value: 45 },
      { timestamp: '2024-01-01T10:01:00Z', value: 48 },
      { timestamp: '2024-01-01T10:02:00Z', value: 50 }
    ]
  },
  database: {
    connections: {
      active: 25,
      max: 100,
      percentage: 25
    },
    queries: {
      avgResponseTime: 120, // ms
      slowQueries: 3,
      queriesPerSecond: 450
    },
    cache: {
      hitRate: 85.5,
      missRate: 14.5
    }
  },
  api: {
    requests: {
      total: 15420,
      successful: 14876,
      failed: 544,
      successRate: 96.5
    },
    responseTime: {
      avg: 180, // ms
      p95: 350,
      p99: 800
    },
    endpoints: [
      { path: '/api/users', requests: 5000, avgResponseTime: 120 },
      { path: '/api/voice-journals', requests: 3500, avgResponseTime: 250 },
      { path: '/api/auth', requests: 2000, avgResponseTime: 80 }
    ]
  },
  redis: {
    connections: 15,
    memory: {
      used: 256000000, // 256MB
      peak: 512000000, // 512MB
      percentage: 50
    },
    operations: {
      gets: 25000,
      sets: 8000,
      deletes: 1200
    },
    hitRate: 92.3
  },
  alerts: [
    {
      id: 'alert-1',
      type: 'warning',
      message: 'High CPU usage detected',
      timestamp: '2024-01-01T10:00:00Z',
      acknowledged: false
    },
    {
      id: 'alert-2',
      type: 'info',
      message: 'Database backup completed',
      timestamp: '2024-01-01T09:30:00Z',
      acknowledged: true
    }
  ]
};

const mockSystemHealth = {
  status: 'healthy' as const,
  uptime: 86400000, // 24 hours in ms
  services: {
    api: { status: 'healthy', responseTime: 120 },
    database: { status: 'healthy', responseTime: 45 },
    redis: { status: 'healthy', responseTime: 12 },
    storage: { status: 'warning', responseTime: 350 }
  },
  lastChecked: '2024-01-01T10:02:00Z'
};

describe('PerformanceMonitor Component', () => {
  beforeEach(() => {
    mockUsePerformanceMetrics.mockReturnValue({
      data: mockPerformanceData,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    mockUseSystemHealth.mockReturnValue({
      data: mockSystemHealth,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render performance metrics dashboard', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText('Performance Monitor')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('Database Performance')).toBeInTheDocument();
    expect(screen.getByText('API Performance')).toBeInTheDocument();
  });

  it('should display CPU usage metrics correctly', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText('65.5%')).toBeInTheDocument(); // CPU usage
    expect(screen.getByText('8 cores')).toBeInTheDocument();
    expect(screen.getByText(/Load average/i)).toBeInTheDocument();
  });

  it('should display memory usage metrics correctly', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText('8.0 GB')).toBeInTheDocument(); // Used memory
    expect(screen.getByText('16.0 GB')).toBeInTheDocument(); // Total memory
    expect(screen.getByText('50%')).toBeInTheDocument(); // Memory percentage
  });

  it('should display database performance metrics', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText('25/100')).toBeInTheDocument(); // Active connections
    expect(screen.getByText('120ms')).toBeInTheDocument(); // Avg response time
    expect(screen.getByText('450')).toBeInTheDocument(); // Queries per second
    expect(screen.getByText('85.5%')).toBeInTheDocument(); // Cache hit rate
  });

  it('should display API performance metrics', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText('15,420')).toBeInTheDocument(); // Total requests
    expect(screen.getByText('96.5%')).toBeInTheDocument(); // Success rate
    expect(screen.getByText('180ms')).toBeInTheDocument(); // Avg response time
  });

  it('should display Redis metrics', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText('15')).toBeInTheDocument(); // Redis connections
    expect(screen.getByText('256 MB')).toBeInTheDocument(); // Redis memory
    expect(screen.getByText('92.3%')).toBeInTheDocument(); // Redis hit rate
  });

  it('should show system health status', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText(/24 hours/i)).toBeInTheDocument(); // Uptime
  });

  it('should display service health indicators', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Redis')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();

    // Check status indicators
    const healthyIndicators = screen.getAllByText('●').filter(
      el => el.className.includes('text-green')
    );
    expect(healthyIndicators).toHaveLength(3); // API, Database, Redis

    const warningIndicators = screen.getAllByText('●').filter(
      el => el.className.includes('text-yellow')
    );
    expect(warningIndicators).toHaveLength(1); // Storage
  });

  it('should display alerts section', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText('System Alerts')).toBeInTheDocument();
    expect(screen.getByText('High CPU usage detected')).toBeInTheDocument();
    expect(screen.getByText('Database backup completed')).toBeInTheDocument();
  });

  it('should allow acknowledging alerts', async () => {
    const user = userEvent.setup();
    
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    // Find unacknowledged alert
    const acknowledgeButton = screen.getByRole('button', { 
      name: /acknowledge alert.*high cpu usage/i 
    });
    
    await user.click(acknowledgeButton);

    // Verify alert is acknowledged (would trigger API call in real implementation)
    await waitFor(() => {
      expect(acknowledgeButton).toBeDisabled();
    });
  });

  it('should refresh metrics when refresh button is clicked', async () => {
    const mockRefetch = jest.fn();
    mockUsePerformanceMetrics.mockReturnValue({
      data: mockPerformanceData,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    });

    const user = userEvent.setup();
    
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle loading state', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    });

    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/loading performance data/i)).toBeInTheDocument();
  });

  it('should handle error state', () => {
    mockUsePerformanceMetrics.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch performance data'),
      refetch: jest.fn()
    });

    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText(/error loading performance data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should display performance charts', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    const charts = screen.getAllByTestId('performance-chart');
    expect(charts).toHaveLength(2); // CPU and Memory charts
  });

  it('should toggle between different time ranges', async () => {
    const user = userEvent.setup();
    
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    // Find time range selector
    const timeRangeSelect = screen.getByRole('combobox', { name: /time range/i });
    
    await user.selectOptions(timeRangeSelect, '24h');
    
    // Verify the selection changed
    expect(timeRangeSelect).toHaveValue('24h');
  });

  it('should export performance data', async () => {
    const mockCreateObjectURL = jest.fn();
    const mockRevokeObjectURL = jest.fn();
    
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    
    // Mock download behavior
    const mockClick = jest.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick
    };
    
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);

    const user = userEvent.setup();
    
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    const exportButton = screen.getByRole('button', { name: /export data/i });
    await user.click(exportButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it('should filter alerts by type', async () => {
    const user = userEvent.setup();
    
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    // Find alert filter
    const alertFilter = screen.getByRole('combobox', { name: /filter alerts/i });
    
    await user.selectOptions(alertFilter, 'warning');
    
    // Should only show warning alerts
    expect(screen.getByText('High CPU usage detected')).toBeInTheDocument();
    expect(screen.queryByText('Database backup completed')).not.toBeInTheDocument();
  });

  it('should display real-time updates indicator', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
    expect(screen.getByText(/live/i)).toBeInTheDocument();
  });

  it('should show performance thresholds and warnings', () => {
    // Mock data with high CPU usage
    const highCpuData = {
      ...mockPerformanceData,
      cpu: {
        ...mockPerformanceData.cpu,
        usage: 90 // High CPU usage
      }
    };

    mockUsePerformanceMetrics.mockReturnValue({
      data: highCpuData,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<PerformanceMonitor />, { wrapper: createWrapper });

    // Should show warning indicator for high CPU
    expect(screen.getByText('90%')).toBeInTheDocument();
    const cpuWarning = screen.getByRole('alert', { name: /high cpu usage/i });
    expect(cpuWarning).toBeInTheDocument();
  });

  it('should handle auto-refresh functionality', async () => {
    jest.useFakeTimers();
    
    const mockRefetch = jest.fn();
    mockUsePerformanceMetrics.mockReturnValue({
      data: mockPerformanceData,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    });

    render(<PerformanceMonitor />, { wrapper: createWrapper });

    // Fast-forward time to trigger auto-refresh
    act(() => {
      jest.advanceTimersByTime(30000); // 30 seconds
    });

    expect(mockRefetch).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  it('should be accessible with proper ARIA labels', () => {
    render(<PerformanceMonitor />, { wrapper: createWrapper });

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByLabelText(/cpu usage chart/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/memory usage chart/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /system alerts/i })).toBeInTheDocument();
  });
});
