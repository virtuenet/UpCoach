import { UserProfile } from '../../models/UserProfile';
import { Goal } from '../../models/Goal';
// import { Task } from '../../models/Task';
import { logger } from '../../utils/logger';
import { aiService } from './AIService';
// import { predictiveAnalytics } from './PredictiveAnalytics';
// import { recommendationEngine } from './RecommendationEngine';

export interface LearningPath {
  id: string;
  userId: string;
  pathType: 'skill' | 'habit' | 'knowledge' | 'wellness';
  title: string;
  description: string;
  currentLevel: number; // 1-10
  targetLevel: number;
  modules: LearningModule[];
  estimatedDuration: number; // days
  adaptations: PathAdaptation[];
  progress: number; // 0-100
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  prerequisites: string[];
  content: ModuleContent[];
  assessments: Assessment[];
  completed: boolean;
  score?: number;
}

export interface ModuleContent {
  type: 'text' | 'video' | 'exercise' | 'reflection' | 'practice';
  content: string;
  duration: number;
  resources?: string[];
}

export interface Assessment {
  id: string;
  type: 'quiz' | 'practical' | 'reflection' | 'peer_review';
  questions: any[];
  passingScore: number;
  attempts: number;
  bestScore?: number;
}

export interface PathAdaptation {
  timestamp: Date;
  adaptationType: 'difficulty' | 'pace' | 'content' | 'style';
  reason: string;
  previousValue: any;
  newValue: any;
  impact: string;
}

export interface LearningStyle {
  visual: number;
  auditory: number;
  kinesthetic: number;
  reading: number;
}

export interface PerformanceMetrics {
  completionRate: number;
  averageScore: number;
  timeSpent: number;
  strugglingAreas: string[];
  strongAreas: string[];
  learningVelocity: number;
  retentionRate: number;
}

export class AdaptiveLearning {
  private learningPaths: Map<string, LearningPath[]>;
  private performanceHistory: Map<string, PerformanceMetrics[]>;

  constructor() {
    this.learningPaths = new Map();
    this.performanceHistory = new Map();
  }

  async createPersonalizedLearningPath(
    userId: string,
    goalId: string,
    options?: {
      preferredPace?: 'slow' | 'moderate' | 'fast';
      timeAvailable?: number; // minutes per day
      focusAreas?: string[];
    }
  ): Promise<LearningPath> {
    try {
      // Get user profile and goal
      const [profile, goal] = await Promise.all([
        UserProfile.findOne({ where: { userId } }),
        Goal.findByPk(goalId)
      ]);

      if (!profile || !goal) {
        throw new Error('User profile or goal not found');
      }

      // Analyze user's learning style and capabilities
      const learningAnalysis = await this.analyzeUserLearningProfile(userId, profile);
      
      // Generate initial learning path
      const basePath = await this.generateBaseLearningPath(goal, learningAnalysis);
      
      // Adapt path based on user preferences and constraints
      const adaptedPath = await this.adaptPathToUser(
        basePath,
        profile,
        learningAnalysis,
        options
      );

      // Store the learning path
      this.storeLearningPath(userId, adaptedPath);

      return adaptedPath;
    } catch (error) {
      logger.error('Error creating personalized learning path:', error);
      throw error;
    }
  }

  private async analyzeUserLearningProfile(
    userId: string,
    profile: UserProfile
  ): Promise<{
    learningStyle: LearningStyle;
    currentCapabilities: string[];
    preferredDifficulty: string;
    optimalSessionLength: number;
    bestLearningTimes: string[];
  }> {
    // Analyze historical performance
    const _performance = await this.getHistoricalPerformance(userId);
    
    // Determine learning style weights
    const learningStyle = this.calculateLearningStyle(profile, performance);
    
    // Assess current capabilities
    const capabilities = await this.assessCurrentCapabilities(userId);
    
    // Determine optimal difficulty
    const difficulty = this.determineOptimalDifficulty(performance, profile);
    
    // Calculate optimal session length
    const sessionLength = this.calculateOptimalSessionLength(profile, performance);
    
    // Identify best learning times
    const bestTimes = this.identifyBestLearningTimes(profile);

    return {
      learningStyle,
      currentCapabilities: capabilities,
      preferredDifficulty: difficulty,
      optimalSessionLength: sessionLength,
      bestLearningTimes: bestTimes
    };
  }

