import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '../Layout';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

// Mock dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useNotifications');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/dashboard' })
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

const createWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const mockUser = {
  id: 'user-123',
  email: 'admin@upcoach.ai',
  name: 'Admin User',
  role: 'admin' as const,
  permissions: ['read:users', 'write:users', 'read:analytics']
};

const mockNotifications = [
  {
    id: 'notif-1',
    title: 'New User Registration',
    message: 'John Doe has registered',
    type: 'info' as const,
    read: false,
    createdAt: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: 'notif-2',
    title: 'System Alert',
    message: 'High CPU usage detected',
    type: 'warning' as const,
    read: false,
    createdAt: new Date('2024-01-01T09:00:00Z')
  }
];

const TestComponent = () => <div data-testid="test-content">Test Content</div>;

describe('Layout Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 2,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      isLoading: false
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render layout with navigation and content', () => {
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    // Check if main layout elements are present
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('should display user avatar and name in header', () => {
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@upcoach.ai')).toBeInTheDocument();
  });

  it('should show notification badge with unread count', () => {
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    expect(notificationButton).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Unread count badge
  });

  it('should open notifications dropdown when notification button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    await user.click(notificationButton);

    await waitFor(() => {
      expect(screen.getByText('New User Registration')).toBeInTheDocument();
      expect(screen.getByText('System Alert')).toBeInTheDocument();
    });
  });

  it('should mark notification as read when clicked', async () => {
    const mockMarkAsRead = jest.fn();
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 2,
      markAsRead: mockMarkAsRead,
      markAllAsRead: jest.fn(),
      isLoading: false
    });

    const user = userEvent.setup();
    
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    // Open notifications dropdown
    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    await user.click(notificationButton);

    // Click on first notification
    const firstNotification = screen.getByText('New User Registration');
    await user.click(firstNotification);

    expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('should mark all notifications as read', async () => {
    const mockMarkAllAsRead = jest.fn();
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 2,
      markAsRead: jest.fn(),
      markAllAsRead: mockMarkAllAsRead,
      isLoading: false
    });

    const user = userEvent.setup();
    
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    // Open notifications dropdown
    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    await user.click(notificationButton);

    // Click "Mark all as read" button
    const markAllButton = screen.getByRole('button', { name: /mark all as read/i });
    await user.click(markAllButton);

    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('should display navigation menu items based on user permissions', () => {
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    // Check if navigation items are visible based on permissions
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument(); // Has read:users permission
    expect(screen.getByText('Analytics')).toBeInTheDocument(); // Has read:analytics permission
  });

  it('should hide navigation items when user lacks permissions', () => {
    mockUseAuth.mockReturnValue({
      user: {
        ...mockUser,
        permissions: ['read:dashboard'] // Limited permissions
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });

  it('should toggle sidebar collapse on mobile', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    
    const user = userEvent.setup();
    
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(menuToggle);

    // Check if sidebar state changes
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toHaveClass('collapsed');
  });

  it('should handle logout when logout button is clicked', async () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: mockLogout,
      refreshToken: jest.fn()
    });

    const user = userEvent.setup();
    
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    // Open user dropdown
    const userMenuButton = screen.getByRole('button', { name: /admin user/i });
    await user.click(userMenuButton);

    // Click logout
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should show breadcrumbs for current page', () => {
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should display loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    // Tab through navigation items
    await user.tab();
    expect(screen.getByText('Dashboard')).toHaveFocus();

    await user.tab();
    expect(screen.getByText('Users')).toHaveFocus();

    // Press Enter on navigation item
    await user.keyboard('{Enter}');
    // Should navigate to the page (would be tested with router mocks)
  });

  it('should display error boundary when child component throws', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <Layout>
        <ThrowError />
      </Layout>,
      { wrapper: createWrapper }
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should refresh page when error boundary retry is clicked', async () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const mockReload = jest.fn();
    Object.defineProperty(window.location, 'reload', {
      writable: true,
      value: mockReload,
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <Layout>
        <ThrowError />
      </Layout>,
      { wrapper: createWrapper }
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    expect(mockReload).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle responsive design breakpoints', () => {
    // Test different viewport sizes
    const viewports = [
      { width: 1200, expectedClass: 'desktop' },
      { width: 768, expectedClass: 'tablet' },
      { width: 480, expectedClass: 'mobile' }
    ];

    viewports.forEach(({ width, expectedClass }) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });
      
      fireEvent(window, new Event('resize'));

      const { container } = render(
        <Layout>
          <TestComponent />
        </Layout>,
        { wrapper: createWrapper }
      );

      expect(container.firstChild).toHaveClass(expectedClass);
    });
  });

  it('should display correct theme toggle', async () => {
    const user = userEvent.setup();
    
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeToggle).toBeInTheDocument();

    await user.click(themeToggle);
    
    // Check if theme changes (would be mocked in real implementation)
    expect(document.documentElement).toHaveClass('dark');
  });

  it('should show search functionality in header', async () => {
    const user = userEvent.setup();
    
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();

    await user.type(searchInput, 'test query');
    expect(searchInput).toHaveValue('test query');
  });

  it('should handle accessibility requirements', () => {
    render(
      <Layout>
        <TestComponent />
      </Layout>,
      { wrapper: createWrapper }
    );

    // Check ARIA labels and roles
    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // Sidebar
    expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
    
    // Check skip link for screen readers
    expect(screen.getByText(/skip to main content/i)).toBeInTheDocument();
  });
});
