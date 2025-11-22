import { jest } from '@jest/globals';

export const voiceAI = {
  analyzeVoice: jest.fn().mockImplementation((userId, audioData, options) => {
    // Handle both test format (with audioFile in body) and implementation format (with buffer)
    return Promise.resolve({
      transcription: 'I feel really motivated today...',
      sentiment: { score: 0.85, label: 'positive' },
      emotionalTone: ['confident', 'enthusiastic'],
      keywords: ['motivated', 'goals', 'progress'],
      speechPatterns: {
        pace: 'moderate',
        clarity: 'high',
        confidence: 0.88,
        volume: 'normal',
      },
      userId,
      sessionId: 'voice-session-' + Date.now(),
      duration: options?.duration || 120,
      timestamp: new Date().toISOString(),
    });
  }),

  generateVoiceCoaching: jest.fn().mockResolvedValue({
    coaching: 'Your voice shows great confidence! Keep maintaining that positive energy.',
    suggestions: [
      'Try to slow down slightly when explaining complex topics',
      'Your enthusiasm is contagious - use it in team meetings',
    ],
    exercises: [
      { name: 'Breathing Exercise', duration: '5 minutes' },
      { name: 'Vocal Warmup', duration: '3 minutes' },
    ],
  }),

  getVoiceInsightSummary: jest.fn().mockResolvedValue({
    period: '30 days',
    sessions: 12,
    averageSentiment: { score: 0.72, trend: 'improving' },
    dominantEmotions: ['confident', 'focused', 'determined'],
    insights: [
      'Your confidence has increased by 15% over the past month',
      'Morning sessions show higher energy levels',
      'Consider more frequent check-ins during stressful periods',
    ],
    recommendations: [
      'Continue daily voice journaling',
      'Practice stress-reduction techniques before important calls',
    ],
  }),

  compareVoiceSessions: jest.fn().mockResolvedValue({
    session1: {
      id: 'session-1',
      date: '2024-01-10',
      sentiment: 0.65,
      mainEmotion: 'anxious',
    },
    session2: {
      id: 'session-2',
      date: '2024-01-15',
      sentiment: 0.82,
      mainEmotion: 'confident',
    },
    comparison: {
      sentimentChange: '+25.4%',
      emotionalShift: 'anxious → confident',
      improvements: ['clarity', 'pace', 'volume control'],
      insights: 'Significant improvement in emotional state and communication clarity',
    },
  }),

  transcribeAudio: jest.fn().mockResolvedValue({
    text: 'This is a transcribed text from the audio file',
    confidence: 0.94,
    language: 'en-US',
    duration: 45,
  }),

  analyzeSpeechPatterns: jest.fn().mockResolvedValue({
    fillerWords: { count: 3, percentage: 2.5 },
    pauseFrequency: 'normal',
    speakingRate: 145, // words per minute
    articulation: 'clear',
    suggestions: ['Reduce filler words for more impactful communication'],
  }),
};