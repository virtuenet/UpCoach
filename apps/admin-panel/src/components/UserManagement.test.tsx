import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { UserManagement } from './UserManagement';
import { useUsers, useDeleteUser, useUpdateUser } from '../hooks/useUsers';

// Mock the hooks
vi.mock('../hooks/useUsers');

const mockUseUsers = vi.mocked(useUsers);
const mockUseDeleteUser = vi.mocked(useDeleteUser);
const mockUseUpdateUser = vi.mocked(useUpdateUser);

const mockUsers = [
  {
    id: '1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    subscription: {
      plan: 'premium',
      status: 'active',
      expiresAt: '2024-12-31T23:59:59Z'
    },
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-09-20T10:30:00Z'
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    isActive: false,
    subscription: {
      plan: 'basic',
      status: 'cancelled',
      expiresAt: '2024-09-30T23:59:59Z'
    },
    createdAt: '2024-02-01T00:00:00Z',
    lastLoginAt: '2024-09-15T14:20:00Z'
  }
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('UserManagement Component', () => {
  const mockDeleteUser = vi.fn();
  const mockUpdateUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseUsers.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    } as any);

    mockUseDeleteUser.mockReturnValue({
      mutate: mockDeleteUser,
      isLoading: false
    } as any);

    mockUseUpdateUser.mockReturnValue({
      mutate: mockUpdateUser,
      isLoading: false
    } as any);
  });

  it('should render user management table with users', () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    mockUseUsers.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn()
    } as any);

    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display error state', () => {
    const errorMessage = 'Failed to fetch users';
    mockUseUsers.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error(errorMessage),
      refetch: vi.fn()
    } as any);

    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should filter users by search term', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'john');

    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.queryByText('jane.smith@example.com')).not.toBeInTheDocument();
  });

  it('should filter users by subscription status', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    const statusFilter = screen.getByLabelText('Filter by status');
    await user.selectOptions(statusFilter, 'active');

    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.queryByText('jane.smith@example.com')).not.toBeInTheDocument();
  });

  it('should sort users by column', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    const emailHeader = screen.getByText('Email');
    await user.click(emailHeader);

    // Check if users are sorted alphabetically by email
    const userRows = screen.getAllByTestId('user-row');
    expect(userRows[0]).toHaveTextContent('jane.smith@example.com');
    expect(userRows[1]).toHaveTextContent('john.doe@example.com');
  });

  it('should toggle user active status', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    const toggleButton = screen.getAllByLabelText('Toggle user status')[0];
    await user.click(toggleButton);

    expect(mockUpdateUser).toHaveBeenCalledWith({
      userId: '1',
      data: { isActive: false }
    });
  });

  it('should open delete confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    const deleteButton = screen.getAllByLabelText('Delete user')[0];
    await user.click(deleteButton);

    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this user?')).toBeInTheDocument();
  });

  it('should delete user when confirmed', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    const deleteButton = screen.getAllByLabelText('Delete user')[0];
    await user.click(deleteButton);

    const confirmButton = screen.getByText('Delete');
    await user.click(confirmButton);

    expect(mockDeleteUser).toHaveBeenCalledWith('1');
  });

  it('should cancel user deletion', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    const deleteButton = screen.getAllByLabelText('Delete user')[0];
    await user.click(deleteButton);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
  });

  it('should display user subscription information', () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('should show last login date', () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('Sep 20, 2024')).toBeInTheDocument();
    expect(screen.getByText('Sep 15, 2024')).toBeInTheDocument();
  });

  it('should display pagination when there are many users', () => {
    const manyUsers = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      email: `user${i + 1}@example.com`,
      firstName: `User${i + 1}`,
      lastName: 'Test',
      isActive: true,
      subscription: {
        plan: 'basic',
        status: 'active',
        expiresAt: '2024-12-31T23:59:59Z'
      },
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-09-20T10:30:00Z'
    }));

    mockUseUsers.mockReturnValue({
      data: manyUsers,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    } as any);

    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  it('should open user details modal', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    const viewButton = screen.getAllByLabelText('View user details')[0];
    await user.click(viewButton);

    expect(screen.getByText('User Details')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('should export users data', async () => {
    const user = userEvent.setup();
    const mockDownload = vi.fn();

    // Mock URL.createObjectURL and download functionality
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock the download link click
    const mockLink = {
      click: mockDownload,
      href: '',
      download: '',
      style: { display: '' }
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    render(<UserManagement />, { wrapper: createWrapper() });

    const exportButton = screen.getByText('Export Users');
    await user.click(exportButton);

    expect(mockDownload).toHaveBeenCalled();
  });

  it('should handle bulk user actions', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    // Select multiple users
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // First user (excluding select all)
    await user.click(checkboxes[2]); // Second user

    expect(screen.getByText('2 users selected')).toBeInTheDocument();

    // Perform bulk action
    const bulkActionButton = screen.getByText('Bulk Actions');
    await user.click(bulkActionButton);

    const deactivateOption = screen.getByText('Deactivate Selected');
    await user.click(deactivateOption);

    expect(mockUpdateUser).toHaveBeenCalledTimes(2);
  });

  it('should refresh user list', async () => {
    const mockRefetch = vi.fn();
    mockUseUsers.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as any);

    const user = userEvent.setup();
    render(<UserManagement />, { wrapper: createWrapper() });

    const refreshButton = screen.getByLabelText('Refresh users');
    await user.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<UserManagement />, { wrapper: createWrapper() });

      expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Users table');
      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'Search users');
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Filter by status');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<UserManagement />, { wrapper: createWrapper() });

      const table = screen.getByRole('table');
      table.focus();

      // Test keyboard navigation through table rows
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toHaveAttribute('data-testid', 'user-row');
    });

    it('should announce status changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<UserManagement />, { wrapper: createWrapper() });

      const toggleButton = screen.getAllByLabelText('Toggle user status')[0];
      await user.click(toggleButton);

      expect(screen.getByRole('status')).toHaveTextContent('User status updated');
    });
  });

  describe('Error Handling', () => {
    it('should handle delete user error', async () => {
      const user = userEvent.setup();
      const mockDeleteError = vi.fn().mockRejectedValue(new Error('Delete failed'));

      mockUseDeleteUser.mockReturnValue({
        mutate: mockDeleteError,
        isLoading: false
      } as any);

      render(<UserManagement />, { wrapper: createWrapper() });

      const deleteButton = screen.getAllByLabelText('Delete user')[0];
      await user.click(deleteButton);

      const confirmButton = screen.getByText('Delete');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete user')).toBeInTheDocument();
      });
    });

    it('should handle update user error', async () => {
      const user = userEvent.setup();
      const mockUpdateError = vi.fn().mockRejectedValue(new Error('Update failed'));

      mockUseUpdateUser.mockReturnValue({
        mutate: mockUpdateError,
        isLoading: false
      } as any);

      render(<UserManagement />, { wrapper: createWrapper() });

      const toggleButton = screen.getAllByLabelText('Toggle user status')[0];
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update user')).toBeInTheDocument();
      });
    });
  });
});