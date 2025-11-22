import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import App from './App';

const createAuthState = () => ({
  isAuthenticated: false,
  initializeAuth: vi.fn(),
  logout: vi.fn(),
  clearError: vi.fn(),
});

let mockAuthState = createAuthState();

const mockUseAuthStore = vi.fn(
  (selector?: (state: typeof mockAuthState) => unknown) => {
    if (selector) {
      return selector(mockAuthState);
    }
    return mockAuthState;
  },
);

vi.mock('./stores/authStore', () => ({
  useAuthStore: (selector?: (state: typeof mockAuthState) => unknown) =>
    mockUseAuthStore(selector),
}));

vi.mock('./services/brandingService', () => ({
  fetchOrgBranding: vi.fn().mockResolvedValue({
    primaryColor: '#123456',
    secondaryColor: '#abcdef',
    fontFamily: 'Inter',
  }),
}));

describe('Admin Panel App', () => {
  beforeEach(() => {
    mockAuthState = createAuthState();
    mockUseAuthStore.mockClear();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(container).toBeTruthy();
    expect(mockAuthState.initializeAuth).toHaveBeenCalled();
  });
});