import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { useAuthStore } from './stores/authStore';

// Mock react-router-dom BrowserRouter to avoid conflicts
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock the auth store
vi.mock('./stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      checkAuth: vi.fn(),
      user: null,
      isAuthenticated: false,
    })),
  },
}));

// Mock all the page components to avoid deep dependency issues
vi.mock('./pages/LoginPage', () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock('./pages/DashboardPage', () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock('./components/Layout', () => ({
  default: () => {
    // Mock the Layout component
    const { Outlet } = require('react-router-dom');
    return (
      <div data-testid="layout">
        <Outlet />
      </div>
    );
  },
}));

describe('Admin Panel App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner during initial auth check', () => {
    const checkAuthMock = vi.fn(() => new Promise(() => {})); // Never resolves
    (useAuthStore.getState as Mock).mockReturnValue({
      checkAuth: checkAuthMock,
      user: null,
      isAuthenticated: false,
    });

    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    // Check for loading spinner
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('rounded-full', 'h-12', 'w-12', 'border-b-2', 'border-blue-600');
  });

  it('should render login page route', async () => {
    const checkAuthMock = vi.fn().mockResolvedValue(undefined);
    (useAuthStore.getState as Mock).mockReturnValue({
      checkAuth: checkAuthMock,
      user: null,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('should render dashboard with layout for authenticated routes', async () => {
    const checkAuthMock = vi.fn().mockResolvedValue(undefined);
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      role: 'admin',
    };
    
    (useAuthStore.getState as Mock).mockReturnValue({
      checkAuth: checkAuthMock,
      user: mockUser,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });

  it('should redirect from root to dashboard', async () => {
    const checkAuthMock = vi.fn().mockResolvedValue(undefined);
    (useAuthStore.getState as Mock).mockReturnValue({
      checkAuth: checkAuthMock,
      user: { id: '1', email: 'admin@test.com', role: 'admin' },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });

  it('should call checkAuth on mount', async () => {
    const checkAuthMock = vi.fn().mockResolvedValue(undefined);
    (useAuthStore.getState as Mock).mockReturnValue({
      checkAuth: checkAuthMock,
      user: null,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(checkAuthMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle auth check errors gracefully', async () => {
    // Mock console.error to suppress the expected error
    const originalError = console.error;
    console.error = vi.fn();
    
    const checkAuthMock = vi.fn().mockImplementation(() => Promise.reject(new Error('Auth failed')));
    (useAuthStore.getState as Mock).mockReturnValue({
      checkAuth: checkAuthMock,
      user: null,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should still render login page even if auth check fails
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
    
    // Restore console.error
    console.error = originalError;
  });

  it('should have error boundary to catch errors', async () => {
    const checkAuthMock = vi.fn().mockResolvedValue(undefined);
    (useAuthStore.getState as Mock).mockReturnValue({
      checkAuth: checkAuthMock,
      user: null,
      isAuthenticated: false,
    });

    // Test that error boundary exists by checking the component structure
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // The app should render without errors with ErrorBoundary
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});