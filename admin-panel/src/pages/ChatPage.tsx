import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../components/LoadingSpinner';
import { chatApi } from '../api/chat';

interface ChatConversation {
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

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

export default function ChatPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['admin-conversations', searchTerm],
    queryFn: () => chatApi.getConversations({ search: searchTerm }),
  });

  const { data: messages } = useQuery({
    queryKey: ['conversation-messages', selectedConversation],
    queryFn: () =>
      selectedConversation ? chatApi.getConversationMessages(selectedConversation) : null,
    enabled: !!selectedConversation,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">AI Chat Monitoring</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor AI conversations and user interactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto h-80">
            {conversations?.map((conversation: ChatConversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === conversation.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {conversation.user.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {conversation.user.fullName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{conversation.user.email}</div>
                    <div className="text-xs text-gray-600 truncate mt-1">
                      {conversation.lastMessage}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {conversation.messageCount} messages
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(conversation.lastMessageAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages View */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          {selectedConversation ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Conversation Messages</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages?.map((message: ChatMessage) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                        <span className="text-xs opacity-75">
                          {message.sender === 'user' ? 'User' : 'AI Coach'}
                        </span>
                      </div>
                      <div className="text-sm">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-primary-100' : 'text-gray-500'
                        }`}
                      >
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
