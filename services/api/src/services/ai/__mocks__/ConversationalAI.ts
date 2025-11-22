import { jest } from '@jest/globals';

export const conversationalAI = {
  processConversation: jest.fn().mockResolvedValue({
    response: 'Here are some personalized tips for improving productivity...',
    conversationId: 'conv-123',
    suggestions: ['Try the Pomodoro technique', 'Set clear daily goals'],
    sentiment: 'positive',
    confidence: 0.92,
  }),

  generateSmartResponse: jest.fn().mockResolvedValue({
    response: 'It\'s normal to feel unmotivated sometimes...',
    tone: 'encouraging',
    alternatives: [
      'Remember that motivation comes and goes...',
      'Let\'s break this down into smaller steps...',
    ],
  }),

  analyzeIntent: jest.fn().mockResolvedValue({
    intent: 'seeking_advice',
    confidence: 0.88,
    entities: ['productivity', 'motivation'],
    suggestedAction: 'provide_guidance',
  }),

  generateFollowUp: jest.fn().mockResolvedValue({
    questions: [
      'What specific area would you like to focus on?',
      'How much time do you have available?',
    ],
    context: 'productivity_improvement',
  }),

  summarizeConversation: jest.fn().mockResolvedValue({
    summary: 'User discussed productivity challenges and received personalized advice',
    keyPoints: ['Time management', 'Goal setting', 'Motivation strategies'],
    actionItems: ['Implement Pomodoro technique', 'Set daily goals'],
  }),

  detectEmotion: jest.fn().mockResolvedValue({
    primary: 'anxious',
    secondary: 'hopeful',
    confidence: 0.78,
    recommendation: 'Provide reassurance and practical steps',
  }),
};