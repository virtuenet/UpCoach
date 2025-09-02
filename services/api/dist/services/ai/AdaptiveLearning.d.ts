export interface LearningPath {
    id: string;
    userId: string;
    pathType: 'skill' | 'habit' | 'knowledge' | 'wellness';
    title: string;
    description: string;
    currentLevel: number;
    targetLevel: number;
    modules: LearningModule[];
    estimatedDuration: number;
    adaptations: PathAdaptation[];
    progress: number;
}
export interface LearningModule {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
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
export declare class AdaptiveLearning {
    private learningPaths;
    private performanceHistory;
    constructor();
    createPersonalizedLearningPath(userId: string, goalId: string, options?: {
        preferredPace?: 'slow' | 'moderate' | 'fast';
        timeAvailable?: number;
        focusAreas?: string[];
    }): Promise<LearningPath>;
    private analyzeUserLearningProfile;
    private calculateLearningStyle;
    private generateBaseLearningPath;
    private generatePathStructureWithAI;
    private createLearningModules;
    private generateModuleContent;
    private determineContentMix;
    private createContentPiece;
    private createModuleAssessments;
    private generateQuizQuestions;
    private adaptPathToUser;
    adaptLearningPath(userId: string, pathId: string, performance: PerformanceMetrics): Promise<LearningPath>;
    private determineAdaptations;
    private adaptDifficulty;
    private adaptPace;
    private adaptContent;
    private adaptStyle;
    trackLearningProgress(userId: string, pathId: string, moduleId: string, progress: {
        completed: boolean;
        score?: number;
        timeSpent: number;
        struggledWith?: string[];
    }): Promise<void>;
    private updatePerformanceMetrics;
    private calculateCurrentPerformance;
    private calculateVelocity;
    private calculateRetention;
    private shouldAdapt;
    private storeLearningPath;
    private getHistoricalPerformance;
    private assessCurrentCapabilities;
    private determineOptimalDifficulty;
    private calculateOptimalSessionLength;
    private identifyBestLearningTimes;
    private determinePathType;
    private estimatePathDuration;
    private adjustDurationForPace;
    private adjustModulesForTimeConstraints;
    private optimizeDifficultyProgression;
    private getDefaultPathStructure;
    getLearningPaths(userId: string): Promise<LearningPath[]>;
    getRecommendedNextModule(userId: string, pathId: string): Promise<LearningModule | null>;
}
export declare const adaptiveLearning: AdaptiveLearning;
//# sourceMappingURL=AdaptiveLearning.d.ts.map