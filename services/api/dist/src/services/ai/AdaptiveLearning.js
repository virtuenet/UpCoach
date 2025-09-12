"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptiveLearning = exports.AdaptiveLearning = void 0;
const Goal_1 = require("../../models/Goal");
const UserProfile_1 = require("../../models/UserProfile");
const logger_1 = require("../../utils/logger");
const AIService_1 = require("./AIService");
class AdaptiveLearning {
    learningPaths;
    performanceHistory;
    constructor() {
        this.learningPaths = new Map();
        this.performanceHistory = new Map();
    }
    async createPersonalizedLearningPath(userId, goalId, options) {
        try {
            const [profile, goal] = await Promise.all([
                UserProfile_1.UserProfile.findOne({ where: { userId } }),
                Goal_1.Goal.findByPk(goalId),
            ]);
            if (!profile || !goal) {
                throw new Error('User profile or goal not found');
            }
            const learningAnalysis = await this.analyzeUserLearningProfile(userId, profile);
            const basePath = await this.generateBaseLearningPath(goal, learningAnalysis);
            const adaptedPath = await this.adaptPathToUser(basePath, profile, learningAnalysis, options);
            this.storeLearningPath(userId, adaptedPath);
            return adaptedPath;
        }
        catch (error) {
            logger_1.logger.error('Error creating personalized learning path:', error);
            throw error;
        }
    }
    async analyzeUserLearningProfile(userId, profile) {
        const performance = await this.getHistoricalPerformance(userId);
        const learningStyle = this.calculateLearningStyle(profile, performance);
        const capabilities = await this.assessCurrentCapabilities(userId);
        const difficulty = this.determineOptimalDifficulty(performance, profile);
        const sessionLength = this.calculateOptimalSessionLength(profile, performance);
        const bestTimes = this.identifyBestLearningTimes(profile);
        return {
            learningStyle,
            currentCapabilities: capabilities,
            preferredDifficulty: difficulty,
            optimalSessionLength: sessionLength,
            bestLearningTimes: bestTimes,
        };
    }
    calculateLearningStyle(profile, _performance) {
        const baseStyle = {
            visual: 0.25,
            auditory: 0.25,
            kinesthetic: 0.25,
            reading: 0.25,
        };
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
        const total = Object.values(baseStyle).reduce((sum, val) => sum + val, 0);
        Object.keys(baseStyle).forEach(key => {
            baseStyle[key] = baseStyle[key] / total;
        });
        return baseStyle;
    }
    async generateBaseLearningPath(goal, learningAnalysis) {
        const pathStructure = await this.generatePathStructureWithAI(goal, learningAnalysis);
        const modules = await this.createLearningModules(pathStructure, learningAnalysis.learningStyle, learningAnalysis.preferredDifficulty);
        const learningPath = {
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
            progress: 0,
        };
        return learningPath;
    }
    async generatePathStructureWithAI(goal, learningAnalysis) {
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
            const response = await AIService_1.aiService.generateResponse([
                {
                    role: 'system',
                    content: 'You are an expert instructional designer. Create comprehensive, well-structured learning paths. Always respond with valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ], {
                temperature: 0.6,
                maxTokens: 1500,
            });
            return JSON.parse(response.content);
        }
        catch (error) {
            logger_1.logger.error('Error generating path structure with AI:', error);
            return this.getDefaultPathStructure(goal);
        }
    }
    async createLearningModules(pathStructure, learningStyle, preferredDifficulty) {
        const modules = [];
        for (const moduleData of pathStructure.modules) {
            const content = await this.generateModuleContent(moduleData, learningStyle);
            const assessments = this.createModuleAssessments(moduleData, preferredDifficulty);
            const module = {
                id: `module_${modules.length + 1}`,
                title: moduleData.title,
                description: moduleData.objective,
                difficulty: moduleData.difficulty_level || preferredDifficulty,
                estimatedTime: (moduleData.estimated_hours || 1) * 60,
                prerequisites: moduleData.prerequisites || [],
                content,
                assessments,
                completed: false,
            };
            modules.push(module);
        }
        return modules;
    }
    async generateModuleContent(moduleData, learningStyle) {
        const content = [];
        const contentTypes = moduleData.content_types || ['text', 'exercise', 'reflection'];
        const contentMix = this.determineContentMix(learningStyle, contentTypes);
        for (const [type, weight] of Object.entries(contentMix)) {
            if (weight > 0.1) {
                const moduleContent = await this.createContentPiece(type, moduleData, weight);
                content.push(moduleContent);
            }
        }
        return content;
    }
    determineContentMix(learningStyle, availableTypes) {
        const mix = {};
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
        mix.reflection = (mix.reflection || 0) + 0.1;
        Object.keys(mix).forEach(type => {
            if (!availableTypes.includes(type)) {
                delete mix[type];
            }
        });
        const total = Object.values(mix).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            Object.keys(mix).forEach(key => {
                mix[key] = mix[key] / total;
            });
        }
        return mix;
    }
    async createContentPiece(type, moduleData, weight) {
        const duration = Math.round(moduleData.estimated_hours * 60 * weight);
        const contentTemplates = {
            text: {
                content: `Read about ${moduleData.title}: Key concepts include ${moduleData.key_concepts?.join(', ') || 'core principles'}`,
                resources: ['Article link', 'PDF guide'],
            },
            video: {
                content: `Watch: "${moduleData.title} Explained" - Visual guide to ${moduleData.objective}`,
                resources: ['Video tutorial', 'Supplementary animations'],
            },
            exercise: {
                content: `Practice Exercise: Apply ${moduleData.title} concepts in a hands-on activity`,
                resources: ['Exercise worksheet', 'Solution guide'],
            },
            reflection: {
                content: `Reflection: How does ${moduleData.title} apply to your personal goals? Journal your thoughts.`,
                resources: ['Reflection prompts', 'Journal template'],
            },
            practice: {
                content: `Real-world Practice: Implement ${moduleData.title} in your daily routine`,
                resources: ['Practice checklist', 'Progress tracker'],
            },
        };
        return {
            type,
            content: contentTemplates[type].content,
            duration,
            resources: contentTemplates[type].resources,
        };
    }
    createModuleAssessments(moduleData, preferredDifficulty) {
        const assessments = [];
        assessments.push({
            id: `assess_knowledge_${Date.now()}`,
            type: 'quiz',
            questions: this.generateQuizQuestions(moduleData, preferredDifficulty),
            passingScore: 70,
            attempts: 0,
        });
        if (moduleData.difficulty_level !== 'beginner') {
            assessments.push({
                id: `assess_practical_${Date.now()}`,
                type: 'practical',
                questions: [
                    {
                        task: `Apply ${moduleData.title} concepts to solve a real problem`,
                        rubric: ['Understanding', 'Application', 'Innovation'],
                    },
                ],
                passingScore: 60,
                attempts: 0,
            });
        }
        return assessments;
    }
    generateQuizQuestions(moduleData, difficulty) {
        const questionCount = difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : 7;
        const questions = [];
        for (let i = 0; i < questionCount; i++) {
            questions.push({
                question: `Question ${i + 1} about ${moduleData.title}`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 0,
                explanation: 'Explanation of the correct answer',
            });
        }
        return questions;
    }
    async adaptPathToUser(basePath, _profile, learningAnalysis, options) {
        const adaptedPath = { ...basePath };
        if (options?.preferredPace) {
            adaptedPath.estimatedDuration = this.adjustDurationForPace(basePath.estimatedDuration, options.preferredPace);
        }
        if (options?.timeAvailable) {
            adaptedPath.modules = this.adjustModulesForTimeConstraints(basePath.modules, options.timeAvailable);
        }
        adaptedPath.modules = this.optimizeDifficultyProgression(adaptedPath.modules, learningAnalysis.preferredDifficulty);
        adaptedPath.adaptations.push({
            timestamp: new Date(),
            adaptationType: 'style',
            reason: 'Personalized based on user profile',
            previousValue: 'base path',
            newValue: 'adapted path',
            impact: 'Optimized for user learning style and constraints',
        });
        return adaptedPath;
    }
    async adaptLearningPath(userId, pathId, performance) {
        const userPaths = this.learningPaths.get(userId) || [];
        const path = userPaths.find(p => p.id === pathId);
        if (!path) {
            throw new Error('Learning path not found');
        }
        const adaptations = await this.determineAdaptations(path, performance);
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
            path.adaptations.push({
                timestamp: new Date(),
                adaptationType: adaptation.type,
                reason: adaptation.reason,
                previousValue: adaptation.previousValue,
                newValue: adaptation.newValue,
                impact: adaptation.expectedImpact,
            });
        }
        this.storeLearningPath(userId, path);
        return path;
    }
    async determineAdaptations(path, performance) {
        const adaptations = [];
        if (performance.averageScore < 50 && performance.strugglingAreas.length > 2) {
            adaptations.push({
                type: 'difficulty',
                reason: 'User struggling with current difficulty',
                action: 'decrease',
                previousValue: path.currentLevel,
                newValue: Math.max(1, path.currentLevel - 1),
                expectedImpact: 'Improved comprehension and confidence',
            });
        }
        else if (performance.averageScore > 90 && performance.completionRate > 0.9) {
            adaptations.push({
                type: 'difficulty',
                reason: 'User mastering content too easily',
                action: 'increase',
                previousValue: path.currentLevel,
                newValue: Math.min(10, path.currentLevel + 1),
                expectedImpact: 'Increased challenge and engagement',
            });
        }
        if (performance.learningVelocity < 0.5) {
            adaptations.push({
                type: 'pace',
                reason: 'Slow progress detected',
                action: 'slow_down',
                previousValue: 'current pace',
                newValue: 'reduced pace with more practice',
                expectedImpact: 'Better retention and reduced frustration',
            });
        }
        if (performance.retentionRate < 0.6) {
            adaptations.push({
                type: 'style',
                reason: 'Low retention rate',
                action: 'vary_content',
                previousValue: 'current mix',
                newValue: 'increased variety and repetition',
                expectedImpact: 'Improved long-term retention',
            });
        }
        return adaptations;
    }
    adaptDifficulty(path, adaptation) {
        const currentModuleIndex = path.modules.findIndex(m => !m.completed);
        if (currentModuleIndex === -1)
            return;
        for (let i = currentModuleIndex; i < path.modules.length; i++) {
            const module = path.modules[i];
            if (adaptation.action === 'decrease') {
                module.difficulty = module.difficulty === 'advanced' ? 'intermediate' : 'beginner';
                module.content.push({
                    type: 'text',
                    content: 'Additional examples and simplified explanations',
                    duration: 10,
                    resources: ['Beginner-friendly guide'],
                });
            }
            else if (adaptation.action === 'increase') {
                module.difficulty = module.difficulty === 'beginner' ? 'intermediate' : 'advanced';
                module.content.push({
                    type: 'exercise',
                    content: 'Advanced challenge: Apply concepts in complex scenarios',
                    duration: 20,
                    resources: ['Challenge problems'],
                });
            }
        }
        path.currentLevel = adaptation.newValue;
    }
    adaptPace(path, adaptation) {
        if (adaptation.action === 'slow_down') {
            const currentModuleIndex = path.modules.findIndex(m => !m.completed);
            if (currentModuleIndex > 0) {
                const reviewModule = {
                    id: `module_review_${Date.now()}`,
                    title: 'Review and Consolidation',
                    description: 'Review key concepts from previous modules',
                    difficulty: 'beginner',
                    estimatedTime: 30,
                    prerequisites: [],
                    content: [
                        {
                            type: 'reflection',
                            content: "Review and reflect on what you've learned so far",
                            duration: 30,
                            resources: ['Review guide', 'Key concepts summary'],
                        },
                    ],
                    assessments: [],
                    completed: false,
                };
                path.modules.splice(currentModuleIndex, 0, reviewModule);
            }
        }
        else if (adaptation.action === 'speed_up') {
        }
    }
    async adaptContent(path, adaptation) {
        if (adaptation.action === 'vary_content') {
            const currentModule = path.modules.find(m => !m.completed);
            if (!currentModule)
                return;
            const newContent = [
                {
                    type: 'video',
                    content: 'Alternative explanation through visual demonstration',
                    duration: 15,
                    resources: ['Video tutorial'],
                },
                {
                    type: 'practice',
                    content: 'Hands-on practice with immediate feedback',
                    duration: 20,
                    resources: ['Interactive exercise'],
                },
            ];
            currentModule.content.push(...newContent);
        }
    }
    adaptStyle(path, adaptation) {
        const currentModule = path.modules.find(m => !m.completed);
        if (!currentModule)
            return;
        if (adaptation.action === 'vary_content') {
            currentModule.content.sort((a, b) => {
                const preferenceOrder = ['practice', 'exercise', 'video', 'text', 'reflection'];
                return preferenceOrder.indexOf(a.type) - preferenceOrder.indexOf(b.type);
            });
        }
    }
    async trackLearningProgress(userId, pathId, moduleId, progress) {
        const userPaths = this.learningPaths.get(userId) || [];
        const path = userPaths.find(p => p.id === pathId);
        if (!path)
            return;
        const module = path.modules.find(m => m.id === moduleId);
        if (!module)
            return;
        module.completed = progress.completed;
        if (progress.score !== undefined) {
            module.score = progress.score;
        }
        const completedModules = path.modules.filter((m) => m.completed).length;
        path.progress = (completedModules / path.modules.length) * 100;
        await this.updatePerformanceMetrics(userId, pathId, progress);
        const performance = await this.calculateCurrentPerformance(userId, pathId);
        if (this.shouldAdapt(performance)) {
            await this.adaptLearningPath(userId, pathId, performance);
        }
        this.storeLearningPath(userId, path);
    }
    async updatePerformanceMetrics(userId, _pathId, progress) {
        const history = this.performanceHistory.get(userId) || [];
        const currentMetrics = history[history.length - 1] || {
            completionRate: 0,
            averageScore: 0,
            timeSpent: 0,
            strugglingAreas: [],
            strongAreas: [],
            learningVelocity: 0,
            retentionRate: 0,
        };
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
        history.push(currentMetrics);
        this.performanceHistory.set(userId, history);
    }
    async calculateCurrentPerformance(userId, _pathId) {
        const history = this.performanceHistory.get(userId) || [];
        if (history.length === 0) {
            return {
                completionRate: 0,
                averageScore: 0,
                timeSpent: 0,
                strugglingAreas: [],
                strongAreas: [],
                learningVelocity: 0,
                retentionRate: 0,
            };
        }
        const recentMetrics = history.slice(-5);
        return {
            completionRate: recentMetrics.reduce((sum, m) => sum + m.completionRate, 0) / recentMetrics.length,
            averageScore: recentMetrics.reduce((sum, m) => sum + m.averageScore, 0) / recentMetrics.length,
            timeSpent: recentMetrics.reduce((sum, m) => sum + m.timeSpent, 0),
            strugglingAreas: [...new Set(recentMetrics.flatMap(m => m.strugglingAreas))],
            strongAreas: [...new Set(recentMetrics.flatMap(m => m.strongAreas))],
            learningVelocity: this.calculateVelocity(recentMetrics),
            retentionRate: this.calculateRetention(history),
        };
    }
    calculateVelocity(metrics) {
        if (metrics.length < 2)
            return 0.5;
        const progressRates = [];
        for (let i = 1; i < metrics.length; i++) {
            const rate = metrics[i].completionRate - metrics[i - 1].completionRate;
            progressRates.push(rate);
        }
        return Math.max(0, Math.min(1, progressRates.reduce((sum, r) => sum + r, 0) / progressRates.length + 0.5));
    }
    calculateRetention(history) {
        if (history.length < 3)
            return 0.7;
        const scores = history.map(h => h.averageScore);
        const recentScores = scores.slice(-3);
        const olderScores = scores.slice(-6, -3);
        if (olderScores.length === 0)
            return 0.7;
        const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length;
        const retention = recentAvg / Math.max(1, olderAvg);
        return Math.max(0, Math.min(1, retention));
    }
    shouldAdapt(performance) {
        if (performance.averageScore < 50)
            return true;
        if (performance.strugglingAreas.length > 3)
            return true;
        if (performance.learningVelocity < 0.3)
            return true;
        if (performance.retentionRate < 0.5)
            return true;
        if (performance.averageScore > 95 && performance.completionRate > 0.95)
            return true;
        return false;
    }
    storeLearningPath(userId, path) {
        const userPaths = this.learningPaths.get(userId) || [];
        const index = userPaths.findIndex(p => p.id === path.id);
        if (index >= 0) {
            userPaths[index] = path;
        }
        else {
            userPaths.push(path);
        }
        this.learningPaths.set(userId, userPaths);
    }
    async getHistoricalPerformance(userId) {
        return this.performanceHistory.get(userId) || [];
    }
    async assessCurrentCapabilities(_userId) {
        return ['basic goal setting', 'habit tracking', 'self-reflection'];
    }
    determineOptimalDifficulty(performance, _profile) {
        if (performance.length === 0)
            return 'beginner';
        const avgScore = performance.reduce((sum, p) => sum + p.averageScore, 0) / performance.length;
        if (avgScore < 60)
            return 'beginner';
        if (avgScore > 85)
            return 'advanced';
        return 'intermediate';
    }
    calculateOptimalSessionLength(profile, performance) {
        const baseLength = profile?.coachingPreferences?.sessionDuration || 30;
        if (performance.length > 0) {
            const avgTimeSpent = performance.reduce((sum, p) => sum + p.timeSpent, 0) / performance.length;
            if (avgTimeSpent > baseLength * 1.5)
                return baseLength + 15;
            if (avgTimeSpent < baseLength * 0.5)
                return Math.max(15, baseLength - 10);
        }
        return baseLength;
    }
    identifyBestLearningTimes(profile) {
        return profile?.coachingPreferences?.preferredTimes || ['morning', 'evening'];
    }
    determinePathType(goal) {
        const category = goal.category?.toLowerCase() || '';
        if (category.includes('skill') || category.includes('learn'))
            return 'skill';
        if (category.includes('habit') || category.includes('routine'))
            return 'habit';
        if (category.includes('knowledge') || category.includes('study'))
            return 'knowledge';
        if (category.includes('health') || category.includes('wellness'))
            return 'wellness';
        return 'skill';
    }
    estimatePathDuration(modules) {
        const totalMinutes = modules.reduce((sum, m) => sum + m.estimatedTime, 0);
        const hoursPerDay = 1;
        return Math.ceil(totalMinutes / (hoursPerDay * 60));
    }
    adjustDurationForPace(baseDuration, pace) {
        switch (pace) {
            case 'slow':
                return Math.round(baseDuration * 1.5);
            case 'fast':
                return Math.round(baseDuration * 0.7);
            default:
                return baseDuration;
        }
    }
    adjustModulesForTimeConstraints(modules, timeAvailable) {
        return modules.map(module => {
            if (module.estimatedTime > timeAvailable) {
                module.estimatedTime = timeAvailable;
                module.content = module.content.slice(0, Math.ceil(module.content.length * 0.7));
            }
            return module;
        });
    }
    optimizeDifficultyProgression(modules, preferredDifficulty) {
        let currentDifficulty = 'beginner';
        return modules.map((module, index) => {
            if (index === 0) {
                module.difficulty = 'beginner';
            }
            else if (index === modules.length - 1) {
                module.difficulty = preferredDifficulty;
            }
            else {
                if (currentDifficulty === 'beginner' && index > modules.length / 3) {
                    currentDifficulty = 'intermediate';
                }
                else if (currentDifficulty === 'intermediate' && index > (2 * modules.length) / 3) {
                    currentDifficulty = preferredDifficulty;
                }
                module.difficulty = currentDifficulty;
            }
            return module;
        });
    }
    getDefaultPathStructure(_goal) {
        return {
            modules: [
                {
                    title: 'Introduction and Foundation',
                    objective: 'Understand the basics',
                    key_concepts: ['Core principles', 'Key terminology'],
                    difficulty_level: 'beginner',
                    estimated_hours: 1,
                    prerequisites: [],
                    content_types: ['text', 'video', 'reflection'],
                },
                {
                    title: 'Building Skills',
                    objective: 'Develop practical abilities',
                    key_concepts: ['Skill application', 'Practice techniques'],
                    difficulty_level: 'intermediate',
                    estimated_hours: 2,
                    prerequisites: [0],
                    content_types: ['exercise', 'practice', 'video'],
                },
                {
                    title: 'Advanced Application',
                    objective: 'Master advanced concepts',
                    key_concepts: ['Complex scenarios', 'Problem solving'],
                    difficulty_level: 'advanced',
                    estimated_hours: 2,
                    prerequisites: [1],
                    content_types: ['exercise', 'practice', 'reflection'],
                },
            ],
        };
    }
    async getLearningPaths(userId) {
        return this.learningPaths.get(userId) || [];
    }
    async getRecommendedNextModule(userId, pathId) {
        const paths = this.learningPaths.get(userId) || [];
        const path = paths.find(p => p.id === pathId);
        if (!path)
            return null;
        const nextModule = path.modules.find(m => !m.completed);
        if (!nextModule)
            return null;
        const prereqsMet = nextModule.prerequisites.every((prereqIndex) => path.modules[prereqIndex]?.completed);
        if (!prereqsMet) {
            for (const prereqIndex of nextModule.prerequisites) {
                if (!path.modules[prereqIndex]?.completed) {
                    return path.modules[prereqIndex];
                }
            }
        }
        return nextModule;
    }
}
exports.AdaptiveLearning = AdaptiveLearning;
exports.adaptiveLearning = new AdaptiveLearning();
//# sourceMappingURL=AdaptiveLearning.js.map