  private calculateLearningStyle(
    profile: UserProfile,
    performance: PerformanceMetrics[]
  ): LearningStyle {
    // Base learning style from profile
    const baseStyle = {
      visual: 0.25,
      auditory: 0.25,
      kinesthetic: 0.25,
      reading: 0.25
    };

    // Adjust based on profile preference
    switch (profile.learningStyle) {
      case 'visual':
        baseStyle.visual = 0.4;
        break;
      case 'auditory':
        baseStyle.auditory = 0.4;
        break;
      case 'kinesthetic':
        baseStyle.kinesthetic = 0.4;
        break;
      case 'reading':
        baseStyle.reading = 0.4;
        break;
    }

    // Normalize to ensure sum equals 1
    const total = Object.values(baseStyle).reduce((sum, val) => sum + val, 0);
    Object.keys(baseStyle).forEach(key => {
      baseStyle[key] = baseStyle[key] / total;
    });

    return baseStyle;
  }

  private async generateBaseLearningPath(
    goal: Goal,
    learningAnalysis: any
  ): Promise<LearningPath> {
    // Use AI to generate a comprehensive learning path
    const pathStructure = await this.generatePathStructureWithAI(goal, learningAnalysis);
    
    // Create modules based on the structure
    const modules = await this.createLearningModules(
      pathStructure,
      learningAnalysis.learningStyle,
      learningAnalysis.preferredDifficulty
    );

    const learningPath: LearningPath = {
      id: `path_${Date.now()}`,
      userId: goal.userId,
      pathType: this.determinePathType(goal),
      title: `Learning Path: ${goal.title}`,
      description: `Personalized path to achieve: ${goal.description}`,
      currentLevel: 1,
      targetLevel: 10,
      modules,
      estimatedDuration: this.estimatePathDuration(modules),
      adaptations: [],
      progress: 0
    };

    return learningPath;
  }

  private async generatePathStructureWithAI(
    goal: Goal,
    learningAnalysis: any
  ): Promise<any> {
    const prompt = `Create a structured learning path for this goal:
Goal: ${goal.title}
Description: ${goal.description}
User's preferred difficulty: ${learningAnalysis.preferredDifficulty}
Optimal session length: ${learningAnalysis.optimalSessionLength} minutes

Generate a JSON structure with:
- modules: array of learning modules (5-10 modules)
- each module should have:
  - title
  - objective
  - key_concepts (array)
  - difficulty_level (beginner/intermediate/advanced)
  - estimated_hours
  - prerequisites (array of module indices)
  - content_types (mix of: text, video, exercise, reflection, practice)

Ensure progressive difficulty and logical skill building.`;

    try {
      const response = await aiService.generateResponse([
        {
          role: 'system',
          content: 'You are an expert instructional designer. Create comprehensive, well-structured learning paths. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.6,
        maxTokens: 1500
      });

      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Error generating path structure with AI:', error);
      // Return a default structure
      return this.getDefaultPathStructure(goal);
    }
  }

  private async createLearningModules(
    pathStructure: any,
    learningStyle: LearningStyle,
    preferredDifficulty: string
  ): Promise<LearningModule[]> {
    const modules: LearningModule[] = [];

    for (const moduleData of pathStructure.modules) {
      const content = await this.generateModuleContent(
        moduleData,
        learningStyle
      );

      const assessments = this.createModuleAssessments(
        moduleData,
        preferredDifficulty
      );

      const module: LearningModule = {
        id: `module_${modules.length + 1}`,
        title: moduleData.title,
        description: moduleData.objective,
        difficulty: moduleData.difficulty_level || preferredDifficulty,
        estimatedTime: (moduleData.estimated_hours || 1) * 60,
        prerequisites: moduleData.prerequisites || [],
        content,
        assessments,
        completed: false
      };

      modules.push(module);
    }

    return modules;
  }

  private async generateModuleContent(
    moduleData: any,
    learningStyle: LearningStyle
  ): Promise<ModuleContent[]> {
    const content: ModuleContent[] = [];
    const contentTypes = moduleData.content_types || ['text', 'exercise', 'reflection'];

    // Adjust content mix based on learning style
    const contentMix = this.determineContentMix(learningStyle, contentTypes);

    for (const [type, weight] of Object.entries(contentMix)) {
      if (weight > 0.1) {
        const moduleContent = await this.createContentPiece(
          type as any,
          moduleData,
          weight
        );
        content.push(moduleContent);
      }
    }

    return content;
  }

  private determineContentMix(
    learningStyle: LearningStyle,
    availableTypes: string[]
  ): Record<string, number> {
    const mix: Record<string, number> = {};

    // Map learning styles to content types
    if (learningStyle.visual > 0.3) {
      mix.video = 0.3;
      mix.text = 0.2;
    }
    if (learningStyle.auditory > 0.3) {
      mix.video = 0.35;
      mix.practice = 0.15;
    }
    if (learningStyle.kinesthetic > 0.3) {
      mix.exercise = 0.4;
      mix.practice = 0.3;
    }
    if (learningStyle.reading > 0.3) {
      mix.text = 0.4;
      mix.reflection = 0.2;
    }

    // Add reflection for all
    mix.reflection = (mix.reflection || 0) + 0.1;

    // Filter to available types
    Object.keys(mix).forEach(type => {
      if (!availableTypes.includes(type)) {
        delete mix[type];
      }
    });

    // Normalize
    const total = Object.values(mix).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      Object.keys(mix).forEach(key => {
        mix[key] = mix[key] / total;
      });
    }

    return mix;
  }

