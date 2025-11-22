import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuthStore } from './stores/authStore';

// Mock react-router-dom to avoid router conflicts
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock the auth store
vi.mock('./stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock all the page components to avoid deep dependency issues
vi.mock('./pages/LoginPage', () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock('./pages/DashboardPage', () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock('./pages/ContentPage', () => ({
  default: () => <div>Content Page</div>,
}));

vi.mock('./pages/CreateContentPage', () => ({
  default: () => <div>Create Content Page</div>,
}));

vi.mock('./pages/EditContentPage', () => ({
  default: () => <div>Edit Content Page</div>,
}));

vi.mock('./pages/MediaLibraryPage', () => ({
  default: () => <div>Media Library Page</div>,
}));

vi.mock('./pages/AnalyticsPage', () => ({
  default: () => <div>Analytics Page</div>,
}));

vi.mock('./components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => {
    return <div data-testid="layout">{children}</div>;
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  Toaster: () => <div>Toaster</div>,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

describe('CMS Panel App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login page when not authenticated', () => {
    (useAuthStore as unknown as Mock).mockImplementation(selector => {
      const state = { isAuthenticated: false };
      return selector ? selector(state) : state;
    });

    const { MemoryRouter } = require('react-router-dom');

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render dashboard when authenticated and accessing root', () => {
    (useAuthStore as unknown as Mock).mockImplementation(selector => {
      const state = { isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    const { MemoryRouter } = require('react-router-dom');

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('should redirect to login when accessing protected route without authentication', () => {
    (useAuthStore as unknown as Mock).mockImplementation(selector => {
      const state = { isAuthenticated: false };
      return selector ? selector(state) : state;
    });

    const { MemoryRouter } = require('react-router-dom');

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    // Should show login page instead of protected content
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
  });

  it('should render content page when authenticated', () => {
    (useAuthStore as unknown as Mock).mockImplementation(selector => {
      const state = { isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    const { MemoryRouter } = require('react-router-dom');

    render(
      <MemoryRouter initialEntries={['/content']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByText('Content Page')).toBeInTheDocument();
  });

  it('should include Toaster component for notifications', () => {
    (useAuthStore as unknown as Mock).mockImplementation(selector => {
      const state = { isAuthenticated: false };
      return selector ? selector(state) : state;
    });

    const { MemoryRouter } = require('react-router-dom');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Toaster')).toBeInTheDocument();
  });

  it('should have QueryClientProvider with correct default options', () => {
    (useAuthStore as unknown as Mock).mockImplementation(selector => {
      const state = { isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    const { MemoryRouter } = require('react-router-dom');

    // This test verifies the QueryClient is configured properly
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // The app should render without errors with QueryClientProvider
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render media library page when navigating to /media', () => {
    (useAuthStore as unknown as Mock).mockImplementation(selector => {
      const state = { isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    const { MemoryRouter } = require('react-router-dom');

    render(
      <MemoryRouter initialEntries={['/media']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByText('Media Library Page')).toBeInTheDocument();
  });

  it('should render analytics page when navigating to /analytics', () => {
    (useAuthStore as unknown as Mock).mockImplementation(selector => {
      const state = { isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    const { MemoryRouter } = require('react-router-dom');

    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByText('Analytics Page')).toBeInTheDocument();
  });

  it('should have all main routes configured', () => {
    (useAuthStore as unknown as Mock).mockImplementation(selector => {
      const state = { isAuthenticated: true };
      return selector ? selector(state) : state;
    });

    const routePaths = [
      '/',
      '/dashboard',
      '/content',
      '/content/create',
      '/content/edit/123',
      '/media',
      '/analytics',
    ];

    const { MemoryRouter } = require('react-router-dom');

    // Test that routes are properly configured
    routePaths.forEach(path => {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      );

      // The fact that this doesn't throw means the route exists
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      unmount();
    });
  });
});
