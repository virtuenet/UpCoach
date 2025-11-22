/**
 * Enhanced Test Setup for Admin Panel
 *
 * Provides comprehensive test utilities including:
 * - Component testing with React Testing Library
 * - Mock providers and contexts
 * - API mocking with MSW
 * - Accessibility testing
 * - Performance testing
 * - Custom matchers and helpers
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { I18nextProvider } from 'react-i18next';
import { AxiosResponse } from 'axios';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

import { theme } from '../theme';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { createTestI18n } from './i18n';
import { mockApiHandlers } from './api-mocks';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Setup MSW server for API mocking
export const server = setupServer(...mockApiHandlers);

// Test configuration
export const testConfig = {
  // API configuration
  apiBaseUrl: 'http://localhost:3000/api/v1',

  // Timeouts
  renderTimeout: 1000,
  apiTimeout: 5000,
  animationTimeout: 500,

  // Performance thresholds
  maxRenderTime: 100, // milliseconds
  maxReflowTime: 16, // 60fps

  // Accessibility standards
  axeConfig: {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'screen-reader': { enabled: true },
    },
  },
} as const;

// Create test query client
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Mock data factories
export const mockUser = {
  id: 'test-user-123',
  email: 'admin@upcoach.ai',
  firstName: 'Test',
  lastName: 'Admin',
  role: 'admin' as const,
  permissions: ['read', 'write', 'delete'],
  avatar: 'https://example.com/avatar.jpg',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  updateProfile: jest.fn(),
};

// Test providers wrapper
interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
  authContext?: Partial<typeof mockAuthContext>;
  theme?: any;
}

export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  queryClient = createTestQueryClient(),
  initialRoute = '/',
  authContext = mockAuthContext,
  theme: testTheme = theme,
}) => {
  // Set initial route for React Router
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={testTheme}>
          <CssBaseline />
          <I18nextProvider i18n={createTestI18n()}>
            <AuthProvider value={authContext}>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AuthProvider>
          </I18nextProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Enhanced render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
  authContext?: Partial<typeof mockAuthContext>;
  theme?: any;
  measurePerformance?: boolean;
}

export interface CustomRenderResult extends RenderResult {
  queryClient: QueryClient;
  performanceMetrics?: {
    renderTime: number;
    componentCount: number;
    reRenderCount: number;
  };
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): CustomRenderResult => {
  const {
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    authContext = mockAuthContext,
    theme: testTheme = theme,
    measurePerformance = false,
    ...renderOptions
  } = options;

  const startTime = measurePerformance ? performance.now() : 0;

  const result = render(ui, {
    wrapper: ({ children }) => (
      <TestProviders
        queryClient={queryClient}
        initialRoute={initialRoute}
        authContext={authContext}
        theme={testTheme}
      >
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });

  const renderTime = measurePerformance ? performance.now() - startTime : 0;

  return {
    ...result,
    queryClient,
    ...(measurePerformance && {
      performanceMetrics: {
        renderTime,
        componentCount: result.container.querySelectorAll('*').length,
        reRenderCount: 1,
      },
    }),
  };
};

// Accessibility testing helper
export const runAxeTest = async (container: HTMLElement) => {
  const results = await axe(container, testConfig.axeConfig);
  expect(results).toHaveNoViolations();
  return results;
};

// Performance testing helpers
export class PerformanceProfiler {
  private startTime: number = 0;
  private measurements: Array<{ name: string; duration: number }> = [];

  start(name: string) {
    this.startTime = performance.now();
  }

  end(name: string) {
    if (this.startTime > 0) {
      const duration = performance.now() - this.startTime;
      this.measurements.push({ name, duration });
      this.startTime = 0;
      return duration;
    }
    return 0;
  }

  getMeasurements() {
    return [...this.measurements];
  }

  clear() {
    this.measurements = [];
  }

  expectRenderTimeUnder(threshold: number) {
    const renderMeasurement = this.measurements.find(m => m.name.includes('render'));
    if (renderMeasurement) {
      expect(renderMeasurement.duration).toBeLessThan(threshold);
    }
  }
}

export const createPerformanceProfiler = () => new PerformanceProfiler();

// Form testing utilities
export const fillFormField = async (
  getByLabelText: any,
  label: string,
  value: string
) => {
  const field = getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.type(field, value);
  return field;
};

export const submitForm = async (getByRole: any, submitText = 'Submit') => {
  const submitButton = getByRole('button', { name: submitText });
  await userEvent.click(submitButton);
  return submitButton;
};

// API testing utilities
export const waitForApiCall = async (endpoint: string, method = 'GET') => {
  return new Promise((resolve) => {
    server.events.on('request:match', (req) => {
      if (req.url.pathname.includes(endpoint) && req.method === method) {
        resolve(req);
      }
    });
  });
};

export const mockApiResponse = <T = any>(
  endpoint: string,
  response: T,
  status = 200,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) => {
  server.use(
    rest[method.toLowerCase() as keyof typeof rest](
      `${testConfig.apiBaseUrl}${endpoint}`,
      (req, res, ctx) => {
        return res(ctx.status(status), ctx.json(response));
      }
    )
  );
};

export const mockApiError = (
  endpoint: string,
  error: { message: string; code?: string },
  status = 500,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) => {
  server.use(
    rest[method.toLowerCase() as keyof typeof rest](
      `${testConfig.apiBaseUrl}${endpoint}`,
      (req, res, ctx) => {
        return res(ctx.status(status), ctx.json(error));
      }
    )
  );
};

// Navigation testing helpers
export const navigateToRoute = (route: string) => {
  window.history.pushState({}, 'Test page', route);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export const expectCurrentRoute = (expectedRoute: string) => {
  expect(window.location.pathname).toBe(expectedRoute);
};

// Data table testing utilities
export const expectTableToHaveRows = (table: HTMLElement, count: number) => {
  const rows = table.querySelectorAll('tbody tr');
  expect(rows).toHaveLength(count);
};

export const expectTableToHaveColumn = (table: HTMLElement, columnName: string) => {
  const headerCells = table.querySelectorAll('thead th');
  const hasColumn = Array.from(headerCells).some(cell =>
    cell.textContent?.includes(columnName)
  );
  expect(hasColumn).toBe(true);
};

export const getTableCellByRowAndColumn = (
  table: HTMLElement,
  rowIndex: number,
  columnIndex: number
) => {
  const rows = table.querySelectorAll('tbody tr');
  const cells = rows[rowIndex]?.querySelectorAll('td');
  return cells?.[columnIndex];
};

// Modal/Dialog testing utilities
export const expectModalToBeOpen = (modalTitle: string) => {
  const modal = screen.getByRole('dialog', { name: modalTitle });
  expect(modal).toBeInTheDocument();
  expect(modal).toBeVisible();
};

export const expectModalToBeClosed = (modalTitle: string) => {
  const modal = screen.queryByRole('dialog', { name: modalTitle });
  expect(modal).not.toBeInTheDocument();
};

export const closeModal = async (getByRole: any) => {
  const closeButton = getByRole('button', { name: /close|cancel/i });
  await userEvent.click(closeButton);
};

// Chart testing utilities (for dashboard components)
export const expectChartToRender = (chartContainer: HTMLElement) => {
  // Assuming charts render SVG elements
  const svgElements = chartContainer.querySelectorAll('svg');
  expect(svgElements.length).toBeGreaterThan(0);
};

export const expectChartToHaveData = (chartContainer: HTMLElement, minDataPoints = 1) => {
  // This would need to be customized based on your charting library
  const dataElements = chartContainer.querySelectorAll('[data-testid*="chart-data"]');
  expect(dataElements.length).toBeGreaterThanOrEqual(minDataPoints);
};

// Notification testing utilities
export const expectNotificationToShow = async (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  const notification = await screen.findByText(message);
  expect(notification).toBeInTheDocument();

  // Check for type-specific styling or attributes
  const notificationContainer = notification.closest('[role="alert"]');
  expect(notificationContainer).toHaveClass(`notification-${type}`);
};

// Loading state testing utilities
export const expectLoadingState = () => {
  const loadingIndicators = screen.getAllByTestId(/loading|spinner|skeleton/i);
  expect(loadingIndicators.length).toBeGreaterThan(0);
};

export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    const loadingIndicators = screen.queryAllByTestId(/loading|spinner|skeleton/i);
    expect(loadingIndicators).toHaveLength(0);
  });
};

// Search and filter testing utilities
export const performSearch = async (searchTerm: string, searchInputLabel = 'Search') => {
  const searchInput = screen.getByLabelText(searchInputLabel);
  await userEvent.clear(searchInput);
  await userEvent.type(searchInput, searchTerm);

  // Wait for debounced search
  await waitFor(() => {
    expect(searchInput).toHaveValue(searchTerm);
  });
};

export const selectFilter = async (filterLabel: string, optionText: string) => {
  const filterSelect = screen.getByLabelText(filterLabel);
  await userEvent.click(filterSelect);

  const option = await screen.findByText(optionText);
  await userEvent.click(option);
};

// Custom test hooks for React hooks testing
export const renderHookWithProviders = <P, R>(
  hook: (props: P) => R,
  options: CustomRenderOptions = {}
) => {
  const { queryClient = createTestQueryClient(), ...rest } = options;

  return renderHook(hook, {
    wrapper: ({ children }) => (
      <TestProviders queryClient={queryClient} {...rest}>
        {children}
      </TestProviders>
    ),
  });
};

// Cleanup utilities
export const cleanupTest = () => {
  // Clear all mocks
  jest.clearAllMocks();

  // Clear query client cache
  queryClient.clear();

  // Reset MSW handlers
  server.resetHandlers();

  // Clear local storage
  localStorage.clear();
  sessionStorage.clear();

  // Reset window location
  window.history.replaceState({}, 'Test page', '/');
};

// Global test setup
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
  cleanupTest();
});

afterAll(() => {
  server.close();
});

// Re-export everything for convenience
export * from '@testing-library/react';
export * from '@testing-library/user-event';
export { default as userEvent } from '@testing-library/user-event';
export { screen, waitFor, act } from '@testing-library/react';
export { renderHook } from '@testing-library/react-hooks';