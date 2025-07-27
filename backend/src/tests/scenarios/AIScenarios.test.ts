import { AIService } from '../../services/ai/AIService';
import { UserProfilingService } from '../../services/ai/UserProfilingService';
import { RecommendationEngine } from '../../services/ai/RecommendationEngine';
import { PredictiveAnalytics } from '../../services/ai/PredictiveAnalytics';
import { VoiceAI } from '../../services/ai/VoiceAI';
import { InsightGenerator } from '../../services/ai/InsightGenerator';
import { sequelize } from '../../config/database';
import { User } from '../../models/User';
import { UserProfile } from '../../models/UserProfile';
import { Goal } from '../../models/Goal';
import { Task } from '../../models/Task';
import { Mood } from '../../models/Mood';

// Mock external APIs
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('AI Coaching Scenarios', () => {
  let testUser: any;
  let aiService: AIService;
  let userProfilingService: UserProfilingService;
  let recommendationEngine: RecommendationEngine;
  let predictiveAnalytics: PredictiveAnalytics;
  let voiceAI: VoiceAI;
  let insightGenerator: InsightGenerator;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Initialize services
    aiService = new AIService();
    userProfilingService = new UserProfilingService();
    recommendationEngine = new RecommendationEngine();
    predictiveAnalytics = new PredictiveAnalytics();
    voiceAI = new VoiceAI();
    insightGenerator = new InsightGenerator();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      id: 'scenario-user-123',
      email: 'john@example.com',
      name: 'John Doe',
      password: 'hashedpassword'
    });
  });

  afterEach(async () => {
    await Mood.destroy({ where: {} });
    await Task.destroy({ where: {} });
    await Goal.destroy({ where: {} });
    await UserProfile.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('Scenario 1: New User Onboarding', () => {
    test('AI creates personalized profile and initial recommendations', async () => {
      // Step 1: Create user profile
      const profile = await userProfilingService.createOrUpdateProfile(testUser.id);
      
      expect(profile).toBeDefined();
      expect(profile.userId).toBe(testUser.id);
      expect(profile.learningStyle).toBe('balanced');
      
      // Step 2: Generate onboarding recommendations
      jest.spyOn(aiService, 'generateStructuredResponse').mockResolvedValue({
        recommendations: [
          {
            title: 'Set Your First Goal',
            description: 'Start with one achievable goal',
            reason: 'Building momentum is key for new users'
          },
          {
            title: 'Try Voice Journaling',
            description: 'Record your thoughts for 5 minutes',
            reason: 'Helps establish daily reflection habit'
          }
        ]
      });

      const recommendations = await recommendationEngine.generateRecommendations(
        testUser.id,
        ['goal', 'habit'],
        3
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].metadata.isOnboarding).toBe(true);
    });

    test('AI adapts communication style based on initial interactions', async () => {
      // User expresses preference for direct communication
      const messages = [
        { role: 'user' as const, content: 'Just tell me what to do, no fluff' }
      ];

      jest.spyOn(aiService, 'generateResponse').mockResolvedValue({
        content: 'Got it. Here\'s your action plan: 1) Set one goal today. 2) Track it daily. 3) Review weekly.',
        provider: 'openai',
        model: 'gpt-4',
        usage: { totalTokens: 100 }
      });

      const response = await aiService.generateResponse(messages, {
        personality: 'direct'
      });

      // Update profile based on preference
      await userProfilingService.updatePreferences(testUser.id, {
        communicationStyle: 'direct'
      });

      const profile = await userProfilingService.getUserProfile(testUser.id);
      expect(profile?.preferences.communicationStyle).toBe('direct');
    });
  });

  describe('Scenario 2: Struggling User Support', () => {
    beforeEach(async () => {
      // Create profile with poor metrics
      await UserProfile.create({
        userId: testUser.id,
        learningStyle: 'visual',
        communicationPreference: 'supportive',
        profileMetrics: {
          streakDays: 0,
          goalsCompleted: 0,
          averageSessionsPerWeek: 0.5
        },
        behaviorPatterns: {
          averageMoodScore: 3.5,
          consistencyScore: 20
        }
      });

      // Create low mood entries
      for (let i = 0; i < 7; i++) {
        await Mood.create({
          userId: testUser.id,
          moodValue: Math.floor(Math.random() * 3) + 2, // 2-4
          note: 'Feeling unmotivated',
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        });
      }
    });

    test('AI detects struggling pattern and provides intervention', async () => {
      // Analyze user state
      const riskAssessment = await predictiveAnalytics.predictChurnRisk(testUser.id);
      
      expect(riskAssessment.riskLevel).toBe('high');
      expect(riskAssessment.riskScore).toBeGreaterThan(0.7);
      
      // Generate intervention plan
      const interventionPlan = await predictiveAnalytics.generateInterventionPlan(
        testUser.id,
        'high_churn_risk'
      );

      expect(interventionPlan.strategies).toContain('simplify');
      expect(interventionPlan.immediateActions.length).toBeGreaterThan(0);
      expect(interventionPlan.supportLevel).toBe('high');
    });

    test('AI provides empathetic support and micro-goals', async () => {
      jest.spyOn(aiService, 'generateResponse').mockResolvedValue({
        content: 'I notice you\'ve been having a tough week. Let\'s start small - just 5 minutes today. You\'ve got this!',
        provider: 'openai',
        model: 'gpt-4',
        usage: { totalTokens: 100 }
      });

      const messages = [
        { role: 'user' as const, content: 'I can\'t seem to stick to anything' }
      ];

      const response = await aiService.generateResponse(messages, {
        personality: 'empathetic',
        context: {
          userMood: 'low',
          recentStruggle: true
        }
      });

      expect(response.content).toContain('small');
      
      // Generate micro-recommendations
      jest.spyOn(aiService, 'generateStructuredResponse').mockResolvedValue({
        recommendations: [
          {
            title: 'One Minute Win',
            description: 'Do one push-up or write one sentence',
            reason: 'Building momentum with tiny wins'
          }
        ]
      });

      const recommendations = await recommendationEngine.generateRecommendations(
        testUser.id,
        ['habit'],
        1
      );

      expect(recommendations[0].difficulty).toBe('easy');
      expect(recommendations[0].estimatedTime).toBeLessThan(5);
    });
  });

  describe('Scenario 3: High Achiever Optimization', () => {
    beforeEach(async () => {
      // Create high-performing profile
      await UserProfile.create({
        userId: testUser.id,
        learningStyle: 'kinesthetic',
        communicationPreference: 'analytical',
        profileMetrics: {
          streakDays: 90,
          goalsCompleted: 15,
          averageSessionsPerWeek: 6
        },
        behaviorPatterns: {
          averageMoodScore: 8.5,
          consistencyScore: 95,
          goalCompletionRate: 85
        }
      });

      // Create completed goals
      for (let i = 0; i < 5; i++) {
        await Goal.create({
          userId: testUser.id,
          title: `Goal ${i + 1}`,
          category: 'productivity',
          status: 'completed',
          progress: 100
        });
      }
    });

    test('AI provides advanced challenges and optimization strategies', async () => {
      const readinessAssessment = await userProfilingService.assessReadiness(testUser.id);
      
      expect(readinessAssessment.overallReadiness).toBeGreaterThan(85);
      expect(readinessAssessment.readyForAdvanced).toBe(true);

      // Generate advanced recommendations
      jest.spyOn(aiService, 'generateStructuredResponse').mockResolvedValue({
        recommendations: [
          {
            title: 'Implement Deep Work Sessions',
            description: '90-minute focused work blocks',
            reason: 'You\'re ready for advanced productivity techniques'
          },
          {
            title: 'Mentor Others',
            description: 'Share your success strategies',
            reason: 'Teaching reinforces your own habits'
          }
        ]
      });

      const recommendations = await recommendationEngine.generateRecommendations(
        testUser.id,
        ['goal', 'habit']
      );

      const advancedRecs = recommendations.filter(r => r.difficulty === 'hard');
      expect(advancedRecs.length).toBeGreaterThan(0);
    });

    test('AI identifies optimization opportunities', async () => {
      const insights = await insightGenerator.generateInsightReport(testUser.id);
      
      const optimizationInsights = insights.insights.filter(
        i => i.type === 'opportunity'
      );
      
      expect(optimizationInsights.length).toBeGreaterThan(0);
      expect(insights.summary.potentialGrowthAreas).toBeDefined();
    });
  });

  describe('Scenario 4: Voice Journal Analysis', () => {
    test('AI analyzes voice patterns for emotional insights', async () => {
      const mockAudioBuffer = Buffer.from('mock-audio-data');
      
      // Mock transcription
      jest.spyOn(voiceAI as any, 'transcribeAudio').mockResolvedValue(
        'I had a really productive day today. Finished my project ahead of schedule!'
      );

      const analysis = await voiceAI.analyzeVoice(testUser.id, mockAudioBuffer, {
        sessionType: 'reflection'
      });

      expect(analysis.transcription).toBeDefined();
      expect(analysis.sentiment.overall).toBe('positive');
      expect(analysis.insights.emotionalState).toBe('confident');
      expect(analysis.keyThemes).toContain('productivity');
    });

    test('AI tracks voice patterns over time', async () => {
      // Mock multiple voice sessions
      const sessions = [
        { sentiment: 'neutral', energy: 'low', date: new Date('2024-01-01') },
        { sentiment: 'positive', energy: 'medium', date: new Date('2024-01-02') },
        { sentiment: 'positive', energy: 'high', date: new Date('2024-01-03') }
      ];

      // Create mock voice analysis data
      for (const session of sessions) {
        await voiceAI.saveAnalysis(testUser.id, {
          transcription: 'Mock transcription',
          sentiment: { overall: session.sentiment as any, score: 0.7 },
          speechPatterns: { pace: 'normal', volume: 'medium', pauses: 'few' },
          insights: { emotionalState: session.energy, confidence: 0.8 },
          keyThemes: []
        } as any);
      }

      const summary = await voiceAI.getVoiceInsightSummary(testUser.id, 7);
      
      expect(summary.trend).toBe('improving');
      expect(summary.averageSentiment).toBeGreaterThan(0.5);
      expect(summary.insights).toContain('positive trend');
    });
  });

  describe('Scenario 5: Adaptive Learning Path', () => {
    test('AI creates personalized learning path based on goals', async () => {
      // Create a goal
      const goal = await Goal.create({
        userId: testUser.id,
        title: 'Become a better public speaker',
        category: 'professional',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });

      // Mock AI response for learning path
      jest.spyOn(aiService, 'generateStructuredResponse').mockResolvedValue({
        modules: [
          {
            id: 'mod1',
            title: 'Overcoming Speech Anxiety',
            duration: 7,
            activities: ['breathing exercises', 'visualization']
          },
          {
            id: 'mod2',
            title: 'Voice and Body Language',
            duration: 14,
            activities: ['voice exercises', 'posture practice']
          }
        ]
      });

      const learningPath = await (predictiveAnalytics as any).adaptiveLearning.createPersonalizedLearningPath(
        testUser.id,
        goal.id
      );

      expect(learningPath.modules.length).toBeGreaterThan(0);
      expect(learningPath.estimatedDuration).toBeGreaterThan(0);
      expect(learningPath.adaptationType).toBe('goal-based');
    });

    test('AI adapts learning path based on progress', async () => {
      // Simulate progress tracking
      const progress = {
        moduleId: 'mod1',
        completed: true,
        performance: 85,
        timeSpent: 450 // minutes
      };

      // Mock adaptation logic
      const adaptedPath = await (predictiveAnalytics as any).adaptiveLearning.adaptLearningPath(
        testUser.id,
        'path123',
        progress
      );

      expect(adaptedPath.nextModule).toBeDefined();
      expect(adaptedPath.difficultyAdjustment).toBe('increase');
      expect(adaptedPath.recommendedPace).toBe('accelerated');
    });
  });

  describe('Scenario 6: Predictive Goal Success', () => {
    test('AI predicts goal completion probability', async () => {
      const goal = await Goal.create({
        userId: testUser.id,
        title: 'Run a marathon',
        category: 'fitness',
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        progress: 20
      });

      // Create historical data
      await Task.bulkCreate([
        { goalId: goal.id, userId: testUser.id, title: 'Run 5k', status: 'completed' },
        { goalId: goal.id, userId: testUser.id, title: 'Run 10k', status: 'in_progress' }
      ]);

      const prediction = await predictiveAnalytics.predictGoalCompletion(goal.id);

      expect(prediction.probability).toBeDefined();
      expect(prediction.estimatedCompletionDate).toBeDefined();
      expect(prediction.requiredWeeklyProgress).toBeGreaterThan(0);
      expect(prediction.obstacles).toBeDefined();
      expect(prediction.accelerators).toBeDefined();
    });

    test('AI provides early warning for at-risk goals', async () => {
      const goal = await Goal.create({
        userId: testUser.id,
        title: 'Learn Spanish',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        progress: 10 // Low progress with approaching deadline
      });

      const riskAnalysis = await predictiveAnalytics.analyzeGoalRisk(goal.id);

      expect(riskAnalysis.isAtRisk).toBe(true);
      expect(riskAnalysis.interventionNeeded).toBe(true);
      expect(riskAnalysis.suggestedActions.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario 7: Holistic Insight Generation', () => {
    test('AI generates comprehensive monthly insights', async () => {
      // Create diverse user data
      await Promise.all([
        // Goals
        Goal.create({
          userId: testUser.id,
          title: 'Fitness goal',
          category: 'health',
          progress: 75,
          status: 'active'
        }),
        // Moods
        ...Array(30).fill(null).map((_, i) => 
          Mood.create({
            userId: testUser.id,
            moodValue: 6 + Math.floor(Math.random() * 4),
            createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          })
        )
      ]);

      const monthlyReport = await insightGenerator.generateInsightReport(
        testUser.id,
        { days: 30 }
      );

      expect(monthlyReport.insights.length).toBeGreaterThan(0);
      expect(monthlyReport.summary).toBeDefined();
      expect(monthlyReport.summary.overallProgress).toBeDefined();
      expect(monthlyReport.keyAchievements).toBeDefined();
      expect(monthlyReport.recommendations).toBeDefined();
      
      // Check insight categories
      const insightTypes = new Set(monthlyReport.insights.map(i => i.type));
      expect(insightTypes.size).toBeGreaterThan(2); // Multiple insight types
    });
  });
});