import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * User type definition
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'coach' | 'user';
  permissions: string[];
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Auth hook return type
 */
export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

/**
 * useAuth Hook
 *
 * Manages authentication state and provides auth-related functionality.
 * This hook handles:
 * - User session management
 * - Login/logout operations
 * - Token refresh
 * - Authentication status
 *
 * @returns {UseAuthReturn} Authentication state and methods
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * if (!isAuthenticated) {
 *   return <LoginPage onLogin={login} />;
 * }
 *
 * return <Dashboard user={user} onLogout={logout} />;
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  /**
   * Initialize auth state from localStorage on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Validate token and fetch user data
        const response = await fetch('/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('authToken');
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login function
   * Authenticates user with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      // Store token
      localStorage.setItem('authToken', data.token);

      // Set user data
      setUser(data.user);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  /**
   * Logout function
   * Clears user session and redirects to login
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      if (token) {
        // Notify backend of logout
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('authToken');
      setUser(null);
      setIsLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  /**
   * Refresh token function
   * Refreshes the authentication token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token to refresh');
      }

      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);

      // Optionally update user data if provided
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout the user
      await logout();
      throw error;
    }
  }, [logout]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
  };
}
