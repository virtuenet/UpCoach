import { jest } from '@jest/globals';

export const adaptiveLearning = {
  // Method expected by tests
  createLearningPath: jest.fn().mockImplementation((userId, options) => {
    // Handle both old test signature and new implementation
    let topic, level, duration;

    if (typeof options === 'object' && options !== null) {
      topic = options.topic;
      level = options.level;
      duration = options.duration;
    }

    return Promise.resolve({
      id: 'path-123',
      userId,
      topic: topic || 'Leadership Skills',
      modules: [
        { id: 'mod-1', title: 'Communication Basics', duration: '2 weeks', completed: false },
        { id: 'mod-2', title: 'Team Management', duration: '3 weeks', completed: false },
        { id: 'mod-3', title: 'Decision Making', duration: '3 weeks', completed: false },
      ],
      totalDuration: duration || '8 weeks',
      difficulty: level || 'intermediate',
      progress: 0,
      createdAt: new Date().toISOString(),
    });
  }),

  // Method used by actual implementation
  createPersonalizedLearningPath: jest.fn().mockImplementation((userId, goalId, options) => {
    return Promise.resolve({
      id: 'path-123',
      userId,
      goalId,
      topic: options?.topic || 'Leadership Skills',
      modules: [
        { id: 'mod-1', title: 'Communication Basics', duration: '2 weeks', completed: false },
        { id: 'mod-2', title: 'Team Management', duration: '3 weeks', completed: false },
        { id: 'mod-3', title: 'Decision Making', duration: '3 weeks', completed: false },
      ],
      totalDuration: options?.duration || '8 weeks',
      difficulty: options?.level || 'intermediate',
      progress: 0,
      createdAt: new Date().toISOString(),
    });
  }),

  getLearningPaths: jest.fn().mockResolvedValue([
    {
      id: 'path-123',
      topic: 'Leadership Skills',
      progress: 33,
      status: 'in_progress',
      nextModule: 'mod-2',
    },
    {
      id: 'path-456',
      topic: 'Time Management',
      progress: 100,
      status: 'completed',
    },
  ]),

  trackLearningProgress: jest.fn().mockResolvedValue({
    success: true,
    updatedProgress: 45,
    milestone: 'Module 2 Started',
    nextRecommendation: 'Complete video lesson on delegation',
  }),

  getRecommendedNextModule: jest.fn().mockResolvedValue({
    moduleId: 'mod-2',
    title: 'Team Management',
    reason: 'Based on your completion of Communication Basics',
    estimatedTime: '45 minutes',
    difficulty: 'intermediate',
  }),

  adaptDifficulty: jest.fn().mockResolvedValue({
    newDifficulty: 'intermediate',
    reason: 'Performance indicates current level is appropriate',
    confidence: 0.82,
  }),

  generateQuiz: jest.fn().mockResolvedValue({
    questions: [
      {
        id: 'q1',
        question: 'What is the key to effective delegation?',
        options: ['Trust', 'Control', 'Speed', 'Perfection'],
        correctAnswer: 0,
      },
    ],
    passingScore: 70,
    timeLimit: 600,
  }),

  assessKnowledge: jest.fn().mockResolvedValue({
    score: 85,
    strengths: ['Communication', 'Planning'],
    weaknesses: ['Delegation'],
    recommendations: ['Review delegation techniques', 'Practice with small tasks'],
  }),
};