  private async createContentPiece(
    type: 'text' | 'video' | 'exercise' | 'reflection' | 'practice',
    moduleData: any,
    weight: number
  ): Promise<ModuleContent> {
    const duration = Math.round(moduleData.estimated_hours * 60 * weight);

    const contentTemplates = {
      text: {
        content: `Read about ${moduleData.title}: Key concepts include ${moduleData.key_concepts?.join(', ') || 'core principles'}`,
        resources: ['Article link', 'PDF guide']
      },
      video: {
        content: `Watch: "${moduleData.title} Explained" - Visual guide to ${moduleData.objective}`,
        resources: ['Video tutorial', 'Supplementary animations']
      },
      exercise: {
        content: `Practice Exercise: Apply ${moduleData.title} concepts in a hands-on activity`,
        resources: ['Exercise worksheet', 'Solution guide']
      },
      reflection: {
        content: `Reflection: How does ${moduleData.title} apply to your personal goals? Journal your thoughts.`,
        resources: ['Reflection prompts', 'Journal template']
      },
      practice: {
        content: `Real-world Practice: Implement ${moduleData.title} in your daily routine`,
        resources: ['Practice checklist', 'Progress tracker']
      }
    };

    return {
      type,
      content: contentTemplates[type].content,
      duration,
      resources: contentTemplates[type].resources
    };
  }

  private createModuleAssessments(
    moduleData: any,
    preferredDifficulty: string
  ): Assessment[] {
    const assessments: Assessment[] = [];

    // Knowledge check
    assessments.push({
      id: `assess_knowledge_${Date.now()}`,
      type: 'quiz',
      questions: this.generateQuizQuestions(moduleData, preferredDifficulty),
      passingScore: 70,
      attempts: 0
    });

    // Practical application
    if (moduleData.difficulty_level !== 'beginner') {
      assessments.push({
        id: `assess_practical_${Date.now()}`,
        type: 'practical',
        questions: [{
          task: `Apply ${moduleData.title} concepts to solve a real problem`,
          rubric: ['Understanding', 'Application', 'Innovation']
        }],
        passingScore: 60,
        attempts: 0
      });
    }

    return assessments;
  }

