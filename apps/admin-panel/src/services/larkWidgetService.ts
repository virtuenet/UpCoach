/**
 * Lark Widget Service
 * Service for fetching Lark data for admin dashboard widgets
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ============================================================================
// Types
// ============================================================================

export interface CoachPipelineData {
  total: number;
  byStatus: Record<string, number>;
  pendingOnboarding: number;
  activeCoaches: number;
  averageRating: number;
  recentSignups: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    signupDate: string;
  }>;
}

export interface SupportTicketData {
  total: number;
  open: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  averageResolutionTime: number;
  recentTickets: Array<{
    id: string;
    subject: string;
    clientName: string;
    priority: string;
    status: string;
    createdAt: string;
  }>;
}

export interface PayoutData {
  pending: number;
  pendingAmount: number;
  approved: number;
  approvedAmount: number;
  paidThisMonth: number;
  paidAmountThisMonth: number;
  recentPayouts: Array<{
    id: string;
    coachName: string;
    amount: number;
    currency: string;
    status: string;
    periodEnd: string;
  }>;
}

export interface SessionData {
  todayTotal: number;
  completed: number;
  upcoming: number;
  noShow: number;
  sessions: Array<{
    id: string;
    coachName: string;
    clientName: string;
    scheduledAt: string;
    status: string;
    type: string;
  }>;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  actorName: string;
  actorType: string;
  description: string;
  occurredAt: string;
  importance: string;
}

export interface LarkSyncStatus {
  isConnected: boolean;
  lastSyncTime: string | null;
  isRunning: boolean;
  currentTable: string | null;
  progress: number;
  errors: Array<{
    table: string;
    error: string;
    timestamp: string;
  }>;
}

// ============================================================================
// API Functions
// ============================================================================

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Get coach pipeline data
 */
export async function getCoachPipelineData(): Promise<CoachPipelineData> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lark/widgets/coach-pipeline`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch coach pipeline data:', error);
    // Return mock data for development
    return {
      total: 0,
      byStatus: {},
      pendingOnboarding: 0,
      activeCoaches: 0,
      averageRating: 0,
      recentSignups: [],
    };
  }
}

/**
 * Get support ticket data
 */
export async function getSupportTicketData(): Promise<SupportTicketData> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lark/widgets/support-tickets`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch support ticket data:', error);
    return {
      total: 0,
      open: 0,
      byPriority: {},
      byCategory: {},
      averageResolutionTime: 0,
      recentTickets: [],
    };
  }
}

/**
 * Get payout data
 */
export async function getPayoutData(): Promise<PayoutData> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lark/widgets/payouts`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch payout data:', error);
    return {
      pending: 0,
      pendingAmount: 0,
      approved: 0,
      approvedAmount: 0,
      paidThisMonth: 0,
      paidAmountThisMonth: 0,
      recentPayouts: [],
    };
  }
}

/**
 * Get today's session data
 */
export async function getSessionData(): Promise<SessionData> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lark/widgets/sessions`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch session data:', error);
    return {
      todayTotal: 0,
      completed: 0,
      upcoming: 0,
      noShow: 0,
      sessions: [],
    };
  }
}

/**
 * Get activity feed
 */
export async function getActivityFeed(limit: number = 20): Promise<ActivityFeedItem[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lark/widgets/activity-feed`, {
      headers: getAuthHeaders(),
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    return [];
  }
}

/**
 * Get Lark sync status
 */
export async function getSyncStatus(): Promise<LarkSyncStatus> {
  try {
    const response = await axios.get(`${API_BASE_URL}/lark/sync/status`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch sync status:', error);
    return {
      isConnected: false,
      lastSyncTime: null,
      isRunning: false,
      currentTable: null,
      progress: 0,
      errors: [],
    };
  }
}

/**
 * Trigger manual sync
 */
export async function triggerSync(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await axios.post(`${API_BASE_URL}/lark/sync/trigger`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to trigger sync:', error);
    return { success: false, message: 'Failed to trigger sync' };
  }
}

/**
 * Deep link generators for Lark
 */
export const larkDeepLinks = {
  people: 'https://applink.larkoffice.com/client/people',
  approval: 'https://applink.larkoffice.com/client/approval',
  calendar: 'https://applink.larkoffice.com/client/calendar',
  task: 'https://applink.larkoffice.com/client/task',
  base: (appToken: string) => `https://applink.larkoffice.com/client/bitable/${appToken}`,
  chat: (chatId: string) => `https://applink.larkoffice.com/client/chat/open?chatId=${chatId}`,
};
