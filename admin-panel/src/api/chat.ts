import { apiClient } from './client';

export interface ChatConversation {
  id: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  messageCount: number;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export interface GetConversationsParams {
  search?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export const chatApi = {
  getConversations: async (params: GetConversationsParams = {}): Promise<ChatConversation[]> => {
    const response = await apiClient.get('/admin/chat/conversations', {
      params,
    });
    return response.data;
  },

  getConversationMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/admin/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  getChatStats: async (): Promise<{
    totalConversations: number;
    totalMessages: number;
    activeUsers: number;
    averageMessagesPerConversation: number;
  }> => {
    const response = await apiClient.get('/admin/chat/stats');
    return response.data;
  },
};
