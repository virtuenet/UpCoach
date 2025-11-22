import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { PerformanceMonitor } from '../PerformanceMonitor';

const summaryResponse = {
  summary: {
    totalReports: 120,
    averageMetrics: {
      FCP: 1450,
      LCP: 2500,
      CLS: 0.08,
      FID: 80,
      TTFB: 650,
    },
    performanceScore: 92,
    issuesCount: 3,
    timeRange: '1h',
    pageBreakdown: [
      {
        page: '/dashboard',
        averageFCP: 1400,
        averageLCP: 2300,
        averageCLS: 0.05,
        sampleSize: 40,
      },
    ],
  },
};

const alertsResponse = {
  alerts: [
    { severity: 'high', message: 'High CPU usage detected' },
    { severity: 'medium', message: 'Database latency elevated' },
  ],
};

const resolved = (data: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
  } as Response);

describe('PerformanceMonitor', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/alerts')) {
        return resolved(alertsResponse);
      }
      return resolved(summaryResponse);
    });
    vi.spyOn(global, 'fetch').mockImplementation(fetchMock);
    vi
      .spyOn(global, 'setInterval')
      .mockImplementation(((handler: TimerHandler) => {
        if (typeof handler === 'function') {
          handler();
        }
        return 0 as unknown as NodeJS.Timeout;
      }) as typeof setInterval);
    vi
      .spyOn(global, 'clearInterval')
      .mockImplementation((() => undefined) as typeof clearInterval);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fetchMock.mockReset();
  });

  it('shows a loader before the summary renders', async () => {
    render(<PerformanceMonitor />);

    expect(screen.getByText(/loading performance data/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument(),
    );
    expect(screen.getByText('Performance Score')).toBeVisible();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('renders alert cards when the API returns alerts', async () => {
    render(<PerformanceMonitor />);

    await waitFor(() =>
      expect(screen.getByText(/high cpu usage detected/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/database latency elevated/i)).toBeInTheDocument();
  });

  it('allows manual refresh to re-fetch metrics', async () => {
    const user = userEvent.setup();
    render(<PerformanceMonitor />);

    await waitFor(() =>
      expect(screen.getByText('Performance Score')).toBeInTheDocument(),
    );
    fetchMock.mockClear();

    const refreshButton = screen.getAllByRole('button')[1];
    await user.click(refreshButton);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

