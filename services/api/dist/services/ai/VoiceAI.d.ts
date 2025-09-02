export interface VoiceAnalysis {
    transcript: string;
    sentiment: {
        overall: 'positive' | 'neutral' | 'negative';
        score: number;
        emotions: {
            joy: number;
            sadness: number;
            anger: number;
            fear: number;
            surprise: number;
            trust: number;
        };
    };
    speechPatterns: {
        pace: 'slow' | 'normal' | 'fast';
        volume: 'soft' | 'normal' | 'loud';
        tone: 'monotone' | 'varied' | 'expressive';
        fillerWords: number;
        pauseDuration: number;
        speechRate: number;
    };
    linguisticAnalysis: {
        complexity: 'simple' | 'moderate' | 'complex';
        vocabulary: {
            uniqueWords: number;
            totalWords: number;
            sophistication: number;
        };
        sentenceStructure: {
            avgLength: number;
            complexity: number;
        };
    };
    insights: VoiceInsight[];
}
export interface VoiceInsight {
    type: 'emotional' | 'behavioral' | 'linguistic' | 'health';
    insight: string;
    confidence: number;
    recommendations?: string[];
}
export interface VoiceSession {
    id: string;
    userId: string;
    timestamp: Date;
    duration: number;
    audioUrl?: string;
    transcript: string;
    analysis: VoiceAnalysis;
    coachingResponse?: string;
    actionItems?: string[];
}
export interface VoicePattern {
    pattern: string;
    frequency: number;
    examples: string[];
    significance: string;
    recommendations: string[];
}
export declare class VoiceAI {
    private openai;
    private voiceSessions;
    constructor();
    transcribeAudio(audioBuffer: Buffer, format?: 'mp3' | 'wav' | 'm4a'): Promise<string>;
    analyzeVoice(userId: string, audioBuffer: Buffer, options?: {
        sessionType?: 'reflection' | 'goal_setting' | 'check_in' | 'journal';
        previousContext?: any;
    }): Promise<VoiceAnalysis>;
    private analyzeSentiment;
    private analyzeSpeechPatterns;
    private analyzeTone;
    private analyzeLinguistics;
    private generateVoiceInsights;
    private analyzeVoicePatterns;
    private findCommonPhrases;
    private isCommonPhrase;
    private analyzeEmotionalTrend;
    private storeVoiceSession;
    private updateMoodFromVoice;
    generateVoiceCoaching(userId: string, voiceAnalysis: VoiceAnalysis, options?: {
        style?: 'supportive' | 'motivational' | 'analytical';
        focusArea?: string;
    }): Promise<{
        response: string;
        actionItems: string[];
        followUpQuestions: string[];
    }>;
    private buildVoiceCoachingPrompt;
    private extractKeyThemes;
    private parseCoachingResponse;
    getVoiceInsightSummary(userId: string, days?: number): Promise<{
        summary: string;
        trends: Array<{
            metric: string;
            trend: 'improving' | 'stable' | 'declining';
            detail: string;
        }>;
        recommendations: string[];
        stats: {
            totalSessions: number;
            avgSentiment: number;
            dominantEmotion: string;
            avgSpeechRate: number;
            vocabularyGrowth: number;
        };
    }>;
    private analyzeVoiceTrends;
    private generateInsightSummary;
    private generateVoiceRecommendations;
    private calculateVocabularyGrowth;
    compareVoiceSessions(userId: string, sessionId1: string, sessionId2: string): Promise<{
        comparison: {
            sentiment: {
                change: number;
                interpretation: string;
            };
            speechRate: {
                change: number;
                interpretation: string;
            };
            vocabulary: {
                change: number;
                interpretation: string;
            };
            emotions: {
                [key: string]: number;
            };
        };
        insights: string[];
        recommendations: string[];
    }>;
    private generateComparisonInsights;
    private generateComparisonRecommendations;
}
export declare const voiceAI: VoiceAI;
//# sourceMappingURL=VoiceAI.d.ts.map