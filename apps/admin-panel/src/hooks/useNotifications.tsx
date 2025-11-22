import { useState, useEffect, useCallback } from 'react';

/**
 * Notification type definition
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
  link?: string;
  actionLabel?: string;
}

/**
 * Notifications hook return type
 */
export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isLoading: boolean;
}

/**
 * useNotifications Hook
 *
 * Manages user notifications including:
 * - Fetching notifications from API
 * - Tracking unread count
 * - Marking notifications as read
 * - Real-time updates
 *
 * @returns {UseNotificationsReturn} Notifications state and methods
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
 *
 * return (
 *   <NotificationBadge count={unreadCount}>
 *     <NotificationList
 *       notifications={notifications}
 *       onMarkAsRead={markAsRead}
 *     />
 *   </NotificationBadge>
 * );
 * ```
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/v1/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  /**
   * Calculate unread count
   */
  const unreadCount = notifications.filter(notif => !notif.read).length;

  /**
   * Fetch notifications on mount
   */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Set up polling for new notifications (every 60 seconds)
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
  };
}
