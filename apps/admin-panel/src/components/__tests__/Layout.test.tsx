import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Layout from '../Layout';

const mockAuthState = { logout: vi.fn() };
const mockUseAuthStore = vi.fn(
  (selector?: (state: typeof mockAuthState) => unknown) => {
    if (selector) {
      return selector(mockAuthState);
    }
    return mockAuthState;
  },
);

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector?: (state: typeof mockAuthState) => unknown) =>
    mockUseAuthStore(selector),
}));

vi.mock('@upcoach/design-system', () => {
  const defaultNav = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/users' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Financial', path: '/financial' },
  ];

  return {
    Navigation: ({
      items = defaultNav,
      onNavigate,
      onLogout,
      currentPath,
    }: {
      items: Array<{ label: string; path: string }>;
      onNavigate: (path: string) => void;
      onLogout: () => void;
      currentPath: string;
    }) => (
      <nav aria-label="Main navigation">
        {items.map(item => (
          <a
            key={item.path}
            href={item.path}
            data-active={currentPath === item.path}
            onClick={event => {
              event.preventDefault();
              onNavigate(item.path);
            }}
          >
            {item.label}
          </a>
        ))}
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </nav>
    ),
    adminNavigation: defaultNav,
    generateBreadcrumbs: () => [{ label: 'Dashboard', path: '/dashboard' }],
  };
});

const renderWithRouter = (ui: React.ReactNode, initialPath = '/dashboard') =>
  render(<MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>);

describe('Layout', () => {
  beforeEach(() => {
    mockAuthState.logout = vi.fn();
    mockUseAuthStore.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation links and child content', () => {
    renderWithRouter(
      <Layout>
        <div data-testid="child-content">Hello world</div>
      </Layout>,
    );

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('marks the active link based on current route', () => {
    renderWithRouter(
      <Layout>
        <div />
      </Layout>,
      '/analytics',
    );

    expect(screen.getByRole('link', { name: 'Analytics' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveClass('active');
  });

  it('invokes logout from auth store when logout button is clicked', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <Layout>
        <div />
      </Layout>,
    );

    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
  });

  it('links point to expected routes', () => {
    renderWithRouter(
      <Layout>
        <div />
      </Layout>,
    );

    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users');
    expect(screen.getByRole('link', { name: 'Financial' })).toHaveAttribute('href', '/financial');
  });
});
