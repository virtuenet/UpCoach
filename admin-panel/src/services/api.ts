// Re-export all API modules for backward compatibility
export * from '../api/auth';
export * from '../api/chat';
export * from '../api/client';
export * from '../api/dashboard';
export * from '../api/goals';
export * from '../api/mood';
export * from '../api/settings';
export * from '../api/tasks';
export { usersApi, type GetUsersParams } from '../api/users';
export type { User as AuthUser } from '../api/auth';
export * from './financialApi';

// Export the default api client
export { apiClient as default } from '../api/client';