  private generateQuizQuestions(moduleData: any, difficulty: string): any[] {
    const questionCount = difficulty === 'beginner' ? 3 : 
                         difficulty === 'intermediate' ? 5 : 7;

    const questions = [];
    for (let i = 0; i < questionCount; i++) {
      questions.push({
        question: `Question ${i + 1} about ${moduleData.title}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Explanation of the correct answer'
      });
    }

    return questions;
  }

  private async adaptPathToUser(
    basePath: LearningPath,
    profile: UserProfile,
    learningAnalysis: any,
    options?: any
  ): Promise<LearningPath> {
    const adaptedPath = { ...basePath };

    // Adapt pace
    if (options?.preferredPace) {
      adaptedPath.estimatedDuration = this.adjustDurationForPace(
        basePath.estimatedDuration,
        options.preferredPace
      );
    }

    // Adapt for time constraints
    if (options?.timeAvailable) {
      adaptedPath.modules = this.adjustModulesForTimeConstraints(
        basePath.modules,
        options.timeAvailable
      );
    }

    // Adapt difficulty progression
    adaptedPath.modules = this.optimizeDifficultyProgression(
      adaptedPath.modules,
      learningAnalysis.preferredDifficulty
    );

    // Record adaptations
    adaptedPath.adaptations.push({
      timestamp: new Date(),
      adaptationType: 'style' as const,
      reason: 'Personalized based on user profile',
      previousValue: 'base path',
      newValue: 'adapted path',
      impact: 'Optimized for user learning style and constraints'
    });

    return adaptedPath;
  }

  async adaptLearningPath(
    userId: string,
    pathId: string,
    performance: PerformanceMetrics
  ): Promise<LearningPath> {
    const userPaths = this.learningPaths.get(userId) || [];
    const path = userPaths.find(p => p.id === pathId);

    if (!path) {
      throw new Error('Learning path not found');
    }

    // Analyze performance and determine adaptations
    const adaptations = await this.determineAdaptations(path, performance);

    // Apply adaptations
    for (const adaptation of adaptations) {
      switch (adaptation.type) {
        case 'difficulty':
          this.adaptDifficulty(path, adaptation);
          break;
        case 'pace':
          this.adaptPace(path, adaptation);
          break;
        case 'content':
          await this.adaptContent(path, adaptation);
          break;
        case 'style':
          this.adaptStyle(path, adaptation);
          break;
      }

      // Record adaptation
      path.adaptations.push({
        timestamp: new Date(),
        adaptationType: adaptation.type,
        reason: adaptation.reason,
        previousValue: adaptation.previousValue,
        newValue: adaptation.newValue,
        impact: adaptation.expectedImpact
      });
    }

    // Update stored path
    this.storeLearningPath(userId, path);

    return path;
  }

  private async determineAdaptations(
    path: LearningPath,
    performance: PerformanceMetrics
  ): Promise<any[]> {
    const adaptations = [];

    // Check if difficulty needs adjustment
    if (performance.averageScore < 50 && performance.strugglingAreas.length > 2) {
      adaptations.push({
        type: 'difficulty',
        reason: 'User struggling with current difficulty',
        action: 'decrease',
        previousValue: path.currentLevel,
        newValue: Math.max(1, path.currentLevel - 1),
        expectedImpact: 'Improved comprehension and confidence'
      });
    } else if (performance.averageScore > 90 && performance.completionRate > 0.9) {
      adaptations.push({
        type: 'difficulty',
        reason: 'User mastering content too easily',
        action: 'increase',
        previousValue: path.currentLevel,
        newValue: Math.min(10, path.currentLevel + 1),
        expectedImpact: 'Increased challenge and engagement'
      });
    }

    // Check if pace needs adjustment
    if (performance.learningVelocity < 0.5) {
      adaptations.push({
        type: 'pace',
        reason: 'Slow progress detected',
        action: 'slow_down',
        previousValue: 'current pace',
        newValue: 'reduced pace with more practice',
        expectedImpact: 'Better retention and reduced frustration'
      });
    }

    // Check if content style needs adjustment
    if (performance.retentionRate < 0.6) {
      adaptations.push({
        type: 'style',
        reason: 'Low retention rate',
        action: 'vary_content',
        previousValue: 'current mix',
        newValue: 'increased variety and repetition',
        expectedImpact: 'Improved long-term retention'
      });
    }

    return adaptations;
  }

  private adaptDifficulty(path: LearningPath, adaptation: any) {
    const currentModuleIndex = path.modules.findIndex(m => !m.completed);
    if (currentModuleIndex === -1) return;

    // Adjust current and future modules
    for (let i = currentModuleIndex; i < path.modules.length; i++) {
      const module = path.modules[i];
      
      if (adaptation.action === 'decrease') {
        // Simplify content
        module.difficulty = module.difficulty === 'advanced' ? 'intermediate' : 'beginner';
        // Add more examples and explanations
        module.content.push({
          type: 'text',
          content: 'Additional examples and simplified explanations',
          duration: 10,
          resources: ['Beginner-friendly guide']
        });
      } else if (adaptation.action === 'increase') {
        // Add challenge
        module.difficulty = module.difficulty === 'beginner' ? 'intermediate' : 'advanced';
        // Add advanced exercises
        module.content.push({
          type: 'exercise',
          content: 'Advanced challenge: Apply concepts in complex scenarios',
          duration: 20,
          resources: ['Challenge problems']
        });
      }
    }

    path.currentLevel = adaptation.newValue;
  }

  private adaptPace(path: LearningPath, adaptation: any) {
    if (adaptation.action === 'slow_down') {
      // Add review modules
      const currentModuleIndex = path.modules.findIndex(m => !m.completed);
      if (currentModuleIndex > 0) {
        const reviewModule: LearningModule = {
          id: `module_review_${Date.now()}`,
          title: 'Review and Consolidation',
          description: 'Review key concepts from previous modules',
          difficulty: 'beginner',
          estimatedTime: 30,
          prerequisites: [],
          content: [{
            type: 'reflection',
            content: 'Review and reflect on what you\'ve learned so far',
            duration: 30,
            resources: ['Review guide', 'Key concepts summary']
          }],
          assessments: [],
          completed: false
        };

        path.modules.splice(currentModuleIndex, 0, reviewModule);
      }
    } else if (adaptation.action === 'speed_up') {
      // Combine related modules
      // This would require more complex logic to merge modules
    }
  }

  private async adaptContent(path: LearningPath, adaptation: any) {
    if (adaptation.action === 'vary_content') {
      const currentModule = path.modules.find(m => !m.completed);
      if (!currentModule) return;

      // Add varied content types
      const newContent: ModuleContent[] = [
        {
          type: 'video',
          content: 'Alternative explanation through visual demonstration',
          duration: 15,
          resources: ['Video tutorial']
        },
        {
          type: 'practice',
          content: 'Hands-on practice with immediate feedback',
          duration: 20,
          resources: ['Interactive exercise']
        }
      ];

      currentModule.content.push(...newContent);
    }
  }

  private adaptStyle(path: LearningPath, adaptation: any) {
    // Adjust content delivery style
    const currentModule = path.modules.find(m => !m.completed);
    if (!currentModule) return;

    if (adaptation.action === 'vary_content') {
      // Reorder content to match learning preference
      currentModule.content.sort((a, b) => {
        const preferenceOrder = ['practice', 'exercise', 'video', 'text', 'reflection'];
        return preferenceOrder.indexOf(a.type) - preferenceOrder.indexOf(b.type);
      });
    }
  }

  async trackLearningProgress(
    userId: string,
    pathId: string,
    moduleId: string,
    progress: {
      completed: boolean;
      score?: number;
      timeSpent: number;
      struggledWith?: string[];
    }
  ): Promise<void> {
    const userPaths = this.learningPaths.get(userId) || [];
    const path = userPaths.find(p => p.id === pathId);

    if (!path) return;

    const module = path.modules.find(m => m.id === moduleId);
    if (!module) return;

    // Update module progress
    module.completed = progress.completed;
    if (progress.score !== undefined) {
      module.score = progress.score;
    }

    // Update overall path progress
    const completedModules = path.modules.filter((m: any) => m.completed).length;
    path.progress = (completedModules / path.modules.length) * 100;

    // Track performance metrics
    await this.updatePerformanceMetrics(userId, pathId, progress);

    // Check if adaptation is needed
    const _performance = await this.calculateCurrentPerformance(userId, pathId);
    if (this.shouldAdapt(performance)) {
      await this.adaptLearningPath(userId, pathId, performance);
    }

    // Store updated path
    this.storeLearningPath(userId, path);
  }

  private async updatePerformanceMetrics(
    userId: string,
    pathId: string,
    progress: any
  ): Promise<void> {
    const history = this.performanceHistory.get(userId) || [];
    
    // Get or create current metrics
    let currentMetrics = history[history.length - 1] || {
      completionRate: 0,
      averageScore: 0,
      timeSpent: 0,
      strugglingAreas: [],
      strongAreas: [],
      learningVelocity: 0,
      retentionRate: 0
    };

    // Update metrics
    if (progress.completed) {
      currentMetrics.completionRate = 
        (currentMetrics.completionRate * history.length + 1) / (history.length + 1);
    }

    if (progress.score !== undefined) {
      currentMetrics.averageScore = 
        (currentMetrics.averageScore * history.length + progress.score) / (history.length + 1);
    }

    currentMetrics.timeSpent += progress.timeSpent;

    if (progress.struggledWith) {
      currentMetrics.strugglingAreas.push(...progress.struggledWith);
    }

    // Store updated metrics
    history.push(currentMetrics);
    this.performanceHistory.set(userId, history);
  }

  private async calculateCurrentPerformance(
    userId: string,
    pathId: string
  ): Promise<PerformanceMetrics> {
    const history = this.performanceHistory.get(userId) || [];
    if (history.length === 0) {
      return {
        completionRate: 0,
        averageScore: 0,
        timeSpent: 0,
        strugglingAreas: [],
        strongAreas: [],
        learningVelocity: 0,
        retentionRate: 0
      };
    }

    // Calculate aggregated metrics
    const recentMetrics = history.slice(-5); // Last 5 entries
    
    return {
      completionRate: recentMetrics.reduce((sum, m) => sum + m.completionRate, 0) / recentMetrics.length,
      averageScore: recentMetrics.reduce((sum, m) => sum + m.averageScore, 0) / recentMetrics.length,
      timeSpent: recentMetrics.reduce((sum, m) => sum + m.timeSpent, 0),
      strugglingAreas: [...new Set(recentMetrics.flatMap(m => m.strugglingAreas))],
      strongAreas: [...new Set(recentMetrics.flatMap(m => m.strongAreas))],
      learningVelocity: this.calculateVelocity(recentMetrics),
      retentionRate: this.calculateRetention(history)
    };
  }

  private calculateVelocity(metrics: PerformanceMetrics[]): number {
    if (metrics.length < 2) return 0.5;

    const progressRates = [];
    for (let i = 1; i < metrics.length; i++) {
      const rate = metrics[i].completionRate - metrics[i-1].completionRate;
      progressRates.push(rate);
    }

    return Math.max(0, Math.min(1, 
      progressRates.reduce((sum, r) => sum + r, 0) / progressRates.length + 0.5
    ));
  }

  private calculateRetention(history: PerformanceMetrics[]): number {
    if (history.length < 3) return 0.7;

    // Check score consistency over time
    const scores = history.map(h => h.averageScore);
    const recentScores = scores.slice(-3);
    const olderScores = scores.slice(-6, -3);

    if (olderScores.length === 0) return 0.7;

    const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length;

    // If recent scores are close to or better than older scores, retention is good
    const retention = recentAvg / Math.max(1, olderAvg);
    return Math.max(0, Math.min(1, retention));
  }

  private shouldAdapt(performance: PerformanceMetrics): boolean {
    // Adapt if struggling
    if (performance.averageScore < 50) return true;
    if (performance.strugglingAreas.length > 3) return true;
    if (performance.learningVelocity < 0.3) return true;
    if (performance.retentionRate < 0.5) return true;

    // Adapt if too easy
    if (performance.averageScore > 95 && performance.completionRate > 0.95) return true;

    return false;
  }

  private storeLearningPath(userId: string, path: LearningPath) {
    const userPaths = this.learningPaths.get(userId) || [];
    const index = userPaths.findIndex(p => p.id === path.id);
    
    if (index >= 0) {
      userPaths[index] = path;
    } else {
      userPaths.push(path);
    }

    this.learningPaths.set(userId, userPaths);
  }

  private async getHistoricalPerformance(userId: string): Promise<PerformanceMetrics[]> {
    return this.performanceHistory.get(userId) || [];
  }

  private async assessCurrentCapabilities(userId: string): Promise<string[]> {
    // This would analyze user's completed goals, tasks, and assessments
    // For now, return placeholder capabilities
    return ['basic goal setting', 'habit tracking', 'self-reflection'];
  }

  private determineOptimalDifficulty(
    performance: PerformanceMetrics[],
    profile: UserProfile
  ): string {
    if (performance.length === 0) return 'beginner';

    const avgScore = performance.reduce((sum, p) => sum + p.averageScore, 0) / performance.length;
    
    if (avgScore < 60) return 'beginner';
    if (avgScore > 85) return 'advanced';
    return 'intermediate';
  }

  private calculateOptimalSessionLength(
    profile: UserProfile,
    performance: PerformanceMetrics[]
  ): number {
    const baseLength = profile?.coachingPreferences.sessionDuration || 30;
    
    if (performance.length > 0) {
      const avgTimeSpent = performance.reduce((sum, p) => sum + p.timeSpent, 0) / performance.length;
      // Adjust based on actual engagement
      if (avgTimeSpent > baseLength * 1.5) return baseLength + 15;
      if (avgTimeSpent < baseLength * 0.5) return Math.max(15, baseLength - 10);
    }

    return baseLength;
  }

  private identifyBestLearningTimes(profile: UserProfile): string[] {
    return profile?.coachingPreferences.preferredTimes || ['morning', 'evening'];
  }

  private determinePathType(goal: Goal): 'skill' | 'habit' | 'knowledge' | 'wellness' {
    const category = goal.category?.toLowerCase() || '';
    
    if (category.includes('skill') || category.includes('learn')) return 'skill';
    if (category.includes('habit') || category.includes('routine')) return 'habit';
    if (category.includes('knowledge') || category.includes('study')) return 'knowledge';
    if (category.includes('health') || category.includes('wellness')) return 'wellness';
    
    return 'skill'; // default
  }

  private estimatePathDuration(modules: LearningModule[]): number {
    const totalMinutes = modules.reduce((sum, m) => sum + m.estimatedTime, 0);
    const hoursPerDay = 1; // Assume 1 hour per day
    return Math.ceil(totalMinutes / (hoursPerDay * 60));
  }

  private adjustDurationForPace(
    baseDuration: number,
    pace: 'slow' | 'moderate' | 'fast'
  ): number {
    switch (pace) {
      case 'slow':
        return Math.round(baseDuration * 1.5);
      case 'fast':
        return Math.round(baseDuration * 0.7);
      default:
        return baseDuration;
    }
  }

  private adjustModulesForTimeConstraints(
    modules: LearningModule[],
    timeAvailable: number
  ): LearningModule[] {
    return modules.map(module => {
      if (module.estimatedTime > timeAvailable) {
        // Split module into smaller chunks
        module.estimatedTime = timeAvailable;
        module.content = module.content.slice(0, Math.ceil(module.content.length * 0.7));
      }
      return module;
    });
  }

  private optimizeDifficultyProgression(
    modules: LearningModule[],
    preferredDifficulty: string
  ): LearningModule[] {
    // Ensure smooth difficulty progression
    let currentDifficulty = 'beginner';
    
    return modules.map((module, index) => {
      if (index === 0) {
        module.difficulty = 'beginner';
      } else if (index === modules.length - 1) {
        module.difficulty = preferredDifficulty as any;
      } else {
        // Gradual progression
        if (currentDifficulty === 'beginner' && index > modules.length / 3) {
          currentDifficulty = 'intermediate';
        } else if (currentDifficulty === 'intermediate' && index > 2 * modules.length / 3) {
          currentDifficulty = preferredDifficulty;
        }
        module.difficulty = currentDifficulty as any;
      }
      
      return module;
    });
  }

  private getDefaultPathStructure(goal: Goal): any {
    return {
      modules: [
        {
          title: 'Introduction and Foundation',
          objective: 'Understand the basics',
          key_concepts: ['Core principles', 'Key terminology'],
          difficulty_level: 'beginner',
          estimated_hours: 1,
          prerequisites: [],
          content_types: ['text', 'video', 'reflection']
        },
        {
          title: 'Building Skills',
          objective: 'Develop practical abilities',
          key_concepts: ['Skill application', 'Practice techniques'],
          difficulty_level: 'intermediate',
          estimated_hours: 2,
          prerequisites: [0],
          content_types: ['exercise', 'practice', 'video']
        },
        {
          title: 'Advanced Application',
          objective: 'Master advanced concepts',
          key_concepts: ['Complex scenarios', 'Problem solving'],
          difficulty_level: 'advanced',
          estimated_hours: 2,
          prerequisites: [1],
          content_types: ['exercise', 'practice', 'reflection']
        }
      ]
    };
  }

  async getLearningPaths(userId: string): Promise<LearningPath[]> {
    return this.learningPaths.get(userId) || [];
  }

  async getRecommendedNextModule(
    userId: string,
    pathId: string
  ): Promise<LearningModule | null> {
    const paths = this.learningPaths.get(userId) || [];
    const path = paths.find(p => p.id === pathId);
    
    if (!path) return null;

    // Find next incomplete module
    const nextModule = path.modules.find(m => !m.completed);
    
    if (!nextModule) return null;

    // Check prerequisites
    const prereqsMet = nextModule.prerequisites.every(prereqIndex => 
      path.modules[prereqIndex]?.completed
    );

    if (!prereqsMet) {
      // Find prerequisite module
      for (const prereqIndex of nextModule.prerequisites) {
        if (!path.modules[prereqIndex]?.completed) {
          return path.modules[prereqIndex];
        }
      }
    }

    return nextModule;
  }
}

export const adaptiveLearning = new AdaptiveLearning();